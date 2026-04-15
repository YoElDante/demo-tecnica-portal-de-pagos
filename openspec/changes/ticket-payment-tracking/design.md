# Design - Ticket Payment Tracking

## Enfoque

- Persistir ticket al momento de `Ir a pagar`, con validez operativa hasta las 23:59 del dia local.
- Actualizar ticket desde webhook del gateway con idempotencia fuerte.
- Permitir conciliacion diferida para pagos sin webhook inmediato.
- Preservar la logica actual de cobro y agregar trazabilidad transversal y auditoria.

## Modelo de Datos Propuesto

### Tabla: TicketsPago

- `id` (PK)
- `ticket_number` (string, unico, legible para integracion)
- `municipio_id` (string)
- `dni` (string)
- `external_reference` (string, unico)
- `gateway_provider` (enum/string: SIRO, PAGOTIC, MERCADOPAGO, OTRO)
- `status` (enum: CREADO, PENDIENTE, APROBADO, RECHAZADO, EXPIRADO, CONCILIANDO)
- `issued_at` (datetime)
- `expires_at` (datetime, 23:59:59 local del dia de emision)
- `last_gateway_event_at` (datetime, nullable)
- `paid_at` (datetime, nullable)
- `amount_total` (decimal)
- `currency` (string)
- `id_operacion` (string, nullable)
- `nro_operacion` (string, nullable)
- `reconciliation_source` (enum/string: WEBHOOK_INMEDIATO, CONCILIACION, MANUAL)
- `retry_count` (int)
- `payload_snapshot` (json/text)
- `created_at` / `updated_at`

### Indices clave

- Unique: `external_reference`
- Unique: `ticket_number`
- Index: `(municipio_id, dni, status)`
- Index: `(status, expires_at)`
- Index: `id_operacion` y `nro_operacion` para dedupe operativo

## Reglas de Negocio

1. Al presionar `Ir a pagar`, el portal crea `TicketsPago` en `CREADO`/`PENDIENTE` y recien luego redirige.
2. Si `now > expires_at`, no se deriva a pasarela y se responde ticket vencido.
3. Un webhook `APROBADO` siempre prevalece sobre estado operativo vencido (expiro para iniciar pago, no para registrar pago).
4. Webhook duplicado no reprocesa registracion contable.
5. Retencion de pendientes/no conciliados: 45 dias corridos. Luego aplicar limpieza/purga de no pagados segun politica operativa.
6. Los tickets `APROBADO` se conservan para auditoria (sin purga automatica por antiguedad operativa).

## Maquina de Estados

- `CREADO -> PENDIENTE` (derivacion a pasarela iniciada)
- `PENDIENTE -> APROBADO` (webhook/conciliacion)
- `PENDIENTE -> RECHAZADO` (webhook/conciliacion)
- `PENDIENTE -> EXPIRADO` (fin de vigencia operativa)
- `EXPIRADO -> APROBADO` (webhook/conciliacion tardia valida)
- `PENDIENTE/EXPIRADO -> CONCILIANDO` (job de conciliacion en curso)
- `CONCILIANDO -> APROBADO/RECHAZADO/PENDIENTE`

## Manejo de Escenarios Críticos

1. No pago al momento: queda `PENDIENTE`, vence 23:59, sigue retenido para auditoria.
2. Pago sin webhook inmediato: queda `PENDIENTE`, resolver via conciliacion al dia siguiente.
3. Pago con webhook inmediato: `APROBADO` y registrar contabilidad.
4. Webhook repetido: responder 200 idempotente, sin reproceso.
5. Confirmacion por lote/mail del dia siguiente: actualizar con `reconciliation_source=CONCILIACION`.
6. Reinicio servidor/perdida de hash en memoria: no afecta, porque correlacion reside en BD.
7. Falla gateway intermedio: mantener pendiente y reintentos/reconciliacion.
8. Feriado/fines de semana/caida del banco: conservar no pagados hasta 45 dias corridos para resolver tardios.
9. Tickets pagados: conservar historico para trazabilidad y conciliacion contable.

## Componentes Afectados

- Modelo nuevo para tickets.
- Servicio de ticket/pagos.
- Controller de confirmacion de pago.
- Job de expiracion operativa y job de conciliacion.
- Posible migracion SQL o script de creacion de tabla.

## Responsabilidades Cross-Repo (fuera de este repo)

- Definir formato canonico final de `ticket_number` para interoperar con SIRO/Pago TIC/MercadoPago.
- Definir mapping por municipio a pasarela en gateway.
- Unificar contratos de request/response/eventos entre portal y gateway.

## Riesgos

- Doble fuente de estado si no se alinea `TicketsPago` con los registros contables existentes.
- Necesidad de definir formato canonico de `ticket_number` y `external_reference`.
- Errores de timezone si no se estandariza zona horaria por municipio.
- Riesgo de borrar demasiado pronto tickets no pagados si no se respeta ventana de 45 dias.
- Crecimiento de tabla de pagados si no se define estrategia de historico/particionado a mediano plazo.