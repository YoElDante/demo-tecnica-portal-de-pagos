# Design: Auditoría de Documentación y Reporte de Estado

## Technical Approach

Documentación-only. Cinco ediciones atómicas en `AGENTS.md` basadas en evidencia de código real y dos reportes generados desde `AI_CONTEXT.md`, `PENDIENTE_SEGURIDAD.md`, y exploración. Sin modificar `package.json` ni código fuente.

## Architecture Decisions

### Decision: Corrección de Regla #11

| Option | Tradeoff | Decision |
|--------|----------|----------|
| `develop` es rama activa, `main` es producción | Consistente con README L337 y GUIA_RAMAS.md | **Usar** |
| Mantener "develop fue eliminada" | Contradice 2 documentos fuente | Rechazado |

**Evidencia**: README.md L337 dice "Todo trabajo nuevo parte desde `develop`". GUIA_RAMAS.md L27-28: "develop (desarrollo/staging) ← Rama principal de trabajo".

### Decision: `npm test` placeholder

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Agregar `npm test` con nota "(placeholder — test suite pendiente)" | Veraz, no crea expectativa falsa | **Usar** |
| Agregar script a package.json | Out of scope per proposal | Rechazado |
| No agregar | Incumple spec | Rechazado |

**Evidencia**: `package.json` solo tiene `testDB`, ningún script `test`.

### Decision: Timestamp format

YYYYMMDD-HHMM, zona horaria Argentina (UTC-3). Separar con guion entre fecha y hora para legibilidad.

## AGENTS.md Fix Plan

### Fix 1 — Rule 11 (line 59)
```
OLD: La rama principal de trabajo es `main`. La rama `develop` fue eliminada. Todo cambio se commitea directamente en `main`, que es la rama de produccion.
NEW: La rama principal de trabajo es `develop`. La rama `main` es producción y solo recibe merges aprobados desde `develop`.
```
**Verify**: grep `develop fue eliminada` debe retornar 0 matches. Cross-ref con GUIA_RAMAS.md.

### Fix 2 — Agregar `npm test` al bloque de Comandos (line 81-89)
Insertar después de `npm install`:
```
npm test                # (placeholder — test suite pendiente)
```
**Verify**: AGENTS.md contiene `npm test` en el bloque de comandos.

### Fix 3 — Agregar `npm run dev:calchinoeste` al bloque de Comandos (line 81-89)
Insertar después de `npm run dev:sanjose`:
```
npm run dev:calchinoeste
```
**Verify**: AGENTS.md contiene `dev:calchinoeste`. Evidencia: `package.json` L15.

### Fix 4 — "Qué NO hace" (nueva sección después de "Restricciones de Implementacion", ~line 78)
```markdown
## Qué NO hace

- No procesa pagos directamente — delega al API Gateway
- No guarda credenciales bancarias ni hash de SIRO
- No se comunica directamente con SIRO ni ninguna plataforma de pago
- No envía emails ni notificaciones al contribuyente
- No accede a BD de otros municipios
```
**Verify**: sección existe con heading `## Qué NO hace` y al menos 3 ítems.

### Fix 5 — "Estado de Desarrollo" (nueva sección después de "Qué NO hace")
```markdown
## Estado de Desarrollo

| Fase | Estado |
|------|--------|
| Búsqueda por DNI y deudas | ✅ Completo |
| Integración gateway de pagos (SIRO) | ✅ Completo |
| Tracking formal de tickets (BD) | 🔲 En `openspec/changes/ticket-payment-tracking/` |
| Tasa de interés configurable end-to-end | 🔲 Parcial en `openspec/changes/configurable-interest-rate/` |
| Hardening HTTP (helmet + HTTPS) | 🔲 En `openspec/changes/security-hardening/` |
| Comprobantes por email | 🔲 Pendiente |
| Tests automatizados | 🔲 Solo 1 test de conexión BD (`npm run testDB`) |
```
**Data source**: `docs/AI_CONTEXT.md` tabla "Estado actual" + exploration de `openspec/changes/`.

### Fix 6 — Flujo SDD, paso faltante (lines 119-120)
```
OLD:
5. Validar en demo antes de asumir que produccion esta correcta.
7. Actualizar la documentacion de producto si cambia comportamiento funcional.

NEW:
5. Validar en demo antes de asumir que produccion esta correcta.
6. Mergear a `main` para deploy a producción.
7. Actualizar la documentacion de producto si cambia comportamiento funcional.
```

## Report Templates

### `docs/informe-estado-YYYYMMDD-HHMM.md` (humano)

| Sección | Fuente de datos |
|---------|----------------|
| ✅ Completado | `docs/AI_CONTEXT.md` tabla "Estado actual" |
| 🔲 Pendiente | `docs/PENDIENTE_SEGURIDAD.md` + `openspec/changes/` |
| ⚠️ Deuda Técnica | Exploration findings (console.log, 1 test, TODOs) |
| 🔍 Gaps (calidad profesional) | Helmet, tests, logging, users.js boilerplate |
| 🔗 Integración gateway | `docs/CONTRACT-PORTAL-GATEWAY.md` estado |

### `docs/informe-estado-ai-YYYYMMDD-HHMM.md` (AI)

| Sección | Contenido |
|---------|-----------|
| Task List | Tabla: prioridad \| archivo(s) \| esfuerzo \| dependencias |
| Dependency Graph | Mermaid o lista direccional (`A → B` significa A bloquea B) |
| Code Locations | Paths absolutos desde raíz del proyecto |
| Priorities | CRITICAL (seguridad/operativo) \| HIGH \| MEDIUM \| LOW |

**Priority classification**:
- CRITICAL: afecta producción o seguridad (ej: helmet, HTTPS)
- HIGH: completa funcionalidad activa (ej: tracking tickets)
- MEDIUM: mejora calidad sin bloquear (ej: eliminar console.log)
- LOW: nice-to-have (ej: limpiar users.js boilerplate)

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `AGENTS.md` | Modify | 6 ediciones atómicas (Rule 11, comandos, Qué NO hace, Estado, SDD step) |
| `docs/informe-estado-{timestamp}.md` | Create | Reporte legible por humanos |
| `docs/informe-estado-ai-{timestamp}.md` | Create | Reporte estructurado para IA |

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Manual | AGENTS.md fixes | grep para verificar que "develop fue eliminada" no existe, `npm test` aparece, numeración SDD es 1-7 sin gaps |
| Manual | Report completeness | Cada informe tiene todas las secciones requeridas con ≥3 entradas |
| None | Unit/Integration/E2E | No hay cambios de código |

## Migration / Rollout

No migration required. Rollback: `git checkout -- AGENTS.md` + eliminar los dos informes generados.

## Open Questions

- [ ] ¿Agregar script `"test": "echo placeholder"` a package.json para que `npm test` no falle? (Propuesta: fuera de scope, usar placeholder textual en AGENTS.md)
- [ ] ¿Corregir discrepancia Node.js v22.x (README L275) vs 20+ (AGENTS.md L39)? (Fuera de scope de esta propuesta, requiere decisión de runtime)
