# Diagnóstico: Ticket vacío después del pago

> **Síntoma**: La página `/pagos/exitoso` muestra monto en cero y conceptos vacíos.
> El comprobante muestra estado "pendiente" en lugar de "aprobado".

---

## ¿Qué está pasando?

El portal busca el ticket con:

```js
obtenerPorExternalReference(externalReference)
// → SELECT * FROM dbo.TicketsPago WHERE external_reference = 'DEMO-xxx'
```

Si devuelve `null`, la vista renderiza vacía. Ambos síntomas (monto=0 y estado pendiente)
son consistentes con **ticket no encontrado por `external_reference`**.

El `external_reference` es el ID generado por el gateway (ej: `DEMO-1710765432-abc123`).
Se guarda en el ticket en `iniciarPago` → `actualizarConReferencia(ticketId, ref)`.
Si esa llamada falla silenciosamente, el ticket queda con `external_reference = NULL`.

---

## Paso 1 — Ver el estado real de los tickets en BD

Conectarte a Azure SQL y correr:

```sql
SELECT TOP 10
    ticket_id,
    ticket_number,
    external_reference,
    status,
    amount_total,
    gateway_provider,
    CASE
        WHEN payload_snapshot IS NULL THEN '❌ NULL'
        WHEN LEN(payload_snapshot) < 10 THEN '⚠️ VACÍO'
        ELSE '✅ TIENE DATOS (' + CAST(LEN(payload_snapshot) AS VARCHAR) + ' chars)'
    END AS snapshot_status,
    created_at_utc
FROM dbo.TicketsPago
ORDER BY ticket_id DESC;
```

### Interpretar resultados

| `external_reference` | `status`    | Diagnóstico |
|----------------------|-------------|-------------|
| `NULL`               | `CREADO`    | ❌ `actualizarConReferencia` no se ejecutó o falló |
| `NULL`               | `PENDIENTE` | ❌ Imposible (status PENDIENTE requiere external_reference) |
| `DEMO-xxx`           | `PENDIENTE` | ⚠️ El webhook del gateway no llegó o falló |
| `DEMO-xxx`           | `APROBADO`  | ✅ Todo OK — el problema es otro (ver Paso 4) |

---

## Paso 2 — Verificar el payload_snapshot

Si el ticket tiene `external_reference` pero la vista igual muestra vacío,
revisar el contenido del snapshot:

```sql
SELECT
    ticket_id,
    ticket_number,
    external_reference,
    status,
    payload_snapshot
FROM dbo.TicketsPago
WHERE external_reference IS NOT NULL
ORDER BY ticket_id DESC;
```

El `payload_snapshot` debería ser un JSON con esta estructura:

```json
{
  "conceptos": [
    { "Detalle": "Tasa Municipal", "Total": 1500.50, ... },
    ...
  ],
  "contribuyente": { "dni": "12345678" },
  "montoTotal": 1500.50
}
```

**Si `payload_snapshot` es NULL o no tiene `conceptos`** → el ticket se creó sin datos.
Buscar errores en los logs del portal al momento de llamar a `iniciarPago`.

---

## Paso 3 — Verificar que el webhook llegó

Si el ticket tiene `external_reference` y `status = PENDIENTE`, el webhook del gateway
no se procesó. Verificar en la tabla de eventos:

```sql
SELECT TOP 20
    e.ticket_id,
    e.event_type,
    e.event_source,
    e.process_result,
    e.error_message,
    e.received_at_utc,
    t.external_reference,
    t.status
FROM dbo.TicketPagoEventos e
JOIN dbo.TicketsPago t ON t.ticket_id = e.ticket_id
ORDER BY e.received_at_utc DESC;
```

- **Sin filas** → el webhook nunca llegó al portal
- **Fila con `process_result = 'APLICADO'`** → llegó y se procesó, pero el status en `TicketsPago` no se actualizó (bug en `actualizarEstadoDesdeGateway`)
- **Fila con `error_message` no nulo** → llegó pero falló por ese error

---

## Paso 4 — Verificar el JWT del redirect

Si el ticket SÍ tiene datos en BD pero la vista igual aparece vacía,
puede ser que el valor de `external_reference` en el JWT no coincida con lo guardado.

En los logs del portal buscar líneas como:

```
⚠️ Redirect inválido a /pagos/exitoso: La referencia del redirect no coincide con el token firmado
```

Si aparece este warning, el token está siendo rechazado y el portal renderiza
la página de error genérico (no la de pago exitoso).

Si el warning no aparece pero igual hay datos vacíos, comparar manualmente:

```sql
-- El external_reference en BD
SELECT external_reference FROM dbo.TicketsPago
WHERE ticket_id = (SELECT MAX(ticket_id) FROM dbo.TicketsPago);
```

Comparar ese valor con el parámetro `?ref=` de la URL que llega al portal.
Deben ser idénticos (case-sensitive).

---

## Paso 5 — Verificar configuración entre proyectos

Confirmar que las variables de entorno estén consistentes:

### En el portal (`demo-portal-de-pago/.env`)
```
GATEWAY_WEBHOOK_SECRET=<el mismo valor que WEBHOOK_SECRET en el gateway>
API_GATEWAY_URL=<URL del gateway — local: http://localhost:3000>
MUNICIPIO=DEMO
PAYMENT_GATEWAY=siro
```

### En el gateway (`api-gateway-pagos/.env` o `.local`)
```
WEBHOOK_SECRET=<el mismo valor que GATEWAY_WEBHOOK_SECRET en el portal>
SIRO_DEMO_BASE_URL=<URL base del portal — local: http://localhost:4000>
```

El gateway deriva del `BASE_URL`:
- Webhook: `http://localhost:4000/api/webhook/pago`
- Redirect OK: `http://localhost:4000/pagos/exitoso`

Si alguna de estas URLs está mal, el webhook va a un destino incorrecto
o el redirect lleva a una página que no existe.

---

## Resumen del flujo esperado

```
1. Portal crea ticket (status: CREADO, external_reference: NULL)
2. Portal llama al gateway → gateway retorna external_reference (ej: DEMO-xxx)
3. Portal llama actualizarConReferencia(ticketId, 'DEMO-xxx')
   → ticket queda: status: PENDIENTE, external_reference: 'DEMO-xxx'
4. Usuario paga en SIRO
5. SIRO redirige al gateway (/api/siro/callback)
6. Gateway consulta estado real a SIRO
7. Gateway hace POST al portal: /api/webhook/pago  ← actualiza status a APROBADO
8. Gateway redirige browser: /pagos/exitoso?ref=DEMO-xxx&token=JWT
9. Portal verifica JWT, busca ticket por external_reference='DEMO-xxx'
   → ticket encontrado, muestra conceptos y monto del payload_snapshot
```

Si el Paso 3 falla → Paso 9 no encuentra el ticket → todo vacío.
Si el Paso 7 falla → Paso 9 encuentra el ticket pero status='PENDIENTE'.
