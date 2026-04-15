# Redirect + Webhook Design (Portal)

## Decisiones técnicas cerradas

1. El portal modifica BD/deuda solo con webhook firmado desde gateway.
2. Las vistas de resultado validan JWT de redirect y luego leen ticket desde BD.
3. No se confía en query string para confirmar estado de pago.
4. Si el redirect llega antes del webhook, la vista muestra pendiente de confirmación.

## Flujo operativo

1. Portal crea ticket local en estado CREADO.
2. Gateway devuelve external_reference y portal lo asocia al ticket (estado PENDIENTE).
3. SIRO redirige al gateway tras intento de pago.
4. Gateway consulta estado real y notifica webhook al portal.
5. Portal actualiza ticket y deuda solo en APROBADO.
6. Gateway redirige al contribuyente a /pagos/exitoso|fallido|pendiente.
7. El portal renderiza datos del ticket local (ticket number, referencia, monto, conceptos).

## Criterios de UX acordados

1. El contribuyente siempre vuelve al portal tras intentar pagar en SIRO.
2. El estado visual prioriza consistencia con BD local del portal.
3. Se muestra detalle del ticket para captura/descarga/comprobante por email.

## Variables mínimas para pruebas locales

- PAYMENT_GATEWAY=siro
- API_GATEWAY_URL=http://localhost:3000
- FRONTEND_PUBLIC_URL=http://localhost:4000
- GATEWAY_WEBHOOK_SECRET=<mismo valor que WEBHOOK_SECRET del gateway>

## Skills usados en esta implementación

- skills/siro-integration/SKILL.md
- skills/nodejs-express/SKILL.md

## Memoria operativa (engram local)

- Todas las variantes .env quedaron en SIRO.
- Las vistas finales ahora se alimentan de ticket en BD por external_reference.
- La ruta /pagos/exitoso degrada a pendiente si el webhook aún no impactó.
