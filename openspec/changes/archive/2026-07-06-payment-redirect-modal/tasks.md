# Tasks: Modal de redirección al pago

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~170 (4 files) |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | n/a |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: n/a
400-line budget risk: Low

## Phase 1: Backend — variable `esPruebas`

- [ ] 1.1 En `controllers/web.controller.js`, agregar `esPruebas: demoModoHabilitado || process.env.NODE_ENV !== 'production'` al objeto `BASE_RENDER` (línea ~18). Verificar: `renderIndex` pasa `esPruebas` al template.

## Phase 2: HTML — overlay en `views/index.ejs`

- [ ] 2.1 En `views/index.ejs`, agregar bloque `<div class="overlay" id="overlay-pago">` antes del `</body>` con: `role="dialog"`, `aria-modal="true"`, `aria-labelledby="overlay-msg"`. Incluir `.overlay__backdrop`, `.overlay__contenido` con `.overlay__spinner`, `.overlay__mensaje#overlay-msg` y `.overlay__test-aviso` condicional (`<% if (typeof esPruebas !== 'undefined' && esPruebas) { %>`). El overlay arranca con `style="display:none"`.

## Phase 3: CSS — estilos del overlay en `public/stylesheets/styles.css`

- [ ] 3.1 Agregar 4 custom properties en `:root`: `--overlay-backdrop`, `--overlay-bg`, `--overlay-radius`, `--overlay-spinner-color`.
- [ ] 3.2 Agregar bloque BEM `.overlay` (~60 líneas): `.overlay` (fixed, inset:0, z-index:10000, flex center), `.overlay__backdrop` (absolute, bg con alpha), `.overlay__contenido` (relative, bg white, border-radius, padding, max-width), `.overlay__spinner` (border + border-top-color animado), `@keyframes overlay-spin` (rotate 360°), `.overlay__mensaje` (texto principal), `.overlay__test-aviso` (bg amarillo suave, borde warning).

## Phase 4: JS — lógica del modal en `public/javascripts/modules/pago/init.js`

- [ ] 4.1 Agregar función `abrirOverlay()`: muestra `#overlay-pago` (display:flex), guarda `document.activeElement` como `prevFocus`, mueve foco al `h2#overlay-msg`, agrega listener `keydown` para focus trap (Tab/Shift+Tab).
- [ ] 4.2 Agregar función `cerrarOverlay()`: oculta `#overlay-pago` (display:none), remueve listener keydown, restaura `prevFocus.focus()`.
- [ ] 4.3 Modificar `iniciarPago()`: reemplazar lógica de `qr-container`/`pago-loading` por `abrirOverlay()` antes del fetch. Usar `Promise.race([fetch POST, new Promise(timeout 30s)])`. En éxito: `window.location.href` (cierre implícito). En error/timeout: `cerrarOverlay()` + rehabilitar botones + alert.

## Phase 5: Verificación manual

- [ ] 5.1 Ejecutar `npm run dev:demo` y verificar: clic "Ir a Pagar" muestra overlay con spinner + mensaje + aviso "pasarela de pruebas".
- [ ] 5.2 Verificar backdrop bloquea clicks al fondo y Escape no cierra el modal.
- [ ] 5.3 Verificar cierre en error (ej. backend caído) y timeout 30s.
- [ ] 5.4 Verificar `qr-container` existente sigue funcionando sin cambios.
- [ ] 5.5 Verificar focus trap: Tab/Shift+Tab no escapa del modal.
