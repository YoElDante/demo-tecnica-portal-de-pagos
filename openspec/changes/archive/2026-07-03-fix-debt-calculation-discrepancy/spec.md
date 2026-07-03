# Delta for Interest-Calculation

## MODIFIED Requirements

### Requirement: Formula explicita

El calculo de intereses MUST usar una formula basada en el campo `Saldo` (no `Importe`) como base de calculo. El campo `Saldo` representa el monto pendiente real de la deuda.

El sistema MUST soportar dos modos de calculo:

| Modo | Fuente de tasa | Formula |
|------|---------------|---------|
| A | `ClientesCtasCtes.CoeficienteCuota` + `DatosGenerales.IndiceFinal` | `Saldo * (IndiceFinal / CoeficienteCuota)` (sin interes diario) |
| B | `DatosGenerales.TasaInteres` (tasa anual) | `Saldo * (tasa_anual / 100 / 365) * dias_mora` |

El campo `dias_mora` se calcula como los dias transcurridos desde `FechaVto` (exclusive) hasta la fecha de calculo. La comparacion de cutoff en Modo A MUST usar `<` (estricto): `FechaVto < FechaDesdeInt`. La fecha de inicio de intereses NO cuenta como dia de mora.

El calculo de `dias_mora` MUST usar fechas civiles (calendario local), construidas como `new Date(año, mes, dia, 12, 0, 0)` para evitar desplazamientos por zona horaria UTC o DST. Las cadenas `"YYYY-MM-DD"` de la base de datos NO deben pasarse directamente al constructor `Date()`.

El TOTAL de la deuda MUST calcularse como `Saldo + Interes`.

(Previously: usaba `new Date("YYYY-MM-DD")` + `setHours(0,0,0,0)` que desplaza fechas 1 dia atras en UTC-3; comparacion de cutoff usaba `<=` en lugar de `<`)

#### Scenario: Deuda vencida con modo B (interes diario)

- **GIVEN** una deuda vencida con `Saldo` conocido y `FechaVto = '2025-10-31'`
- **WHEN** el sistema calcula mora el `2026-07-03`
- **THEN** usa la formula `Saldo * (tasa_anual / 100 / 365) * dias` con `dias = 245`
- **AND** el TOTAL es `Saldo + Interes`

#### Scenario: Deuda vigente (sin mora)

- **GIVEN** una deuda con fecha de vencimiento futura
- **WHEN** se calcula la mora
- **THEN** el resultado de interes es cero
- **AND** el TOTAL es igual al `Saldo`

#### Scenario: Modo A con coeficiente (sin interes diario)

- **GIVEN** una deuda con `CoeficienteCuota > 0`, `IndiceFinal` definido, y `FechaVto < FechaDesdeInt`
- **WHEN** el sistema calcula el total
- **THEN** el interes es `Saldo * (IndiceFinal / CoeficienteCuota)`
- **AND** no se aplica calculo diario de mora

#### Scenario: Total con redondeo tolerance

- **GIVEN** un calculo donde `Saldo + Interes` produce un valor con mas de 2 decimales
- **WHEN** el sistema compara con el valor esperado
- **THEN** una diferencia de hasta +-0.01 se considera aceptable

### Requirement: Sin mora antes del vencimiento

Una deuda no vencida MUST producir interes cero.

#### Scenario: Deuda vigente

- **GIVEN** una deuda con fecha de vencimiento futura
- **WHEN** se calcula la mora
- **THEN** el resultado de interes es cero

### Requirement: Tasa configurable

La tasa anual para el Modo B MUST obtenerse de la tabla `DatosGenerales`. La tasa para el Modo A se deriva implicitamente del `CoeficienteCuota` en `ClientesCtaCtes` combinado con `IndiceFinal` en `DatosGenerales`.

Cada municipio SHOULD poder configurar su tasa independientemente.

#### Scenario: Municipio con tasa distinta (Modo B)

- **GIVEN** un municipio con tasa configurada en `DatosGenerales`
- **WHEN** el sistema calcula mora en Modo B
- **THEN** usa la tasa del municipio activo y no un valor fijo global

#### Scenario: Modo A ignora tasa de datosgenerales

- **GIVEN** una deuda en Modo A con `CoeficienteCuota` definido
- **WHEN** el sistema calcula el total
- **THEN** usa el coeficiente y NO la tasa de `DatosGenerales`

## ADDED Requirements

### Requirement: Civil-date construction for day calculation

El sistema SHALL calcular dias de mora usando fechas civiles (calendario local) independientes de la zona horaria del servidor. Las cadenas `"YYYY-MM-DD"` de la base de datos se parsean en componentes `(año, mes, dia)` y se construyen como `new Date(año, mes - 1, dia, 12, 0, 0)`. La normalizacion a mediodia evita desplazamientos por UTC y DST sin depender de librerias externas.

#### Scenario: Date string parsed as civil date

- **GIVEN** una cadena `FechaVto = "2025-10-31"`
- **WHEN** `calcularDiasMora` es invocada
- **THEN** la representacion interna corresponde al 31 de octubre (no 30 de octubre)
- **AND** el dia calculado es correcto independientemente de la zona horaria del servidor

#### Scenario: Days count is timezone-independent

