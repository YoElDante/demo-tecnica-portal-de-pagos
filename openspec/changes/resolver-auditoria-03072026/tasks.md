# Tareas: Resolver Auditoría 03-07-2026 (Fase Seguridad)

## Review Workload Forecast

| Campo | Valor |
|-------|-------|
| Líneas estimadas | ~550 + vendor bundle (jspdf) |
| Riesgo presupuesto 400 líneas | Alto |
| PRs encadenados recomendados | Sí |
| Split sugerido | PR 1 → PR 2 → PR 3 → PR 4 |
| Estrategia de entrega | force-chained |
| Estrategia de cadena | feature-branch-chain |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Work Units

| Unit | Objetivo | PR | Base | Notas |
|------|----------|-----|------|-------|
| 1 | HTTP Hardening (Helmet + limits + sanitize) | PR 1 | feature/tracker | ~150 líneas; independiente |
| 2 | CSRF Protection (middleware + tokens) | PR 2 | rama PR 1 | ~120 líneas; depende de PR 1 |
| 3 | PII Protection (API + frontend + jsPDF + SRI) | PR 3 | rama PR 2 | ~200 líneas + vendor; depende de PR 2 |
| 4 | Log Sanitization (safeLog + reemplazos) | PR 4 | rama PR 3 | ~80 líneas; depende de PR 3 |

## Phase 1: HTTP Hardening (PR 1)

- [ ] 1.1 `package.json`: agregar `helmet@8.1.0`, `csrf-csrf@3.1.0`, `cookie-parser` con versiones exactas (sin ^ ni ~).
- [ ] 1.2 Crear `middlewares/helmet.config.js`: CSP con `script-src: 'unsafe-inline'` + CDN fonts + gateway URL, HSTS `maxAge: 31536000` + `includeSubDomains` (solo prod), `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, `X-DNS-Prefetch-Control: off`.
- [ ] 1.3 `app.js`: agregar `app.disable('x-powered-by')`, `app.set('trust proxy', 1)`, `helmet(config)` guardado por `SECURITY_HELMET_ENABLED`, body limits `express.json({ limit: '100kb' })` y `urlencoded({ limit: '100kb' })`.
- [ ] 1.4 `app.js`: agregar middleware global `sanitizeInput` (trim + escape en `req.body.*`) antes de rutas, reutilizando lógica de `middlewares/validator.js`.
- [ ] 1.5 Verificar: `curl -I` muestra headers Helmet, sin `X-Powered-By`, POST >100KB retorna 413, input XSS escapado.

## Phase 2: CSRF Protection (PR 2)

- [ ] 2.1 Crear `middlewares/csrf.js`: setup `csrf-csrf` con double-submit cookie, exenciones para GET y `/api/tickets/estado`, feature flag `SECURITY_CSRF_ENABLED`.
- [ ] 2.2 `app.js`: agregar `cookieParser(COOKIE_SECRET)` con secret desde env, montar CSRF middleware tras body parsers y antes de rutas.
- [ ] 2.3 `views/index.ejs`: agregar `<input type="hidden" name="_csrf" value="<%= csrfToken %>">` en formularios POST (`/buscar`, `/pagos/iniciar`). Inyectar token via `res.locals` en middleware CSRF.
- [ ] 2.4 Verificar: POST sin `_csrf` → 403; POST con token → 200; GET `/api/tickets/estado` sin token → 200.

## Phase 3: PII Protection — API + Frontend + SRI (PR 3)

- [ ] 3.1 Crear `routes/api/contribuyente.routes.js` con `GET /api/contribuyente/:codigo`.
- [ ] 3.2 Crear `controllers/api/contribuyente.controller.js`: validar `req.signedCookies.ccodigo === :codigo`, retornar JSON `{ codigo, dni, nombre, apellido, email }` o 401/403/404.
- [ ] 3.3 `controllers/web.controller.js`: en `buscarPorDni`, setear `res.cookie('ccodigo', cliente.Codigo, { signed: true, httpOnly: true, sameSite: 'strict' })`.
- [ ] 3.4 `views/index.ejs`: eliminar `<script>` inline `contribuyenteData` (L296-303), agregar `<body data-codigo="<%= codigo %>">`, reemplazar CDN jsPDF por `public/javascripts/vendor/jspdf.umd.min.js`, agregar `crossorigin="anonymous"` en Google Fonts.
- [ ] 3.5 `public/javascripts/index.js`: `fetch('/api/contribuyente/' + codigo)` en `DOMContentLoaded`, asignar a variable `contribuyenteData`.
- [ ] 3.6 Descargar jsPDF 2.5.1 UMD y guardar en `public/javascripts/vendor/jspdf.umd.min.js`.
- [ ] 3.7 Verificar: View Source sin `contribuyenteData` inline; Network tab muestra fetch; jsPDF carga local; API sin cookie → 401.

## Phase 4: Log Sanitization (PR 4)

- [ ] 4.1 Crear `utils/safeLog.js`: `safeLog(obj)` redacta DNI (`***5678`), email (`u***@***`), `id_operacion` (`***4f2a`), `importe` (`***`), `ticketNumber` (`TCK***`); passthrough en `NODE_ENV=development`.
- [ ] 4.2 `controllers/payment.controller.js` L114-122: reemplazar `console.log` por `console.log(safeLog(...))`.
- [ ] 4.3 `services/pagos.service.js` L269: reemplazar `console.log` por `safeLog()`.
- [ ] 4.4 `services/ticketsPago.service.js` L117: reemplazar `console.log` por `safeLog()`.
- [ ] 4.5 Verificar: `NODE_ENV=production` redacta campos; `NODE_ENV=development` muestra datos completos.
