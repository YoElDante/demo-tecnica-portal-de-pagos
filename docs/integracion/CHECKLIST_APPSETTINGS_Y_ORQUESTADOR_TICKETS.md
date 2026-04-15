# Checklist App Settings + Instrucciones Orquestador (Ticket Number)

## Objetivo

Dejar una guia unica para:

1. Configurar App Settings por municipio en Azure App Service.
2. Evitar drift entre portal y gateway al definir el `ticket_number`.
3. Entregar un brief claro al orquestador multi-repo (portal + gateway).

## 1) App Settings Minimas por Municipio (Portal)

Aplicar en cada App Service municipal (demo, elmanzano, tinoco, sanjosedelassalinas):

| Variable | Valor recomendado | Notas |
|---|---|---|
| `NODE_ENV` | `production` | En local puede ser `development` |
| `APP_TIMEZONE` | `America/Argentina/Cordoba` | Evita corrimiento horario en tickets y auditoria |
| `MUNICIPIO` | `demo` / `elmanzano` / `tinoco` / `sanjosedelassalinas` | Debe coincidir con la app municipal |
| `MUNICIPIO_ID` | Igual a `MUNICIPIO` | Identificador operativo |
| `DB_HOST` | valor municipal | Azure SQL host municipal |
| `DB_NAME` | valor municipal | Base por municipio |
| `DB_USER` | valor municipal | Usuario SQL |
| `DB_PASS` | valor municipal | Password SQL |
| `DB_DIALECT` | `mssql` | Fijo |
| `DB_PORT` | `1433` | Fijo |
| `PAYMENT_GATEWAY` | `siro` | Alineado con decision actual |
| `API_GATEWAY_URL` | URL gateway ambiente | Ej: `https://gateway-xxx.azurewebsites.net` |
| `FRONTEND_PUBLIC_URL` | URL portal ambiente | Ej: `https://portal-xxx.azurewebsites.net` |
| `WEBHOOK_SECRET` | secreto fuerte compartido | Debe coincidir con gateway, no versionar |
| `TASA_INTERES_ANUAL` | valor municipal | Evitar fallback silencioso |
| `TICKETS_MAINTENANCE_ENABLED` | `true` en prod | `false` en staging/dev si no corresponde correr jobs |
| `TICKETS_EXPIRE_INTERVAL_MINUTES` | `15` | Frecuencia de expiracion operativa |
| `TICKETS_PURGE_INTERVAL_HOURS` | `24` | Frecuencia de purga |
| `TICKETS_PURGE_RETENTION_DAYS` | `45` | Solo para no pagados |
| `TICKETS_PURGE_DRY_RUN` | `true` (inicio), luego `false` | Pasar a real cuando validen logs |

## 2) Reglas Operativas Acordadas

1. El ticket se persiste cuando el usuario presiona `Ir a pagar`.
2. El ticket es pagable hasta `23:59:59` del dia de emision (zona Argentina).
3. El redirect de usuario no confirma pago.
4. El webhook server-to-server es fuente de verdad.
5. Webhooks duplicados se aceptan con idempotencia (sin reproceso).
6. Tickets `APROBADO` se conservan (sin purga automatica).
7. Purga de no pagados a 45 dias corridos.

## 3) SQL y ORM Esperados

1. Correr en cada BD municipal: `docs/bd/AZURE_SQL_TICKETS_PAGO_SETUP.sql`.
2. Verificar que existan:
   - `dbo.TicketsPago`
   - `dbo.TicketPagoEventos`
   - `dbo.sp_TicketsPago_MarcarExpirados`
   - `dbo.sp_TicketsPago_PurgarNoPagados`
3. Confirmar que el portal carga modelos:
   - `models/TicketsPago.js`
   - `models/TicketPagoEventos.js`

## 4) Brief para Orquestador Multi-Repo (copiar/pegar)

```text
Contexto:
- Portal y Gateway estan en repos separados.
- El portal ya persiste tickets y ejecuta mantenimiento (expirar + purga no pagados).
- El gateway tiene BD propia y NO escribe en BD del portal.

Objetivo de esta fase:
Definir e implementar el esquema canonico de ticket_number para interoperar con SIRO y futuras pasarelas (Pago TIC, MercadoPago, ArgenPago), sin romper trazabilidad ni idempotencia.

Restricciones:
1) Mantener webhook como unica fuente de verdad para confirmar pago.
2) No depender de datos en memoria para correlacion.
3) Reutilizar external_reference/id_operacion/nro_operacion como claves operativas.
4) Preservar compatibilidad con politicas ya activas del portal:
   - vigencia operativa hasta 23:59:59
   - retencion no pagados 45 dias
   - APROBADOS sin purga automatica

Entregables requeridos:
1) Especificacion de formato ticket_number versionada.
2) Mapeo de campos portal<->gateway<->pasarela por proveedor.
3) Regla de unicidad por municipio y estrategia anti-colision.
4) Contrato de API actualizado (request/response/webhook).
5) Plan de migracion/backfill si cambia formato.
6) Casos E2E minimos: pago ok, webhook duplicado, webhook tardio, conciliacion diferida, pasarela no responde.

Criterio de aceptacion:
- Un ticket_number emitido por portal puede ser rastreado en gateway y conciliado contra pasarela.
- No hay reproceso contable ante duplicados.
- Auditoria de horario en ART (America/Argentina/Cordoba) consistente entre portal y gateway.
```

## 5) Checklist de Cierre

1. App Settings aplicadas en todos los municipios.
2. Script SQL aplicado en todas las BD municipales.
3. Portal reiniciado y runner de tickets activo en produccion.
4. `TICKETS_PURGE_DRY_RUN=true` durante etapa de observacion.
5. Logs validados y luego `TICKETS_PURGE_DRY_RUN=false`.
6. Brief enviado al orquestador multi-repo para fase de `ticket_number`.
