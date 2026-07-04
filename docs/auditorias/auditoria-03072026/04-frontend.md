# 04 — Auditoría de Frontend

## Stack Frontend

- **Renderizado:** EJS server-side (SSR)
- **JS Cliente:** Vanilla JavaScript (sin framework)
- **CSS:** CSS vanilla (2 archivos, BEM-like)
- **Librerías externas:** jsPDF 2.5.1 (CDN), Google Fonts (CDN)
- **Sin bundler, sin transpilador, sin minificación**

---

## Templates EJS

### `views/index.ejs` (316 líneas)

**Bien:**
- HTML semántico con `<header>`, `<main>`, `<footer>`
- Atributos `aria-label` en botones
- `pattern`, `minlength`, `maxlength` en input DNI (validación HTML5 nativa)
- Estados visuales: `form__input--not-found` para contribuyente no encontrado
- Demo mode condicional con `if (demoModoHabilitado)`

**Mal:**
1. **PII expuesta en `<script>` inline** (ver informe de seguridad H1)
2. **Lógica de negocio en template.** Cálculo de `creditosFavor`, `totalCreditoFavor` en EJS (línea 140-141). Esto debería estar en el controller.
3. **Código comentado.** Línea 287-291: botón "Generar QR" con `&& false`. Código muerto visible.
4. **Inline styles.** `style="text-align: center;"`, `style="width: 50px;"` dispersos en el HTML.
5. **Sin meta description.** Solo tiene `<meta charset>` y `<meta viewport>`.
6. **Sin Open Graph / Twitter Cards.** Al compartir el link del portal, no hay preview.

### `views/pago/comprobante.ejs` (483 líneas)
- **Extremadamente largo para un template.** 483 líneas para mostrar un comprobante de pago.
- Mucha lógica de presentación que debería estar en el controller o en partials.

### `views/pago/exitoso.ejs` (352 líneas)
- Similar problema de tamaño. Templates de resultado de pago > 300 líneas.

### `views/pago/pendiente.ejs` (447 líneas)
- Incluye lógica de polling con `setInterval` para verificar estado del pago.
- **Problema:** El polling se hace cada 3 segundos indefinidamente. Sin backoff. Sin timeout máximo.

### `views/partials/demo-panel.ejs` (439 líneas)
- Panel de demo con formulario de simulación. Bien aislado como partial.
- Contiene lógica de contraseña para modo BD modificable — **validación client-side** (frágil).

### `views/error.ejs` (3 líneas)
- Template mínimo que solo muestra mensaje de error. Correcto para evitar leak de información.

---

## JavaScript Frontend

### `public/javascripts/deudas.js` (730 líneas) — Monolítico

**Lo bueno:**
- Funciones bien nombradas y con responsabilidades claras
- Uso de `data-*` attributes para transporte de datos
- PDF generation con jsPDF desde cero (vectorial, texto seleccionable) — impresionante para vanilla JS
- Scroll suave al ticket generado
- `DOMContentLoaded` como entry point

**Lo malo:**
1. **730 líneas en un solo archivo.** Debería ser al menos 3 módulos: `selector-deudas.js`, `ticket.js`, `pdf.js`.
2. **Sin manejo de errores de red.** `generarTicket()` usa `fetch()` sin retry.
3. **`alert()` para errores.** UX pobre. Debería ser un toast o modal inline.
4. **Sin estado global declarado.** Variables como `_sugerenciasCache` (en controller) no son accesibles al frontend.
5. **Cálculos de moneda frágiles.** `extraerNumero()` hace `replace(/\./g, '').replace(/,/g, '.')` que asume formato AR. Si la locale cambia, se rompe.
6. **Sin accesibilidad.** Los mensajes de error con `alert()` no son accesibles para lectores de pantalla.

### `public/javascripts/index.js` (191 líneas)

**Lo bueno:**
- Bien separado de deudas.js
- Manejo del panel de demo (toggle, chips de sugerencias)
- `iniciarPago()` con POST al backend y redirect

**Lo malo:**
- `iniciarPago()` no maneja timeout del fetch
- Sin indicador de carga visual durante el POST de inicio de pago (solo texto "Procesando pago...")

---

## CSS

### `public/stylesheets/styles.css`
- No pude medir líneas pero por la estructura de los templates, estimo 500-800 líneas.
- Usa BEM-like: `.header__logo`, `.deudas__checkbox`, `.form__input--not-found`.

### `public/stylesheets/ticket.css`
- CSS específico para el ticket de pago generado.

**Preocupaciones:**
- Sin variables CSS (custom properties) para theming multi-municipio
- Sin preprocesador (SASS/PostCSS)
- Sin reset/normalize visible en los templates
- Sin media queries documentadas (responsive?)

---

## Performance Frontend

| Métrica | Estado | Detalle |
|---------|--------|---------|
| HTML size | 🟡 | index.ejs ~13KB + deudas dinámicas (puede ser grande con 40+ items) |
| JS size | 🟡 | deudas.js ~25KB sin minificar + jsPDF ~400KB desde CDN |
| CSS size | 🟢 | CSS vanilla, sin frameworks pesados |
| Google Fonts | 🟡 | 2 familias (Oswald, Open Sans) — 3 variantes cada una |
| jsPDF CDN | 🟠 | 400KB descargados siempre, aunque no se use si el usuario no genera PDF |
| Render blocking | 🟡 | Google Fonts en `<head>` bloquean render |
| Sin lazy loading | 🟢 | Imágenes son logos pequeños |

**Recomendación:** Mover jsPDF a carga lazy (solo cuando se hace click en "Descargar PDF"). Diferir Google Fonts con `media="print" onload="this.media='all'"`.

---

## Accesibilidad (A11y)

| Criterio | Estado |
|----------|--------|
| HTML semántico | ✅ |
| `aria-label` en botones | ✅ Parcial |
| Contraste de color | ❓ No verificado |
| Navegación por teclado | ❓ No verificado |
| Focus visible | ❓ No verificado |
| `alt` en imágenes | ❓ No verificado en todos los `<img>` |
| Etiquetas `label` asociadas a inputs | ✅ |
| Mensajes de error accesibles | ❌ Usa `alert()` |
| Skip to content link | ❌ |

---

## Recomendaciones

### Corto Plazo (Sprint 1-2)
1. **Mover jsPDF a carga lazy.** No cargar 400KB en cada page load.
2. **Diferir Google Fonts.** Evitar render-blocking.
3. **Extraer PII del HTML inline.** Usar un endpoint API.

### Mediano Plazo (Sprint 3-5)
4. **Dividir `deudas.js`** en módulos ES6 o al menos archivos separados.
5. **Agregar sistema de notificaciones** (toast) en vez de `alert()`.
6. **Media queries y responsive design.** Verificar comportamiento en mobile.
7. **Agregar `<meta name="description">`** y Open Graph tags.

### Largo Plazo (Sprint 6+)
8. **Bundler (esbuild/vite).** Minificación, tree shaking, code splitting.
9. **Migrar a web components o micro-frontend** para tickets y deudas.
10. **Auditoría de accesibilidad** con axe-core o Lighthouse.
