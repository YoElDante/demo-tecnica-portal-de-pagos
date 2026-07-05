# Propuesta: Resolver Auditoria 03-07-2026 (Fase Seguridad)

## Intencion

La auditoria `docs/auditorias/auditoria-03072026/` detecto **3 hallazgos CRITICOS** y **2 HIGH** de seguridad que dejan al portal expuesto en produccion: sin Helmet/CSP (C1), sin CSRF (C2), PII del contribuyente embebida en HTML inline (C3), PII en logs productivos (A3) y CDN sin SRI (A4). Esta propuesta cubre **unicamente la fase de seguridad** del plan de entrega encadenado (PR #1 del enfoque fase 3 de la exploracion), dejando arquitectura, frontend, infra y testing para cambios posteriores.

## Alcance

### En Alcance
- C1: Instalar `helmet`, configurar CSP/HSTS/X-Frame-Options, eliminar `X-Powered-By`, `trust proxy` para Azure LB.
- C2: Middleware CSRF (`csurf`) + token `_csrf` en formularios POST; exenciones para polling/demo.
- C3: Mover `contribuyenteData` fuera de `views/index.ejs:297-303` a endpoint API + `fetch` cliente.
- A3: Sanitizar/eliminar PII de logs en `payment.controller.js:114-122`, `pagos.service.js:269`, `ticketsPago.service.js:117`.
- A4: Agregar `integrity` (SRI) a jsPDF y Google Fonts en `views/index.ejs`, o migrar a bundles locales.
- Relacionados: aplicar `sanitizeInput` global en `app.js`, limitar body en `express.json()`/`urlencoded()`, revisar cobertura de `express-rate-limit`.

### Fuera de Alcance
- Split de `payment.controller.js` (A5), dead code (A6), scripts npm (A7).
- Tests unitarios/integracion (cambio futuro propio).
- ESLint/Prettier (M1), `npm audit` en CI (M6).
- Refactor frontend (`deudas.js`, polling, comprobante), pool DB, graceful shutdown, logs estructurados.
- Los 50 hallazgos no-seguridad restantes.

## Capacidades

### Nuevas
- `http-security-hardening`: Helmet, CSP, HSTS, headers seguros, limites de body, trust proxy, cobertura de rate-limit, sanitizeInput global, SRI en assets CDN.
- `csrf-protection`: Middleware CSRF, tokens en formularios, exenciones para endpoints polling/demo.
- `pii-protection`: Eliminacion de PII embebida en HTML (mover a API) y sanitizacion de PII en logs productivos.

### Modificadas
- Ninguna: los cambios no alteran requisitos spec-level de capabilities existentes (ticket-lifecycle, payment-gateway-contract); son cross-cutting de seguridad.

## Enfoque

1. **C1 (30 min)**: `npm install helmet` (version exacta), `app.use(helmet({...}))` con CSP permitiendo inline de vistas actuales + dominios CDN/Gateway; `app.disable('x-powered-by')`; `app.set('trust proxy', 1)`.
2. **C2 (1 h)**: `csurf` aplicado a rutas POST, token inyectado en `res.locals`, campo oculto `_csrf` en formularios EJS; exentar `/api/tickets/estado` polling y demo via `ignoreMethods`/condicion.
3. **C3 (2 h)**: Nuevo endpoint `GET /api/contribuyente/:codigo` que retorna los datos; `views/index.ejs` elimina el `<script>` inline con `contribuyenteData` y hace `fetch` cliente al cargar; proteccion por misma sesion/DNI ya validado.
4. **A3 (3 h)**: Logger helper `safeLog()` que redacta DNI/email/importe/id_operacion; reemplazar logs crudos en los 3 puntos identificados.
5. **A4 (1 h)**: Agregar `integrity="sha384-..." crossorigin="anonymous"` a tags jsPDF y Fonts; preferible migrar jsPDF a bundle local.
6. **Relacionados**: aplicar `sanitizeInput` global antes de rutas; `express.json({ limit: '100kb' })`; verificar `express-rate-limit` cubre todas las rutas.

## Areas Afectadas

| Area | Impacto | Descripcion |
|------|---------|-------------|
| `app.js` | Modified | Helmet, CSRF, trust proxy, body limits, sanitizeInput global, rate-limit review |
| `views/index.ejs` | Modified | Eliminar PII inline, agregar `_csrf`, SRI en CDN |
| `controllers/payment.controller.js` | Modified | Logs sanitizados (A3) |
| `services/pagos.service.js`, `services/ticketsPago.service.js` | Modified | Logs sanitizados (A3) |
| `routes/api.contribuyente.js` | New | Endpoint para datos del contribuyente (C3) |
| `middlewares/validator.js` | Modified | Reusar `sanitizeInput` aplicado global |
| `package.json` | Modified | Agregar `helmet`, `csurf` (versiones exactas) |

## Riesgos

| Riesgo | Probabilidad | Mitigacion |
|--------|-------------|------------|
| CSP rompe scripts inline de vistas | Alto | Permitir `'unsafe-inline'` en script-src como paso intermedio; testear vistas de pago |
| CSRF rompe polling `/api/tickets/estado` y demo | Medio | Exentar endpoints GET y polling via config de csurf |
| Endpoint nuevo de PII expone datos sin auth | Medio | Validar DNI/sesion antes de retornar; mismo flujo de validacion actual |
| SRI rompe carga de jsPDF si hash cambia | Bajo | Fijar version CDN; preferir bundle local |
| Helmet HSTS rompe(dev local) | Bajo | Aplicar HSTS solo en produccion |

## Plan de Rollback

- Cambio en rama `feature/resolver-auditoria-seguridad`; si falla, revertir commit y no mergear a `develop`.
- Helmet/CSRF tras banderas de entorno (`SECURITY_HELMET_ENABLED`, `SECURITY_CSRF_ENABLED`) para desactivar en caliente.
- Endpoint PII detras de feature flag; si falla, volver a inline temporalmente.

## Dependencias

- `helmet` (nueva, version exacta), `csurf` o alternativa (`csrf-csrf` si csurf deprecado).

## Criterios de Exito

- [ ] Headers Helmet presentes en respuesta (`X-Frame-Options`, CSP, HSTS en prod).
- [ ] Formularios POST incluyen `_csrf`; request sin token falla 403.
- [ ] `views/index.ejs` no contiene `contribuyenteData` inline.
- [ ] Logs productivos no muestran DNI/email/id_operacion en claro.
- [ ] Tags CDN con `integrity`.
- [ ] `npm run dev` y portal funcionando en demo y municipalidades.
- [ ] Sin regresiones en flujo de pago.