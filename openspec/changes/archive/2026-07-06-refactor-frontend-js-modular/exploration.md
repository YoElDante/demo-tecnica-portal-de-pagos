## Exploration: Refactor Frontend JS — Modular Architecture

### Current State

The frontend JavaScript consists of 3 handcrafted files (~978 lines total) plus a 365KB third-party jsPDF bundle, all loaded via `<script defer>` tags in the `<head>` of a single EJS view (`views/index.ejs`). There is zero build tooling — files are served as-is by `express.static('public')`. All functions are global IIFE bindings polluting `window`, with cross-file dependencies relying on script load order. Two inline `<script>` blocks in EJS partials (`demo-panel.ejs`) set global state (`window.DEMO_PANEL`) read by the main JS files. There is significant logic duplication between `index.js` and `deudas.js`.

### Affected Areas

- `public/javascripts/index.js` — 237 lines, mixed concerns (PII loading, demo UI toggle, debt collection, payment initiation, scroll helper)
- `public/javascripts/deudas.js` — 731 lines, mixed concerns (checkbox selection, total calculation, ticket generation API call, PDF generation with jsPDF, event binding)
- `public/javascripts/csrf-helper.js` — 10 lines, single pure function (the only well-modularized file)
- `public/javascripts/vendor/jspdf.umd.min.js` — 365KB third-party, loaded as UMD global
- `views/index.ejs` — 328 lines, the main view that loads all JS files in `<head>` in strict order
- `views/partials/demo-panel.ejs` — 439 lines (includes inline `<script>` setting `window.DEMO_PANEL`)
- `views/pago/pendiente.ejs` — 447 lines, has its own self-contained inline polling script (no shared dependency)
- `openspec/changes/refactor-frontend-js-modular/` — new change directory

---

### 1. Full Dependency Map

#### `public/javascripts/index.js` (237 lines)

| Function/Block | Lines | Calls | DOM Read/Write | API Calls | Global State | Pure/Effect |
|---|---|---|---|---|---|---|
| DOMContentLoaded listener | 17-41 | `getCsrfToken()` | Reads `body.dataset.codigo` | `GET /api/contribuyente/{codigo}` | Writes `contribuyenteData` | Effect (fetch + assignment) |
| Demo info card IIFE | 46-74 | `aplicarEstado()` | Reads `demo-info-body`, `demo-info-toggle`, `demo-info-toggle-icon`; reads/writes `localStorage` | — | — | Effect (DOM + storage) |
| `seleccionarContribuyente(dni)` | 82-85 | — | Writes `#dni.value`, submits `#form-buscar` | — | — | Effect (DOM submit) |
| `recopilarIdTransSeleccionados()` | 90-106 | — | Reads `.deudas__checkbox[data-idtrans]:checked`, `.closest('tr')`, `dataset.total`, `dataset.idtrans` | — | — | Effect (DOM query) |
| `recopilarCreditosFavorVisibles()` | 108-128 | — | Reads `tr[data-total-deuda]`, `dataset.idtrans`, `td` cells | — | — | Effect (DOM query) |
| `recopilarConceptosParaPago()` | 130-151 | — | Reads checked checkboxes, `closest('tr')`, `td` cells, dataset values | — | — | Effect (DOM query) |
| `iniciarPago()` | 156-229 | `recopilarIdTransSeleccionados()`, `recopilarCreditosFavorVisibles()`, **`extraerNumero()`** (from deudas.js), `recopilarConceptosParaPago()`, `getCsrfToken()` | Reads `#total-final`, `#qr-container`, `#pago-loading`, buttons | `POST /pago/iniciar` | Reads `window.DEMO_PANEL`, `contribuyenteData` | Effect (DOM + fetch) |
| `volverArriba()` | 235-237 | — | — | — | — | Effect (scroll) |

#### `public/javascripts/deudas.js` (731 lines)

