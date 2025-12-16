# 🚦 Estado del Proyecto - Demo Portal de Pago

> **Última actualización**: 2025-12-16 (Fase 4 completada)
> **Documento para**: IA (lectura prioritaria)

---

## 📍 Ubicación actual

| Campo | Valor |
|-------|-------|
| **Proyecto** | demo-portal-de-pago (Frontend Municipal) |
| **Objetivo** | Integración con API Gateway MercadoPago |
| **Fase actual** | 4 - Vistas de resultado ✅ COMPLETADA |
| **Próxima fase** | 5 - Lógica de procesamiento webhook |
| **Bloqueadores** | Ninguno |

---

## ✅ Completado

- [x] Análisis de requerimientos
- [x] Lectura de `instrucciones.md` de la API Gateway
- [x] Análisis de estructura existente del frontend
- [x] Identificación de archivos a crear/modificar
- [x] Documento de planificación creado (`PLAN_INTEGRACION_MERCADOPAGO.md`)
- [x] Definición de criterio de actualización BD (Saldo=0, FechaPago, NRO_OPERACION, ESTADO_DEUDA)
- [x] **FASE 1 COMPLETADA**:
  - [x] `.env.example` actualizado con variables de API Gateway
  - [x] `.env` configurado para desarrollo (puerto 4000)
  - [x] `bin/www` actualizado puerto default a 4000
  - [x] Servidor verificado corriendo en puerto 4000
- [x] **FASE 2 COMPLETADA**:
  - [x] `axios` instalado como dependencia
  - [x] `services/paymentGateway.service.js` creado
  - [x] Método `createPayment(paymentData)` implementado
  - [x] Manejo de errores y logging incluido
  - [x] Validaciones básicas implementadas
- [x] **FASE 3 COMPLETADA**:
  - [x] `controllers/payment.controller.js` creado
  - [x] `routes/payment.routes.js` creado
  - [x] Rutas registradas en `app.js`
  - [x] Endpoint `/api/pagos/confirmacion` agregado en `routes/api/index.js`
  - [x] Servidor verificado que carga correctamente
- [x] **FASE 4 COMPLETADA**:
  - [x] Carpeta `views/pago/` creada
  - [x] `views/pago/exitoso.ejs` creado (con formulario email)
  - [x] `views/pago/fallido.ejs` creado
  - [x] `views/pago/pendiente.ejs` creado
  - [x] Servidor verificado corriendo en puerto 4000

---

## 📁 Estructura actual relevante

```
demo-portal-de-pago/
├── services/
│   ├── clientes.service.js        ✅ Existe
│   ├── deudas.service.js          ✅ Existe
│   ├── ticket.service.js          ✅ Existe
│   ├── paymentGateway.service.js  ✅ CREADO (Fase 2)
│   └── pagos.service.js           ❌ CREAR (Fase 6)
├── controllers/
│   ├── web.controller.js          ✅ Existe
│   ├── web.ticket.controller.js   ✅ Existe
│   └── payment.controller.js      ✅ CREADO (Fase 3)
├── routes/
│   ├── index.js                   ✅ Existe
│   └── payment.routes.js          ✅ CREADO (Fase 3)
├── views/
│   ├── index.ejs                  ✅ Existe (modificar botón pagar)
│   ├── error.ejs                  ✅ Existe
│   └── pago/                      ✅ CREADO (Fase 4)
│       ├── exitoso.ejs            ✅ CREADO (Fase 4)
│       ├── fallido.ejs            ✅ CREADO (Fase 4)
│       └── pendiente.ejs          ✅ CREADO (Fase 4)
├── models/
│   ├── Cliente.js                 ✅ Tiene campo Email
│   └── ClientesCtasCtes.js        ✅ Campos: Saldo, FechaPago, NRO_OPERACION, ESTADO_DEUDA
└── config/
    └── municipalidad.config.manzano.js  ✅ MUNICIPIO_ID=manzano
```

---

## ⏳ Pendiente (8 Fases)

| Fase | Estado | Descripción |
|------|--------|-------------|
| 1 | ✅ | Configuración Base (.env, puerto 4000) |
| 2 | ✅ | Servicio paymentGateway.service.js |
| 3 | ✅ | Controller + Routes de pago |
| 4 | ✅ | Vistas exitoso/fallido/pendiente |
| 5 | 🔲 | Lógica procesamiento webhook (confirmacion) |
| 6 | 🔲 | Actualización BD (pagos.service.js) |
| 7 | 🔲 | Gestión email contribuyente |
| 8 | 🔲 | Testing E2E |

---

## 🔧 Configuración actual

| Variable | Valor actual | Estado |
|----------|--------------|--------|
| PORT | 4000 | ✅ Configurado |
| API_GATEWAY_URL | `http://localhost:3000` | ✅ Configurado |
| MUNICIPIO_ID | `manzano` | ✅ Configurado |
| FRONTEND_PUBLIC_URL | `http://localhost:4000` | ✅ Configurado |

---

## 🗄️ Modelo de datos relevante

### ClientesCtaCte (actualizar al pagar)
```
IdTrans (PK)     → Identificador único del concepto
Saldo            → Poner en 0 al pagar
FechaPago        → Fecha del pago confirmado
NRO_OPERACION    → external_reference de MP
ESTADO_DEUDA     → Cambiar a "PAGADO"
```

### Cliente (actualizar email)
```
Codigo (PK)      → Código del cliente
Email            → Actualizar si usuario elige guardarlo
```

---

## 🔗 Comunicación con API Gateway

### Frontend → API Gateway
```
POST http://localhost:3000/api/pagos
Body: { municipio_id, contribuyente, conceptos, monto_total, callback_url }
Response: { payment_url, sandbox_url, external_reference }
```

### API Gateway → Frontend (webhook)
```
POST http://localhost:4000/api/pagos/confirmacion
Body: { external_reference, status, payment_id, metadata.conceptos_ids }
```

---

## ⏭️ Próximo paso inmediato

**Iniciar Fase 5**: Lógica de procesamiento webhook
1. Implementar lógica en `payment.controller.js` método `confirmacion()`
2. Validar idempotencia (verificar NRO_OPERACION no procesado)
3. Preparar para integración con `pagos.service.js` (Fase 6)

**Luego Fase 6**: Actualización de BD
1. Crear `services/pagos.service.js`
2. Implementar actualización: `Saldo=0`, `FechaPago`, `NRO_OPERACION`, `ESTADO_DEUDA='PAGADO'`
3. Usar `metadata.conceptos_ids` para identificar registros

---

## 📚 Documentos de referencia

| Documento | Ubicación | Propósito |
|-----------|-----------|-----------|
| Plan completo | `docs/objetivos/PLAN_INTEGRACION_MERCADOPAGO.md` | Detalle de todas las fases |
| Instrucciones API | `docs/objetivos/instrucciones.md` | Contrato de la API Gateway |
| Este archivo | `docs/ai/STATUS.md` | Estado actual para IA |

---

## ⚠️ Notas importantes

1. **Botón "Ir a Pagar"**: Está en `views/index.ejs` línea ~188, actualmente es un `<a>` que abre MP directo. Debe cambiar a POST `/pago/iniciar`

2. **IdTrans en metadata**: Los IDs de conceptos viajan en metadata a MP y regresan con webhook (opción C acordada)

3. **ngrok**: Necesario para desarrollo. Requiere 2 túneles (API:3000, Frontend:4000)

4. **Idempotencia**: Verificar `NRO_OPERACION` antes de procesar para evitar duplicados
