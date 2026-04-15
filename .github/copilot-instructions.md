# Instrucciones de Workspace

Usa `AGENTS.md` como fuente principal de reglas globales del proyecto.

## Prioridad Para Agente Superior (Portal + Gateway)

Si la tarea viene de un orquestador multi-repo, iniciar en la seccion `Entrada Rapida Para Orquestador Multi-Repo` de `AGENTS.md` y seguir su ruta minima de lectura antes de explorar archivos adicionales.

## Prioridades

1. Respetar el modelo multi-municipio.
2. No hardcodear credenciales ni branding fuera de la configuracion.
3. Considerar el webhook como unica fuente de verdad para pagos.
4. Apoyarse en `skills/` para tareas recurrentes del dominio.
5. Consultar `openspec/specs` antes de cambios funcionales relevantes.

## Documentacion Base

- `PRD.md`
- `AGENTS.md`
- `docs/README.md`
- `docs/AI_CONTEXT.md`
- `openspec/specs/*/spec.md`

## Regla Operativa

Si un cambio afecta pagos, municipios, seguridad o despliegue, actualizar o crear primero el artefacto correspondiente en `openspec/changes`.