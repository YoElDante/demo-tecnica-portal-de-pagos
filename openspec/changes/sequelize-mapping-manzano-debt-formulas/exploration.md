# Exploration: Sequelize Model Mapping & Debt Formula Update (El Manzano)

## 1. Current State

### 1.1 Database Schema Coverage

El Manzano's database (`script_creacion_bd_ElManzano_062026.sql`) defines **112 tables** across these domains:

**TRACKING (models exist ✅ — aligned in `align-sequelize-manzano-062026`)**
- `TicketsPago` — Payment ticket tracking (50 columns, PK `ticket_id`)
- `TicketPagoEventos` — Gateway event audit log (11 columns, FK → `TicketsPago.ticket_id`)

**CUSTOMER DEBT (models exist ✅ — aligned)**
- `Clientes` — 47 columns, PK `Codigo`, includes `DOCUMENTO` for DNI lookup
- `ClientesCtaCte` — 52 columns, PK `IdTrans`, FK → `Clientes.Codigo`. The central accounting table for all debt (CodMovim='H') and payment (CodMovim='D') records

**AUTOMOTOR TAX DOMAIN (no models ❌)**
- `Automotores` — 35 cols (vehicle registry, linked via `Codigo` + `ID_AUTOMOTOR`)
- `AlicuotasAutos` — 3 cols (rate by `ANO_VALUACION`)
- `CategoriasAutos` — 3 cols (type with `TIPO_CATEGORIA_AUTOMOTOR`)
- `MarcayModeloAutos` — 13 cols (valuation by year/category/CIP)
- `ValuacionAutosAnoCip` — 5 cols (base imponible by year/model/CIP)

**PROPERTY TAX DOMAIN (no models ❌)**
- `Catastro` — 65 cols (cadastre registry, `ID_CATASTRO`, `BASE_IMPONIBLE`)
- `CATASTRO26`, `CatastroAnt`, `CatastroTemp` — variant/legacy tables

**WATER SERVICE DOMAIN (no models ❌)**
- `AguaClientes` — 9 cols (`ID_AGUA`, `CODIGO_CATEGORIA`)
- `AguaServicios` — 5 cols (concept + value per category)

**CEMETERY DOMAIN (no models ❌)**
- `CementerioClientes` — 9 cols
- `CementerioServicios` — 5 cols

**PAVEMENT DOMAIN (no models ❌)**
- `PavimentoClientes` — 9 cols
- `PavimentoServicios` — 5 cols

**COMMERCE & INDUSTRY DOMAIN (no models ❌)**
- `CIActividades` — 5 cols (activity registry, category + values)
- `CIClientesActividades` — 7 cols (client → activity mapping)

**SETTLEMENT / LIQUIDATION SYSTEM (no models ❌)**
- `liquidaciones` — 12 cols (formulas per bien type)
- `Devengamientos` — 12 cols (devengo registry, `Formula_dev`)
- `TiposLiquidaciones` — 5 cols
- `Svc`, `SLiq`, `SGen`, `SConceptos`, `Srlc` — auxiliary settlement tables

**MUNICIPAL CONFIGURATION (no models ❌)**
- `DatosGenerales` — 47 cols (central config: `TasaInteres`, `TasaDescuento`, `IndiceFinal`, `FechaDesdeInt`, `DiasCuotaUnica`, `FechaPagoTotal`)
- `Numeracion` — 4 cols (auto-numbering by `Codigo`)
- `Feriados` — 1 col (holiday dates)
- `TipoMovim` — 23 cols (movement type catalog)
- `PadronBase` — 7 cols (`ID_BIEN`, `TIPO_BIEN`, `Codigo` cross-reference)
- `Provincias`, `TipoIVA`, `TipoTasaIVA`, `RegimenGanancias`, `RegimenIVA` — IVA/fiscal catalogs

**ACCOUNTING (no models ❌)**
- `Plancuentas2`, `PlanCuentas2026`, `PlanCuentasBase`, `PlanCuentasPGM`
- `LibrosContablesCuentas`, `LibrosSubDiarios`
- `CobrosCtaCte` — mirror of `ClientesCtaCte` for collections

**SUPPLIERS/PAYABLES (no models ❌)** — `Proveedores`, `ProveedoresCtaCte`, etc.

**BANKING (no models ❌)** — `Bancos`, `Tarjetas`, `CajaCtaCteCheques`, etc.

