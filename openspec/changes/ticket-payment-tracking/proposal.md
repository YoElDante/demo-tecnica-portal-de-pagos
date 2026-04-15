# Proposal - Ticket Payment Tracking

## Problema

El sistema no tiene una entidad dedicada para seguir tickets generados, expirados y pagados, lo que debilita trazabilidad, conciliacion, idempotencia y recuperacion ante fallas operativas (reintentos de webhook, caidas de gateway, feriados y fines de semana).

## Objetivo

Incorporar persistencia formal del ticket y del resultado de pago sin romper el flujo actual, definiendo una politica operativa clara de validez, retencion y conciliacion.

## Alcance

- Tabla o entidad `TicketsPago`.
- Persistencia del ticket al momento de `Ir a pagar`.
- Validez operativa del ticket hasta las 23:59 del dia de emision (hora local del municipio).
- Retencion de tickets pendientes/no conciliados por 45 dias corridos.
- Conservacion de tickets pagados para auditoria y trazabilidad historica.
- Estados del ticket y transiciones con idempotencia.
- Vinculacion con webhook y registracion de pago.
- Lineamientos para conciliacion diferida cuando webhook inmediato no llega.

## Decisiones Cerradas

1. El portal genera y guarda el ticket cuando el contribuyente presiona `Ir a pagar`, antes de redirigir a la pasarela.
2. Un ticket es pagable solo hasta las 23:59 del mismo dia. Pasado ese horario, el portal no debe derivar a ninguna pasarela con ese ticket.
3. El ticket no se elimina al vencer. Queda retenido para trazabilidad y conciliacion por 45 dias corridos cuando no esta pagado.
4. Los tickets en estado `APROBADO` se conservan en base de datos y no entran en purga automatica.
5. El redirect del usuario no confirma pago. Solo confirma el webhook server-to-server del gateway o una conciliacion posterior.
6. Los webhooks duplicados se aceptan y responden en 200 sin reprocesar deuda/cobro.
7. El procesamiento no depende de hash volatil en memoria. Las claves de correlacion persistidas son `external_reference`, `id_operacion` y/o `nro_operacion`.

## Limites de Responsabilidad

### Este repositorio (portal)

- Define ciclo de vida del ticket y persistencia local.
- Decide si redirige o bloquea por vencimiento operativo.
- Aplica idempotencia en confirmacion de pago.
- Ejecuta tarea de conciliacion local para estados pendientes y retiros de derivacion.

### Gestor superior + agente multi-repo

- Define formato canonico del numero de ticket interoperable para SIRO, Pago TIC, MercadoPago y futuras pasarelas.
- Define ruteo por `municipio -> pasarela` en el gateway.
- Define contrato unico cross-repo (payloads, codigos de error, eventos de conciliacion).
- Coordina pruebas E2E entre portal y gateway.

## Fuentes

- `docs/AI_CONTEXT.md`
- `docs/bd/LOGICA_DEUDAS_PAGOS.md`
- `docs/CONTRACT-PORTAL-GATEWAY.md`
- `openspec/specs/payment-gateway-contract/spec.md`
- `openspec/specs/ticket-lifecycle/spec.md`