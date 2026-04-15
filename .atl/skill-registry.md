# Skill Registry — demo-portal-de-pago

Generated: 2026-04-15

## Convention Files

| File | Status |
|------|--------|
| `AGENTS.md` | ✅ Found — rules, stack, domain conventions, SDD flow |

### Referenced docs (from AGENTS.md)
- `docs/CONTRACT-PORTAL-GATEWAY.md` — contrato portal ↔ gateway de pagos
- `docs/PENDIENTE_SEGURIDAD.md` — hardening pendiente
- `docs/bd/LOGICA_DEUDAS_PAGOS.md` — lógica de deuda, mora y registración
- `docs/DEPLOY_AZURE.md` — despliegue Azure App Service

> Note: docs/ directory not found on disk — files referenced but no creados aún.

## Project Skills (declared in AGENTS.md — SKILL.md files pending)

| Skill | Trigger | Declared path |
|-------|---------|---------------|
| `municipio-onboarding` | Alta de nuevo municipio | `skills/municipio-onboarding/SKILL.md` |
| `azure-multiappservice-payment` | Despliegue Azure por municipio | `skills/azure-multiappservice-payment/SKILL.md` |
| `payment-gateway-webhook` | Redirect seguro, webhook, idempotencia | `skills/payment-gateway-webhook/SKILL.md` |
| `deuda-interest-calculation` | Cálculo mora y tasa configurable | `skills/deuda-interest-calculation/SKILL.md` |
| `payment-gateway-security` | Helmet, HTTPS, hardening | `skills/payment-gateway-security/SKILL.md` |
| `multiproject-workflow` | Trabajo coordinado portal + gateway | `skills/multiproject-workflow/SKILL.md` |

> ⚠️ SKILL.md files do not exist yet. Declared in AGENTS.md only.

## User-Level Skills (global — ~/.claude/skills/)

| Skill | Trigger contexts |
|-------|-----------------|
| `sdd-explore` | Investigar una idea antes de proponer un cambio |
| `sdd-propose` | Crear propuesta de cambio con intent y scope |
| `sdd-spec` | Escribir specs con escenarios Given/When/Then |
| `sdd-design` | Diseño técnico con decisiones de arquitectura |
| `sdd-tasks` | Breakdown de tareas de implementación |
| `sdd-apply` | Implementar tareas del change |
| `sdd-verify` | Validar implementación contra specs |
| `sdd-archive` | Archivar change completado |
| `judgment-day` | Review adversarial paralelo — "juzgar", "dual review" |
| `simplify` | Post-refactor: revisar calidad y eficiencia del código |
| `security-review` | Review de seguridad de cambios en la rama |
| `review` | Review de PR |
| `branch-pr` | Creación de PR con workflow issue-first |
| `issue-creation` | Crear GitHub issue |
| `skill-creator` | Crear nuevas skills de agente |
| `engram:memory` | Siempre activo — protocolo de memoria persistente |
| `claude-api` | Código que importa `anthropic` o `@anthropic-ai/sdk` |
| `update-config` | Cambios en settings.json, permisos, hooks |
| `init` | Inicializar CLAUDE.md |

## Compact Rules (for sub-agent injection)

### From AGENTS.md
- No credenciales en código fuente
- BD centralizada en `config/database.config.js`
- Municipio activo por `MUNICIPIO` env var, nunca cambio manual disperso
- Ninguna plataforma de pago habla directo con el portal (todo pasa por gateway)
- Redirect del usuario NO es fuente de verdad — solo el webhook server-to-server confirma pagos
- Idempotencia obligatoria usando `id_operacion` o `NRO_OPERACION`
- No hardcodear nombres, logos ni URLs — respetar modelo multi-municipio
- Dependencias con versión exacta (sin `^` ni `~`)
- rama `main` = producción (develop eliminado)
- `error.message` no exponer al cliente en producción
