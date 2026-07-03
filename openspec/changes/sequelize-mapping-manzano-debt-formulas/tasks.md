# Tasks: Sequelize Mapping & El Manzano Debt Formulas

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1200–1400 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → PR 3 → PR 4 |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Foundation + config + absorb | PR 1 | ~120 lines; Jest, config, docs, folder move |
| 2 | 9 independent models (no cross-refs) | PR 2 | ~400 lines; DatosGenerales through Feriados |
| 3 | 9 dependent models + associations | PR 3 | ~400 lines; PadronBase, CTACTESUM, Provincias + model.index.js |
| 4 | Engine + integration + tests | PR 4 | ~350 lines; intereses.service, datos-generales, deudas wiring, Jest tests |

## Phase 1: Foundation

- [ ] 1.1 Install Jest as exact devDependency: `npm install --save-dev --save-exact jest`. Add `"testIntereses": "jest tests/intereses"` to `package.json` scripts.
  - Deps: none | Verify: `npx jest --version` prints version | Est: S

- [ ] 1.2 Create `config/intereses.config.js` with resolution chain (`DatosGenerales` > municipio config > env) and `DESC_INMUEBLE` guarded constant (default `1.0`, `console.warn` on startup).
  - Deps: none | Verify: `require('./config/intereses.config')` returns object with `DESC_INMUEBLE === 1.0` and warn logged | Est: S

- [ ] 1.3 Move `openspec/changes/configurable-interest-rate/` to `openspec/changes/_absorbed/configurable-interest-rate/`. Add one-line `README.md` pointer.
  - Deps: none | Verify: old path gone, `_absorbed/` contains folder | Est: S

- [ ] 1.4 Create `docs/formulas/PREGUNTAS_PARA_CONTADOR.md` with numbered Spanish questions for `descinmueble`, `FechaDesdeIntereses` boundary, `tasadescuento` column, `cuotabasica`→`TIPO_PLAN` mapping.
  - Deps: none | Verify: file exists with ≥4 structured questions | Est: S

## Phase 2: Models Batch 1 (9 Independent)

- [ ] 2.1 Create `models/DatosGenerales.js` — columns: `TasaInteres`, `TasaDescuento`, `IndiceFinal`, `FechaDesdeIntereses`. Transcribe from SQL script.
  - Deps: 1.1 | Verify: `require` loads without error | Est: S

- [ ] 2.2 Create `models/Numeracion.js` — ticket numbering reference columns from SQL.
  - Deps: 1.1 | Verify: loads | Est: S

- [ ] 2.3 Create `models/CobrosCtaCte.js` — payment rows (CodMovim D) columns from SQL.
  - Deps: 1.1 | Verify: loads | Est: S

- [ ] 2.4 Create `models/ClientesCtaCteTransitoria.js` — transitory debt entries from SQL.
  - Deps: 1.1 | Verify: loads | Est: S

- [ ] 2.5 Create `models/Devengamientos.js` — debt generation source from SQL.
  - Deps: 1.1 | Verify: loads | Est: S

- [ ] 2.6 Create `models/Automotores.js` — `dominio`, `ID_BIEN`, `Codigo` FK. Add `/* REVIEW: cuotabasica → TIPO_PLAN */` marker in `ClientesCtasCtes.js` or here.
  - Deps: 1.1 | Verify: loads, columns match SQL | Est: M

- [ ] 2.7 Create `models/Catastro.js` — property debts (TIPO_BIEN CACA) from SQL.
  - Deps: 1.1 | Verify: loads | Est: S

- [ ] 2.8 Create `models/CIActividades.js`, `models/CementerioServicios.js` — CICI and CEM1 from SQL.
  - Deps: 1.1 | Verify: both load | Est: M

- [ ] 2.9 Create `models/AguaClientes.js`, `models/AguaServicios.js`, `models/Medidores.js`, `models/PavimentoClientes.js`, `models/PavimentoServicios.js`, `models/Feriados.js` — OBSA, pavimento, feriado columns from SQL.
  - Deps: 1.1 | Verify: all 6 load | Est: L

