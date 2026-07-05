# Proposal: Documentation Audit Review

> **Fecha**: 2026-07-04
> **Modo**: hybrid (openspec + engram)
> **Change**: `docs-audit-review`
> **Alcance**: Documentación activa en `/docs/` — sin cambios de código ni OpenSpec changes nuevos.

---

## Resumen Ejecutivo

La auditoría de `/docs/` detectó **~25 referencias cruzadas rotas en 8 documentos** tras la reorganización de carpetas (commit `723fc7b`), **1 documento faltante** referenciado por 3 fuentes (`GUIA_RAMAS.md`), **5 documentos sin fecha**, **2 documentos archivados referenciados como activos**, **1 change OpenSpec fantasma** en el README, y **redundancias/materiales fuente sin procesar**. La propuesta aplica un **reparación por fases**: corrección masiva de enlaces → creación de documento faltante → actualización de frescura y calidad.

## Motivación

- `ai-context.md` — entrada principal para IA y devs nuevos — tiene **7 enlaces rotos** en la sección "Si vas a tocar...". Cualquier agente que siga esas rutas falla.
- `adr.md` — referencia canónica de decisiones arquitectónicas — tiene **8 enlaces rotos** a `CONTRACT-PORTAL-GATEWAY.md`.
- 3 documentos apuntan a `GUIA_RAMAS.md` que **no existe** — la estrategia de ramas no tiene fuente de verdad documentada.
- 5 docs sin `Última actualización` violan la política de documentación y dificultan detectar staleness.
- `configurable-interest-rate/` listado como change activo en README **no existe en disco** — confunde la planificación.

## Scope

### En Scope (16 documentos activos bajo `/docs/`)

| Documento |Acción principal |
|-----------|-----------------|
| `docs/README.md` | Quitar change fantasma, agregar `doc-conventions` a skills |
| `docs/AGENTS.md` | Sincronizar tabla de taxonomía con política |
| `docs/ai-context.md` | **🔴 CRÍTICO** — corregir 7 referencias rotas |
| `docs/GLOSSARY.md` | Corregir referencias en sección "Referencias" |
| `docs/architecture/adr.md` | **🔴 CRÍTICO** — corregir 9 referencias rotas |
| `docs/architecture/politica-documentacion.md` | Agregar `auditorias/` a tabla de taxonomía |
| `docs/architecture/security-pending.md` | Agregar fecha, corregir referencia a deploy |
| `docs/domain/logica-deudas-pagos.md` | Actualizar fecha, quitar "A CREAR", revisar interés configurable |
| `docs/domain/formulas-intereses.txt` | Procesar como material fuente referenciado o archivar |
| `docs/guides/deploy-azure.md` | Verificar comandos Azure CLI, actualizar fecha |
| `docs/guides/guia-ramas.md` | **🆕 NUEVO** — crear estrategia de ramas (`develop`→`main`) |
| `docs/guides/nuevo-municipio.md` | Corregir 2 referencias rotas |
| `docs/guides/plan-multiambiente.md` | Agregar fecha, corregir 3 referencias |
| `docs/guides/runbook.md` | Corregir 3 referencias (2 archivadas/rotas + 1 fantasma) |
| `docs/integration/checklist-appsettings.md` | Agregar fecha, corregir 3 referencias |
| `docs/integration/contract-portal-gateway.md` | Absorber resumen de `integracion-pagos.md`, agregar executive summary |
| `docs/integration/guia-multiproyecto.md` | Corregir 4 referencias, alinear ejemplo de contrato |
| `docs/integration/integracion-pagos.md` | Fusionar en `contract-portal-gateway.md` y archivar |

### Out of Scope

- `docs/auditorias/` — estructura formal con fecha, fuera de alcance.
- `docs/_archive/` — obsoleto, no se repara. Solo se eliminan subcarpetas vacías si aplica.
- **Cambios de código** — este change es estrictamente documentación.
- **Nuevos OpenSpec changes** — no se proponen cambios de features.
- **Cambios de arquitectura** — no se alteran decisiones técnicas.
- **Documentación de tests/frontend/API interna** — gaps detectados pero diferidos a changes propios.

## Capabilities

### New Capabilities
- Ninguna — este change no introduce capabilities de producto.

### Modified Capabilities
- Ninguna — el cambio es puramente documental. No altera comportamiento spec-level del sistema.

> Nota: Al no tocar specs, no se requieren delta specs. La "capability" afectada es transversal: **gobernanza de documentación**.

## Approach — Plan por Fases

### 🔴 Fase 1: Corrección masiva de referencias rotas (CRÍTICO)

**Objetivo**: Eliminar los ~25 enlaces rotos en 8 documentos. Sin esto, la navegación documental está rota.

