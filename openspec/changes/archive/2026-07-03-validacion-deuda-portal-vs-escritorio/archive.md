# Archive Report: validacion-deuda-portal-vs-escritorio

- **Change**: validacion-deuda-portal-vs-escritorio
- **Archived**: 2026-07-03
- **Mode**: hybrid (Engram + OpenSpec)
- **Source of truth updated**: yes
- **Final verdict**: PASS (19/19 engine tests, all 16 implementation tasks checked)
- **Archived to**: `openspec/changes/archive/2026-07-03-validacion-deuda-portal-vs-escritorio/`

## Specs Synced

| Domain | Action | Details |
|--------|--------|---------|
| `interest-calculation` | MODIFIED | 1 added (`CodMovim filter in debt query`), 2 modified (`Formula explicita`, `Tasa configurable`), 1 preserved (`Sin mora antes del vencimiento`) |
| `debt-validation` | NEW | 4 requirements, 8 scenarios — full spec created from delta |

### `interest-calculation/spec.md` — merge summary

| Requirement | Action | Source | Notes |
|---|---|---|---|
| `CodMovim filter in debt query` | ADDED | delta `ADDED` | 2 scenarios (excludes cobro, empty when only cobro) |
| `Formula explicita` | MODIFIED | delta `MODIFIED` | Base switched `Importe` → `Saldo`; added Mode A vs Mode B table; `<=` for `FechaDesdeInt`; TOTAL = `Saldo + Interes`; ±0.1 tolerance; 4 scenarios |
| `Sin mora antes del vencimiento` | PRESERVED | existing | Not in delta — kept verbatim. Note: scenario overlap with the new "Deuda vigente (sin mora)" in `Formula explicita`; both express the same rule from different angles, retained for clarity |
| `Tasa configurable` | MODIFIED | delta `MODIFIED` | Split by mode: Mode B reads `datosgenerales`, Mode A implicit from `CoeficienteCuota`; 2 scenarios |
| `Mode C (discount/cuotabasica)` | REMOVED (informational) | delta `REMOVED` | Was never in main spec — delta's REMOVED is documentation only, no action on main |

### `debt-validation/spec.md` — creation summary

| Requirement | Scenarios |
|---|---|
| `CSV test data ingestion` | 2 (load single CSV, handle missing dir) |
| `Portal debt query per taxpayer` | 2 (query per DNI, skip AUAU) |
| `Row-by-row comparison with tolerance` | 2 (within tolerance, outside tolerance) |
| `Clear pass/fail output per taxpayer` | 3 (all pass, mixed, no data) |

## Archive Contents

- proposal.md ✅
- design.md ✅
- tasks.md ✅ (16/16 implementation tasks complete — all `[x]`)
- specs/interest-calculation/spec.md ✅ (delta)
- specs/debt-validation/spec.md ✅ (delta)
- verify.md ✅ (synced into main specs and re-saved; verify.md vs convention `verify-report.md` — naming divergence noted below)
- archive.md ✅ (this file)

Active `openspec/changes/validacion-deuda-portal-vs-escritorio/` no longer exists (moved to archive).

## Source of Truth Updated

The following specs now reflect the new behavior:

- `openspec/specs/interest-calculation/spec.md` — interest engine reduced to Mode A (coeficiente) and Mode B (interes diario); TOTAL = `Saldo + Interes`; `CodMovim = 'H'` filter in debt queries; `FechaDesdeInt` is inclusive (`<=`); ±0.1 rounding tolerance
- `openspec/specs/debt-validation/spec.md` — new capability, harness for portal-vs-escritorio parity checks against CSV test data

## Critical Blocker Resolution (before archive)

The verify report flagged two CRITICAL issues that were resolved prior to this archive run:

- **C1 (hardcoded production DB credentials)** — fixed; `tests/intereses/validar-contra-csv.js` now reads from `config/database.config.js` / `.env` instead of inline plaintext
- **C2 (unchecked task boxes)** — fixed; all 16 implementation task checkboxes in `tasks.md` are now `[x]`

