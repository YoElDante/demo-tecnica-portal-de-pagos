# Exploration: Validación de Deuda Portal vs Escritorio

## Test Data Summary

### Contributors (from `Lista de dni.txt`)

| # | DNI | Apellido | Archivo CSV |
|---|-----|----------|-------------|
| 1 | 17720479 | PLAINO | `PLAINO_JUAN_DOMINGO.csv` |
| 2 | 16856346 | MISERENDINO | `MISERENDINO_ALEJANDRO.csv` |
| 3 | 29308519 | CRAVERO | `CRAVERO_MARIA_LORENA.csv` |
| 4 | 14537335 | CACERES | `CACERES_DANIEL_ALBERTO.csv` |
| 5 | 12212197 | OLMOS | `OLMOS_JUAN_NEMECIO.csv` |

### CSV Structure

```
Fecha,Detalle,Historico,Bien,Cuota,Saldo,Int_Dto,TOTAL,Nro_Pago
```

| Columna | Descripción | Mapeo al dominio |
|---------|-------------|------------------|
| `Fecha` | Fecha del movimiento | `ClientesCtaCte.Fecha` |
| `Detalle` | Descripción (tipo deuda) | `ClientesCtaCte.Detalle` → aproximación a `TIPO_BIEN` |
| `Historico` | Importe original | `ClientesCtaCte.Importe` |
| `Bien` | Código del bien (desktop) | `ClientesCtaCte.ID_BIEN` (numérico 3-6 dígitos) |
| `Cuota` | Período + cuota (formato "YYYY NNN") | `ANO_CUOTA` + `NRO_CUOTA` |
| `Saldo` | Saldo pendiente actual | `ClientesCtaCte.Saldo` |
| `Int_Dto` | Interés o Descuento calculado | Resultado del motor de fórmula |
| `TOTAL` | **Saldo + Int_Dto** | **NO es Importe + Interes** |
| `Nro_Pago` | Número de pago (vacío = impaga) | `NumeroPago` |

### Totales por Contribuyente

| Contribuyente | DNI | Importe (Histórico) | Saldo | REC/INT (Int_Dto) | TOTAL (Saldo+Int) |
|--------------|-----|--------------------:|------:|------------------:|------------------:|
| CACERES D.A. | 14537335 | 211,589.50 | 224,129.50 | 976,457.11 | 1,200,586.61 |
| CRAVERO M.L. | 29308519 | 642,744.00 | 688,994.00 | 450,405.36 | 1,139,399.36 |
| MISERENDINO A. | 16856346 | 295,441.70 | 311,391.70 | 1,525,476.62 | 1,836,868.32 |
| OLMOS J.N. | 12212197 | 195,830.35 | 205,730.35 | 391,735.58 | 597,465.93 |
| PLAINO J.D. | 17720479 | 98,487.40 | 105,087.40 | 251,365.80 | 356,453.20 |

### Tipos de Deuda Observados en Datos de Prueba

| Detalle CSV | TIPO_BIEN esperado | Bien IDs |
|------------|-------------------|----------|
| Comercio e Industria | `CICI` | 120, 176, 184, 1801 |
| Tasa Serv. a la Prop | `ININ` | 000003 00000, 000113 07102, 000114 07102, 001126 07802, 001607 07701, 002398 16301 |
| RDIG. B2 Automoviles | `AUAU` (especial) | 0 |
| TASA 2° BIMESTRE AÑO | Probable `CACA` u `OBSA` | 0 |

**Nota**: No hay datos de prueba para `OBSA` (Agua), `CEM1` (Cementerio), `PEPE` (Licencias), `NDND`/`NCNC` (Notas). Los casos de prueba cubren principalmente `CICI` (Comercio) e `ININ` (Serv. Propiedad).

---

## Formula Comparison Matrix

### Accountant's Python vs Our intereses.service.js

