# Delta for CSRF Protection

## MODIFIED Requirements

### Requirement: Token CSRF en requests AJAX/fetch

El sistema DEBE soportar la inclusion del token CSRF en requests `fetch()` realizados desde JavaScript del cliente, ya sea via header `CSRF-Token` (que Node.js normaliza a `csrf-token` en `req.headers`) o campo `_csrf` en el body. El middleware DEBE extraer el token del header `csrf-token` sin prefijo `x-`.
(Previously: Referia `req.headers['x-csrf-token']` como fuente del header, pero Node.js lowercacea `CSRF-Token` a `csrf-token`, no `x-csrf-token`.)

#### Scenario: Fetch POST con header CSRF es aceptado

- GIVEN un request `fetch()` con header `CSRF-Token` conteniendo un token valido
- WHEN el request es enviado al servidor
- THEN el middleware DEBE leer el token de `req.headers['csrf-token']`
- AND el request DEBE ser procesado normalmente

#### Scenario: Fetch POST sin token CSRF es rechazado

- GIVEN un request `fetch()` POST sin header `CSRF-Token` ni campo `_csrf` en el body
- WHEN el request es enviado al servidor con `SECURITY_CSRF_ENABLED=true`
- THEN el servidor DEBE responder con status 403 (Forbidden)

#### Scenario: POST /generar-ticket con header CSRF es aceptado

- GIVEN un request `fetch()` POST a `/generar-ticket` con header `CSRF-Token` conteniendo un token valido
- WHEN el request es enviado al servidor
- THEN el request DEBE ser procesado normalmente y retornar el HTML del ticket

#### Scenario: POST /generar-ticket sin token CSRF es rechazado

- GIVEN un request `fetch()` POST a `/generar-ticket` sin header `CSRF-Token` ni campo `_csrf` en el body
- WHEN el request es enviado al servidor con `SECURITY_CSRF_ENABLED=true`
- THEN el servidor DEBE responder con status 403 (Forbidden)

## Criterios de Aceptacion (actualizados)

| # | Criterio | Verificacion |
|---|----------|-------------|
| 6 | Fetch con header `CSRF-Token` funciona | `fetch()` con header `CSRF-Token` es aceptado; el middleware lee `req.headers['csrf-token']` |
| 7 | POST `/generar-ticket` con CSRF funciona | `fetch()` a `/generar-ticket` con header `CSRF-Token` retorna 200 |
| 8 | POST `/generar-ticket` sin CSRF retorna 403 | `fetch()` a `/generar-ticket` sin header retorna 403 con `SECURITY_CSRF_ENABLED=true` |
