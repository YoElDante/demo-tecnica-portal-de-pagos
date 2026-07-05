# HTTP Security Hardening Specification

## Proposito

Defender el portal contra ataques HTTP de capa superior (XSS, clickjacking, MIME sniffing, oversized payloads) mediante headers de seguridad, limites de request y proteccion de infraestructura.

## Requisitos

### Requirement: Security Headers con Helmet

El sistema DEBE incluir headers de seguridad en todas las respuestas HTTP cuando `NODE_ENV` sea `production` o cuando `SECURITY_HELMET_ENABLED` sea `true`.

Los headers obligatorios son:
- `Content-Security-Policy` con directivas que permitan los scripts inline actuales de las vistas EJS y los dominios CDN del gateway
- `X-Frame-Options: DENY` o `SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security` (solo en produccion, con `max-age` minimo de 31536000)
- `Referrer-Policy` configurada para no fugas de informacion
- `X-DNS-Prefetch-Control: off`

#### Scenario: Respuesta en produccion incluye todos los headers

- GIVEN el servidor corre con `NODE_ENV=production`
- WHEN se realiza cualquier request HTTP al portal
- THEN la respuesta DEBE incluir `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, `Referrer-Policy` y `X-DNS-Prefetch-Control`

#### Scenario: Helmet desactivado en desarrollo

- GIVEN `NODE_ENV=development` y `SECURITY_HELMET_ENABLED` no esta definido
- WHEN se realiza un request al portal
- THEN los headers de seguridad PUEDEN estar ausentes o en modo relajado para facilitar el desarrollo local

#### Scenario: HSTS solo en produccion

- GIVEN `NODE_ENV=production`
- WHEN se realiza un request HTTPS
- THEN la respuesta DEBE incluir `Strict-Transport-Security` con `max-age >= 31536000`
- AND la respuesta DEBE incluir `includeSubDomains`

#### Scenario: CSP permite scripts inline de vistas EJS

- GIVEN una vista EJS con scripts inline (ej. `views/index.ejs`)
- WHEN se renderiza la vista en produccion con Helmet activo
- THEN la pagina DEBE cargar correctamente sin errores de CSP en la consola del navegador
- AND `Content-Security-Policy` DEBE incluir `'unsafe-inline'` en `script-src` como minimo transitorio

### Requirement: Ocultar tecnologia del servidor

El sistema NO DEBE exponer `X-Powered-By: Express` en ninguna respuesta HTTP.

#### Scenario: Header X-Powered-By ausente

- GIVEN el servidor iniciado con configuracion de seguridad
- WHEN se realiza cualquier request HTTP
- THEN la respuesta NO DEBE incluir el header `X-Powered-By`

### Requirement: Trust Proxy para Azure

El sistema DEBE configurar `trust proxy` para detectar correctamente la IP real del cliente detras del Azure Load Balancer.

#### Scenario: IP real detectada detras de un proxy

- GIVEN el portal desplegado en Azure App Service con 1 proxy adelante
- WHEN un request llega con header `X-Forwarded-For`
- THEN `req.ip` DEBE reflejar la IP del cliente original, no la del proxy

### Requirement: Limite de tamaño de request body

El sistema DEBE rechazar requests con body que exceda 100 KB para prevenir ataques de denegacion de servicio por memoria.

#### Scenario: Request dentro del limite

- GIVEN un request POST con body de 50 KB
- WHEN el request es procesado por `express.json()` o `express.urlencoded()`
- THEN el request DEBE ser aceptado y procesado normalmente

#### Scenario: Request excede el limite

- GIVEN un request POST con body de 200 KB
- WHEN el request es procesado por `express.json()` o `express.urlencoded()`
- THEN el servidor DEBE rechazar el request con status 413 (Payload Too Large)
- AND el body NO DEBE ser parseado ni almacenado en memoria

### Requirement: Sanitizacion global de entrada

El sistema DEBE aplicar `sanitizeInput` (trim + escape) a todos los campos de request body antes de que lleguen a los controladores.

#### Scenario: Input con caracteres especiales es sanitizado

- GIVEN un request POST con campo que contiene `<script>alert('xss')</script>`
- WHEN el middleware `sanitizeInput` procesa el request
- THEN el valor en `req.body` DEBE tener los caracteres HTML escapados (`&lt;script&gt;...`)

### Requirement: Rate Limiting coberturas

El sistema DEBE aplicar rate limiting a todos los endpoints publicos expuestos. Los endpoints `/api/tickets/estado` (polling) y endpoints de demo DEBE tener limites independientes adecuados a su frecuencia de uso.

#### Scenario: Endpoint publico protegido por rate limit

- GIVEN un endpoint API publico (ej. `/buscar`, `/pagos/iniciar`)
- WHEN un mismo IP excede el limite configurado de requests por ventana
- THEN el servidor DEBE responder 429 (Too Many Requests)

#### Scenario: Polling de estado de ticket tiene limite separado

- GIVEN el endpoint `/api/tickets/estado` usado para polling cada 3 segundos
- WHEN el mismo IP realiza requests frecuentes
- THEN el endpoint DEBE tener un rate limit mas alto que los endpoints generales para no bloquear el polling legitimo

### Requirement: Subresource Integrity en assets CDN

El sistema DEBE incluir atributos `integrity` (hash SHA-384 o superior) y `crossorigin="anonymous"` en todos los tags `<script>` y `<link>` que carguen recursos desde CDNs externos.

#### Scenario: Asset CDN con SRI carga correctamente

- GIVEN un tag `<script src="https://cdnjs.cloudflare.com/...">` con atributo `integrity="sha384-..."`
- WHEN la pagina se carga en el navegador
- THEN el recurso DEBE cargarse si el hash coincide con el contenido del archivo

#### Scenario: Asset CDN modificado es bloqueado

- GIVEN un tag con `integrity` cuyo hash NO coincide con el contenido del archivo remoto
- WHEN la pagina se carga en el navegador
- THEN el navegador DEBE bloquear la carga del recurso y registrar un error de integridad

## Criterios de Aceptacion

| # | Criterio | Verificacion |
|---|----------|-------------|
| 1 | Headers Helmet presentes en respuesta | `curl -I` muestra CSP, X-Frame, X-Content-Type, HSTS |
| 2 | `X-Powered-By` ausente | `curl -I` no muestra `X-Powered-By` |
| 3 | HSTS solo en produccion | Test en dev: sin HSTS; test en prod: con HSTS |
| 4 | Body > 100 KB rechazado | POST con payload 200 KB retorna 413 |
| 5 | Input XSS sanitizado | POST con `<script>` retorna body escapado |
| 6 | Rate limit activa en endpoint publico | Requests repetidos retornan 429 |
| 7 | Tags CDN con `integrity` | HTML renderizado incluye `integrity="sha384-..."` |
| 8 | Vistas EJS funcionan con CSP activo | Flujo de pago completo sin errores CSP |
