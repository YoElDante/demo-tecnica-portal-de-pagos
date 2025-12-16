# 📋 Instrucciones de Integración - Frontend Municipal

> **Documento para IA**: Este archivo contiene instrucciones detalladas para que una IA genere el código necesario en el frontend municipal para integrarse con el API Gateway de pagos.
> 
> **Fecha**: 2025-12-12  
> **Versión API**: v0.1.0 (MVP)

---

## 🎯 Objetivo

El frontend municipal debe:
1. **Enviar solicitudes de pago** al API Gateway
2. **Recibir URLs de pago** para redirigir al usuario a MercadoPago
3. **Crear endpoints** para recibir confirmaciones de pago
4. **Mostrar páginas** de resultado (éxito, fallo, pendiente)

---

## 🔧 Contexto técnico del frontend

- **Stack**: Node.js + Express.js + EJS (vistas)
- **Base de datos**: SQL Server con Sequelize + Tedious
- **Puerto en desarrollo**: 4000
- **Puerto en producción**: El asignado por Azure

---

## 📡 Endpoint del API Gateway

### URL Base
- **Desarrollo**: `http://localhost:3000` o `https://[url-ngrok].ngrok-free.app`
- **Producción**: `https://api-gateway-mp.azurewebsites.net` (ejemplo)

### POST `/api/pagos`

Crea una preferencia de pago en MercadoPago.

#### Request

```http
POST /api/pagos
Content-Type: application/json
```

#### Body (JSON)

```json
{
  "municipio_id": "tinoco",
  "municipio_nombre": "Municipalidad de Tinoco",
  "contribuyente": {
    "nombre": "Juan Carlos Pérez",
    "email": "juan.perez@email.com",
    "dni": "12345678",
    "telefono": "3511234567"
  },
  "conceptos": [
    {
      "id": "tasa-001",
      "descripcion": "Tasa Municipal - Período 01/2025",
      "monto": 5000
    },
    {
      "id": "tasa-002",
      "descripcion": "Tasa Municipal - Período 02/2025",
      "monto": 5000
    }
  ],
  "monto_total": 10000,
  "callback_url": "http://localhost:4000/api/pagos/confirmacion",
  "metadata": {
    "cuenta_municipal": "cuenta_banco_tinoco"
  }
}
```

#### Campos requeridos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `municipio_id` | string | Identificador único del municipio |
| `municipio_nombre` | string | Nombre legible del municipio |
| `contribuyente.nombre` | string | Nombre completo del contribuyente |
| `contribuyente.email` | string | Email para notificaciones |
| `contribuyente.dni` | string | DNI del contribuyente |
| `conceptos` | array | Lista de conceptos a pagar |
| `conceptos[].id` | string | ID del concepto en la BD municipal |
| `conceptos[].descripcion` | string | Descripción del concepto |
| `conceptos[].monto` | number | Monto en pesos argentinos |
| `monto_total` | number | Suma de todos los montos |
| `callback_url` | string | URL donde el API notificará el resultado |

#### Response exitoso (201)

```json
{
  "success": true,
  "message": "Preferencia de pago creada exitosamente",
  "data": {
    "external_reference": "tinoco-1702134567890-abc123",
    "preference_id": "123456789-abcdef",
    "payment_url": "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=...",
    "sandbox_url": "https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=..."
  }
}
```

#### Response error (400)

```json
{
  "success": false,
  "message": "El campo municipio_id es requerido"
}
```

---

## 🔔 Endpoint de confirmación (DEBE CREAR EL FRONTEND)

El frontend **debe crear** este endpoint para recibir notificaciones del API Gateway cuando un pago cambia de estado.

### POST `/api/pagos/confirmacion`

El API Gateway llamará a este endpoint cuando MercadoPago confirme un pago.

#### Request que recibirá

```json
{
  "external_reference": "tinoco-1702134567890-abc123",
  "status": "approved",
  "status_detail": "accredited",
  "payment_id": "1234567890",
  "payment_type": "credit_card",
  "transaction_amount": 10000,
  "date_approved": "2025-12-12T10:30:00.000Z",
  "payer_email": "juan.perez@email.com",
  "metadata": {
    "municipio_id": "tinoco",
    "contribuyente_dni": "12345678"
  }
}
```

#### Estados posibles

| Status | Descripción | Acción sugerida |
|--------|-------------|-----------------|
| `approved` | Pago aprobado | Marcar conceptos como pagados en BD |
| `pending` | Pago pendiente | Mostrar mensaje de espera |
| `rejected` | Pago rechazado | No modificar BD, informar al usuario |
| `refunded` | Pago reembolsado | Revertir estado en BD |

