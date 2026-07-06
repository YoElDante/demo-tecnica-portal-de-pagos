# Seguridad del Portal — Implementación

> Documento para humanos: qué medidas de seguridad tiene el portal, cómo funcionan, y cómo configurarlas.
> Última implementación: SDD `resolver-auditoria-03072026` (jul 2026), sobre hallazgos de `docs/auditorias/auditoria-03072026/`.

---

## Arquitectura de defensa

El portal aplica seguridad en capas, en este orden dentro de `app.js`:

```
1. trust proxy       → Confía en headers de Azure Load Balancer (X-Forwarded-For)
2. X-Powered-By off  → Oculta la tecnología del servidor
3. Helmet            → Headers HTTP de seguridad (CSP, HSTS, X-Frame-Options, etc.)
4. Body limits       → 100kb máximo en JSON y URL-encoded (previene ataques de memoria)
5. Sanitización      → Trim + HTML-escape recursivo en body y query strings
6. Static files      → Archivos públicos (CSS, JS, imágenes)
7. Cookie parser     → Parsea cookies firmadas con COOKIE_SECRET
8. Logger            → Request/response logging (nivel configurable)
9. CSRF              → Double-submit cookie en POST (excepto GET, HEAD, OPTIONS)
10. Rate limiter     → Límites por IP en rutas API (webhook, etc.)
11. Rutas            → Controladores y lógica de negocio
12. Error handlers   → 404, errores genéricos
```

---

## Capa 1: Helmet (headers HTTP)

**Archivo**: `middlewares/helmet.config.js`

Helmet agrega headers de seguridad a todas las respuestas HTTP:

| Header | Valor | Efecto |
|--------|-------|--------|
| `Content-Security-Policy` | `default-src 'self'; script-src 'self' 'unsafe-inline'; ...` | Bloquea scripts/recursos de orígenes no confiables |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Fuerza HTTPS (solo en producción) |
| `X-Frame-Options` | `DENY` | Previene clickjacking |
| `X-Content-Type-Options` | `nosniff` | Evita MIME sniffing |
| `Referrer-Policy` | `no-referrer` | No envía el Referer a otros sitios |
| `X-DNS-Prefetch-Control` | `off` | Desactiva prefetch DNS |
| `Cross-Origin-Opener-Policy` | `same-origin` | Aísla el contexto de navegación |
| `Cross-Origin-Resource-Policy` | `cross-origin` | Permite recursos cross-origin (necesario para gateway) |

**CSP — Política de contenido**:

```
default-src  'self'
script-src   'self' 'unsafe-inline'        ← transitional, se migrará a nonce en PR futuro
style-src    'self' 'unsafe-inline' fonts.googleapis.com
font-src     'self' fonts.gstatic.com
img-src      'self' data: blob: https:
connect-src  'self' {API_GATEWAY_URL}      ← permite llamadas al gateway de pagos
frame-ancestors 'none'
base-uri     'self'
form-action  'self'
```

**Feature flag**: `SECURITY_HELMET_ENABLED` (por defecto: `true` en producción, `false` en desarrollo).

---

## Capa 2: CSRF (Cross-Site Request Forgery)

**Archivo**: `middlewares/csrf.js`  
**Librería**: `csrf-csrf@3.1.0` (double-submit cookie)  
**ADR**: `docs/architecture/adr.md#adr-008`

### Cómo funciona

1. El servidor genera un token CSRF único por request.
2. El token se envía al cliente de dos formas:
   - **Cookie** `csrf-token` (httpOnly, sameSite strict)
   - **Template** EJS — campo oculto `<input type="hidden" name="_csrf" value="<%= csrfToken %>">`
3. El cliente lo devuelve en cada POST:
   - **Form EJS**: como campo `_csrf` en el body
   - **fetch() JS**: como header `CSRF-Token` (lee el valor del input oculto vía `getCsrfToken()`)
4. El servidor compara cookie vs token recibido. Si no coinciden → 403.

### Rutas exentas

- Todos los métodos `GET`, `HEAD`, `OPTIONS`
- `/api/tickets/estado` (polling de estado de pago)
- Rutas `/demo/*` en desarrollo (si `SECURITY_CSRF_DEMO_EXEMPT=true`)

### Feature flag

`SECURITY_CSRF_ENABLED` — por defecto `true` en producción, `false` en desarrollo.

---

## Capa 3: Protección PII

**ADR**: `docs/architecture/adr.md#adr-009`

### Problema resuelto

Antes, los datos personales del contribuyente (`codigo`, `DNI`, `nombre`, `apellido`, `email`) se renderizaban en un `<script>` inline dentro del HTML. Cualquiera que viera el source de la página podía leerlos.

### Solución: API protegida con signed cookies

```
POST /buscar  →  web.controller.buscarPorDni
                    │
                    ├── Cliente encontrado
                    │   └── res.cookie('ccodigo', codigo, { signed: true, httpOnly: true })
                    │       render index.ejs (sin PII inline, solo data-codigo en <body>)
                    │
                    └── Cliente no encontrado → render sin cookie

Page load  →  JS cliente: fetch('/api/contribuyente/' + codigo)
                  │
                  GET /api/contribuyente/:codigo
                    │
                    ├── req.signedCookies.ccodigo === :codigo → 200 + JSON
                    ├── sin cookie → 401
                    └── cookie ≠ :codigo → 403
```

