# 🗺️ ROADMAP.ai.md

> **Propósito**: Saber exactamente dónde estamos y qué falta hacer
> **Última actualización**: 2026-01-20

---

## 📍 Estado General

| Campo | Valor |
|-------|-------|
| **Proyecto** | demo-portal-de-pago |
| **Estado global** | � En desarrollo activo |
| **Última actividad** | 20 Enero 2026 |
| **Bloqueadores** | Ninguno |

---

## ✅ COMPLETADO (funciona en producción/demo)

### Funcionalidades Core
- [x] Búsqueda de contribuyente por DNI
- [x] Visualización de deudas pendientes
- [x] Cálculo automático de intereses por mora (40% anual)
- [x] Selección múltiple de conceptos a pagar
- [x] Generación de ticket preview en pantalla
- [x] Descarga de ticket en PDF
- [x] Filtro de deudas por tipo (AUAU, ININ, etc.)

### Integración MercadoPago (Fases 1-6)
- [x] **Fase 1**: Configuración base (.env, puerto 4000)
- [x] **Fase 2**: Servicio `paymentGateway.service.js` (comunicación con API)
- [x] **Fase 3**: Controller y rutas de pago
- [x] **Fase 4**: Vistas de resultado (exitoso/fallido/pendiente)
- [x] **Fase 5**: Endpoint webhook `/api/pagos/confirmacion`
- [x] **Fase 6**: Actualización de BD (`pagos.service.js` - Saldo=0, crear cobro)

### Infraestructura
- [x] Arquitectura MVC implementada
- [x] Conexión a Azure SQL funcionando
- [x] Despliegue en Render (demo)
- [x] Repositorio en GitHub

### CSS y Frontend (20 Enero 2026)
- [x] **Migración BEM completa**: Todo el CSS migrado a metodología BEM
- [x] **CSS Responsive**: Ticket-preview funciona en todos los viewports
- [x] **PDF funcionando**: Generación de PDF con jsPDF corregida
- [x] **Lógica Int/Dto corregida**: Cargos en negro, descuentos en verde

---

## 🔲 PENDIENTE (Backlog priorizado)

### 🔴 Prioridad ALTA (necesario para producción)

| # | Tarea | Descripción | Estado |
|---|-------|-------------|--------|
| 1 | **Centralizar config municipio** | Cambiar municipio desde UN solo lugar (variable de entorno) | ✅ Completado |
| 2 | **Tabla TicketsPago** | Crear tabla para registrar tickets generados y pagados | 🔲 Pendiente |
| 3 | **Generar ID único ticket** | Formato: `YYYYMMDDHHMMSS-DNI` (no correlativo) | 🔲 Pendiente |
| 4 | **Registrar tickets pagados** | Al confirmar pago, guardar en tabla TicketsPago | 🔲 Pendiente |

### 🟡 Prioridad MEDIA (mejoras importantes)

| # | Tarea | Descripción | Estimación |
|---|-------|-------------|------------|
| 5 | **Envío de emails** | Comprobante PDF al contribuyente y al municipio | 4-6 hs |
| 6 | **Tasa interés configurable** | Por municipio, no hardcodeada | 1-2 hs |
| 7 | **Nuevos conceptos deuda** | Soportar "Tasa Ambiental" y ajustes históricos | 3-4 hs |
| 8 | **Manejo webhook tardío** | Si el webhook tarda hasta 72hs, el ticket ya expiró | 2-3 hs |

### 🟢 Prioridad BAJA (mejoras futuras)

| # | Tarea | Descripción | Estimación |
|---|-------|-------------|------------|
| 9 | **Limpieza tickets expirados** | Job/script para limpiar tickets >24hs no pagados | 2-3 hs |
| 10 | **Testing E2E** | Tests automatizados del flujo completo | 4-6 hs |
| 11 | **Múltiples cuentas MP** | Cada municipio con su cuenta de MercadoPago | 3-4 hs |

---

## 📋 Detalle de Tareas Pendientes

### ~~Tarea 1: Centralizar Config de Municipio~~ ✅ COMPLETADA

**Implementación** (2026-01-20):
- Creado `config/index.js` como selector central
- Actualizado `models/model.index.js`
- Actualizado `services/paymentGateway.service.js`
- Actualizado `services/ticket.service.js`
- Actualizado `tests/connection.db.test.js`
- Agregada variable `MUNICIPIO` en `.env` y `.env.example`

**Uso**: Cambiar `MUNICIPIO=xxx` en `.env` y reiniciar.

---

### Tarea 2-4: Sistema de Tickets

