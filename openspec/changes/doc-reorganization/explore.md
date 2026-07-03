# Exploration: Documentación — Reorganización de `docs/`

> **Fecha**: 2026-07-03
> **Propósito**: Inventario completo, detección de problemas, y propuesta de estructura para reorganizar la carpeta `docs/`.
> **Modo**: Solo lectura — no se modificó ningún archivo.

---

## Executive Summary

La carpeta `docs/` tiene **20 entradas** (14 archivos sueltos + 6 subcarpetas). El índice maestro (`docs/README.md`) existe y está bien estructurado, pero contiene **tres enlaces rotos críticos** y referencia un cambio (`configurable-interest-rate`) que ya fue absorbido por otro. A nivel de contenido, el problema más grave es que **todo el repositorio solo tiene la rama `main`**, pero todos los documentos asumen que `develop` existe y es la rama de trabajo activa — esto incluye `AGENTS.md`, `GUIA_RAMAS.md`, `DEPLOY_AZURE.md`, `GUIDES/RUNBOOK.md`, y otros.

Un trabajo previo (`openspec/changes/docs-audit-reorg/tasks.md`) ya identificó varias de estas issues y tiene tareas detalladas, pero algunas ya fueron ejecutadas parcialmente (archivos peligrosos eliminados, banners de snapshot agregados). La exploración actual complementa ese trabajo con un inventario completo y decisiones estructurales.

---

## 1. Current State — Inventario Completo

### docs/ — Archivos sueltos (14)

| Archivo | Estado en README | Real |
|---------|-----------------|-------|
| `ADR.md` | ✅ Nuevo — 7 ADRs | Existe, 204 líneas |
| `AI_CONTEXT.md` | ✅ Fresco | Existe, 104 líneas |
| `CONTRACT-PORTAL-GATEWAY.md` | ✅ Fresco | Existe |
| `DEPLOY_AZURE.md` | ✅ Fresco | Existe |
| `DIAGNOSTICO_TICKET_VACIO.md` | ✅ Fresco | Existe, 191 líneas |
| `GLOSSARY.md` | ✅ Nuevo | Existe |
| `GUIA_NUEVO_MUNICIPIO.md` | ✅ Fresco | Existe |
| `GUIA_RAMAS.md` | ✅ Fresco | Existe, 456 líneas |
| `INTEGRACION_PAGOS.md` | ✅ Fresco | Existe (no listado en README pero sí en tabla) |
| `PENDIENTE_SEGURIDAD.md` | ✅ Fresco | Existe |
| `PLAN_CONFIGURACION_MULTIAMBIENTE.md` | ✅ Fresco | Existe |
| `README.md` | — (es el índice) | Existe, 147 líneas |
| `informe-estado-20260630-0426.md` | ⚠️ Snapshot | Existe, 75 líneas |
| `informe-estado-ai-20260630-0426.md` | ⚠️ Snapshot | Existe |

### docs/ — Subcarpetas (6)

| Carpeta | Contenido | README propio? |
|---------|-----------|----------------|
| `_archive/` | 4 docs históricos + `ai/` (README) + `README.md` propio | ✅ Sí |
| `bd/` | 3 scripts SQL (setup + históricos) | ❌ No — README dice que contiene LOGICA_DEUDAS_PAGOS.md pero no está ahí |
| `GUIDES/` | `RUNBOOK.md` solamente | ❌ No |
| `integracion/` | 2 docs (CHECKLIST + GUIA_INTEGRACION) | ❌ No |
| `formulas_calculo_de_deuda/` | `LOGICA_DEUDAS_PAGOS.md` + `grid_form.py` + `formulas_alcaldia_072026.txt` + README.md | ✅ Sí (aunque el README se titula "Documentacion de Base de Datos" — engañoso) |
| `pruebas_documentos_a_comparar/` | CSVs de test (resultados portal vs escritorio) + "Lista de dni.txt" | ❌ No |

### docs/ — Total
- **14 archivos sueltos** en root
- **6 subcarpetas** con ~16 archivos adicionales
- **1 índice** (`README.md`)

---

## 2. Problems Found

### 🔴 CRITICAL: `docs/bd/LOGICA_DEUDAS_PAGOS.md` no existe — enlace roto en 11 archivos

