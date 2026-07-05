# Exploration: Documentation Audit Review

> **Fecha**: 2026-07-04
> **Propósito**: Auditoría exhaustiva de la documentación activa en `/docs/`, validación de referencias cruzadas, detección de brechas y redundancias.
> **Excluye**: `docs/auditorias/`, `docs/_archive/`, `docs/pruebas_documentos_a_comparar/` (no existe)

---

## Overall Health Assessment

| Dimensión | Estado |
|-----------|--------|
| Estructura general | ✅ Buena — taxonomía clara, carpetas correctas |
| Frescura de contenido | ⚠️ Mixta — la mayoría actualizada jul 2026, pero varias fechas viejas |
| Corrección de referencias cruzadas | ❌ **CRÍTICO** — cientos de referencias a rutas antiguas rotas |
| Cobertura de temas | ✅ Aceptable — 16 documentos activos cubren las áreas principales |
| Redundancia | ⚠️ Baja — un par de áreas con superposición parcial |
| Consistencia entre documentos de política | ⚠️ Leve desalineación entre AGENTS.md, política-documentación, y doc-conventions skill |

**Veredicto general**: La documentación tiene buena estructura y contenido, pero **las referencias cruzadas están mayoritariamente rotas** tras una reorganización de carpetas (commit `723fc7b`). `ai-context.md` es el documento más urgente de reparar. Hay un documento referenciado por 3 fuentes que no existe: `GUIA_RAMAS.md`.

---

## Per-Document Findings

### 1. `docs/README.md` — Master Index

| Dimensión | Hallazgo |
|-----------|----------|
| **Freshness** | ✅ Fecha: 2026-07-04 (hoy). Muy reciente. |
| **Correctness** | ⚠️ Lista `openspec/changes/configurable-interest-rate/` como activo, pero el directorio **no existe en disco**. |
| **Placement** | ✅ Correcto — raíz de docs según taxonomía |
| **Completeness** | ⚠️ No lista `auditorias/` en su tabla de contenidos principal (sí lo hace al final). El índice de skills no incluye `doc-conventions`. |
| **Quality** | ✅ Bien estructurado, uso correcto de badges. Enlaces relativos funcionales. |
| **Redundancy** | N/A |

---

### 2. `docs/AGENTS.md` — AI Doc Conventions

| Dimensión | Hallazgo |
|-----------|----------|
| **Freshness** | ✅ Reciente (contenido alineado con la estructura actual) |
| **Correctness** | ✅ Correcto — taxonomía, naming, procesos |
| **Placement** | ✅ Correcto — raíz de docs |
| **Completeness** | ✅ Completo dentro de su alcance |
| **Quality** | ✅ Claro, bien organizado |
| **Redundancy** | ⚠️ Superpone contenido con `politica-documentacion.md` y `doc-conventions/SKILL.md`. Son complementarios pero hay leve duplicación de la tabla de taxonomía. |

---

### 3. `docs/ai-context.md` — AI Context

| Dimensión | Hallazgo |
|-----------|----------|
| **Freshness** | ⚠️ Contenido general actual, pero referencias **totalmente desactualizadas** |
| **Correctness** | ❌ **CRÍTICO** — La sección "Si vas a tocar..." (líneas 93-97) usa 7 rutas antiguas que **no existen**. Todas fueron movidas en la reorganización. |
| **Placement** | ✅ Correcto — raíz de docs |
| **Completeness** | ⚠️ Buena cobertura de stack y estado, aunque el estado de features podría actualizarse. |
| **Quality** | ✅ Bien escrito, buena estructura. |
| **Redundancy** | N/A |

**Referencias rotas identificadas**:
| Línea | Referencia actual | Debería ser |
|-------|-------------------|-------------|
| 93 | `docs/CONTRACT-PORTAL-GATEWAY.md` | `docs/integration/contract-portal-gateway.md` |
| 93 | `docs/INTEGRACION_PAGOS.md` | `docs/integration/integracion-pagos.md` |
| 94 | `docs/bd/LOGICA_DEUDAS_PAGOS.md` | `docs/domain/logica-deudas-pagos.md` |
| 95 | `docs/PLAN_CONFIGURACION_MULTIAMBIENTE.md` | `docs/guides/plan-multiambiente.md` |
| 95 | `docs/GUIA_NUEVO_MUNICIPIO.md` | `docs/guides/nuevo-municipio.md` |
| 96 | `docs/DEPLOY_AZURE.md` | `docs/guides/deploy-azure.md` |
| 97 | `docs/integracion/GUIA_INTEGRACION_MULTIPROYECTO.md` | `docs/integration/guia-multiproyecto.md` |