| Aspecto | Python (contador) | JS (portal) | ¿Coinciden? |
|---------|-------------------|-------------|-------------|
| **Mode A — Condition** | `cuotabasica=='' AND CoeficienteCuota>0 AND FechaVto < FechaDesdeInt` | `cuotabasica==='' AND coefCuota>0 AND fechaVtoDate < fechaLimite` | ✅ Same logic |
| **Mode A — Formula** | `Saldo * (IndiceFinal / CoeficienteCuota)` | `Math.round(saldo * (indiceFinal / coefCuota) * 100) / 100` | ✅ Same (JS rounds) |
| **Mode A — Display** | `dias + "C:" + coef` | `dias + "C:" + coefDisplay` | ✅ Same format |
| **Mode B — Condition** | `cuotabasica=='' AND Coeficiente NOT ModeA AND TipoMovim=="FA" AND dias>0` | `cuotabasica==='' AND !ModeA AND tipoMovim==='FA' AND dias>0` | ✅ Same logic |
| **Mode B — Formula** | `Saldo * descinmueble * (tasainteres/365/100) * dias` | `Math.round(saldo * (tasa/365/100) * dias * 100) / 100` | ❌ **Missing `descinmueble`** |
| **Mode C — Condition** | `cuotabasica!='' AND TipoMovim=="FA" AND Saldo>0` | `cuotabasica!=='' AND tipoMovim==='FA' AND tasaDescuento>0` | ⚠️ Similar (guarda extra) |
| **Mode C — Formula** | `Saldo * (tasadescuento/100) * descinmueble` (negativo) | `saldo * (tasaDescuento/100)` (negativo) | ❌ **Missing `descinmueble`** |
| **saldo ≤ 0** | Usa `ACTUALIZACION_COBRADO` | Usa `ACTUALIZACION_COBRADO` | ✅ Same |
| **cuotabasica source** | Campo directo de la BD del escritorio | NRO_CUOTA === '000' | ❌ **UNCONFIRMED** |
| **TOTAL calc** | (No visible en Python — CSV muestra `Saldo + Int_Dto`) | `Importe + Interes` | ❌ **Different base** |
| **Rounding Mode B** | `"{:,.2f}".format()` (string format, standard round) | `Math.round(x * 100) / 100` (round half away from zero) | ⚠️ **May differ at .5 boundaries** |
| **Rounding Mode A** | `"{:,.2f}".format()` | `Math.round(x * 100) / 100` | ⚠️ **May differ at .5 boundaries** |
| **Rounding Mode C** | `"{:,.2f}".format()` | `Math.round(x * 100) / 100` | ⚠️ **May differ at .5 boundaries** |
| **Días cálculo** | `(datetime.now() - grupoF.FechaVto).days` | `Math.floor((hoy - vto) / msPerDay)` | ✅ Same concept |
| **Coeficiente display** | `"{:,.2f}".format(IndiceFinal/CoeficienteCuota)` | `(indiceFinal / coefCuota).toFixed(2)` | ✅ Same |
| **TipoMovim check** | `"FA"` | `"FA"` | ✅ Same |

### Key Formula Differences

1. **DESC_INMUEBLE factor (CRITICAL)**: The accountant multiplies `descinmueble` in both Mode B and Mode C. Our code does NOT (assumes it's 1.0 and pre-applied to Saldo). This assumption is unconfirmed.

2. **cuotabasica mapping (CRITICAL)**: The accountant's Python reads a database field called `cuotabasica`. Our code infers it from `NRO_CUOTA === '000'` for a hardcoded set of TIPO_BIEN values. The design originally mapped it to `TIPO_PLAN` but the implementation changed to `NRO_CUOTA`. Neither is confirmed correct.

3. **TOTAL = Saldo + Int_Dto vs Importe + Interes (CRITICAL)**: The CSV clearly shows TOTAL = Saldo + Int_Dto. Our portal calculates Total = `importe + resultado.interes`. When `Importe ≠ Saldo` (which happens for many entries where Saldo has been updated/surcharged), this produces wrong totals.

4. **Rounding**: Python's `"{:,.2f}".format()` uses round-half-even (banker's rounding) in Python 3. `Math.round()` in JavaScript uses round-half-away-from-zero. This can produce ±0.01 differences at .5 boundaries.

---

## Query Flow Map

### Current Portal Query Path

```
DNI ingresado → web.controller.buscarPorDni()
  │
  ├─► clientes.service.buscarPorDni(dni)
  │     └─ Cliente.findOne({ DOCUMENTO: dni })
  │       → { Codigo, Nombre, Apellido }
  │
  └─► deudas.service.obtenerDeudasPorCodigo(cliente.Codigo)
        │
        └─ ClientesCtaCte.findAll({
              where: { Codigo, Saldo: { [Op.ne]: 0 } },   ← NO CodMovim filter!
              attributes: [IdTrans, Fecha, FechaVto, Detalle, Dominio,
                           NRO_CUOTA, ANO_CUOTA, TIPO_BIEN, ID_BIEN,
                           Importe, Saldo, CoeficienteCuota, TipoMovim,
                           TIPO_PLAN, ACTUALIZACION_COBRADO, RecIntereses]
            })
            │
            ├─► datos-generales.service.obtenerConfigIntereses()
            │     └─ DatosGenerales.findOne()
            │       → { TasaInteres, TasaDescuento, IndiceFinal, FechaDesdeInt }
            │
            └─► por cada fila: formatearDeuda()
                  └─► intereses.service.calcularMovimiento(mov, config)
                        ├─ Detecta cuotabasica por NRO_CUOTA (no TIPO_PLAN)
                        ├─ Modo A, B, C según condiciones
                        └─ → { interes, tipo, dias, display }
                  └─ Total = Importe + Interes  ← DISCREPANCY
```

