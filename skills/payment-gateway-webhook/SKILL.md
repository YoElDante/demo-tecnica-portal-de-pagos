---
name: payment-gateway-webhook
description: >
  Contrato de redirect seguro y webhook entre portal y gateway de pagos.
  Trigger: webhook pago, payment webhook, confirm payment, redirect seguro, contrato gateway, procesar pago gateway.
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## When to Use

- Cuando haya que implementar o modificar endpoints de pago.
- Cuando se procese confirmacion de pago desde el gateway.
- Cuando se revisen redirects, JWT, idempotencia o estados de pago.

## Critical Patterns

- El redirect del usuario no actualiza base de datos.
- El webhook server-to-server es la unica fuente de verdad.
- Verificar JWT con clave rotativa derivada de `WEBHOOK_SECRET` y fecha.
- Respetar idempotencia por `id_operacion` o `NRO_OPERACION`.
- Responder correctamente a reintentos del gateway y no reprocesar pagos ya aplicados.

## Commands

```bash
npm run dev
```

## Resources

- **Documentation**: See [references/docs.md](references/docs.md) for local payment contract guidance.