---

### 4. `docs/GLOSSARY.md` — Domain Glossary

| Dimensión | Hallazgo |
|-----------|----------|
| **Freshness** | ✅ Fecha: 2026-07-02. Reciente. |
| **Correctness** | ❌ Las referencias en "Referencias" (líneas 109-110) apuntan a rutas antiguas que no existen. |
| **Placement** | ✅ Correcto |
| **Completeness** | ✅ Buen glosario, cubre términos clave del dominio |
| **Quality** | ✅ Excelente — bien formateado, tablas claras, definiciones precisas |
| **Redundancy** | ⚠️ Sección de estados de ticket (líneas 63-70) también aparece en `integration/contract-portal-gateway.md`. Mínima duplicación. |

---

### 5. `docs/architecture/adr.md` — Architecture Decision Records

| Dimensión | Hallazgo |
|-----------|----------|
| **Freshness** | ✅ Fecha: 2026-07-02. Reciente. |
| **Correctness** | ❌ **CRÍTICO** — 8 referencias internas a `docs/CONTRACT-PORTAL-GATEWAY.md` que no existe en esa ruta. 1 referencia a `docs/GUIA_NUEVO_MUNICIPIO.md` que no existe. |
| **Placement** | ✅ Correcto |
| **Completeness** | ✅ 7 ADRs cubriendo decisiones clave. |
| **Quality** | ✅ Excelente — formato ADR completo, contexto/decisión/consecuencias/archivos |
| **Redundancy** | N/A |

**Referencias rotas**: ADR-001 (línea 31), ADR-002 (línea 58), ADR-003 (línea 90), ADR-004 (línea 119), ADR-006 (línea 171), ADR-007 (línea 197), Referencias (línea 204) — todas apuntan a `CONTRACT-PORTAL-GATEWAY.md` en raíz de docs. Deberían ser `../integration/contract-portal-gateway.md`.

---

### 6. `docs/architecture/politica-documentacion.md` — Documentation Policy

| Dimensión | Hallazgo |
|-----------|----------|
| **Freshness** | ✅ Fecha: 2026-07-04. Hoy. |
| **Correctness** | ✅ Contenido correcto, actualizado |
| **Placement** | ✅ Correcto |
| **Completeness** | ✅ Completo — define file headers, section markers, ciclo SDD de documentación |
| **Quality** | ✅ Excelente — bien estructurado, ejemplos claros |
| **Redundancy** | ⚠️ La sección de taxonomía difiere ligeramente de AGENTS.md (falta `auditorias/` y `_archive/` en la tabla). Complementan pero no contradicen. |

---

### 7. `docs/architecture/security-pending.md` — Security Hardening

| Dimensión | Hallazgo |
|-----------|----------|
| **Freshness** | ❌ **Sin fecha** en el documento. |
| **Correctness** | ⚠️ Referencia `docs/DEPLOY_AZURE.md` (línea 30) — ruta antigua. Debería ser `../guides/deploy-azure.md`. |
| **Placement** | ✅ Correcto |
| **Completeness** | ⚠️ Checklist breve, pero depende de `openspec/changes/security-hardening/` para el detalle. Aceptable como resumen. |
| **Quality** | ✅ Conciso y útil |
| **Redundancy** | N/A |

---

### 8. `docs/domain/logica-deudas-pagos.md` — Debt & Payment Logic

| Dimensión | Hallazgo |
|-----------|----------|
| **Freshness** | ❌ Fecha declarada: **2025-12-16** (6.5 meses atrás). Contenido puede estar desactualizado. |
| **Correctness** | ⚠️ La sección 11 referencia `services/pagos.service.js` como "**A CREAR**", pero el archivo **existe** — debería revisarse si la descripción sigue siendo precisa. |
| **Placement** | ✅ Correcto |
| **Completeness** | ⚠️ Muy detallada pero parcialmente desactualizada. La referencia a la tasa hardcodeada en `deudas.service.js` (sección 4.1) puede haber cambiado con el cambio `configurable-interest-rate`. |
| **Quality** | ✅ Alta calidad, ejemplos de código útiles |
| **Redundancy** | ⚠️ Se superpone con `formulas-intereses.txt` en el cálculo de intereses, pero desde perspectivas diferentes (una es documentación técnica, la otra es material fuente del contador) |

