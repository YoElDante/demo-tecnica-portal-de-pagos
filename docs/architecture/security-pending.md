# Seguridad Pendiente

> Resumen operativo de hardening HTTP, CSRF y protección PII.
> Implementado en SDD `resolver-auditoria-03072026` (fase seguridad de auditoría jul 2026).

## Estado

✅ **Completado** — 2026-07-04. Helmet, CSRF, sanitización PII y logs implementados en `feature/resolver-auditoria-seguridad`.

## Alcance completado

- ✅ `helmet` con CSP, HSTS (producción), X-Frame-Options DENY, noSniff, referrerPolicy.
- ✅ Forzar HTTPS en producción (via HSTS en helmet, no middleware separado).
- ✅ CSP configurado con `'unsafe-inline'` transicional para compatibilidad con EJS.
- ✅ `trust proxy` configurado para Azure Load Balancer.
- ✅ CSRF con `csrf-csrf` (double-submit cookie), exenciones para polling y demo.
- ✅ PII del contribuyente movida a endpoint API protegido (fuera de HTML inline).
- ✅ `safeLog()` — redacción de PII en logs de producción.
- ✅ jsPDF como bundle local (elimina dependencia CDN y simplifica CSP).
- ✅ Google Fonts con `crossorigin="anonymous"`.
- ✅ Body size limits (100kb) + sanitizeInput global.
- ✅ Feature flags: `SECURITY_HELMET_ENABLED`, `SECURITY_CSRF_ENABLED`.

## Checklist

- [x] Instalar `helmet`.
- [x] Configurar CSP, HSTS y headers de seguridad en `middlewares/helmet.config.js`.
- [x] Integrar middlewares de seguridad en `app.js`.
- [x] Agregar CSRF con `csrf-csrf` en formularios y endpoints fetch.
- [x] Mover PII fuera de HTML inline (API + signed cookie).
- [x] Sanitizar logs productivos con `safeLog()`.
- [x] Migrar jsPDF a bundle local (remueve CDN).
- [x] Validar flujo de pago después del cambio (npm run dev OK).

## Referencias

- `openspec/changes/resolver-auditoria-03072026/proposal.md`
- `openspec/changes/resolver-auditoria-03072026/design.md`
- `openspec/changes/resolver-auditoria-03072026/tasks.md`
- `skills/payment-gateway-security/SKILL.md`
- `middlewares/helmet.config.js`
- `middlewares/csrf.js`
- `utils/safeLog.js`

---
> Última actualización: 2026-07-04 | SDD "resolver-auditoria-03072026" | Portal de Pagos Municipal
