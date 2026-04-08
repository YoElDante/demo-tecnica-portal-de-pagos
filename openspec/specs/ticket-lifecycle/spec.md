# Spec - Ciclo de Vida de Tickets

## Objetivo

Formalizar la generacion, expiracion, pago y trazabilidad de tickets municipales.

## Requisitos

### Requirement: Identificador unico de ticket
Todo ticket MUST tener un identificador trazable y no correlativo.

#### Scenario: Generacion de ticket
- **GIVEN** un contribuyente selecciona conceptos para pagar
- **WHEN** el sistema genera el ticket
- **THEN** asigna un ID del estilo `YYYYMMDDHHMMSS-DNI`

### Requirement: Persistencia del ticket
Todo ticket generado SHOULD quedar registrado para seguimiento posterior.

#### Scenario: Ticket creado
- **GIVEN** un ticket generado
- **WHEN** se completa la operacion de generacion
- **THEN** el sistema persiste fecha de generacion, expiracion, conceptos y estado inicial

### Requirement: Expiracion operativa
Un ticket MUST marcarse como expirado una vez superado su periodo de validez operativa.

#### Scenario: Ticket vencido sin pago
- **GIVEN** un ticket sin pago confirmado
- **WHEN** supera las 24 horas de vigencia
- **THEN** el sistema lo trata como expirado para nuevos pagos

### Requirement: Pago confirmado tardio
Un pago confirmado MUST poder procesarse aunque el ticket haya expirado operativamente.

#### Scenario: Webhook posterior a las 24 horas
- **GIVEN** un ticket expirado
- **WHEN** llega un webhook valido con pago aprobado
- **THEN** el sistema procesa el pago respetando idempotencia

## Fuentes

- `docs/AI_CONTEXT.md`
- `docs/bd/LOGICA_DEUDAS_PAGOS.md`