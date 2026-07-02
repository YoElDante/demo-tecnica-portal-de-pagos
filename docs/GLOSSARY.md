# 📖 Glosario de Dominio — Portal de Pagos Municipal

> **Propósito**: Referencia centralizada de términos, códigos y conceptos del dominio de pagos municipales.
> **Última actualización**: 2026-07-02

---

## Términos de negocio

| Término | Definición |
|---------|------------|
| **Contribuyente** | Persona física o jurídica que tiene deudas con el municipio. Se identifica por DNI/CUIT. |
| **Deuda** | Obligación de pago registrada en el sistema Alcaldía. Puede incluir capital, intereses y multas. |
| **Concepto** | Rubro individual que compone una deuda (ej: "Tasa Municipal Marzo 2026", "Habilitación Comercial"). |
| **Ticket de pago** | Documento que agrupa uno o más conceptos seleccionados por el contribuyente para pagar. Tiene validez limitada (hasta las 23:59 del día de emisión). |
| **Mora / Interés** | Recargo diario sobre deuda vencida. La tasa es configurable por municipio (`TASA_INTERES_ANUAL`, default 40%). |
| **Comprobante** | Constancia de pago exitoso, generada tras la confirmación del webhook. |

---

## Códigos de dominio

### `CodMovim` — Tipo de movimiento contable

| Código | Significado |
|--------|-------------|
| `H` | Haber / Deuda — el contribuyente debe este monto |
| `D` | Debe / Cobro — el contribuyente pagó este monto |

> Al registrar un pago, se debe actualizar la deuda (H) Y registrar el cobro (D). No alcanza con una sola operación.

### `TIPO_BIEN` — Tipo de bien/tasa

Códigos de cuatro caracteres usados en la BD de Alcaldía:

| Código | Descripción |
|--------|-------------|
| `AUAU` | Automotor |
| `ININ` | Inmueble |
| `CICI` | Comercio e Industria |
| `OBSA` | Obra Sanitaria |
| `CACA` | Cementerio |
| `CEM1` | Cementerio (variante) |
| `PEPE` | Pequeños Permisos |

---

## Flujo de pago

| Término | Definición |
|---------|------------|
| **Gateway de pagos** | Servicio intermedio (`api-gateway-pagos`) que orquesta la comunicación con plataformas de pago. El portal **nunca** habla directo con SIRO. |
| **SIRO** | Plataforma de pago del Banco Roela. Pasarela activa para procesar pagos municipales. |
| **Redirect (Flujo A)** | El contribuyente vuelve al portal desde SIRO con un código opaco (`?code=...`). El backend del portal intercambia ese código contra el gateway. **NO actualiza BD.** |
| **Webhook (Flujo B)** | Notificación server-to-server del gateway al portal con JWT cifrado. **Única fuente de verdad** para actualizar la BD del portal. |
| **Conciliación (Flujo C)** | Cron diario del gateway que consulta pagos pendientes y los resuelve. Intentos a las 07:00, 10:00, 13:00 (ART). |
| **Código opaco (code)** | Identificador de un solo uso generado por el gateway para el redirect. No contiene datos sensibles. El portal lo intercambia via `POST /api/pagos/redirect/exchange`. |
| **Exchange** | Llamada server-to-server autenticada donde el portal envía el `code` y recibe los datos reales del pago. |

---

## Estados de ticket

| Estado | Significado |
|--------|-------------|
| `CREADO` | Ticket generado. Aún no tiene `external_reference`. |
| `PENDIENTE` | `external_reference` asignado. Contribuyente fue redirigido a SIRO. Se espera webhook o conciliación. |
| `APROBADO` | Pago confirmado por webhook. Deuda actualizada en BD. |
| `RECHAZADO` | Pago rechazado por la plataforma o el gateway. |
| `EXPIRADO` | Ticket abandonado (48+ horas en PENDIENTE sin resolución). |

---

## Identificadores

| Término | Formato | Definición |
|---------|---------|------------|
| `external_reference` | `{MUNICIPIO}-{timestamp}-{random}` (ej: `ELMANZANO-1774990412831-93vweg`) | ID único generado por el gateway al crear la intención de pago. Clave para tracking y webhook. |
| `id_operacion` / `NRO_OPERACION` | String | ID de la operación en la plataforma de pago (SIRO). Usado para idempotencia. |
| `nro_comprobante` | 20 caracteres (ej: `TICKET-001----00042`) | Número de comprobante formateado por el gateway. |
| `ticket_number` | Secuencial | Número secuencial del ticket en el portal (generado localmente). |

---

## Seguridad

| Término | Definición |
|---------|------------|
| **JWT cifrado** | Token que protege el payload en tránsito (no solo firmado). Usado en webhooks y exchange. Clave: `WEBHOOK_SECRET` + `YYYY-MM-DD` (rota diariamente). |
| **Idempotencia** | Propiedad que garantiza que reprocesar un mismo pago no genere efectos duplicados. Se verifica por `external_reference`. |
| **WEBHOOK_SECRET** | Secreto compartido entre gateway y portal para firmar/cifrar JWTs. Mínimo 32 caracteres. |
| **GATEWAY_REDIRECT_EXCHANGE_SECRET** | Secreto dedicado para autenticar el exchange server-to-server del redirect. Distinto al WEBHOOK_SECRET. |

---

## Configuración y despliegue

| Término | Definición |
|---------|------------|
| **MUNICIPIO** | Variable de entorno que selecciona el municipio activo. Controla datos visuales (nombre, logo). |
| **DEMO_MUNICIPIO** | Cuando `MUNICIPIO=demo`, esta variable aplica el branding de otro municipio sin cambiar credenciales de BD. |
| **municipiosDisponibles** | Array en `config/index.js` que lista todos los municipios registrados. |
| **App Service** | Servicio de Azure que hostea una instancia del portal por municipio. Un App Service = un municipio. |

---

## Referencias

- [CONTRACT-PORTAL-GATEWAY.md](CONTRACT-PORTAL-GATEWAY.md) — Contrato completo portal↔gateway
- [LOGICA_DEUDAS_PAGOS.md](bd/LOGICA_DEUDAS_PAGOS.md) — Reglas de deuda, mora y registración
- [AGENTS.md](../AGENTS.md) — Reglas globales y convenciones del proyecto
