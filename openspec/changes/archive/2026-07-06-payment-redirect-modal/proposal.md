# Proposal: Modal de redirección al pago

## Intent

Agregar un modal con backdrop oscurecido, spinner y mensaje claro de redireccion a la plataforma de pago al clickear "Ir a Pagar", con aviso de "pasarela de pruebas" en entornos no productivos. Convive con el `qr-container` existente. Evita que el usuario crea que el proceso esta trabado al crear el ticket y llamar al gateway.

## Scope

### In Scope
- Overlay HTML en `views/index.ejs` con backdrop, spinner CSS y mensajes.
- CSS BEM con custom properties para overlay, backdrop y animacion de spinner.
- JS en `public/javascripts/modules/pago/init.js` para abrir el modal antes del POST y cerrarlo solo en error.
- Aviso "La pasarela de pago es de pruebas" cuando `MUNICIPIO=DEMO` o `NODE_ENV !== 'production'`.
- Accesibilidad basica: `role="dialog"`, `aria-live="polite"`, focus trap.
- Modal no cancelable por el usuario (solo se cierra en error o redirect).
- Convive con `qr-container` existente (no lo reemplaza).
- Respetar multi-municipio: sin textos ni logos hardcodeados.

### Out of Scope
- Backend, servicios o rutas de `/pago/iniciar`.
- Validaciones de deudas o tickets.
- Redirect de retorno desde la plataforma.
- Notificaciones por email.
- Boton de cancelar en el modal.

## Capabilities

### New Capabilities
- `payment-redirect-modal`: UX frontend del overlay de redirección al iniciar pago (spinner, backdrop, mensajes y aviso de modo demo).

### Modified Capabilities
- Ninguna. El contrato portal-gateway cubre el redirect de retorno y webhooks, no la UX de salida; no cambia a nivel spec.

## Approach

Overlay puramente frontend: `<div>` fijo con z-index alto, backdrop semi-opaco y spinner CSS animado. El JS de `init.js` abre el modal antes del POST a `/pago/iniciar` y lo cierra solo en error (en exito el redirect reemplaza la pagina). El aviso se renderiza desde EJS cuando `MUNICIPIO === 'DEMO'` o `NODE_ENV !== 'production'`. Accesibilidad: `role="dialog"`, `aria-live="polite"`, focus trap automatico al abrir.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `views/index.ejs` | Modified | Markup del modal; aviso demo condicional |
| `public/javascripts/modules/pago/init.js` | Modified | Abrir/cerrar modal en lugar de `qr-container` |
| `public/stylesheets/` | Modified | CSS BEM del overlay/spinner |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Modal bloquea la UI si el JS falla | Low | Cerrar en rama de error; timeout de respaldo |

## Rollback Plan

Revertir cambios en `views/index.ejs`, `init.js` y CSS. El `qr-container` original permanece disponible hasta retirarlo en una fase posterior.

## Dependencies

- Ninguna nueva. Sin dependencias npm.

## Success Criteria

- [ ] Al click "Ir a Pagar" aparece el overlay con spinner y mensaje de redireccion.
- [ ] El backdrop oscurece el fondo y el modal queda centrado en pantalla.
- [ ] En entornos no productivos (`MUNICIPIO=DEMO` o `NODE_ENV !== 'production'`) se muestra "La pasarela de pago es de pruebas".
- [ ] En error el overlay se cierra y el boton se rehabilita.
- [ ] El `qr-container` existente sigue funcionando sin cambios.
- [ ] Sin cambios en backend ni en el contrato portal-gateway.
- [ ] Accesibilidad basica: `role="dialog"`, `aria-live`, focus trap.

## Decisiones de UX (confirmadas por el usuario)

- Modal solo al iniciar el pago, no en el redirect de retorno.
- Aviso de pruebas: `MUNICIPIO=DEMO` o `NODE_ENV !== 'production'`.
- No cancelable por el usuario (sin boton cerrar ni Escape).
- Accesibilidad basica requerida (`role="dialog"`, `aria-live`, focus trap).
- Convive con `qr-container` (no lo reemplaza).
