# 🎯 PROJECT_CONTEXT.ai.md

> **Propósito**: Contexto compacto para que una IA entienda rápidamente el proyecto
> **Última actualización**: 2026-01-20
> **Autor**: Dante Marcos Delprato

---

## 📌 ¿Qué es este proyecto?

**Portal de Pago Web Municipal** - Permite a contribuyentes consultar y pagar sus deudas municipales online.

### Relación con otros sistemas

```
┌─────────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│  SOFTWARE ALCALDÍA  │      │   ESTE PROYECTO  │      │  API-GATEWAY-MP │
│  (Escritorio)       │      │  (Portal Web)    │      │  (Nuestro)      │
│                     │      │                  │      │                 │
│  Genera la BD ──────┼─────▶│  Lee deudas      │      │  Comunica con   │
│  (Azure SQL)        │      │  Registra pagos  │─────▶│  MercadoPago    │
│                     │      │                  │      │                 │
└─────────────────────┘      └──────────────────┘      └─────────────────┘
                                     │
                                     ▼
                             ┌──────────────────┐
                             │   MERCADOPAGO    │
                             │   (Externo)      │
                             └──────────────────┘
```

- **Alcaldía**: Software de escritorio que genera/administra la BD. Este portal es complementario.
- **API-Gateway-MP**: Otro proyecto nuestro que intermedia con MercadoPago.
- **Ambos proyectos (Alcaldía y Portal) trabajan sobre la MISMA BD**.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Backend | Node.js + Express |
| Vistas | EJS (server-side rendering) |
| ORM | Sequelize |
| BD | SQL Server (Azure SQL) |
| HTTP Client | Axios (para API Gateway) |
| Arquitectura | MVC |

---

## 🔄 Flujo Principal del Usuario

```
1. Contribuyente ingresa su DNI
         ↓
2. Sistema consulta BD → muestra tabla de deudas (con intereses calculados)
         ↓
3. Contribuyente selecciona conceptos a pagar
         ↓
4. Click "Generar Ticket" → ve preview del ticket en pantalla
         ↓
5. Opciones: [Descargar PDF] o [Ir a Pagar]
         ↓
6. Click "Ir a Pagar" → POST a API Gateway → obtiene URL de MercadoPago
         ↓
7. Redirect a MercadoPago → usuario paga
         ↓
8. MercadoPago redirige a /pago/exitoso (o /fallido, /pendiente)
         ↓
9. API Gateway envía webhook → actualizamos BD (Saldo=0)
```

---

## 🗄️ Modelo de Datos Clave

### Tabla: `ClientesCtaCte` (cuenta corriente)
```
IdTrans (PK)      - ID único de cada movimiento
Codigo            - FK al cliente
CodMovim          - 'H' = Haber (deuda) | 'D' = Debe (cobro/pago)
Saldo             - Monto pendiente (0 = pagado)
EsPago            - 0 = no pagado | 1 = pagado
FechaPago         - Fecha de pago (null si no pagó)
NRO_OPERACION     - ID de MercadoPago (para idempotencia)
TIPO_BIEN         - Tipo de deuda (AUAU, ININ, OBSA, etc.)
ANO_CUOTA         - Año del período
NRO_CUOTA         - Número de cuota (0-12)
Ejercicio         - Año fiscal donde impacta el pago
```

### Tabla: `Clientes`
```
Codigo (PK)       - Código único del contribuyente
DNI               - Documento de identidad
Nombre, Apellido  - Datos personales
Email             - Para envío de comprobantes (a implementar)
```

### Tipos de Deuda (TIPO_BIEN)
| Código | Descripción |
|--------|-------------|
| AUAU | Automotores |
| ININ | Serv. Propiedad (Inmuebles) |
| CICI | Comercio e Industria |
| OBSA | Servicio de Agua |
| CACA | Catastro |
| CEM1 | Cementerio |
| PEPE | Licencias / Tasas |

---

## 📁 Estructura del Proyecto

