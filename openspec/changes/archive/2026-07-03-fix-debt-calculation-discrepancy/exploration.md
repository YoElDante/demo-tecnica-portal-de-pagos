# Exploration: fix-debt-calculation-discrepancy

## Current Algorithm (Portal)

### How the Portal Calculates Debt Today

#### Query Path
```
DNI → web.controller.buscarPorDni()
  → clientes.service.buscarPorDni(dni) → Cliente.findOne({ DOCUMENTO: dni })
  → deudas.service.obtenerDeudasPorCodigo(Codigo)
      → ClientesCtaCte.findAll({
          where: { Codigo, CodMovim: 'H', Saldo: { [Op.ne]: 0 } },
          attributes: [IdTrans, Fecha, FechaVto, Detalle, Dominio,
                       NRO_CUOTA, ANO_CUOTA, TIPO_BIEN, ID_BIEN,
                       Importe, Saldo, CoeficienteCuota, TipoMovim,
                       TIPO_PLAN, ACTUALIZACION_COBRADO, RecIntereses]
        })
      → datos-generales.service.obtenerConfigIntereses()
          → DatosGenerales.findOne({ TasaInteres, TasaDescuento, IndiceFinal, FechaDesdeInt })
      → formatearDeuda() → intereses.service.calcularMovimiento(mov, config)
```

#### Formula Engine (`services/intereses.service.js`)

**Modo A — Coeficiente** (lines 101-118):
- Condition: `CoeficienteCuota > 0` AND `FechaVto <= fechaDesdeIntereses` AND `IndiceFinal != null`
- Formula: `interés = Saldo * (IndiceFinal / CoeficienteCuota)`
- Returns `tipo: 'C'`

**Modo B — Interés Simple** (lines 121-124):
- Condition: falls through from Modo A (not triggered), AND `TipoMovim === 'FA'` AND `dias > 0`
- Formula: `interés = Saldo * (tasaInteres / 365 / 100) * dias`
- Returns `tipo: 'T'`

**Modo A — Actualización** (lines 127-131):
- Condition: `Saldo <= 0` AND `ACTUALIZACION_COBRADO != null`
- Formula: `interés = ACTUALIZACION_COBRADO`
- Returns `tipo: 'A'`

#### Total Calculation (`deudas.service.js` line 302)
```js
const total = Number((saldo + resultado.interes).toFixed(2));
```
✅ Already uses `Saldo`, not `Importe`.

#### Configuration Resolution (`deudas.service.js` lines 91-119)
```
DatosGenerales (BD) → municipio config → process.env → fallback 40%
```
Cached with 60-second TTL.

### Key File References

| File | Role |
|------|------|
| `services/deudas.service.js` | Debt query, formatting, config resolution |
| `services/intereses.service.js` | Formula engine (Mode A, B) |
| `services/datos-generales.service.js` | Reads DatosGenerales config |
| `models/ClientesCtasCtes.js` | Sequelize model — `CoeficienteCuota` field exists |
| `models/DatosGenerales.js` | Sequelize model — `IndiceFinal`, `FechaDesdeInt` fields exist |
| `controllers/web.controller.js` | DNI search handler |
| `tests/intereses/engine.test.js` | Unit tests for formula engine |

---

## Correct Algorithm (Desktop Software)

### From the Python Formula (`docs/formulas/formulas_alcaldia_072026.txt`)

```
For each debt row with Saldo > 0:
1. Calculate days from due date: dias = (now - FechaVto).days
  
2. If CoeficienteCuota IS NOT NULL:
     If FechaVto < FechaDesdeInt AND CoeficienteCuota > 0:
       --> Mode A: interés = Saldo * (IndiceFinal / CoeficienteCuota)
       Display prefix: "C:"
     Else:
       If TipoMovim == "FA" AND dias > 0:
         --> Mode B: interés = Saldo * descinmueble * (tasainteres / 365 / 100) * dias
       Else:
         interés = 0
  Else (CoeficienteCuota IS NULL):
     If TipoMovim == "FA" AND dias > 0:
       --> Mode B: interés = Saldo * descinmueble * (tasainteres / 365 / 100) * dias
     Else:
       interés = 0

3. TOTAL = Saldo + interés
```

### Key Differences from Python Source

