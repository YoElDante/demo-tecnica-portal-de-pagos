# 03 — Arquitectura y Calidad de Código

## Evaluación Arquitectónica

### Patrón: MVC + Service Layer + ORM

```
┌──────────────────────────────────────────────────┐
│  app.js (Express)                                │
│  ├── views/        (EJS templates)               │
│  ├── controllers/  (web, payment, api)           │
│  ├── services/     (lógica de negocio)           │
│  ├── models/       (Sequelize ORM)               │
│  ├── middlewares/  (rate limit, logger, etc.)    │
│  ├── config/       (DB, municipios, intereses)   │
│  └── utils/        (constants, response)         │
└──────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────┐
│  API Gateway (externo)                           │
│  ├── SIRO / Red Link                             │
│  ├── MercadoPago                                 │
│  └── (PagoTic, Macro pendientes)                 │
└──────────────────────────────────────────────────┘
```

### Lo que está bien

1. **Separación de concerns correcta.** Los controllers no acceden a modelos. Los services encapsulan lógica de negocio. Esto está bien.
2. **Configuración 12-factor.** `MUNICIPIO`, `DB_*`, `PAYMENT_GATEWAY` vienen de entorno. No hay `if (municipio === 'elmanzano')` dispersos.
3. **Modelo multi-municipio limpio.** `config/index.js` carga dinámicamente la config del municipio activo.
4. **Servicio de intereses puro.** `intereses.service.js` es el mejor archivo del proyecto: sin side effects, recibe config por parámetro, testeable.
5. **Ciclo de vida de ticket bien modelado.** `CREADO → PENDIENTE → APROBADO/RECHAZADO/EXPIRADO` con estados bien definidos.

### Lo que preocupa

1. **Sin capa de repositorio.** Los services llaman directamente a `ClientesCtaCte.findAll()`. Esto acopla la lógica de negocio al ORM.
2. **Sin inversión de dependencias.** No hay interfaces. Los services importan modelos directamente.
3. **Sin manejo de transacciones distribuido.** El pago involucra portal → gateway → SIRO, pero no hay saga pattern ni compensación.
4. **Configuración con side effects.** `config/index.js` hace `process.exit(1)` si falta `MUNICIPIO`. Esto es válido pero impide testing.

---

## Análisis de Archivos Clave

### `app.js` (72 líneas) — ✅ Bueno
- Limpio, bien organizado.
- Carga middlewares en orden correcto.
- `startTicketsMaintenance()` se invoca en el startup.
- **Falta:** helmet, CSRF, body size limit, `X-Powered-By` disable.

### `controllers/payment.controller.js` (863 líneas) — 🔴 Extralimitado
- **Problema:** 3x el tamaño máximo recomendado. Hace demasiadas cosas.
- Mezcla: iniciar pago, simulación demo, webhook, redirects, polling de estado.
- Debería dividirse en: `payment.init.controller.js`, `payment.webhook.controller.js`, `payment.redirect.controller.js`.

### `controllers/web.controller.js` (145 líneas) — ✅ Buen tamaño
- Cache de sugerencias demo simple (TTL 5 min) — bien pensado.
- El `renderIndex` devuelve estructura de datos enorme (13 campos en cada render).
- Sugiero crear un helper `buildRenderContext()` para reducir duplicación.

### `services/pagos.service.js` (585 líneas) — 🟠 Grande
- `confirmarPago` (línea 191) y `confirmarPagoGateway` (línea 341) coexisten. El primero parece legacy (usa `metadata.conceptos_ids`).
- Transacción Sequelize manual bien manejada con `rollbackSeguro`.
- **Duplicación de lógica** con `confirmarPago` (líneas 191-292) vs `confirmarPagoGateway` (341-545).

### `services/paymentGateway.service.js` (469 líneas) — ✅ Bien estructurado
- Switch por gateway con registro declarativo. Bien.
- `exchangeRedirectCode` con reintento de múltiples secrets. Buen manejo de errores.
- **Falta:** timeout configurable por gateway, circuit breaker, retry policy.

### `services/deudas.service.js` (369 líneas) — 🟠 Mejorable
- `obtenerDeudasPorCodigoODni` tiene lógica frágil de detección de formato por longitud de string.
- **Hardcodeo en línea 103:** `require('../config/municipalidad.config.elmanzano')` como fallback.
- Cache de configuración con TTL de 1 minuto — razonable.

### `services/intereses.service.js` (163 líneas) — ✅ El mejor archivo
- Puro, sin side effects, testeable.
- Documentación clara de los modos A y B.
- `parseCivilDate` es robusto contra timezone issues.
- Código comentado (líneas 148-152) para `RecIntereses` — debería ser feature flag, no comentario.

### `services/ticketsPago.service.js` (276 líneas) — ✅ Buen diseño
- Reintentos con `UniqueConstraintError` para números de ticket.
- Fallback `ticketId → ticketNumber` para edge case de BIGINT+MSSQL.
- Idempotencia en eventos del gateway.

### `middlewares/logger.js` (195 líneas) — ✅ Sorprendentemente bueno
- Custom logger con niveles, timestamps, safe stringify con WeakSet anti-circular.
- Captura de `console.*` global para unificar formato.
- **Falta:** integración con sistema de logging externo (Application Insights, Winston transport).

### `middlewares/rateLimiter.js` (134 líneas) — ✅ Robusto
- `cleanIpKeyGenerator` maneja IP:PUERTO de Azure.
- Tres niveles: apiLimiter (100/15m), strictLimiter (10/15m), lightLimiter (200/15m).
- `webhookLimiter` (120/15m) más permisivo para reintentos.

---

## Deuda Técnica

