# Portal de Pagos Municipal - AGENTS

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
11. Todo trabajo nuevo parte desde `develop`. Nunca commitear codigo en `main` directamente.
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

## Comandos de Trabajo

```bash
npm install
npm run dev
npm run dev:demo
npm run dev:elmanzano
npm run dev:tinoco
npm run dev:sanjose
npm run testDB
```

## Documentos Fuente

- `README.md`: onboarding general del proyecto
- `docs/README.md`: indice de documentacion
- `docs/AI_CONTEXT.md`: contexto compacto y estado del sistema
- `docs/PLAN_CONFIGURACION_MULTIAMBIENTE.md`: resumen operativo multi-municipio
- `docs/CONTRACT-PORTAL-GATEWAY.md`: contrato con el gateway de pagos
- `docs/GUIA_NUEVO_MUNICIPIO.md`: incorporacion de nuevos municipios
- `docs/DEPLOY_AZURE.md`: despliegue en Azure App Service
- `docs/PENDIENTE_SEGURIDAD.md`: resumen operativo de hardening
- `docs/bd/LOGICA_DEUDAS_PAGOS.md`: logica de deuda, mora y registracion

## Skills Disponibles

| Skill | Uso | Ruta |
| --- | --- | --- |
| `municipio-onboarding` | Alta de un nuevo municipio | `skills/municipio-onboarding/SKILL.md` |
| `azure-multiappservice-payment` | Despliegue por municipio en Azure | `skills/azure-multiappservice-payment/SKILL.md` |
| `payment-gateway-webhook` | Redirect seguro, webhook e idempotencia | `skills/payment-gateway-webhook/SKILL.md` |
| `deuda-interest-calculation` | Calculo de mora y tasa configurable | `skills/deuda-interest-calculation/SKILL.md` |
| `payment-gateway-security` | Helmet, HTTPS y hardening | `skills/payment-gateway-security/SKILL.md` |
| `multiproject-workflow` | Trabajo coordinado portal + gateway | `skills/multiproject-workflow/SKILL.md` |

## Flujo SDD Recomendado

1. Revisar el PRD y la spec relevante en `openspec/specs`.
2. Si el cambio no existe, crear un nuevo directorio en `openspec/changes/<nombre-del-cambio>/`.
3. Definir `proposal.md`, `design.md` y `tasks.md` antes de implementar.
4. Crear rama `feature/<nombre-del-cambio>` desde `develop` actualizado.
5. Implementar respetando las reglas globales y las skills aplicables.
6. Mergear a `develop`, validar en demo, luego mergear a `main` para produccion.
7. Actualizar la documentacion de producto si cambia comportamiento funcional.

Ver flujo completo en `docs/GUIA_RAMAS.md`.