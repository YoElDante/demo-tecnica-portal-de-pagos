---
name: doc-conventions
description: >
  Convenciones de documentacion del proyecto: taxonomia de carpetas, kebab-case,
  proceso de creacion y archivado, y actualizacion del indice maestro.
  Trigger: crear documentacion, nuevo documento, agregar doc, mover doc, archivar doc,
  actualizar README docs, documentar feature, escribir guia, crear spec doc.
license: Apache-2.0
metadata:
  author: yoeldante
  version: "1.0"
---

## When to Use

- Antes de crear cualquier archivo `.md` en `/docs`.
- Antes de mover, renombrar o archivar documentacion existente.
- Cuando una fase SDD (spec, design, proposal) deba generar documentacion de referencia.
- Cuando se complete una feature y haya que documentar el comportamiento resultante.
- Cuando se detecte un doc desactualizado o en el lugar equivocado.

---

## Taxonomia de carpetas

Cada documento tiene un tipo. El tipo determina la carpeta. Sin excepciones.

| Carpeta | Tipo | Ejemplos |
|---------|------|----------|
| `docs/architecture/` | Decisiones duraderas: ADRs, pendientes de seguridad | `adr.md`, `security-pending.md` |
| `docs/domain/` | Conocimiento del negocio: reglas, formulas, logica contable | `logica-deudas-pagos.md` |
| `docs/guides/` | Procedimientos paso a paso: deploy, onboarding, runbook | `deploy-azure.md`, `runbook.md` |
| `docs/integration/` | Contratos con externos, checklists de integracion | `contract-portal-gateway.md` |
| `docs/auditorias/` | Auditorias tecnicas con fecha y estructura formal | `auditoria-03072026/` |
| `docs/_archive/` | Obsoletos y temporales — nunca se borran, se entierran | `_archive/status/`, `_archive/database/` |

Archivos permitidos en la raiz de `docs/`: `README.md`, `GLOSSARY.md`, `AGENTS.md`, `ai-context.md`.
Cualquier otro archivo en la raiz es un error de ubicacion — moverlo a la carpeta correcta.

---

## Convencion de nombres

```
# Correcto
docs/domain/logica-deudas-pagos.md
docs/guides/deploy-azure.md
docs/integration/contract-portal-gateway.md
docs/auditorias/auditoria-03072026/

# Incorrecto — nunca usar
docs/LOGICA_DEUDAS_PAGOS.md      ← UPPER_CASE
docs/guiaDeployAzure.md           ← camelCase
docs/Guia Deploy Azure.md         ← espacios
docs/guia_deploy_azure.md         ← underscore
```

Excepciones universales (unicas): `README.md`, `AGENTS.md`, `GLOSSARY.md`.

---

## Proceso: crear un documento nuevo

```
1. Buscar en docs/README.md si ya existe algo similar.
   Si existe → actualizarlo, no crear uno nuevo.

2. Determinar el tipo usando la tabla de taxonomia.

3. Crear el archivo con nombre en kebab-case:
   docs/<carpeta>/<nombre-del-documento>.md

4. Agregar entrada en docs/README.md en la seccion correspondiente:
   | [nombre.md](carpeta/nombre.md) | ✅ Nuevo | Descripcion en una linea |
```

---

## Proceso: archivar un documento

```
1. Mover el archivo a docs/_archive/<carpeta-origen>/<mismo-nombre>.md
   Ejemplo: docs/guides/runbook.md → docs/_archive/guides/runbook.md

2. Eliminar la entrada de docs/README.md
   (o moverla a la seccion de archivo historico con badge 🗄️)

3. NUNCA borrar del repo — git history no reemplaza al archivo en _archive/.
```

---

## Estructura del _archive/ (espeja /docs)

```
docs/_archive/
├── architecture/
├── domain/
├── guides/
├── integration/
├── database/     ← scripts SQL y archivos no-doc
├── status/       ← informes de estado con fecha
└── pruebas-comparacion/
```

---

## Que NO va en /docs

| Contenido | Destino correcto |
|-----------|-----------------|
| Diagnosticos temporales de bugs | Ticket/issue, o `_archive/` si esta resuelto |
| Informes de estado fechados | `_archive/status/` |
| Scripts SQL o codigo fuente | `_archive/database/` o en el proyecto |
| Borradores sin terminar | Rama de git con prefijo `draft-` en el nombre |
| Datos de prueba o fixtures | `_archive/pruebas-comparacion/` |

---

## Critical Patterns

- Consultar siempre `docs/README.md` antes de crear — el indice maestro es la fuente de verdad.
- Un documento en la carpeta incorrecta genera ruido que cuesta tokens leer y desambiguar.
- El `_archive/` no es basura — es trazabilidad. Mantener la estructura espejada.
- Si un doc esta desactualizado, actualizarlo en su lugar. No crear uno paralelo.
- El README.md de docs/ debe reflejar la realidad: si un archivo no esta en el indice, para un agente no existe.

---

## Resources

- **Indice maestro**: [docs/README.md](../../docs/README.md)
- **Convenciones completas**: [docs/AGENTS.md](../../docs/AGENTS.md)
- **Contexto del proyecto**: [docs/ai-context.md](../../docs/ai-context.md)
