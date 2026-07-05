# Portal de Pagos Municipal - AGENTS

## Modelo de IA preferente

**Preferencia: OpenCode.** Solo utilizar GitHub Copilot cuando se solicite explícitamente.

---

## Protocolo de Memoria Persistente (Engram) — OBLIGATORIO

Toda decisión, bug fix, descubrimiento técnico, o cambio de arquitectura DEBE guardarse
en Engram INMEDIATAMENTE después de ocurrir, no al final de la sesión.

**Auto-check después de CADA acción:** "¿Descubrí un bug, arreglé algo, tomé una decisión
de diseño, o aprendí algo no obvio?" → `mem_save` AHORA.

**Casos concretos que requieren save:**
- Un `require()` falla silenciosamente y causa comportamiento incorrecto
- Se encuentra una diferencia entre el código documentado y el real
- Se arregla un archivo para que el pipeline de producción funcione
- Se descubre una tabla sin PK que rompe Sequelize
- Se modifica un archivo de configuración o arquitectura
- Se completa una fase SDD (explore, propose, spec, design, tasks, apply, archive)

**Al final de cada sesión:** `mem_session_summary` con el formato Goal/Instructions/Discoveries/Accomplished/Next Steps/RelevantFiles.

**No esperar al final. Cada hallazgo se guarda en el momento.**

---

## Entrada Rapida Para Orquestador Multi-Repo

Si este repositorio se analiza desde un agente de nivel superior que coordina Portal + Gateway, usar esta ruta minima antes de explorar el resto del proyecto.

### Objetivo

- Reducir consumo de tokens.
- Evitar lectura completa innecesaria.
- Enfocar rapido en contrato de integracion, app settings y ticket_number.

### Ruta Minima de Lectura (orden obligatorio)

1. `docs/integration/checklist-appsettings.md`
2. `docs/integration/contract-portal-gateway.md`
3. `openspec/changes/ticket-payment-tracking/proposal.md`
4. `openspec/changes/ticket-payment-tracking/design.md`
5. `openspec/changes/ticket-payment-tracking/tasks.md`

### Regla de Economia de Contexto

- No leer todo `docs/` ni todo `openspec/` al inicio.
- Ir al codigo solo despues de cerrar contrato y tareas del cambio.
- Si la tarea es de conexion portal-gateway o numeracion de ticket, priorizar siempre la ruta minima.

## Objetivo del Proyecto

Este repositorio implementa un portal web municipal para consultar deudas por DNI, generar tickets de pago y procesar pagos mediante una pasarela externa. El mismo codigo base debe soportar multiples municipios, diferenciados por configuracion y variables de entorno.

## Stack y Arquitectura

- Runtime: Node.js 20+
- Framework: Express
- ORM: Sequelize
- Base de datos: Azure SQL con driver `tedious`
- Frontend: EJS server-side rendering + JS vanilla
- Arquitectura: MVC con capa de services
- Operacion: enfoque 12-factor, configuracion via entorno

## Reglas Globales

1. Toda credencial debe vivir fuera del codigo fuente.
2. La configuracion de base de datos debe centralizarse en `config/database.config.js`.
3. Los datos publicos por municipio deben vivir en `config/municipalidad.config.{municipio}.js`.
4. El municipio activo se selecciona por `MUNICIPIO` y nunca por cambios manuales dispersos.
5. Ninguna plataforma de pago debe hablar directo con el portal; todo pago pasa por un gateway intermedio.
6. El redirect del usuario nunca es fuente de verdad para la base de datos; solo el webhook server-to-server puede confirmar pagos.
7. Todo procesamiento de pago debe ser idempotente usando `id_operacion` o `NRO_OPERACION`.
8. Los tickets tienen validez limitada porque los intereses cambian diariamente.
9. Todo cambio nuevo debe respetar el modelo multi-municipio y no hardcodear nombres, logos o URLs.
10. Antes de implementar una feature relevante, revisar `openspec/specs` y trabajar con `openspec/changes`.
11. La rama principal de trabajo es `develop`. La rama `main` es producción y solo recibe merges aprobados desde `develop`.
12. `.env` y `envs/` no se versionan ni se usan como mecanismo de promocion entre ramas; demo y produccion se configuran por entorno.
13. Las dependencias npm se declaran con version exacta (sin `^` ni `~`) para evitar actualizaciones no controladas.
14. No actualizar dependencias en repositorios estables salvo necesidad de seguridad o correccion critica, y siempre con validacion explicita.

## Convenciones de Dominio

- `CodMovim`: `H` representa deuda/haber, `D` representa cobro/debe.
- `TIPO_BIEN` usa codigos de cuatro caracteres como `AUAU`, `ININ`, `CICI`, `OBSA`, `CACA`, `CEM1`, `PEPE`.
- El registro contable correcto al pagar implica actualizar deuda y registrar cobro, no una sola de las dos acciones.
- La tasa de interes debe ser configurable por municipio o por entorno; no debe quedar hardcodeada como decision permanente.

## Restricciones de Implementacion

- Mantener cambios pequeños y orientados a la raiz del problema.
- No duplicar documentacion existente; enlazarla desde skills o specs.
- No introducir dependencias nuevas sin justificar impacto operativo.
- No asumir que todos los municipios comparten mismas credenciales, cuentas de pago o branding.
- Al agregar dependencias nuevas, fijar una version confiable y estable de forma exacta.

