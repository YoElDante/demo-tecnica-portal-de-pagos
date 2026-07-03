# Design: Validación de Deuda Portal vs Escritorio

## Technical Approach

Three complementary fixes targeting the root-cause discrepancies between portal and desktop software: (1) correct the debt aggregation base from `Importe` to `Saldo`, (2) exclude payment records via `CodMovim = 'H'` filter, and (3) simplify the 3-mode formula engine to 2 real modes, removing dead Mode C code. A standalone validation script proves correctness against 5 CSV reference datasets.

## Architecture Decisions

| # | Option | Tradeoff | Decision |
|---|--------|----------|----------|
| G1 | TOTAL = Saldo + Interés | `Importe` diverges when partial payments exist; `Saldo` matches desktop | Use `Saldo` — 1-line fix at `deudas.service.js:300` |
| G2 | Add `CodMovim: 'H'` to WHERE | Excludes cobro rows (`D`) from debt queries; confirmed field exists in model | Filter in both `obtenerDeudasPorCodigo` and `obtenerDeudasPorCodigoODni` |
| G5 | Remove Mode C entirely vs fix it | Accountant confirmed almost no taxpayers have discounts; dead code for portal | **Remove** — delete `calcularDescuentoUnicoPago`, cuotabasica detection, and the `cuotabasica !== ''` branch |
| FechaDesdeInt | `<` (exclusive) vs `<=` (inclusive) | Desktop counts start date as mora day | Change to `<=` in `intereses.service.js:147` |
| RecIntereses | Uncomment vs keep commented | Desktop code has it commented; could filter rows with already-calculated interest | Keep commented with documentation block for future activation |
| AUAU exclusion | Exclude PLAINO entirely vs handle per-row | PLAINO CSV has AUAU-only data with unusual patterns; no ININ/CICI coverage | Exclude PLAINO CSV; skip AUAU rows in other CSVs |
| Tolerance | ±0.01 vs ±0.1 | Round-half-up (JS) vs round-half-even (desktop) produces ±0.01 at .5 boundaries | **±0.1** — user decision; covers rounding modes |

## Data Flow

```
CSV test files ──→ scripts/validate-debt-vs-csv.js
                        │
                        ├─► deudas.service.obtenerDeudasPorCodigoODni(dni)
                        │     ├─ Cliente.findOne({ DOCUMENTO: dni })
                        │     └─ ClientesCtaCte.findAll({
                        │           where: { Codigo, CodMovim: 'H', Saldo: { [Op.ne]: 0 } }
                        │        })
                        │         │
                        │         └─► formatearDeuda(row, config)
                        │               └─► intereses.service.calcularMovimiento(mov, config)
                        │                     ├─ Mode A (coefCuota > 0): saldo * (indiceFinal / coefCuota)
                        │                     └─ Mode B (tipoMovim='FA', dias > 0): saldo * tasaDiaria * dias
                        │
                        └─► Row-by-row compare: CSV.{Saldo, Int_Dto, TOTAL} vs portal.{Saldo, Interes, Total}
                              └─► PASS/FAIL per row (±0.1 tolerance)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `services/deudas.service.js` | Modify | (a) Line ~206: add `CodMovim: 'H'` to WHERE; (b) Line ~269: add `CodMovim: 'H'` to whereCondition; (c) Line ~300: change `importe + resultado.interes` → `saldo + resultado.interes`; (d) Add `'CodMovim'` to QUERY_ATTRIBUTES |
| `services/intereses.service.js` | Modify | (a) Remove `calcularDescuentoUnicoPago` function (lines 71-77); (b) Remove cuotabasica detection (lines 119-128); (c) Remove `cuotabasica !== ''` branch (lines 174-186); (d) Line 147: change `<` to `<=`; (e) Add commented RecIntereses check block |
| `config/intereses.config.js` | Modify | Remove `MAPPING_CUOTABASICA` export; add comment noting Mode C removal |
| `scripts/validate-debt-vs-csv.js` | **Create** | Standalone validation harness: reads CSVs, calls debt service, compares per row |
| `tests/intereses/engine.test.js` | Modify | Remove Mode C describe block (lines 86-108); update dispatcher tests to use `NRO_CUOTA` not `TIPO_PLAN`; add edge-case tests for Mode A/B |
| `openspec/changes/.../specs/interest-calculation/spec.md` | Modify | Already reflects 2-mode design; no additional changes needed |

## Interfaces / Contracts

`calcularMovimiento(mov, config)` — returns unchanged shape:
```js
{ interes: number, tipo: 'C' | 'T' | 'A', dias: number, coef: string, display: string }
```
- `tipo: 'D'` (descuento) is removed — was the only Mode C path.
- Callers (`formatearDeuda`, test mocks) unaffected by type removal.

`formatearDeuda(deuda, config)` — internal change only; external callers unaffected.

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit | Mode A/B pure functions | Jest: coefficient edge cases (zero, missing), interest formula with known values |
| Unit | Dispatcher | Jest: router selects Mode A when coefCuota>0 AND fechaVto≤fechaLimite; falls to B otherwise |
| Integration | Validation script | `node scripts/validate-debt-vs-csv.js` — per-DNI PASS/FAIL against CSV references |
| Regression | Legacy calcularInteres wrapper | Keep wrapper test; ensure no breaking change to `TASA_DIARIA` fallback |

## Migration / Rollout

No DB migration required. No feature flag needed — changes are bug fixes, not new features. Rollback: revert the 3 modified files. Validation script is additive and safe to leave.

## Open Questions

- [ ] Confirm CSV DNI-to-contributor mapping is 1:1 (each DNI has exactly one CSV file — verified for 5/5)
- [ ] RecIntereses activation threshold — if validation still shows deltas, uncomment the check