| Function/Block | Lines | Calls | DOM Read/Write | API Calls | Global State | Pure/Effect |
|---|---|---|---|---|---|---|
| `obtenerCheckboxesConceptos()` | 11-13 | — | Reads `.deudas__checkbox[data-idtrans]` | — | — | Effect (DOM query) |
| `obtenerCheckboxesConceptosMarcados()` | 15-17 | — | Reads `.deudas__checkbox[data-idtrans]:checked` | — | — | Effect (DOM query) |
| `obtenerCreditoAutomaticoVisible()` | 19-31 | — | Reads `tr[data-total-deuda]:visible` | — | — | Effect (DOM query) |
| `actualizarTotal()` | 33-56 | `obtenerCheckboxesConceptosMarcados()`, `obtenerCreditoAutomaticoVisible()`, `actualizarCheckboxTodos()`, `actualizarContadores()` | Writes `#total-final.textContent` | — | — | Effect (DOM write) |
| `actualizarCheckboxTodos()` | 58-73 | — | Reads/Writes `#checkbox-todos.checked/.indeterminate` | — | — | Effect (DOM read/write) |
| `toggleTodos()` | 75-83 | `actualizarTotal()` | Reads `#checkbox-todos.checked`, writes fila checkboxes | — | — | Effect (DOM write) |
| `actualizarContadores()` | 85-97 | — | Reads filas, writes `#contador-deudas-total`, `#contador-deudas-seleccionadas` | — | — | Effect (DOM write) |
| `parsearFechaParaOrden(fechaStr)` | 108-116 | — | — | — | — | **Pure** |
| `recopilarConceptosSeleccionados()` | 122-164 | `obtenerCheckboxesConceptosMarcados()`, `extraerTextoDetalle()`, `extraerNumero()`, `extraerNumeroConSigno()`, `parsearFechaParaOrden()` | Reads checkboxes, `closest('tr')`, `td` cells | — | — | Effect (DOM query) |
| `extraerTextoDetalle(celda)` | 171-176 | — | — | — | — | **Pure** (string manipulation) |
| `extraerNumero(texto)` | 183-190 | — | — | — | — | **Pure** |
| `extraerNumeroConSigno(celda)` | 197-204 | `extraerNumero()` | Reads `celda.classList`, `celda.textContent` | — | — | Effect (reads DOM element) |
| `obtenerDatosContribuyente()` | 210-218 | — | Reads `#dni.value`, `#nombre.value` | — | — | Effect (DOM read) |
| `generarTicket()` | 223-302 | `recopilarConceptosSeleccionados()`, `obtenerDatosContribuyente()`, `getCsrfToken()` | Reads/Writes `#ticket-preview-container`, buttons | `POST /generar-ticket` | — | Effect (DOM + fetch) |
| `descargarPDF()` | 307-676 | `obtenerDatosContribuyente()`, jsPDF API | Reads `#ticket-container`, `#btn-descargar-pdf`, `#btn-descargar-pdf-bottom`, reads `.ticket__*` element data for PDF | — | `window.jspdf` (UMD global) | Effect (DOM + PDF generation) |
| DOMContentLoaded init | 683-731 | `actualizarTotal()`, `obtenerCheckboxesConceptos()`, `toggleTodos()`, `generarTicket()`, `descargarPDF()` | Binds events to checkboxes, `#checkbox-todos`, `#filtro-tipo`, `#btn-generar-ticket`, download buttons | — | — | Effect (event binding) |

#### `public/javascripts/csrf-helper.js` (10 lines)

| Function | Lines | Calls | DOM | API | Global | Pure/Effect |
|---|---|---|---|---|---|---|
| `getCsrfToken()` | 7-9 | — | Reads `input[name="_csrf"]` | — | — | Effect (DOM read, but idempotent) |

### 2. EJS View Map