---

### 9. `docs/domain/formulas-intereses.txt` — Interest Formulas

| Dimensión | Hallazgo |
|-----------|----------|
| **Freshness** | ❌ Sin fecha. Contenido es raw Python del contador, parece una captura directa. |
| **Correctness** | ⚠️ El código Python no está verificado contra la implementación real en `deudas.service.js`. |
| **Placement** | ✅ Correcto |
| **Completeness** | ⚠️ Es material fuente, no documentación procesada. Falta contexto sobre cómo se traduce a la implementación. |
| **Quality** | ❌ **Baja** — código Python crudo sin formato, sin explicación, con nombres de variables en español/inglés mezclados. Útil como referencia del negocio pero no como documentación técnica. |
| **Redundancy** | Se superpone con `logica-deudas-pagos.md` sección 4 |

---

### 10. `docs/guides/deploy-azure.md` — Azure Deployment Guide

| Dimensión | Hallazgo |
|-----------|----------|
| **Freshness** | ❌ Fecha: **2026-03-09** (casi 4 meses). El contenido de Azure CLI y configuración puede haber cambiado. |
| **Correctness** | ✅ Los comandos y configuraciones parecen correctos para el stack actual. |
| **Placement** | ✅ Correcto |
| **Completeness** | ✅ Cubre ciclo completo: creación, configuración, deploy, troubleshooting. |
| **Quality** | ✅ Bien estructurado, ejemplos de CLI, checklist incluida. |
| **Redundancy** | N/A |

---

### 11. `docs/guides/guia-sdd.md` — SDD Workflow Guide

| Dimensión | Hallazgo |
|-----------|----------|
| **Freshness** | ✅ Fecha: 2026-07-04. Hoy. |
| **Correctness** | ✅ Contenido correcto y actualizado. |
| **Placement** | ✅ Correcto |
| **Completeness** | ✅ Completo — cubre las 9 fases, ejemplos de sesión, estructura de openspec/. |
| **Quality** | ✅ Excelente — diagrama de flujo, tabla de comparación con/sin SDD, ejemplos concretos. |
| **Redundancy** | N/A |

---

### 12. `docs/guides/nuevo-municipio.md` — Municipality Onboarding

| Dimensión | Hallazgo |
|-----------|----------|
| **Freshness** | ✅ Fecha: 2026-07-02. Reciente. |
| **Correctness** | ⚠️ Referencia a `GUIA_RAMAS.md` (línea 494) — **documento no existe**. Referencia a `CONTRACT-PORTAL-GATEWAY.md` (línea 491) — ruta antigua. |
| **Placement** | ✅ Correcto |
| **Completeness** | ✅ Muy completo — 10 pasos, checklist, troubleshooting. |
| **Quality** | ✅ Excelente — tablas, ejemplos con placeholders, clara progresión. |
| **Redundancy** | Algo de superposición con `deploy-azure.md` en los pasos de Azure, pero justificable (son documentos complementarios). |

---

### 13. `docs/guides/plan-multiambiente.md` — Multi-env Plan

| Dimensión | Hallazgo |
|-----------|----------|
| **Freshness** | ❌ **Sin fecha**. Contenido parece post-reorganización pero no tiene marca temporal. |
| **Correctness** | ❌ 3 referencias a rutas antiguas: `docs/GUIA_NUEVO_MUNICIPIO.md`, `docs/DEPLOY_AZURE.md`, `docs/AI_CONTEXT.md` (líneas 75-77) |
| **Placement** | ⚠️ ¿Es un `guide/` o debería ser `architecture/`? El contenido describe principios de arquitectura, no procedimientos paso a paso. La nota dice "resumen operativo para consulta rápida". Aceptable en guides/. |
| **Completeness** | ✅ Resumen adecuado de la arquitectura multi-municipio. |
| **Quality** | ✅ Conciso, buena tabla de estado. |
| **Redundancy** | ⚠️ Superposición con `nuevo-municipio.md` y `deploy-azure.md`. Unificado anteriormente (commit `0455e38` menciona "consolidate redundant documentation"). |

