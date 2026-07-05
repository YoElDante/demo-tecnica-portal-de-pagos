# Guía de Trabajo con SDD

> **SDD**: Spec-Driven Development. Un ciclo de trabajo estructurado donde cada cambio de código pasa por fases predecibles: explorar → proponer → especificar → diseñar → planificar → implementar → verificar → documentar → archivar.

---

## Cuándo usar cada comando

| Comando | Cuándo | Cuántas veces |
|---------|--------|--------------|
| `/sdd-init` | Al empezar un proyecto nuevo. Inicializa SDD: detecta el stack, configura testing, crea `openspec/config.yaml`. | **Una sola vez por proyecto.** |
| `/sdd-new <nombre>` | Para cualquier cambio que quieras que quede trazable: una feature, un bug fix, una refactorización. | **Una vez por cada cambio.** |

`/sdd-new` no es solo para tareas complejas. Es para cualquier cambio que merezca trazabilidad. La diferencia no es complejidad — es si querés que quede registro de qué se hizo, por qué, y cómo.

---

## El ciclo completo (9 fases)

```
/sdd-new nombre-del-cambio
    │
    ▼
┌──────────────────────────────────────────────────────────┐
│ 1. sdd-explore                                           │
│    Investigás el código. Entendés el problema.           │
│    Output: exploration.md (análisis y opciones)           │
├──────────────────────────────────────────────────────────┤
│ 2. sdd-propose                                           │
│    Definís alcance, capacidades, riesgos, rollback.      │
│    Output: proposal.md                                    │
├──────────────────────────────────────────────────────────┤
│ 3. sdd-spec                                              │
│    Escribís especificaciones formales (GIVEN/WHEN/THEN). │
│    Output: specs/{dominio}/spec.md (delta specs)          │
├──────────────────────────────────────────────────────────┤
│ 4. sdd-design                                            │
│    Diseñás la solución técnica. Decisiones y arquitectura.│
│    Output: design.md                                      │
├──────────────────────────────────────────────────────────┤
│ 5. sdd-tasks                                             │
│    Dividís en tareas concretas con checkboxes.           │
│    Output: tasks.md                                       │
├──────────────────────────────────────────────────────────┤
│ 6. sdd-apply                                             │
│    IMPLEMENTÁS el código.                                 │
│    Cada archivo nuevo nace CON header y section markers. │
│    Output: código modificado + apply-progress.md          │
├──────────────────────────────────────────────────────────┤
│ 7. sdd-verify                                            │
│    Ejecutás tests. Verificás contra specs.               │
│    Output: verify-report.md (PASS / FAIL)                 │
├──────────────────────────────────────────────────────────┤
│ 8a. sdd-document-code                                    │
│    AUDITÁS cada archivo del tracking register:           │
│    - ¿Tiene header preciso? ¿Markers correctos?          │
│    - Corregís headers stale, agregás markers faltantes.  │
│    Output: code-audit.md                                  │
├──────────────────────────────────────────────────────────┤
│ 8b. sdd-document-docs                                    │
│    5 verificaciones sobre /docs/:                        │
│    1. Procedencia: docs referenciados → actualizar       │
│    2. Precisión: docs sobre archivos modificados → verificar│
│    3. Checklists: ítems completados → marcar ✅          │
│    4. Nuevos docs: capabilities sin cobertura → crear    │
│    5. ADRs: decisiones de arquitectura → registrar        │
│    Output: document-report.md                             │
├──────────────────────────────────────────────────────────┤
│ 9. sdd-archive                                           │
│    Sincronizás delta specs con specs principales.         │
│    Movés el change a archive/. Limpiás índice de docs.   │
│    Output: archive-report.md                              │
└──────────────────────────────────────────────────────────┘
```

---

## Podés saltar fases

El orquestador no te obliga a pasar por todas:

- Si ya sabés qué querés hacer → salteá `explore`, arrancá en `propose`.
- Si el diseño es obvio → hacé `spec` y `design` en paralelo.
- La decisión la toma el orquestador según qué artefactos existen y cuáles faltan.

