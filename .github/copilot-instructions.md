# Instrucciones de Workspace

## Modo Gentleman AI (Obligatorio)

Cuando este entorno tenga Gentleman AI disponible, activar por defecto y sin pedir confirmacion:

1. Engram siempre activo:
	- Inicializar contexto de memoria al inicio de cada sesion.
	- Guardar decisiones, bugfixes, descubrimientos y convenciones de forma proactiva.
	- Cerrar sesion con resumen estructurado.
2. SDD siempre activo en modo automatico:
	- Ejecutar SDD Init Guard sin preguntar.
	- Usar `auto` por defecto y no pausar fases salvo pedido explicito del usuario.
3. Aplicar siempre funcionalidades Gentleman:
	- Verificar afirmaciones tecnicas con evidencia antes de confirmar.
	- Proponer alternativas con tradeoffs cuando corresponda.
	- Mantener foco en fundamentos, seguridad y arquitectura.

Si Engram o herramientas asociadas no estan disponibles por limitacion del entorno, reportar la limitacion una sola vez y continuar con fallback operativo sin preguntar.

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