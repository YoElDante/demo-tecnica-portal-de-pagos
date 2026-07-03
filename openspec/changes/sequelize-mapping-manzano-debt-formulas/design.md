# Design: Sequelize Mapping & El Manzano Debt Formulas

## Technical Approach

Extend the model layer from 4 to 22 tables, then replace the single `calcularInteres(importe, diasMora)` in `deudas.service.js` with a pure formula engine (`services/intereses.service.js`) that implements the accountant's 3-mode branching. Config resolution moves from env-only to `DatosGenerales` (DB) → municipio config → env fallback.

## Architecture Decisions

### Decision: Pure Engine Separation

**Choice**: `services/intereses.service.js` — zero side effects, no DB/process access, four exports (`calcularInteresCoeficiente`, `calcularInteresSimpleFA`, `calcularDescuentoUnicoPago`, `calcularMovimiento`).
**Alternatives**: Inline formulas in deudas.service.js (rejected — untestable); class-based engine (rejected — unnecessary complexity for stateless math).
**Rationale**: The engine must be testable without a database. `calcularMovimiento` is the dispatcher that branches on `cuotabasica`, `CoeficienteCuota`, `TipoMovim`, and `FechaVto`/`fechadesdeintereses` to select Mode A/B/C.

### Decision: `cuotabasica` Maps to `TIPO_PLAN`

