# Documentacion del Portal de Pagos

## Punto de entrada

Si es tu primera vez en el proyecto, lee primero `docs/AI_CONTEXT.md`. Ese archivo resume arquitectura, estado actual, riesgos y rutas útiles.

## Quiero...

- Entender el proyecto rápido: `docs/AI_CONTEXT.md`
- Implementar o revisar pagos: `docs/CONTRACT-PORTAL-GATEWAY.md` y `docs/INTEGRACION_PAGOS.md`
- Entender deuda, mora y registración: `docs/bd/LOGICA_DEUDAS_PAGOS.md`
- Agregar un municipio nuevo: `docs/GUIA_NUEVO_MUNICIPIO.md`
- Desplegar en Azure: `docs/DEPLOY_AZURE.md`
- Ver el esquema multi-municipio actual: `docs/PLAN_CONFIGURACION_MULTIAMBIENTE.md`
- Revisar flujo de ramas: `docs/GUIA_RAMAS.md`
- Coordinar portal + gateway: `docs/integracion/GUIA_INTEGRACION_MULTIPROYECTO.md`

## Mapa por categoria

### Core

| Documento | Uso |
|-----------|-----|
| `AI_CONTEXT.md` | Contexto corto para IA y nuevos devs |
| `CONTRACT-PORTAL-GATEWAY.md` | Contrato fuente de verdad entre portal y gateway con SIRO |
| `INTEGRACION_PAGOS.md` | Flujo vivo de integración con SIRO / Banco Roela |
| `bd/LOGICA_DEUDAS_PAGOS.md` | Reglas de deuda, mora y registración |

### Operacion

| Documento | Uso |
|-----------|-----|
| `DEPLOY_AZURE.md` | Despliegue por municipio en App Service |
| `GUIA_NUEVO_MUNICIPIO.md` | Onboarding de un nuevo municipio |
| `PLAN_CONFIGURACION_MULTIAMBIENTE.md` | Resumen operativo del modelo multi-municipio |
| `PENDIENTE_SEGURIDAD.md` | Resumen de hardening pendiente |
| `GUIA_RAMAS.md` | Flujo de ramas del proyecto |

### Integracion

| Documento | Uso |
|-----------|-----|
| `integracion/GUIA_INTEGRACION_MULTIPROYECTO.md` | Trabajo coordinado entre repos y contratos |

### Historico

Los documentos que ya no son referencia viva fueron movidos a `docs/_archive/`.
El material de MercadoPago quedó archivado para consulta histórica.

## Orden de lectura recomendado

1. `docs/AI_CONTEXT.md`
2. Según tarea: pagos, deuda, despliegue o municipios
3. `openspec/specs/` y `openspec/changes/` si el cambio afecta comportamiento