| EJS View | Loads Which JS | Script Location | Globals Set Inline |
|---|---|---|---|
| `views/index.ejs` (main) | `jspdf.umd.min.js` (defer), `csrf-helper.js` (defer), `deudas.js` (defer), `index.js` (defer) — all in `<head>` | `<head>` with `defer` — order matters | `<script>var contribuyenteData = <%- JSON.stringify(...) %></script>` (line 321-324, fallback when no COOKIE_SECRET) |
| `views/partials/demo-panel.ejs` | Self-contained inline `<script>` | Inline at end of partial | `window.DEMO_PANEL = { resultado: 'real', modificaBD: false }` (line 336) |
| `views/pago/pendiente.ejs` | Self-contained inline `<script>` | Inline at end of `<body>` | `ref`, `token`, `code` from EJS locals, used for polling `fetch('/api/tickets/estado')` |
| `views/pago/comprobante.ejs` | None | No `<script>` tags except `window.print()` | None |
| `views/pago/exitoso.ejs` | None | — | — |
| `views/pago/fallido.ejs` | None | — | — |
| `views/pago/error-generico.ejs` | None | — | — |
| `views/error.ejs` | None | — | — |
| `views/partials/whatsapp-button.ejs` | None | — | — |
| `views/partials/demo-result-badge.ejs` | None | — | — |
| `views/partials/ticket-preview.ejs` | None | — | — |

**Key detail**: The EJS view uses **inline `onclick`** to call global functions:
- `seleccionarContribuyente(dni)` (line 132)
- `iniciarPago()` (lines 272, 287)
- `volverArriba()` (line 290)

These `onclick` bindings mean the functions MUST remain globally accessible — ES modules would break them unless the module entry explicitly attaches to `window`.

### 3. Build Setup Analysis

**Current State:**
- **Build step**: None. Zero build config files exist (no webpack, vite, rollup, esbuild, gulp, babel, tsconfig).
- **Serve**: `express.static(path.join(__dirname, 'public'))` on line 102 of `app.js`
- **Script loading**: 4 `<script defer>` tags in `<head>` of `index.ejs` — strict load order required because `index.js` depends on functions defined in `deudas.js` and `csrf-helper.js`
- **Bundler recommendations** based on project constraints:

| Approach | Pros | Cons | Complexity |
|---|---|---|---|
| **1. Keep `<script defer>`** (no build) | Zero setup, instant dev, matches current "12-factor simplicity" | Global namespace pollution, no tree-shaking, jsPDF stays as UMD global, manual dependency order | None |
| **2. ES modules with `<script type="module">`** | Clean `import`/`export`, no build step, native browser support, solves global pollution | Need to update all `onclick` handlers in EJS (or use `addEventListener`), jsPDF must be importable (not UMD), order resolved by imports | **Low** |
| **3. Vite** | Fast dev server, HMR, ESM output, minimal config | Adds dev dependency (npm), requires output dir, overkill for 978 lines of JS | Medium |
| **4. esbuild** | Minimal config, fastest bundler, good for small projects | Still adds build step, needs npm script, not as well-known as Vite | Low-Medium |
| **5. Rollup** | Great tree-shaking | Too much config for this size | Medium-High |

**Recommendation**: **Approach 2** (ES modules, no build step) as Phase 1 — it's the simplest migration with immediate benefits. If the codebase grows significantly, **Vite** (Approach 3) becomes justified later.

**jsPDF import challenge**: Currently loaded as UMD global (`window.jspdf`). To use ES modules, you'd need either:
- `import('javascripts/vendor/jspdf.umd.min.js')` dynamic import (works but ugly)
- Better: install `jspdf` via npm and `import` from there (adds build step though)
- Or keep jsPDF as a separate `<script>` tag outside the module system (ugly but practical)

### 4. Responsibility Matrix

#### Single Responsibility Principle Violations

**`deudas.js` (731 lines) — 4 concerns mixed:**

