# Proposal: Sequelize Mapping & El Manzano Debt Formulas

## Intent

Align the Sequelize model layer with the accountant's real debt-calculation logic for El Manzano. Today only 4 of 112 tables have models, and `deudas.service.js` computes interest with the simplified formula `importe * (tasa/36500) * diasMora`, ignoring the accountant's 3 calculation modes (coefficient recalculation, simple interest on FA-type debts with `descinmueble`, single-payment discount). The interest rate is read only from `process.env` and never from `DatosGenerales.TasaInteres`. This change produces type-safe models for the ~22 debt-domain tables the portal actually queries, and rewrites the debt-calculation service to match the accountant's reference implementation (with `descinmueble` resolved via the accountant questions file).

## Scope

### In Scope
- Sequelize models for **22 debt-domain tables** (4 exist + 18 new), aligned to `script_creacion_bd_ElManzano_062026.sql`.
- Refactor of `services/deudas.service.js` to implement the accountant's 3 calculation modes from `docs/formulas/formulas_alcaldia_072026.txt`.
- Read `tasaInteres`, `tasadescuento`, `indicefinalint` (IndiceFinal), and `fechadesdeintereses` from `DatosGenerales` (DB) with env-var fallback and municipal config fallback.
- Introduce `descinmueble` setter (single source of truth) once the accountant answers in `PREGUNTAS_PARA_CONTADOR.md`; until answered, expose it as a guarded constant with a loud warning.
- Absorb the pending `configurable-interest-rate` change (tape out its old artifacts; supersede its intent).
- Unit tests for the 3 formula modes + date boundary + coefficient mode selection.
- `docs/formulas/PREGUNTAS_PARA_CONTADOR.md` with structured Spanish questions for the accountant.

### Out of Scope
- Models for the remaining ~88 auxiliary tables (Stock, Sueldos, Tarjetas, Proveedores, Bancos, PlanCuentas, Retenciones, MIGRACION, MarcayModelo, historical Catastro variants, etc.).
- Changing municipality config for municipalities other than El Manzano.
- Email/SendGrid integration and comprobantes por email.
- Hardening HTTP (helmet/HTTPS) — owned by `security-hardening`.
- Ticket-lifecycle tracking — owned by `ticket-payment-tracking`.

## Tables in Scope (22)

| # | Table | Role | New/Existing |
|---|-------|------|--------------|
| 1 | `Clientes` | Contribuyente master | Existing (aligned) |
| 2 | `ClientesCtaCte` | Deuda/cobro rows (Saldo, FechaVto, CoeficienteCuota, TipoMovim, ACTUALIZACION_COBRADO, RecIntereses) | Existing (aligned) |
| 3 | `TicketsPago` | Ticket emission | Existing (aligned) |
| 4 | `TicketPagoEventos` | Ticket webhooks/idempotency | Existing (aligned) |
| 5 | `DatosGenerales` | TasaInteres, TasaDescuento, IndiceFinal, FechaDesdeIntereses | New — formula source of truth |
| 6 | `Numeracion` | Ticket numbering reference | New |
| 7 | `CobrosCtaCte` | Payment side (CodMovim D) for state/idempotency checks | New |
| 8 | `ClientesCtaCteTransitoria` | Transitory debt entries | New |
| 9 | `Devengamientos` | Debt generation source | New |
| 10 | `Automotores` | TIPO_BIEN `AUAU` (dominio + ID_BIEN lookup) | New |
| 11 | `Catastro` | TIPO_BIEN `CACA` property debts | New |
| 12 | `CIActividades` | TIPO_BIEN `CICI` comercio/industria | New |
| 13 | `CementerioServicios` | TIPO_BIEN `CEM1` | New |
| 14 | `AguaClientes` | TIPO_BIEN `OBSA` client link | New |
| 15 | `AguaServicios` | TIPO_BIEN `OBSA` service link | New |
| 16 | `PavimentoClientes` | Pavimento debts client link | New |
| 17 | `PavimentoServicios` | Pavimento debts service link | New |
| 18 | `Medidores` | Water meter context for OBSA | New |
| 19 | `Feriados` | Holiday-aware date boundary for mora | New |
| 20 | `PadronBase` | Padron backbone | New |
| 21 | `CTACTESUM` | Summarized current account | New |
| 22 | `Provincias` | Referenced by `Cliente.Provincia` | New |

**Deferred**: `CatastroAnt`, `CatastroTemp`, `CATASTRO26` (historical variants); `aaapruebaliq` (test); all accounting/stock/payroll/bank/tarjeta/supplier/HR/migration tables.