El archivo `LOGICA_DEUDAS_PAGOS.md` está en `docs/formulas_calculo_de_deuda/`, NO en `docs/bd/`.

**11 archivos referencian la ruta incorrecta** `docs/bd/LOGICA_DEUDAS_PAGOS.md`:
- `AGENTS.md` (L155)
- `docs/AI_CONTEXT.md` (L94)
- `docs/INTEGRACION_PAGOS.md` (L112)
- `docs/README.md` (L29)
- `openspec/specs/ticket-lifecycle/spec.md` (L44)
- `openspec/specs/interest-calculation/spec.md` (L204)
- `openspec/changes/ticket-payment-tracking/proposal.md` (L51)
- `openspec/changes/archive/2026-07-03-fix-debt-calculation-discrepancy/tasks.md` (L80, L82)
- `openspec/changes/archive/2026-07-03-fix-debt-calculation-discrepancy/proposal.md` (L44)
- `openspec/changes/archive/2026-07-03-fix-debt-calculation-discrepancy/archive.md` (L27)
- `skills/deuda-interest-calculation/SKILL.md` (L33)

### 🔴 CRITICAL: Rama `develop` no existe — solo `main`

`git branch -a` muestra únicamente `main`. Sin embargo:

- **AGENTS.md** L11: *"La rama principal de trabajo es `develop`"*
- **GUIA_RAMAS.md**: ~50 referencias a `develop` (checkouts, pushes, merges)
- **DEPLOY_AZURE.md** L208-213: Sección "Nota sobre develop y .env"
- **GUIDES/RUNBOOK.md** L182: *"Push a develop o main dispara el workflow"*
- **docs/integracion/GUIA_INTEGRACION_MULTIPROYECTO.md** L279-299: Comandos con `develop`

Esto no es solo documentación desactualizada — comandos copiados desde estos docs **fallarían** porque `develop` no existe. La spec de documentación (`openspec/specs/documentation/spec.md`) ya documenta esto como un requerimiento conocido (Req: "AGENTS.md Branch Contradiction Fix").

### 🔴 CRITICAL: `../.github/workflows/INSTRUCTIVO_DEPLOY.md` no existe

Referenciado en:
- `docs/README.md` L64: badge "✅ Corregido" para un archivo que no existe
- `docs/GUIA_RAMAS.md` L454: enlace al archivo
- `docs/DEPLOY_AZURE.md` L135: menciona `.github/workflows/`

El directorio `.github/` **no existe en el repositorio**. No hay workflows de GitHub Actions configurados. `DEPLOY_AZURE.md` describe pasos que no tienen correlato con el código actual.

### 🟡 WARNING: `configurable-interest-rate` está absorbido pero docs lo listan como activo

- `docs/README.md` L107: listado como cambio activo
- `docs/AI_CONTEXT.md` L102: referenciado como activo
- `docs/informe-estado-*.md`: referenciado como pendiente

Realidad: `openspec/changes/_absorbed/README.md` confirma que fue absorbido por `sequelize-mapping-manzano-debt-formulas` el 2026-07-02.

### 🟡 WARNING: `docs/pruebas_documentos_a_comparar/` no tiene documentación

Carpeta con datos de prueba (CSVs de resultados portal vs escritorio) sin README que explique:
- Qué son estos archivos
- Cómo se generaron
- Si siguen siendo relevantes
- Qué significan las columnas

### 🟡 WARNING: `docs/bd/` sin README

Contiene 3 scripts SQL pero no hay un README que explique:
- Cuál es el script activo vs histórico
- Qué hace cada uno
- Cómo se relacionan con la lógica de deudas

### 🟡 WARNING: `docs/formulas_calculo_de_deuda/README.md` título engañoso

Se titula "Documentacion de Base de Datos" pero contiene:
- `LOGICA_DEUDAS_PAGOS.md` (el documento más importante)
- `grid_form.py` (script Python con Reflex/pyodbc)
- `formulas_alcaldia_072026.txt` (fórmulas de cálculo)

El nombre del README no refleja su contenido real.

### 🟡 WARNING: `docs/INTEGRACION_PAGOS.md` duplica contenido