| Aspect | Python (Accountant) | JS (Portal) | Match? |
|--------|-------------------|-------------|--------|
| **Mode A condition** | `CoeficienteCuota is not None AND FechaVto < fecha_limite AND CoeficienteCuota > 0` | `coefCuota > 0 AND FechaVto <= fechaLimite AND indiceFinal != null` | **Minor**: `<` vs `<=` — portal is MORE inclusive |
| **Mode B condition** | `TipoMovim == "FA" AND dias > 0` | `tipoMovim === 'FA' AND dias > 0` | ✅ Same |
| **Mode B formula** | `Saldo * descinmueble * (tasa/365/100) * dias` | `Saldo * (tasa/365/100) * dias` | **❌ Missing `descinmueble`** |
| **Index source** | Uses `indicefinalint` (global var in desktop) | Uses `config.indiceFinal` from BD | ✅ Same in theory |
| **Coef field name** | `grupoF.CoeficienteCuota` | `mov.CoeficienteCuota` | ✅ Same |
| **TOTAL** | `Saldo + Int_Dto` (confirmed in CSV) | `saldo + resultado.interes` | ✅ Now same |
| **Due date comparison** | `FechaVto < FechaDesdeInt` | `fechaVtoDate <= fechaLimite` | **Minor**: portal counts boundary day |
| **descinmueble** | Multiplied in Mode B formula | Omitted (assumed 1.0, pre-applied to Saldo) | **❌ UNCONFIRMED** |
| **Rounding** | `"{:,.2f}".format()` (banker's rounding) | `Math.round(x * 100) / 100` (half-away-from-zero) | **Minor**: ±0.01 at .5 boundaries |

---

## Discrepancy Analysis

### Verified Discrepancies from CSV Comparisons

#### 1. OLD DEBTS (pre-2021): Coefficient Not Applied — MASSIVE Delta

**Example: PLAINO 15/04/2019**
| Field | Portal | Desktop | Delta |
|-------|--------|---------|-------|
| Importe/Saldo | $289.52 | $289.52 | $0.00 |
| Int/Dto | **$836.67** | **$10,455.53** | **-$9,618.86** |
| Total | $1,126.19 | $10,745.05 | **-$9,618.86** |

**Root cause**: The portal falls back to Mode B (simple interest at 40%/year for 2,635 days = $836), while the desktop applies Mode A (coefficient factor of ~36.11 = $10,455).

**The Modo A coefficient branch is NOT triggering**. Possible causes:
- `CoeficienteCuota` is NULL or 0 in the portal's `ClientesCtaCte` table
- `IndiceFinal` in `DatosGenerales` is NULL (coefficient calculation returns 0)
- `FechaDesdeInt` in `DatosGenerales` is NULL (coefficient branch skipped)

**Conclusion**: The formula engine code is correct, but the DATA is missing.

#### 2. RECENT DEBTS (2025+): 1-Day Date Discrepancy

**Example: PLAINO 31/10/2025**
| Field | Portal | Desktop | Delta |
|-------|--------|---------|-------|
| Importe | $13,200.00 | $13,200.00 | $0.00 |
| Saldo | $14,520.00 | $14,520.00 | $0.00 |
| Int/Dto | **$3,914.43** | **$3,898.52** | **+$15.91** |
| Total | **$18,434.43** | **$18,418.52** | **+$15.91** |

Both use the same Saldo ($14,520) and same Base rate. The difference is 1 day of interest.

- Portal uses 246 days → $14,520 × (40/36500) × 246 = $3,914.43
- Desktop uses 245 days → $14,520 × (40/36500) × 245 = $3,898.52

**Root cause**: Date/timezone handling in `intereses.service.js:calcularDiasMora()` uses `new Date(fechaVto)` which interprets DB date strings as UTC, then converts to local time. `setHours(0,0,0,0)` on a UTC-origin date produces inconsistent results with DST transitions.

#### 3. RECENT DEBTS (2025+): 10% Saldo Markup

**Example: PLAINO 31/10/2025**
- `Historico (Importe)` = $13,200.00
- `Saldo` = $14,520.00 (= $13,200 × 1.1)

But for **2024 and older** debts, `Saldo = Importe = Historico` (no markup).

**Observations across all 5 contributors:**
- 2025 debts → Saldo = Importe × 1.1 (exactly, for all Tasa Serv. a la Prop. and Comercio e Industria)
- 2024 debts → Saldo = Importe (no markup)
- 2023 debts → Saldo = Importe (no markup)
- Pre-2023 debts → Saldo = Importe (no markup)
- MISERENDINO 2026 (RDIG. COMERCIO): Saldo = Importe (no 1.1x)

**This is NOT an interest calculation issue** — it's a database data issue. The portal's `ClientesCtaCte.Saldo` field either already has the 1.1x markup (matching the desktop) or doesn't.

From the portal CSV, we see `Importe` displayed (not `Saldo`). We need to verify what the portal DB actually has for `Saldo` vs `Importe`.

#### 4. All 5 Contributors: Total Discrepancy Summary

| Contributor | Portal Total | Desktop Total | Delta | Primary Cause |
|------------|-------------|---------------|-------|---------------|
| PLAINO | $175,090.40 | $356,453.20 | -$181,362.80 | Coefficients for 21 old rows |
| MISERENDINO | $537,020.60 | $1,836,868.32 | -$1,299,847.72 | Coefficients for 30 old rows |
| CRAVERO | $1,021,635.91 | $1,139,399.36 | -$117,763.45 | Coefficient + date issues |
| CACERES | $341,251.52* | $1,200,586.61 | -$859,335.09 | Coefficients for 23 old rows |
| OLMOS | $309,561.46* | $597,465.93 | -$287,904.47 | Coefficients for 18 old rows |

*Portal CSVs show "Subtotal Pág. 1" — likely truncated.

---

## Database Mapping

### Fields Used vs Fields Needed

| Table | Field | Used by Portal? | Used by Desktop? | Notes |
|-------|-------|-----------------|------------------|-------|
| `ClientesCtaCte` | `CoeficienteCuota` | ✅ Queried, used in Mode A | ✅ Core for Mode A | **SUSPECT**: Likely NULL/0 in portal DB |
| `ClientesCtaCte` | `Saldo` | ✅ Interest base | ✅ Interest base | ✅ Same field |
| `ClientesCtaCte` | `Importe` | ✅ Display only | ✅ Display as "Historico" | ✅ Aligned |
| `ClientesCtaCte` | `TipoMovim` | ✅ 'FA' trigger for Mode B | ✅ 'FA' trigger for Mode B | ✅ Same |
| `ClientesCtaCte` | `ACTUALIZACION_COBRADO` | ✅ Used when Saldo ≤ 0 | ✅ Used when Saldo ≤ 0 | ✅ Same |
| `ClientesCtaCte` | `RecIntereses` | ❌ Queried, commented out | ❌ Commented out in Python | ⚠️ Both ignore it |
| `DatosGenerales` | `IndiceFinal` | ✅ Queried (nullable) | ✅ Core for Mode A | **SUSPECT**: Likely NULL in portal DB |
| `DatosGenerales` | `FechaDesdeInt` | ✅ Queried (nullable) | ✅ Core for Mode A | **SUSPECT**: Likely NULL in portal DB |
| `DatosGenerales` | `TasaInteres` | ✅ Used in Mode B | ✅ Used in Mode B | ✅ Same |
| `DatosGenerales` | `TasaDescuento` | ✅ Queried but unused after Mode C removal | ✅ Used for cuota única | ⚠️ Mode C removed |

### Critical Data Investigation Needed

1. **Does `ClientesCtaCte.CoeficienteCuota` have values for old debts?**
   - Query: `SELECT TOP 10 CoeficienteCuota, FechaVto, Saldo FROM ClientesCtaCte WHERE CoeficienteCuota IS NOT NULL AND CoeficienteCuota > 0`
   - If empty: the portal DB doesn't have coefficient data → needs data migration

2. **Does `DatosGenerales.IndiceFinal` have a value?**
   - Query: `SELECT IndiceFinal, FechaDesdeInt FROM DatosGenerales`
   - If NULL: coefficient branch never triggers → needs manual configuration

3. **What is the `descinmueble` value?**
   - Is it a constant, a table field, or a per-municipio config?
   - The Python code references it in Mode B formula. The portal assumes it's 1.0 or already baked into Saldo.

4. **Why does `Saldo = Importe × 1.1` for 2025 debts?**
   - Is this a desktop-only calculation applied at export time?
   - Or does the DB actually store Saldo with the 10% surcharge?

---

## Affected Files

### Primary Changes Needed

| File | Change Required | Priority | Effort |
|------|----------------|----------|--------|
| **Data Layer** | Populate `CoeficienteCuota` in `ClientesCtaCte`, set `IndiceFinal` and `FechaDesdeInt` in `DatosGenerales` | **CRITICAL** | Medium |
| `services/intereses.service.js` | Fix `calcularDiasMora` for timezone-robust day calculation (use UTC-based date math or noon-normalized dates) | **HIGH** | Small |
| `services/deudas.service.js` | The existing `calcularDiasMora` (lines 127-143) uses noon-normalization — consider using the same approach in `intereses.service.js` | **HIGH** | Small |

### Secondary Changes (Data Quality)

| File | Change Required | Priority | Effort |
|------|----------------|----------|--------|
| `scripts/populate-coeficientes.js` | **Create**: Script to populate `CoeficienteCuota` from desktop data source or via known formula | **HIGH** | Medium |
| `services/datos-generales.service.js` | Add validation/fallback-logging when `IndiceFinal` or `FechaDesdeInt` is NULL | **MEDIUM** | Small |
| `openspec/specs/interest-calculation/spec.md` | Update to reflect actual data requirements (coeficientes must be populated) | **LOW** | Small |

### Investigation-Only (No Code Change Yet)

| File | Purpose | Priority |
|------|---------|----------|
| DB (via query) | Verify `CoeficienteCuota` values exist for old debts | **IMMEDIATE** |
| DB (via query) | Verify `IndiceFinal` and `FechaDesdeInt` in `DatosGenerales` | **IMMEDIATE** |
| DB (via query) | Verify `Saldo` vs `Importe` for 2025 debts to confirm 1.1x factor | **IMMEDIATE** |
| Desktop accountant | Ask for `descinmueble` value — is it a constant? Per-municipio? Does Saldo already include it? | **BEFORE IMPL** |

---

## Risks

### 1. Multi-Municipio Risk
- The coefficient system (`IndiceFinal`, `FechaDesdeInt`, `CoeficienteCuota`) is El Manzano-specific. Other municipalities may not have this data.
- **Mitigation**: The `DatosGenerales` table is per-database. If a municipality has no `IndiceFinal`, the formula falls back to Mode B (current behavior) — no regression.

### 2. Data Migration Risk
- Populating `CoeficienteCuota` retroactively requires understanding the desktop software's data source.
- If the portal DB doesn't have coefficient data, we may need to import from a desktop DB backup or compute from the current `Saldo`/`Importe` ratios.
- **Mitigation**: Create a read-only investigation script first, then design migration.

### 3. descinmueble Unknown
- If `descinmueble ≠ 1.0`, Mode B interest for ALL debts (not just old ones) is off by a constant factor.
- Since recent debts show only a 1-day discrepancy ($15.91 on $3,900), not a constant percentage error, the `descinmueble` factor is likely 1.0 or already incorporated in Saldo.
- **Mitigation**: Validate by checking if the Portal's Mode B results for recent debts match the desktop after fixing the 1-day date issue.

### 4. Backward Compatibility
- Changing date calculation could shift displayed amounts for all users mid-day.
- **Mitigation**: No change to total formula (already uses Saldo+Interes). Date fix is a precise calculation correction, not a formula change.

### 5. 10% Saldo Markup (if NOT in portal DB)
- If the portal's DB has `Saldo = Importe` (no 1.1x), but the desktop uses `Saldo = Importe × 1.1`, then ALL 2025 debts in the portal are underestimated by ~10%.
- This would compound with the coefficient issue and is a SEPARATE data problem.
- **Mitigation**: This MUST be verified via DB query before proceeding.

---

## Ready for Proposal

**Conditional Yes** — but with IMMEDIATE data verification prerequisites:

### Blocking Prerequisites (Must Do Before Proposal)

1. **Run these SQL queries against the BD:**
   ```sql
   -- Check coefficient data presence
   SELECT COUNT(*) as total, 
          COUNT(CoeficienteCuota) as with_coef,
          COUNT(CASE WHEN CoeficienteCuota > 0 THEN 1 END) as with_coef_positive
   FROM ClientesCtaCte WHERE CodMovim = 'H';

   -- Check DatosGenerales config
   SELECT IndiceFinal, FechaDesdeInt, TasaInteres FROM DatosGenerales;

   -- Check Saldo vs Importe for 2025 debts
   SELECT ANO_CUOTA, 
          COUNT(*) as rows,
          AVG(CASE WHEN Importe > 0 THEN Saldo/Importe END) as avg_ratio
   FROM ClientesCtaCte 
   WHERE CodMovim = 'H' AND Saldo > 0 AND Importe > 0
   GROUP BY ANO_CUOTA ORDER BY ANO_CUOTA;
   ```

2. **Ask the accountant:**
   - What is `descinmueble`? Is it a constant value or does it vary?
   - Does the desktop software store the 10% surcharge in `Saldo` or apply it at calculation time?
   - Is there a separate data source for `CoeficienteCuota` that the portal DB doesn't have?

### Recommended Approach

| Phase | Scope | Dependencies |
|-------|-------|-------------|
| **Phase 0: Data Audit** | Run SQL queries, answer blocking questions | Accountant availability |
| **Phase 1: Date Fix** | Fix `calcularDiasMora` in `intereses.service.js` for timezone-robust calculation | None |
| **Phase 2: Data Migration** | Populate `CoeficienteCuota`, set `IndiceFinal`/`FechaDesdeInt` | Phase 0 results |
| **Phase 3: Validation** | Run comparison against all 5 CSV files | Phase 1 + 2 |
| **Phase 4: Multi-Municipio** | Ensure fallback works for municipalities without coefficient system | Phase 3 results |

### Verdict Ready State

**Yes** — once the 2 blocking SQL queries are run and the accountant answers 3 questions, the orchestrator can proceed directly to a proposal with clear scope, risk mitigation, and implementation order.