- **GIVEN** la misma `FechaVto` y `fechaReferencia`
- **WHEN** el calculo se ejecuta en un servidor UTC-3 vs UTC+0
- **THEN** los dias calculados SON identicos

#### Scenario: fechaReferencia also uses civil-date construction

- **GIVEN** `fechaReferencia = "2026-07-03"` pasada como parametro
- **WHEN** `calcularDiasMora` es invocada
- **THEN** `fechaReferencia` se construye como `new Date(2026, 6, 3, 12, 0, 0)` (civil date)
- **AND** no sufre desplazamiento por zona horaria

### Requirement: Strict less-than cutoff for Mode A

El sistema SHALL usar comparacion estricta menor-que (`<`) para determinar si una deuda aplica Modo A (coeficiente). Una deuda con `FechaVto` igual a `FechaDesdeInt` SHALL ir a Modo B (interes simple), no a Modo A.

#### Scenario: Date exactly on cutoff goes to Mode B

- **GIVEN** `FechaDesdeInt = "2024-12-31"` y `FechaVto = "2024-12-31"`
- **WHEN** `calcularMovimiento` es invocado
- **THEN** se aplica Modo B (interes simple), NO Modo A (coeficiente)

#### Scenario: Date before cutoff goes to Mode A

- **GIVEN** `FechaDesdeInt = "2024-12-31"` y `FechaVto = "2024-12-30"` con `CoeficienteCuota > 0` e `IndiceFinal` definido
- **WHEN** `calcularMovimiento` es invocado
- **THEN** se aplica Modo A (coeficiente)

### Requirement: Multi-municipio DB field contract

El sistema SHALL requerir los campos `CoeficienteCuota` (en `ClientesCtaCte`), `IndiceFinal`, `FechaDesdeInt`, y `TasaInteres` (en `DatosGenerales`) para cada municipio que utilice el sistema de coeficientes. Cuando estos campos esten ausentes o sean nulos, el sistema SHALL hacer fallback a Modo B (interes simple) sin error.

#### Scenario: Municipality with full coefficient data

- **GIVEN** un municipio con `CoeficienteCuota > 0`, `IndiceFinal` definido, y `FechaDesdeInt` definido
- **WHEN** se calcula una deuda con `FechaVto < FechaDesdeInt`
- **THEN** se aplica Modo A (coeficiente) correctamente

#### Scenario: Municipality without coefficient data falls back to Mode B

- **GIVEN** un municipio con `IndiceFinal = NULL` o `FechaDesdeInt = NULL`
- **WHEN** se calcula cualquier deuda
- **THEN** el sistema aplica Modo B (interes simple) sin error
- **AND** no se produce excepcion ni resultado nulo

#### Scenario: Debt row without CoeficienteCuota

- **GIVEN** una fila con `CoeficienteCuota = NULL` o `CoeficienteCuota = 0`
- **WHEN** `calcularMovimiento` es invocado
- **THEN** se evalua Modo B (interes simple) para esa fila

### Requirement: Canonical DNI validation against desktop software

El sistema SHALL producir montos identicos al software de escritorio del contador para los 5 DNIs canonicos de validacion, con una tolerancia maxima de +-0.01 por fila individual.

Los DNIs canonicos son: 17720479 (PLAINO), 12212197 (OLMOS), 16856346 (MISERENDINO), 29308519 (CRAVERO), 14537335 (CACERES).

#### Scenario: PLAINO - all rows match

- **GIVEN** DNI 17720479 (PLAINO) con `fechaReferencia = "2026-07-03"`
- **WHEN** todas las deudas son calculadas
- **THEN** cada fila de interes coincide con el software de escritorio dentro de +-0.01
- **AND** el total general coincide dentro de +-0.01

#### Scenario: OLMOS - all rows match

- **GIVEN** DNI 12212197 (OLMOS) con `fechaReferencia = "2026-07-03"`
- **WHEN** todas las deudas son calculadas
- **THEN** cada fila de interes coincide con el software de escritorio dentro de +-0.01

#### Scenario: MISERENDINO - all rows match

- **GIVEN** DNI 16856346 (MISERENDINO) con `fechaReferencia = "2026-07-03"`
- **WHEN** todas las deudas son calculadas
- **THEN** cada fila de interes coincide con el software de escritorio dentro de +-0.01

#### Scenario: CRAVERO - all rows match

- **GIVEN** DNI 29308519 (CRAVERO) con `fechaReferencia = "2026-07-03"`
- **WHEN** todas las deudas son calculadas
- **THEN** cada fila de interes coincide con el software de escritorio dentro de +-0.01

#### Scenario: CACERES - all rows match

- **GIVEN** DNI 14537335 (CACERES) con `fechaReferencia = "2026-07-03"`
- **WHEN** todas las deudas son calculadas
- **THEN** cada fila de interes coincide con el software de escritorio dentro de +-0.01

## REMOVED Requirements

### Requirement: Inclusive cutoff comparison (<=)

(Reason: El operador `<=` causaba que deudas con `FechaVto == FechaDesdeInt` aplicaran Modo A incorrectamente, divergiendo de la formula Python del contador que usa `<` estricto)
(Migration: Actualizar tests que asuman `<=` para usar `<` estricto; actualizar scenario de `dias_mora` que menciona comparacion inclusive)