**Choice**: Map `cuotabasica` in the dispatcher to `movimiento.TIPO_PLAN` — an empty `TIPO_PLAN` (`''` or `null`) means common debt (Mode A/B); a non-empty value means single-payment plan (Mode C).
**Alternatives**: Use `TIPO_CUOTA` or `ESTADO_DEUDA` (rejected — the accountant's `cuotabasica` represents the plan concept, closest to `TIPO_PLAN`).
**Rationale**: A `/* REVIEW: cuotabasica → TIPO_PLAN */` marker comment is left in the dispatcher for future verification against the desktop software.

### Decision: Clean Cutover (No Dual-Run)

**Choice**: Remove the old `calcularInteres` function entirely; `formatearDeuda` delegates to `calcularMovimiento`.
**Alternatives**: Feature-flag gradual rollback (rejected — over-engineering for a single formula change).
**Rationale**: The new engine produces a superset of results; if wrong, `git revert` restores the old function. Golden tests validate equivalence before deploy.

## Data Flow

```
deudas.service.js (query + format)
  │  SELECT Codigo, Saldo, FechaVto, CoeficienteCuota,
  │         TipoMovim, TIPO_PLAN, ACTUALIZACION_COBRADO, ...
  │
  ├─► datos-generales.service.js (once per request)
  │     └─ DatosGenerales.findOne() → { tasa, descuento, indice, fecha }
  │
  └─► intereses.service.js (per movement)
        └─ calcularMovimiento(mov, config) → { interes, descuento, display }
              ├─ cuotabasica='' + Coef>0 + FechaVto<fecha → Mode A
              ├─ cuotabasica='' + FA + dias>0 → Mode B
              └─ cuotabasica!='' + FA + Saldo>0 → Mode C
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `models/DatosGenerales.js` | Create | `TasaInteres`, `TasaDescuento`, `IndiceFinal`, `FechaDesdeIntereses` |
| `models/CobrosCtaCte.js` | Create | Payment-side rows (CodMovim=D) |
| `models/Numeracion.js` | Create | Ticket numbering reference |
| `models/ClientesCtaCteTransitoria.js` | Create | Transitory debt entries |
| `models/Devengamientos.js` | Create | Debt generation source |
| `models/Automotores.js` | Create | TIPO_BIEN AUAU with dominio + Codigo FK |
| `models/Catastro.js` | Create | TIPO_BIEN CACA property debts |
| `models/CIActividades.js` | Create | TIPO_BIEN CICI commerce/industry |
| `models/CementerioServicios.js` | Create | TIPO_BIEN CEM1 cemetery services |
| `models/AguaClientes.js` | Create | Water client link (OBSA) |
| `models/AguaServicios.js` | Create | Water service link (OBSA) |
| `models/PavimentoClientes.js` | Create | Pavimento client link |
| `models/PavimentoServicios.js` | Create | Pavimento service link |
| `models/Medidores.js` | Create | Water meter context for OBSA |
| `models/Feriados.js` | Create | Holiday-aware mora boundary |
| `models/PadronBase.js` | Create | Padron backbone |
| `models/CTACTESUM.js` | Create | Summarized current account |
| `models/Provincias.js` | Create | Referenced by Cliente.Provincia |
| `models/model.index.js` | Modify | Register 18 models + 9 associations (hasMany/belongsTo) |
| `services/intereses.service.js` | Create | Pure formula engine: 3 modes + dispatcher |
| `services/datos-generales.service.js` | Create | Read formula params from DatosGenerales |
| `config/intereses.config.js` | Create | Resolution chain + DESC_INMUEBLE guarded constant |
| `services/deudas.service.js` | Modify | Add attributes (CoeficienteCuota, TipoMovim, TIPO_PLAN, ACTUALIZACION_COBRADO), delegate calculation, remove old formula |
| `package.json` | Modify | Add jest devDependency + `"testIntereses": "jest tests/intereses"` |
| `tests/intereses/engine.test.js` | Create | Unit tests for all 3 modes + edge cases |
| `docs/formulas/PREGUNTAS_PARA_CONTADOR.md` | Create | Structured Spanish questions for descinmueble, etc. |
| `openspec/changes/configurable-interest-rate/` | Remove | Move to `openspec/changes/_absorbed/configurable-interest-rate/` |

## Config Resolution Chain

```
obtenerConfigIntereses() → memo per request
  1. DatosGenerales.findOne()        → { TasaInteres, TasaDescuento, IndiceFinal, FechaDesdeIntereses }
  2. municipalidad.*.tasaInteresAnual → fallback if #1 is null/undefined
  3. process.env.TASA_INTERES_ANUAL  → last resort
  4. Throw if all three are null      → preserves existing crash-on-missing behavior
```

`DESC_INMUEBLE` reads from `config/municipalidad.config.{municipio}.descinmueble`, falling back to `1.0` with `console.warn('[intereses] DESC_INMUEBLE usando valor guarda 1.0 — pendiente respuesta del contador')`.

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit | 3 formula modes + edge cases | Jest, `tests/intereses/engine.test.js`, pure functions, no DB |
| Unit | Dispatcher mode selection | Jest, same file, test cuotabasica branching |
| Integration | Config resolution chain | Jest with mocked DatosGenerales model |
| Smoke | 22 models sync | Existing `npm run testDB` — assert no errors |

## Error Handling

- **DatosGenerales query fails (DB timeout/row missing)**: Catch in `datos-generales.service.js`, log warning, return `null` values → config/env fallback chain takes over.
- **IndiceFinal is null**: Mode A condition `CoeficienteCuota > 0 && IndiceFinal != null` — skips to Mode B.
- **Coefficient is zero**: `CoeficienteCuota > 0` guard prevents Mode A; falls through to Mode B.
- **All 3 rate sources null**: Throw — same as current `TASA_INTERES_ANUAL` missing behavior.

## Model Associations (in model.index.js)

```
Automotores.belongsTo(Cliente, { foreignKey: 'Codigo', as: 'cliente' })
Catastro.belongsTo(Cliente, { foreignKey: 'Codigo', as: 'cliente' })
CIActividades.belongsTo(Cliente, { foreignKey: 'Codigo', as: 'cliente' })
AguaClientes.belongsTo(Cliente, { foreignKey: 'Codigo', as: 'cliente' })
PavimentoClientes.belongsTo(Cliente, { foreignKey: 'Codigo', as: 'cliente' })
CobrosCtaCte.belongsTo(Cliente, { foreignKey: 'Codigo', as: 'cliente' })
ClientesCtaCteTransitoria.belongsTo(Cliente, { foreignKey: 'Codigo', as: 'cliente' })
Cliente.belongsTo(Provincias, { foreignKey: 'Provincia', as: 'provincia' })
ClientesCtaCte.belongsTo(Cliente, { foreignKey: 'Codigo', as: 'cliente' })  // existing, kept
```

All use `as:` aliases to prevent unintended join cascades on existing queries.

## Naming Conventions

- **Model files**: PascalCase matching SQL table (e.g., `DatosGenerales.js` → table `DatosGenerales`)
- **Model export var**: PascalCase same as file (e.g., `const DatosGenerales = ...`)
- **Service functions**: camelCase verbs (e.g., `calcularMovimiento`, `obtenerConfigIntereses`)
- **Config constants**: SCREAMING_SNAKE (e.g., `DESC_INMUEBLE`, `TASA_INTERES_ANUAL`)
- **Test files**: `tests/intereses/engine.test.js`, matching the module under test

## Open Questions

- [ ] Accountant confirmation: `descinmueble` real value and source table
- [ ] Accountant confirmation: `FechaDesdeIntereses` boundary — inclusive or exclusive?
- [ ] Accountant confirmation: `tasadescuento` column name in `DatosGenerales` (currently assumed `TasaDescuento`)
- [ ] Accountant confirmation: `cuotabasica` mapping to `TIPO_PLAN` is correct vs desktop software