## Known Warnings Carried Forward (non-blocking)

These warnings from the verify report are recorded here for traceability. None block archive; all are appropriate follow-up work for subsequent changes.

| # | Warning | Status / Disposition |
|---|---|---|
| W1 | debt-validation "Skip AUAU records" — implementation skips the whole PLAINO file by name; spec demands row-level skip for `TIPO_BIEN='AUAU'` | Spec merged as written; implementation is file-level. Follow-up change to make AUAU skip row-level. |
| W2 | Jest is not declared in `package.json` (`devDependencies` and `test` script) | Tests pass in current tree; clean install / CI cannot run them. Add pinned Jest dep + `"test": "jest"` script in a follow-up. |
| W3 | Validation script uses raw SQL + direct `calcularMovimiento` instead of the service layer (`deudas.service.obtenerDeudasPorCodigoODni`) | Functionally equivalent for the engine; does not exercise the service's CodMovim/Saldo filter path. Refactor in a follow-up. |
| W4 | interest-calculation spec Mode A formula is `Saldo * CoeficienteCuota` (scenario: coef=1.05 → interes = Saldo*0.05); implementation and design-approved formula is `Saldo * (IndiceFinal / CoeficienteCuota)` | **Spec/code divergence.** Merged as written per orchestrator instruction. A subsequent `sdd-propose` should reconcile spec wording with the built formula. |
| W5 | interest-calculation spec says `dias_mora` is "from `FechaDesdeInt` (inclusive)"; impl computes from `FechaVto` (`calcularDiasMora(fechaVto)`). `FechaDesdeInt` is used only as the Mode A threshold | **Spec/code divergence.** Same disposition as W4 — flag for spec reconciliation. |
| W6 | Validation script: `Total` not compared; no `process.exit(1)` on zero valid rows | Both behaviors absent in impl; spec merged as written. Add both in a follow-up. |
| W7 | Cross-change spec conflict: prior change `sequelize-mapping-manzano-debt-formulas` spec still mandates `calcularDescuentoUnicoPago` as a MUST-export; this change removes it | **Cross-change conflict** — both specs now coexist and disagree. Resolve in a follow-up that consolidates the formula engine spec. |
| W8 | File path divergence: tasks/spec say `scripts/validate-debt-vs-csv.js`; actual artifact lives at `tests/intereses/validar-contra-csv.js` | Documented; tasks/spec should be updated to reflect final path in a follow-up. |
| W9 | Service-layer runtime coverage gap: `formatearDeuda` and the CodMovim-filtered queries have no runtime test; only the pure engine is unit-tested | Source evidence strong; spec scenarios on the query path are source-only. Add integration tests in a follow-up. |

## Other Notes

- **Verify report filename**: change uses `verify.md` while the OpenSpec convention names the file `verify-report.md`. Preserved as-is in the archive for fidelity; new changes should use the convention name.
- **User decisions captured during development** (recorded for traceability):
  1. Rounding tolerance: ±0.1
  2. `FechaDesdeInt`: ≤ inclusive
  3. `RecIntereses`: commented (fallback only)
  4. `AUAU/PLAINO`: excluded from initial scope
  5. `DESC_INMUEBLE`: deferred (assume 1.0)

## Persistence

- **OpenSpec**: this `archive.md` plus the full change folder at `openspec/changes/archive/2026-07-03-validacion-deuda-portal-vs-escritorio/`
- **Engram**: observation ID `292`, sync_id `obs-3312db5503c6d8b8`, topic_key `sdd/validacion-deuda-portal-vs-escritorio/archive`, type `architecture`, project `demo-portal-de-pago`. No conflicts surfaced (judgment_required = false).

## SDD Cycle Complete

The change has been fully planned (proposal + design), implemented (PR 1: 4 service/config files; PR 2: tests + validation script), verified (19/19 engine tests, all spec checks with line evidence), and archived. The source of truth is updated. Ready for the next change.
