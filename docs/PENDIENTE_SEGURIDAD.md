# Seguridad Pendiente

> Resumen operativo de hardening.
> El detalle de implementación vive en `openspec/changes/security-hardening/` y en la skill `payment-gateway-security`.

## Estado

El portal todavía tiene pendiente una capa mínima de endurecimiento HTTP para producción.

## Alcance actual

- Agregar `helmet`.
- Forzar HTTPS en producción contemplando proxy de Azure.
- Ajustar CSP para que no rompa SIRO ni assets externos necesarios.
- Configurar `trust proxy` correctamente.

## Checklist breve

- [ ] Instalar `helmet`.
- [ ] Crear `middlewares/forceHttps.js`.
- [ ] Integrar middlewares de seguridad en `app.js`.
- [ ] Validar flujo de pago después del cambio.

## Referencias

- `openspec/changes/security-hardening/proposal.md`
- `openspec/changes/security-hardening/design.md`
- `openspec/changes/security-hardening/tasks.md`
- `skills/payment-gateway-security/SKILL.md`
- `docs/DEPLOY_AZURE.md`