### Desktop Software Expected Query Path (inferred from accountant's Python)

```
DNI → lookup → Codigo → ClientesCtaCte con filtros:
  - CodMovim = 'H'                              ← ¡Portal NO filtra esto!
  - Saldo > 0
  - Possibly: (RecIntereses = 0 OR RecIntereses IS NULL) ← Comentado!
  
  Por cada fila:
    Lee: Saldo, FechaVto, CoeficienteCuota, TipoMovim, ACTUALIZACION_COBRADO, cuotabasica
    Calcula: dias = (hoy - FechaVto).days
    Aplica Modo A si: cuotabasica='' AND CoeficienteCuota>0 AND FechaVto < FechaDesdeInt
    Aplica Modo B si: cuotabasica='' AND TipoMovim='FA' AND dias>0
    Aplica Modo C si: cuotabasica!='' AND TipoMovim='FA' AND Saldo>0
    TOTAL = Saldo + Int_Dto
```

### Tables Involved

| Tabla | Rol | ¿Modelada? | ¿Usada? |
|-------|-----|-----------|---------|
| `ClientesCtaCte` | Transacciones de deuda y cobro | ✅ Sí | ✅ Sí |
| `Clientes` | Datos del contribuyente (DNI lookup) | ✅ Sí | ✅ Sí |
| `DatosGenerales` | TasaInteres, TasaDescuento, IndiceFinal, FechaDesdeInt | ✅ Sí | ✅ Sí |
| `Feriados` | Días feriados | ✅ Sí | ❌ No |
| `Numeracion` | Secuencia de tickets | ✅ Sí | ❌ No (en fórmulas) |

---

## Gap Analysis

### CRITICAL Gaps (Must Fix for Validation)

| # | Gap | Impacto | Archivos Afectados | Fix Propuesto |
|---|-----|---------|-------------------|---------------|
| G1 | **Sin filtro CodMovim = 'H'** | Puede incluir registros de cobro (CodMovim='D') como deudas, distorsionando saldos | `deudas.service.js:206-208` | Agregar `CodMovim: 'H'` al WHERE |
| G2 | **TOTAL = Importe + Interes en vez de Saldo + Interes** | Cuando Importe ≠ Saldo, el total mostrado no coincide con el escritorio | `deudas.service.js:300` | Cambiar a `saldo + resultado.interes` |
| G3 | **cuotabasica mapeada a NRO_CUOTA (no confirmado)** | La detección de cuota única vs cuota común puede clasificar mal las filas | `intereses.service.js:124-128` | Preguntar al contador cuál es el campo real `cuotabasica` |
| G4 | **DESC_INMUEBLE omitido en Mode B y C** | Si descinmueble ≠ 1.0, todos los intereses/descuentos son incorrectos | `intereses.service.js:48-55, 71-77` | Agregar factor o confirmar que Saldo ya lo incluye |
| G5 | **Test Modo C roto (usa TIPO_PLAN pero código lee NRO_CUOTA)** | El test no valida el flujo real, da falso positivo | `tests/intereses/engine.test.js:158-169` | Corregir test para usar NRO_CUOTA='000' o actualizar mapping |

### HIGH Gaps (Should Fix for Accuracy)

| # | Gap | Impacto | Archivos Afectados | Fix Propuesto |
|---|-----|---------|-------------------|---------------|
| G6 | **Rounding difference (Python round-half-even vs JS round-half-up)** | ±0.01 por fila en .5 boundaries | `intereses.service.js` | Usar función personalizada con round-half-even |
| G7 | **Sin verificación de `RecIntereses`** | El contador comentó esta verificación; podría necesitarse | `intereses.service.js` | Agregar check si confirma el contador |
| G8 | **Spec de interés desactualizado** | Solo documenta fórmula simple, no los 3 modos | `openspec/specs/interest-calculation/spec.md` | Actualizar spec |