| Concern | Lines | % of File |
|---|---|---|
| DOM selection/checkbox management | 11-97 | ~12% |
| Domain logic (date parsing, currency parsing, text extraction) | 108-218 | ~15% |
| API interaction (ticket generation fetch) | 223-302 | ~11% |
| PDF generation (jsPDF layout, rasterization) | 307-676 | **~50%** |
| Event binding/initialization | 683-731 | ~7% |

**`index.js` (237 lines) — 3 concerns mixed:**

| Concern | Lines | % of File |
|---|---|---|
| PII loading (fetch + contribuyenteData) | 17-41 | ~10% |
| Demo info card toggle | 46-74 | ~12% |
| Debt collection helpers | 90-151 | ~26% |
| Payment initiation (fetch + UI orchestration) | 156-229 | ~31% |
| Scroll helper | 235-237 | ~1% |

### 5. Duplication Report

| Logic | `index.js` | `deudas.js` | Notes |
|---|---|---|---|
| **Currency parsing** | `extraerNumero()` — **NOT defined** in index.js, it CALLS the function from deudas.js (line 170) | `extraerNumero()` — defined at line 183-190 | **Functional dependency, not duplication** — but creates a fragile cross-file coupling |
| **Checked checkbox iteration** | `recopilarIdTransSeleccionados()` (line 90-106) — reads `.deudas__checkbox[data-idtrans]:checked`, gets `dataset.idtrans` | `obtenerCheckboxesConceptosMarcados()` (line 15-17) — same selector, returns checked checkboxes | **Partial duplication** — index.js additionally reads `dataset.total` and `display:none` check, deudas.js just returns raw NodeList |
| **Visible credit rows** | `recopilarCreditosFavorVisibles()` (line 108-128) — reads `tr[data-total-deuda]:not([hidden])`, checks `totalFila < 0` | `obtenerCreditoAutomaticoVisible()` (line 19-31) — same selector, sums negative totals | **Near-identical logic** — index.js returns objects with id/descripcion/monto, deudas.js returns a sum |
| **Concepto collection from DOM** | `recopilarConceptosParaPago()` (line 130-151) — reads checkboxes, builds concept array with id/descripcion/monto | `recopilarConceptosSeleccionados()` (line 122-164) — reads checkboxes, builds richer concept array with 8 fields, sorts by idBien+date | **Similar structure, different output** — index.js builds payment payload, deudas.js builds ticket payload |
| **Hidden row filter** | Used in 3 functions as `fila.style.display !== 'none'` | Used in 5 functions as `!fila.style.display === 'none'` | **Pattern duplication** — should be `function isRowVisible(row)` |
| **Contribuyente data from DOM** | `iniciarPago()` uses `contribuyenteData` global (from fetch or inline) | `obtenerDatosContribuyente()` (line 210-218) reads `#dni` and `#nombre` from DOM | **Different sources** — data flow inconsistency |

**Duplication severity: Medium.** The three `recopilar*` functions in `index.js` and their counterparts in `deudas.js` could be unified. The `extraerNumero` cross-file dependency is risky. Hidden-row filtering is duplicated across 8 call sites.

### 6. Proposed Module Architecture

**Target directory**: `src/client/modules/` (new directory)

```
src/client/
├── modules/
│   ├── utils/
│   │   ├── currency.js        # extraerNumero, extraerNumeroConSigno, formatCurrency
│   │   ├── dom.js             # isRowVisible, getCsrfToken, getCheckedCheckboxes, scrollTo
│   │   └── date.js            # parsearFechaParaOrden
│   ├── state/
│   │   ├── contribuyente.js   # contribuyenteData fetch/inline loading
│   │   └── demo-panel.js      # window.DEMO_PANEL management
│   ├── deuda/
│   │   └── selection.js       # recopilar* functions, checkbox totals, filtering
│   ├── ticket/
│   │   ├── generator.js       # generarTicket (API call + DOM render)
│   │   ├── pdf.js             # descargarPDF (jsPDF integration)
│   │   └── preview.ejs        # (unchanged — template only)
│   └── pago/
│       ├── init.js            # iniciarPago (orchestration)
│       └── polling.js         # (from pendiente.ejs inline)
```

