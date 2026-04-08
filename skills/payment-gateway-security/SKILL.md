---
name: payment-gateway-security
description: >
  Hardening de seguridad HTTP del portal de pagos.
  Trigger: helmet, force https, security headers, hardening portal, csp, seguridad portal pagos.
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## When to Use

- Cuando se modifique `app.js` o middlewares de seguridad.
- Cuando se prepare el portal para produccion.
- Cuando se agreguen integraciones externas que afecten CSP, iframes o scripts remotos.

## Critical Patterns

- Forzar HTTPS solo en produccion y contemplando proxy de Azure.
- Usar `helmet` con CSP compatible con MercadoPago u otras pasarelas.
- Mantener `trust proxy` correctamente configurado en App Service.
- Verificar que el endurecimiento no rompa vistas de pago ni assets criticos.

## Commands

```bash
npm install helmet
```

## Resources

- **Documentation**: See [references/docs.md](references/docs.md) for local security guidance.