| Acción | Archivos |
|--------|----------|
| Reemplazo global `docs/CONTRACT-PORTAL-GATEWAY.md` → `docs/integration/contract-portal-gateway.md` (relativizado por carpeta) | `adr.md` (8x), `ai-context.md`, `checklist-appsettings.md`, `integracion-pagos.md`, `GLOSSARY.md`, `nuevo-municipio.md`, `runbook.md`, `security-pending.md` |
| Reemplazo `docs/bd/LOGICA_DEUDAS_PAGOS.md` → `docs/domain/logica-deudas-pagos.md` | `ai-context.md`, `GLOSSARY.md`, `integracion-pagos.md` |
| Reemplazo `docs/DEPLOY_AZURE.md` → `docs/guides/deploy-azure.md` | `ai-context.md`, `nuevo-municipio.md`, `plan-multiambiente.md`, `security-pending.md` |
| Reemplazo `docs/GUIA_NUEVO_MUNICIPIO.md` → `docs/guides/nuevo-municipio.md` | `adr.md`, `ai-context.md`, `plan-multiambiente.md` |
| Reemplazo `docs/INTEGRACION_PAGOS.md` → `docs/integration/integracion-pagos.md` | `ai-context.md`, `checklist-appsettings.md` |
| Reemplazo `docs/PLAN_CONFIGURACION_MULTIAMBIENTE.md` → `docs/guides/plan-multiambiente.md` | `ai-context.md` |
| Reemplazo `docs/AI_CONTEXT.md` → `docs/ai-context.md` | `plan-multiambiente.md` |
| Corregir `docs/integracion/` → `docs/integration/` (tilde) | `integracion-pagos.md`, `checklist-appsettings.md` |
| Actualizar referencias a archivados: `DIAGNOSTICO_TICKET_VACIO.md` → `_archive/diagnostico-ticket-vacio.md`, `AZURE_SQL_TICKETS_PAGO_SETUP.sql` → `_archive/database/...` | `runbook.md`, `checklist-appsettings.md` |
| Quitar `openspec/changes/configurable-interest-rate/` del README (no existe) | `README.md` |

**Validación**: `grep -rE "docs/(CONTRACT-PORTAL-GATEWAY|DEPLOY_AZURE|GUIA_NUEVO_MUNICIPIO|INTEGRACION_PAGOS|bd/|integracion/)" docs/` debe devolver 0 resultados.

### 🟡 Fase 2: Documento faltante — `guia-ramas.md`

**Objetivo**: Crear `docs/guides/guia-ramas.md` como fuente de verdad de la estrategia de ramas (`develop` ↔ `main`, reglas de promoción, `MUNICIPIO` por entorno, `.env` no se versiona).

- Aplicar plantilla de `cognitive-doc-design`: Quick path → Details → Checklist → Next step.
- Agregar entrada en `docs/README.md` con badge ✅ Nuevo.
- Cumplir `doc-conventions`: kebab-case, carpeta `guides/`, último-updated.

### 🟢 Fase 3: Frescura, fusiones y calidad

**3.1 Fechas faltantes** — agregar `Última actualización` a: `security-pending.md`, `plan-multiambiente.md`, `checklist-appsettings.md`, `integracion-pagos.md`, `formulas-intereses.txt`.

**3.2 Actualizaciones de staleness**:
- `logica-deudas-pagos.md`: quitar marca "A CREAR" de `services/pagos.service.js` (ya existe); revisar sección 4.1 sobre interés configurable.
- `deploy-azure.md` (2026-03-09): validar comandos Azure CLI.
- `guia-multiproyecto.md`: corregir ejemplo de contrato (líneas 226-259) para que coincida con el real.

**3.3 Fusión de redundancias**:
- `integracion-pagos.md` →迁移 contenido único a `contract-portal-gateway.md` como "Executive Summary"; archivar `integracion-pagos.md` en `_archive/integration/`. Actualizar `README.md`.
- `formulas-intereses.txt`: convertir en material fuente referenciado desde `logica-deudas-pagos.md` (no duplicado) o archivar.

**3.4 Housekeeping**:
- Agregar `doc-conventions` a la lista de skills en `README.md`.
- Sincronizar tabla de taxonomía entre `AGENTS.md` y `politica-documentacion.md` (política omite `auditorias/`).
- Eliminar subcarpetas vacías en `_archive/` (`guides/`, `integration/`, `domain/`, `architecture/`) si siguen vacías.

## Impact

| Dimensión | Valor |
|-----------|-------|
| **Archivos afectados** | 16 documentos activos + 1 nuevo (`guia-ramas.md`) + 1 archivado (`integracion-pagos.md`) |
| **Riesgo** | **Bajo** — solo documentación. No toca runtime ni BD. |
| **Esfuerzo estimado** | Medio. Fase 1 mecánica (find/replace verificado), Fases 2-3 requieren juicio editorial. |
| **Branch** | `develop` (regla del repo: `main` solo recibe merges aprobados) |
| **Rama de trabajo sugerida** | `feature/docs-audit-review` |

## Risks & Mitigations

