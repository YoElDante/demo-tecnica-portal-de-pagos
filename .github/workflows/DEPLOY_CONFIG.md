# 🚀 Configuración de Deploy Automático

Este documento explica cómo configurar el deploy automático para un nuevo municipio en Azure App Service.

## 📋 Índice

1. [Requisitos previos](#requisitos-previos)
2. [Paso 1: Crear App Service en Azure](#paso-1-crear-app-service-en-azure)
3. [Paso 2: Descargar Publish Profile](#paso-2-descargar-publish-profile)
4. [Paso 3: Configurar Secret en GitHub](#paso-3-configurar-secret-en-github)
5. [Paso 4: Crear archivo de workflow](#paso-4-crear-archivo-de-workflow)
6. [Paso 5: Configurar variables en Azure](#paso-5-configurar-variables-en-azure)
7. [Template de workflow](#template-de-workflow)
8. [Workflows activos](#workflows-activos)
9. [Troubleshooting](#troubleshooting)

---

## Requisitos previos

- Cuenta de Azure con suscripción activa
- Acceso de administrador al repositorio en GitHub
- Permisos para crear App Services en Azure

---

## Paso 1: Crear App Service en Azure

1. Ir a [portal.azure.com](https://portal.azure.com)
2. Buscar "App Services" → **Crear**
3. Configurar:

| Campo | Valor recomendado |
|-------|-------------------|
| **Nombre** | `portal-de-pagos-{municipio}-cba` |
| **Publicar** | Código |
| **Pila de runtime** | Node 20 LTS |
| **Sistema operativo** | Linux |
| **Región** | Brazil South (o la más cercana) |
| **Plan** | Free F1 (desarrollo) o B1 (producción) |

4. Click en **Revisar y crear** → **Crear**
5. Esperar a que se complete el deploy (~2 minutos)

---

## Paso 2: Descargar Publish Profile

1. Ir al App Service recién creado
2. En el menú lateral: **Información general**
3. Click en **Descargar perfil de publicación**
4. Se descarga un archivo `.PublishSettings`

> ⚠️ **IMPORTANTE**: Este archivo contiene credenciales. NO lo subas al repositorio.

---

## Paso 3: Configurar Secret en GitHub

1. Ir al repositorio en GitHub
2. **Settings** → **Secrets and variables** → **Actions**
3. Click en **New repository secret**
4. Configurar:

| Campo | Valor |
|-------|-------|
| **Name** | `AZURE_PUBLISH_{MUNICIPIO}` (ej: `AZURE_PUBLISH_ELMANZANO`) |
| **Secret** | Pegar TODO el contenido del archivo `.PublishSettings` |

5. Click en **Add secret**

### Convención de nombres para secrets:

| Municipio | Nombre del Secret |
|-----------|-------------------|
| El Manzano | `AZURE_PUBLISH_ELMANZANO` |
| Tinoco | `AZURE_PUBLISH_TINOCO` |
| San José de las Salinas | `AZURE_PUBLISH_SANJOSE` |
| {Otro} | `AZURE_PUBLISH_{NOMBRE_SIN_ESPACIOS}` |

---

## Paso 4: Crear archivo de workflow

1. Crear archivo `.github/workflows/deploy-{municipio}.yml`
2. Usar el [template](#template-de-workflow) de abajo
3. Reemplazar los valores marcados con `{...}`
4. Hacer commit y push

---

## Paso 5: Configurar variables en Azure

En el App Service de Azure, configurar las variables de entorno:

1. Ir al App Service → **Configuración** → **Variables de entorno**
2. Agregar las siguientes variables:

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `NODE_ENV` | Ambiente | `production` |
| `PORT` | Puerto (Azure lo asigna) | `8080` |
| `DB_SERVER` | Servidor SQL | `servidor.database.windows.net` |
| `DB_NAME` | Nombre de la BD | `bd_municipio` |
| `DB_USER` | Usuario BD | `usuario` |
| `DB_PASSWORD` | Contraseña BD | `****` |
| `MUNICIPIO_ID` | ID del municipio | `elmanzano` |
| `MUNICIPIO_NOMBRE` | Nombre completo | `Municipalidad de El Manzano` |
| `TASA_INTERES_ANUAL` | Tasa de interés | `0.36` |
| `PAYMENT_GATEWAY` | Gateway de pago | `macro_click` |

3. Click en **Guardar** → **Continuar**

> 📝 Ver `config/MUNICIPIO_CONFIG.md` para la lista completa de variables.

---

## Template de workflow

Copiar este template y reemplazar los valores entre `{...}`:

```yaml
# ============================================================
# Deploy Portal de Pagos - Municipalidad de {NOMBRE_COMPLETO}
# 
# Se ejecuta automáticamente en cada push a main
# También se puede ejecutar manualmente desde GitHub Actions
#
# AUTENTICACIÓN: Publish Profile
# SECRET REQUERIDO: AZURE_PUBLISH_{MUNICIPIO_MAYUSCULAS}
# APP SERVICE: portal-de-pagos-{municipio}-cba
# URL: https://portal-de-pagos-{municipio}-cba.azurewebsites.net
# ============================================================

name: 🏛️ Deploy {Nombre Municipio}

on:
  push:
    branches:
      - main
  workflow_dispatch:

env:
  NODE_VERSION: '20.x'
  AZURE_WEBAPP_NAME: portal-de-pagos-{municipio}-cba

jobs:
  build:
    name: 📦 Build
    runs-on: ubuntu-latest
    permissions:
      contents: read

    steps:
      - name: 📥 Checkout repository
        uses: actions/checkout@v4

      - name: 🟢 Setup Node.js ${{ env.NODE_VERSION }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: 📦 Install dependencies
        run: npm ci --omit=dev

      - name: 📁 Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: node-app-{municipio}
          path: |
            .
            !.git
            !.github
            !envs
            !*.PublishSettings
            !docs/ai
          retention-days: 1

  deploy:
    name: 🚀 Deploy to Azure
    runs-on: ubuntu-latest
    needs: build
    permissions:
      contents: read

    steps:
      - name: 📥 Download artifact
        uses: actions/download-artifact@v4
        with:
          name: node-app-{municipio}

      - name: 🚀 Deploy to Azure Web App
        uses: azure/webapps-deploy@v3
        with:
          app-name: ${{ env.AZURE_WEBAPP_NAME }}
          publish-profile: ${{ secrets.AZURE_PUBLISH_{MUNICIPIO_MAYUSCULAS} }}
          package: .

      - name: ✅ Deployment complete
        run: |
          echo "=========================================="
          echo "✅ Deploy exitoso!"
          echo "🏛️ Municipio: {Nombre Completo}"
          echo "🌐 URL: https://portal-de-pagos-{municipio}-cba.azurewebsites.net"
          echo "=========================================="
```

### Valores a reemplazar:

| Placeholder | Ejemplo |
|-------------|---------|
| `{NOMBRE_COMPLETO}` | `El Manzano` |
| `{Nombre Municipio}` | `El Manzano` |
| `{municipio}` | `elmanzano` (minúsculas, sin espacios) |
| `{MUNICIPIO_MAYUSCULAS}` | `ELMANZANO` |
| `{Nombre Completo}` | `El Manzano` |

---

## Workflows activos

| Archivo | Municipio | Estado | URL |
|---------|-----------|--------|-----|
| `deploy-demo-tecnica.yml` | Demo Técnica | ✅ Activo | [alcaldiatest-xxx.azurewebsites.net](https://alcaldiatest-d9d8cafxesa2cybx.brazilsouth-01.azurewebsites.net) |
| `deploy-elmanzano.yml` | El Manzano | ⏳ Pendiente secret | [portal-de-pagos-elmanzano-cba.azurewebsites.net](https://portal-de-pagos-elmanzano-cba.azurewebsites.net) |

### Pendientes de crear:

| Municipio | Archivo | Secret |
|-----------|---------|--------|
| Tinoco | `deploy-tinoco.yml` | `AZURE_PUBLISH_TINOCO` |
| San José de las Salinas | `deploy-sanjose.yml` | `AZURE_PUBLISH_SANJOSE` |

---

## Troubleshooting

### Error: "publish-profile is not valid"

- Verificar que el secret contiene TODO el contenido del archivo `.PublishSettings`
- El contenido debe empezar con `<publishData>` y terminar con `</publishData>`

### Error: "Resource not found"

- Verificar que el nombre del App Service en Azure coincide con `AZURE_WEBAPP_NAME`
- Verificar que el App Service existe y está activo

### El deploy se completa pero la app no funciona

1. Ir a Azure Portal → App Service → **Registros de diagnóstico**
2. Habilitar **Registro de aplicaciones (sistema de archivos)**
3. Ver logs en **Flujo de registro**
4. Verificar que las variables de entorno estén configuradas correctamente

### El workflow no se ejecuta al hacer push

- Verificar que el archivo está en `.github/workflows/`
- Verificar que el trigger `push` está en `branches: [main]`
- Verificar que el archivo YAML no tiene errores de sintaxis

---

## 📞 Soporte

Para problemas con Azure: [Documentación oficial](https://docs.microsoft.com/azure/app-service/)

Para problemas con GitHub Actions: [Documentación oficial](https://docs.github.com/actions)