### MEDIUM Gaps

| # | Gap | Impacto | Archivos Afectados |
|---|-----|---------|-------------------|
| G9 | **Sin filtro `Saldo > 0` (usa `!= 0`)** | Podría incluir saldos negativos (notas crédito) | `deudas.service.js:209` |
| G10 | **Feriados model sin uso** | No se considera feriados en días de mora (probablemente correcto — el contador tampoco) | `models/Feriados.js` |
| G11 | **No se exporta `CodMovim` en QUERY_ATTRIBUTES** | No disponible si se necesita para debugging | `deudas.service.js:66-84` |

---

## Risk Assessment

| Riesgo | Severidad | Probabilidad | Explicación |
|--------|-----------|-------------|-------------|
| Totales incorrectos por usar Importe en vez de Saldo | **ALTA** | Alta (confirmado en CSV) | Afecta TODAS las filas donde Saldo ≠ Importe. Los totales generales serán distintos |
| Modo C nunca se ejecuta (cuotabasica nunca se detecta) | **ALTA** | Media | Si NRO_CUOTA no es el campo correcto para cuotabasica, ningún descuento por pago único se aplica |
| DESCUENTOS no se aplican correctamente (Mode C) | **ALTA** | Alta (test está roto) | El test no prueba el flujo real de cuota única |
| Deudas falsas por falta de CodMovim filter | **MEDIA** | Baja | En la práctica, registros 'D' tienen Saldo=0, pero no es seguro |
| Error de redondeo marginal | **BAJA** | Media | ±0.01 por fila, se acumula en total general |

---

## Recommended Approach

### Phase 1: Fix Critical Discrepancies (HIGH priority)

1. **Fix TOTAL calculation**: Change `formatearDeuda` to use `saldo + resultado.interes` instead of `importe + resultado.interes`
2. **Add CodMovim filter**: Add `CodMovim: 'H'` to the WHERE clause in `obtenerDeudasPorCodigo` and `obtenerDeudasPorCodigoODni`
3. **Fix cuotabasica detection**: Clarify with the accountant what `cuotabasica` maps to in the database. If NRO_CUOTA is correct, fix the test. If TIPO_PLAN is correct (as in the design), update the implementation.
4. **Fix Mode C test**: Update the test in `engine.test.js` to use the actual field checked by the code (currently NRO_CUOTA)
5. **Confirm DESC_INMUEBLE value**: Ask the accountant for the real `descinmueble` value or confirm that Saldo already incorporates it

### Phase 2: Validation Tool (MEDIUM priority)

6. **Create validation script** that:
   - Reads the 5 CSV test files
   - Queries the same contributors from the DB
   - Runs the formula engine
   - Compares results row by row
   - Reports mismatches with exact deltas

### Phase 3: Polish (LOW priority)

7. **Fix rounding**: Implement Python-compatible round-half-even
8. **Update specs**: Update the interest-calculation spec to reflect 3-mode formula
9. **Consider Saldo > 0 vs Saldo != 0**: Evaluate if negative saldos should be excluded

### Unresolved Questions for the Accountant

1. **`cuotabasica`**: What database field maps to `cuotabasica` in the Python code? Is it `NRO_CUOTA`, `TIPO_PLAN`, or something else?
2. **`descinmueble`**: What is the real value? Is it a constant or per-municipio? Is it already applied to `Saldo` in the database or does the formula need to multiply it?
3. **`FechaDesdeIntereses` boundary**: Is the comparison `fecha_vto < fecha_limite` (strictly less than) as implemented? Inclusive or exclusive?
4. **`RecIntereses`**: The commented-out check in the Python code — should we restore it?
5. **Saldo = Importe * 1.1**: Some rows in the CSV show Saldo = Importe × 1.1. What causes this 10% increase? Is it a desktop software behavior we need to replicate?

---

## Ready for Proposal

**Yes** — the gaps are clearly identified and prioritized. The orchestrator should:
1. Present this analysis to the user
2. Get answers to unresolved questions from the accountant
3. Proceed to Phase 1 fixes as a proposal/design cycle
4. Consider a Phase 2 validation script to definitively prove correctness

The main work items are:
- Fix `formatearDeuda` total calculation (small, high impact)
- Add `CodMovim: 'H'` filter (small, high impact)
- Resolve `cuotabasica` mapping (requires accountant input)
- Confirm `descinmueble` value (requires accountant input)
- Fix Mode C test (small, medium impact)
- Build validation script (medium effort, high value for verification)
