# Delta for interest-calculation

## ADDED Requirements

### Requirement: CodMovim filter in debt query

The system MUST filter debt records to include only those where `CodMovim = 'H'` (haber/deuda) when calculating outstanding balances. Records with `CodMovim = 'D'` (debe/cobro) MUST NOT be included in the debt base.

#### Scenario: Query excludes cobro records

- GIVEN a taxpayer has both `CodMovim = 'H'` and `CodMovim = 'D'` records
- WHEN the system queries outstanding debts
- THEN only records with `CodMovim = 'H'` are included in the calculation
- AND records with `CodMovim = 'D'` are excluded

#### Scenario: Empty result when only cobro records exist

- GIVEN a taxpayer has only `CodMovim = 'D'` records
- WHEN the system queries outstanding debts
- THEN the result set is empty (no debts to calculate)

## MODIFIED Requirements

### Requirement: Formula explicita

El calculo de intereses MUST usar una formula basada en el campo `Saldo` (no `Importe`) como base de calculo. El campo `Saldo` representa el monto pendiente real de la deuda.

El sistema MUST soportar dos modos de calculo:

| Modo | Fuente de tasa | Formula |
|------|---------------|---------|
| A | `ClientesCtasCtes.CoeficienteCuota` | `Saldo * CoeficienteCuota` (sin interes diario) |
| B | `datosgenerales` (tasa anual) | `Saldo * (tasa_anual / 100 / 365) * dias_mora` |

El campo `dias_mora` se calcula como los dias transcurridos desde `FechaDesdeInt` (inclusive) hasta la fecha de calculo. La comparacion con `FechaDesdeInt` MUST usar `<=` (inclusive): la fecha de inicio cuenta como dia de mora.

El TOTAL de la deuda MUST calcularse como `Saldo + Interes`.

(Previously: used `Importe` as base and calculated TOTAL as `Importe + Interes`)

#### Scenario: Deuda vencida con modo B (interes diario)

- **GIVEN** una deuda vencida con `Saldo` conocido y `FechaDesdeInt = '2024-01-15'`
- **WHEN** el sistema calcula mora el `2024-02-14` (30 dias, inclusive)
- **THEN** usa la formula `Saldo * (tasa_anual / 100 / 365) * 30`
- **AND** el TOTAL es `Saldo + Interes`

#### Scenario: Deuda vigente (sin mora)

- **GIVEN** una deuda con fecha de vencimiento futura
- **WHEN** se calcula la mora
- **THEN** el resultado de interes es cero
- **AND** el TOTAL es igual al `Saldo`

#### Scenario: Modo A con coeficiente (sin interes diario)

- **GIVEN** una deuda con `ClientesCtasCtes.CoeficienteCuota = 1.05`
- **WHEN** el sistema calcula el total
- **THEN** el interes es `Saldo * 0.05`
- **AND** no se aplica calculo diario de mora

#### Scenario: Total con redondeo tolerance

- **GIVEN** un calculo donde `Saldo + Interes` produce un valor con mas de 2 decimales
- **WHEN** el sistema compara con el valor esperado
- **THEN** una diferencia de hasta +-0.1 se considera aceptable

### Requirement: Tasa configurable

La tasa anual para el Modo B MUST obtenerse de la tabla `datosgenerales`. La tasa para el Modo A se deriva implicitamente del `CoeficienteCuota` en `ClientesCtasCtes`.

Cada municipio SHOULD poder configurar su tasa independientemente.

(Previously: tasa configurable solo mencionada genericamente, sin distincion de modos)

#### Scenario: Municipio con tasa distinta (Modo B)

- **GIVEN** un municipio con tasa configurada en `datosgenerales`
- **WHEN** el sistema calcula mora en Modo B
- **THEN** usa la tasa del municipio activo y no un valor fijo global

#### Scenario: Modo A ignora tasa de datosgenerales

- **GIVEN** una deuda en Modo A con `CoeficienteCuota` definido
- **WHEN** el sistema calcula el total
- **THEN** usa el coeficiente y NO la tasa de `datosgenerales`

## REMOVED Requirements

### Requirement: Mode C (discount/cuotabasica)

(Reason: Dead code for portal purposes — accountant confirmed almost no taxpayers have discounts. Mode C handled cuotabasica which is not used in real scenarios.)
(Migration: None — Mode C was never active in production portal flows. Tests referencing Mode C should be rewritten as Mode A or B tests.)