Este archivo suelto cubre el flujo de integración con SIRO/Banco Roela, pero la carpeta `integracion/` ya tiene 2 documentos sobre integración. Hay overlap temático con `CONTRACT-PORTAL-GATEWAY.md`.

### 🟡 WARNING: `grid_form.py` — script Python no documentado en README principal

`docs/formulas_calculo_de_deuda/grid_form.py` (501 líneas, usa Reflex + pyodbc + httpx) no tiene documentación externa que explique su propósito. Vive en la carpeta de documentación pero es código real.

### ℹ️ INFO: `docs-audit-reorg` tasks parcialmente ejecutadas

Comparando `openspec/changes/docs-audit-reorg/tasks.md` con el estado actual:
- ✅ Archivos peligrosos eliminados (T1.1 ya ejecutado: no existen QUICK_RESUME, PROJECT_CONTEXT, ROADMAP, ni los stubs de skills)
- ✅ Banners de snapshot agregados (T3.4 ya ejecutado: informe-estado archivos ya tienen banner)
- 🔲 T2.1-2.3 (merges) no se pueden verificar — archivos origen no existen
- 🔲 T3.1 (mercadopago->siro) queda por verificar

### ℹ️ INFO: Subcarpetas sin README propio

`bd/`, `GUIDES/`, `integracion/`, `pruebas_documentos_a_comparar/` no tienen un README que explique el propósito de la carpeta y el contenido de sus archivos.

---

## 3. Stale References — Detalle

| Documento | Problema | Severidad |
|-----------|----------|-----------|
| `AGENTS.md` L11 | `develop` no existe | 🔴 CRITICAL |
| `AGENTS.md` L155 | Enlace a `docs/bd/LOGICA_DEUDAS_PAGOS.md` roto | 🔴 CRITICAL |
| `docs/README.md` L29 | Enlace a `docs/bd/LOGICA_DEUDAS_PAGOS.md` roto | 🔴 CRITICAL |
| `docs/README.md` L64 | Enlace a `.github/workflows/INSTRUCTIVO_DEPLOY.md` roto | 🔴 CRITICAL |
| `docs/README.md` L107 | `configurable-interest-rate` listado como activo (absorbido) | 🟡 WARNING |
| `docs/AI_CONTEXT.md` L94 | Enlace a `docs/bd/LOGICA_DEUDAS_PAGOS.md` roto | 🔴 CRITICAL |
| `docs/AI_CONTEXT.md` L102 | `configurable-interest-rate` listado como activo | 🟡 WARNING |
| `docs/GUIA_RAMAS.md` | ~50 referencias a `develop` | 🔴 CRITICAL |
| `docs/GUIA_RAMAS.md` L454 | Enlace a `INSTRUCTIVO_DEPLOY.md` roto | 🔴 CRITICAL |
| `docs/DEPLOY_AZURE.md` L208-213 | Sección sobre `develop` que no existe | 🟡 WARNING |
| `GUIDES/RUNBOOK.md` L182 | Menciona push a `develop` | 🟡 WARNING |

---

## 4. Missing Content

| Área | Qué falta |
|------|-----------|
| `docs/bd/` | README explicando los 3 scripts SQL (cuál es activo, cuál histórico) |
| `docs/pruebas_documentos_a_comparar/` | README explicando propósito, metodología, qué significan los CSVs |
| `docs/integracion/` | README con propósito de la carpeta |
| `docs/GUIDES/` | README con propósito de la carpeta |
| `docs/formulas_calculo_de_deuda/` | README actualizado con título correcto y explicación del `grid_form.py` |
| Flujo real de ramas | Documento que refleje que solo `main` existe y cómo trabajar con una sola rama |
| GitHub Actions | No hay workflows — `DEPLOY_AZURE.md` describe despliegue que no existe en el repo |

---

## 5. Recommended Structure

### Principios aplicados (cognitive-doc-design)

- **Progressive disclosure**: documentos de onboarding primero, detalles después
- **Chunking**: agrupar por área temática en subcarpetas con README
- **Signposting**: nombres de carpeta autoexplicativos + README en cada una
- **Recognition over recall**: tabla de contenidos con badges de frescura

### Propuesta de estructura

