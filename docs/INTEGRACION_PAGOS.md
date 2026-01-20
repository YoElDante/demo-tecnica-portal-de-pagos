# Documentación de Integración de Pagos con MercadoPago

> **Portal de Pagos Municipal - Comuna de Tinoco**  
> **Versión:** 1.0  
> **Fecha:** Diciembre 2024  
> **Autor:** Equipo de Desarrollo

---

## 📋 Índice

1. [Arquitectura General](#1-arquitectura-general)
2. [Flujo de Pago Completo](#2-flujo-de-pago-completo)
3. [Endpoints del Portal (Frontend)](#3-endpoints-del-portal-frontend)
4. [Comunicación Portal → API Gateway](#4-comunicación-portal--api-gateway)
5. [Webhook: API Gateway → Portal](#5-webhook-api-gateway--portal)
6. [Formato de Datos](#6-formato-de-datos)
7. [Códigos de Estado de MercadoPago](#7-códigos-de-estado-de-mercadopago)
8. [Configuración Requerida](#8-configuración-requerida)
9. [Diagrama de Secuencia](#9-diagrama-de-secuencia)

---

## 1. Arquitectura General

El sistema de pagos se compone de **tres componentes** principales:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   PORTAL WEB    │────▶│   API GATEWAY   │────▶│   MERCADOPAGO   │
│  (portal-tinoco)│     │ (api-gateway-mp)│     │      (MP)       │
│   Puerto: 3000  │     │   Puerto: 3000  │     │   Externo       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        │                       │◀──────────────────────┘
        │                       │   (webhook MP)
        │◀──────────────────────┘
        │   (webhook interno)
        ▼
┌─────────────────┐
│  BASE DE DATOS  │
│  (Azure SQL)    │
└─────────────────┘
```

| Componente | Descripción | Puerto por defecto |
|------------|-------------|-------------------|
| **Portal Web** | Frontend + Backend Node.js/Express que muestra deudas y permite pagos | 3000 (o 4000) |
| **API Gateway** | Intermediario que maneja comunicación con MercadoPago | 3000 |
| **MercadoPago** | Plataforma de pagos externa | N/A (externo) |

---

## 2. Flujo de Pago Completo

### Paso a Paso

```
1. Usuario selecciona deudas en el portal
                ↓
2. Click en "Pagar con MercadoPago"
                ↓
3. Portal envía POST /pago/iniciar (interno)
                ↓
4. Portal llama al API Gateway POST /api/pagos
                ↓
5. API Gateway crea preferencia en MercadoPago
                ↓
6. API Gateway retorna URL de pago (sandbox_url)
                ↓
7. Portal redirige al usuario a MercadoPago
                ↓
8. Usuario completa el pago en MP
                ↓
9. MercadoPago notifica al API Gateway (webhook)
                ↓
10. API Gateway procesa y notifica al Portal
                ↓
11. Portal actualiza la BD (marca deudas como pagadas)
                ↓
12. MercadoPago redirige al usuario de vuelta al Portal
```

---

## 3. Endpoints del Portal (Frontend)

### 3.1 Rutas Web (Vistas)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/` | Página principal con formulario de búsqueda |
| POST | `/buscar` | Busca contribuyente por DNI y muestra deudas |
| POST | `/generar-ticket` | Genera ticket PDF de las deudas seleccionadas |

### 3.2 Rutas de Pago (Vistas)

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/pago/iniciar` | Inicia proceso de pago, llama al API Gateway |
| GET | `/pago/exitoso` | Página de pago exitoso (redirect desde MP) |
| GET | `/pago/fallido` | Página de pago rechazado (redirect desde MP) |
| GET | `/pago/pendiente` | Página de pago pendiente (redirect desde MP) |

### 3.3 Rutas API

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api` | Diccionario de endpoints disponibles |
| GET | `/api/clientes` | Lista clientes con paginación |
| GET | `/api/clientes/contribuyentes` | Lista contribuyentes con cant. deudas |
| GET | `/api/clientes/buscar/dni/:dni` | Busca cliente por DNI |
| GET | `/api/clientes/:codigo/deudas` | Obtiene deudas de un cliente |
| POST | `/api/clientes/generar-pago` | Genera JSON de pago |
| **POST** | **`/api/pagos/confirmacion`** | **Webhook interno - recibe confirmación del API Gateway** |

---

## 4. Comunicación Portal → API Gateway

### 4.1 Iniciar Pago: POST /pago/iniciar

Cuando el usuario hace click en "Pagar con MercadoPago", el frontend llama a esta ruta interna del portal.

**Request (desde el frontend JavaScript):**
```javascript
fetch('/pago/iniciar', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contribuyente: {
      dni: '12345678',
      nombre: 'Juan',
      apellido: 'Pérez',
      email: 'juan@email.com'  // opcional
    },
    conceptos: [
      {
        id: '1234',                    // IdTrans de la deuda
        descripcion: 'Tasa Municipal - Cuota 1/2024',
        importe: 5500.00,
        fecha_vencimiento: '15/01/2024'
      }
    ],
    montoTotal: 5500.00
  })
})
```

**Response exitoso:**
```json
{
  "success": true,
  "redirect_url": "https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=123456789-abcdef",
  "external_reference": "tinoco_1702789200000_12345678"
}
```

### 4.2 Llamada al API Gateway: POST /api/pagos

El portal internamente llama al API Gateway para crear la preferencia de pago.

**URL del API Gateway:** `http://localhost:3000/api/pagos` (configurable en .env)

**Request Body:**
```json
{
  "municipio_id": "tinoco",
  "municipio_nombre": "Comuna de Tinoco",
  "contribuyente": {
    "nombre": "Juan Pérez",
    "email": "juan@email.com",
    "dni": "12345678",
    "telefono": ""
  },
  "conceptos": [
    {
      "id": "1234",
      "descripcion": "Tasa Municipal - Cuota 1/2024",
      "monto": 5500.00
    },
    {
      "id": "1235",
      "descripcion": "Tasa Municipal - Cuota 2/2024",
      "monto": 5500.00
    }
  ],
  "monto_total": 11000.00,
  "callback_url": "http://localhost:4000/api/pagos/confirmacion",
  "metadata": {
    "conceptos_ids": [1234, 1235],
    "contribuyente_dni": "12345678"
  }
}
```

**Response del API Gateway:**
```json
{
  "success": true,
  "preference_id": "123456789-abcdef-ghij",
  "external_reference": "tinoco_1702789200000_12345678",
  "payment_url": "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=...",
  "sandbox_url": "https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=...",
  "message": "Preferencia de pago creada exitosamente"
}
```

---

## 5. Webhook: API Gateway → Portal

### 5.1 ¿Qué es el Webhook?

El webhook es una notificación automática que envía MercadoPago cuando cambia el estado de un pago. El flujo es:

```
MercadoPago → API Gateway → Portal (BD)
```

### 5.2 Webhook de MercadoPago al API Gateway

**URL configurada en MercadoPago:** `https://tu-api-gateway.com/api/webhooks/mercadopago`

**Request que envía MercadoPago:**
```json
{
  "action": "payment.created",
  "api_version": "v1",
  "data": {
    "id": "1234567890"
  },
  "date_created": "2024-12-16T10:30:00.000-03:00",
  "id": 12345678901,
  "live_mode": false,
  "type": "payment",
  "user_id": "123456789"
}
```

El API Gateway consulta los detalles del pago a MP y luego notifica al Portal.

### 5.3 Webhook Interno: API Gateway → Portal

**URL del Portal:** `POST /api/pagos/confirmacion`

**Request Body que envía el API Gateway:**
```json
{
  "external_reference": "tinoco_1702789200000_12345678",
  "status": "approved",
  "status_detail": "accredited",
  "payment_id": "1234567890",
  "transaction_amount": 11000.00,
  "date_approved": "2024-12-16T10:35:00.000-03:00",
  "metadata": {
    "conceptos_ids": [1234, 1235],
    "contribuyente_dni": "12345678"
  }
}
```

**Response del Portal:**
```json
{
  "received": true,
  "message": "Confirmación procesada"
}
```

### 5.4 Procesamiento en el Portal

Cuando el portal recibe la confirmación con `status: "approved"`:

1. **Verifica idempotencia:** Busca si ya existe un pago con ese `payment_id`
2. **Crea registro COBRO:** Inserta registro en `ClientesCtaCte` con `CodMovim='D'`
3. **Actualiza deudas:** Marca las deudas originales con `Saldo=0`, `EsPago=1`

---

## 6. Formato de Datos

### 6.1 Estructura del Concepto

```javascript
{
  id: String,           // IdTrans de la tabla ClientesCtaCte
  descripcion: String,  // Texto descriptivo del concepto
  monto: Number,        // Monto total (incluye intereses)
  importe: Number       // Alias de monto (acepta ambos)
}
```

### 6.2 Estructura del Contribuyente

```javascript
{
  dni: String,          // DNI del contribuyente (requerido)
  nombre: String,       // Nombre (requerido)
  apellido: String,     // Apellido (opcional, se concatena con nombre)
  email: String,        // Email para notificaciones de MP (opcional)
  telefono: String      // Teléfono (opcional)
}
```

### 6.3 External Reference (Referencia Única)

Formato: `{municipio_id}_{timestamp}_{dni}`

Ejemplo: `tinoco_1702789200000_12345678`

Esta referencia es única por transacción y permite:
- Identificar el municipio
- Timestamp de creación
- DNI del contribuyente
- Correlacionar pago con deudas originales

---

## 7. Códigos de Estado de MercadoPago

### 7.1 Estados principales (`status`)

| Status | Descripción | Acción en el Portal |
|--------|-------------|---------------------|
| `approved` | Pago aprobado | ✅ Marcar deudas como pagadas |
| `pending` | Pago pendiente | ⏳ No hacer nada, esperar |
| `rejected` | Pago rechazado | ❌ Log del error |
| `in_process` | En proceso | ⏳ Esperar siguiente webhook |
| `cancelled` | Cancelado | ❌ Log del error |
| `refunded` | Reembolsado | ⚠️ Revertir pago (futuro) |

### 7.2 Detalles de estado (`status_detail`)

| Status Detail | Significado |
|---------------|-------------|
| `accredited` | Acreditado correctamente |
| `pending_contingency` | Procesando pago |
| `pending_review_manual` | En revisión manual |
| `cc_rejected_bad_filled_card_number` | Número de tarjeta incorrecto |
| `cc_rejected_bad_filled_security_code` | CVV incorrecto |
| `cc_rejected_insufficient_amount` | Fondos insuficientes |
| `cc_rejected_other_reason` | Rechazado por otro motivo |

---

## 8. Configuración Requerida

### 8.1 Variables de Entorno del Portal (.env)

```env
# Puerto del servidor
PORT=4000

# URL del API Gateway de MercadoPago
API_GATEWAY_URL=http://localhost:3000

# Identificador del municipio
MUNICIPIO_ID=tinoco

# URL pública del portal (para callbacks)
FRONTEND_PUBLIC_URL=http://localhost:4000

# Base de datos
DB_SERVER=tu-servidor.database.windows.net
DB_NAME=tu_base_datos
DB_USER=tu_usuario
DB_PASSWORD=tu_password
```

### 8.2 Variables de Entorno del API Gateway (.env)

```env
# Puerto del API Gateway
PORT=3000

# Credenciales de MercadoPago
MP_ACCESS_TOKEN=APP_USR-xxx-xxx-xxx
MP_PUBLIC_KEY=APP_USR-xxx-xxx

# Ambiente (sandbox o production)
NODE_ENV=development
```

### 8.3 URLs de Retorno (Configuradas en API Gateway)

Las URLs a donde MercadoPago redirige al usuario:

| Resultado | URL |
|-----------|-----|
| Éxito | `http://localhost:4000/pago/exitoso` |
| Fallo | `http://localhost:4000/pago/fallido` |
| Pendiente | `http://localhost:4000/pago/pendiente` |

---

## 9. Diagrama de Secuencia

```
┌──────────┐       ┌──────────┐       ┌───────────┐       ┌────────────┐
│ USUARIO  │       │  PORTAL  │       │API GATEWAY│       │ MERCADOPAGO│
└────┬─────┘       └────┬─────┘       └─────┬─────┘       └──────┬─────┘
     │                  │                   │                    │
     │ 1. Selecciona    │                   │                    │
     │    deudas        │                   │                    │
     │─────────────────▶│                   │                    │
     │                  │                   │                    │
     │ 2. Click Pagar   │                   │                    │
     │─────────────────▶│                   │                    │
     │                  │                   │                    │
     │                  │ 3. POST /api/pagos│                    │
     │                  │──────────────────▶│                    │
     │                  │                   │                    │
     │                  │                   │ 4. Crear preferencia
     │                  │                   │───────────────────▶│
     │                  │                   │                    │
     │                  │                   │ 5. preference_id   │
     │                  │                   │◀───────────────────│
     │                  │                   │                    │
     │                  │ 6. sandbox_url    │                    │
     │                  │◀──────────────────│                    │
     │                  │                   │                    │
     │ 7. Redirect a MP │                   │                    │
     │◀─────────────────│                   │                    │
     │                  │                   │                    │
     │ 8. Completa pago │                   │                    │
     │─────────────────────────────────────────────────────────▶│
     │                  │                   │                    │
     │                  │                   │ 9. Webhook         │
     │                  │                   │◀───────────────────│
     │                  │                   │                    │
     │                  │10. POST /api/pagos│                    │
     │                  │   /confirmacion   │                    │
     │                  │◀──────────────────│                    │
     │                  │                   │                    │
     │                  │ 11. Actualiza BD  │                    │
     │                  │ (marca pagado)    │                    │
     │                  │                   │                    │
     │ 12. Redirect     │                   │                    │
     │◀────────────────────────────────────────────────────────│
     │   /pago/exitoso  │                   │                    │
     │                  │                   │                    │
```

---

## 📝 Notas Importantes

1. **Idempotencia:** El sistema verifica que un `payment_id` no se procese dos veces.

2. **Ambiente Sandbox:** En desarrollo se usa `sandbox_url`. En producción se usa `payment_url`.

3. **Callback URL:** La URL `/api/pagos/confirmacion` debe ser accesible desde el API Gateway.

4. **Seguridad:** El webhook interno debería validar que la petición viene del API Gateway autorizado.

5. **Logs:** Todos los pasos generan logs en consola para debugging.

---

## 🔗 Archivos Relacionados

| Archivo | Descripción |
|---------|-------------|
| `services/pagos.service.js` | Lógica de confirmación y actualización de BD |
| `services/paymentGateway.service.js` | Comunicación con API Gateway |
| `controllers/payment.controller.js` | Controlador de rutas de pago |
| `routes/payment.routes.js` | Definición de rutas de pago |
| `routes/api/index.js` | Diccionario de API + webhook confirmación |
| `docs/bd/LOGICA_DEUDAS_PAGOS.md` | Documentación de lógica de BD |

---

*Documento generado para facilitar la comprensión del flujo de integración de pagos.*
