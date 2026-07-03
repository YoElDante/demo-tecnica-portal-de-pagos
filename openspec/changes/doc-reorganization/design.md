# Design: Reorganización de `docs/`

## Resumen Ejecutivo

Se migran 14 archivos sueltos + `LOGICA_DEUDAS_PAGOS.md` + CSVs de prueba a 7 subcarpetas temáticas. Se crea rama `develop` desde `main`, se corrigen 11 enlaces rotos, se eliminan referencias a `INSTRUCTIVO_DEPLOY.md`, y se archiva `docs-audit-reorg`. Todos los movimientos usan `git mv`. Validación final con `grep` — cero enlaces rotos.

---

## Architecture Decisions

| Decisión | Opciones | Elegida | Por qué |
|----------|----------|---------|---------|
| D1: Estructura de carpetas | A: subcarpetas temáticas / B: prefijos en root | **A** | 14 archivos sueltos en root son inmantenibles; el costo de actualizar enlaces se paga una vez |
| D2: Rama `develop` | A: crear develop / B: solo actualizar docs | **A+B** | Crear `develop` (intención del proyecto) y corregir docs para que comandos funcionen; alineado con spec `documentation` |
| D3: Ubicación de `LOGICA_DEUDAS_PAGOS.md` | A: `bd/` / B: dejar en `formulas_calculo_de_deuda/` / C: `database/` | **C** | `database/` es más claro que `bd/`; nombre en inglés consistente con `architecture/`, `operations/`, etc. |
| D4: CSVs de prueba | A: mantener con README / B: mover fuera de `docs/` | **B** | Son fixtures, no documentación; van a `test-data/comparacion/` |
| D5: `integracion/` → `integration/` | A: renombrar / B: mantener nombre español | **A** | Consistencia con resto de nuevas carpetas (todas en inglés: onboarding, architecture, operations, security, database, snapshots, integration) |

---

## File Migration Plan

### Crear rama `develop`
```
git checkout main
git checkout -b develop
git push -u origin develop
```

### Mover archivos sueltos (todos con `git mv`)

| Fuente | Destino |
|--------|---------|
| `docs/AI_CONTEXT.md` | `docs/onboarding/AI_CONTEXT.md` |
| `docs/GLOSSARY.md` | `docs/onboarding/GLOSSARY.md` |
| `docs/ADR.md` | `docs/architecture/ADR.md` |
| `docs/CONTRACT-PORTAL-GATEWAY.md` | `docs/architecture/CONTRACT-PORTAL-GATEWAY.md` |
| `docs/GUIA_RAMAS.md` | `docs/architecture/GUIA_RAMAS.md` |
| `docs/DEPLOY_AZURE.md` | `docs/operations/DEPLOY_AZURE.md` |
| `docs/GUIA_NUEVO_MUNICIPIO.md` | `docs/operations/GUIA_NUEVO_MUNICIPIO.md` |
| `docs/PLAN_CONFIGURACION_MULTIAMBIENTE.md` | `docs/operations/PLAN_CONFIGURACION_MULTIAMBIENTE.md` |
| `docs/DIAGNOSTICO_TICKET_VACIO.md` | `docs/operations/DIAGNOSTICO_TICKET_VACIO.md` |
| `docs/PENDIENTE_SEGURIDAD.md` | `docs/security/PENDIENTE_SEGURIDAD.md` |
| `docs/INTEGRACION_PAGOS.md` | `docs/integration/INTEGRACION_PAGOS.md` |
| `docs/informe-estado-20260630-0426.md` | `docs/snapshots/informe-estado-20260630-0426.md` |
| `docs/informe-estado-ai-20260630-0426.md` | `docs/snapshots/informe-estado-ai-20260630-0426.md` |

### Mover `LOGICA_DEUDAS_PAGOS.md`
```
docs/formulas_calculo_de_deuda/LOGICA_DEUDAS_PAGOS.md → docs/database/LOGICA_DEUDAS_PAGOS.md
```

### Migrar `integracion/` → `integration/`
```
docs/integracion/CHECKLIST_APPSETTINGS_Y_ORQUESTADOR_TICKETS.md → docs/integration/CHECKLIST_APPSETTINGS_Y_ORQUESTADOR_TICKETS.md
docs/integracion/GUIA_INTEGRACION_MULTIPROYECTO.md → docs/integration/GUIA_INTEGRACION_MULTIPROYECTO.md
```
Eliminar carpeta `docs/integracion/` vacía.

