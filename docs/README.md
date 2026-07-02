# 📚 Documentación del Portal de Pagos Municipal

> **Índice maestro** — todos los documentos del proyecto, clasificados por categoría y frescura.
> **Última actualización**: 2026-07-02

---

## 🚀 Primeros pasos

Si es tu primera vez en el proyecto:

1. **`AI_CONTEXT.md`** — contexto compacto para IA y desarrolladores (stack, arquitectura, riesgos)
2. **`../AGENTS.md`** — reglas globales, convenciones y flujo SDD
3. **`GLOSSARY.md`** — términos de dominio (si algo no se entiende, empezar acá)

---

## 🗺️ Mapa de documentación

### 📖 Core — Contrato y reglas de negocio

| Documento | Estado | Descripción |
|-----------|--------|-------------|
| [AI_CONTEXT.md](AI_CONTEXT.md) | ✅ Fresco | Contexto compacto: stack, arquitectura, estado, riesgos |
| [CONTRACT-PORTAL-GATEWAY.md](CONTRACT-PORTAL-GATEWAY.md) | ✅ Fresco | Contrato portal↔gateway — redirect, webhook, conciliación |
| [INTEGRACION_PAGOS.md](INTEGRACION_PAGOS.md) | ✅ Fresco | Flujo activo de integración con SIRO / Banco Roela |
| [GLOSSARY.md](GLOSSARY.md) | ✅ Nuevo | Términos de dominio: CodMovim, TIPO_BIEN, estados, seguridad |
| [ADR.md](ADR.md) | ✅ Nuevo | Registro de decisiones de arquitectura (7 ADRs) |
| [bd/LOGICA_DEUDAS_PAGOS.md](bd/LOGICA_DEUDAS_PAGOS.md) | ✅ Fresco | Reglas de deuda, mora, registración contable y esquema BD |

### ⚙️ Operación — Despliegue y configuración

| Documento | Estado | Descripción |
|-----------|--------|-------------|
| [GUIA_NUEVO_MUNICIPIO.md](GUIA_NUEVO_MUNICIPIO.md) | ✅ Fresco | Incorporación de un nuevo municipio (paso a paso) |
| [DEPLOY_AZURE.md](DEPLOY_AZURE.md) | ✅ Fresco | Despliegue en Azure App Service por municipio |
| [PLAN_CONFIGURACION_MULTIAMBIENTE.md](PLAN_CONFIGURACION_MULTIAMBIENTE.md) | ✅ Fresco | Resumen operativo del modelo multi-municipio |
| [PENDIENTE_SEGURIDAD.md](PENDIENTE_SEGURIDAD.md) | ✅ Fresco | Checklist de hardening HTTP (helmet, CSP, HTTPS) |
| [GUIA_RAMAS.md](GUIA_RAMAS.md) | ✅ Fresco | Estrategia de ramas Git y flujo SDD |
| [GUIDES/RUNBOOK.md](GUIDES/RUNBOOK.md) | ✅ Nuevo | Procedimientos operativos: diagnóstico, rollback, webhooks |
| [DIAGNOSTICO_TICKET_VACIO.md](DIAGNOSTICO_TICKET_VACIO.md) | ✅ Fresco | Diagnóstico detallado de ticket vacío post-pago |

### 🔗 Integración

| Documento | Estado | Descripción |
|-----------|--------|-------------|
| [integracion/GUIA_INTEGRACION_MULTIPROYECTO.md](integracion/GUIA_INTEGRACION_MULTIPROYECTO.md) | ✅ Corregido | Trabajo coordinado portal + gateway (actualizado: SIRO) |
| [integracion/CHECKLIST_APPSETTINGS_Y_ORQUESTADOR_TICKETS.md](integracion/CHECKLIST_APPSETTINGS_Y_ORQUESTADOR_TICKETS.md) | ✅ Fresco | Checklist Azure App Settings + brief orquestador de tickets |

### 📊 Estado del proyecto

| Documento | Estado | Descripción |
|-----------|--------|-------------|
| [../AGENTS.md](../AGENTS.md) | ✅ Fresco | Estado de desarrollo, reglas globales, skills |
| [informe-estado-20260630-0426.md](informe-estado-20260630-0426.md) | ⚠️ Snapshot | Informe de estado (humano) — snapshot del 2026-06-30 |
| [informe-estado-ai-20260630-0426.md](informe-estado-ai-20260630-0426.md) | ⚠️ Snapshot | Informe de estado (IA) — snapshot del 2026-06-30 |
| [../PRD.md](../PRD.md) | ⚠️ Supersedido | PRD original — reemplazado por AGENTS.md + docs/ |

### ⚙️ Configuración

| Documento | Estado | Descripción |
|-----------|--------|-------------|
| [../config/MUNICIPIO_CONFIG.md](../config/MUNICIPIO_CONFIG.md) | ✅ Fresco | Cómo funciona la selección de municipio y la estructura de imágenes |
| [../.github/workflows/INSTRUCTIVO_DEPLOY.md](../.github/workflows/INSTRUCTIVO_DEPLOY.md) | ✅ Corregido | GitHub Actions + Azure deployment (actualizado: siro) |