La regla: **las fases de abajo dependen de las de arriba**. No podés hacer `apply` sin `tasks`. No podés archivar sin `document-docs`.

---

## Dónde se guarda todo

```
openspec/
├── config.yaml              ← Configuración del proyecto (stack, testing, fases)
├── specs/                   ← Specs principales (fuente de verdad del comportamiento)
│   ├── ticket-lifecycle/
│   ├── payment-gateway-contract/
│   └── ...
├── changes/                 ← Cambios activos (en progreso)
│   ├── ticket-payment-tracking/
│   │   ├── proposal.md
│   │   ├── specs/
│   │   ├── design.md
│   │   ├── tasks.md
│   │   ├── apply-progress.md
│   │   ├── verify-report.md
│   │   ├── code-audit.md
│   │   └── document-report.md
│   └── archive/             ← Cambios completados (YYYY-MM-DD-nombre/)
│       └── 2026-07-04-security-hardening/
```

---

## `/sdd-init` en detalle

```bash
# Solo se ejecuta UNA vez por proyecto
/sdd-init
```

Qué hace:
1. Lee `package.json`, estructura de carpetas, dependencias.
2. Detecta el stack: Node.js, Express, Sequelize, EJS, etc.
3. Detecta herramientas de testing: ¿hay jest? ¿mocha? ¿solo un script de conexión?
4. Crea `openspec/config.yaml` con las 9 fases configuradas.
5. Crea `.atl/skill-registry.md` con el índice de skills disponibles.
6. Guarda el contexto del proyecto en Engram (memoria persistente para la IA).

Si el proyecto ya tiene `openspec/`, pregunta antes de sobrescribir.

---

## `/sdd-new` en detalle

```bash
# Inicia un cambio nuevo
/sdd-new agregar-filtro-por-fecha
```

Qué pasa después:
1. El orquestador lee `openspec/config.yaml` y el estado actual.
2. Si no hay change activo → arranca en `sdd-explore`.
3. Si hay un change pausado → pregunta si querés continuarlo o crear uno nuevo.
4. Cada fase, al terminar, retorna `next_recommended` indicando qué sigue.
5. El orquestador va encadenando fases hasta llegar a `archive`.

**Ejemplo de sesión real:**

```
Usuario:   /sdd-new fix-ticket-vacio
IA:        Iniciando cambio "fix-ticket-vacio". ¿Querés explorar el código primero?
Usuario:   Sí
IA:        [sdd-explore] El ticket se genera vacío porque...
           ¿Creo la propuesta?
Usuario:   Sí
IA:        [sdd-propose] Propuesta creada. Scope: arreglar generación de ticket...
           ¿Escribo las specs?
...y así hasta archivar.
```

---

## Para qué sirve todo esto

| Sin SDD | Con SDD |
|---------|---------|
| "Arreglé el bug, commit, listo." | Queda registro de qué se investigó, qué se decidió, qué specs cambiaron, qué archivos se tocaron, qué docs se actualizaron. |
| El próximo desarrollador no sabe por qué se tomó esa decisión. | Lee el `design.md` y el ADR. |
| La documentación se desactualiza. | `sdd-document-docs` la mantiene sincronizada automáticamente. |
| Un archivo de código es una caja negra. | Tiene header que explica qué hace, markers que muestran su estructura. |

---

## Referencias

| Documento | Contenido |
|-----------|-----------|
| [`politica-documentacion.md`](../architecture/politica-documentacion.md) | Política oficial de documentación del proyecto |
| [`../AGENTS.md`](../../AGENTS.md) | Reglas globales, convenciones, stack |
| [`skills/_shared/file-header-manifest.md`](../../skills/_shared/file-header-manifest.md) | Formato canónico de file headers |
| [`skills/_shared/section-marker-manifest.md`](../../skills/_shared/section-marker-manifest.md) | Formato canónico de section markers |
| [`openspec/config.yaml`](../../openspec/config.yaml) | Configuración SDD del proyecto |

---

> **Creado**: 2026-07-04 | SDD "sdd-document-phase" | Portal de Pagos Municipal