#### Response esperado

```json
{
  "received": true,
  "message": "Confirmación procesada"
}
```

---

## 🎨 Páginas de resultado (DEBE CREAR EL FRONTEND)

MercadoPago redirigirá al usuario a estas URLs después del pago.

### GET `/pago/exitoso`

Página a mostrar cuando el pago fue exitoso.

**Query params que recibirá**:
```
/pago/exitoso?external_reference=tinoco-1702134567890-abc123&payment_id=1234567890&status=approved
```

### GET `/pago/fallido`

Página a mostrar cuando el pago fue rechazado.

**Query params que recibirá**:
```
/pago/fallido?external_reference=tinoco-1702134567890-abc123&status=rejected
```

### GET `/pago/pendiente`

Página a mostrar cuando el pago quedó pendiente (ej: pago en efectivo).

**Query params que recibirá**:
```
/pago/pendiente?external_reference=tinoco-1702134567890-abc123&status=pending
```

---

## 💻 Código a generar

### 1. Servicio para llamar al API Gateway

Crear un servicio que encapsule la llamada al API Gateway.

**Archivo sugerido**: `services/paymentGatewayService.js`

**Funcionalidad**:
- Método `createPayment(paymentData)` que hace POST a `/api/pagos`
- Manejo de errores
- Logging de las operaciones

### 2. Ruta para iniciar pago

Crear una ruta que el usuario activa (ej: click en botón "Pagar").

**Archivo sugerido**: `routes/paymentRoutes.js`

**Funcionalidad**:
- Recibir datos del formulario/sesión
- Llamar al servicio de payment gateway
- Redirigir al usuario a `payment_url` o `sandbox_url`

### 3. Controlador de pagos

**Archivo sugerido**: `controllers/paymentController.js`

**Funcionalidad**:
- `iniciarPago`: Prepara datos y llama al API Gateway
- `confirmacion`: Recibe POST del API Gateway y actualiza BD
- `pagoExitoso`: Renderiza vista de éxito
- `pagoFallido`: Renderiza vista de fallo
- `pagoPendiente`: Renderiza vista de pendiente

### 4. Vistas EJS

**Archivos sugeridos**:
- `views/pago/exitoso.ejs`
- `views/pago/fallido.ejs`
- `views/pago/pendiente.ejs`

**Contenido sugerido**:
- Mensaje claro del resultado
- Número de referencia (`external_reference`)
- Botón para volver al inicio
- En éxito: opción de descargar comprobante (futuro)

### 5. Actualización de BD

En el endpoint de confirmación, cuando `status === 'approved'`:
- Buscar los conceptos por `external_reference` o metadata
- Actualizar estado a "pagado"
- Registrar `payment_id` y `date_approved`

---

## 🔒 Variables de entorno a configurar

```env
# URL del API Gateway
API_GATEWAY_URL=http://localhost:3000

# En desarrollo con ngrok:
# API_GATEWAY_URL=https://jimena-unsignificative-digestedly.ngrok-free.app

# Identificación del municipio
MUNICIPIO_ID=tinoco
MUNICIPIO_NOMBRE=Municipalidad de Tinoco

# Puerto del frontend
PORT=4000
```

---

## 📝 Ejemplo de flujo completo

```
1. Usuario selecciona conceptos a pagar en el frontend
2. Usuario hace click en "Pagar con MercadoPago"
3. Frontend POST a API Gateway con datos del pago
4. API Gateway responde con payment_url
5. Frontend redirige usuario a payment_url (MercadoPago)
6. Usuario paga en MercadoPago
7. MercadoPago redirige a /pago/exitoso (o fallido/pendiente)
8. MercadoPago notifica al API Gateway via webhook
9. API Gateway POST a callback_url del frontend
10. Frontend actualiza BD marcando conceptos como pagados
```

---

## ⚠️ Notas importantes

1. **En desarrollo**: Usar `sandbox_url` en lugar de `payment_url`
2. **callback_url**: Debe ser accesible desde internet (o usar ngrok en desarrollo)
3. **external_reference**: Guardar este valor para relacionar el pago con los conceptos
4. **Idempotencia**: El endpoint de confirmación puede recibir múltiples llamadas para el mismo pago, asegurarse de no procesar duplicados

---

## 🧪 Testing

Para probar en desarrollo:
1. Iniciar API Gateway en puerto 3000
2. Iniciar Frontend en puerto 4000
3. Iniciar ngrok apuntando a puerto 3000
4. Actualizar `callback_url` para usar localhost:4000
5. Usar tarjetas de prueba de MercadoPago sandbox
