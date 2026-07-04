# docs/AGENTS.md — Convenciones de Documentación

> Leé este archivo ANTES de crear, modificar o mover cualquier documento en `/docs`.
> Aplica tanto para humanos como para agentes de IA.

---

## Taxonomía de carpetas

Cada documento tiene un tipo. El tipo determina su carpeta. No hay excepciones.

| Carpeta | Tipo de documento | Ejemplos |
|---------|------------------|----------|
| `architecture/` | Decisiones de diseño duraderas, ADRs, pendientes de seguridad | `adr.md`, `security-pending.md` |
| `domain/` | Conocimiento del negocio: reglas, fórmulas, lógica contable | `logica-deudas-pagos.md`, `formulas-intereses.txt` |
| `guides/` | Procedimientos paso a paso: deploy, onboarding, runbook | `deploy-azure.md`, `runbook.md` |
| `integration/` | Contratos con sistemas externos, checklists de integración | `contract-portal-gateway.md`, `checklist-appsettings.md` |
| `auditorias/` | Auditorías técnicas con fecha y estructura formal | `auditoria-03072026/` |
| `_archive/` | Todo lo obsoleto, deprecado o temporal (nunca se borra, se entierra) | `_archive/status/`, `_archive/database/` |

Archivos en la raíz de `/docs`: únicamente `README.md`, `GLOSSARY.md`, `AGENTS.md`, `ai-context.md`.

---

## Convención de nombres

- **Carpetas**: `kebab-case` minúsculas — `architecture/`, `domain/`
- **Archivos markdown**: `kebab-case` minúsculas — `logica-deudas-pagos.md`
- **Archivos de texto/sql**: `kebab-case` minúsculas — `formulas-intereses.txt`
- **Excepciones universales**: `README.md`, `AGENTS.md`, `GLOSSARY.md` (mayúsculas por convención global)
- **Auditorías**: carpeta con fecha en el nombre — `auditoria-DDMMYYYY/`

Nunca usar: `UPPER_CASE.md`, `camelCase.md`, `nombres con espacios`, `UNDERSCORE_NAMES.md`

---

## Proceso antes de crear un documento nuevo

1. **Verificar que no existe**: buscar en `README.md` (el índice maestro) y en la carpeta correspondiente.
2. **Determinar el tipo**: usar la tabla de taxonomía para elegir la carpeta.
3. **Nombrar en kebab-case**: `mi-documento-nuevo.md`
4. **Crear el archivo** en la carpeta correcta.
5. **Agregar una entrada en `README.md`** en la sección correspondiente.

Si el documento reemplaza a uno existente → mover el viejo a `_archive/` con su estructura original, luego crear el nuevo.

---

## Proceso para archivar un documento

1. Copiar el archivo a `_archive/<carpeta-origen>/` (mantener la misma estructura).
2. Borrar el original.
3. Eliminar su entrada del `README.md` (o moverla a la sección `_archive/`).

Nunca borrar documentos del repo — siempre archivar. El historial de git no reemplaza al archivo en `_archive/`.

---

## Qué NO va en /docs

| Qué | Dónde va |
|-----|----------|
| Diagnósticos temporales de bugs | Un ticket / issue de git, o `_archive/` si ya se resolvió |
| Informes de estado con fecha | `_archive/status/` |
| Scripts SQL de setup | `_archive/database/` (no son documentación) |
| Código fuente de cualquier tipo | En el proyecto, no en `/docs` |
| Borradores sin terminar | En una rama, con prefijo `draft-` en el nombre |

---

## Estructura del `_archive/`

El `_archive/` espeja la misma estructura de carpetas que `/docs/`:

```
_archive/
├── architecture/
├── domain/
├── guides/
├── integration/
├── database/     ← scripts SQL y similares
├── status/       ← informes de estado con fecha
└── pruebas-comparacion/
```

---

## Actualizar el índice maestro

`docs/README.md` es la fuente de verdad de navegación. Toda operación que cree, mueva o archive un documento DEBE actualizar ese archivo.

Formato de entrada en el índice:
```markdown
| [nombre-legible.md](ruta/nombre-legible.md) | ✅ Fresco | Descripción en una línea |
```

Badges disponibles: `✅ Fresco`, `✅ Nuevo`, `⚠️ Revisar`, `⚠️ Snapshot`, `🗄️ Archivado`