---

### 14. `docs/guides/runbook.md` — Operations Runbook

| Dimensión | Hallazgo |
|-----------|----------|
| **Freshness** | ✅ Fecha: 2026-07-02. Reciente. |
| **Correctness** | ❌ Referencia a `DIAGNOSTICO_TICKET_VACIO.md` (línea 144) — **archivado** en `_archive/diagnostico-ticket-vacio.md`. Referencia a `CONTRACT-PORTAL-GATEWAY.md` (línea 257) — ruta antigua. Referencia a `GUIA_RAMAS.md` (línea 259) — **no existe**. |
| **Placement** | ✅ Correcto |
| **Completeness** | ✅ Excelente — procedimientos reales de troubleshooting, comandos útiles, queries SQL. |
| **Quality** | ✅ Muy alta — ejemplos de diagnóstico concretos, tabla de reintentos de webhook. |
| **Redundancy** | N/A |

---

### 15. `docs/integration/checklist-appsettings.md` — App Settings Checklist

| Dimensión | Hallazgo |
|-----------|----------|
| **Freshness** | ❌ **Sin fecha**. Sección 4.1 fechada 2026-04-18 (>2.5 meses). |
| **Correctness** | ❌ Referencia a `docs/bd/AZURE_SQL_TICKETS_PAGO_SETUP.sql` (línea 51) — **archivado** en `_archive/database/`. Referencias a `docs/CONTRACT-PORTAL-GATEWAY.md` (línea 137) y `docs/INTEGRACION_PAGOS.md` (línea 138) — rutas antiguas. |
| **Placement** | ✅ Correcto |
| **Completeness** | ⚠️ Contenido denso mezcla checklist de app settings, brief de orquestador multi-repo, y handoff de desarrollo local. Cobertura amplia pero desordenada. |
| **Quality** | ⚠️ Aceptable pero desordenado — múltiples secciones numeradas, mezcla de contenidos. La sección 4 incluye brief para IA y update de dev local que desordenan el documento. |
| **Redundancy** | ⚠️ La sección 4.1 de handoff local se superpone con `guia-multiproyecto.md` y `contract-portal-gateway.md`. |

---

### 16. `docs/integration/contract-portal-gateway.md` — Portal↔Gateway Contract

| Dimensión | Hallazgo |
|-----------|----------|
| **Freshness** | ⚠️ Fecha: 2026-04-21 (>2.5 meses). Contenido principal data de 2026-03-31. |
| **Correctness** | ✅ Contenido correcto — describe fielmente los 3 flujos (A, B, C), secretos compartidos, payloads. |
| **Placement** | ✅ Correcto |
| **Completeness** | ✅ Alto nivel de detalle — flujos completos, payloads, respuestas, estrategias de reintento, responsabilidades. |
| **Quality** | ✅ Excelente — uno de los documentos mejor escritos del proyecto. |
| **Redundancy** | ⚠️ Se superpone parcialmente con `integracion-pagos.md` (resumen) y `checklist-appsettings.md` (brief de orquestador). |

---

### 17. `docs/integration/guia-multiproyecto.md` — Multi-project Guide

| Dimensión | Hallazgo |
|-----------|----------|
| **Freshness** | ❌ Fecha: **2026-03-19** (>3.5 meses). Contenido tutorial actualizado solo parcialmente. |
| **Correctness** | ❌ Referencia a `docs/GUIA_RAMAS.md` (líneas 265, 290) — **no existe**. Referencia a `GUIA_RAMAS.md` (línea 397) local. Referencia a `INTEGRACION_PAGOS.md` (línea 398) — nombre incorrecto, debería ser `integracion-pagos.md`. |
| **Placement** | ✅ Correcto |
| **Completeness** | ⚠️ Tutorial para juniors — cubre conceptos fundamentales pero el contenido de git y contratos pudo haber cambiado. El ejemplo de contrato (líneas 226-259) no coincide con el contrato real actual. |
| **Quality** | ✅ Buen tutorial para principiantes, diagrama ASCII, FAQs. |
| **Redundancy** | ⚠️ La sección de contratos de API se superpone con `contract-portal-gateway.md`. El glosario (líneas 42-49) duplica contenido de `GLOSSARY.md`. |

