# Diseño: Resolver Auditoría 03-07-2026 (Fase Seguridad)

## Enfoque Técnico

Se agrega defensa HTTP en capas sobre la estructura MVC existente sin modificar la lógica de negocio. Cada componente de seguridad (Helmet, CSRF, PII, SRI, safeLog) se implementa como middleware autocontenido o helper, con feature flags (`SECURITY_HELMET_ENABLED`, `SECURITY_CSRF_ENABLED`) para hot-disable en producción. La sesión se implementa con signed cookies (sin session store) dado que el portal es stateless actualmente.

## Decisiones de Arquitectura

| Decisión | Alternativas | Elegida | Por qué |
|----------|-------------|---------|---------|
| Biblioteca CSRF | `csurf` (deprecada, requiere session-store) vs `csrf-csrf` (double-submit cookie, sin store) | `csrf-csrf` | No requiere session-store; compatible con la arquitectura stateless actual |
| Sesión para PII | `express-session` + MemoryStore vs signed cookie | Signed cookie (`cookie-parser` con secret) | Mínima dependencia; el único dato de sesión es `contribuyente_codigo` |
| jsPDF SRI | CDN con `integrity` hash vs bundle local | Bundle local en `public/javascripts/vendor/` | Elimina dependencia de CDN; el hash SRI en CDN se rompe al actualizar jspdf |
| `safeLog()` ubicación | `middlewares/` vs `utils/` | `utils/safeLog.js` | Es función helper, no middleware Express; consistente con `utils/response.js`, `utils/constants.js` |
| CSP scripts inline | `'unsafe-inline'` + nonce vs migrar a archivos `.js` externos | `'unsafe-inline'` transitorio con nonce en ticket a futuro | Las vistas EJS tienen inline scripts en múltiples templates; migrar todo es scope del PR #2 |

## Flujo de Datos — PII

```
POST /buscar ──→ web.controller.buscarPorDni
                    │
                    ├── Cliente encontrado → res.cookie('ccodigo', codigo, { signed: true })
                    │                        render index.ejs (sin PII inline, solo data-codigo attr)
                    │
                    └── Cliente no encontrado → render sin cookie

Page load ──→ JS cliente: fetch(`/api/contribuyente/${codigo}`)
                  │
                  GET /api/contribuyente/:codigo
                    │
                    ├── req.signedCookies.ccodigo === :codigo → 200 + JSON
                    ├── sin cookie → 401
                    └── cookie ≠ :codigo → 403

iniciarPago() usa contribuyenteData (ya cargado asíncrono) → POST /pagos/iniciar
```

## Orden de Middlewares en `app.js`

```
1. app.set('trust proxy', 1)          ← existente
2. app.disable('x-powered-by')        ← NUEVO
3. helmet(helmetConfig)               ← NUEVO (tras feature flag)
4. express.json({ limit: '100kb' })   ← MODIFICADO (agregar limit)
5. express.urlencoded({ limit: '100kb', extended: false }) ← MODIFICADO
6. sanitizeInput (global)             ← NUEVO (body('*').trim().escape())
7. express.static(...)                ← sin cambios
8. cookieParser(COOKIE_SECRET)        ← MODIFICADO (agregar secret)
9. logger (request/response)          ← sin cambios
10. csrfProtection                    ← NUEVO (excepto GET + exentos)
11. routes                            ← sin cambios
12. errorLogger / notFound / errorHandler ← sin cambios
```

