# Tasks: Refactor Frontend JS — Modular Architecture

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1,350 (4 PRs: ~198 + ~389 + ~373 + ~390) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR #1 → PR #2 → PR #2b → PR #3 |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | PR | Notes |
|------|------|----|-------|
| 1 | Pure utils + node:test | PR #1 (~198 lines) | Foundation; zero behavior change |
| 2 | Domain modules + onclick migration | PR #2 (~389 lines) | Highest risk; depends on PR #1 |
| 3 | PDF extraction | PR #2b (~373 lines) | Standalone; depends on PR #2 |
| 4 | State + cleanup + legacy deletion | PR #3 (~390 lines) | Final; depends on PR #2b |

## PR #1: Extract Pure Utility Modules (~198 lines)

- [x] **1.1** CREATE `public/javascripts/modules/utils/currency.js` (~40 lines). Extract `extraerNumero`, `extraerNumeroConSigno` from `deudas.js:183-204`; add `formatCurrency` (locale `es-AR`). Verify: `node --test public/javascripts/modules/utils/currency.test.js` passes. Deps: none.
- [x] **1.2** CREATE `public/javascripts/modules/utils/currency.test.js` (~60 lines). node:test cases: `$ 1.234,56 → 1234.56`, empty → 0, sign variants. Deps: T1.1.
- [x] **1.3** CREATE `public/javascripts/modules/utils/date.js` (~15 lines). Extract `parsearFechaParaOrden` from `deudas.js:108-116`. Deps: none.
- [x] **1.4** CREATE `public/javascripts/modules/utils/date.test.js` (~30 lines). node:test: `dd/mm/yyyy → Date`, invalid → fallback. Deps: T1.3.
- [x] **1.5** CREATE `public/javascripts/modules/utils/dom.js` (~35 lines). Extract `getCsrfToken` from `csrf-helper.js:7-9`, `isRowVisible`, `scrollToElement` from `index.js:235-237`. Deps: none.
- [x] **1.6** CREATE `public/javascripts/entry.js` (~15 lines). Import all utils; re-export to `window.extraerNumero`, `window.getCsrfToken`, etc. for onclick backward compat. Deps: T1.1, T1.3, T1.5.
- [x] **1.7** MODIFY `views/index.ejs` (+2 lines). Add `<script type="module" src="/javascripts/entry.js"></script>` in `<head>` after existing defer tags. Deps: T1.6.
- [x] **1.8** MODIFY `package.json` (+1 line). Add `"test": "node --test"` script. Deps: none.
- [x] **1.9** VERIFICATION. Run `npm test` — all utils tests pass. Manual: DNI search, checkbox+total, ticket gen, PDF download, ir a pagar work on all 5 municipios. Commit `verify-phase1.md`. Deps: T1.7, T1.8.

## PR #2: Domain Modules + onclick Migration (~389 lines)

- [x] **2.1** CREATE `public/javascripts/modules/deuda/selection.js` (~180 lines). Extract 11 functions from `deudas.js:11-97,122-164`: `obtenerCheckboxesConceptos`, `actualizarTotal`, `toggleTodos`, `recopilarConceptosSeleccionados`, `recopilarConceptosParaPago`, etc. Import from `../utils/currency.js`, `../utils/date.js`, `../utils/dom.js`. Deps: PR #1.
- [x] **2.2** CREATE `public/javascripts/modules/ticket/generator.js` (~100 lines). Extract `generarTicket`, `obtenerDatosContribuyente`, `extraerTextoDetalle` from `deudas.js:210-302`. Import from `../deuda/selection.js`, `../utils/dom.js`. Deps: T2.1.
- [x] **2.3** CREATE `public/javascripts/modules/pago/init.js` (~80 lines). Extract `iniciarPago` from `index.js:156-229`. Import from `../deuda/selection.js`, `../utils/currency.js`, `../utils/dom.js`. Deps: T2.1.
- [x] **2.4** MODIFY `public/javascripts/entry.js` (+10/-5 lines). Import domain modules; add `addEventListener` for `#btn-ir-a-pagar`, `#btn-ir-a-pagar-bottom`, `#btn-volver-arriba`, contribuyente chips. Deps: T2.1–T2.3.
- [x] **2.5** MODIFY `views/index.ejs` (+8/-4 lines). Remove 4 inline `onclick` attrs: line 132 (chip → `data-dni`), lines 272/287 (`#btn-ir-a-pagar[-bottom]`), line 290 (`#btn-volver-arriba`). Deps: T2.4.
- [x] **2.6** VERIFICATION. Manual 7-interaction × 5-municipio matrix. Commit `verify-phase2.md`. **Highest risk PR** — ticket gen, PDF, and pago init must work identically. Deps: T2.5.

