# Spec - Contrato Portal y Gateway

## Objetivo

Definir el contrato estable entre el portal municipal y el gateway de pagos para redirects, webhooks y confirmacion operativa.

## Requisitos

### Requirement: Redirect seguro
El portal MUST mostrar vistas de resultado solo cuando reciba un token valido emitido por el gateway.

#### Scenario: Redirect exitoso con token valido
- **GIVEN** un usuario finaliza o abandona un pago en la plataforma externa
- **WHEN** el gateway lo redirige al portal con `ref` y `token`
- **THEN** el portal valida el token antes de renderizar una vista de resultado

### Requirement: Webhook como fuente de verdad
La base de datos MUST actualizarse solo a partir del webhook server-to-server.

#### Scenario: Confirmacion de pago aprobada
- **GIVEN** un pago confirmado por el gateway
- **WHEN** el portal recibe el webhook autenticado
- **THEN** actualiza el estado del ticket y los registros contables sin depender del redirect

### Requirement: Idempotencia
El procesamiento de pagos MUST ser idempotente.

#### Scenario: Webhook duplicado
- **GIVEN** un mismo pago ya fue procesado
- **WHEN** el gateway reintenta el webhook
- **THEN** el portal responde sin reprocesar deuda ni cobro

## Fuentes

- `docs/CONTRACT-PORTAL-GATEWAY.md`
- `docs/INTEGRACION_PAGOS.md`