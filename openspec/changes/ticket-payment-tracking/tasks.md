# Tasks - Ticket Payment Tracking

## Portal (este repo)

- [ ] Definir esquema de `TicketsPago` con indices de dedupe (`external_reference`, `id_operacion`, `nro_operacion`).
- [ ] Implementar alta del ticket al presionar `Ir a pagar` (antes de derivar).
- [ ] Implementar regla de validez operativa hasta 23:59 del dia local.
- [ ] Bloquear nueva derivacion a pasarela si ticket vencio.
- [ ] Implementar webhook idempotente para APROBADO/RECHAZADO/PENDIENTE/EXPIRADO.
- [ ] Implementar job de expiracion operativa y retencion de 45 dias corridos para tickets no pagados.
- [ ] Implementar politica de conservacion de tickets `APROBADO` (sin purga automatica).
- [ ] Implementar job de conciliacion para pendientes sin webhook inmediato.
- [ ] Registrar origen de confirmacion (`WEBHOOK_INMEDIATO` o `CONCILIACION`).
- [ ] Documentar matriz de escenarios de falla y su estado final esperado.

## Gestor superior + agente multi-repo

- [ ] Definir formato canonico de `ticket_number` usable por SIRO/Pago TIC/MercadoPago.
- [ ] Definir contrato cross-repo para create payment, redirect y webhook.
- [ ] Definir estrategia de ruteo `municipio -> pasarela` en gateway.
- [ ] Definir politica de reintentos y reconciliacion del gateway hacia portal.
- [ ] Ejecutar pruebas E2E multi-repo para casos nominales y fallas.