## PR #2b: PDF Extraction (~373 lines)

- [x] **2b.1** CREATE `public/javascripts/modules/ticket/pdf.js` (~370 lines). Extract `descargarPDF` from `deudas.js:307-676`. Access jsPDF via `window.jspdf` (UMD vendor). Import from `../utils/dom.js`. Deps: PR #2.
- [x] **2b.2** MODIFY `public/javascripts/entry.js` (+3 lines). Import `descargarPDF`; bind click on `#btn-descargar-pdf`, `#btn-descargar-pdf-bottom`. Deps: T2b.1.
- [x] **2b.3** VERIFICATION. Manual: PDF download on all 5 municipios. Commit `verify-phase2b.md`. Deps: T2b.2.

## PR #3: State + Cleanup + Legacy Deletion (~390 lines)

- [x] **3.1** CREATE `public/javascripts/modules/state/contribuyente.js` (~50 lines). Extract `contribuyenteData` fetch/inline logic from `index.js:17-41`. Read inline data from `<script type="application/json" id="contribuyente-data-inline">`. Deps: PR #2.
- [x] **3.2** CREATE `public/javascripts/modules/state/demo-panel.js` (~110 lines). Extract 108-line IIFE from `demo-panel.ejs`. Export `DEMO_PANEL` state object and `initDemoPanel()`. Deps: none.
- [x] **3.3** CREATE `public/javascripts/modules/pago/polling.js` (~50 lines). Extract polling logic from `pendiente.ejs` inline `<script>`. Export `startPolling(ref, token, code)`. Deps: none.
- [x] **3.4** MODIFY `public/javascripts/entry.js` (+10/-25 lines). Import state/polling modules; remove ALL `window.*` bridge exports. Deps: T3.1, T3.2, PR #2b.
- [x] **3.5** MODIFY `views/index.ejs` (+3/-10 lines). Replace inline `<script>var contribuyenteData = ...</script>` with `<script type="application/json" id="contribuyente-data-inline">`. Remove `<script defer>` tags for `deudas.js`, `index.js`, `csrf-helper.js`. Deps: T3.4.
- [x] **3.6** MODIFY `views/partials/demo-panel.ejs` (+1/-110 lines). Remove inline IIFE; add `<script type="module">import { initDemoPanel } from '/javascripts/modules/state/demo-panel.js'; initDemoPanel();</script>`. Deps: T3.2.
- [x] **3.7** MODIFY `views/pago/pendiente.ejs` (+2/-50 lines). Replace inline polling with `<script type="module">import { startPolling } from '/javascripts/modules/pago/polling.js'; startPolling('<%= ref %>', '<%= token %>', '<%= code %>');</script>`. Deps: T3.3.
- [x] **3.8** DELETE `public/javascripts/deudas.js` (-731 lines). Deps: T3.5.
- [x] **3.9** DELETE `public/javascripts/index.js` (-237 lines). Deps: T3.5.
- [x] **3.10** DELETE `public/javascripts/csrf-helper.js` (-10 lines). Deps: T3.5.
- [x] **3.11** VERIFICATION. Full manual 7-interaction × 5-municipio matrix including demo panel toggle. Commit `verify-phase3.md`. Deps: T3.8–T3.10.
