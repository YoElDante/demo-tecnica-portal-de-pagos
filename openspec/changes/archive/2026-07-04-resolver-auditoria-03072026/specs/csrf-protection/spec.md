# CSRF Protection Specification

## Proposito

Prevenir ataques de Cross-Site Request Forgery que permitan ejecutar acciones no autorizadas en nombre del contribuyente con sesion activa.

## Requisitos

### Requirement: Middleware CSRF en rutas POST

El sistema DEBE validar un token CSRF en todas las peticiones HTTP con metodos que modifiquen estado (POST, PUT, DELETE, PATCH). El token DEBE ser generado por sesion y validado en cada request protegido.

#### Scenario: Request POST sin token CSRF es rechazado

- GIVEN un formulario POST sin campo `_csrf` o con token invalido
- WHEN se envia el request al servidor
- THEN el servidor DEBE responder con status 403 (Forbidden)
- AND el body NO DEBE ser procesado

#### Scenario: Request POST con token valido es aceptado

- GIVEN un formulario POST con campo `_csrf` que contiene un token valido de la sesion actual
- WHEN se envia el request al servidor
- THEN el request DEBE ser procesado normalmente

#### Scenario: Token CSRF es unico por sesion

- GIVEN dos sesiones de navegador diferentes (navegador A y navegador B)
- WHEN cada sesion genera un token CSRF
- THEN los tokens DEBE ser distintos entre sesiones
- AND un token de la sesion A NO DEBE ser valido en la sesion B

### Requirement: Token CSRF en formularios EJS

El sistema DEBE inyectar el token CSRF como campo oculto `_csrf` en todos los formularios HTML que realicen POST al servidor.

#### Scenario: Formulario de busqueda por DNI incluye token

- GIVEN la pagina principal (`views/index.ejs`) renderizada
- WHEN el HTML del formulario `POST /buscar` se inspecciona
- THEN DEBE existir un campo `<input type="hidden" name="_csrf" value="...">`

#### Scenario: Formulario de inicio de pago incluye token

- GIVEN la pagina de deudas del contribuyente
- WHEN el HTML del formulario `POST /pagos/iniciar` se inspecciona
- THEN DEBE existir un campo `<input type="hidden" name="_csrf" value="...">`

### Requirement: Exencion de endpoints de polling

El sistema NO DEBE requerir token CSRF en el endpoint `GET /api/tickets/estado` utilizado para polling del estado de pago, ya que es un metodo GET idempotente.

#### Scenario: Polling de estado funciona sin CSRF

- GIVEN el endpoint `GET /api/tickets/estado`
- WHEN se realiza un request GET sin token CSRF
- THEN el request DEBE ser procesado normalmente y retornar el estado del ticket

### Requirement: Exencion de endpoints de demostracion

El sistema DEBE permitir excluir endpoints de demostracion de la validacion CSRF cuando `NODE_ENV` sea `development` o cuando una variable de entorno `SECURITY_CSRF_DEMO_EXEMPT` este habilitada.

#### Scenario: Demo endpoint funciona sin CSRF en desarrollo

- GIVEN `NODE_ENV=development`
- WHEN se envia un POST a un endpoint de demostracion sin token CSRF
- THEN el request DEBE ser procesado normalmente

#### Scenario: Demo endpoint protegido en produccion

- GIVEN `NODE_ENV=production`
- WHEN se envia un POST a un endpoint de demostracion sin token CSRF
- THEN el request DEBE ser rechazado con 403 (a menos que `SECURITY_CSRF_DEMO_EXEMPT` este explicitamente habilitado)

### Requirement: Token CSRF en requests AJAX/fetch

El sistema DEBE soportar la inclusion del token CSRF en requests `fetch()` realizados desde JavaScript del cliente, ya sea via header `CSRF-Token` o campo en el body.

#### Scenario: Fetch POST con header CSRF es aceptado

- GIVEN un request `fetch()` con header `CSRF-Token` conteniendo un token valido
- WHEN el request es enviado al servidor
- THEN el request DEBE ser procesado normalmente

## Criterios de Aceptacion

| # | Criterio | Verificacion |
|---|----------|-------------|
| 1 | POST sin `_csrf` retorna 403 | `curl -X POST` sin token retorna Forbidden |
| 2 | POST con `_csrf` valido funciona | Formulario con token oculto se procesa |
| 3 | Tokens distintos entre sesiones | Dos navegadores generan tokens diferentes |
| 4 | Polling GET funciona sin CSRF | `GET /api/tickets/estado` sin token retorna 200 |
| 5 | Formularios EJS incluyen campo `_csrf` | HTML renderizado contiene `<input name="_csrf">` |
| 6 | Fetch con header CSRF funciona | `fetch()` con header `CSRF-Token` es aceptado |
