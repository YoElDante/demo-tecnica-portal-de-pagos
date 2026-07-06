# Verification Spec: Refactor Frontend JS — Modular Architecture

## Purpose

This is a **pure internal refactor** — zero spec-level behavior changes. This spec defines the **non-regression contract** and **verification matrix** to prove that all existing capabilities behave identically after modularization.

## Non-Regression Capabilities

The following capabilities MUST behave identically before and after this refactor. No requirement text changes; only the frontend implementation delivering them changes.

| Capability | Spec Location | What Must Not Regress |
|---|---|---|
| `ticket-lifecycle` | `openspec/specs/ticket-lifecycle/spec.md` | Ticket generation flow, preview rendering, PDF download |
| `payment-gateway-contract` | `openspec/specs/payment-gateway-contract/spec.md` | POST `/pago/iniciar` payload, redirect to gateway |
| `pii-protection` | `openspec/specs/pii-protection/spec.md` | DNI search, contribuyente data handling |
| `csrf-protection` | `openspec/specs/csrf-protection/spec.md` | CSRF token extraction and inclusion in all POST requests |
| `multi-municipio` | `openspec/specs/multi-municipio/spec.md` | Branding, config paths, municipio-agnostic behavior |

## Verification Scenarios

Each scenario MUST pass on **all 5 municipios**: `demo`, `elmanzano`, `tinoco`, `sanjose`, `calchinoeste`.

### Scenario: DNI Search (Buscar Deudas)

- GIVEN a valid DNI exists in the database for the active municipio
- WHEN the user enters the DNI and submits the search form
- THEN the contribuyente data loads and debt rows render correctly
- AND no console errors appear

### Scenario: Checkbox Toggle (Seleccionar/Deseleccionar Conceptos)

- GIVEN debt rows are displayed after a DNI search
- WHEN the user toggles individual checkboxes or the "select all" checkbox
- THEN the visible debt count updates and the total recalculates correctly
- AND credits a favor (negative totals) are handled per existing logic

### Scenario: Total Calculation (Monto con Creditos a Favor)

- GIVEN a contribuyente has both debts and credits a favor visible
- WHEN the user selects debt concepts
- THEN the total amount updates correctly, applying credits a favor per existing rules
- AND the displayed total matches the expected arithmetic

### Scenario: Ticket Generation (Generar Ticket)

- GIVEN at least one debt concept is selected
- WHEN the user clicks "Generar Ticket"
- THEN a POST to `/generar-ticket` succeeds with correct CSRF token
- AND the ticket preview renders with correct HTML structure
- AND the download buttons appear

### Scenario: PDF Download (Descarga PDF Vectorial)

- GIVEN a ticket has been generated and preview is visible
- WHEN the user clicks the PDF download button
- THEN a vectorial PDF downloads without errors
- AND the PDF contains all ticket data (contribuyente, conceptos, totals)
- AND no jsPDF console errors appear

### Scenario: Payment Initiation (POST /pago/iniciar)

- GIVEN at least one debt concept is selected and contribuyente data is loaded
- WHEN the user clicks "Iniciar Pago"
- THEN a POST to `/pago/iniciar` is sent with correct payload (conceptos, idTrans, CSRF token)
- AND the user is redirected to the payment gateway URL
- AND `window.DEMO_PANEL` state is respected (demo vs real mode)

### Scenario: Demo Panel Toggle (Colapsar/Expandir)

- GIVEN the demo panel is visible
- WHEN the user clicks the toggle button
- THEN the panel collapses/expands with correct animation
- AND the state persists in `localStorage`
- AND the panel state is correctly read on subsequent page loads

## Verification Mode

- **strict_tdd: false** — No automated test runner exists. Verification is **manual** per municipio demo environment.
- Each phase of the refactor (3 chained PRs) requires manual verification of all 7 scenarios × 5 municipios = **35 verification checks** before merge.
- `npm run testDB` MUST still pass after each phase.

## Phase Verification Gates

| Phase | What to Verify | Risk Level |
|---|---|---|
| Phase 1 — Utils | `extraerNumero` imported correctly; `window.*` bridges work; onclick still resolves | Low |
| Phase 2 — Domain | Ticket generation, PDF download, payment initiation end-to-end | **High** |
| Phase 3 — State + Cleanup | Demo panel state, contribuyente data, legacy files deleted | Medium |

## Success Criteria

- [ ] All 7 scenarios pass on all 5 municipios (35 checks total)
- [ ] Zero inline `onclick` handlers remain in `index.ejs`
- [ ] `extraerNumero` is imported, not resolved by script load order
- [ ] `deudas.js` and `index.js` deleted from `public/javascripts/`
- [ ] Single ES module entry point in `index.ejs` (+ jsPDF vendored tag)
- [ ] `npm run testDB` passes
- [ ] No observable behavior change to end users