**STOCK/INVENTORY (no models ❌)** — `Stock`, `StockMovimientos`, etc.

**HR/PAYROLL (no models ❌)** — `Personal`, `PersonalCtacte`, `SueldosCtaCte`, `SueldosLiquidacion`

**OTHER (no models ❌)**
- `AccesoUsuarios`, `ActividadesUsuarios`, `MailServerConfiguracion`, `Pdfs`, `Expedientes`, `ExpedientesMovimientos`, `MIGRACION`, `TransitoriaDeCaja`, `ClientesCtaCteTransitoria`, `ClientesContactos`, `ResumenBancoCordoba`, `ResumenBancoRio`, plus retention/IVA variants

### 1.2 Debt Query Flow (End-to-End)

```
POST /buscar (dni)
  → web.controller.buscarPorDni()
    → ClientesService.buscarPorDni(dni)
      → Cliente.findOne({ where: { DOCUMENTO: dni } })       [Clientes]
    → DeudasService.obtenerDeudasPorCodigo(cliente.Codigo)
      → ClientesCtaCte.findAll({
          where: { Codigo, Saldo: { [Op.ne]: 0 } }
        })                                                    [ClientesCtaCte]
    → DeudasService.formatearDeuda(deuda)
      → calcularDiasMora(FechaVto)
      → calcularInteres(importe, diasMora)
        → interes = importe * TASA_DIARIA * diasMora          [current formula]
```

**Current interest formula (in `services/deudas.service.js`):**
```js
const TASA_INTERES_ANUAL = process.env.TASA_INTERES_ANUAL;  // from env
const TASA_DIARIA = TASA_INTERES_ANUAL / 100 / 365;
interes = importe * TASA_DIARIA * diasMora;
total = importe + interes;
```

**Formula variables used:**
- `importe` → `ClientesCtaCte.Importe`
- `diasMora` → calculated from `ClientesCtaCte.FechaVto` vs today
- `TASA_INTERES_ANUAL` → `process.env.TASA_INTERES_ANUAL` (NOT from `DatosGenerales.TasaInteres`)

### 1.3 Accountant's Formula Analysis

The Python code from `formulas_alcaldia_072026.txt` reveals **three distinct calculation modes** that the desktop software uses:

**Mode A: Coefficient-based recalculation (highest priority)**
```python
if grupoF.CoeficienteCuota is not None:
    if fecha_bd < fecha_limite and grupoF.CoeficienteCuota > 0:
        # Recalculate debt using coefficient index
        coef = indicefinalint / grupoF.CoeficienteCuota
        elinteres = grupoF.Saldo * (indicefinalint / grupoF.CoeficienteCuota)
```
- Uses: `grupoF.CoeficienteCuota`, `indicefinalint` (from `DatosGenerales.IndiceFinal`), `fecha_limite` (from `DatosGenerales.FechaDesdeInt`)
- When: `CoeficienteCuota` IS NOT NULL AND the debt date is BEFORE the limit date AND coefficient > 0
- This recalculates the ORIGINAL debt value using an inflation index, then charges interest on the recalculated amount

**Mode B: Simple interest for "FA" (Factura) type debts**
```python
if grupoF.TipoMovim == "FA" and dias > 0:
    elinteres = grupoF.Saldo * descinmueble * (tasainteres/365/100) * dias
```
- Uses: `descinmueble` (a multiplier), `tasainteres` (from config/env or DatosGenerales)
- When: debt type is FA AND days overdue > 0 AND coefficient is null OR date is past limit

**Mode C: Discount for "cuota básica vacía" (unique payment)**
```python
if cuotabasica == '':
    # ... no discount logic, just interest
else:
    if grupoF.TipoMovim != "FA":
        eldescuento = 0
    else:
        eldescuento = grupoF.Saldo * (tasadescuento/100) * descinmueble
```
- When `cuotabasica` is NOT empty: applies a discount for single-payment plans
- Uses: `tasadescuento` (from `DatosGenerales.TasaDescuento` or env), `descinmueble`

