# Proposal: Refactor Frontend JS — Modular Architecture

## Intent

Frontend JS is 978 lines across 3 files with zero modularity. All functions are global; cross-file dependencies ride on fragile `<script defer>` load order. `extraerNumero()` is **defined in `deudas.js` but called from `index.js`** purely by load-order convention — reorder the tags and `iniciarPago()` silently breaks. `deudas.js` mixes 4 concerns (50% is jsPDF layout), `index.js` mixes 3, and 5 duplication patterns span both files. This change eliminates that coupling risk, makes the pure functions (`extraerNumero`, `parsearFechaParaOrden`, `extraerTextoDetalle`) unit-testable for the first time, and unblocks future frontend work — **without any feature or user-facing behavior change**.

## Scope

### In Scope
- Extract pure utilities (currency, date, dom helpers) into `src/client/modules/utils/`
- Extract domain modules (deuda selection, ticket generator, ticket pdf, pago init) from `deudas.js` / `index.js`
- Extract state modules (contribuyente, demo-panel) including the inline `<script>` IIFE in `demo-panel.ejs`
- Migrate `views/index.ejs` to load a single ES module entry (`<script type="module">`)
- Convert the 4 inline `onclick` handlers in `index.ejs` to `addEventListener`
- Keep jsPDF as vendored UMD `<script>` (no npm install, no build step) in Phase 1
- Verify all existing interactions behave identically on every municipio demo env

### Out of Scope
- Introducing a bundler (Vite / esbuild / Rollup) — deferred until the frontend grows
- Installing jsPDF via npm or any new runtime production dependency
- Adding a unit test runner / writing tests — separate change; this refactor only makes them **possible**
- Extracting `pendiente.ejs` inline polling into a shared module (Phase 3 candidate, deferred)
- Any backend route, controller, or spec-level behavior of any capability
- Any multi-municipio branding or config path change

## Capabilities

### New Capabilities
None — pure internal refactor; no new capability spec is introduced.

### Modified Capabilities
None — no spec-level behavior changes. Existing capabilities (`ticket-lifecycle`, `payment-gateway-contract`, `pii-protection`, `csrf-protection`, `multi-municipio`) keep identical behavior; only the frontend implementation delivering them changes.

## Approach

Phased migration using **native ES modules (`<script type="module">`) with no build step**. Each phase keeps the old `<script defer>` files coexisting until verified, so no existing functionality breaks mid-migration.

**Phase 1 — Pure utility modules (zero behavior risk).** Extract `utils/currency.js` (`extraerNumero`, `extraerNumeroConSigno`, `formatCurrency`), `utils/date.js` (`parsearFechaParaOrden`), `utils/dom.js` (`getCsrfToken`, `isRowVisible`, `getCheckedCheckboxes`, `scrollToElement`). Old files keep working; modules are added alongside and imported by a thin entry that temporarily re-exports to `window` so the legacy `onclick` handlers still resolve.

**Phase 2 — Domain modules (medium risk, the migration bottleneck).** Extract `deuda/selection.js` (the 11 checkbox/total/recopilar functions), `ticket/generator.js`, `ticket/pdf.js` (~370 lines of jsPDF), `pago/init.js`. Convert the 4 inline `onclick` handlers in `index.ejs` to `addEventListener` bound from the module entry — this is the single highest-risk step and gets its own chained PR. Verify ticket generation, PDF download, and payment initiation end-to-end on each municipio demo env.

**Phase 3 — State + inline-script extraction.** Move `contribuyenteData` handling into `state/contribuyente.js`, move the 108-line inline IIFE in `demo-panel.ejs` into `state/demo-panel.js`, remove the temporary `window.*` bridges from Phases 1–2, and delete the legacy `deudas.js` / `index.js` from `index.ejs`. jsPDF stays as a vendored `<script>` tag.

Each phase is one chained PR ≤400 lines. Phase boundaries are paused for review (interactive ritmo).