### Migrar `GUIDES/` → `operations/GUIDES/`
```
docs/GUIDES/RUNBOOK.md → docs/operations/GUIDES/RUNBOOK.md
```
Eliminar carpeta `docs/GUIDES/` vacía.

### Migrar scripts SQL de `bd/` → `database/scripts/`
```
docs/bd/AZURE_SQL_TICKETS_PAGO_SETUP.sql → docs/database/scripts/AZURE_SQL_TICKETS_PAGO_SETUP.sql
docs/bd/script_creacion_bd_ElManzano_062026.sql → docs/database/scripts/script_creacion_bd_ElManzano_062026.sql
docs/bd/script_creacion_bd_092025_deprecado.sql → docs/database/scripts/script_creacion_bd_092025_deprecado.sql
```
Eliminar carpeta `docs/bd/` vacía.

### Mover CSVs de prueba fuera de `docs/`
```
docs/pruebas_documentos_a_comparar/ → test-data/comparacion/
```
(`git mv` de la carpeta completa; eliminar `docs/pruebas_documentos_a_comparar/`)

### Archivos que NO se mueven
- `docs/README.md` — índice maestro (reescrito in-place)
- `docs/_archive/` — estructura preservada
- `docs/formulas_calculo_de_deuda/` — conserva `grid_form.py`, `formulas_alcaldia_072026.txt` y README

---

## Link Update Plan

### 11 referencias a `docs/bd/LOGICA_DEUDAS_PAGOS.md` → `docs/database/LOGICA_DEUDAS_PAGOS.md`

| Archivo | Línea(s) |
|---------|----------|
| `AGENTS.md` | L155 |
| `docs/AI_CONTEXT.md` | L94 |
| `docs/INTEGRACION_PAGOS.md` | L112 |
| `docs/README.md` | L29 |
| `openspec/specs/ticket-lifecycle/spec.md` | L44 |
| `openspec/specs/interest-calculation/spec.md` | L204 |
| `openspec/changes/ticket-payment-tracking/proposal.md` | L51 |
| `openspec/changes/archive/2026-07-03-fix-debt-calculation-discrepancy/tasks.md` | L80, L82 |
| `openspec/changes/archive/2026-07-03-fix-debt-calculation-discrepancy/proposal.md` | L44 |
| `openspec/changes/archive/2026-07-03-fix-debt-calculation-discrepancy/archive.md` | L27 |
| `skills/deuda-interest-calculation/SKILL.md` | L33 |

### Referencias a `INSTRUCTIVO_DEPLOY.md` — eliminar o corregir
| Archivo | Acción |
|---------|--------|
| `docs/README.md` L64 | Eliminar fila de la tabla |
| `docs/GUIA_RAMAS.md` L454 | Eliminar enlace |
| `docs/DEPLOY_AZURE.md` L135 | Eliminar mención a `.github/workflows/` |

### Referencias a `integracion/` → `integration/`
| Archivo | Cambio |
|---------|--------|
| `AGENTS.md` L43 | `docs/integracion/` → `docs/integration/` |
| `docs/AI_CONTEXT.md` L97 | `docs/integracion/` → `docs/integration/` |

### Eliminar `configurable-interest-rate` como cambio activo
- `docs/README.md` L107 — eliminar fila
- `docs/AI_CONTEXT.md` L102 — eliminar referencia

### `AGENTS.md` — actualizar mapa de documentación
Actualizar todas las rutas del mapa (L148-162) a nueva estructura:
- `docs/AI_CONTEXT.md` → `docs/onboarding/AI_CONTEXT.md`
- `docs/GLOSSARY.md` → `docs/onboarding/GLOSSARY.md`
- `docs/CONTRACT-PORTAL-GATEWAY.md` → `docs/architecture/CONTRACT-PORTAL-GATEWAY.md`
- `docs/bd/LOGICA_DEUDAS_PAGOS.md` → `docs/database/LOGICA_DEUDAS_PAGOS.md`
- `docs/GUIA_NUEVO_MUNICIPIO.md` → `docs/operations/GUIA_NUEVO_MUNICIPIO.md`
- `docs/DEPLOY_AZURE.md` → `docs/operations/DEPLOY_AZURE.md`
- `docs/GUIDES/RUNBOOK.md` → `docs/operations/GUIDES/RUNBOOK.md`
- `docs/ADR.md` → `docs/architecture/ADR.md`
- `docs/GUIA_RAMAS.md` → `docs/architecture/GUIA_RAMAS.md`
- `docs/PENDIENTE_SEGURIDAD.md` → `docs/security/PENDIENTE_SEGURIDAD.md`