### 🗄️ Archivo histórico

Documentos preservados por trazabilidad. **No usar como referencia operativa.**

| Documento | Descripción |
|-----------|-------------|
| [_archive/PLAN_INTEGRACION_MERCADOPAGO.md](_archive/PLAN_INTEGRACION_MERCADOPAGO.md) | Plan de integración MercadoPago (dic 2025) |
| [_archive/INTEGRACION_PAGOS_MERCADOPAGO.md](_archive/INTEGRACION_PAGOS_MERCADOPAGO.md) | Detalle técnico MercadoPago |
| [_archive/instrucciones.md](_archive/instrucciones.md) | Instrucciones IA era MercadoPago (dic 2025) |
| [_archive/INFORME_FASE1_BD_UNIFICADA.md](_archive/INFORME_FASE1_BD_UNIFICADA.md) | Cierre Fase 1 — unificación BD (mar 2026) |
| [_archive/README.md](_archive/README.md) | Explicación del propósito del archivo |

### 🔧 Skills (agentes de IA)

| Skill | Documento |
|-------|-----------|
| `payment-gateway-webhook` | [../skills/payment-gateway-webhook/SKILL.md](../skills/payment-gateway-webhook/SKILL.md) |
| `payment-gateway-security` | [../skills/payment-gateway-security/SKILL.md](../skills/payment-gateway-security/SKILL.md) |
| `municipio-onboarding` | [../skills/municipio-onboarding/SKILL.md](../skills/municipio-onboarding/SKILL.md) |
| `deuda-interest-calculation` | [../skills/deuda-interest-calculation/SKILL.md](../skills/deuda-interest-calculation/SKILL.md) |
| `azure-multiappservice-payment` | [../skills/azure-multiappservice-payment/SKILL.md](../skills/azure-multiappservice-payment/SKILL.md) |
| `multiproject-workflow` | [../skills/multiproject-workflow/SKILL.md](../skills/multiproject-workflow/SKILL.md) |

### 📐 Especificaciones formales (OpenSpec)

| Spec | Documento |
|------|-----------|
| Ticket lifecycle | [../openspec/specs/ticket-lifecycle/spec.md](../openspec/specs/ticket-lifecycle/spec.md) |
| Payment gateway contract | [../openspec/specs/payment-gateway-contract/spec.md](../openspec/specs/payment-gateway-contract/spec.md) |
| Multi-municipio | [../openspec/specs/multi-municipio/spec.md](../openspec/specs/multi-municipio/spec.md) |
| Interest calculation | [../openspec/specs/interest-calculation/spec.md](../openspec/specs/interest-calculation/spec.md) |
| Documentation | [../openspec/specs/documentation/spec.md](../openspec/specs/documentation/spec.md) |
| Data model | [../openspec/specs/data-model/spec.md](../openspec/specs/data-model/spec.md) |

### 📋 Cambios activos (OpenSpec)

| Cambio | Documento |
|--------|-----------|
| `ticket-payment-tracking` | [../openspec/changes/ticket-payment-tracking/](../openspec/changes/ticket-payment-tracking/) |
| `security-hardening` | [../openspec/changes/security-hardening/](../openspec/changes/security-hardening/) |
| `email-payment-receipts` | [../openspec/changes/email-payment-receipts/](../openspec/changes/email-payment-receipts/) |
| `configurable-interest-rate` | [../openspec/changes/configurable-interest-rate/](../openspec/changes/configurable-interest-rate/) |
| `docs-audit-reorg` | [../openspec/changes/docs-audit-reorg/](../openspec/changes/docs-audit-reorg/) |

---

## 🧭 Orden de lectura recomendado

### Para desarrolladores nuevos
1. `AI_CONTEXT.md`
2. `GLOSSARY.md`
3. `CONTRACT-PORTAL-GATEWAY.md`
4. Según tarea: `GUIA_NUEVO_MUNICIPIO.md`, `DEPLOY_AZURE.md`, o `bd/LOGICA_DEUDAS_PAGOS.md`

### Para operadores / DevOps
1. `GUIDES/RUNBOOK.md`
2. `DEPLOY_AZURE.md`
3. `PLAN_CONFIGURACION_MULTIAMBIENTE.md`
4. `DIAGNOSTICO_TICKET_VACIO.md`

### Para agentes de IA
1. `AI_CONTEXT.md`
2. `GLOSSARY.md` (términos de dominio)
3. Skill relevante según la tarea
4. OpenSpec spec del área afectada

---

## 📋 Leyenda de estados

| Badge | Significado |
|-------|-------------|
| ✅ Fresco | Refleja la realidad actual del proyecto |
| ✅ Nuevo | Creado recientemente, vigente |
| ✅ Corregido | Actualizado para corregir referencias obsoletas |
| ⚠️ Snapshot | Instantánea de un momento — puede estar desactualizada |
| ⚠️ Supersedido | Reemplazado por documentación más actual |

---

> **Mantenimiento**: Al crear, modificar o archivar documentación, actualizar este índice.
> Los documentos en `_archive/` y `openspec/changes/archive/` no requieren actualización.