---

### 18. `docs/integration/integracion-pagos.md` — Payment Integration

| Dimensión | Hallazgo |
|-----------|----------|
| **Freshness** | ❌ **Sin fecha**. Contenido parece de la era de la reorganización. |
| **Correctness** | ❌ Referencia a `docs/CONTRACT-PORTAL-GATEWAY.md` (línea 111) — ruta antigua. Referencia a `docs/bd/LOGICA_DEUDAS_PAGOS.md` (línea 112) — ruta antigua. Referencia a `docs/integracion/GUIA_INTEGRACION_MULTIPROYECTO.md` (línea 113) — `integracion` en vez de `integration`. |
| **Placement** | ✅ Correcto |
| **Completeness** | ⚠️ Es un resumen del contrato completo. Útil como vista rápida pero remite al contrato para detalle. |
| **Quality** | ✅ Conciso, buena progresión del flujo. |
| **Redundancy** | ⚠️ Este documento es esencialmente un resumen de `contract-portal-gateway.md`. Podría eliminarse o convertirse en una sección de ese documento. |

---

## Cross-Reference Validation Results

### Referencias rotas más críticas

| Referencia | Documentos que la usan (cant.) | Estado |
|------------|-------------------------------|--------|
| `docs/CONTRACT-PORTAL-GATEWAY.md` (ruta antigua en raíz) | adr.md (8x), ai-context.md, checklist-appsettings.md, integracion-pagos.md, GLOSSARY.md, nuevo-municipio.md, runbook.md, security-pending.md (**14 referencias en total**) | ❌ Debe ser `docs/integration/contract-portal-gateway.md` |
| `docs/bd/LOGICA_DEUDAS_PAGOS.md` (ruta antigua) | ai-context.md, GLOSSARY.md, integracion-pagos.md (3x) | ❌ Debe ser `docs/domain/logica-deudas-pagos.md` |
| `docs/DEPLOY_AZURE.md` (ruta antigua en raíz) | ai-context.md, nuevo-municipio.md, plan-multiambiente.md, runbook.md, security-pending.md (5x) | ❌ Debe ser `docs/guides/deploy-azure.md` |
| `docs/GUIA_NUEVO_MUNICIPIO.md` (ruta antigua) | adr.md, ai-context.md, plan-multiambiente.md (3x) | ❌ Debe ser `docs/guides/nuevo-municipio.md` |
| `docs/INTEGRACION_PAGOS.md` (ruta antigua) | ai-context.md, checklist-appsettings.md (2x) | ❌ Debe ser `docs/integration/integracion-pagos.md` |
| `docs/AI_CONTEXT.md` (ruta antigua) | plan-multiambiente.md (1x) | ❌ Debe ser `docs/ai-context.md` |
| `docs/integracion/` vs `docs/integration/` | en integracion-pagos.md, checklist-appsettings.md (2x) | ❌ `integracion` con ñ no existe |
| `GUIA_RAMAS.md` | guia-multiproyecto.md (3x), nuevo-municipio.md (1x), runbook.md (1x) — **5 referencias** | ❌ **Documento no existe en ningún lado del repo** |

### Referencias correctas verificadas

| Referencia | Documentos que la usan | Estado |
|------------|-----------------------|--------|
| `config/MUNICIPIO_CONFIG.md` | README.md, nuevo-municipio.md | ✅ Existe |
| `.github/workflows/INSTRUCTIVO_DEPLOY.md` | README.md | ✅ Existe |
| `skills/doc-conventions/SKILL.md` | politica-documentacion.md | ✅ Existe |
| `skills/_shared/file-header-manifest.md` | politica-documentacion.md, guia-sdd.md | ⚠️ No verificado (fuera de alcance) |
| `openspec/specs/` (6 specs) | README.md | ✅ Las 6 existen |
| `openspec/changes/ticket-payment-tracking/` (y subarchivos) | AGENTS.md | ✅ Existe |

### Documentos archivados pero referenciados como activos