**Archivos**:
- `controllers/web.controller.js` — setea la cookie firmada al buscar por DNI
- `controllers/api/contribuyente.controller.js` — valida cookie y retorna datos
- `routes/api/contribuyente.routes.js` — `GET /api/contribuyente/:codigo`
- `views/index.ejs` — sin PII inline, `<body data-codigo="<%= codigo %>">`
- `public/javascripts/entry.js` — entry modular único; `public/javascripts/modules/state/contribuyente.js` — fetch asíncrono al endpoint en DOMContentLoaded

### Modo degradado (sin COOKIE_SECRET)

Si `COOKIE_SECRET` no está configurado (ej: desarrollo local), se usa fallback inline: los datos se renderizan directamente en el HTML como antes. Esto permite desarrollo sin configurar secretos, pero **en producción siempre debe estar configurado**.

### Resolución de COOKIE_SECRET

```
COOKIE_SECRET → GATEWAY_WEBHOOK_SECRET → WEBHOOK_SECRET → (fallback inline)
```

En Azure, `WEBHOOK_SECRET` ya está configurado (obligatorio para webhooks). El portal reutiliza ese mismo secreto para firmar cookies.

---

## Capa 4: Sanitización de logs (safeLog)

**Archivo**: `utils/safeLog.js`

### Qué redacta

En producción (`NODE_ENV=production`), `safeLog()` reemplaza valores sensibles antes de escribirlos en logs:

| Campo | Regla | Ejemplo |
|-------|-------|---------|
| `dni`, `documento` | Muestra últimos 4 | `28285464` → `****5464` |
| `email`, `correo` | Primera letra + `***` | `usuario@gmail.com` → `u***@***` |
| `id_operacion`, `nro_operacion` | Últimos 4 | `OP-1234-ABCD` → `***ABCD` |
| `external_reference` | Últimos 4 | `EXT-5678` → `***5678` |
| `importe`, `monto`, `total` | `***` | `15000.50` → `***` |
| `ticketNumber`, `ticket_id` | Prefijo 3 chars + `***` | `TCK-20260413-00001` → `TCK***` |

En desarrollo (`NODE_ENV=development`), los datos pasan sin modificar.

### Puntos de aplicación

- `controllers/payment.controller.js` — logs de redirect-exchange y creación de ticket
- `services/pagos.service.js` — log de deuda pagada
- `services/ticketsPago.service.js` — importado para uso futuro

---

## Capa 5: Límites y sanitización de entrada

**Archivo**: `app.js` (middleware inline)

### Body size limits

```
express.json({ limit: '100kb' })
express.urlencoded({ limit: '100kb', extended: false })
```

Requests que excedan 100kb reciben `413 Payload Too Large`. Previene ataques de denegación de servicio por memoria.

### Sanitización de entrada

Función recursiva que aplica a todo `req.body` y `req.query`:
- `trim()` — elimina espacios al inicio y final
- HTML-escape — convierte `<`, `>`, `&`, `"`, `'` a entidades HTML

Respeta objetos y arrays anidados (aplica solo a valores string hoja, no corrompe la estructura JSON).

---

## Capa 6: Rate limiting

**Archivo**: `middlewares/rateLimiter.js` (existente, sin cambios en esta fase)

Límites configurados:
- **API general**: 100 requests por minuto por IP
- **Webhook**: 30 requests por minuto por IP (más restrictivo)

Usa `express-rate-limit` con `X-Forwarded-For` (gracias a `trust proxy`).

---

## Configuración requerida

### Variables de entorno

| Variable | Obligatoria | Descripción |
|----------|-------------|-------------|
| `WEBHOOK_SECRET` | ✅ Producción | Secreto compartido con gateway, usado para signed cookies y CSRF |
| `COOKIE_SECRET` | Opcional | Secreto específico para cookies (cae a `GATEWAY_WEBHOOK_SECRET` → `WEBHOOK_SECRET`) |
| `CSRF_SECRET` | Opcional | Secreto específico para tokens CSRF (hereda de `COOKIE_SECRET`) |
| `SECURITY_HELMET_ENABLED` | Opcional | `true` o `false`. Por defecto: `true` en producción |
| `SECURITY_CSRF_ENABLED` | Opcional | `true` o `false`. Por defecto: `true` en producción |
| `SECURITY_CSRF_DEMO_EXEMPT` | Opcional | `true` para eximir rutas `/demo/*` de CSRF en desarrollo |

### Azure App Settings

`WEBHOOK_SECRET` ya está en el checklist de App Settings por municipio (`docs/integration/checklist-appsettings.md`). Es el mismo secreto que usa el gateway para firmar webhooks. No se necesita una variable adicional.

### Dependencias nuevas

```json
"helmet": "8.1.0",
"csrf-csrf": "3.1.0"
```

`cookie-parser` ya existía.

---

## Feature flags (hot-disable)

Todas las protecciones nuevas pueden desactivarse en caliente sin redeploy:

```bash
# Desactivar Helmet
az webapp config appsettings set --settings SECURITY_HELMET_ENABLED=false

# Desactivar CSRF
az webapp config appsettings set --settings SECURITY_CSRF_ENABLED=false
```

Esto permite rollout progresivo: activar en un municipio, validar, luego activar en el resto.

---

## Referencias

- Auditoría original: `docs/auditorias/auditoria-03072026/`
- ADRs relacionados: `docs/architecture/adr.md` (ADR-008, ADR-009, ADR-010)
- Specs formales: `openspec/specs/http-security-hardening/spec.md`, `csrf-protection/spec.md`, `pii-protection/spec.md`
- SDD change: `openspec/changes/archive/2026-07-04-resolver-auditoria-03072026/`

---
> Creado: 2026-07-05 | SDD "resolver-auditoria-03072026" | Portal de Pagos Municipal
