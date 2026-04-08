# Contrato de Integración — Portal de Pago ↔ API Gateway Pagos

> Este documento define el contrato completo entre el portal web municipal
> y el API Gateway de pagos. Debe implementarse en AMBOS proyectos.
> Generado en sesión de diseño: 2026-03-31.

---

## Arquitectura general

```
[Contribuyente]
      |
      | (1) Inicia pago en el portal
      ↓
[Portal Web Municipal]  →  (2) POST /api/pagos  →  [API Gateway]  →  [SIRO / Plataforma de pago]
                                                         |
                        (4) Redirect seguro con JWT      |  (3) SIRO notifica al gateway
                        ←─────────────────────────────  ↓
[Contribuyente ve vista de resultado]        (5) POST webhook JWT  →  [Portal Web — backend]
```

**Regla fundamental e innegociable:**
Ninguna plataforma de pago (SIRO y cualquier futura integración) se comunica
JAMÁS de forma directa con el portal. TODO pasa por el gateway.
Esto aplica tanto al redirect del contribuyente como a las notificaciones de resultado.

---

## Flujo A — Redirect del contribuyente

### Cómo funciona

1. El contribuyente completa (o abandona) el pago en la plataforma externa
2. La plataforma redirige al **gateway** (no al portal)
3. El gateway procesa el resultado y redirige al contribuyente al portal
   con un token de un solo uso firmado

### URL de redirect que el gateway envía al contribuyente

```
GET https://{municipio}.alcaldia.com.ar/pagos/{resultado}
    ?ref={external_reference}
    &token={JWT_de_un_solo_uso}
```

Ejemplos:
```
https://elmanzano.alcaldia.com.ar/pagos/exitoso?ref=ELMANZANO-1774990412831-93vweg&token=eyJ...
https://elmanzano.alcaldia.com.ar/pagos/pendiente?ref=ELMANZANO-1774990412831-93vweg&token=eyJ...
https://elmanzano.alcaldia.com.ar/pagos/error?ref=ELMANZANO-1774990412831-93vweg&token=eyJ...
```

### El JWT del redirect

- **Algoritmo**: HS256
- **Clave de firma**: `WEBHOOK_SECRET` + fecha del día (`2026-03-31`)
  → La clave cambia cada día: un token capturado hoy es inválido mañana
- **Expiración**: 10 minutos (el contribuyente debe llegar rápido desde SIRO)
- **Payload**:
```json
{
  "ref": "ELMANZANO-1774990412831-93vweg",
  "municipio_id": "ELMANZANO",
  "estado": "APROBADO",
  "iat": 1774990412,
  "exp": 1774991012
}
```

### Lo que el portal DEBE hacer al recibir el redirect

1. Verificar que el `token` es válido (firma + no expirado)
2. Si el token es inválido → mostrar página de error genérica, NO la vista de resultado
3. Si el token es válido → mostrar la vista correspondiente (`exitoso`, `pendiente`, `error`)
4. **NUNCA actualizar la BD del portal basándose en este redirect**
   La BD se actualiza solo con el webhook server-to-server (Flujo B)

### Por qué esta restricción

La vista de resultado puede usarse como prueba legal ("el contribuyente pagó").
Si esa vista es accesible sin token válido, cualquiera puede mostrarla sin haber pagado.
El token con clave rotativa diaria garantiza que solo el gateway puede generarla.

---

## Flujo B — Webhook server-to-server (la fuente de verdad)

### Cómo funciona

El gateway llama al backend del portal con el resultado del pago.
Esta llamada es server-to-server — el contribuyente no está involucrado.
**Esta es la única fuente de verdad para actualizar la BD del portal.**

### Endpoint que el portal debe implementar

```
POST /api/webhook/pago
Authorization: Bearer {JWT}
Content-Type: application/json
```

La URL completa por municipio se configura en el gateway como variable de entorno:
```
SIRO_ELMANZANO_WEBHOOK_URL=https://elmanzano.alcaldia.com.ar/api/webhook/pago
```

### JWT del webhook

- **Algoritmo**: HS256
- **Clave de firma**: `WEBHOOK_SECRET` + fecha del día (`2026-03-31`)
  → Mismo mecanismo que el redirect. Clave compartida fuera de banda entre ambos proyectos.
- **Expiración**: 5 minutos

### Payload del webhook

