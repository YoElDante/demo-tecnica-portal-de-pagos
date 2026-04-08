# Spec - Calculo de Intereses

## Objetivo

Definir la regla de mora municipal para que sea consistente, verificable y configurable.

## Requisitos

### Requirement: Formula explicita
El calculo de intereses MUST usar una formula diaria basada en tasa anual.

#### Scenario: Deuda vencida
- **GIVEN** una deuda vencida con importe base conocido
- **WHEN** el sistema calcula mora
- **THEN** usa la formula `importe * (tasa_anual / 100 / 365) * dias_mora`

### Requirement: Sin mora antes del vencimiento
Una deuda no vencida MUST producir interes cero.

#### Scenario: Deuda vigente
- **GIVEN** una deuda con fecha de vencimiento futura
- **WHEN** se calcula la mora
- **THEN** el resultado de interes es cero

### Requirement: Tasa configurable
La tasa anual SHOULD poder cambiar por municipio o por entorno.

#### Scenario: Municipio con tasa distinta
- **GIVEN** un municipio con tasa configurada
- **WHEN** el sistema calcula mora
- **THEN** usa la tasa del municipio activo y no un valor fijo global

## Fuentes

- `docs/bd/LOGICA_DEUDAS_PAGOS.md`
- `docs/AI_CONTEXT.md`