| Referencia | Dónde se referencia | Paraderoreal |
|------------|---------------------|--------------|
| `DIAGNOSTICO_TICKET_VACIO.md` | runbook.md (línea 144) | `_archive/diagnostico-ticket-vacio.md` |
| `AZURE_SQL_TICKETS_PAGO_SETUP.sql` | checklist-appsettings.md (línea 51) | `_archive/database/AZURE_SQL_TICKETS_PAGO_SETUP.sql` |

---

## Missing Documentation Gaps

| Gap | Impacto | Documentos que lo referencian |
|-----|---------|-------------------------------|
| **`GUIA_RAMAS.md`** — Guía de estrategia de ramas | Alto — 3 documentos la referencian como fuente de verdad | guia-multiproyecto.md, nuevo-municipio.md, runbook.md |
| **Documentación de tests** — Solo existe `npm run testDB` | Medio — no hay documentación de cómo testear el proyecto | — |
| **Documentación de API interna** — Endpoints del portal (no la API del gateway) | Medio — no hay OpenAPI/Swagger ni documento de endpoints | — |
| **Documentación de frontend** — Patrones EJS, JS vanilla, estructura de vistas | Bajo — el código se explica solo, pero no hay guía de estilos | — |
| **Modelo de datos completo** — Tablas Sequelize, relaciones | Medio — solo `ClientesCtaCte` documentado en detalle | — |
| **openspec/changes/configurable-interest-rate/** — Referenciado en README como activo | Medio — el directorio no existe | README.md, ai-context.md |

---

## Redundancy / Merge Candidates

| Documentos | Tipo de superposición | Recomendación |
|------------|----------------------|---------------|
| `integration/contract-portal-gateway.md` ↔ `integration/integracion-pagos.md` | Resumen vs detalle — `integracion-pagos.md` es un subconjunto del contrato | **Fusionar**: mover contenido único de `integracion-pagos.md` a `contract-portal-gateway.md` como sección de resumen, archivar `integracion-pagos.md` |
| `docs/AGENTS.md` ↔ `docs/architecture/politica-documentacion.md` ↔ `skills/doc-conventions/SKILL.md` | Los 3 documentan taxonomía y procesos similares | **Aceptar**: son audiencias diferentes (agentes IA, política formal, skill ejecutable). Mantener sincronizadas las tablas de taxonomía. |
| `guides/nuevo-municipio.md` ↔ `guides/deploy-azure.md` | Pasos de Azure App Service duplicados | **Aceptar**: cada documento necesita ser autocontenido. La superposición es funcional. |
| `domain/logica-deudas-pagos.md` ↔ `domain/formulas-intereses.txt` | Cálculo de intereses duplicado | **Procesar**: convertir `formulas-intereses.txt` en material fuente referenciado, no duplicado |

---

## Alignment Check: Policy Documents

### AGENTS.md vs politica-documentacion.md

| Aspecto | AGENTS.md | politica-documentacion.md | ¿Alineados? |
|---------|-----------|--------------------------|-------------|
| Taxonomía de carpetas | Lista las 6 carpetas (`architecture/`, `domain/`, `guides/`, `integration/`, `auditorias/`, `_archive/`) | Lista solo 4 (`architecture/`, `domain/`, `guides/`, `integration/`) + `_archive/` aparte | ❌ Leve diferencia — política omite `auditorias/` en su tabla principal |
| Nombres de archivos | `kebab-case` minúsculas | `kebab-case` minúsculas | ✅ |
| Archivos raíz permitidos | README.md, GLOSSARY.md, AGENTS.md, ai-context.md | No lo especifica explícitamente | ⚠️ AGENTS.md más específico |

### politica-documentacion.md vs doc-conventions skill

| Aspecto | politica-documentacion.md | doc-conventions/SKILL.md | ¿Alineados? |
|---------|--------------------------|--------------------------|-------------|
| File headers | Sí, detalla formato | No menciona | ✅ La política es más específica |
| Section markers | Sí, detalla formato | No menciona | ✅ |
| Taxonomía | Misma estructura | Misma estructura | ✅ |
| Proceso de archivado | No lo detalla | Sí, lo detalla | ⚠️ La skill tiene más detalle de proceso |

### doc-conventions skill no disponible via skill tool

Aunque `skills/doc-conventions/SKILL.md` existe en disco, el sistema reportó que no está disponible como skill cargable. Esto sugiere que el registro de skills no está actualizado. Referenciado por `politica-documentacion.md` (línea 118) como skill que "aplica las convenciones de documentación".

---

## Readme.md Health Check

| Elemento | Estado |
|----------|--------|
| Fecha de actualización | ✅ 2026-07-04 |
| Lista docs activos | ✅ Completa — 16 documentos listados |
| Badges de frescura | ✅ Usa correctamente ✅ Fresco / ✅ Nuevo |
| Skills listados | ⚠️ No incluye `doc-conventions` |
| OpenSpec specs | ✅ 6 specs listadas, todas existen |
| OpenSpec changes | ⚠️ `configurable-interest-rate/` listado como activo pero no existe |
| Archived section | ✅ Completo |
| Orden de lectura | ✅ 3 perfiles cubiertos |
| Leyenda de estados | ✅ Clara |

---

## Prioritized Recommendations

### 🔴 Inmediatas (bloquean navegación correcta)

1. **Actualizar `ai-context.md`** — 7 referencias rotas en la sección "Si vas a tocar...". Es el documento de entrada para IA y desarrolladores nuevos. Prioridad máxima.

2. **Actualizar `architecture/adr.md`** — 9 referencias a rutas antiguas de `CONTRACT-PORTAL-GATEWAY.md` y `GUIA_NUEVO_MUNICIPIO.md` que no existen.

3. **Crear `docs/guides/guia-ramas.md` (o `GUIA_RAMAS.md`)** — 3 documentos lo referencian como fuente de verdad para la estrategia de ramas. Sin él, esas referencias son enlaces muertos.

### 🟡 Alta (documentación incorrecta o incompleta)

4. **Corregir referencias en todos los documentos** — Ejecutar un barrido global de `docs/CONTRACT-PORTAL-GATEWAY.md` → `integration/contract-portal-gateway.md`, `docs/DEPLOY_AZURE.md` → `guides/deploy-azure.md`, etc. Aprox 25+ referencias rotas.

5. **Actualizar `docs/domain/logica-deudas-pagos.md`** — Fecha 2025-12-16; referencia a "A CREAR" para `services/pagos.service.js` que ya existe; posiblemente desactualizado en varias secciones.

6. **Resolver `openspec/changes/configurable-interest-rate/`** — O crearlo o quitarlo del README.md si el change fue abandonado.

### 🟢 Media (mejora de calidad)

7. **Actualizar `docs/guides/deploy-azure.md`** — Fecha 2026-03-09, verificar comandos de Azure CLI y configuraciones.

8. **Actualizar `docs/integration/guia-multiproyecto.md`** — Tutorial para juniors con contenido desactualizado (ejemplo de contrato no coincide con el real).

9. **Fusionar `docs/integration/integracion-pagos.md` → `contract-portal-gateway.md`** — Archivar el resumen y que el contrato completo incluya un executive summary.

10. **Procesar `docs/domain/formulas-intereses.txt`** — Agregar contexto de cómo se traduce a la implementación, o archivarlo como material fuente.

### 🔵 Baja (housekeeping)

11. **Agregar `doc-conventions` al listado de skills en README.md**

12. **Sincronizar tabla de taxonomía entre AGENTS.md y politica-documentacion.md** — La política omite `auditorias/` en su tabla.

13. **Eliminar directorios vacíos en `_archive/`** — `_archive/guides/`, `_archive/integration/`, `_archive/domain/`, `_archive/architecture/` están vacíos. O poblarlos o eliminarlos.

14. **Agregar fecha de última actualización a documentos que no la tienen**: `security-pending.md`, `plan-multiambiente.md`, `checklist-appsettings.md`, `integracion-pagos.md`, `formulas-intereses.txt`.

---

## Ready for Proposal

**Sí** — La exploración es completa y cubre todos los aspectos solicitados. El siguiente paso recomendado es `sdd-propose` con un cambio que aborde:

1. **Fase 1** (corrección masiva de referencias rotas): actualizar `ai-context.md`, `adr.md`, y barrido global de rutas antiguas
2. **Fase 2** (documentos faltantes): crear `guia-ramas.md`
3. **Fase 3** (mejoras de calidad): actualizaciones de frescura, fusiones, procesamiento de material fuente
