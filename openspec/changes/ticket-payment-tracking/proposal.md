# Proposal - Ticket Payment Tracking

## Problema

El sistema no tiene una entidad dedicada para seguir tickets generados, expirados y pagados, lo que debilita trazabilidad, conciliacion y manejo de webhooks tardios.

## Objetivo

Incorporar persistencia formal del ticket y del resultado de pago sin romper el flujo actual.

## Alcance

- Tabla o entidad `TicketsPago`
- ID unico de ticket
- Estados basicos del ticket
- Vinculacion con webhook y registracion de pago

## Fuentes

- `docs/AI_CONTEXT.md`
- `docs/bd/LOGICA_DEUDAS_PAGOS.md`