## Cambios de Archivos

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `app.js` | Modificar | Helmet, CSRF, body limits, sanitizeInput global, X-Powered-By, cookie secret, feature flags |
| `middlewares/helmet.config.js` | Crear | Configuración CSP, HSTS, directivas (inline, CDN fonts, gateway API URL) |
| `middlewares/csrf.js` | Crear | Setup `csrf-csrf`, exenciones (GET, `/api/tickets/estado`, demo si flag) |
| `utils/safeLog.js` | Crear | `safeLog(obj)` — redacta DNI, email, id_operacion, importe en prod; pasa through en dev |
| `routes/api/contribuyente.routes.js` | Crear | `GET /api/contribuyente/:codigo` — validación cookie + respuesta JSON |
| `controllers/api/contribuyente.controller.js` | Crear | Lógica del endpoint: leer signed cookie, validar match, query cliente |
| `public/javascripts/vendor/jspdf.umd.min.js` | Crear | Bundle local jspdf 2.5.1 (reemplaza CDN) |
| `views/index.ejs` | Modificar | Eliminar `contribuyenteData` inline (L296-303), agregar `_csrf` en formularios, `<body data-codigo="...">`, jsPDF local, SRI en Google Fonts (`crossorigin`) |
| `public/javascripts/index.js` | Modificar | `fetch()` a `/api/contribuyente/:codigo` en `DOMContentLoaded`, cache en variable `contribuyenteData` |
| `controllers/payment.controller.js` | Modificar | L114-122: reemplazar `console.log` por `safeLog()` |
| `services/pagos.service.js` | Modificar | L269: reemplazar `console.log` por `safeLog()` |
| `services/ticketsPago.service.js` | Modificar | L117: reemplazar `console.log` de retorno por `safeLog()` (el que loguea ticket) |
| `controllers/web.controller.js` | Modificar | `buscarPorDni`: setear `res.cookie('ccodigo', cliente.Codigo, signedCookieOpts)` |
| `package.json` | Modificar | Agregar `helmet` (v8.1.0), `csrf-csrf` (v3.1.0) |

## Contratos

### `GET /api/contribuyente/:codigo`

**Request**: Cookie `ccodigo` (signed) + param `:codigo`
**Response 200**: `{ codigo, dni, nombre, apellido, email }`
**Response 401**: `{ error: "No autorizado" }` — sin cookie
**Response 403**: `{ error: "Acceso denegado" }` — cookie ≠ `:codigo`
**Response 404**: `{ error: "Contribuyente no encontrado" }`

### `safeLog(obj)` — reglas de redacción (solo en `NODE_ENV=production`)

| Campo | Regla | Ejemplo |
|-------|-------|---------|
| `dni`, `DOCUMENTO` | Últimos 4 visibles | `***5678` |
| `email`, `Email` | Primer char + `***@***` | `u***@***` |
| `id_operacion`, `NRO_OPERACION` | Últimos 4 visibles | `***4f2a` |
| `external_reference`, `externalReference` | Últimos 4 visibles | `***9ab1` |
| `importe`, `amountTotal` | `***` | `***` |
| `ticketNumber`, `ticketId` | Primeros 3 + `***` | `TCK***` |

## Estrategia de Testing

| Capa | Qué probar | Cómo |
|------|-----------|------|
| Manual — headers | Helmet presente, X-Powered-By ausente, HSTS solo en prod | `curl -I localhost:3000` |
| Manual — CSRF | POST sin token → 403; con token → 200 | `curl -X POST` con/sin header `x-csrf-token` |
| Manual — PII | HTML no contiene `contribuyenteData`, API retorna JSON | View Source + Network tab |
| Manual — logs | `safeLog()` redacta en prod | `NODE_ENV=production node -e "require('./utils/safeLog')"` |
| Manual — SRI | jsPDF carga desde local, Google Fonts sin error consola | Abrir portal y verificar Network tab |

No hay tests automatizados en este cambio (el proyecto carece de test runner funcional — se abordará en PR #3).

## Migración / Rollout

- Feature flags: `SECURITY_HELMET_ENABLED=false` o `SECURITY_CSRF_ENABLED=false` desactivan en caliente sin redeploy.
- Rollback: revertir merge de `feature/resolver-auditoria-seguridad` en `develop`.
- Sin migración de datos requerida.

## Preguntas Abiertas

- [ ] jsPDF 2.5.1 — ¿se descarga el UMD bundle y se coloca en `public/javascripts/vendor/`, o se calcula el hash SRI del CDN de cdnjs? Recomendación: bundle local (elimina dependencia externa).
- [ ] Google Fonts — SRI no es viable para CSS dinámico de Google Fonts. Alternativa: self-host los archivos `.woff2` con `@font-face` (más seguro, pero scope extra). Para este PR: mantener CDN con `crossorigin="anonymous"`.