### DT1: Código Duplicado
| Duplicación | Archivos | Gravedad |
|-------------|----------|----------|
| `parseCivilDate` / `normalizarFechaCivil` | `intereses.service.js` + `deudas.service.js` | 🟡 |
| `calcularDiasMora` | `intereses.service.js` + `deudas.service.js` | 🟡 |
| Normalización de strings (`normalizarCadena`, `String(valor || '').trim()`) | `payment.controller.js` en múltiples funciones | 🟢 |
| Construcción de URLs de gateway | `paymentGateway.service.js` (repetida en createSiroPayment y createMercadoPagoPayment) | 🟡 |

### DT2: Código Muerto
- `routes/users.js` — 9 líneas, placeholder, sin uso real.
- `confirmarPago()` en `pagos.service.js` (línea 191) — no es llamado desde ningún controller visible.
- Bloque comentado `RecIntereses` (líneas 148-152 intereses.service.js).
- `checkPaymentStatus` en `paymentGateway.service.js` (línea 347) — `TODO: Implementar`.
- `createPagoTicPayment` y `createMacroPayment` — solo lanzan error "no implementado".

### DT3: Archivos Enormes
| Archivo | Líneas | Límite recomendado | Exceso |
|---------|--------|--------------------|--------|
| `controllers/payment.controller.js` | 863 | 300 | +188% |
| `public/javascripts/deudas.js` | 730 | 400 | +82% |
| `services/pagos.service.js` | 585 | 400 | +46% |
| `services/paymentGateway.service.js` | 469 | 400 | +17% |
| `views/pago/comprobante.ejs` | 483 | 300 | +61% |

### DT4: Sin Testing
- **0% de coverage** en services de negocio críticos:
  - `intereses.service.js` — sin tests unitarios (aunque es el más testeable)
  - `pagos.service.js` — confirmarPagoGateway sin tests
  - `ticketsPago.service.js` — sin tests de creación/actualización
  - `gatewayToken.service.js` — sin tests de sign/verify
- Solo existe `tests/intereses/engine.test.js` — no verificado si corre.
- `tests/connection.db.test.js` — solo verifica `Sequelize.authenticate()`.

---

## Evaluación del Modelo de Datos

### Sequelize Models (23 modelos)

**Bien:**
- Asociaciones bien definidas en `model.index.js`
- Uso de `timestamps: false` donde aplica (tablas legacy sin columnas de timestamp)
- `freezeTableName: true` para evitar pluralización automática

**Mal:**
- `DatosGenerales` no tiene PK — Sequelize `findOne()` falla silenciosamente (bug ya documentado en Engram)
- Varios modelos no tienen asociaciones definidas que probablemente existen en BD
- `Numeracion.js` — 21 líneas, modelo mínimo sin documentación de propósito
- `Medidores.js` — 31 líneas, sin asociación clara con AguaServicios o AguaClientes

### Tablas de Ticket (bien modeladas)
- `TicketsPago` con `ticketNumber` único, `externalReference`, `status`, fechas UTC
- `TicketPagoEventos` con `idempotencyKey` para evitar duplicados
- Política de retención documentada: 45 días para no aprobados, permanente para aprobados

---

## Dependencias

### Producción (13 dependencias)

| Paquete | Versión | Estado | Nota |
|---------|---------|--------|------|
| express | 4.21.2 | ✅ Actual | Parche de seguridad aplicado |
| sequelize | 6.37.7 | ✅ Actual | Última versión 6.x |
| tedious | 18.6.1 | ✅ Actual | Driver Azure SQL |
| axios | 1.13.2 | ✅ Actual | |
| ejs | 3.1.10 | ✅ Actual | |
| express-rate-limit | 8.2.1 | ✅ Actual | |
| express-validator | 7.3.0 | ⚠️ Mayor disponible | 8.x ya existe |
| jsonwebtoken | 9.0.2 | ✅ Actual | |
| dotenv | 17.2.3 | ✅ Actual | |
| morgan | 1.10.1 | ⚠️ Legacy | No usado (logger propio) |
| cookie-parser | 1.4.4 | ⚠️ Legacy | |
| debug | 2.6.9 | 🔴 Obsoleto | Sin soporte activo |
| http-errors | 1.6.3 | 🔴 Obsoleto | Actual es 2.0.x |

**Observación:** `morgan` está en package.json pero no se usa en `app.js` (usa logger propio). Es peso muerto.

### Faltantes (no en package.json pero usados en código)
- **jest** — `jest.config.js` existe pero jest no está en dependencias
- **csurf** o **csrf-csrf** — no instalado, sin protección CSRF
- **helmet** — no instalado

---

## Recomendaciones de Arquitectura

### Corto Plazo
1. **Dividir `payment.controller.js`** en 3 archivos: iniciar pago, webhook, redirects.
2. **Eliminar código muerto:** `routes/users.js`, `confirmarPago` legacy, `morgan` de dependencias.
3. **Agregar ESLint + Prettier** con config estándar. Esto solo previene regresiones de estilo.

### Mediano Plazo
4. **Extraer capa de repositorio.** Los services no deberían llamar `ClientesCtaCte.findAll()` directamente.
5. **Iniciar migración a TypeScript.** Empezar por los services (la lógica de negocio), luego controllers, luego modelos.
6. **Tests unitarios para services críticos.** Prioridad: `intereses.service.js`, `pagos.service.js`, `ticketsPago.service.js`, `gatewayToken.service.js`.

### Largo Plazo
7. **Saga pattern** para flujo de pago distribuido (portal → gateway → pasarela).
8. **Event sourcing** para eventos de pago (ya tenés `TicketPagoEventos`, pero no se usa para rebuild state).