## Qué NO hace

- No procesa pagos directamente — delega al API Gateway
- No guarda credenciales bancarias ni hash de SIRO
- No se comunica directamente con SIRO ni ninguna plataforma de pago
- No envía emails ni notificaciones al contribuyente
- No accede a BD de otros municipios

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

## Convenciones de Código (Code Style)

Estas reglas tienen **prioridad absoluta** sobre cualquier inferencia del modelo de IA.

### Comentarios — PERMITIDOS y REQUERIDOS

- Los comentarios en el código fuente están **permitidos y son bienvenidos** en todos los archivos.
- Los comentarios JSDoc (`/** ... */`) son **requeridos** en funciones públicas, middlewares y services.
- Los section headers (`// --- Sección ---`) son **permitidos** en archivos complejos para mejorar la legibilidad.
- Los inline comments que explican lógica no obvia son **requeridos**, no opcionales.
- **Nunca eliminar comentarios existentes** salvo que el código que explican sea eliminado.
- **Excepción de seguridad**: si un comentario expone literalmente un secret, credencial, hash o token real, reemplazar el valor literal por una descripción genérica (ej. `<secret>`, `<hash>`) pero mantener el comentario.

### Credenciales

- Ninguna credencial, hash, token o secret real debe aparecer en comentarios ni en código fuente.
- Los comentarios pueden mencionar el *propósito* de un secret pero nunca su valor.

### Dependencias

- Fijar versiones exactas (sin `^` ni `~`).

---

## Comandos de Trabajo

```bash
npm install
npm test                # (placeholder — test suite pendiente)
npm run dev
npm run dev:demo
npm run dev:elmanzano
npm run dev:tinoco
npm run dev:sanjose
npm run dev:calchinoeste
npm run testDB
```

## Mapa de Documentacion

> **Índice maestro**: `docs/README.md` — todos los documentos del proyecto con badges de frescura.

### Ruta minima para agentes de IA

Antes de tocar codigo, leer en este orden:

1. **`docs/ai-context.md`** — contexto compacto (stack, arquitectura, riesgos, quick-start)
2. **`docs/GLOSSARY.md`** — terminos de dominio (CodMovim, TIPO_BIEN, estados, seguridad)
3. **Skill relevante** segun la tarea (ver [Skills Disponibles](#skills-disponibles))
4. **OpenSpec spec** del area afectada (`openspec/specs/{area}/spec.md`)

### Documentos clave por area

> Antes de crear o modificar documentacion, consultar `docs/AGENTS.md` para convenciones de nombres, carpetas y proceso.

| Area | Documento principal |
|------|---------------------|
| Onboarding general | `docs/ai-context.md` |
| Glosario de dominio | `docs/GLOSSARY.md` |
| Contrato portal↔gateway | `docs/integration/contract-portal-gateway.md` |
| Logica de deuda y pagos | `docs/domain/logica-deudas-pagos.md` |
| Alta de municipio | `docs/guides/nuevo-municipio.md` |
| Despliegue Azure | `docs/guides/deploy-azure.md` |
| Runbook / troubleshooting | `docs/guides/runbook.md` |
| Decisiones de arquitectura | `docs/architecture/adr.md` |
| Ramas y flujo git | `docs/guides/guia-ramas.md` |
| Seguridad / hardening | `docs/architecture/security-pending.md` |
| Indice maestro completo | `docs/README.md` |
| Convenciones de documentacion | `docs/AGENTS.md` |

### Archivo historico

Documentacion obsoleta en `docs/_archive/`. No usar como referencia operativa.
Estructura espeja la de `docs/`: `_archive/architecture/`, `_archive/domain/`, `_archive/guides/`, `_archive/integration/`.

## Skills Disponibles

| Skill | Uso | Ruta |
| --- | --- | --- |
| `doc-conventions` | Crear, mover o archivar documentacion en `/docs` | `skills/doc-conventions/SKILL.md` |
| `municipio-onboarding` | Alta de un nuevo municipio | `skills/municipio-onboarding/SKILL.md` |
| `azure-multiappservice-payment` | Despliegue por municipio en Azure | `skills/azure-multiappservice-payment/SKILL.md` |
| `payment-gateway-webhook` | Redirect seguro, webhook e idempotencia | `skills/payment-gateway-webhook/SKILL.md` |
| `deuda-interest-calculation` | Calculo de mora y tasa configurable | `skills/deuda-interest-calculation/SKILL.md` |
| `payment-gateway-security` | Helmet, HTTPS y hardening | `skills/payment-gateway-security/SKILL.md` |
| `multiproject-workflow` | Trabajo coordinado portal + gateway | `skills/multiproject-workflow/SKILL.md` |

## Flujo SDD Recomendado

El proyecto usa SDD (Spec-Driven Development) con 9 fases automatizadas. Para cambios nuevos usar `/sdd-new <nombre>`.

Ver guía completa en [`docs/guides/guia-sdd.md`](docs/guides/guia-sdd.md) y política de documentación en [`docs/architecture/politica-documentacion.md`](docs/architecture/politica-documentacion.md).