```json
{
  "external_reference": "ELMANZANO-1774990412831-93vweg",
  "municipio_id": "ELMANZANO",
  "estado": "APROBADO",
  "pago_exitoso": true,
  "importe": 100.00,
  "nro_comprobante": "TICKET-001----00042",
  "medio_pago": "SIRO",
  "id_operacion": "123456789",
  "fecha_operacion": "2026-03-31T20:57:47.342Z",
  "origen": "WEBHOOK_INMEDIATO"
}
```

### Descripción de campos

| Campo | Tipo | Descripción |
|---|---|---|
| `external_reference` | String | ID único generado por el gateway al crear el pago. Clave para recuperar el ticket en la BD del portal. |
| `municipio_id` | String | Identificador del municipio (ej: `ELMANZANO`, `TINOCO`) |
| `estado` | String | `APROBADO`, `RECHAZADO`, `PENDIENTE`, `EXPIRADO` |
| `pago_exitoso` | Boolean | `true` solo si estado = `APROBADO` |
| `importe` | Decimal | Monto total cobrado |
| `nro_comprobante` | String | Número de comprobante formateado (20 chars) |
| `medio_pago` | String | Plataforma usada. Valor operativo actual: `SIRO`. |
| `id_operacion` | String | ID de la operación en la plataforma de pago |
| `fecha_operacion` | ISO 8601 | Fecha y hora en que se procesó el pago |
| `origen` | String | `WEBHOOK_INMEDIATO` = tiempo real \| `CONCILIACION` = resuelto por cron al día siguiente |

### Lo que el portal DEBE hacer al recibir el webhook

1. Verificar firma JWT con `WEBHOOK_SECRET` + fecha del día
2. Si JWT inválido → responder `401`, no procesar
3. Buscar el ticket por `external_reference` en la BD
4. Si no existe → responder `404` (el gateway reintentará)
5. Si ya fue procesado → responder `200` sin reprocesar (**idempotencia obligatoria**)
6. Actualizar el ticket con el estado recibido
7. Responder `200` al gateway

### Estrategia de reintentos del gateway

Si el portal no responde o devuelve error, el gateway reintenta con backoff exponencial:

```
Intento 1: inmediato
Intento 2: 30 segundos después
Intento 3: 2 minutos después
Intento 4: 10 minutos después
Intento 5: 1 hora después
Si fallan todos: queda pendiente hasta la conciliación matutina
```

---

## Flujo C — Conciliación matutina (cron)

El gateway ejecuta un cron diario que consulta a la plataforma de pago
los pagos procesados del día anterior y resuelve los que quedaron pendientes.

**Horarios de intento**: 07:00, 10:00, 13:00 (hora Argentina)

Si al llegar por conciliación el portal ya procesó el pago (via webhook inmediato),
debe ignorarlo silenciosamente (idempotencia).

El campo `origen: "CONCILIACION"` en el payload indica que llegó por este flujo.
El portal puede usarlo para mostrar al contribuyente "Pago confirmado (procesado el día siguiente)"
en lugar de "Pago confirmado".

---

## Request del portal al gateway — Crear intención de pago

```
POST https://{gateway-url}/api/pagos
Content-Type: application/json
```

### Payload

```json
{
  "municipio_id": "ELMANZANO",
  "codigo_contribuyente": "0000001",
  "importe": 1500.50,
  "concepto": "Tasa municipal Marzo 2026 + Habilitación",
  "nro_comprobante": "TICKET-001",
  "metadata": {
    "conceptos": [
      { "descripcion": "Tasa municipal Marzo 2026", "importe": 1200.00 },
      { "descripcion": "Habilitación comercial", "importe": 300.50 }
    ],
    "periodo": "03/2026"
  }
}
```

**Nota sobre múltiples conceptos**: el portal suma los importes y manda el total en `importe`.
Los conceptos individuales van en `metadata.conceptos` como referencia.
SIRO recibe un único importe — no desglosa conceptos en su plataforma.
El desglose lo muestra el portal con su propia información al confirmar el pago.

### Campos obligatorios

| Campo | Tipo | Reglas |
|---|---|---|
| `municipio_id` | String | Debe coincidir con un municipio configurado en el gateway |
| `codigo_contribuyente` | String numérico | Se paddea a 9 dígitos internamente |
| `importe` | Number | Mayor a 0. Suma de todos los conceptos. |
| `concepto` | String | No vacío. Descripción general visible en SIRO. |
| `nro_comprobante` | String | Cualquier longitud — el gateway lo formatea a 20 chars |

