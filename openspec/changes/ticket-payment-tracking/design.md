# Design - Ticket Payment Tracking

## Enfoque

- Persistir ticket al momento de generacion con fecha de expiracion y conceptos asociados.
- Actualizar ticket desde el webhook del gateway.
- Preservar la logica actual de cobro y agregar trazabilidad transversal.

## Componentes Afectados

- Modelo nuevo para tickets
- Servicio de ticket/pagos
- Controller de confirmacion de pago
- Posible migracion SQL o script de creacion de tabla

## Riesgos

- Doble fuente de estado si no se alinea `TicketsPago` con los registros contables existentes.
- Necesidad de definir formato canónico de `external_reference`.