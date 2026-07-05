# 🏥 Runbook de Operaciones — Portal de Pagos Municipal

> **Propósito**: Procedimientos operativos para diagnóstico, recuperación y mantenimiento del portal.
> **Última actualización**: 2026-07-02
> **Audiencia**: Equipo técnico y DevOps

---

## Índice

1. [Comandos útiles](#comandos-útiles)
2. [Diagnóstico: ticket vacío después del pago](#diagnóstico-ticket-vacío-después-del-pago)
3. [Verificación de conectividad BD](#verificación-de-conectividad-bd)
4. [Despliegue y rollback](#despliegue-y-rollback)
5. [Webhook — reintentos y fallos](#webhook--reintentos-y-fallos)
6. [Cambio de municipio en demo](#cambio-de-municipio-en-demo)

---

## Comandos útiles

### Desarrollo local

```bash
# Iniciar con municipio por defecto
npm run dev

# Iniciar con municipio específico
npm run dev:elmanzano
npm run dev:tinoco
npm run dev:sanjose
npm run dev:calchinoeste
npm run dev:demo

# Probar conectividad a BD
npm run testDB
```

### Git

```bash
# Ver rama actual
git branch --show-current

# Ver últimos commits
git log --oneline -10

# Descartar cambios no commiteados
git checkout -- .

# Volver al commit anterior (si ya commiteaste)
git reset --hard HEAD~1
```

### Azure

```bash
# Login
az login

# Listar App Services
az webapp list --resource-group rg-portales-municipales --query "[].name"

# Ver logs en tiempo real
az webapp log tail --name portal-elmanzano --resource-group rg-portales-municipales

# Reiniciar App Service
az webapp restart --name portal-elmanzano --resource-group rg-portales-municipales
```

---

## Diagnóstico: ticket vacío después del pago

> **Síntoma**: La página `/pagos/exitoso` muestra monto en cero y conceptos vacíos. El comprobante muestra estado "pendiente".

### Causa raíz más probable

El portal busca el ticket con `external_reference` y no lo encuentra. Si `external_reference` es NULL, el ticket se creó sin asociar la referencia del gateway.

### Paso 1 — Ver estado real de tickets en BD

```sql
SELECT TOP 10
    ticket_id,
    ticket_number,
    external_reference,
    status,
    amount_total,
    CASE
        WHEN payload_snapshot IS NULL THEN '❌ NULL'
        WHEN LEN(payload_snapshot) < 10 THEN '⚠️ VACÍO'
        ELSE '✅ TIENE DATOS (' + CAST(LEN(payload_snapshot) AS VARCHAR) + ' chars)'
    END AS snapshot_status,
    created_at_utc
FROM dbo.TicketsPago
ORDER BY ticket_id DESC;
```

| `external_reference` | `status` | Diagnóstico |
|---|---|---|
| `NULL` | `CREADO` | ❌ `actualizarConReferencia` no se ejecutó o falló |
| `DEMO-xxx` | `PENDIENTE` | ⚠️ El webhook del gateway no llegó o falló |
| `DEMO-xxx` | `APROBADO` | ✅ Todo OK — verificar otra causa |

### Paso 2 — Verificar eventos de webhook

```sql
SELECT TOP 20
    e.ticket_id,
    e.event_type,
    e.event_source,
    e.process_result,
    e.error_message,
    e.received_at_utc,
    t.external_reference,
    t.status
FROM dbo.TicketPagoEventos e
JOIN dbo.TicketsPago t ON t.ticket_id = e.ticket_id
ORDER BY e.received_at_utc DESC;
```

- Sin filas → el webhook nunca llegó al portal
- `process_result = 'APLICADO'` pero status ≠ APROBADO → bug en `actualizarEstadoDesdeGateway`
- `error_message` no nulo → llegó pero falló

### Paso 3 — Verificar configuración entre proyectos

**Portal** (`.env`):
```
GATEWAY_WEBHOOK_SECRET=<mismo que WEBHOOK_SECRET en gateway>
API_GATEWAY_URL=<URL del gateway>
PAYMENT_GATEWAY=siro
```

**Gateway** (`.env`):
```
WEBHOOK_SECRET=<mismo que GATEWAY_WEBHOOK_SECRET en portal>
SIRO_{MUNICIPIO}_BASE_URL=<URL del portal>
```

### Documentación detallada

Ver [DIAGNOSTICO_TICKET_VACIO.md](DIAGNOSTICO_TICKET_VACIO.md) para el procedimiento completo con verificación de JWT, payload_snapshot, y flujo esperado.

---

## Verificación de conectividad BD

### Local

```bash
npm run testDB
```

Debe mostrar: `✅ Conexión exitosa a la base de datos`

### Azure

1. Portal de Azure → App Service → `portal-{municipio}`
2. **Configuración** → **Configuración de la aplicación**
3. Verificar que estas variables estén presentes y correctas:
   - `DB_HOST` (formato: `servidor.database.windows.net`)
   - `DB_NAME`
   - `DB_USER`
   - `DB_PASS`
   - `DB_DIALECT` = `mssql`
   - `DB_PORT` = `1433`

### Firewall SQL

Si hay error de conexión, verificar en Azure SQL → **Redes**:
- IP del cliente agregada a reglas de firewall, O
- "Permitir servicios de Azure" habilitado

---

## Despliegue y rollback

### Deploy vía GitHub Actions

Push a `develop` o `main` dispara el workflow automáticamente. Verificar en la pestaña **Actions** del repositorio.

### Deploy manual vía Azure CLI

```bash
# Empaquetar
zip -r deploy.zip . -x "node_modules/*" ".git/*" "envs/*"

# Deploy
az webapp deployment source config-zip \
  --resource-group rg-portales-municipales \
  --name portal-{municipio} \
  --src ./deploy.zip
```

### Rollback

```bash
# Revertir último commit localmente
git revert HEAD

# O forzar deploy de un commit anterior
git checkout <commit-hash>
# ... buildear y redeploy
```

---

## Webhook — reintentos y fallos

### Estrategia de reintentos del gateway

El gateway reintenta el webhook con backoff exponencial:

| Intento | Espera |
|---------|--------|
| 1 | Inmediato |
| 2 | 30 segundos |
| 3 | 2 minutos |
| 4 | 10 minutos |
| 5 | 1 hora |

Si fallan todos, queda pendiente hasta la conciliación matutina (07:00, 10:00, 13:00 ART).

### Cómo forzar reprocesamiento manual

Si un pago aparece en SIRO pero no en el portal:

1. Verificar `external_reference` en SIRO
2. Verificar en BD del portal:
   ```sql
   SELECT * FROM dbo.TicketsPago WHERE external_reference = 'ELMANZANO-xxx';
   ```
3. Si no existe, esperar a la conciliación o contactar al equipo del gateway

---

## Cambio de municipio en demo

Para mostrar un municipio diferente en `demo.alcaldia.com.ar`:

1. En Azure App Service de **demo**, agregar/actualizar variable:
   ```
   DEMO_MUNICIPIO = {municipio}
   ```
   (el municipio ya debe estar en `municipiosDisponibles` en `config/index.js`)

2. Reiniciar el App Service

Esto carga el branding visual del municipio destino sin cambiar las credenciales de BD.

---

## Referencias

- [CONTRACT-PORTAL-GATEWAY.md](CONTRACT-PORTAL-GATEWAY.md) — Contrato de integración
- [DIAGNOSTICO_TICKET_VACIO.md](DIAGNOSTICO_TICKET_VACIO.md) — Diagnóstico detallado de tickets
- [DEPLOY_AZURE.md](DEPLOY_AZURE.md) — Guía de despliegue en Azure
- [GUIA_RAMAS.md](GUIA_RAMAS.md) — Estrategia de ramas
