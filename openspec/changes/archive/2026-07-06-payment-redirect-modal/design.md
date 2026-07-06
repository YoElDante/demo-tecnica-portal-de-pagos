# Design: Modal de Redirección al Pago

## Technical Approach

Overlay frontend puro con `position:fixed` y `z-index` alto. El spinner usa animación CSS con `@keyframes spin`. `init.js` abre el modal antes del `fetch POST` a `/pago/iniciar` y lo cierra solo en error o timeout. En caso de éxito, el redirect del navegador reemplaza la página (cierre implícito). El aviso de pruebas se renderiza condicionalmente desde EJS usando `esPruebas`, derivado de `demoModoHabilitado` y `NODE_ENV`.

## Architecture Decisions

| Opción | Tradeoff | Decisión |
|--------|----------|----------|
| Modal inline en `index.ejs` al final del `<body>` | Acoplamiento a la vista principal, pero evita partials innecesarios | ✅ Elegido — un solo `<div>` fijo, sin nueva dependencia de archivos |
| `Promise.race` con `setTimeout(30s)` vs `AbortController` | `AbortController` no cierra el modal; `Promise.race` es más conciso y cubre ambos casos | ✅ `Promise.race` — cierra el modal automáticamente tras timeout |
| CSS en `styles.css` (archivo global existente) vs archivo separado | Archivo separado añade un request HTTP extra; el proyecto ya tiene CSS monolítico con BEM | ✅ `styles.css` — consistente con la práctica actual |
| Pasar `NODE_ENV` como local EJS vs derivar `esPruebas` desde el controller | Pasar `NODE_ENV` expone más info al template de la necesaria | ✅ `esPruebas` booleano en `BASE_RENDER` — un solo campo, condición clara |

## Data Flow

```
Usuario clickea "Ir a Pagar"
       │
       ▼
iniciarPago() en init.js
       │
       ├── 1. abrirOverlay() → muestra .overlay (display:flex)
       │                        focus trap: guarda prevFocus, Tab/Shift+Tab dentro del modal
       │
       ├── 2. Promise.race([
       │        fetch POST /pago/iniciar,
       │        timeout(30_000)
       │     ])
       │         │
       │    ┌────┴────┐
       │    ▼         ▼
       │  Éxito     Error / timeout
       │    │         │
       │    ▼         ▼
       │  redirect  cerrarOverlay()
       │  (window   rehabilita botones
       │   .location .href)  restaura foco original
       │
       └── redirect reemplaza la página (cierre implícito)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `controllers/web.controller.js` | Modify | Agregar `esPruebas: demoModoHabilitado \|\| process.env.NODE_ENV !== 'production'` a `BASE_RENDER` |
| `views/index.ejs` | Modify | Agregar bloque `<div class="overlay">` antes del `</body>`. Condicional EJS: `<% if (esPruebas) { %>` para el aviso |
| `public/stylesheets/styles.css` | Modify | Agregar 4 custom properties en `:root` (backdrop color, bg, radius, spinner). Bloque BEM `.overlay` al final del archivo (~60 líneas) |
| `public/javascripts/modules/pago/init.js` | Modify | Funciones `abrirOverlay()` y `cerrarOverlay()`. Modificar `iniciarPago()`: usar overlay en lugar de qr-container. Agregar `Promise.race` con timeout 30s |

## EJS Conditional: `esPruebas`

```ejs
<% if (typeof esPruebas !== 'undefined' && esPruebas) { %>
  <p class="overlay__test-aviso">La pasarela de pago es de pruebas</p>
<% } %>
```

Sigue el mismo patrón que `demoModoHabilitado` en `index.ejs:260`.

## CSS BEM Structure (nuevas reglas)

```
:root  ← 4 custom properties nuevas
.overlay                     ← backdrop + centrado (position:fixed, z-index:10000)
.overlay__backdrop           ← oscurecedor (inset:0, bg con alpha)
.overlay__contenido          ← caja centrada (bg white, border-radius, padding)
.overlay__spinner            ← círculo CSS animado (border + border-top-color)
  @keyframes overlay-spin    ← rotación 360°
.overlay__mensaje            ← texto principal
.overlay__test-aviso         ← aviso condicional (bg amarillo suave, borde warning)
```

## Accessibility Implementation

- **`role="dialog"`** y **`aria-modal="true"`** en `.overlay__contenido`
- **`aria-labelledby`** apuntando al elemento del mensaje principal
- **`aria-live="polite"`** en el contenedor para anunciar cambios de estado
- **Focus trap**: `abrirOverlay()` guarda `document.activeElement` como `prevFocus`; al abrir, foco va al `h2` del modal. Listener de `keydown`: Tab/Shift+Tab encierran foco entre primer y último elemento enfocable del modal. `cerrarOverlay()` restaura `prevFocus.focus()`

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Manual | Modal + spinner al clickear "Ir a Pagar" | Verificar visualmente en DEMO |
| Manual | Backdrop bloquea interacción con fondo | Click en área fuera del modal — no debe cerrarse |
| Manual | Aviso de pruebas visible en DEMO, oculto en producción | Cambiar `MUNICIPIO` y `NODE_ENV` |
| Manual | Cierre en error de red | Desconectar red antes del POST |
| Manual | Timeout 30s | Simular delay > 30s en backend |
| Manual | Focus trap (Tab/Shift+Tab) | Navegación por teclado — foco no escapa |
| Manual | qr-container sin cambios | Verificar que sigue funcionando |

## Migration / Rollout

No migration required. El `qr-container` existente se preserva sin cambios.

## Open Questions

- [ ] Confirmar que `process.env.NODE_ENV` está disponible en `web.controller.js`. Si no, el valor default será `undefined`, por lo que `!== 'production'` será `true` — mostrando el aviso correctamente como fallback seguro.