**Esquema propuesto para tabla `TicketsPago`**:
```sql
CREATE TABLE TicketsPago (
    Id VARCHAR(30) PRIMARY KEY,      -- "20260120143052-12345678"
    FechaGeneracion DATETIME NOT NULL,
    FechaExpiracion DATETIME NOT NULL, -- +24hs
    DNI VARCHAR(10) NOT NULL,
    CodigoCliente VARCHAR(10) NOT NULL,
    ConceptosIds TEXT NOT NULL,       -- JSON: [123, 456, 789]
    MontoTotal DECIMAL(15,2) NOT NULL,
    Estado VARCHAR(20) DEFAULT 'pendiente', -- pendiente|pagado|expirado
    PaymentId VARCHAR(50) NULL,       -- ID de MP cuando se pague
    ExternalReference VARCHAR(50) NULL,
    FechaPago DATETIME NULL,
    EmailContribuyente VARCHAR(100) NULL,
    EmailEnviado BIT DEFAULT 0
);
```

**Formato del ID**: `YYYYMMDDHHMMSS-DNI`
- Ejemplo: `20260120143052-12345678`
- Garantiza unicidad (mismo DNI no puede generar 2 tickets en el mismo segundo)
- Es trazable (sabés cuándo y quién)

---

### Tarea 5: Envío de Emails

**Requiere**:
- Servicio de email (Nodemailer + SMTP o servicio como SendGrid)
- Template HTML para el comprobante
- Adjuntar PDF del ticket con marca "PAGADO"

**Destinatarios**:
1. Contribuyente (email ingresado o de BD)
2. Municipio (email configurado en `municipalidad.config.js`)

---

### Tarea 6: Tasa de Interés Configurable

**Ubicación actual**: `services/deudas.service.js` línea ~17
```javascript
const TASA_INTERES_ANUAL = 40; // Hardcodeado
```

**Propuesta**: Mover a `municipalidad.config.X.js`
```javascript
module.exports = {
  nombre: 'El Manzano',
  // ...
  tasaInteresAnual: 40, // Configurable por municipio
}
```

---

### Tarea 7: Nuevos Conceptos de Deuda

**Requerimiento**: El Manzano quiere agregar:
- "Tasa Ambiental" (nuevo tipo de deuda)
- Ajuste de montos históricos (actualización de valores)

**Implicaciones**:
- ¿Nuevo código TIPO_BIEN? (ej: `TAMB` para Tasa Ambiental)
- ¿Afecta cálculo de intereses?
- ¿Requiere cambios en el software Alcaldía primero?

**Estado**: ⚠️ Requiere definición del cliente

---

### Tarea 8: Webhook Tardío (hasta 72hs)

**Problema**: El ticket tiene validez de 24hs, pero el webhook de MP puede llegar hasta 72hs después.

**Escenarios**:
1. Usuario paga → webhook llega en minutos → ✅ OK
2. Usuario paga → webhook llega en 48hs → ❓ Ticket ya "expiró"

**Solución propuesta**:
- Si el pago fue confirmado por MP (`status=approved`), procesar igual
- El estado "expirado" solo indica que no se puede INICIAR un pago nuevo con ese ticket
- Un ticket con `PaymentId` válido SIEMPRE se procesa

---

## 🎯 Próximo Sprint Sugerido

**Objetivo**: Dejar el proyecto listo para demos con cambio fácil de municipio

1. ✅ Documentación IA (este documento)
2. 🔲 Centralizar config de municipio (Tarea 1)
3. 🔲 Crear tabla TicketsPago (Tarea 2)
4. 🔲 Generar ID único de ticket (Tarea 3)
5. 🔲 Registrar tickets pagados (Tarea 4)

**Tiempo estimado**: 8-12 horas de desarrollo

---

## 📝 Decisiones Técnicas Tomadas

| Decisión | Razón |
|----------|-------|
| IDs de concepto viajan en `metadata` | Para recuperarlos en el webhook y saber qué actualizar |
| Crear registro de COBRO además de UPDATE | Mantener consistencia contable con Alcaldía |
| Usar `payment_id` de MP como `NRO_OPERACION` | Garantiza idempotencia y trazabilidad |
| Ticket válido 24hs | Intereses cambian diariamente |
| ID ticket no correlativo | Evita que se "adivinen" IDs |

---

## ⚠️ Decisiones Pendientes

| Tema | Pregunta | Impacto |
|------|----------|---------|
| Tasa Ambiental | ¿Qué código TIPO_BIEN usar? | Tarea 7 |
| Ajustes históricos | ¿Cómo se calculan? ¿Vienen de Alcaldía? | Tarea 7 |
| Email del municipio | ¿Uno por municipio o centralizado? | Tarea 5 |
| Cuenta MP por municipio | ¿Cada muni tiene su cuenta? | Tarea 11 |
