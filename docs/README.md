# Documentación del Portal de Pagos Municipal

> **Índice maestro** — todos los documentos del proyecto, clasificados por categoría.
> **Última actualización**: 2026-07-04
>
> Antes de crear o modificar documentación, leer [`AGENTS.md`](AGENTS.md).

---

## Primeros pasos

Si es tu primera vez en el proyecto:

1. [`ai-context.md`](ai-context.md) — contexto compacto para IA y desarrolladores
2. [`../AGENTS.md`](../AGENTS.md) — reglas globales, convenciones y flujo SDD
3. [`GLOSSARY.md`](GLOSSARY.md) — términos de dominio

---

## architecture/ — Decisiones de diseño duraderas

| Documento | Estado | Descripción |
|-----------|--------|-------------|
| [architecture/adr.md](architecture/adr.md) | ✅ Fresco | Registro de decisiones de arquitectura (7 ADRs) |
| [architecture/security-pending.md](architecture/security-pending.md) | ✅ Fresco | Checklist de hardening HTTP (helmet, CSP, HTTPS) |
| [architecture/politica-documentacion.md](architecture/politica-documentacion.md) | ✅ Nuevo | Política oficial de documentación automatizada |

## domain/ — Conocimiento del negocio

| Documento | Estado | Descripción |
|-----------|--------|-------------|
| [domain/logica-deudas-pagos.md](domain/logica-deudas-pagos.md) | ✅ Fresco | Reglas de deuda, mora, registración contable y esquema BD |
| [domain/formulas-intereses.txt](domain/formulas-intereses.txt) | ✅ Fresco | Fórmulas de cálculo de intereses y mora |

## guides/ — Procedimientos operativos

| Documento | Estado | Descripción |
|-----------|--------|-------------|
| [guides/nuevo-municipio.md](guides/nuevo-municipio.md) | ✅ Fresco | Incorporación de un nuevo municipio (paso a paso) |
| [guides/deploy-azure.md](guides/deploy-azure.md) | ✅ Fresco | Despliegue en Azure App Service por municipio |
| [guides/runbook.md](guides/runbook.md) | ✅ Fresco | Procedimientos operativos: diagnóstico, rollback, webhooks |
| [guides/plan-multiambiente.md](guides/plan-multiambiente.md) | ✅ Fresco | Resumen operativo del modelo multi-municipio |
| [guides/guia-sdd.md](guides/guia-sdd.md) | ✅ Nuevo | Guía de trabajo con SDD: ciclo completo, comandos, fases |

## integration/ — Contratos con sistemas externos

| Documento | Estado | Descripción |
|-----------|--------|-------------|
| [integration/contract-portal-gateway.md](integration/contract-portal-gateway.md) | ✅ Fresco | Contrato portal↔gateway: redirect, webhook, conciliación |
| [integration/integracion-pagos.md](integration/integracion-pagos.md) | ✅ Fresco | Flujo activo de integración con SIRO / Banco Roela |
| [integration/checklist-appsettings.md](integration/checklist-appsettings.md) | ✅ Fresco | Checklist Azure App Settings + brief orquestador de tickets |
| [integration/guia-multiproyecto.md](integration/guia-multiproyecto.md) | ✅ Fresco | Trabajo coordinado portal + gateway |

## auditorias/ — Auditorías técnicas

| Documento | Estado | Descripción |
|-----------|--------|-------------|
| [auditorias/auditoria-03072026/](auditorias/auditoria-03072026/) | ✅ Nuevo | Auditoría técnica completa del proyecto (jul 2026) |

---

## Configuración (fuera de /docs)

| Documento | Descripción |
|-----------|-------------|
| [`../config/MUNICIPIO_CONFIG.md`](../config/MUNICIPIO_CONFIG.md) | Selección de municipio y estructura de imágenes |
| [`../.github/workflows/INSTRUCTIVO_DEPLOY.md`](../.github/workflows/INSTRUCTIVO_DEPLOY.md) | GitHub Actions + Azure deployment |

## Skills (agentes de IA)

| Skill | Documento |
|-------|-----------|
| `payment-gateway-webhook` | [`../skills/payment-gateway-webhook/SKILL.md`](../skills/payment-gateway-webhook/SKILL.md) |
| `payment-gateway-security` | [`../skills/payment-gateway-security/SKILL.md`](../skills/payment-gateway-security/SKILL.md) |
| `municipio-onboarding` | [`../skills/municipio-onboarding/SKILL.md`](../skills/municipio-onboarding/SKILL.md) |
| `deuda-interest-calculation` | [`../skills/deuda-interest-calculation/SKILL.md`](../skills/deuda-interest-calculation/SKILL.md) |
| `azure-multiappservice-payment` | [`../skills/azure-multiappservice-payment/SKILL.md`](../skills/azure-multiappservice-payment/SKILL.md) |
| `multiproject-workflow` | [`../skills/multiproject-workflow/SKILL.md`](../skills/multiproject-workflow/SKILL.md) |