## Risks & Mitigations

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| `onclick` handlers break when functions leave `window` | High | Phase 1 keeps `window.*` bridges; Phase 2 converts `onclick`→`addEventListener` in its own PR before removing bridges |
| jsPDF UMD global incompatible with ES module imports | Medium | Keep jsPDF as standalone vendored `<script>`, access via `window.jspdf` — no npm install, no build step |
| `contribuyenteData` global set by inline EJS `<script>` fragment | Medium | Replace inline script with a `data-*` attribute or JSON `<script type="application/json">` tag consumed by `state/contribuyente.js` |
| `demo-panel.ejs` inline IIFE sets `window.DEMO_PANEL` read by `iniciarPago` | Medium | Extract IIFE to `state/demo-panel.js` **before** touching `iniciarPago` dependencies |
| No test runner to catch regressions | High | Manual verification matrix per phase on each municipio demo env; smoke-run `npm run testDB`; Phase 1 extracted pure functions become the first unit-test candidates |
| Reordering script tags regresses silently | Low | ES module imports enforce order; legacy `defer` order is preserved verbatim until Phase 3 |
| Single `main` branch — one broken merge blocks production | Medium | Each phase is a separate chained PR, merged only after manual verification on demo envs |

## Impact

| Affected | Change |
|----------|--------|
| Codebase | New `src/client/modules/` tree; `public/javascripts/deudas.js` + `index.js` deleted at end of Phase 3; `csrf-helper.js` folded into `utils/dom.js` |
| Developers | Use `import`/`export` instead of relying on global function load order; pure utils now importable for future tests |
| Deployment | **No build step added** — `express.static('public')` serves ES modules natively; verify Express static MIME serves `.js` as `text/javascript` (default in Express 4) |
| EJS views | `views/index.ejs` script tags refactored; `views/partials/demo-panel.ejs` inline script extracted; `views/pago/pendiente.ejs` unchanged this round |
| Multi-municipio | No branding/config path changes — refactor is municipio-agnostic by design |
| PRs | 3 chained PRs, each ≤400 lines, each merged to `main` only after manual verification |

## Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| **Keep `<script defer>` status quo** | Does not fix the `extraerNumero` cross-file coupling risk; pure functions stay untestable; 50% of `deudas.js` stays a PDF monolith |
| **Add Vite as dev dependency** | Overkill for 978 lines; adds a build step and CI surface the project explicitly avoids (12-factor simplicity); revisit only if the frontend grows significantly |
| **Add esbuild** | Same build-step objection; marginal benefit over native ES modules at this size |
| **Install jsPDF via npm + bundler** | Forces a build step just to import one vendored lib; keep UMD `<script>` tag in Phase 1 to stay build-free |
| **Big-bang rewrite in a single PR** | Violates the 400-line review budget and the single-branch `main` policy; one broken merge blocks all production; phased chained PRs isolate risk per concern |
| **Add unit tests inside this same change** | Out of scope — this refactor makes tests **possible** (extracts pure functions); introducing a runner is a separate change with its own proposal |

## Rollback Plan

Each phase is independently revertable by `git revert <merge-commit>` because the old `<script defer>` files and old `onclick` handlers remain intact through Phases 1–2. Phase 3 (legacy file deletion) only runs after Phases 1–2 are confirmed in production. Worst-case rollback: restore the 4 `<script defer>` tags in `index.ejs` and delete the `<script type="module">` entry — **no DB, route, or controller change to undo**.

## Dependencies

- None new. All work uses native browser ES modules (Node 20+ targets modern browsers). No `npm install` required for Phases 1–3.

## Success Criteria

- [ ] `extraerNumero` is **imported**, not resolved by script load order — reordering `<script>` tags no longer breaks `iniciarPago()`
- [ ] `deudas.js` and `index.js` are deleted from `public/javascripts/`; all logic lives under `src/client/modules/`
- [ ] No `<script>` tag in `views/index.ejs` other than the single ES module entry + the jsPDF vendored tag
- [ ] Zero inline `onclick` handlers in `index.ejs`
- [ ] Manual verification matrix passes on every municipio demo env (`dev:demo`, `dev:elmanzano`, `dev:tinoco`, `dev:sanjose`, `dev:calchinoeste`): DNI search, checkbox toggle, total calc, ticket generation, PDF download, payment initiation, demo panel toggle
- [ ] `npm run testDB` still passes
- [ ] No behavior change observable to end users — this is a pure refactor