| Riesgo | Likelihood | Mitigación |
|--------|-----------|------------|
| Reemplazo global rompe rutas relativas por carpeta fuente | Media | Calcular ruta relativa por archivo (no un string global). Validar con `grep` post-reemplazo. |
| Fusión `integracion-pagos.md` pierde contexto específico | Baja | Mover contenido único a sección "Executive Summary" del contrato antes de archivar. |
| `guia-ramas.md` documenta estrategia desactualizada | Media | Tomar como fuente `docs/guides/guia-ramas.md` referenciada en AGENTS.md + commits recientes. Validar con mantenedor. |
| `logica-deudas-pagos.md` requiere revisión de codigo actual | Media | No reescribir contenido técnico sin verificar contra `deudas.service.js`. Solo fact-check referencias. |
| Cambios masivos dificultan review | Alta | Aplicar por fases en commits separados (work-unit commits). Una PR por fase si supera 400 líneas. |

## Rollback Plan

- **Fase 1**: `git revert` del commit de reemplazos. Los enlaces rotos vuelven a su estado previo (roto pero conocido).
- **Fase 2**: Eliminar `docs/guides/guia-ramas.md` y su entrada en `README.md`. Las referencias quedan rotas de nuevo (estado previo).
- **Fase 3**: `git revert` por sub-fase (fechas, fusiones, housekeeping son commits separados). Si `integracion-pagos.md` ya archivado, restaurar desde `_archive/integration/`.
- **Total**: `git revert <merge-commit>` revierte todo el change. Documentación es el único surface afectado — no hay migraciones ni estado persistente.

## Dependencies

- Skill `doc-conventions` cargada (ya leída).
- Skill `cognitive-doc-design` cargada (ya leída).
- Acceso a `deudas.service.js` para fact-check de `logica-deudas-pagos.md` (Fase 3.2).
- Confirmación del mantenedor sobre estrategia de ramas actual antes de escribir `guia-ramas.md`.

## Success Criteria

- [ ] `grep -rE "docs/(CONTRACT-PORTAL-GATEWAY|DEPLOY_AZURE|GUIA_NUEVO_MUNICIPIO|INTEGRACION_PAGOS|bd/|integracion/)" docs/` devuelve 0 resultados.
- [ ] `grep -rn "GUIA_RAMAS.md" docs/` devuelve solo referencias a `docs/guides/guia-ramas.md` (documento creado).
- [ ] `docs/guides/guia-ramas.md` existe y aparece en `docs/README.md` con badge ✅ Nuevo.
- [ ] Ningún documento activo referencia `configurable-interest-rate/` como change existente (o se crea o se quita del README).
- [ ] Los 5 documentos sin fecha ahora tienen `Última actualización`.
- [ ] `integracion-pagos.md` está en `_archive/integration/` (archivado), su contenido único vive en `contract-portal-gateway.md`.
- [ ] `README.md` lista `doc-conventions` en skills.
- [ ] Tabla de taxonomía de `politica-documentacion.md` incluye `auditorias/`.
- [ ] No quedan subcarpetas vacías bajo `_archive/` (o se poblaron o se eliminaron).
- [ ] Todos los docs under `/docs/` (excluyendo `_archive/` y `auditorias/`) tienen enlaces internos validados.

---

## Output Envelope

```yaml
status: ready
executive_summary: >
  Auditoría de /docs/ detectó ~25 referencias rotas en 8 docs tras reorganización
  (commit 723fc7b), 1 doc faltante (GUIA_RAMAS.md) referenciado 5 veces, 5 docs
  sin fecha, 1 change OpenSpec fantasma en README, y redundancias. Propuesta:
  3 fases — corrección masiva de enlaces, creación de guia-ramas.md, frescura y
  fusiones. Riesgo bajo (solo docs), esfuerzo medio.
artifacts:
  - path: openspec/changes/docs-audit-review/explore.md
    kind: exploration
    role: input — auditoría completa per-document
  - path: openspec/changes/docs-audit-review/proposal.md
    kind: proposal
    role: this document
  - engram_topic: sdd/docs-audit-review/proposal
    project: demo-portal-de-pago
next_recommended: sdd-spec
risks:
  - id: R1
    risk: "Reemplazo global rompe rutas relativas por carpeta fuente"
    likelihood: medium
    mitigation: "Calcular ruta relativa por archivo; validar con grep post-reemplazo"
  - id: R2
    risk: "Cambios masivos dificultan review"
    likelihood: high
    mitigation: "Commits por fase (work-unit commits); PR por fase si >400 líneas"
  - id: R3
    risk: "guia-ramas.md documenta estrategia desactualizada"
    likelihood: medium
    mitigation: "Validar con mantenedor antes de escribir"
skill_resolution:
  - skill: doc-conventions
    path: C:\workspace\Alcaldia-WorkSpace\demo-portal-de-pago\skills\doc-conventions\SKILL.md
    status: loaded
    applied: "Taxonomía de carpetas, kebab-case, proceso de creación/archivado, README como índice maestro"
  - skill: cognitive-doc-design
    path: C:\Users\Vivay\.config\opencode\skills\cognitive-doc-design\SKILL.md
    status: loaded
    applied: "Estructura Quick path → Details → Checklist → Next step para guia-ramas.md"
```