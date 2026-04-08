# 📋 Plan de Integración con API Gateway MercadoPago

> **Proyecto**: demo-portal-de-pago (Frontend Municipal)  
> **Fecha de creación**: 13 de diciembre de 2025  
> **Versión**: 1.0.0  
> **Estado**: 📋 Planificación

---

## 📑 Índice

1. [Resumen del Objetivo](#1-resumen-del-objetivo)
2. [Arquitectura de la Integración](#2-arquitectura-de-la-integración)
3. [Flujo Completo del Pago](#3-flujo-completo-del-pago)
4. [Archivos a Crear/Modificar](#4-archivos-a-crearmodificar)
5. [Fases de Desarrollo](#5-fases-de-desarrollo)
6. [Detalles Técnicos por Fase](#6-detalles-técnicos-por-fase)
7. [Configuración de Desarrollo](#7-configuración-de-desarrollo)
8. [Criterios de Aceptación](#8-criterios-de-aceptación)
9. [Checklist de Progreso](#9-checklist-de-progreso)

---

## 1. Resumen del Objetivo

### ¿Qué vamos a hacer?

Integrar el frontend municipal (`demo-portal-de-pago`) con el API Gateway (`api-gateway-mp`) para permitir que los contribuyentes paguen sus deudas a través de MercadoPago.

### Resultado esperado

1. Usuario busca sus deudas por DNI ✅ (ya funciona)
2. Usuario ve el ticket con los conceptos seleccionados ✅ (ya funciona)
3. Usuario hace click en "Ir a Pagar" → **NUEVO**
4. El frontend envía datos a la API Gateway → **NUEVO**
5. Usuario es redirigido a MercadoPago → **NUEVO**
6. Usuario paga en MercadoPago
7. Usuario vuelve al portal (página de resultado) → **NUEVO**
8. API Gateway notifica al frontend que el pago fue exitoso → **NUEVO**
9. Frontend actualiza la BD (saldo = 0) → **NUEVO**
10. Usuario ingresa su email para recibir comprobante → **NUEVO**
11. Se envía el ticket con marca de agua "PAGADO" → **FUTURO (Fase 2)**

---

## 2. Arquitectura de la Integración

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FLUJO DE PAGO COMPLETO                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐         ┌──────────────┐         ┌──────────────┐        │
│  │   FRONTEND   │         │  API GATEWAY │         │  MERCADOPAGO │        │
│  │  (puerto 4000)│         │ (puerto 3000)│         │              │        │
│  └──────┬───────┘         └──────┬───────┘         └──────┬───────┘        │
│         │                        │                        │                │
│         │  1. POST /api/pagos    │                        │                │
│         │  (datos del pago)      │                        │                │
│         │───────────────────────>│                        │                │
│         │                        │  2. Crear preferencia  │                │
│         │                        │───────────────────────>│                │
│         │                        │                        │                │
│         │                        │  3. preference_id +    │                │
│         │                        │     payment_url        │                │
│         │                        │<───────────────────────│                │
│         │  4. Respuesta con      │                        │                │
│         │     payment_url        │                        │                │
│         │<───────────────────────│                        │                │
│         │                        │                        │                │
│         │  5. Redirect a MP ─────────────────────────────>│                │
│         │                        │                        │                │
│         │                        │                        │ 6. Usuario     │
│         │                        │                        │    paga        │
│         │                        │                        │                │
│         │  7. Redirect back_url  │                        │                │
│         │<────────────────────────────────────────────────│                │
│         │                        │                        │                │
│         │                        │  8. Webhook (async)    │                │
│         │                        │<───────────────────────│                │
│         │                        │                        │                │
│         │  9. POST /api/pagos/   │                        │                │
│         │     confirmacion       │                        │                │
│         │<───────────────────────│                        │                │
│         │                        │                        │                │
│         │  10. Actualiza BD      │                        │                │
│         │      (Saldo = 0)       │                        │                │
│         │                        │                        │                │
└─────────────────────────────────────────────────────────────────────────────┘
```

### URLs en desarrollo (con ngrok)

| Servicio | Puerto Local | URL Pública (ngrok) |
|----------|--------------|---------------------|
| API Gateway | 3000 | `https://[random].ngrok-free.app` |
| Frontend | 4000 | `https://[otro-random].ngrok-free.app` |

> ⚠️ **Importante**: Necesitamos DOS túneles ngrok, uno para cada servicio.

---

## 3. Flujo Completo del Pago

### Paso a paso detallado

```
USUARIO                    FRONTEND                 API GATEWAY              MERCADOPAGO
   │                          │                          │                       │
   │ 1. Click "Ir a Pagar"    │                          │                       │
   │─────────────────────────>│                          │                       │
   │                          │                          │                       │
   │                          │ 2. POST /api/pagos       │                       │
   │                          │   {                      │                       │
   │                          │     municipio_id,        │                       │
   │                          │     contribuyente,       │                       │
   │                          │     conceptos,           │                       │
   │                          │     monto_total,         │                       │
   │                          │     callback_url         │                       │
   │                          │   }                      │                       │
   │                          │─────────────────────────>│                       │
   │                          │                          │                       │
   │                          │                          │ 3. createPreference() │
   │                          │                          │──────────────────────>│
   │                          │                          │                       │
   │                          │                          │ 4. preference_id      │
   │                          │                          │<──────────────────────│
   │                          │                          │                       │
   │                          │ 5. { payment_url }       │                       │
   │                          │<─────────────────────────│                       │
   │                          │                          │                       │
   │ 6. Redirect a MP         │                          │                       │
   │<─────────────────────────│                          │                       │
   │                          │                          │                       │
   │ 7. Paga en MercadoPago ──────────────────────────────────────────────────>│
   │                          │                          │                       │
   │ 8. Redirect /pago/exitoso│                          │                       │
   │<──────────────────────────────────────────────────────────────────────────│
   │                          │                          │                       │
   │                          │                          │ 9. Webhook            │
   │                          │                          │<──────────────────────│
   │                          │                          │                       │
   │                          │ 10. POST /api/pagos/     │                       │
   │                          │     confirmacion         │                       │
   │                          │<─────────────────────────│                       │
   │                          │                          │                       │
   │                          │ 11. Actualiza BD         │                       │
   │                          │     (Saldo = 0)          │                       │
   │                          │                          │                       │
   │ 12. Ve página de éxito   │                          │                       │
   │     + input para email   │                          │                       │
   │<─────────────────────────│                          │                       │
   │                          │                          │                       │
   │ 13. Ingresa email        │                          │                       │
   │─────────────────────────>│                          │                       │
   │                          │                          │                       │
   │                          │ 14. Actualiza email      │                       │
   │                          │     en tabla Clientes    │                       │
   │                          │                          │                       │
   │ 15. Recibe ticket PDF    │                          │                       │
   │     con marca "PAGADO"   │                          │                       │
   │<─────────────────────────│                          │                       │
```

---

## 4. Archivos a Crear/Modificar

### 📁 Archivos NUEVOS a crear

| Archivo | Descripción |
|---------|-------------|
| `services/paymentGateway.service.js` | Servicio para comunicarse con la API Gateway |
| `services/pagos.service.js` | Lógica de negocio para actualizar BD post-pago |
| `controllers/payment.controller.js` | Controlador para manejar rutas de pago |
| `routes/payment.routes.js` | Definición de rutas de pago |
| `views/pago/exitoso.ejs` | Página de pago exitoso |
| `views/pago/fallido.ejs` | Página de pago fallido |
| `views/pago/pendiente.ejs` | Página de pago pendiente |

### 📝 Archivos a MODIFICAR

| Archivo | Modificación |
|---------|--------------|
| `.env.example` | Agregar variables de API Gateway y municipio |
| `.env` | Configurar variables para desarrollo |
| `app.js` | Registrar nuevas rutas de pago |
| `views/partials/ticket-preview.ejs` | Verificar que el botón "Ir a Pagar" use la nueva ruta |

---

## 5. Fases de Desarrollo

### 📊 Resumen de Fases

| Fase | Nombre | Descripción | Estimación |
|------|--------|-------------|------------|
| **1** | Configuración Base | Variables de entorno, ngrok, estructura | 30 min |
| **2** | Servicio de Pago | Comunicación frontend → API Gateway | 1 hora |
| **3** | Controlador y Rutas | Endpoints del frontend | 1 hora |
| **4** | Vistas de Resultado | Páginas exitoso/fallido/pendiente | 1 hora |
| **5** | Confirmación de Pago | Endpoint para recibir confirmaciones | 1 hora |
| **6** | Actualización de BD | Marcar deudas como pagadas | 1 hora |
| **7** | Gestión de Email | Input, guardado y envío (parcial) | 1 hora |
| **8** | Testing E2E | Pruebas del flujo completo | 1 hora |

**Total estimado**: ~8 horas de desarrollo

---

## 6. Detalles Técnicos por Fase

### 📌 FASE 1: Configuración Base

**Objetivo**: Preparar el entorno de desarrollo

#### Tareas:

- [ ] **1.1** Agregar variables de entorno en `.env.example`
  ```env
  # API Gateway
  API_GATEWAY_URL=http://localhost:3000
  
  # Municipio (viene de municipalidad.config.*.js)
  MUNICIPIO_ID=manzano
  
  # URLs públicas para desarrollo (ngrok)
  FRONTEND_PUBLIC_URL=http://localhost:4000
  ```

- [ ] **1.2** Configurar `.env` para desarrollo local

- [ ] **1.3** Verificar que el puerto sea 4000 en `bin/www`

- [ ] **1.4** Documentar cómo levantar ngrok para el frontend

#### Archivos afectados:
- `.env.example`
- `.env`
- `bin/www` (verificar puerto)

---

### 📌 FASE 2: Servicio de Payment Gateway

**Objetivo**: Crear el servicio que se comunica con la API

#### Tareas:

- [ ] **2.1** Crear `services/paymentGateway.service.js`
  
  **Funciones a implementar**:
  ```javascript
  // Envía datos de pago a la API Gateway
  async function createPayment(paymentData) {
    // POST a API_GATEWAY_URL/api/pagos
    // Retorna: { payment_url, sandbox_url, external_reference }
  }
  ```

- [ ] **2.2** Implementar manejo de errores y logging

- [ ] **2.3** Implementar timeout y reintentos básicos

#### Dependencias necesarias:
```bash
npm install axios  # Si no está instalado
```

#### Archivos a crear:
- `services/paymentGateway.service.js`

---

### 📌 FASE 3: Controlador y Rutas de Pago

**Objetivo**: Crear los endpoints que maneja el frontend

#### Tareas:

- [ ] **3.1** Crear `controllers/payment.controller.js`
  
  **Métodos a implementar**:
  ```javascript
  // Inicia el proceso de pago
  async iniciarPago(req, res)
  
  // Recibe confirmación de la API Gateway
  async confirmacion(req, res)
  
  // Renderiza página de éxito
  async pagoExitoso(req, res)
  
  // Renderiza página de fallo
  async pagoFallido(req, res)
  
  // Renderiza página de pendiente
  async pagoPendiente(req, res)
  ```

- [ ] **3.2** Crear `routes/payment.routes.js`
  
  **Rutas a definir**:
  ```javascript
  POST /pago/iniciar           → iniciarPago
  POST /api/pagos/confirmacion → confirmacion (para la API)
  GET  /pago/exitoso           → pagoExitoso
  GET  /pago/fallido           → pagoFallido
  GET  /pago/pendiente         → pagoPendiente
  ```

- [ ] **3.3** Registrar rutas en `app.js`

#### Archivos a crear:
- `controllers/payment.controller.js`
- `routes/payment.routes.js`

#### Archivos a modificar:
- `app.js`

---

### 📌 FASE 4: Vistas de Resultado

**Objetivo**: Crear las páginas que ve el usuario después de pagar

#### Tareas:

- [ ] **4.1** Crear carpeta `views/pago/`

- [ ] **4.2** Crear `views/pago/exitoso.ejs`
  
  **Contenido**:
  - ✅ Mensaje de éxito
  - 📋 Número de referencia (`external_reference`)
  - 💰 Monto pagado
  - 📧 Input para email (con valor de BD si existe)
  - ☑️ Checkbox "Guardar este email" (marcado por defecto)
  - 🔘 Botón "Enviar comprobante"
  - 🏠 Botón "Volver al inicio"

- [ ] **4.3** Crear `views/pago/fallido.ejs`
  
  **Contenido**:
  - ❌ Mensaje de error
  - 📋 Número de referencia
  - ℹ️ Posibles causas del rechazo
  - 🔄 Botón "Reintentar"
  - 🏠 Botón "Volver al inicio"

- [ ] **4.4** Crear `views/pago/pendiente.ejs`
  
  **Contenido**:
  - ⏳ Mensaje de pago pendiente
  - 📋 Número de referencia
  - ℹ️ Instrucciones (ej: "El pago se acreditará en 1-2 días hábiles")
  - 🏠 Botón "Volver al inicio"

#### Archivos a crear:
- `views/pago/exitoso.ejs`
- `views/pago/fallido.ejs`
- `views/pago/pendiente.ejs`

---

### 📌 FASE 5: Endpoint de Confirmación

**Objetivo**: Recibir notificaciones de pago desde la API Gateway

#### Tareas:

- [ ] **5.1** Implementar `POST /api/pagos/confirmacion` en el controlador

  **Datos que recibe**:
  ```json
  {
    "external_reference": "manzano-1702134567890-abc123",
    "status": "approved",
    "payment_id": "1234567890",
    "transaction_amount": 10000,
    "date_approved": "2025-12-13T10:30:00.000Z",
    "metadata": {
      "municipio_id": "manzano",
      "contribuyente_dni": "12345678"
    }
  }
  ```

- [ ] **5.2** Validar que la notificación sea legítima

- [ ] **5.3** Guardar información del pago (para relacionar con actualización BD)

- [ ] **5.4** Responder `{ received: true }` a la API

#### Consideración importante:
> La confirmación llega de forma **asíncrona** (webhook). Puede llegar ANTES o DESPUÉS de que el usuario vuelva a la página de éxito. Hay que manejar ambos casos.

---

### 📌 FASE 6: Actualización de Base de Datos

**Objetivo**: Marcar las deudas como pagadas según el criterio existente del sistema

#### Criterio de pago existente en BD:
> Las deudas se consideran **pendientes** cuando `Saldo != 0`
> Las deudas se consideran **pagadas** cuando `Saldo = 0`

#### Campos disponibles en `ClientesCtaCte` para registrar el pago:
| Campo | Tipo | Uso |
|-------|------|-----|
| `Saldo` | DECIMAL | **Poner en 0** para marcar como pagado |
| `FechaPago` | DATE | Fecha en que se realizó el pago |
| `NRO_OPERACION` | STRING(50) | Guardar `external_reference` de MP |
| `ESTADO_DEUDA` | STRING(20) | Actualizar a "PAGADO" |

#### Tareas:

- [ ] **6.1** Crear `services/pagos.service.js`
  
  **Funciones a implementar**:
  ```javascript
  // Marca los conceptos como pagados por sus IdTrans
  async marcarComoPagado(idTransArray, paymentInfo)
  // paymentInfo = { external_reference, payment_id, date_approved }
  
  // Verifica si ya fue procesado (idempotencia)
  async yaFueProcesado(external_reference)
  ```

- [ ] **6.2** Implementar lógica para actualizar `ClientesCtaCte`
  
  **Campos a actualizar por cada IdTrans**:
  ```sql
  UPDATE ClientesCtaCte 
  SET 
    Saldo = 0,
    FechaPago = @date_approved,
    NRO_OPERACION = @external_reference,
    ESTADO_DEUDA = 'PAGADO'
  WHERE IdTrans IN (@ids)
  ```

- [ ] **6.3** Implementar idempotencia
  
  > Verificar si `NRO_OPERACION` ya existe antes de procesar.
  > Si existe, retornar éxito sin modificar (ya fue procesado).

#### Archivos a crear:
- `services/pagos.service.js`

#### Modelo de datos afectado:
- Tabla `ClientesCtaCte` → Campos: `Saldo`, `FechaPago`, `NRO_OPERACION`, `ESTADO_DEUDA`

---

### 📌 FASE 7: Gestión de Email

**Objetivo**: Capturar y actualizar email del contribuyente

#### Tareas:

- [ ] **7.1** En página de éxito, mostrar input de email
  - Autocompletar con `Cliente.Email` si existe
  - Checkbox "Guardar siempre este email" (marcado por defecto)

- [ ] **7.2** Crear endpoint `POST /pago/guardar-email`
  
  **Datos que recibe**:
  ```json
  {
    "dni": "12345678",
    "email": "nuevo@email.com",
    "guardar": true
  }
  ```

- [ ] **7.3** Si `guardar === true`, actualizar `Cliente.Email`

- [ ] **7.4** Preparar estructura para envío de email (implementación en Fase 2 del proyecto)

#### Archivos a modificar:
- `controllers/payment.controller.js`
- `routes/payment.routes.js`
- `views/pago/exitoso.ejs`

#### Modelo de datos afectado:
- Tabla `Clientes` → Campo `Email`

---

### 📌 FASE 8: Testing End-to-End

**Objetivo**: Verificar que todo el flujo funciona correctamente

#### Tareas:

- [ ] **8.1** Levantar ambos servicios (frontend + API Gateway)

- [ ] **8.2** Levantar ngrok para ambos (2 túneles)

- [ ] **8.3** Configurar URLs en `.env` de ambos proyectos

- [ ] **8.4** Probar flujo completo:
  1. Buscar DNI con deudas
  2. Generar ticket
  3. Click en "Ir a Pagar"
  4. Verificar redirección a MercadoPago (sandbox)
  5. Pagar con tarjeta de prueba
  6. Verificar redirección a página de éxito
  7. Verificar que la BD se actualizó (Saldo = 0)
  8. Probar input de email

- [ ] **8.5** Probar casos de error:
  - Pago rechazado
  - Pago pendiente
  - Error de conexión con API

---

## 7. Configuración de Desarrollo

### Levantar el entorno completo

```bash
# Terminal 1: API Gateway
cd api-gateway-mp
npm run dev
# Puerto 3000

# Terminal 2: Frontend Municipal
cd demo-portal-de-pago
npm run dev
# Puerto 4000

# Terminal 3: ngrok para API Gateway
ngrok http 3000
# Copiar URL pública

# Terminal 4: ngrok para Frontend
ngrok http 4000
# Copiar URL pública
```

### Variables de entorno necesarias

#### En `demo-portal-de-pago/.env`:
```env
# Puerto
PORT=4000

# Base de datos (ya configurado)
DB_HOST=...
DB_NAME=...
DB_USER=...
DB_PASS=...

# API Gateway
API_GATEWAY_URL=http://localhost:3000
# En desarrollo con ngrok:
# API_GATEWAY_URL=https://[random].ngrok-free.app

# Identificación del municipio
MUNICIPIO_ID=manzano

# URL pública del frontend (para callback)
FRONTEND_PUBLIC_URL=http://localhost:4000
# En desarrollo con ngrok:
# FRONTEND_PUBLIC_URL=https://[otro-random].ngrok-free.app
```

#### En `api-gateway-mp/.env`:
```env
# URLs de redirección (apuntan al frontend)
MP_SUCCESS_URL=http://localhost:4000/pago/exitoso
MP_FAILURE_URL=http://localhost:4000/pago/fallido
MP_PENDING_URL=http://localhost:4000/pago/pendiente

# En desarrollo con ngrok del frontend:
# MP_SUCCESS_URL=https://[frontend-ngrok].ngrok-free.app/pago/exitoso
# MP_FAILURE_URL=https://[frontend-ngrok].ngrok-free.app/pago/fallido
# MP_PENDING_URL=https://[frontend-ngrok].ngrok-free.app/pago/pendiente
```

### Tarjetas de prueba de MercadoPago

| Tipo | Número | CVV | Vencimiento | Resultado |
|------|--------|-----|-------------|-----------|
| Mastercard | 5031 7557 3453 0604 | 123 | 11/25 | Aprobado |
| Visa | 4509 9535 6623 3704 | 123 | 11/25 | Rechazado |

---

## 8. Criterios de Aceptación

### ✅ El desarrollo estará completo cuando:

1. [ ] Usuario puede hacer click en "Ir a Pagar" y es redirigido a MercadoPago
2. [ ] Después de pagar, usuario vuelve a página de éxito/fallo/pendiente
3. [ ] La BD se actualiza (Saldo = 0) cuando el pago es aprobado
4. [ ] Usuario puede ingresar su email en página de éxito
5. [ ] El email se guarda en la BD si elige la opción
6. [ ] El flujo funciona con ngrok en ambiente de desarrollo
7. [ ] No hay errores en consola durante el flujo normal

### ⚠️ Fuera del alcance de esta fase:

- Envío real de emails (se preparará la estructura)
- Generación de PDF con marca de agua "PAGADO"
- Envío de email al municipio y alcaldía
- Manejo de reembolsos

---

## 9. Checklist de Progreso

### Fase 1: Configuración Base
- [ ] 1.1 Variables en .env.example
- [ ] 1.2 Configurar .env desarrollo
- [ ] 1.3 Verificar puerto 4000
- [ ] 1.4 Documentar ngrok

### Fase 2: Servicio Payment Gateway
- [ ] 2.1 Crear paymentGateway.service.js
- [ ] 2.2 Manejo de errores
- [ ] 2.3 Timeout y reintentos

### Fase 3: Controlador y Rutas
- [ ] 3.1 Crear payment.controller.js
- [ ] 3.2 Crear payment.routes.js
- [ ] 3.3 Registrar en app.js

### Fase 4: Vistas de Resultado
- [ ] 4.1 Crear carpeta views/pago/
- [ ] 4.2 Crear exitoso.ejs
- [ ] 4.3 Crear fallido.ejs
- [ ] 4.4 Crear pendiente.ejs

### Fase 5: Endpoint Confirmación
- [ ] 5.1 Implementar POST /api/pagos/confirmacion
- [ ] 5.2 Validar notificación
- [ ] 5.3 Guardar info del pago
- [ ] 5.4 Responder a la API

### Fase 6: Actualización BD
- [ ] 6.1 Crear pagos.service.js
- [ ] 6.2 Implementar actualización Saldo
- [ ] 6.3 Implementar idempotencia

### Fase 7: Gestión de Email
- [ ] 7.1 Input email en página éxito
- [ ] 7.2 Endpoint guardar-email
- [ ] 7.3 Actualizar Cliente.Email
- [ ] 7.4 Preparar estructura envío

### Fase 8: Testing
- [ ] 8.1 Levantar servicios
- [ ] 8.2 Configurar ngrok
- [ ] 8.3 Configurar URLs
- [ ] 8.4 Probar flujo completo
- [ ] 8.5 Probar casos de error

---

## 📝 Notas Adicionales

### Sobre ngrok

ngrok es una herramienta que crea un "túnel" desde internet hacia tu computadora local. Esto es necesario porque:

1. **MercadoPago necesita enviar webhooks** a una URL pública
2. **La API Gateway necesita notificar al frontend** también por una URL pública
3. En desarrollo local, `localhost` no es accesible desde internet

**Limitación del plan gratuito**: La URL cambia cada vez que reinicias ngrok. Hay que actualizar los `.env` cuando esto pase.

### Sobre la sincronización de datos

El webhook de MercadoPago es **asíncrono**. Puede llegar:
- **Antes** de que el usuario vuelva a la página de éxito
- **Después** de que el usuario ya esté viendo la página

Por eso, la página de éxito debe:
1. Mostrar el mensaje de éxito basándose en el `status` del query param
2. La actualización de BD se hace cuando llega el webhook (no en la página de éxito)

### Sobre el external_reference

Este es el identificador único que conecta todo:
- Lo genera la API Gateway: `{municipio_id}-{timestamp}-{random}`
- Ejemplo: `manzano-1702468293847-x7k9m`
- Se usa para:
  - Relacionar el pago con los conceptos
  - Buscar en la BD qué actualizar (campo `NRO_OPERACION`)
  - Mostrar al usuario como "número de operación"
  - Verificar idempotencia (no procesar dos veces)

### Sobre los IdTrans y la metadata

Los `IdTrans` de los conceptos seleccionados viajan en la metadata a MercadoPago y regresan con el webhook:

```javascript
// Al crear preferencia (metadata enviada)
metadata: {
  municipio_id: "manzano",
  contribuyente_dni: "12345678",
  conceptos_ids: [101, 102, 103]  // Array de IdTrans
}

// Al recibir confirmación (metadata recibida)
// Se usa conceptos_ids para saber qué filas actualizar en ClientesCtaCte
```

### Sobre el botón "Ir a Pagar"

Ubicación: `views/index.ejs` línea ~188

```html
<a id="pay-button" href="https://mercadopago.com.ar" ...>
  💳 Ir a Pagar
</a>
```

**Cambio necesario**: Convertir de `<a>` a `<button>` o `<form>` que haga POST a `/pago/iniciar` con los datos del ticket.

---

> **Siguiente paso**: Confirmar este plan y comenzar con la Fase 1.