## Formula Changes (3 modes from accountant's Python)

Reference: `docs/formulas/formulas_alcaldia_072026.txt`. Branching on `cuotabasica` (empty => common debt / non-empty => single-payment discount) and on `CoeficienteCuota`:

| Mode | Condition | Current behavior | Accountant's formula |
|------|-----------|------------------|----------------------|
| **A — Coefficient** | `cuotabasica == ''` AND `CoeficienteCuota > 0` AND `FechaVto < fechadesdeintereses` | NOT implemented; falls through to simple interest | `interes = Saldo * (IndiceFinal / CoeficienteCuota)` |
| **B — Simple interest with `descinmueble`** | `cuotabasica == ''` AND (`CoeficienteCuota` null OR coefficient path not taken) AND `TipoMovim == "FA"` AND `dias > 0` | Uses `importe * tasaDiaria * dias` ignoring `descinmueble` and `TipoMovim` | `interes = Saldo * descinmueble * (tasa/365/100) * dias` |
| **C — Single-payment discount** | `cuotabasica != ''` AND `Saldo > 0` AND `TipoMovim == "FA"` | NOT implemented | `descuento = (Saldo * tasadescuento/100 * descinmueble) * -1` |
| (non-FA, non-discount) | otherwise | Returns 0 for non-FA | Returns 0 — matches |

Key deltas vs current `calcularInteres`:
- Formula base is `Saldo` (not `Importe`).
- Daily interest applies only when `TipoMovim == "FA"`.
- `descinmueble` factor multiplies both interest (Mode B) and discount (Mode C) — currently absent.
- `DatosGenerales.FechaDesdeIntereses` is the gate date for Mode A; before that date, coefficient recalculation replaces daily interest.
- `ACTUALIZACION_COBRADO` is shown in place of computed interest when `Saldo <= 0` and the column is set.
- Display column 4 format: `{dias}{tipocoef}{coef}` where `tipocoef` ∈ `{T:, C:, X}`.

## Approach

- **Model generation**: hand-author each new model in `models/` following the established pattern (`Cliente.js`, `ClientesCtasCtes.js`). All columns, types, and constraints transcribed verbatim from the SQL script. Register each in `models/model.index.js` with explicit associations (Cliente ↔ ClientesCtaCte, Automotores ↔ Cliente by Codigo, Catastro ↔ Cliente, etc.). No `sequelize-auto` — keep alignment auditable.
- **Formula engine**: extract a pure `services/intereses.service.js` with three exported functions `calcularInteresCoeficiente`, `calcularInteresSimpleFA`, `calcularDescuentoUnicoPago`, plus a dispatcher `calcularMovimiento(movimiento, config)`. Keep `deudas.service.js` as the orchestration/query layer; it delegates to `intereses.service.js`. This follows the project skill `deuda-interest-calculation/SKILL.md` and the existing `interest-calculation` spec.
- **Config resolution order**: `DatosGenerales` (DB) > `MUNICIPIO` config (`tasaInteresAnual`) > `process.env.TASA_INTERES_ANUAL`. First non-null wins; missing all three throws (current crash-on-missing-env behavior preserved).
- **`descinmueble` handling**: a single guarded constant `DESC_INMUEBLE` in `config/intereses.config.js`, defaulting to `1.0` with a startup `console.warn` until the accountant answers. Once answered, set the real value in `config/municipalidad.config.elmanzano.js` and remove the warning.
- **Testing**: Jest unit tests against the pure engine with golden cases derived from the accountant's own example rows; mirror the 3 modes plus edge cases (Saldo 0, FechaVto null, non-FA with dias > 0, coefficient mode disabled by `fechadesdeintereses`). Add `npm run testIntereses`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `models/*.js` (18 new files) | New | Debt-domain Sequelize models |
| `models/model.index.js` | Modified | Register new models + associations |
| `services/deudas.service.js` | Modified | Delegate to `intereses.service.js`; query additional columns (`CoeficienteCuota`, `RecIntereses`, `ACTUALIZACION_COBRADO`, `TipoMovim`, `cuotabasica`) |
| `services/intereses.service.js` | New | Pure formula engine (3 modes + dispatcher) |
| `services/datos-generales.service.js` | New | Reads tasa/descuento/indice/fecha from `DatosGenerales` |
| `config/intereses.config.js` | New | Resolution order + `DESC_INMUEBLE` guarded constant |
| `config/municipalidad.config.elmanzano.js` | Modified | Add `descinmueble` once accountant answers |
| `docs/formulas/PREGUNTAS_PARA_CONTADOR.md` | New | Structured accountant questions |
| `openspec/changes/configurable-interest-rate/` | Removed | Absorbed; intent superseded by this change |
| `openspec/changes/sequelize-mapping-manzano-debt-formulas/specs/` | New | Delta specs for `data-model` + `interest-calculation` |
| `tests/intereses/*.test.js` | New | Unit tests for formula modes |

