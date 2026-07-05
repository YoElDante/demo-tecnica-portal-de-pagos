# PII Protection Specification

## Proposito

Eliminar la exposicion de datos personales identificables (PII) del contribuyente en HTML inline y logs de produccion, cumpliendo con principios de minimizacion de datos.

## Requisitos

### Requirement: PII no embebida en HTML inline

El sistema NO DEBE incluir datos personales del contribuyente (codigo, DNI, nombre, email) como variables JavaScript inline en el HTML renderizado por el servidor.

#### Scenario: HTML no contiene contribuyenteData inline

- GIVEN la pagina principal renderizada despues de una busqueda por DNI
- WHEN el HTML fuente se inspecciona
- THEN NO DEBE existir un bloque `<script>` con `const contribuyenteData = { ... }` conteniendo DNI, nombre, email o codigo

#### Scenario: Datos del contribuyente se obtienen via API

- GIVEN un contribuyente con sesion activa tras busqueda por DNI
- WHEN el JavaScript del cliente carga la pagina
- THEN el cliente DEBE realizar un `fetch()` a un endpoint API para obtener los datos del contribuyente
- AND los datos DEBE estar disponibles para el uso del frontend sin estar en el HTML inicial

### Requirement: Endpoint de datos del contribuyente protegido

El sistema DEBE proteger el endpoint que retorna datos del contribuyente para que solo responda cuando existe una sesion valida asociada al DNI buscado.

#### Scenario: Endpoint retorna datos con sesion valida

- GIVEN un contribuyente que realizo una busqueda por DNI exitosa
- WHEN se realiza `GET /api/contribuyente/:codigo` dentro de la misma sesion
- THEN el endpoint DEBE retornar los datos del contribuyente (codigo, DNI, nombre, email) con status 200

#### Scenario: Endpoint rechaza sin sesion

- GIVEN un usuario sin sesion activa de busqueda
- WHEN se realiza `GET /api/contribuyente/:codigo`
- THEN el endpoint DEBE responder con status 401 o 403
- AND NO DEBE retornar datos del contribuyente

#### Scenario: Endpoint rechaza acceso a codigo de otro contribuyente

- GIVEN el contribuyente A con sesion activa
- WHEN se realiza `GET /api/contribuyente/codigoB` (codigo de otro contribuyente)
- THEN el endpoint DEBE responder con status 403
- AND NO DEBE retornar datos del contribuyente B

### Requirement: Sanitizacion de PII en logs de produccion

El sistema NO DEBE registrar datos personales identificables en texto plano en los logs de produccion. Los campos sensibles DEBE ser redactados, truncados o hasheados.

Los campos sensibles a sanitizar incluyen:
- DNI / documento del contribuyente
- Email del contribuyente
- `id_operacion` / `NRO_OPERACION`
- `external_reference`
- Importe de pago
- `ticketNumber` / `ticketId`

#### Scenario: Log de inicio de pago no expone PII

- GIVEN un request de inicio de pago con `id_operacion`, `importe` y `external_reference`
- WHEN el controlador registra el evento en logs de produccion
- THEN el log NO DEBE contener los valores en texto plano
- AND el log DEBE usar valores redactados (ej. `id_operacion=***4f2a`, `importe=***`, `external_reference=***`)

#### Scenario: Log de confirmacion de pago no expone detalles de deuda

- GIVEN la confirmacion de un pago con detalles de conceptos y montos
- WHEN el servicio registra el evento en logs de produccion
- THEN el log NO DEBE contener DNI, email, ni montos individuales en texto plano
- AND el log DEBE usar valores redactados o referencias opacas

#### Scenario: Log de creacion de ticket no expone numeros

- GIVEN la creacion de un ticket de pago con `ticketNumber` y `ticketId`
- WHEN el servicio registra el evento en logs de produccion
- THEN el log NO DEBE contener `ticketNumber` ni `ticketId` en texto plano
- AND el log DEBE usar un identificador truncado o hasheado

#### Scenario: Logs de desarrollo PUEDEN incluir PII

- GIVEN `NODE_ENV=development`
- WHEN se registra un evento de pago
- THEN el log PUEDE incluir datos completos para facilitar debugging
- AND esto NO DEBE ocurrir en produccion bajo ninguna circunstancia

### Requirement: Helper de sanitizacion reutilizable

El sistema DEBE proveer una funcion helper `safeLog()` o equivalente que automaticamente redacte campos sensibles en cualquier contexto de logging.

#### Scenario: safeLog redacta campos conocidos

- GIVEN un objeto con campos `{ dni: "12345678", email: "user@example.com", id_operacion: "abc123" }`
- WHEN se pasa por `safeLog()`
- THEN la salida DEBE tener `dni: "***5678"`, `email: "u***@***"`, `id_operacion: "***123"` (o equivalente redactado)

#### Scenario: safeLog preserva estructura del log

- GIVEN un objeto log con campos mixtos (sensibles y no sensibles)
- WHEN se pasa por `safeLog()`
- THEN los campos no sensibles DEBE permanecer intactos
- AND solo los campos sensibles DEBE ser redactados

## Contrato API: GET /api/contribuyente/:codigo

### Request

```
GET /api/contribuyente/:codigo
Headers: Cookie (sesion activa) o token de sesion
```

### Response 200

```json
{
  "codigo": "string",
  "dni": "string (redactado parcialmente)",
  "nombre": "string",
  "apellido": "string",
  "email": "string (redactado parcialmente)"
}
```

### Response 401/403

```json
{
  "error": "No autorizado"
}
```

## Criterios de Aceptacion

| # | Criterio | Verificacion |
|---|----------|-------------|
| 1 | HTML no contiene `contribuyenteData` inline | `grep` en HTML renderizado no encuentra DNI/email |
| 2 | Frontend obtiene datos via fetch | Network tab muestra request a `/api/contribuyente/` |
| 3 | Endpoint protegido sin sesion | Request sin sesion retorna 401/403 |
| 4 | Logs de produccion sin PII en claro | Logs de Azure no muestran DNI/email/id_operacion completos |
| 5 | `safeLog()` redacta campos sensibles | Test unitario verifica redaccion de campos conocidos |
| 6 | Logs de desarrollo con datos completos | `NODE_ENV=development` muestra datos sin redactar |
