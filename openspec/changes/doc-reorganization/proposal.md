# Proposal: Reorganización de `docs/`

## Resumen Ejecutivo

`docs/` acumuló 14 archivos sueltos, 6 subcarpetas (4 sin README), 3 enlaces rotos críticos y ~50 referencias a una rama `develop` inexistente. Este cambio reorganiza la estructura por áreas temáticas, corrige todos los enlaces rotos, resuelve la situación de `develop`, y absorbe el cambio previo `docs-audit-reorg` (varias tareas ya ejecutadas). Resultado: onboarding más rápido para agentes IA y humanos, navegación predecible, y cero enlaces rotos.

---

## 1. Intent — Por qué

La documentación creció orgánicamente sin estructura. Tres fricciones críticas la hacen poco confiable hoy:

1. **Enlaces rotos a `LOGICA_DEUDAS_PAGOS.md`** — 11 archivos referencian `docs/bd/LOGICA_DEUDAS_PAGOS.md` pero el archivo vive en `docs/formulas_calculo_de_deuda/`. Agentes y lectores nuevas llegan a 404.
2. **Rama `develop` inexistente** — el repo solo tiene `main`, pero `AGENTS.md`, `GUIA_RAMAS.md`, `DEPLOY_AZURE.md` y el `RUNBOOK` asumen `develop` como rama activa. Comandos copiados desde los docs **fallan**. La spec `documentation` ya exige `develop` como rama activa.
3. **`INSTRUCTIVO_DEPLOY.md` referenciado pero inexistente** — `.github/` no existe en el repo.

El cambio previo `docs-audit-reorg` ya corrigió dos tareas (eliminación de archivos peligrosos, banners de snapshot), pero quedó incompleto y varias de sus tareas referencian archivos que tampoco existen. Este cambio lo reemplaza con un alcance más amplio: no solo limpiar, sino reestructurar.

## 2. Scope — Qué cambia

### In Scope
- Crear subcarpetas temáticas: `onboarding/`, `architecture/`, `operations/`, `security/`, `integration/`, `database/`, `snapshots/`.
- Mover los 14 archivos sueltos a su carpeta correspondiente.
- Mover `LOGICA_DEUDAS_PAGOS.md` a la nueva `docs/database/` y actualizar las 11 referencias entrantes.
- Mover `INTEGRACION_PAGOS.md` a `docs/integration/` (mantener separado de `CONTRACT-PORTAL-GATEWAY.md`).
- Mover `pruebas_documentos_a_comparar/` (CSVs) fuera de `docs/` a `test-data/comparacion/` — son fixtures, no docs.
- Crear la rama `develop` desde `main` Y actualizar `GUIA_RAMAS.md` para que los comandos funcionen (Decisión 2: opción A+B).
- Eliminar/corregir las referencias a `INSTRUCTIVO_DEPLOY.md` (`.github/` no existe).
- Quitar `configurable-interest-rate` de los índices como cambio activo (ya absorbido).
- Agregar READMEs en cada subcarpeta nueva + las 4 que no tienen (`bd/`, `GUIDES/`, `integracion/` histórica, `pruebas`).
- Reescribir `docs/README.md` como índice maestro con rutas actualizadas y badges de frescura.
- Actualizar el mapa de documentación en `AGENTS.md`.
- Archivar el cambio `docs-audit-reorg` (observaciones parciales ya ejecutadas; resto absorbido aquí).

### Out of Scope
- No reescribir el contenido de los documentos salvo correcciones puntuales de rutas/ramas.
- No crear workflows de GitHub Actions (no existen y no están en este alcance).
- No mover scripts SQL activos a otra ubicación de despliegue (solo documentar destino).
- No redactar nuevos ADRs (el `ADR.md` ya existe con 7 entradas; solo se mueve).
- No cambiar el flujo git del proyecto más allá de crear `develop`.

## 3. Capabilities

### New Capabilities
<!-- Ninguna nueva — este cambio modifica una capability existente. -->

### Modified Capabilities
- `documentation`: agrega requerimientos de estructura de carpetas temáticas, integridad de enlaces entrantes (cero enlaces rotos), README en cada subcarpeta de `docs/`, y resolución de la contradicción de rama `develop` ya parcialmente captada en la spec actual.

## 4. Approach

Ejecución en 4 fases (ver tasks.md):

1. **Críticos**: arreglar las 11 referencias a `LOGICA_DEUDAS_PAGOS.md`, crear `develop`, eliminar referencias a `INSTRUCTIVO_DEPLOY.md`, limpiar `configurable-interest-rate`.
2. **Estructural**: crear subcarpetas + READMEs, mover archivos sueltos, mover CSVs a `test-data/`.
3. **Contenido mínimo**: READMEs faltantes en `bd/`, `GUIDES/`, `database/`, `snapshots/`; corregir título engañoso de `formulas_calculo_de_deuda/README.md`; documentar `grid_form.py`.
4. **Indexación**: reescritura de `docs/README.md` + actualización de `AGENTS.md` + validación final (grep cero enlaces rotos).