**Module details:**

| Module | Functions to Extract | Est. Lines | Dependencies | DOM? | Type |
|---|---|---|---|---|---|
| `utils/currency.js` | `extraerNumero`, `extraerNumeroConSigno`, `formatCurrency` | ~40 | None | No | Pure logic |
| `utils/dom.js` | `getCsrfToken`, `isRowVisible`, `getCheckedCheckboxes`, `scrollToElement`, `volverArriba` | ~35 | None | Yes (reads DOM) | DOM utility |
| `utils/date.js` | `parsearFechaParaOrden` | ~15 | None | No | Pure logic |
| `state/contribuyente.js` | DOMContentLoaded fetch, `contribuyenteData` export, inline fallback handler | ~50 | `utils/dom.js` (getCsrfToken) | Yes (body.dataset) | State + Effect |
| `state/demo-panel.js` | `DEMO_PANEL` state init, toggle BD lock, resultado selection | ~110 | None | Yes (heavy DOM) | State + UI |
| `deuda/selection.js` | `obtenerCheckboxesConceptos`, `obtenerCheckboxesConceptosMarcados`, `obtenerCreditoAutomaticoVisible`, `actualizarTotal`, `actualizarCheckboxTodos`, `toggleTodos`, `actualizarContadores`, `recopilarIdTransSeleccionados`, `recopilarCreditosFavorVisibles`, `recopilarConceptosParaPago`, `recopilarConceptosSeleccionados` | ~180 | `utils/currency.js`, `utils/date.js`, `utils/dom.js` | Yes | Domain + DOM |
| `ticket/generator.js` | `generarTicket`, `obtenerDatosContribuyente`, `extraerTextoDetalle` | ~100 | `deuda/selection.js`, `utils/dom.js` | Yes | API + DOM |
| `ticket/pdf.js` | `descargarPDF` | ~370 | `utils/dom.js` | Yes | Pure-heavy (jsPDF) |
| `pago/init.js` | `iniciarPago` + button handlers | ~80 | `deuda/selection.js`, `state/contribuyente.js`, `state/demo-panel.js`, `utils/currency.js`, `utils/dom.js` | Yes | Orchestration |
| `pago/polling.js` | Inline polling from `pendiente.ejs` | ~50 | None | Yes | Effect only |

**Dependency graph (simplified):**

```
pago/init.js → deuda/selection.js → utils/currency.js
             → state/contribuyente.js  utils/date.js
             → state/demo-panel.js     utils/dom.js
             
ticket/generator.js → deuda/selection.js → utils/currency.js
                    → utils/dom.js          utils/date.js
                    
ticket/pdf.js → utils/dom.js
             → window.jspdf (vendor)
```

### 7. Migration Risk Assessment

| Risk | Severity | Mitigation |
|---|---|---|
| **Inline `onclick` handlers** in EJS call global functions (`iniciarPago`, `seleccionarContribuyente`, `volverArriba`). ES modules don't expose globals. | **High** — breaks 3 button interactions | Change `onclick` to `addEventListener('click', ...)` in the module entry point, OR explicitly attach functions to `window` in the entry module: `window.iniciarPago = iniciarPago` |
| **jsPDF UMD global** (`window.jspdf`) used in `descargarPDF`. ES modules can't access UMD globals without a separate `<script>` tag. | **Medium** | Keep jsPDF as a separate `<script>` tag OR install via npm and `import` (requires Vite/esbuild) |
| **`contribuyenteData` global** read by `iniciarPago()`. Inline EJS `<script>` sets it as fallback. | **Medium** | Export the state from `state/contribuyente.js`, import where needed. The inline EJS script can be refactored to a module-compatible pattern |
| **Script load order** is currently explicit and working. ES modules resolve order via imports. | **Low** | Imports enforce correct order automatically |
| **DOMContentLoaded timing** — `defer` scripts run before `DOMContentLoaded`. Modules are deferred by default. | **Low** | Works the same way |
| **`demo-panel.ejs` inline script** sets `window.DEMO_PANEL` which `iniciarPago()` reads. | **Medium** | Refactor demo-panel.ejs to export via ES module or use a shared state module |

