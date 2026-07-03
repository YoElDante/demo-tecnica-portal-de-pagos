# Proposal: fix-debt-calculation-discrepancy

## Intent

Eliminate the amount discrepancies between the portal and the accountant's desktop software. After live DB diagnostics against El Manzano production, Mode A (coefficient) already matches 0.00 for 97.4% of rows; the remaining gap is a 1-day interest overcharge on every Mode B row, caused by timezone-unsafe date construction in `services/intereses.service.js`. This change makes the JS formula engine match the Python source (`docs/formulas/formulas_alcaldia_072026.txt`) exactly and ratifies El Manzano as the canonical model for all municipalities.

## Scope

### In Scope
- Fix `calcularDiasMora()` to build civil dates safely (noon-normalized `new Date(y, m, d, 12, 0, 0)`) eliminating the UTC→local `setHours` shift.
- Change line 110 cutoff comparison from `<=` to strict `<`, matching Python `fecha_bd < fecha_limite`.
- Unit-test coverage for both fixes against the 5 canonical DNIs (17720479, 12212197, 16856346, 29308519, 14537335).
- Update `openspec/specs/interest-calculation/spec.md` to mandate `CoeficienteCuota`, `IndiceFinal`, `FechaDesdeInt`, `TasaInteres` for every municipal DB.

### Out of Scope
- Data migration / population of `CoeficienteCuota`, `IndiceFinal`, `FechaDesdeInt` (already correct in El Manzano prod; separate change per municipality).
- `descinmueble` reintroduction — confirmed baked into `Saldo` (Mode B recent rows differ only by 1 day, not a constant factor).
- 10% Saldo markup, Mode C, `RecIntereses` fallback — out of scope.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `interest-calculation`: tighten date semantics (civil dates) and cutoff operator (`<` strict); mandate required DB fields per municipality with Mode B fallback preserved when fields are absent.

## Approach

Replace the date construction pattern inside `intereses.service.js`. Two surgical edits:

1. `calcularDiasMora()`: stop using `new Date("YYYY-MM-DD")` + `setHours(0,0,0,0)`. Parse the date string into components and build `new Date(year, monthIdx, day, 12, 0, 0, 0)`. Noon normalization sidesteps DST and UTC-offset shifts without depending on a tz library. Repeat the same pattern for `fechaReferencia` when provided.
2. `calcularMovimiento()` line 110: `fechaVtoDate <= fechaLimite` → `fechaVtoDate < fechaLimite` (strict, matches Python line 37).

No DB, config, or formula math changes. The fix is purely date semantics + operator parity with the Python source.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `services/intereses.service.js` | Modified | `calcularDiasMora` civil-date construction; line 110 strict `<` |
| `tests/intereses/engine.test.js` | Modified | Cases for tz edge rows and exact-cutoff rows |
| `openspec/specs/interest-calculation/spec.md` | Modified | Mandate required DB fields; Mode B fallback preserved |
| `docs/bd/LOGICA_DEUDAS_PAGOS.md` | Modified | Note canonical civil-date convention |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Day count shifts for all Mode B users on deploy | Med | Net effect is CORRECTING an off-by-one upward bias — portal overcharged; users see equal or lower totals |
| Municipalities without `IndiceFinal` regress | Low | Mode B fallback path unchanged; mode selection only depends on data presence |
| DST edge (AR has no DST since 2020) | Low | Noon normalization robust regardless; no tz dependency |
| Test DNIs not representative | Low | All 5 contributors covered across old (coefficient) and new (Mode B) debts |

## Rollback Plan

Revert the two edits in `services/intereses.service.js` (single file, ~10 lines). No schema, migration, or config revert required. Deploy via `develop` → confirm in demo against test DNIs → merge to `main`.

## Dependencies

- El Manzano production DB available for validation queries (already verified in exploration).
- `tests/intereses/engine.test.js` harness must support injected `fechaReferencia` (already used by `calcularMovimiento`).

## Success Criteria

- [ ] All 5 canonical DNIs show 0.00 total diff vs desktop for ALL rows (coefficient + Mode B + ACTUALIZACION).
- [ ] Mode A rows remain at 0.00 diff (no regression).
- [ ] Unit tests pin civil-date construction for AR tz.
- [ ] Strict `<` cutoff test covers a row dated exactly on `FechaDesdeInt`.
- [ ] Spec updated to mandate DB fields per municipality with documented Mode B fallback.