**Key variables mapped to DB:**
| Python variable | DB table.column | Notes |
|---|---|---|
| `grupoF.Saldo` | `ClientesCtaCte.Saldo` | Current balance |
| `grupoF.FechaVto` | `ClientesCtaCte.FechaVto` | Due date |
| `grupoF.CoeficienteCuota` | `ClientesCtaCte.CoeficienteCuota` | Inflation coefficient |
| `grupoF.TipoMovim` | `ClientesCtaCte.TipoMovim` | "FA" = Factura |
| `grupoF.RecIntereses` | `ClientesCtaCte.RecIntereses` | Recorded interest |
| `grupoF.ACTUALIZACION_COBRADO` | `ClientesCtaCte.ACTUALIZACION_COBRADO` | Already-paid update |
| `tasainteres` | `DatosGenerales.TasaInteres` | Annual rate |
| `tasadescuento` | `DatosGenerales.TasaDescuento` | Discount rate |
| `indicefinalint` | `DatosGenerales.IndiceFinal` | Final index |
| `fechadesdeintereses` | `DatosGenerales.FechaDesdeInt` | Start date for interest |
| `descinmueble` | Unknown / hardcoded | Property discount factor — NEEDS CLARIFICATION |

### 1.4 Configurable Rate Progress

The `openspec/changes/configurable-interest-rate/` has a proposal, design, and open tasks but is **NOT yet implemented**. Current state:
- `deudas.service.js` reads `TASA_INTERES_ANUAL` from `process.env` (implemented in the refactored version already)
- Fallback `tasaInteresAnual: 40` exists in `municipalidad.config.elmanzano.js`
- The DB `DatosGenerales` table actually has `TasaInteres` and `TasaDescuento` columns that the desktop software uses — the web portal ignores them

### 1.5 Existing Specs

| Spec | Status |
|---|---|
| `openspec/specs/data-model/spec.md` | ✅ Exists (from `align-sequelize-manzano-062026`) — covers only the 4 aligned models |
| `openspec/specs/interest-calculation/spec.md` | ✅ Exists — simple daily formula, doesn't cover coefficient logic |
| `openspec/specs/documentation/spec.md` | Exists |
| `openspec/specs/multi-municipio/spec.md` | Exists |
| `openspec/specs/payment-gateway-contract/spec.md` | Exists |
| `openspec/specs/ticket-lifecycle/spec.md` | Exists |

---

## 2. What's Missing (Gaps)

### Gap 1: ~108 Tables Without Models
Only 4 of 112 tables have Sequelize models. The remaining 108 tables cannot be queried through the ORM — raw SQL would be needed.

### Gap 2: Debt Formula is Too Simple
The current `interes = importe * (tasa/36500) * dias` does NOT handle:
- **Coefficient-based recalculation** (inflation indexing) using `CoeficienteCuota` + `DatosGenerales.IndiceFinal`
- **Property discount** (`descinmueble`) for FA-type debts
- **Discount for single-payment** (`cuotabasica`)
- **Per-type rate differentiation** (different calculation for FA vs other types)

### Gap 3: Interest Rate Not Connected to DatosGenerales
The env var `TASA_INTERES_ANUAL` has no fallback to `DatosGenerales.TasaInteres` and no support for `DatosGenerales.IndiceFinal` / `FechaDesdeInt`.

### Gap 4: Unknown `descinmueble` Factor
The accountant's formula uses `descinmueble` as a multiplier — this variable's value and origin are unknown. It's likely a fixed percentage or a configurable per-municipio value. **Needs clarification from the accountant.**

### Gap 5: No Migration/Seed Strategy
Even with models defined, there's no mechanism to populate or migrate data for El Manzano specifically.

---

## 3. Key Technical Decisions Needed

### Decision A: Which tables get Sequelize models?
**Options:**
1. **ALL 112 tables** — comprehensive but ~8,000+ lines of model code
2. **~15-20 core tables** — debt domain only (Clientes, ClientesCtaCte, Automotores, Catastro, AguaClientes, CementerioClientes, PavimentoClientes, CIClientesActividades, CIActividades, DatosGenerales, Numeracion, liquidaciones, Devengamientos, PadronBase, AlicuotasAutos, CategoriasAutos, ValuacionAutosAnoCip, Feriados, TipoMovim, TiposLiquidaciones) — ~1,500 lines
3. **Phased approach** — core tables first, then auxiliary

**Recommendation: Option 3** — core debt domain first (~20 tables), then auxiliary/accounting later

### Decision B: Where to implement the accountant's formula?
**Options:**
1. **In JS (deudas.service.js)** — same as current approach, more flexible
2. **In SQL (stored procedure or raw query)** — closer to the data, harder to test
3. **Hybrid** — coefficient calculation in SQL JOIN, interest math in JS