## Capabilities

> Researched `openspec/specs/`: existing capabilities are `data-model`, `interest-calculation`, `multi-municipio`, `payment-gateway-contract`, `ticket-lifecycle`, `documentation`.

### New Capabilities

- `debt-formula-engine`: the pure formula engine implementing the accountant's 3 modes (coefficient / simple-FA / single-payment discount) with `descinmueble` and DatosGenerales config resolution. Owns Mode selection, date gating by `FechaDesdeIntereses`, and display-column-format emulation.

### Modified Capabilities

- `data-model`: requirements grow from "4 aligned models" to "22 debt-domain models registered, with associations and constraints matching `script_creacion_bd_ElManzano_062026.sql`". Adds the 18 new tables as delta requirements.
- `interest-calculation`: superseded requirements — the explicit single-formula requirement is replaced by the 3-mode branching logic; the "tasa configurable" requirement is kept but the source of truth moves from env-only to DatosGenerales > config > env resolution order. Absorbs the `configurable-interest-rate` change.
- `multi-municipio`: minor — `descinmueble` and formula config keys become per-municipio values, not hard-coded to El Manzano.

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| `descinmueble` unknown — accountant does not answer before implementation | High | Guarded constant default `1.0` + loud startup warn; documented in `PREGUNTAS_PARA_CONTADOR.md`; fails safe (current behavior equivalent) |
| `DatosGenerales.FechaDesdeIntereses` semantics ambiguous (inclusive? exclusive?) | Medium | Capture as explicit accountant question; add a test asserting the documented interpretation |
| Mode A coefficient recalculation produces amounts visibly different from desktop system | Medium | Golden tests against the accountant's example rows; flag rows where Mode A fired vs Mode B in dev logs |
| Date boundary: `dias = 0` on the vencimiento day vs `dias > 0` from day after | Medium | Preserve existing `calcularDiasMora` (already returns 0 on vencimiento day); document in accountant question if disagrees |
| 18 new models introduce query bugs if column types mis-transcribed | Medium | Each model committed with a side-by-side check comment pointing to SQL line numbers; `npm run testDB` extended to assert table sync |
| Registered associations (e.g., Automotores ⇄ Cliente) trigger unwanted joins in existing queries | Low | Use `as:` aliases consistently; do not change existing query includes |
| Absorbing `configurable-interest-rate` loses its history | Low | Keep the absorbed folder as one-line pointer or archive it under `openspec/changes/_absorbed/` |

## Rollback Plan

1. `git revert` the merge commit on `develop`.
2. Each model file is additive and registered in `model.index.js` — revert restores the 4-model state.
3. `services/intereses.service.js` and `config/intereses.config.js` are new files; their deletion restores `deudas.service.js` to the simplified formula.
4. Re-enable the `configurable-interest-rate` change folder from archive if it must proceed independently.
5. `PREGUNTAS_PARA_CONTADOR.md` may remain — it is harmless documentation.

## Dependencies

- **Accountant answers** for `descinmueble`, `FechaDesdeIntereses` boundary, and the exact source of `tasadescuento` (DatosGenerales column name). Tracked in `docs/formulas/PREGUNTAS_PARA_CONTADOR.md`.
- **Prior change** `align-sequelize-manzano-062026` (already merged) — the 4 existing models are already aligned; this change extends the same alignment discipline.
- **Absorbs** `openspec/changes/configurable-interest-rate/` — its intent is a strict subset of this change.
- No new npm dependencies. Sequelize and tedious already present.

## Success Criteria

- [ ] 18 new Sequelize models load without `sync` errors against El Manzano DB (`npm run testDB` green).
- [ ] `models/model.index.js` exports 22 models with associations resolvable.
- [ ] `services/intereses.service.js` passes unit tests for all 3 formula modes + edge cases (`npm run testIntereses` green).
- [ ] `deudas.service.js` produces identical totals to the accountant's desktop software on at least 5 golden example contribuyentes.
- [ ] Tasa de interés is resolved from DatosGenerales when present, falling back to municipal config, then to env — verified by integration test.
- [ ] `docs/formulas/PREGUNTAS_PARA_CONTADOR.md` delivered to the accountant with answers captured for `descinmueble`.
- [ ] `configurable-interest-rate` folder is archived/absorbed; no dangling references in `openspec/specs/`.