**Rollback plan**: The modules can co-exist with the old files during migration. Keep the old `<script>` tags, add the new ES module entry as an additional `<script type="module">`. No existing functionality breaks. Remove old scripts only after verifying all interactions work.

**Estimated migration complexity**: 3-4 EJS files need `<script>` tag changes (primarily `index.ejs`). The `onclick` refactor touches 4 button handlers across `index.ejs`. No routes or controllers change.

### 8. Key Learnings / Gotchas

1. **`extraerNumero` is a fragile cross-file dependency** — `index.js` calls `extraerNumero()` from `deudas.js` purely by script load order convention. If anyone reorders the `<script>` tags, `iniciarPago()` silently breaks. This is the single strongest argument for modularization.

2. **The `onclick` pattern in EJS is the migration bottleneck** — 4 inline `onclick` attributes in `index.ejs` reference global functions. These MUST be converted to `addEventListener` in the module entry point, OR the module entry must explicitly export to `window`. The latter is simpler but defeats some modularity benefits.

3. **jsPDF is non-modular** — loaded as a UMD `<script>` tag because the project manually vendored it. Migrating to an ES module import would require either: (a) keep it as a separate `<script>` and access via `window.jspdf`, (b) `npm install jspdf` and use a bundler to resolve the import, or (c) dynamic `import('/javascripts/vendor/jspdf.umd.min.js')`. Option (a) is safest for Phase 1.

4. **No unit tests exist for any of these functions** — `extraerNumero`, `parsearFechaParaOrden`, and `extraerTextoDetalle` are pure functions that would be trivially testable if extracted. The `utils/currency.js` module would be the easiest candidate for the project's first real unit tests.

5. **The polling script in `pendiente.ejs` is a hidden duplicate candidate** — it's embedded inline but its logic (polling an API endpoint, redirecting on status change) could be a shared module used by multiple views.

6. **`views/partials/demo-panel.ejs` is the largest EJS partial at 439 lines** — it contains both HTML+CSS for the demo panel AND a self-contained IIFE (108 lines of inline JS). This inline JS should be extracted to a module as well.

7. **BEM-like class naming exists but isn't consistently used** — `deudas__checkbox`, `deudas__value--discount`, `ticket__value--interest`. The JS queries by these classes, which is good for maintaining separation, but some queries use raw tag selectors (`td`, `tr`) instead of class-based selectors.

8. **The `strict_tdd: false` in config means no test infrastructure** — if this refactor extracts pure functions, those are natural test candidates, but there's no test runner configured. The refactor could be the opportunity to introduce a lightweight test runner (node:test or vitest).

### Ready for Proposal

**Yes** — the exploration is complete. All 978 lines of frontend JS have been analyzed, all 10 EJS views inspected, and the build/deployment pipeline reviewed. There are clear duplication patterns, cross-file coupling risks, and a clean path to modularization.

**What the orchestrator should tell the user**: 
- The refactor is feasible with low migration risk if done in phases
- Phase 1: Pure utility modules (currency, date, dom helpers) — zero risk because behavior doesn't change
- Phase 2: Domain modules (deuda selection, ticket, payment) — medium risk due to `onclick` refactoring needed
- Phase 3: State management (contribuyente, demo-panel) + jsPDF handling
- The biggest win is eliminating cross-file function coupling and enabling testability
- Recommend keeping the "no build step" approach for now and using native ES modules with `<script type="module">`
