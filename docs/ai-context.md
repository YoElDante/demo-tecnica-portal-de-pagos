# AI Context

## Resumen ejecutivo

Portal web municipal para consulta de deudas por DNI, generación de tickets y procesamiento de pagos mediante un gateway externo. El mismo código base sirve para múltiples municipios y cada instancia se diferencia por variables de entorno y configuración pública.

## Stack

| Capa | Tecnologia |
|------|------------|
| Backend | Node.js + Express |
| Vistas | EJS |
| ORM | Sequelize |
| Base de datos | Azure SQL |
| Integración externa | Gateway de pagos con SIRO / Banco Roela |

## Arquitectura en una mirada

```text
Contribuyente
  -> Portal Web Municipal
  -> API Gateway de pagos
  -> Plataforma de pago externa
  -> webhook al portal
```

### Regla crítica

El redirect del usuario no confirma pagos. La fuente de verdad es el webhook server-to-server del gateway.

## Estado actual

| Area | Estado |
|------|--------|
| Búsqueda por DNI | ✅ |
| Visualización de deudas | ✅ |
| Generación de ticket | ✅ |
| Integración de pago | ✅ |
| Configuración multi-municipio | ✅ |
| Tracking formal de tickets | 🔲 |
| Tasa configurable end-to-end | 🔲 Parcial |
| Hardening HTTP | ✅ |
| Comprobantes por email | 🔲 |
| Frontend JS modular (ES6) | ✅ | SDD `refactor-frontend-js-modular` — `public/javascripts/modules/` |

## Reglas de dominio

- `CodMovim`: `H` deuda, `D` cobro.
- `TIPO_BIEN`: códigos como `AUAU`, `ININ`, `CICI`, `OBSA`, `CACA`, `CEM1`, `PEPE`.
- Al confirmar un pago hay que actualizar deuda y registrar cobro.
- Los tickets tienen validez operativa limitada porque los intereses cambian diariamente.
- El procesamiento debe ser idempotente por `id_operacion` o `NRO_OPERACION`.

## Variables clave

```env
MUNICIPIO=elmanzano
DB_HOST=...
DB_NAME=...
DB_USER=...
DB_PASS=...
TASA_INTERES_ANUAL=40
PAYMENT_GATEWAY=siro
API_GATEWAY_URL=https://...
FRONTEND_PUBLIC_URL=https://...
WEBHOOK_SECRET=...
```

## Riesgos actuales

- Falta una tabla o entidad formal para tickets pagados.
- La tasa de interés todavía no está cerrada de punta a punta como configuración única.
- El hardening HTTP (helmet, CSP, CSRF, PII) fue resuelto en SDD `resolver-auditoria-03072026`.
- Hay webhooks que pueden llegar después de la expiración operativa del ticket.

## Arranque rápido

```bash
npm install
npm run dev
```

Por municipio:

```bash
npm run dev:demo
npm run dev:elmanzano
npm run dev:tinoco
npm run dev:sanjose
```

## Si vas a tocar...

- Pagos: `docs/CONTRACT-PORTAL-GATEWAY.md` y `docs/INTEGRACION_PAGOS.md`. La pasarela activa hoy es SIRO del Banco Roela; MercadoPago queda archivado.
- Deuda e intereses: `docs/bd/LOGICA_DEUDAS_PAGOS.md`
- Multi-municipio: `docs/PLAN_CONFIGURACION_MULTIAMBIENTE.md` y `docs/GUIA_NUEVO_MUNICIPIO.md`
- Azure: `docs/DEPLOY_AZURE.md`
- Seguridad: `docs/architecture/seguridad.md` (capas, CSRF, CSP, PII, safeLog, feature flags)
- Frontend JS: `public/javascripts/entry.js` (entry único) + `public/javascripts/modules/` (árbol ES6: utils, deuda, ticket, pago, state)

## Próximos cambios naturales

1. `openspec/changes/ticket-payment-tracking/`
2. `openspec/changes/configurable-interest-rate/`
3. `openspec/changes/security-hardening/`
4. `openspec/changes/email-payment-receipts/`