```
docs/
├── README.md                     ← Índice maestro (actualizar)
│
├── onboarding/                   ← Para nuevos desarrolladores
│   ├── README.md
│   ├── AI_CONTEXT.md             ← (mover desde root)
│   ├── GLOSSARY.md               ← (mover desde root)
│   └── QUICKSTART.md             ← Opcional: guía rápida
│
├── architecture/                 ← Decisiones y contratos
│   ├── README.md
│   ├── ADR.md                    ← (mover desde root)
│   ├── CONTRACT-PORTAL-GATEWAY.md ← (mover desde root)
│   └── GUIA_RAMAS.md             ← (mover desde root, actualizar para reflejar solo main)
│
├── operations/                   ← Despliegue, configuración, runbook
│   ├── README.md
│   ├── DEPLOY_AZURE.md           ← (mover desde root)
│   ├── GUIA_NUEVO_MUNICIPIO.md   ← (mover desde root)
│   ├── PLAN_CONFIGURACION_MULTIAMBIENTE.md ← (mover desde root)
│   ├── DIAGNOSTICO_TICKET_VACIO.md ← (mover desde root, o fusionar en RUNBOOK)
│   └── GUIDES/
│       ├── README.md
│       └── RUNBOOK.md            ← (ya existe)
│
├── security/                     ← Hardening y seguridad
│   ├── README.md
│   └── PENDIENTE_SEGURIDAD.md    ← (mover desde root)
│
├── integration/                  ← Integración con gateway
│   ├── README.md
│   ├── INTEGRACION_PAGOS.md      ← (mover desde root)
│   ├── CHECKLIST_APPSETTINGS_Y_ORQUESTADOR_TICKETS.md ← (ya está)
│   └── GUIA_INTEGRACION_MULTIPROYECTO.md ← (ya está)
│
├── database/                     ← Base de datos y lógica de deudas
│   ├── README.md
│   ├── LOGICA_DEUDAS_PAGOS.md    ← (mover desde formulas_calculo_de_deuda/)
│   ├── script_activo.sql         ← (renombrar desde bd/script_creacion_bd_ElManzano_062026.sql)
│   └── scripts/                  ← Scripts históricos
│       ├── README.md
│       └── ... (scripts históricos desde bd/)
│
├── testing/                      ← Pruebas y validación
│   ├── README.md
│   └── resultados_comparacion/   ← (mover desde pruebas_documentos_a_comparar/)
│       ├── README.md
│       └── ... (CSVs)
│
├── _archive/                     ← (mantener estructura actual)
│   ├── README.md                 ← (actualizar)
│   ├── ai/
│   │   └── README.md
│   └── ... (documentos históricos)
│
├── formulas_calculo_de_deuda/    ← (opcional, si se quiere mantener separado)
│   ├── README.md                 ← (actualizar título)
│   ├── grid_form.py
│   └── formulas_alcaldia_072026.txt
│
└── snapshots/                    ← (nuevo) para informes de estado puntuales
    ├── README.md
    ├── informe-estado-20260630-0426.md ← (mover desde root)
    └── informe-estado-ai-20260630-0426.md ← (mover desde root)
```

### Nota sobre cambios de ruta vs redirección

Si se mueven archivos, **todos los enlaces entrantes** desde `AGENTS.md`, specs, skills, y cambios archivados deben actualizarse. Dado que son archivos `.md` locales (sin servidor HTTP), no hay redirects — todos los enlaces deben corregirse manualmente.

---

## 6. Top 5 Key Decisions

### Decisión 1: ¿Mover archivos sueltos a subcarpetas o dejarlos en root?

**Opción A (mover a subcarpetas)**: Estructura más limpia, cada archivo tiene un hogar temático. Requiere actualizar ~20+ enlaces entrantes. Mayor esfuerzo inicial pero más mantenible.

**Opción B (dejar en root con naming mejorado)**: Menos disruptivo. Prefijos como `ARCH-`, `OPS-`, `SEC-` en nombres de archivo. Menos trabajo ahora pero la raíz sigue siendo ruidosa.

**Recomendación**: **Opción A** — mover a subcarpetas. La raíz tiene 14 archivos sueltos, es demasiado. El costo de actualizar enlaces se paga una vez.

### Decisión 2: `develop` branch — ¿actualizar docs o crear la rama?