**Recommendation: Option 3** — coefficient lookup requires joining ClientesCtaCte with DatosGenerales and the liquidaciones tables; do the math in JS for testability

### Decision C: Interest rate source priority
**Options:**
1. `process.env.TASA_INTERES_ANUAL` → `DatosGenerales.TasaInteres` → hardcoded default
2. `DatosGenerales.TasaInteres` → `process.env` → hardcoded default
3. Per-municipio config (`municipalidad.config.*.js`) → env → DatosGenerales

**Recommendation: Option 1** — env var overrides everything (12-factor), with DB fallback for when env is not set

### Decision D: Handle `descinmueble`
This factor needs clarification. Likely options:
- Fixed 0.5 (50% discount for property) — most common in municipal systems
- Per-municipio config value
- Replaced by / derived from `TasaDescuento` in DatosGenerales

**Recommendation:** Default to 1.0 (no adjustment) until the accountant confirms the correct value

### Decision E: Model naming convention for existing debt tables
The existing `ClientesCtasCtes.js` model uses the plural-with-inconsistency name. New models should follow a consistent convention:
- Use singular PascalCase matching the table name: `Automotor`, `Catastro`, `AguaCliente`, `DatosGenerale` (or `DatosGenerales`)
- OR use the exact table name: `ClientesCtaCte` (current pattern)

**Recommendation:** Follow the same pattern as `ClientesCtaCte` — use the table name as the model name for consistency

---

## 4. Risk Areas

### Risk 1: Model volume
108 new models at ~75 lines each = ~8,100 lines of boilerplate. This is a large change that should be scoped carefully to avoid review fatigue.

### Risk 2: Formula complexity
The accountant's Python code has nested conditionals, implicit fallthrough, and unclear variable origins. Translating it to JS/production code requires careful handling of every edge case.

### Risk 3: descinmueble unknown
Without knowing this value, the FA-type debt calculation cannot be implemented correctly. This is a **blocking dependency** for the formula update.

### Risk 4: Date boundary differences
The accountant's code checks `fecha_bd < fecha_limite` (date before limit). The current code doesn't use `FechaDesdeInt` at all. Changing this can change which debts get coefficient recalculation vs. simple interest.

### Risk 5: Breaking existing amounts
Any change to the interest formula will produce different amounts shown to users who have already seen quotes. The system must be transparent and consistent.

---

## 5. Recommended Approach

### Scope Boundary

Split into **two complementary work streams** that can be developed and reviewed independently:

**Phase A: Debt Formula Update** (PRIORITY — ~15-20 tables)
1. ✓ Already done: `Clientes`, `ClientesCtaCte`, `TicketsPago`, `TicketPagoEventos`
2. **NEW priority models**: `DatosGenerales` (for rate config lookup), plus the ~15-20 tables that are directly referenced in debt/liquidation calculations
3. Update `deudas.service.js` with the accountant's formula logic (coefficient recalculation, per-type interest, discount)
4. Connect `DatosGenerales` as the source of truth for rate config
5. Clarify `descinmueble` with the accountant first

**Phase B: Full Schema Coverage** (LOWER PRIORITY — remaining ~88 tables)
1. Generate models for auxiliary/accounting tables (banks, stock, suppliers, etc.)
2. These are NOT needed for debt query — defer to when those domains are needed

### Order of Work

1. **Explore** ✅ (this document)
2. **Proposal** — Define scope (Phase A vs Phase B), decide `descinmueble` origin
3. **Spec** — Document the formula logic with scenarios for each mode (coefficient, simple, discount)
4. **Design** — Architecture for coefficient lookup (join path: ClientesCtaCte → liquidaciones? → DatosGenerales)
5. **Tasks** — Break into model creation tasks and formula implementation tasks
6. **Apply** — Implement in priority order (DatosGenerales model first, then formula logic, then remaining debt domain models)
7. **Verify** — Test with real data from El Manzano to compare against desktop software output

### Ready for Proposal

**Yes** — with these caveats:
- `descinmueble` value MUST be clarified with the accountant before the formula can be implemented
- The proposal should explicitly scope Phase A (debt domain models + formula) and defer Phase B (remaining 88 tables)
- The existing `configurable-interest-rate` change should be absorbed into this change rather than kept separate