## Especificaciones formales (OpenSpec)

| Spec | Documento |
|------|-----------|
| Ticket lifecycle | [`../openspec/specs/ticket-lifecycle/spec.md`](../openspec/specs/ticket-lifecycle/spec.md) |
| Payment gateway contract | [`../openspec/specs/payment-gateway-contract/spec.md`](../openspec/specs/payment-gateway-contract/spec.md) |
| Multi-municipio | [`../openspec/specs/multi-municipio/spec.md`](../openspec/specs/multi-municipio/spec.md) |
| Interest calculation | [`../openspec/specs/interest-calculation/spec.md`](../openspec/specs/interest-calculation/spec.md) |
| Documentation | [`../openspec/specs/documentation/spec.md`](../openspec/specs/documentation/spec.md) |
| Data model | [`../openspec/specs/data-model/spec.md`](../openspec/specs/data-model/spec.md) |

## Cambios activos (OpenSpec)

| Cambio | Documento |
|--------|-----------|
| `ticket-payment-tracking` | [`../openspec/changes/ticket-payment-tracking/`](../openspec/changes/ticket-payment-tracking/) |
| `security-hardening` | [`../openspec/changes/security-hardening/`](../openspec/changes/security-hardening/) |
| `email-payment-receipts` | [`../openspec/changes/email-payment-receipts/`](../openspec/changes/email-payment-receipts/) |
| `configurable-interest-rate` | [`../openspec/changes/configurable-interest-rate/`](../openspec/changes/configurable-interest-rate/) |

---

## Archivo histórico (_archive/)

Documentos preservados por trazabilidad. **No usar como referencia operativa.**

| Documento | Descripción |
|-----------|-------------|
| [_archive/PLAN_INTEGRACION_MERCADOPAGO.md](_archive/PLAN_INTEGRACION_MERCADOPAGO.md) | Plan de integración MercadoPago (dic 2025) |
| [_archive/INTEGRACION_PAGOS_MERCADOPAGO.md](_archive/INTEGRACION_PAGOS_MERCADOPAGO.md) | Detalle técnico MercadoPago |
| [_archive/instrucciones.md](_archive/instrucciones.md) | Instrucciones IA era MercadoPago (dic 2025) |
| [_archive/INFORME_FASE1_BD_UNIFICADA.md](_archive/INFORME_FASE1_BD_UNIFICADA.md) | Cierre Fase 1 — unificación BD (mar 2026) |
| [_archive/diagnostico-ticket-vacio.md](_archive/diagnostico-ticket-vacio.md) | Diagnóstico ticket vacío post-pago (resuelto) |
| [_archive/status/](\_archive/status/) | Informes de estado con fecha (snapshots) |
| [_archive/database/](_archive/database/) | Scripts SQL de setup históricos |
| [_archive/pruebas-comparacion/](_archive/pruebas-comparacion/) | Datos de prueba portal vs escritorio |

---

## Orden de lectura recomendado

**Para desarrolladores nuevos:**
1. `ai-context.md`
2. `GLOSSARY.md`
3. `integration/contract-portal-gateway.md`
4. Según tarea: `guides/nuevo-municipio.md`, `guides/deploy-azure.md`, o `domain/logica-deudas-pagos.md`

**Para operadores / DevOps:**
1. `guides/runbook.md`
2. `guides/deploy-azure.md`
3. `guides/plan-multiambiente.md`

**Para agentes de IA:**
1. `ai-context.md` + `GLOSSARY.md`
2. Skill relevante según la tarea
3. OpenSpec spec del área afectada

---

## Leyenda de estados

| Badge | Significado |
|-------|-------------|
| ✅ Fresco | Refleja la realidad actual del proyecto |
| ✅ Nuevo | Creado recientemente, vigente |
| ⚠️ Revisar | Puede estar desactualizado |
| ⚠️ Snapshot | Instantánea de un momento histórico |
| 🗄️ Archivado | Obsoleto, en `_archive/` |

---

> **Mantenimiento**: Al crear, mover o archivar un documento, actualizar este índice.
> Ver [`AGENTS.md`](AGENTS.md) para el proceso completo.