---

## README Templates

Cada subcarpeta nueva recibe un `README.md` con estructura mínima:

```markdown
# <Nombre de carpeta>

<Una frase: qué contiene esta carpeta y para quién es útil.>

| Documento | Descripción |
|-----------|-------------|
| `archivo.md` | Qué cubre |
```

**Carpetas que reciben README nuevo**: `onboarding/`, `architecture/`, `operations/`, `security/`, `integration/`, `database/`, `database/scripts/`, `snapshots/`.

**READMEs existentes a actualizar**: `docs/README.md` (reescritura completa), `docs/_archive/README.md` (agregar referencia a `docs-audit-reorg`), `formulas_calculo_de_deuda/README.md` (corregir título engañoso).

---

## Phasing

| Fase | Qué | Depende de |
|------|-----|------------|
| **Fase 1** — Críticos | Crear `develop`, corregir 11 enlaces a `LOGICA_DEUDAS_PAGOS.md`, eliminar refs a `INSTRUCTIVO_DEPLOY.md`, limpiar `configurable-interest-rate` | Nada |
| **Fase 2** — Estructural | Crear 7 subcarpetas + READMEs, mover 14 archivos sueltos + SQL scripts + `integracion/` → `integration/` + `GUIDES/` → `operations/GUIDES/` + CSVs a `test-data/` | Fase 1 |
| **Fase 3** — Indexación | Reescribir `docs/README.md`, actualizar `AGENTS.md`, actualizar READMEs existentes | Fase 2 |
| **Fase 4** — Archivo | Mover `docs-audit-reorg/` a `openspec/changes/archive/` | Fase 2 |

Las fases son secuenciales: cada una depende del estado estable de la anterior. Dentro de cada fase, los movimientos de archivos son independientes entre sí y pueden ejecutarse en paralelo.

---

## Validation Strategy

```bash
# Cero enlaces rotos a ruta vieja de LOGICA_DEUDAS_PAGOS
grep -rn "docs/bd/LOGICA_DEUDAS_PAGOS" . --include="*.md" | grep -v "_archive" | grep -v "openspec/changes/archive"

# Cero referencias a INSTRUCTIVO_DEPLOY.md
grep -rn "INSTRUCTIVO_DEPLOY" . --include="*.md" | grep -v "_archive"

# Cero referencias a integracion/ (con "c")
grep -rn "docs/integracion/" . --include="*.md" | grep -v "_archive"

# Cero referencias a configurable-interest-rate como activo
grep -rn "configurable-interest-rate" docs/README.md docs/AI_CONTEXT.md

# Todas las rutas en docs/README.md resuelven a archivos existentes
# (validación manual o script que lea el índice y haga stat de cada ruta)

# Rama develop existe
git branch --list develop
```

---

## Archivar `docs-audit-reorg`

```bash
mkdir -p openspec/changes/archive/2026-07-03-docs-audit-reorg
git mv openspec/changes/docs-audit-reorg/tasks.md openspec/changes/archive/2026-07-03-docs-audit-reorg/tasks.md
```
Agregar `archive.md` con razón: "Absorbido por `doc-reorganization` (2026-07-03). Tareas T1.1 y T3.4 ya ejecutadas; resto cubierto en este cambio."

---

## Open Questions

- [ ] ¿Se debe mover `grid_form.py` fuera de `docs/` a `scripts/` o `tools/`? Es código vivo, no documentación. El proposal lo deja en `formulas_calculo_de_deuda/` como out-of-scope.
- [ ] ¿Los snapshots `informe-estado-*.md` deben llevar banner de "no usar como referencia operativa" o ya lo tienen de `docs-audit-reorg`?
