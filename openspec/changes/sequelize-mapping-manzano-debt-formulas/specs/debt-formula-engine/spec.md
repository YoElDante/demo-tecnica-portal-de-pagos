# Debt Formula Engine Specification

## Purpose

Implement the accountant's 3 debt-calculation modes from `docs/formulas/formulas_alcaldia_072026.txt`, replacing the single simplified formula currently in `deudas.service.js`.

## Requirements

### Requirement: Mode A — Coefficient Recalculation

The system MUST apply coefficient recalculation when `cuotabasica` is empty, `CoeficienteCuota > 0`, and `FechaVto < fechadesdeintereses`. The formula is: `interes = Saldo * (IndiceFinal / CoeficienteCuota)`.

#### Scenario: Coefficient mode fires for pre-gate-date debt

- GIVEN a movement with `cuotabasica = ''`, `CoeficienteCuota = 1.50`, `Saldo = 10000`, `FechaVto = '2025-01-15'`
- AND `DatosGenerales.FechaDesdeIntereses = '2025-06-01'`
- WHEN `calcularMovimiento` is called
- THEN `interes = 10000 * (IndiceFinal / 1.50)`

#### Scenario: Coefficient mode skipped when FechaVto >= gate date

- GIVEN a movement with `FechaVto = '2025-07-01'`
- AND `DatosGenerales.FechaDesdeIntereses = '2025-06-01'`
- WHEN `calcularMovimiento` is called
- THEN Mode A does NOT fire; evaluation proceeds to Mode B or C

#### Scenario: Coefficient mode skipped when CoeficienteCuota is null

- GIVEN a movement with `CoeficienteCuota = null`
- WHEN `calcularMovimiento` is called
- THEN Mode A does NOT fire

### Requirement: Mode B — Simple Interest with descinmueble

The system MUST apply simple interest when `cuotabasica` is empty, the coefficient path is not taken, `TipoMovim == "FA"`, and `dias > 0`. The formula is: `interes = Saldo * descinmueble * (tasa / 365 / 100) * dias`.

#### Scenario: Simple interest with descinmueble factor

- GIVEN a movement with `TipoMovim = 'FA'`, `Saldo = 5000`, `dias = 30`, `descinmueble = 1.0`, `tasa = 48`
- WHEN `calcularInteresSimpleFA` is called
- THEN `interes = 5000 * 1.0 * (48 / 365 / 100) * 30 = 197.26`

#### Scenario: Non-FA movement returns zero interest

- GIVEN a movement with `TipoMovim = 'H'` (not FA)
- WHEN `calcularMovimiento` is called
- THEN interest is 0 for this movement

#### Scenario: Zero dias returns zero interest

- GIVEN a movement with `dias = 0`
- WHEN `calcularInteresSimpleFA` is called
- THEN `interes = 0`

### Requirement: Mode C — Single-Payment Discount

The system MUST apply a discount when `cuotabasica` is non-empty, `Saldo > 0`, and `TipoMovim == "FA"`. The formula is: `descuento = (Saldo * tasadescuento / 100 * descinmueble) * -1`.

#### Scenario: Discount applied for single-payment eligible debt

- GIVEN a movement with `cuotabasica != ''`, `Saldo = 8000`, `tasadescuento = 15`, `descinmueble = 1.0`, `TipoMovim = 'FA'`
- WHEN `calcularDescuentoUnicoPago` is called
- THEN `descuento = (8000 * 15 / 100 * 1.0) * -1 = -1200`

#### Scenario: No discount when Saldo <= 0

- GIVEN a movement with `Saldo = 0`
- WHEN `calcularDescuentoUnicoPago` is called
- THEN `descuento = 0`

#### Scenario: No discount when TipoMovim is not FA

- GIVEN a movement with `TipoMovim = 'H'`
- WHEN `calcularDescuentoUnicoPago` is called
- THEN `descuento = 0`

### Requirement: ACTUALIZACION_COBRADO Override

The system MUST display `ACTUALIZACION_COBRADO` in place of computed interest when `Saldo <= 0` and the column is set.

#### Scenario: ACTUALIZACION_COBRADO shown for paid debt

- GIVEN a movement with `Saldo <= 0` and `ACTUALIZACION_COBRADO = 50.00`
- WHEN the display value is computed
- THEN the returned interest is `50.00` (not a computed value)

#### Scenario: Computed interest used when ACTUALIZACION_COBRADO is null

- GIVEN a movement with `Saldo > 0` and `ACTUALIZACION_COBRADO = null`
- WHEN the display value is computed
- THEN the returned interest is the result of the applicable formula mode

### Requirement: Display Column Format

The system MUST produce display column 4 in the format `{dias}{tipocoef}{coef}` where `tipocoef` is `T:` (coefficient), `C:` (simple interest), or `X` (discount/single-payment).

#### Scenario: Coefficient mode display

- GIVEN Mode A fired with `dias = 45`, `coef = 1.50`
- THEN display = `45T:1.50`

#### Scenario: Simple interest display

- GIVEN Mode B fired with `dias = 30`
- THEN display = `30C:`

#### Scenario: Discount display

- GIVEN Mode C fired
- THEN display = `X`

### Requirement: Pure Formula Engine

The formula engine MUST be a pure module `services/intereses.service.js` with no side effects, no database queries, and no environment reads. It MUST export: `calcularInteresCoeficiente`, `calcularInteresSimpleFA`, `calcularDescuentoUnicoPago`, and `calcularMovimiento`.

#### Scenario: Engine is pure and testable

- GIVEN the same input object passed to `calcularMovimiento` twice
- WHEN called both times
- THEN both calls return identical results with no external state dependency

#### Scenario: deudas.service.js delegates to engine

- GIVEN `deudas.service.js` needs to calculate interest
- WHEN it processes movements
- THEN it delegates to `intereses.service.js` and does not contain formula logic inline

### Requirement: Formula Base Uses Saldo

The system MUST use `Saldo` (not `Importe`) as the base for all formula calculations.

#### Scenario: Saldo used as formula base

- GIVEN a movement with `Saldo = 3000` and `Importe = 5000`
- WHEN any formula mode computes interest
- THEN the base value used is `3000` (Saldo), not `5000` (Importe)
