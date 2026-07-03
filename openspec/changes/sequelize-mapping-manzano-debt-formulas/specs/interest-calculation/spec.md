# Delta for Interest Calculation

## ADDED Requirements

### Requirement: Multi-Layer Interest Rate Resolution

The system MUST resolve the interest rate in this priority order: (1) `DatosGenerales.TasaInteres` from the database, (2) `municipalidad.config.{municipio}.tasaInteresAnual`, (3) `process.env.TASA_INTERES_ANUAL`. The first non-null value wins. If all three are missing, the system MUST throw.

#### Scenario: DB rate takes priority

- GIVEN `DatosGenerales.TasaInteres = 60` and `process.env.TASA_INTERES_ANUAL = 48`
- WHEN the rate is resolved
- THEN the returned rate is `60`

#### Scenario: Config fallback when DB is null

- GIVEN `DatosGenerales.TasaInteres = null` and `municipalidad.config.tasaInteresAnual = 52`
- WHEN the rate is resolved
- THEN the returned rate is `52`

#### Scenario: Env fallback when DB and config are null

- GIVEN `DatosGenerales.TasaInteres = null`, config rate is null, and `process.env.TASA_INTERES_ANUAL = 48`
- WHEN the rate is resolved
- THEN the returned rate is `48`

#### Scenario: Throws when all sources missing

- GIVEN all three rate sources are null or undefined
- WHEN the rate is resolved
- THEN the system throws an error

### Requirement: DatosGenerales Service

The system MUST provide `services/datos-generales.service.js` to read `TasaInteres`, `TasaDescuento`, `IndiceFinal`, and `FechaDesdeIntereses` from the `DatosGenerales` table.

#### Scenario: DatosGenerales reads all formula parameters

- GIVEN the `DatosGenerales` table has one row with values set
- WHEN `datos-generales.service.js` queries it
- THEN it returns `TasaInteres`, `TasaDescuento`, `IndiceFinal`, and `FechaDesdeIntereses`

### Requirement: Formula Unit Tests with Jest

The system MUST provide Jest unit tests for all 3 formula modes, date boundaries, and coefficient mode selection. The test runner MUST be invokable via `npm run testIntereses`.

#### Scenario: All 3 modes tested

- GIVEN `npm run testIntereses` is executed
- THEN tests pass for Mode A (coefficient), Mode B (simple FA), and Mode C (single-payment discount)

#### Scenario: Edge cases tested

- GIVEN `npm run testIntereses` is executed
- THEN tests pass for: `Saldo = 0`, `FechaVto = null`, non-FA with `dias > 0`, coefficient mode disabled by `fechadesdeintereses`

#### Scenario: Golden cases match accountant examples

- GIVEN golden test data derived from the accountant's example rows
- WHEN the formula engine processes them
- THEN results match the accountant's desktop software totals

### Requirement: Accountant Questions File

The system MUST maintain `docs/formulas/PREGUNTAS_PARA_CONTADOR.md` with structured Spanish questions for unresolved formula parameters (`descinmueble`, `FechaDesdeIntereses` boundary semantics, `tasadescuento` source column).

#### Scenario: Questions file exists and is structured

- GIVEN the file `docs/formulas/PREGUNTAS_PARA_CONTADOR.md`
- WHEN opened
- THEN it contains numbered questions in Spanish with answer fields

## MODIFIED Requirements

### Requirement: Formula explicita

El calculo de intereses MUST implementar 3 modos de calculo basados en las formulas del contador:

- **Modo A (Coeficiente)**: cuando `cuotabasica` esta vacio, `CoeficienteCuota > 0`, y `FechaVto < fechadesdeintereses`: `interes = Saldo * (IndiceFinal / CoeficienteCuota)`
- **Modo B (Interes simple FA)**: cuando `cuotabasica` esta vacio, el camino de coeficiente no aplica, `TipoMovim == "FA"`, y `dias > 0`: `interes = Saldo * descinmueble * (tasa / 365 / 100) * dias`
- **Modo C (Descuento unico pago)**: cuando `cuotabasica` no esta vacio, `Saldo > 0`, y `TipoMovim == "FA"`: `descuento = (Saldo * tasadescuento / 100 * descinmueble) * -1`

La base de calculo es `Saldo` (no `Importe`). El factor `descinmueble` multiplica tanto el interes (Modo B) como el descuento (Modo C).

(Previously: single formula `importe * (tasa/36500) * diasMora` ignoring `descinmueble`, `TipoMovim`, and coefficient mode)

#### Scenario: Deuda vencida con Modo B

- **GIVEN** una deuda vencida con `TipoMovim = 'FA'`, `Saldo` conocido, y `dias > 0`
- **WHEN** el sistema calcula mora
- **THEN** usa la formula `Saldo * descinmueble * (tasa / 365 / 100) * dias`

#### Scenario: Deuda con coeficiente (Modo A)

- **GIVEN** una deuda con `CoeficienteCuota > 0` y `FechaVto < fechadesdeintereses`
- **WHEN** el sistema calcula mora
- **THEN** usa la formula `Saldo * (IndiceFinal / CoeficienteCuota)`

#### Scenario: Descuento por pago unico (Modo C)

- **GIVEN** una deuda con `cuotabasica` no vacio, `Saldo > 0`, y `TipoMovim = 'FA'`
- **WHEN** el sistema calcula descuento
- **THEN** usa la formula `(Saldo * tasadescuento / 100 * descinmueble) * -1`

### Requirement: Tasa configurable

La tasa anual MUST resolverse en orden: `DatosGenerales.TasaInteres` (BD) > config del municipio > `process.env.TASA_INTERES_ANUAL`. El primer valor no nulo gana. Si los tres faltan, el sistema DEBE lanzar un error.

(Previously: tasa leida solo de `process.env`, sin fallback a BD ni config municipal)

#### Scenario: Municipio con tasa distinta

- **GIVEN** un municipio con tasa configurada en su archivo de config
- **WHEN** el sistema calcula mora
- **THEN** usa la tasa del municipio activo si `DatosGenerales` no tiene valor

#### Scenario: Tasa desde BD priorizada

- **GIVEN** `DatosGenerales.TasaInteres` tiene un valor
- **WHEN** el sistema calcula mora
- **THEN** usa el valor de la BD ignorando config y env

## REMOVED Requirements

None.

## RENAMED Requirements

None.
