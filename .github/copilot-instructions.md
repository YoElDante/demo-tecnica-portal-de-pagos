# Copilot Workspace Instructions

Para reglas completas del proyecto, convenciones, restricciones y flujo de trabajo SDD,
consultá [AGENTS.md](../AGENTS.md) en la raíz del repositorio.

## Prioridades

1. Respetar el modelo multi-municipio — nunca hardcodear credenciales ni branding.
2. El webhook server-to-server es la única fuente de verdad para pagos.
3. Apoyarse en `skills/` para tareas recurrentes del dominio.
4. Consultar `openspec/specs` antes de cambios funcionales.
5. Usar `docs/README.md` como índice maestro de documentación.

## Entrada rápida multi-repo

Si la tarea es de conexión portal↔gateway, iniciar en la sección
"Entrada Rapida Para Orquestador Multi-Repo" de `AGENTS.md`.