```
demo-portal-de-pago/
├── config/
│   ├── database.config.manzano.js       # Conexión BD municipio Manzano
│   ├── database.config.sanjosedelassalinas.js
│   ├── municipalidad.config.manzano.js  # Datos del municipio (nombre, logo, etc.)
│   ├── municipalidad.config.sanjosedelassalinas.js
│   └── MUNICIPIO_CONFIG.md              # Documentación de cómo cambiar municipio
├── controllers/
│   ├── web.controller.js          # Renderiza index, busca por DNI
│   ├── web.ticket.controller.js   # Genera ticket preview
│   └── payment.controller.js      # Inicia pago, recibe webhook, vistas resultado
├── services/
│   ├── clientes.service.js        # Busca clientes
│   ├── deudas.service.js          # Consulta deudas, calcula intereses
│   ├── ticket.service.js          # Genera datos para ticket
│   ├── pagos.service.js           # Confirma pagos, actualiza BD
│   └── paymentGateway.service.js  # Comunica con API Gateway
├── models/
│   ├── Cliente.js
│   ├── ClientesCtasCtes.js
│   └── model.index.js             # ⚠️ AQUÍ se cambia el municipio activo (temporal)
├── routes/
│   ├── index.js                   # GET /, POST /buscar, POST /generar-ticket
│   └── payment.routes.js          # /pago/iniciar, /pago/exitoso, etc.
├── views/
│   ├── index.ejs                  # Página principal
│   ├── partials/ticket-preview.ejs
│   └── pago/
│       ├── exitoso.ejs
│       ├── fallido.ejs
│       └── pendiente.ejs
├── public/
│   ├── javascripts/deudas.js      # Lógica frontend (selección, pago)
│   └── stylesheets/
└── docs/
    ├── ai/                        # Documentación para IA
    │   ├── PROJECT_CONTEXT.ai.md  # (este archivo)
    │   ├── ROADMAP.ai.md          # Estado y próximos pasos
    │   └── QUICK_RESUME.ai.md     # Para retomar rápido
    ├── bd/
    │   └── LOGICA_DEUDAS_PAGOS.md # Lógica detallada de BD
    └── objetivos/
        ├── PLAN_INTEGRACION_MERCADOPAGO.md
        └── instrucciones.md       # Contrato API Gateway
```

---

## ⚙️ Variables de Entorno (.env)

```env
# Base de datos (credenciales en .env, NO en código)
DB_USER=usuario
DB_PASS=contraseña

# Puerto del servidor
PORT=4000

# API Gateway (otro proyecto nuestro)
API_GATEWAY_URL=http://localhost:3000

# Identificación del municipio
MUNICIPIO_ID=manzano

# URL pública del frontend (para callbacks)
FRONTEND_PUBLIC_URL=http://localhost:4000
```

---

## 🔢 Cálculo de Intereses

**Archivo**: `services/deudas.service.js`
**Tasa actual**: 40% anual (configurable)

```javascript
const TASA_INTERES_ANUAL = 40;  // Línea ~17
const TASA_DIARIA = TASA_INTERES_ANUAL / 100 / 365;

// Interés = Importe × TASA_DIARIA × DíasMora
```

---

## 🔗 Comunicación con API Gateway

### Envío (Portal → API Gateway)
```
POST {API_GATEWAY_URL}/api/pagos
Body: {
  municipio_id, municipio_nombre,
  contribuyente: { nombre, email, dni },
  conceptos: [{ id, descripcion, monto }],
  monto_total,
  callback_url,
  metadata: { conceptos_ids: [IdTrans...] }
}
Response: { payment_url, sandbox_url, external_reference }
```

### Recepción (API Gateway → Portal)
```
POST /api/pagos/confirmacion
Body: {
  external_reference, status, payment_id,
  transaction_amount, date_approved,
  metadata: { conceptos_ids: [...] }
}
```

---

## ⚠️ Puntos Críticos para IA

1. **Cambio de municipio**: Actualmente es manual en `models/model.index.js` (línea 10-11). Ver `config/MUNICIPIO_CONFIG.md` para la solución propuesta.
2. **Idempotencia**: Verificar `NRO_OPERACION` antes de procesar pagos duplicados
3. **Ejercicio fiscal**: Siempre usar año actual al registrar pagos
4. **Tasa de interés**: Puede variar por municipio (actualmente fija en 40%)
5. **Ticket válido 24hs**: Los intereses se recalculan diariamente

---

## 📚 Documentos Relacionados

| Documento | Propósito |
|-----------|-----------|
| `docs/ai/ROADMAP.ai.md` | Estado actual y próximos pasos |
| `docs/ai/QUICK_RESUME.ai.md` | Para retomar después de una pausa |
| `docs/bd/LOGICA_DEUDAS_PAGOS.md` | Detalle técnico de la lógica de BD |
| `docs/objetivos/PLAN_INTEGRACION_MERCADOPAGO.md` | Plan original de integración |
| `config/MUNICIPIO_CONFIG.md` | Cómo cambiar entre municipios |
