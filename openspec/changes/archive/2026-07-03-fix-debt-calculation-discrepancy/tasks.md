# Tasks: Fix Debt Calculation Discrepancy

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~110 (40 src + 60 tests + 10 docs/spec) |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr |
| Chain strategy | n/a |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: n/a
400-line budget risk: Low

## Phase 1: Core Implementation

### T1: Add `parseCivilDate` helper function

- **File**: `services/intereses.service.js`
- **Description**: Add a new pure function `parseCivilDate(raw)` near the top of the file (after the existing formula functions, before `calcularDiasMora`). The function accepts a date string (`"YYYY-MM-DD"`), a `Date` object, or null/undefined. It returns `new Date(year, monthIdx, day, 12, 0, 0)` (noon-normalized civil date) or `null` for invalid input. Export it in `module.exports`.
- **Acceptance**:
  - `parseCivilDate("2025-10-31")` returns a Date where `.getDate() === 31` and `.getMonth() === 9`
  - `parseCivilDate(null)` returns `null`
  - `parseCivilDate("invalid")` returns `null`
  - `parseCivilDate(new Date(2025, 9, 31, 15, 30))` returns noon-normalized Date for Oct 31
  - Function is exported and importable from tests
- **Depends on**: none

### T2: Fix `calcularDiasMora` to use `parseCivilDate`

- **File**: `services/intereses.service.js`
- **Description**: Replace lines 61-66 in `calcularDiasMora()`. Remove `new Date(fechaVto)` + `setHours(0,0,0,0)` pattern. Replace with `parseCivilDate(fechaVto)` for the VTO date and `parseCivilDate(fechaHoy)` (or `parseCivilDate(new Date())` when no `fechaHoy` provided) for today. Keep the diff calculation and `dias > 0` guard unchanged.
- **Acceptance**:
  - `calcularDiasMora("2025-10-31", "2025-11-01")` returns `1` (not 0 or 2)
  - `calcularDiasMora("2025-10-31", "2026-07-03")` returns `245`
  - `calcularDiasMora(null)` returns `0`
  - `calcularDiasMora("invalid")` returns `0`
  - Result is identical regardless of server timezone (UTC-3 vs UTC+0)
- **Depends on**: T1

### T3: Fix Mode A cutoff comparison — `parseCivilDate` + strict `<`

- **File**: `services/intereses.service.js`
- **Description**: Replace lines 103-110 in `calcularMovimiento()`. Remove `new Date(fechaVto)` + `new Date(fechaDesdeIntereses)` + `setHours()` block. Replace with `parseCivilDate(fechaVto)` and `parseCivilDate(fechaDesdeIntereses)`. Change comparison operator from `<=` to `<` (strict less-than). This makes a debt with `FechaVto === FechaDesdeInt` fall through to Mode B instead of Mode A.
- **Acceptance**:
  - Debt with `FechaVto = "2023-01-01"` and `fechaDesdeIntereses = "2023-01-01"` → Mode B (not Mode A)
  - Debt with `FechaVto = "2022-12-31"` and `fechaDesdeIntereses = "2023-01-01"` → Mode A (unchanged)
  - No regression: Mode A still triggers for debts clearly before cutoff
- **Depends on**: T1

## Phase 2: Testing

### T4: Add unit tests for `parseCivilDate` and civil-date behavior

- **File**: `tests/intereses/engine.test.js`
- **Description**: Add a new `describe('parseCivilDate')` block with tests for: valid string input, Date object input, null/undefined, invalid string, noon normalization verification. Add a new `describe('calcularDiasMora — civil date')` block testing: `"2025-10-31"` → `"2025-11-01"` = 1 day, `"2025-10-31"` → `"2026-07-03"` = 245 days, timezone-independence assertion. Update the existing boundary test at line 92-102 (`FechaVto igual a fechaDesdeIntereses`) to expect Mode B (`tipo: 'T'`) instead of Mode A (`tipo: 'C'`).
- **Acceptance**:
  - All new `parseCivilDate` tests pass
  - Civil-date `calcularDiasMora` tests pass with exact day counts
  - Existing test at line 92-102 updated: `FechaVto === fechaDesdeIntereses` now expects `tipo: 'T'` (Mode B)
  - All pre-existing tests still pass (no regressions)
- **Depends on**: T2, T3

### T5: Integration validation against 5 canonical DNIs

- **File**: Manual validation script or ad-hoc queries (no new file required — use existing `npm run testDB` harness or `node -e` one-liner)
- **Description**: Run `calcularMovimiento` against the El Manzano production DB for DNIs 17720479, 12212197, 16856346, 29308519, 14537335 with `fechaReferencia = "2026-07-03"`. Compare output per-row against the desktop software CSV values. Tolerance: ±0.01 per row.
- **Acceptance**:
  - All 5 DNIs show 0.00 total diff vs desktop for ALL rows (Mode A + Mode B + ACTUALIZACION)
  - Mode A rows remain at 0.00 diff (no regression)
  - Mode B rows that previously showed 1-day overcharge now match exactly
- **Depends on**: T2, T3

## Phase 3: Documentation & Spec Sync

### T6: Update `docs/bd/LOGICA_DEUDAS_PAGOS.md` — civil-date convention

- **File**: `docs/bd/LOGICA_DEUDAS_PAGOS.md`
- **Description**: Update section 4.3 (lines 100-116) to replace the old `calcularDiasMora` code snippet with the new civil-date version using `parseCivilDate`. Add a note explaining that date strings from the DB must NOT be passed directly to `new Date()` and must use noon-normalized civil dates.
- **Acceptance**:
  - Code snippet in section 4.3 matches the new implementation
  - Note about civil-date convention is present
- **Depends on**: T2

### T7: Sync delta spec to base spec

- **File**: `openspec/specs/interest-calculation/spec.md`
- **Description**: After implementation is verified, merge the delta changes from `openspec/changes/fix-debt-calculation-discrepancy/spec.md` into the base spec at `openspec/specs/interest-calculation/spec.md`. This is the archive step — the delta spec already contains the correct MODIFIED/ADDED/REMOVED requirements. The base spec should reflect: civil-date mandate, strict `<` cutoff, Mode B fallback contract, and removal of `<=` inclusive cutoff.
- **Acceptance**:
  - Base spec includes civil-date construction requirement
  - Base spec uses `<` (strict) for Mode A cutoff condition
  - Base spec no longer references `setHours(0,0,0,0)` pattern
  - Mode B fallback for missing coefficient data is documented
- **Depends on**: T4, T5
