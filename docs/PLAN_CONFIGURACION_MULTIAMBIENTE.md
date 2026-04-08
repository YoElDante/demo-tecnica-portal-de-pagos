# Configuración Multi-Ambiente

> Resumen operativo del modelo multi-municipio.
> El detalle histórico original fue archivado en `docs/_archive/PLAN_CONFIGURACION_MULTIAMBIENTE.md`.

## Estado actual

El proyecto ya fue adaptado para operar con un solo código base y múltiples municipios mediante configuración externa.

### Objetivos logrados

| Área | Estado | Resultado |
|------|--------|-----------|
| Configuración de BD | ✅ | Archivo único de conexión y credenciales por entorno |
| Municipio activo | ✅ | Selección por variable `MUNICIPIO` |
| Branding | ✅ | Recursos públicos organizados por municipio |
| Interés | ✅ Parcial | Existe soporte de configuración, falta cerrar toda la migración funcional |
| Despliegue | ✅ | Cada municipio puede vivir en su propio App Service |

## Cómo funciona

### Principios

- Un solo código base para todos los municipios.
- Credenciales y secretos fuera del repositorio.
- `config/database.config.js` como punto central de conexión.
- `config/municipalidad.config.{municipio}.js` para datos públicos y branding.
- `envs/.env.{municipio}` para trabajo local.

### Flujo mínimo de cambio de municipio

```bash
cp envs/.env.elmanzano .env
npm run dev
```

O con scripts dedicados:

```bash
npm run dev:demo
npm run dev:elmanzano
npm run dev:tinoco
npm run dev:sanjose
```

## Estructura relevante

```text
config/
  database.config.js
  index.js
  municipalidad.config.{municipio}.js

envs/
  .env.{municipio}

public/images/
  common/
  {municipio}/
```

## Variables clave

| Variable | Uso |
|----------|-----|
| `MUNICIPIO` | Selección del municipio activo |
| `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS` | Conexión Azure SQL |
| `TASA_INTERES_ANUAL` | Tasa anual configurable |
| `PAYMENT_GATEWAY` | Pasarela activa |
| `API_GATEWAY_URL` | URL del gateway de pagos |
| `FRONTEND_PUBLIC_URL` | URL pública del portal |

## Documentos relacionados

- `docs/GUIA_NUEVO_MUNICIPIO.md`
- `docs/DEPLOY_AZURE.md`
- `docs/AI_CONTEXT.md`

## Nota

Este archivo quedó como resumen operativo para consulta rápida. Si necesitás la narrativa original de la implementación por fases, ver `docs/_archive/PLAN_CONFIGURACION_MULTIAMBIENTE.md`.