### Response exitoso (201)

```json
{
  "success": true,
  "data": {
    "payment_url": "https://siropagosh.bancoroela.com.ar/Home/Pago/abc123...",
    "hash": "abc123def456...",
    "external_reference": "ELMANZANO-1774990412831-93vweg"
  }
}
```

El portal debe:
1. Guardar `external_reference` en su BD como ID de tracking
2. Redirigir al contribuyente a `payment_url`
3. No guardar el `hash` — eso es interno del gateway

---

## Gestión de tickets en el portal

### Ciclo de vida de un ticket

```
CREADO → (contribuyente va a SIRO) → PENDIENTE → APROBADO / RECHAZADO / EXPIRADO
```

### ¿Cuándo limpiar tickets abandonados?

Un ticket se considera abandonado cuando:
- El contribuyente fue redirigido a la plataforma de pago pero nunca completó el flujo
- No llegó webhook del gateway en X tiempo
- No llegó confirmación por conciliación

**Recomendación**: limpiar (o marcar como `EXPIRADO`) tickets con más de 48 horas
en estado `PENDIENTE` sin resolución. El gateway también tiene su propia lógica
de expiración para pagos pendientes.

### Mostrar estado al contribuyente

Si el contribuyente consulta su deuda y tiene tickets en estado `PENDIENTE`:
mostrar un aviso del estilo:
> "Tiene un pago en proceso de confirmación. Si realizó un pago recientemente,
> el estado se actualizará en las próximas horas."

---

## WEBHOOK_SECRET — Gestión del secreto compartido

- Se genera una vez por municipio: un string aleatorio de al menos 32 caracteres
- Se comparte **fuera de banda** (no por email, no por chat, no en el repo)
- Se configura como variable de entorno en AMBOS proyectos:
  - Gateway: `WEBHOOK_SECRET`
  - Portal: `GATEWAY_WEBHOOK_SECRET` (o el nombre que el portal elija)
- La clave de firma efectiva es: `WEBHOOK_SECRET` + `YYYY-MM-DD` del día actual
- Si se compromete el secreto: se reemplaza en ambos proyectos y se reinician los servicios

---

## Preguntas que el portal debe responder antes de implementar

Estas preguntas surgieron en la sesión de diseño y deben resolverse en el proyecto del portal:

1. **¿Cuánto tiempo guarda un ticket antes de marcarlo como expirado?**
   Recomendación del gateway: 48 horas. ¿Es suficiente para el negocio?

2. **¿Qué muestra el portal en la vista `/pagos/pendiente`?**
   El pago existe en SIRO pero no se confirmó aún (caso fin de semana).
   ¿"Su pago está siendo procesado"? ¿Un número de seguimiento?

3. **¿La idempotencia del webhook se maneja por `external_reference` o por `id_operacion`?**
   Recomendación: por `external_reference` (lo genera el gateway y es único).

4. **¿El portal necesita notificar al contribuyente por email/SMS cuando llega la confirmación por conciliación?**
   Si sí, ese sistema de notificaciones es responsabilidad del portal, no del gateway.

5. **¿Cómo maneja el portal el caso de un contribuyente que generó múltiples tickets
   para el mismo concepto sin pagar ninguno?**
   El gateway no sabe de esto — el portal debe decidir si cancela tickets anteriores
   al crear uno nuevo para el mismo contribuyente + concepto.

---

## Resumen de responsabilidades

| Responsabilidad | Gateway | Portal |
|---|---|---|
| Comunicarse con SIRO / plataformas de pago | ✅ | ❌ |
| Guardar credenciales bancarias | ✅ | ❌ |
| Guardar hash de SIRO | ✅ | ❌ |
| Guardar `external_reference` | ✅ | ✅ |
| Actualizar BD con resultado del pago | ❌ | ✅ |
| Mostrar vista de resultado al contribuyente | ❌ | ✅ |
| Verificar JWT del webhook entrante | ❌ | ✅ |
| Notificar al contribuyente por email/SMS | ❌ | ✅ |
| Conciliación con plataforma de pago | ✅ | ❌ |
| Tabla de deuda del contribuyente | ❌ | ✅ |
