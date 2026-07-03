# Design: Fix Debt Calculation Discrepancy

## Technical Approach

Two surgical edits in `services/intereses.service.js` to achieve byte-identical interest results with the Python desktop formula. No schema, config, or data changes.

## Architecture Decisions

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Timezone library (luxon/moment-tz) | Adds dependency; overkill for one date parse | **Reject** |
| Noon-normalized `new Date(y, m, d, 12)` | Zero deps; robust against UTC offsets & DST | **Accept** |
| `compareAsc` / `differenceInDays` from date-fns | Adds dep; same civil-date semantics | **Reject** |
| `<=` → `<` on line 110 | Matches Python line 37 `fecha_bd < fecha_limite`; portal was overcounting boundary rows | **Accept** |

## Data Flow

```
DB rows (Sequelize raw, VARCHAR(10) date strings)
  │
  ▼
deudas.service.formatearDeuda(row, config)
  │
  ▼
intereses.service.calcularMovimiento(mov, config)
  ├─► calcularDiasMora(fechaVto, fechaReferencia)   ← FIX 1: civil-date parse
  │     └─► parseCivilDate(dateString) → new Date(y,m,d,12)
  │
  ├─► Mode A check: fechaVtoDate < fechaLimite       ← FIX 2: strict `<`
  │     └─► calcularInteresCoeficiente(saldo, indiceFinal, coefCuota)
  │
  └─► Mode B fallback: calcularInteresSimpleFA(saldo, tasaInteres, dias)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `services/intereses.service.js` | Modify | Add `parseCivilDate`; fix `calcularDiasMora` and line 103-104 comparison; change `<=` to `<` on line 110 |
| `tests/intereses/engine.test.js` | Modify | Add tz-edge test (`2025-10-31` in Argentina); update `<=` boundary test to `<` strict; add exact-cutoff row test |
| `openspec/specs/interest-calculation/spec.md` | Modify | Update Mode A condition from `<=` to `<`; mandate civil-date semantics |

## Core Changes

### 1. `parseCivilDate(dateString)` — New Helper

```javascript
function parseCivilDate(raw) {
  if (!raw) return null;
  if (raw instanceof Date && !isNaN(raw.getTime())) {
    return new Date(raw.getFullYear(), raw.getMonth(), raw.getDate(), 12, 0, 0);
  }
  if (typeof raw === 'string') {
    const m = raw.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) return new Date(+m[1], +m[2] - 1, +m[3], 12, 0, 0);
  }
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null
    : new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0);
}
```

Deployed identically in `normalizarFechaCivil()` (deudas.service.js:151-174). We extract it to `intereses.service.js` to keep the module pure.

### 2. `calcularDiasMora()` — Lines 58-71

Replace `new Date(fechaVto)` + `setHours(0,0,0,0)` with `parseCivilDate(fechaVto)`. Same for `fechaHoy` when provided. Invalid input returns 0 days.

### 3. Mode A Comparison — Lines 103-110

Replace `new Date(fechaVto)` + `new Date(fechaDesdeIntereses)` + `setHours() + <=` with `parseCivilDate` + strict `<`.

## Edge Cases

| Case | Behavior |
|------|----------|
| Invalid date string | `parseCivilDate` returns `null` → `getTime()` is NaN → guard skips |
| `fechaReferencia` string | Parsed via same `parseCivilDate` path as `fechaVto` |
| `fechaHoy` is null | `new Date()` constructed as civil noon via helper: `parseCivilDate(new Date())` |
| AR timezone (UTC-3, no DST) | Noon (12:00) is always the same calendar day regardless of offset |

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit | `calcularDiasMora` with `"2025-10-31"` | Inject `fechaReferencia="2025-11-01"` → expect 1 day (not 2) |
| Unit | `calcularDiasMora` with `"2025-10-31"` to today | Should match Python `(datetime.now() - vto).days` |
| Unit | Mode A cutoff at `FechaDesdeInt` | Row dated `= FechaDesdeInt` → falls through to Mode B (was Mode A) |
| Integration | 5 canonical DNIs against prod DB | `calcularMovimiento` output vs desktop CSV; expect 0.00 diff per row |
| Regression | All existing tests pass | Modes A, B, `ACTUALIZACION_COBRADO`, null handling |

## Rollback

Revert `services/intereses.service.js` (single file, ~10 lines changed). No migration, no config revert.