## Phase 3: Models Batch 2 + Associations

- [ ] 3.1 Create `models/PadronBase.js`, `models/CTACTESUM.js`, `models/Provincias.js` from SQL.
  - Deps: 2.1–2.9 | Verify: all 3 load | Est: M

- [ ] 3.2 Register all 18 new models in `models/model.index.js` — require + add to `db` object.
  - Deps: 3.1 | Verify: `Object.keys(db).length >= 22` | Est: M

- [ ] 3.3 Add 9 associations in `model.index.js`: Automotores/Catastro/CIActividades/AguaClientes/PavimentoClientes/CobrosCtaCte/ClientesCtaCteTransitoria `.belongsTo(Cliente, {foreignKey:'Codigo', as:'cliente'})`, Cliente `.belongsTo(Provincias, {foreignKey:'Provincia', as:'provincia'})`, keep existing ClientesCtaCte association.
  - Deps: 3.2 | Verify: `npm run testDB` passes, no circular dependency errors | Est: M

## Phase 4: Formula Engine

- [ ] 4.1 Create `services/intereses.service.js` — pure module exporting `calcularInteresCoeficiente(saldo, indiceFinal, coef)`, `calcularInteresSimpleFA(saldo, descInmueble, tasa, dias)`, `calcularDescuentoUnicoPago(saldo, tasaDescuento, descInmueble)`, and `calcularMovimiento(mov, config)` dispatcher branching on `cuotabasica`→`TIPO_PLAN`, `CoeficienteCuota`, `TipoMovim`, `FechaVto`/`fechadesdeintereses`. Include display column format `{dias}{tipocoef}{coef}`.
  - Deps: 1.2 | Verify: `require` returns 4 functions, no DB/env access | Est: M

## Phase 5: Integration

- [ ] 5.1 Create `services/datos-generales.service.js` — `obtenerConfigIntereses()` reads `DatosGenerales.findOne()`, returns `{tasa, descuento, indice, fecha}`, catches errors → returns nulls for fallback chain.
  - Deps: 2.1, 1.2 | Verify: mocked test returns correct shape | Est: S

- [ ] 5.2 Modify `services/deudas.service.js` — add attributes (`CoeficienteCuota`, `TipoMovim`, `TIPO_PLAN`, `ACTUALIZACION_COBRADO`, `RecIntereses`) to ClientesCtaCte query, replace inline `calcularInteres` with `calcularMovimiento` delegation, remove old formula.
  - Deps: 4.1, 5.1 | Verify: `deudas.service.js` has zero inline formula math | Est: M

## Phase 6: Tests

- [ ] 6.1 Create `tests/intereses/engine.test.js` — Mode A (coefficient fires/skipped by gate date/null coef), Mode B (simple FA/non-FA/zero dias), Mode C (discount/no-discount-when-saldo-zero/non-FA), ACTUALIZACION_COBRADO override, display format, `Saldo` as base.
  - Deps: 4.1 | Verify: `npm run testIntereses` all green | Est: M

- [ ] 6.2 Add config resolution tests in `tests/intereses/config.test.js` — DB priority, config fallback, env fallback, throw when all null, DESC_INMUEBLE per-municipio override.
  - Deps: 1.2, 5.1 | Verify: `npm run testIntereses` all green | Est: S

## Phase 7: Cleanup & Validation

- [ ] 7.1 Run `npm run testDB` against El Manzano demo — assert all 22 models sync without errors.
  - Deps: 3.3 | Verify: exit code 0 | Est: S

- [ ] 7.2 Cross-check: verify `deudas.service.js` produces matching totals for ≥3 known contribuyentes vs accountant's desktop output (manual smoke test).
  - Deps: 5.2, 6.1 | Verify: totals match within rounding | Est: M

- [ ] 7.3 Remove any TODO/FIXME markers that were resolved. Verify no dangling references to `configurable-interest-rate` in active specs.
  - Deps: all | Verify: `grep -r "configurable-interest-rate" openspec/specs/` returns nothing | Est: S