Principios aplicados (cognitive-doc-design): progressive disclosure (onboarding/architecture/operations), chunking (subcarpetas temáticas), signposting (README en cada subcarpeta), recognition over recall (índice con badges de frescura).

## 5. Affected Areas

| Área | Impacto | Descripción |
|------|---------|-------------|
| `docs/` (estructura completa) | Modified | 14 archivos se mueven a subcarpetas; nueva estructura temática |
| `docs/README.md` | Modified | Reescritura del índice maestro con nuevas rutas |
| `AGENTS.md` | Modified | Mapa de documentación + corrección `develop` L11 + enlace L155 |
| `docs/GUIA_RAMAS.md` | Modified | ~50 referencias a `develop` + corrección de comandos |
| `docs/AI_CONTEXT.md`, `INTEGRACION_PAGOS.md`, `diagnosticos` | Modified | Actualización de rutas internas |
| `docs/bd/`, `docs/formulas_calculo_de_deuda/` | Modified | `LOGICA_DEUDAS_PAGOS.md` se traslada a `docs/database/` |
| `docs/pruebas_documentos_a_comparar/` | Removed | Se traslada a `test-data/comparacion/` |
| `openspec/specs/documentation/spec.md` | Modified | Nueva delta con requerimientos de estructura |
| 11 archivos con enlaces a `LOGICA_DEUDAS_PAGOS.md` | Modified | Corrección de ruta (AGENTS.md, specs, skills, cambios archivados) |
| `openspec/changes/docs-audit-reorg/` | Archived | Absorbido por este cambio |

## 6. Risks

| Riesgo | Probabilidad | Mitigación |
|--------|-------------|------------|
| Enlaces entrantes queden rotos tras mover archivos | Alta | `grep` repo completo por cada archivo movido; validación final automatizada |
| Merge conflicts con cambios activos (`ticket-payment-tracking`, `security-hardening`) | Media | Este cambio solo toca `docs/` y `AGENTS.md`; coords via rama `develop` separada; no toca `src/` |
| Crear `develop` rompa scripts/CD existentes que asumen `main` | Baja | No hay workflows CI; solo afecta docs; `main` sigue como producción |
| Movimiento masivo oscurezca historial git | Media | Usar `git mv` para preservar rename history |
| Cambios archivados referencien rutas viejas | Media | Actualizar también archivos en `openspec/changes/archive/` |

## 7. Alternatives Considered

| Alternativa | Por qué no |
|-------------|-----------|
| **Fix mínimo**: solo arreglar los 3 enlaces críticos sin reestructurar | No resuelve la raíz: 14 archivos sueltos en root seguirán creciendo. Costo recurrente. |
| **Dejar en root con prefijos** (`ARCH-`, `OPS-`) | Menos disruptivo pero la raíz sigue ruidosa e inconsistente con las subcarpetas ya existentes. |
| **Mover todo a `docs/_archive/` y empezar de cero** | Pierde histórico de decisiones y contexto acumulado. |

## 8. Non-Goals

- No reescribir `DEPLOY_AZURE.md` para reflejar un sistema de CI/CD que no existe (solo quitar referencias a `.github/`).
- No eliminar `grid_form.py` (es código vivo; solo documentar propósito).
- No consolidar ADRs ni agregar nuevos.
- No cambiar la convención de `MUNICIPIO` ni la config multi-ambiente.
- No resolver el contenido de los snapshots históricos (solo moverlos a `snapshots/`).

## Rollback Plan

Cada fase se entrega como commit separado en `develop`. Revert por fase con `git revert`:
1. Si la fase estructural rompe algo, revert del commit de movimientos restaura las rutas originales (historial preservado por `git mv`).
2. La rama `develop` puede borrarse sin afectar `main` si el cambio se cancela.
3. Los CSVs movidos a `test-data/` se restauran con `git mv` inverso.

No se publican deletes de archivos sin backup en `_archive/`.

## Dependencies

- Confirmación del usuario de que `develop` debe ser rama activa (alineado con `openspec/specs/documentation/spec.md`).
- Coordinación con cualquier cambio activo que toque `AGENTS.md` o `docs/`.

## Success Criteria

- [ ] `grep -rn "docs/bd/LOGICA_DEUDAS_PAGOS" .` retorna 0 resultados.
- [ ] `grep -rn "INSTRUCTIVO_DEPLOY" .` retorna 0 resultados (o solo en `_archive/`).
- [ ] Rama `develop` existe y `GUIA_RAMAS.md` describe comandos que funcionan.
- [ ] Cada subcarpeta de `docs/` (excepto `_archive/`) tiene un `README.md`.
- [ ] `docs/README.md` lista todas las rutas actuales y todas resuelven a archivos existentes.
- [ ] Cero archivos sueltos `.md` en `docs/` root (excepto `README.md`).
- [ ] `test-data/comparacion/` contiene los CSVs movidos y ya no viven en `docs/`.
- [ ] `configurable-interest-rate` no figura como cambio activo en ningún índice.
- [ ] `openspec/changes/docs-audit-reorg/` está archivado.