**Opción A (crear rama `develop`)**: Hacer que los docs reflejen la realidad deseada. Crear `develop` desde `main`.

**Opción B (actualizar docs para reflejar solo `main`)**: Ajustar todos los documentos para que reflejen que solo `main` existe. Más trabajo de documentación pero más honesto.

**Recomendación**: **Opción A + B** — crear la rama `develop` (que es la intención del proyecto) Y actualizar los docs para que los comandos funcionen. `GUIA_RAMAS.md` necesita una reescritura significativa. Ver `openspec/specs/documentation/spec.md` que ya captura este requerimiento.

### Decisión 3: `docs/bd/LOGICA_DEUDAS_PAGOS.md` — ¿dónde debe vivir?

**Opción A (mover a `docs/bd/`)**: Coincidir con todas las referencias existentes. Unificar los scripts SQL y la lógica en `docs/database/`.

**Opción B (dejarlo en `formulas_calculo_de_deuda/`)**: Menos movimiento de archivos pero todas las referencias quedan rotas.

**Opción C (crear `docs/database/` y moverlo ahí)**: Nombre más claro que `bd/` y más general que `formulas_calculo_de_deuda/`.

**Recomendación**: **Opción C** — crear `docs/database/`, mover `LOGICA_DEUDAS_PAGOS.md` ahí, y actualizar los 11 archivos que referencian la ruta incorrecta.

### Decisión 4: `INTEGRACION_PAGOS.md` — ¿fusionar o mantener separado?

**Opción A (fusionar en CONTRACT-PORTAL-GATEWAY.md)**: Un solo documento de integración. Menos archivos sueltos.

**Opción B (mover a `docs/integracion/`)**: Mantenerlo separado pero dentro de la carpeta temática. Más granular.

**Recomendación**: **Opción B** — mover a `docs/integracion/`. El contenido es suficientemente diferente de `CONTRACT-PORTAL-GATEWAY.md` como para justificar un documento separado (uno es el contrato, el otro es el flujo de integración).

### Decisión 5: ¿Qué hacer con `docs/pruebas_documentos_a_comparar/`?

**Opción A (mantener con README)**: Agregar documentación explicando qué son estos CSVs y cómo se usan.

**Opción B (mover a `tests/fixtures/` o similar)**: Sacar de `docs/` porque son datos de prueba, no documentación.

**Recomendación**: **Opción B** — mover a `tests/fixtures/comparacion/` o similar. Estos CSVs no son documentación, son fixtures de prueba. Si no hay carpeta `tests/`, considerar mover a una nueva carpeta `test-data/` en la raíz.

---

## 7. Priorized Action Plan

### Fase 1 — Correcciones críticas (enlaces rotos + rama)
1. Actualizar ruta de `LOGICA_DEUDAS_PAGOS.md` en los 11 archivos que la referencian incorrectamente
2. Decidir e implementar situación de `develop` branch
3. Eliminar o corregir referencias a `INSTRUCTIVO_DEPLOY.md`

### Fase 2 — Reorganización estructural
4. Crear subcarpetas temáticas con READMEs
5. Mover archivos sueltos a sus carpetas correspondientes
6. Actualizar `docs/README.md` con nuevas rutas

### Fase 3 — Contenido
7. Agregar READMEs faltantes en subcarpetas
8. Actualizar `formulas_calculo_de_deuda/README.md` con título correcto
9. Documentar/eliminar `grid_form.py`
10. Mover/eliminar `pruebas_documentos_a_comparar/`

### Fase 4 — Indexación
11. Reescritura completa de `docs/README.md` con todas las rutas actualizadas
12. Actualizar mapa de documentación en `AGENTS.md`

---

## 8. Ready for Proposal

**Sí** — la exploración está completa. Los hallazgos son claros y accionables.

Lo que el orquestador debe decir al usuario: *"La exploración reveló 3 problemas críticos (enlaces rotos a LOGICA_DEUDAS_PAGOS.md, rama develop inexistente, INSTRUCTIVO_DEPLOY.md faltante) y varias issues estructurales. Hay 5 decisiones clave que necesitan definirse antes de escribir el proposal. El trabajo previo en `docs-audit-reorg/tasks.md` ya cubre varias tareas de limpieza que pueden incorporarse."*
