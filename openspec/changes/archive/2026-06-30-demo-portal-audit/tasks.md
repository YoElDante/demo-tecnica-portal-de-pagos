# Tasks: Auditoría de Documentación y Reporte de Estado

## Resumen

Cambio documentación-only. 8 tareas atómicas. Sin modificar package.json ni código fuente.

---

## Review Workload Forecast

| Métrica | Valor |
|---|---|
| Estimado líneas cambiadas | ~180 |
| AGENTS.md edits | 6 cambios atómicos (~60 líneas) |
| Reporte humano | 1 archivo nuevo (~60 líneas) |
| Reporte IA | 1 archivo nuevo (~60 líneas) |
| 400-line budget risk | **Low** — muy por debajo del límite |
| Chained PRs recommended | **No** |
| Decision needed before apply | **No** |

---

## Tasks

### ✅ T1 — Corregir Regla #11 (branch principal)

| Campo | Valor |
|---|---|
| ID | T1 |
| Prioridad | **CRITICAL** |
| Archivos | `AGENTS.md` (línea ~59) |
| Esfuerzo | S (2 líneas) |
| Dependencias | Ninguna |
| Criterio aceptación | `grep "develop fue eliminada" AGENTS.md` retorna 0 matches. AGENTS.md dice "La rama principal de trabajo es `develop`. La rama `main` es producción." |
| **Estado** | ✅ Completo |

### ✅ T2 — Agregar `npm test` y `npm run dev:calchinoeste` a comandos

| Campo | Valor |
|---|---|
| ID | T2 |
| Prioridad | **HIGH** |
| Archivos | `AGENTS.md` (bloque Comandos de Trabajo) |
| Esfuerzo | S (2 líneas) |
| Dependencias | Ninguna |
| Criterio aceptación | AGENTS.md contiene `npm test` y `npm run dev:calchinoeste` en el bloque de comandos |
| **Estado** | ✅ Completo |

### ✅ T3 — Agregar sección "Qué NO hace"

| Campo | Valor |
|---|---|
| ID | T3 |
| Prioridad | **HIGH** |
| Archivos | `AGENTS.md` (nueva sección, ~78) |
| Esfuerzo | S (5 ítems) |
| Dependencias | Ninguna |
| Criterio aceptación | AGENTS.md tiene heading `## Qué NO hace` con al menos 4 ítems listando limitaciones del proyecto |
| **Estado** | ✅ Completo |

### ✅ T4 — Agregar sección "Estado de Desarrollo"

| Campo | Valor |
|---|---|
| ID | T4 |
| Prioridad | **MEDIUM** |
| Archivos | `AGENTS.md` (nueva sección) |
| Esfuerzo | M (requiere consultar AI_CONTEXT.md + openspec/changes/) |
| Dependencias | Ninguna |
| Criterio aceptación | AGENTS.md contiene tabla de fases con estados (✅ / 🔲) para al menos 6 ítems |
| **Estado** | ✅ Completo |

### ✅ T5 — Corregir numeración del flujo SDD (gap 5→7)

| Campo | Valor |
|---|---|
| ID | T5 |
| Prioridad | **LOW** |
| Archivos | `AGENTS.md` (líneas ~119-120) |
| Esfuerzo | S (1 línea) |
| Dependencias | Ninguna |
| Criterio aceptación | Flujo SDD numerado 1-7 sin gaps. Paso 6 existe: "Mergear a `main` para deploy a producción." |
| **Estado** | ✅ Completo |

### ✅ T6 — Generar reporte humano (informe-estado-YYYYMMDD-HHMM.md)

| Campo | Valor |
|---|---|
| ID | T6 |
| Prioridad | **HIGH** |
| Archivos | `docs/informe-estado-{timestamp}.md` (nuevo) |
| Esfuerzo | M (~60 líneas) |
| Dependencias | T1-T5 completados (usa AGENTS.md actualizado como fuente) |
| Data sources | `docs/AI_CONTEXT.md`, `docs/PENDIENTE_SEGURIDAD.md`, `openspec/changes/`, `docs/CONTRACT-PORTAL-GATEWAY.md` |
| Criterio aceptación | Archivo existe en docs/ con timestamp. Contiene: ✅ Completado, 🔲 Pendiente, ⚠️ Deuda Técnica, 🔍 Gaps profesionales, 🔗 Integración gateway |
| **Estado** | ✅ Completo |

### ✅ T7 — Generar reporte AI (informe-estado-ai-YYYYMMDD-HHMM.md)

| Campo | Valor |
|---|---|
| ID | T7 |
| Prioridad | **HIGH** |
| Archivos | `docs/informe-estado-ai-{timestamp}.md` (nuevo) |
| Esfuerzo | M (~60 líneas) |
| Dependencias | T6 (usa mismo data set) |
| Data sources | Mismos que T6 + código real explorado |
| Criterio aceptación | Archivo existe en docs/ con mismo timestamp. Contiene: task list con prioridades, dependency graph, code locations con paths absolutos, classification schema |
| **Estado** | ✅ Completo |

### ✅ T8 — Verificación cross-check

| Campo | Valor |
|---|---|
| ID | T8 |
| Prioridad | **HIGH** |
| Archivos | Todos los generados/modificados |
| Esfuerzo | S (grep + lectura) |
| Dependencias | T1-T7 |
| Criterio aceptación | (a) `grep "develop fue eliminada" AGENTS.md` = 0, (b) `npm test` en AGENTS.md, (c) informes existen con timestamp correcto, (d) sin regresiones en secciones no tocadas |
| **Estado** | ✅ Completo |

---

## Dependency Order

```
T1 ──┐
T2 ──┤
T3 ──┼──► T6 ──► T7 ──► T8
T4 ──┤
T5 ──┘
```

T1-T5 son independientes entre sí. T6 y T7 son secuenciales. T8 es final.

## Parallel Execution Plan

Batch 1 (parallel): T1, T2, T3, T4, T5
Batch 2: T6
Batch 3: T7
Batch 4: T8

---

## Estimated Total: 180 lines changed, ~25 min de trabajo
