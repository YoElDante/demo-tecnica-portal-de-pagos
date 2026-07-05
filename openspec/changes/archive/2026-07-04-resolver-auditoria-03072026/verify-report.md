# Verify Report: resolver-auditoria-03072026 (Fase Seguridad)

- **Cambio**: `resolver-auditoria-03072026`
- **Proyecto**: demo-portal-de-pago
- **Modo**: hybrid (Engram + OpenSpec)
- **Strict TDD**: FALSE — sin test runner funcional; verificación manual + inspección de fuente + arranque de app.
- **Verificador**: sdd-verify (executor)
- **Fecha**: 2026-07-04

## Resumen del Verdict

**VERDICT: PASS WITH WARNINGS** — con 1 CRITICAL documentado (tarea 1.1 incompleta) y varias WARNING menores (desviaciones de línea y orden de middlewares). Las 3 specs están funcionalmente cubiertas por la implementación; la app arranca sin errores de sintaxis. El CRITICAL no bloquea el flujo en runtime (las dependencias se instalan), pero viola la regla del proyecto y la propia tarea 1.1.

> **Atajón**: Las dependencias `helmet` y `csrf-csrf` se declararon con `^` (caret) en `package.json`, incumpliendo la regla del proyecto (AGENTS.md #13) y la redacción de la tarea 1.1. Marcada `[x]` pero NO cumple el criterio "versiones exactas (sin ^ ni ~)". Es el único CRITICAL.

## Completeness Table

| Artefacto | Presente | Notas |
|-----------|----------|-------|
| proposal | (no leído — no exigido por el contexto) | — |
| specs (3) | Sí | http-security-hardening, csrf-protection, pii-protection |
| design | Sí | design.md con decisiones, flujo PII, orden middlewares, contratos |
| tasks | Sí | tasks.md con 21 checkb (5+4+7+5); apply-report dice "20/20" |
| apply-report | Sí | Documenta 20/20, desviaciones y `--no-verify` |

**Conteo de tareas (tasks.md)**: 21 casillas marcadas `[x]` totales (Phase 1: 5, Phase 2: 4, Phase 3: 7, Phase 4: 5). El apply-report reporta "20/20" — leve discrepancia de conteo (probablemente excluye la 4.4 que solo importó `safeLog` sin reemplazar log). No afecta el verdict.

**Tareas efectivamente completadas en código**: 20/21.
- Tarea 1.1 marcada `[x]` pero **NO cumple** el criterio de "versiones exactas" → CRITICAL (core task).

## Build / Tests / Coverage Evidence

| Comando | Resultado | Evidencia |
|---------|-----------|-----------|
| `node -e "require('./app.js')"` | **PASS** | `APP REQUIRE OK` impreso; dotenv, DB config, municipio SIRO, logger todos inicializados sin errores. Salida limpia. |
| `npm test` | N/A | No existe test runner funcional (placeholder en package.json). Spec exige verificación manual. |
| Suite automatizada | SKIPPED | Proyecto sin runner — declarado en design.md y AGENTS.md. |
| `npm run dev` | No ejecutado (require DB) | `require('./app.js')` es el sustituto equivalente para detectar errores de sintaxis/import. |

**Evidencia de runtime**: la app carga todos los módulos (`helmet`, `csrf-csrf`, `safeLog`, rutas API, controladores) sin excepciones. `startTicketsMaintenance()` se invoca sin fallar.

## Behavioral Compliance Matrix (Specs → Implementación)

### Spec 1: HTTP Security Hardening

| Escenario / Requisito | Cobertura | Estado | Evidencia |
|-----------------------|-----------|--------|-----------|
| Security Headers con Helmet en prod | `middlewares/helmet.config.js` + `app.js` L56-58 | **COMPLIANT** | helmetConfig con CSP, HSTS (maxAge 31536000 + includeSubDomains solo prod), frameguard DENY, noSniff, referrerPolicy no-referrer, dnsPrefetchControl off. Feature flag `SECURITY_HELMET_ENABLED`. |
| HSTS solo en producción | `helmet.config.js` L55-61 (hsts=false si !IS_PRODUCTION) | **COMPLIANT** | En dev `hsts: false`; en prod `maxAge: 31536000, includeSubDomains: true`. |
| CSP con `'unsafe-inline'` transitorio en script-src | `helmet.config.js` L42 | **COMPLIANT** | `scriptSrc: ["'self'", "'unsafe-inline'"]`. Cumple criterio transitorio del design. |
| Ocultar `X-Powered-By` | `app.js` L43 `app.disable('x-powered-by')` + helmet `hidePoweredBy: true` | **COMPLIANT** | Doble defensa. |
| Trust Proxy para Azure | `app.js` L40 `app.set('trust proxy', 1)` | **COMPLIANT** | |
| Body limit 100 KB | `app.js` L61-62 `express.json({ limit: '100kb' })`, `urlencoded({ limit: '100kb' })` | **COMPLIANT** | |
| Sanitización global (trim + escape) | `app.js` L77-80 `body('*').trim().escape()` global | **COMPLIANT** | Manejador de errores en L65-75. |
| Rate Limiting coberturas | (preexistente) `middlewares/rateLimiter.js` aplicado en `app.js` L99 | **COMPLIANT (preexistente)** | No modificado por este cambio; fuera de scope pero mencionado en spec. Aceptado. |
| SRI en assets CDN | `views/index.ejs` L10-12 `crossorigin="anonymous"` en Google Fonts | **PARTIAL** | Se aplicó `crossorigin` a fonts. **No se aplicó `integrity="sha384-..."`** — el design optó por mantener CDN de Google Fonts sin SRI (CSS dinámico no soporta SRI estable). jsPDF pasó a bundle local, eliminando el CDN. Documentado en design "Preguntas Abiertas". WARNING — desviación de la spec aceptada por diseño. |

### Spec 2: CSRF Protection

| Escenario / Requisito | Cobertura | Estado | Evidencia |
|-----------------------|-----------|--------|-----------|
| Middleware CSRF en POST/PUT/DELETE/PATCH | `middlewares/csrf.js` con `csrf-csrf` double-submit; `app.js` L85 | **COMPLIANT** | Usa `csrf-csrf` (NO `csurf` deprecada) — fidelidad al design ✓. Feature flag `SECURITY_CSRF_ENABLED`. |
| POST sin token → 403 | `csrf.js` L107-124 `validateRequest` + 403 JSON | **COMPLIANT** | |
| POST con token válido → 200 | `csrf.js` L108-115 | **COMPLIANT** | |
| Token único por sesión | `csrf-csrf` double-submit con `size: 64` y secret por cookie | **COMPLIANT** | |
| Token CSRF en formularios EJS (`/buscar`) | `views/index.ejs` L104 `<input type="hidden" name="_csrf" value="<%= csrfToken %>">` | **COMPLIANT** | Token inyectado via `res.locals.csrfToken` en `csrf.js` L93. |
| Token CSRF en "formulario" `/pagos/iniciar` | **NO es formulario EJS** — es `fetch()` con header `CSRF-Token` (`index.js` L192) | **COMPLIANT (vía header)** | Spec escenario asume form HTML, pero la implementación usa fetch+header (alternativa válida según specRequirement "Token CSRF en requests AJAX/fetch"). Funcionalmente cubierto. |
| Exención polling `GET /api/tickets/estado` | `csrf.js` L32 `EXEMPT_PATHS = ['/api/tickets/estado']` + L31 `EXEMPT_METHODS` | **COMPLIANT** | |
| Exención endpoints demo en dev | `csrf.js` L28-29, L34, L80-82 `SECURITY_CSRF_DEMO_EXEMPT` + `DEMO_PATHS_PREFIXES` | **COMPLIANT** | |
| Fetch con header `CSRF-Token` | `csrf.js` L57-58 prioriza `x-csrf-token`; `index.js` L14, L192 envía `'CSRF-Token'` | **PARTIAL** | El middleware lee `req.headers['x-csrf-token']` (lowercase) y el cliente envía `'CSRF-Token'`. Express lowercases headers, así que coinciden. **COMPLIANT** en runtime. |

### Spec 3: PII Protection

| Escenario / Requisito | Cobertura | Estado | Evidencia |
|-----------------------|-----------|--------|-----------|
| PII no embebida en HTML inline | `views/index.ejs` L28 `<body data-codigo="...">` (solo el código, no DNI/nombre/email) | **COMPLIANT** | `grep contribuyenteData` en `views/index.ejs` no encuentra bloque inline. Datos via fetch. |
| Datos obtenidos via API fetch | `public/javascripts/index.js` L12-19 `fetch('/api/contribuyente/:codigo')` en `DOMContentLoaded` | **COMPLIANT** | Caché en `contribuyenteData` (L63). |
| Endpoint protegido: sesión válida → 200 | `controllers/api/contribuyente.controller.js` L33-45 retorna JSON `{codigo, dni, nombre, apellido, email}` | **COMPLIANT** | |
| Endpoint: sin cookie → 401 | `contribuyente.controller.js` L25-27 | **COMPLIANT** | |
| Endpoint: cookie ≠ :codigo → 403 | `contribuyente.controller.js` L29-31 | **COMPLIANT** | |
| Endpoint: no encontrado → 404 | `contribuyente.controller.js` L35-37 | **COMPLIANT** | Cumple contrato del design. |
| Signed cookie seteada en `buscarPorDni` | `controllers/web.controller.js` L113-119 `res.cookie('ccodigo', cliente.Codigo, { signed, httpOnly, sameSite:'strict', secure:prod, maxAge:1h })` | **COMPLIANT** | `cookieParser(COOKIE_SECRET)` en app.js L31/L82. |
| jsPDF local (sin CDN) | `public/javascripts/vendor/jspdf.umd.min.js` existe; `views/index.ejs` L21 `<script src="/javascripts/vendor/jspdf.umd.min.js" defer>` | **COMPLIANT** | |
| Google Fonts con `crossorigin` | `views/index.ejs` L10-12 | **COMPLIANT** | (sin `integrity` — ver WARNING SRI arriba). |
| Sanitización PII en logs de producción | `utils/safeLog.js` redacta DNI, email, id_operacion, external_reference, importe, ticketNumber | **COMPLIANT** | Passthrough en dev (L124-126). |
| `safeLog` en log de redirect-exchange | `payment.controller.js` L115 `console.log(..., safeLog({...}))` | **COMPLIANT** | Import en L17. |
| `safeLog` en log creación de ticket | `payment.controller.js` L333 `console.log('🎫 Ticket creado en BD:', safeLog({ticketNumber, ticketId}))` | **COMPLIANT** | |
| `safeLog` en log deuda pagada | `services/pagos.service.js` L270 `console.log(..., safeLog({...}))` | **COMPLIANT** | Import en L12. |
| `safeLog` en ticketsPago.service L117 | Solo import (L24), sin reemplazo de log | **WARNING** | Design pedía reemplazar log en L117; el archivo no contiene log en esa línea (apply-report documenta desviación). Import queda para uso futuro. |
| Logs dev con datos completos | `safeLog.js` L124-126 passthrough | **COMPLIANT** | |
| `safeLog` preserva estructura | `safeLog.js` `sanitizar()` recorre objeto recursivamente, solo aplica reglas a campos matching | **COMPLIANT** | Maneja arrays, fechas, referencias circulares. |

## Correctness Table (Tareas → Implementación)

| Tarea | Marcada | Real | Proof |
|-------|---------|------|-------|
| 1.1 deps exactas | [x] | **NO** | `package.json` L42 `"csrf-csrf": "^3.1.0"`, L49 `"helmet": "^8.1.0"` — **carets presentes**, viola "sin ^ ni ~" → **CRITICAL** |
| 1.2 helmet.config.js | [x] | Sí | Archivo creado, CSP+HSTS+frameguard+referrerPolicy+dnsPrefetch |
| 1.3 app.js trust proxy/x-powered-by/helmet flag/body limits | [x] | Sí | app.js L40,43,56-58,61-62 |
| 1.4 sanitizeInput global | [x] | Sí | app.js L65-80 |
| 1.5 verificación manual headers | [x] | Manual | No ejecutable aquí; documentada en apply-report |
| 2.1 csrf.js double-submit + exenciones + flag | [x] | Sí | middlewares/csrf.js completo |
| 2.2 cookieParser(secret) + CSRF tras body parsers | [x] | Sí | app.js L82, L85 |
| 2.3 `_csrf` en formularios POST | [x] | Parcial | Solo `/buscar` (L104). `/pagos/iniciar` vía fetch+header (alternativa spec-compliant). |
| 2.4 verificación manual CSRF | [x] | Manual | No ejecutable aquí |
| 3.1 routes/api/contribuyente.routes.js | [x] | Sí | Creado, montado en routes/api/index.js L88 |
| 3.2 controller con 401/403/404 | [x] | Sí | contribuyente.controller.js L25-37 |
| 3.3 web.controller setea signed cookie | [x] | Sí | web.controller.js L113-119 |
| 3.4 index.ejs sin PII inline, data-codigo, jsPDF local, crossorigin fonts | [x] | Sí | views/index.ejs L10-12, L21, L28 |
| 3.5 index.js fetch /api/contribuyente | [x] | Sí | public/javascripts/index.js L12-19 |
| 3.6 vendor/jspdf.umd.min.js | [x] | Sí | Glob confirma existe el archivo |
| 3.7 verificación manual PII | [x] | Manual | — |
| 4.1 utils/safeLog.js | [x] | Sí | Creado con 6 reglas de redacción |
| 4.2 payment.controller.js safeLog | [x] | Sí | L17 import, L115 + L333 uso. (Design decía L114-122; real L115) |
| 4.3 pagos.service.js safeLog | [x] | Sí | L12 import, L270 uso. (Design decía L269; real L270 — off-by-one trivial) |
| 4.4 ticketsPago.service.js safeLog | [x] | Parcial | Solo import L24, sin log reemplazado (desviación documentada) → WARNING |
| 4.5 verificación manual safeLog | [x] | Manual | — |

## Design Coherence Table

| Decisión de diseño | Implementación | Estado |
|--------------------|----------------|--------|
| Biblioteca CSRF = `csrf-csrf` (no `csurf`) | `middlewares/csrf.js` L17 `require('csrf-csrf')` | **COMPLIANT** |
| Sesión PII via signed cookie (no express-session) | `controllers/web.controller.js` L113 + `contribuyente.controller.js` L23 | **COMPLIANT** |
| jsPDF bundle local (no CDN) | `public/javascripts/vendor/jspdf.umd.min.js` | **COMPLIANT** |
| `safeLog` en `utils/` (no en middlewares/) | `utils/safeLog.js` | **COMPLIANT** |
| CSP `'unsafe-inline'` transitorio | `helmet.config.js` L42 | **COMPLIANT** |
| Feature flags `SECURITY_HELMET_ENABLED` / `SECURITY_CSRF_ENABLED` | app.js L33, csrf.js L25-26 | **COMPLIANT** |
| Nombre cookie CSRF = `__Host-csrf-token` (design implícito) | Se usó `csrf-token` (sin `__Host-`) | **DEVIATION** (documentada en apply-report) — WARNING: el prefijo `__Host-` requiere `Secure=true`+`Path=/`, incompatible con dev sin HTTPS. Justificada. |
| **Orden de middlewares en app.js** | Real difiere levemente del design | **DEVIATION** (menor) |
| Contrato `GET /api/contribuyente/:codigo` 200/401/403/404 | controller implementa los 4 | **COMPLIANT** |
| Reglas `safeLog` (6 campos) | safeLog.js implementa las 6 + extras | **COMPLIANT** |

### Detalle desviación de orden de middlewares

Design proponía:
```
helmet → json/urlencoded → sanitize → static → cookieParser → logger → csrf → routes
```

Real (`app.js`):
```
helmet → json/urlencoded → sanitize → cookieParser → csrf → static → logger → routes
```

Diferencias:
1. `cookieParser` se monta **antes** de `static` (design lo ponía después). Inocuo — `cookieParser` debe preceder a `csrf`, lo cual se cumple.
2. `csrfProtection` se monta **antes** de `static`. Como GET/HEAD/OPTIONS están exentos, los assets estáticos (GET) pasan sin impacto. Solo un POST a un asset estático sería rechazado — caso raro.
3. `logger` se monta **después** de `csrf` y `static` (design lo ponía antes de `csrf`). Inocuo — los logs de request CSRF-rechazados no se registrarán con el logger personalizado, peroHelmet/logger propio de Express los captura.

**Ninguna desviación rompe una spec** — todas son WARNING.

## Issues

### CRITICAL

1. **C-1: Dependencias con caret en `package.json`** — `package.json` L42 `"csrf-csrf": "^3.1.0"` y L49 `"helmet": "^8.1.0"` usan `^`, violando AGENTS.md #13 ("Las dependencias npm se declaran con version exacta (sin `^` ni `~`)") y la redacción explícita de la tarea 1.1 ("versiones exactas sin ^ ni ~"). La tarea está marcada `[x]` pero NO cumple su propio criterio. **Acción**: cambiar a `"csrf-csrf": "3.1.0"` y `"helmet": "8.1.0"` (sin caret) y regenerar `package-lock.json` si cambia la resolución.

### WARNING

1. **W-1: SRI ausente en Google Fonts** — spec HTTP exige `integrity` en assets CDN. El design optó por no aplicar SRI a Google Fonts (CSS dinámico no admite SRI estable) y en su lugar se aplicó `crossorigin="anonymous"`. Desviación de spec aceptada por diseño, pero sigue siendo una advertencia. **Mitigación futura**: self-host de los `.woff2` (design lo deja como follow-up).

2. **W-2: Tarea 2.3 `/pagos/iniciar` no es formulario EJS** — spec CSRF escenario "Formulario de inicio de pago incluye token" asume un form HTML. La implementación usa `fetch()` con header `CSRF-Token` (`index.js` L192). Funcionalmente equivalente (spec lo permite en el Requirement "Token CSRF en requests AJAX/fetch"); la redacción del escenario es imprecisa. Sin impacto funcional.

3. **W-3: Tarea 4.4 `ticketsPago.service.js` sin log reemplazado** — design pedía reemplazar un `console.log` en L117; el archivo no contiene log en esa línea. El apply-report lo documenta. Solo se importó `safeLog` (L24) para uso futuro. **Acción opcional**: identificar el log real de ticket en `payment.controller.js` (L333, ya cubierto por W de 4.2) y considerar desmarcar 4.4 o reescribirla como "importar safeLog para futuros logs".

4. **W-4: Nombre de cookie CSRF sin prefijo `__Host-`** — se usó `csrf-token` (L46) en lugar de `__Host-csrf-token`. Justificado: el prefijo `__Host-` exige `Secure=true`+`Path=/` y rompería dev sin HTTPS. La cookie mantiene `sameSite=strict`, `httpOnly`, `secure=production`. Documentada en apply-report.

5. **W-5: Orden de middlewares en `app.js` difiere del design** — cookieParser antes de static, csrf antes de static, logger después de csrf. Inocuo en runtime (ninguna spec se rompe). Ver detalle arriba.

6. **W-6: Off-by-one en líneas de log** — design citaba L114-122/L269/L117; real es L115/L270/sin-log. Trivial, sin impacto.

### SUGGESTION

1. **S-1**: El `apiLimiter` se aplica solo a `/api` (`app.js` L99), no a `/buscar` ni `/pagos/iniciar` (rutas web). La spec HTTP menciona rate limiting en endpoints públicos `/buscar` y `/pagos/iniciar`. Verificar si otro rate limiter cubre las rutas web; si no, se trata de cobertura parcial de la spec. **No bloqueante** — preexistente, fuera de scope del cambio.

2. **S-2**: `helmetConfig` se calcula en módulo `helmet.config.js` con `IS_PRODUCTION` cacheado al iniciar. Si `NODE_ENV` cambia en caliente (no aplica), no se recalcularía. Aceptable.

3. **S-3**: `safeLog` solo redacta claves por nombre; un campo `dni` anidado bajo alias (`"doc"`) no se redacta. Considere ampliar regex si nuevos logs usan alias.

## Final Verdict

**PASS WITH WARNINGS**

- 19 de 21 tareas implementadas correctamente en código; 1 manual-only (verificación runtime) y 1 CRITICAL (tarea 1.1 carets).
- 3 specs funcionalmente cubiertas (con WARNING W-1 SRI y W-2 forma de CSRF en `/pagos/iniciar`).
- Design fiel en decisiones de architectura (`csrf-csrf`, signed cookie, jsPDF local, `utils/safeLog`, feature flags). Desviaciones de orden de middlewares inocuas.
- App arranca sin errores (`require('./app.js')` OK).
- Sin test runner → conformidad de escenarios basada en inspección de fuente + arranque (permitido por config del proyecto: "no runner funcional").

**Bloqueante para archive**: el CRITICAL C-1 (carets en package.json) debe corregirse antes del archive, porque la propia tarea 1.1 lo exige y AGENTS.md #13 es policy del proyecto.

**Next recommended routing**: tras corregir C-1, `sdd-document-code`.

---

> Generado por sdd-verify | 2026-07-04 | Modo hybrid