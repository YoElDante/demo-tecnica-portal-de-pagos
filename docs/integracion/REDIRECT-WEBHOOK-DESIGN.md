# Redirect + Webhook Design (Portal)

Actualizado: 2026-04-21

## Decisiones técnicas cerradas

1. El portal modifica BD/deuda **solo** con webhook firmado y cifrado desde el gateway.
2. Las vistas de resultado NO leen un JWT de la URL del navegador. Reciben un código opaco (`?code=...`) que el backend intercambia server-to-server contra el gateway.
3. No se confía en el query string del navegador para confirmar estado de pago.
4. Si el redirect llega antes del webhook, la vista muestra "pendiente de confirmación" y hace polling hasta que el webhook impacta la BD.
5. El JWT de redirect/webhook viaja cifrado (no solo firmado) exclusivamente entre servidores.

## Flujo operativo actual

1. Portal crea ticket local en estado `CREADO`.
2. Portal llama al gateway `POST /api/pagos` → recibe `external_reference` y `payment_url`.
3. Portal asocia `external_reference` al ticket (estado pasa a `PENDIENTE`).
4. Contribuyente es redirigido a `payment_url` (SIRO).
5. SIRO notifica al gateway (callback).
6. Gateway gestiona centralizadamente todos los callbacks de todas las pasarelas:
   - Determina el estado real del pago
   - Notifica al portal via `POST /api/webhook/pago` con JWT cifrado (Flujo B, la fuente de verdad)
   - Redirige al contribuyente al portal con código opaco `?code=...` (Flujo A, solo para UI)
7. El portal recibe el redirect con `?code=...`:
   - El backend llama `POST {API_GATEWAY_URL}/api/pagos/redirect/exchange` autenticado con `GATEWAY_REDIRECT_EXCHANGE_SECRET`
   - El gateway responde con `{ estado, external_reference, importe, municipio_id }`
   - El portal renderiza la vista con esos datos
8. El portal actualiza ticket y deuda **solo** cuando llega el webhook (paso 6, Flujo B).

## Seguridad del redirect

**Problema resuelto**: un JWT firmado (no cifrado) en la URL del navegador expone el payload en historial de navegación, logs de proxy y encabezados Referer.

**Solución implementada**: el gateway genera un código opaco de un solo uso con TTL corto. El payload sensible (estado, referencia, importe) viaja exclusivamente en el exchange server-to-server, autenticado con un secreto dedicado.

```
Navegador recibe:    /pagos/exitoso?code=abc123          ← solo un identificador opaco
Portal backend hace: POST /api/pagos/redirect/exchange   ← autenticado, server-to-server
Gateway responde:    { estado, external_reference, ... } ← datos reales, no en la URL
```

## Gestión centralizada de callbacks en el gateway

El gateway actúa como orquestador de todas las notificaciones entre pasarelas y portales:
- Recibe callbacks de SIRO (y cualquier futura pasarela) en endpoints propios
- Normaliza el resultado al contrato común del sistema
- Distribuye hacia los portales via webhook firmado
- Gestiona reintentos con backoff exponencial si el portal no responde

## Criterios de UX acordados

1. El contribuyente siempre vuelve al portal tras intentar pagar en SIRO.
2. El estado visual prioriza consistencia con la BD local del portal.
3. Se muestra detalle del ticket para captura/descarga/comprobante.
4. Créditos a favor del contribuyente se informan en la pantalla de selección de deudas y se aplican automáticamente al neto a pagar.

## Variables requeridas en el portal

```env
# Comunicación portal → gateway
PAYMENT_GATEWAY=siro
API_GATEWAY_URL=http://localhost:3000
FRONTEND_PUBLIC_URL=http://localhost:4000

# Verificación de webhooks entrantes del gateway
GATEWAY_WEBHOOK_SECRET=<mismo valor que WEBHOOK_SECRET en el gateway>

# Autenticación del exchange de redirect-code
GATEWAY_REDIRECT_EXCHANGE_SECRET=<mismo valor que en el gateway>
```
