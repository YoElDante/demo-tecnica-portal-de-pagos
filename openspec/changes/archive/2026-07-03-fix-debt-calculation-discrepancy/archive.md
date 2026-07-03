# Archive Report: fix-debt-calculation-discrepancy

**Change**: `fix-debt-calculation-discrepancy`
**Archived**: 2026-07-03
**Status**: ✅ Complete — SDD cycle closed
**Type**: bugfix (off-by-one in Mode B; portal overcharged users 1 day of interest per row)

---

## Summary

Eliminated the amount discrepancies between the portal and the accountant's desktop software. Root cause was timezone-unsafe date construction in `services/intereses.service.js` that introduced a 1-day interest overcharge on every Mode B row in UTC-3 (Argentina). Two surgical edits restored byte-identical results with the Python source (`docs/formulas/formulas_alcaldia_072026.txt`):

1. `parseCivilDate()` helper — noon-normalized civil dates, no UTC/DST dependency
2. Strict `<` comparison for Mode A cutoff — matches Python `fecha_bd < fecha_limite`

All 5 canonical DNIs now show 0.00 total diff vs desktop software.

---

## Files Changed

| File | Action | Description |
|------|--------|-------------|
| `services/intereses.service.js` | Modified | Added `parseCivilDate()` helper; rewrote `calcularDiasMora()` to use it; changed line 123 cutoff from `<=` to strict `<` |
| `tests/intereses/engine.test.js` | Modified | Test cases for civil-date construction and strict-cutoff boundary |
| `docs/bd/LOGICA_DEUDAS_PAGOS.md` | Modified | Section 4.3 updated with civil-date pattern and rationale |
| `openspec/specs/interest-calculation/spec.md` | Modified | Delta applied (see Specs Synced below) |

---

## Specs Synced

Delta applied from `openspec/changes/fix-debt-calculation-discrepancy/spec.md` to `openspec/specs/interest-calculation/spec.md`.

| Requirement | Action | Details |
|-------------|--------|---------|
| `Formula explicita` | **MODIFIED** | Formula table now includes `IndiceFinal` multiplier for Modo A; `dias_mora` from `FechaVto` (exclusive) with civil-date construction mandate; cutoff uses strict `<`; 4 scenarios updated (deuda vencida Mode B with `dias=245`, vigente, Modo A with `FechaVto < FechaDesdeInt`, redondeo `±0.01`) |
| `Tasa configurable` | **MODIFIED** | Mode B source clarified to `DatosGenerales.TasaInteres`; Mode A sources clarified to `CoeficienteCuota` + `IndiceFinal`; Mode A ignores `DatosGenerales` scenario added |
| `Civil-date construction for day calculation` | **ADDED** | 3 scenarios: date string parsed as civil date, days count timezone-independent, `fechaReferencia` also uses civil-date construction |
| `Strict less-than cutoff for Mode A` | **ADDED** | 2 scenarios: exact-cutoff goes to Mode B, before-cutoff goes to Mode A |
| `Multi-municipio DB field contract` | **ADDED** | 3 scenarios: full coefficient data, missing fields fallback to Mode B, row without `CoeficienteCuota` |
| `Canonical DNI validation against desktop software` | **ADDED** | 5 scenarios (one per canonical DNI): PLAINO, OLMOS, MISERENDINO, CRAVERO, CACERES |
| `Inclusive cutoff comparison (<=)` | **REMOVED** | Reason: `<=` operator caused `FechaVto == FechaDesdeInt` to incorrectly apply Modo A, diverging from Python formula using `<` strict. Migration: implemented via MODIFIED `Formula explicita` requirement (the inclusive statement was a clause inside that requirement, not a standalone one) |

### Source of Truth Updated

The following spec is now the canonical source for interest calculation behavior:
- `openspec/specs/interest-calculation/spec.md`

---

## Verification Results

### Integration Validation — 5 Canonical DNIs (El Manzano prod DB, `fechaReferencia = "2026-07-03"`)

| DNI | Contribuyente | Filas | Resultado |
|-----|---------------|-------|-----------|
| 17720479 | PLAINO | 35 | ✅ Interes: $251,365.80 — exact match desktop (0.00 diff) |
| 12212197 | OLMOS | 36 | ✅ Interes: $391,784.89 — exact match desktop (0.00 diff) |
| 16856346 | MISERENDINO | 43 | ✅ 0.00 diff vs desktop |
| 29308519 | CRAVERO | 58 | ✅ Corrected from $450,405.36 to **$448,015.22** — exact match desktop |
| 14537335 | CACERES | 43 | ✅ 0.00 diff vs desktop |

Tolerance: ±0.01 per row. All 5 DNIs show 0.00 total diff vs desktop for ALL rows (Mode A + Mode B + ACTUALIZACION).

### Unit Tests — 10/10 Pass

| Suite | Tests | Status |
|-------|-------|--------|
| `parseCivilDate` | 4/4 | ✅ Pass |
| `calcularDiasMora` (civil-date behavior) | 4/4 | ✅ Pass |
| Cutoff boundary (`<` strict) | 2/2 | ✅ Pass |
| Mode A regression | Tests pass with no diff vs desktop for Mode A rows | ✅ Pass |

### Backward Compatibility

- Mode A rows: 0.00 diff (no regression) — confirmed across 5 DNIs
- Mode B rows: previously showed 1-day overcharge → now exact match
- ACTUALIZACION_COBRADO path: unchanged
- null handling: unchanged

---

## Risks and Mitigations (Retrospective)

| Risk | Outcome |
|------|---------|
| Day count shifts for all Mode B users on deploy | Confirmed: net effect was CORRECTING the off-by-one upward bias. Portal was overcharging; users see equal or lower totals. |
| Municipalities without `IndiceFinal` regress | Not observed. Mode B fallback path is unchanged; mode selection only depends on data presence. |
| DST edge (AR has no DST since 2020) | Mitigated by noon normalization; no tz dependency. |
| Test DNIs not representative | All 5 contributors covered across old (coefficient) and new (Mode B) debts. |

---

## Rollback Plan

Revert the edits in `services/intereses.service.js` (single file, ~10 lines). No schema, migration, or config revert required. Deploy via `develop` → confirm in demo against test DNIs → merge to `main`.

---

## Archive Contents

- `proposal.md` ✅
- `spec.md` ✅
- `design.md` ✅
- `tasks.md` ✅
- `archive.md` ✅ (this file)
- `exploration.md` ✅

---

## SDD Cycle Complete

The change has been fully planned, implemented, verified, and archived. The base spec at `openspec/specs/interest-calculation/spec.md` is the single source of truth for interest calculation behavior going forward. Ready for the next change.
