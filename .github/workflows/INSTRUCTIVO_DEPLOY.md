# 🚀 Instructivo de Deploy - Portal de Pagos Municipal

> **Última actualización**: 2026-03-11  
> **Repositorio**: YoElDante/demo-tecnica-portal-de-pagos  
> **Método de autenticación**: Publish Profile (por App Service)

---

## 📋 Índice

1. [Resumen de la Arquitectura](#resumen-de-la-arquitectura)
2. [Estrategia de Ramas](#estrategia-de-ramas)
3. [Estado Actual de Deploys](#estado-actual-de-deploys)
4. [Convenciones de Nombres](#convenciones-de-nombres)
5. [Agregar un Nuevo Municipio](#agregar-un-nuevo-municipio)
6. [Template de Workflow](#template-de-workflow)
7. [Variables de Entorno en Azure](#variables-de-entorno-en-azure)
8. [Troubleshooting](#troubleshooting)

---

## 📊 Resumen de la Arquitectura

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           REPOSITORIO ÚNICO                                  │
│                 github.com/YoElDante/demo-tecnica-portal-de-pagos            │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   RAMA: main                              RAMA: develop                      │
│   (producción)                            (desarrollo/staging)               │
│        │                                        │                            │
│        │ push                                   │ push                       │
│        ▼                                        ▼                            │
│   ┌─────────────────────┐              ┌─────────────────────┐               │
│   │ deploy-elmanzano.yml│              │  deploy-demo.yml    │               │
│   │ deploy-tinoco.yml   │              │                     │               │
│   │ deploy-sanjose.yml  │              │                     │               │
│   │ (futuros)           │              │                     │               │
│   └─────────┬───────────┘              └──────────┬──────────┘               │
│             │                                     │                          │
└─────────────┼─────────────────────────────────────┼──────────────────────────┘
              │                                     │
              ▼                                     ▼
┌─────────────────────────┐          ┌─────────────────────────┐
│   AZURE - El Manzano    │          │   AZURE - Demo          │
│   ─────────────────     │          │   ─────────────────     │
│   App: portal-de-pagos- │          │   App: portal-demo-     │
│        elmanzano-cba    │          │        alcaldia         │
│   URL: elmanzano.       │          │   URL: demo.alcaldia    │
│        alcaldia.com.ar  │          │        .com.ar          │
│   NODE_ENV: production  │          │   NODE_ENV: development │
└─────────────────────────┘          └─────────────────────────┘
```

**Concepto clave**: 
- Rama `main` → Producción (municipios reales)
- Rama `develop` → Desarrollo/Staging (demo para pruebas)

---

## 🌿 Estrategia de Ramas

### Estructura

```
main (producción)
│
│   ← Solo recibe merges de develop cuando el código está probado
│   ← Dispara deploy a: elmanzano, tinoco, sanjose (producción)
│
└── develop (staging)
      │
      │   ← Rama principal de trabajo diario
      │   ← Dispara deploy a: demo.alcaldia.com.ar
      │
      ├── feature/nueva-funcionalidad
      ├── fix/corregir-bug
      └── refactor/mejorar-codigo
```

### Flujo de trabajo simplificado

```bash
# 1. Siempre trabajar desde develop
git checkout develop
git pull origin develop

# 2. Crear feature branch (opcional para cambios pequeños)
git checkout -b feature/mi-cambio

# 3. Trabajar y commitear
git add . && git commit -m "feat: descripción"

# 4. Mergear a develop y subir → despliega en demo
git checkout develop
git merge feature/mi-cambio
git push origin develop

# 5. Probar en https://demo.alcaldia.com.ar

# 6. Cuando está listo → pasar a producción
git checkout main
git merge develop
git push origin main  # ⚡ Despliega en producción
```

> 📖 Guía completa: [docs/GUIA_RAMAS.md](../../docs/GUIA_RAMAS.md)

---

## ✅ Estado Actual de Deploys

| Workflow | Rama | Municipio | App Service | Secret | URL |
|----------|------|-----------|-------------|--------|-----|
| `deploy-elmanzano.yml` | `main` | El Manzano | `portal-de-pagos-elmanzano-cba` | `AZURE_PUBLISH_ELMANZANO` | [elmanzano.alcaldia.com.ar](https://elmanzano.alcaldia.com.ar) |
| `deploy-demo.yml` | `develop` | Demo | `portal-demo-alcaldia` | `AZURE_PUBLISH_DEMO` | [demo.alcaldia.com.ar](https://demo.alcaldia.com.ar) |

### Secrets configurados en GitHub

Ubicación: https://github.com/YoElDante/demo-tecnica-portal-de-pagos/settings/secrets/actions

| Secret | Para | Contenido |
|--------|------|-----------|
| `AZURE_PUBLISH_ELMANZANO` | El Manzano | Contenido de `portal-de-pagos-elmanzano-cba.PublishSettings` |
| `AZURE_PUBLISH_DEMO` | Demo | Contenido de `portal-demo-alcaldia.PublishSettings` |

> ⚠️ **Los secrets NO cambian al usar ramas.** El Publish Profile autentica contra el App Service, independiente de la rama.

### Pendientes de crear (futuros municipios)

| Municipio | Workflow | Rama | Secret |
|-----------|----------|------|--------|
| Tinoco | `deploy-tinoco.yml` | `main` | `AZURE_PUBLISH_TINOCO` |
| San José de las Salinas | `deploy-sanjose.yml` | `main` | `AZURE_PUBLISH_SANJOSE` |

---

## 📝 Convenciones de Nombres

### Archivos de Workflow
```
.github/workflows/deploy-{identificador}.yml
```

| Municipio | Archivo |
|-----------|---------|
| El Manzano | `deploy-elmanzano.yml` |
| Demo | `deploy-demo.yml` |
| Tinoco (futuro) | `deploy-tinoco.yml` |
| San José (futuro) | `deploy-sanjose.yml` |

### Secrets de GitHub
```
AZURE_PUBLISH_{IDENTIFICADOR_MAYUSCULAS}
```

| Municipio | Secret |
|-----------|--------|
| El Manzano | `AZURE_PUBLISH_ELMANZANO` |
| Demo | `AZURE_PUBLISH_DEMO` |
| Tinoco (futuro) | `AZURE_PUBLISH_TINOCO` |
| San José (futuro) | `AZURE_PUBLISH_SANJOSE` |

### App Services en Azure

Los nombres de App Service los define cada cuenta Azure. Ejemplos actuales:

| Municipio | App Service |
|-----------|-------------|
| El Manzano | `portal-de-pagos-elmanzano-cba` |
| Demo | `portal-demo-alcaldia` |

### Archivos de Publish Profile (local - NO commitear)

```
.github/perfiles de publicacion/{nombre-app-service}.PublishSettings
```

> ⚠️ **IMPORTANTE**: Los archivos `.PublishSettings` contienen credenciales. 
> - NO se suben al repositorio (verificar `.gitignore`)
> - Guardarlos en lugar seguro después de crear el secret
> - Pueden regenerarse desde Azure Portal si se pierden

---

## 🆕 Agregar un Nuevo Municipio

### Paso 1: Crear App Service en Azure

1. Ir a [portal.azure.com](https://portal.azure.com) con la cuenta del municipio
2. **App Services** → **Crear**
3. Configurar:

| Campo | Valor |
|-------|-------|
| **Nombre** | `portal-de-pagos-{municipio}-cba` (o el que prefiera el cliente) |
| **Runtime** | Node 20 LTS |
| **Sistema operativo** | Linux |
| **Región** | Brazil South |
| **Plan** | B1 (producción) o F1 (pruebas) |

4. **Revisar y crear** → **Crear**

### Paso 2: Descargar Publish Profile

1. Ir al App Service creado
2. **Información general** → **Descargar perfil de publicación**
3. Guardar el archivo `.PublishSettings` localmente (NO commitear)

### Paso 3: Crear Secret en GitHub

1. Ir a https://github.com/YoElDante/demo-tecnica-portal-de-pagos/settings/secrets/actions
2. **New repository secret**
3. **Name**: `AZURE_PUBLISH_{MUNICIPIO_MAYUSCULAS}` (ej: `AZURE_PUBLISH_TINOCO`)
4. **Secret**: Pegar TODO el contenido del `.PublishSettings` (desde `<publishData>` hasta `</publishData>`)
5. **Add secret**

### Paso 4: Crear Workflow

Crear archivo `.github/workflows/deploy-{municipio}.yml` usando el [template](#template-de-workflow).

Valores a modificar:
- Encabezado con datos del municipio
- `name:` - Nombre que aparece en GitHub Actions
- `AZURE_WEBAPP_NAME:` - Nombre exacto del App Service
- `name: node-app-{municipio}` - Identificador único del artifact
- `publish-profile: ${{ secrets.AZURE_PUBLISH_{MUNICIPIO} }}` - Nombre del secret

### Paso 5: Configurar Variables en Azure

En el App Service → **Configuración** → **Variables de entorno**:

| Variable | Valor |
|----------|-------|
| `NODE_ENV` | `production` |
| `MUNICIPIO` | `{municipio}` |
| `DB_HOST` | `servidor.database.windows.net` |
| `DB_NAME` | `nombre_bd` |
| `DB_USER` | `usuario` |
| `DB_PASS` | `contraseña` |
| `DB_DIALECT` | `mssql` |
| `DB_PORT` | `1433` |
| `TASA_INTERES_ANUAL` | `40` |

> 📝 La variable `MUNICIPIO` debe coincidir con el nombre del archivo `config/municipalidad.config.{municipio}.js`

### Paso 6: Push y Verificar

```bash
git add .github/workflows/deploy-{municipio}.yml
git commit -m "feat: agregar deploy para {municipio}"
git push origin main
```

Verificar en: https://github.com/YoElDante/demo-tecnica-portal-de-pagos/actions

---

## 📄 Template de Workflow

```yaml
# ============================================================
# Deploy Portal de Pagos - {NOMBRE_COMPLETO}
# 
# Se ejecuta automáticamente en cada push a main
# También se puede ejecutar manualmente desde GitHub Actions
#
# AUTENTICACIÓN: Publish Profile
# SECRET REQUERIDO: AZURE_PUBLISH_{IDENTIFICADOR}
# APP SERVICE: {nombre-app-service}
# URL: https://{nombre-app-service}.azurewebsites.net
# ============================================================

name: 🏛️ Deploy {Nombre}

on:
  push:
    branches:
      - main
  workflow_dispatch:

env:
  NODE_VERSION: '20.x'
  AZURE_WEBAPP_NAME: {nombre-app-service}

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
          name: node-app-{identificador}
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
          name: node-app-{identificador}

      - name: 🚀 Deploy to Azure Web App
        uses: azure/webapps-deploy@v3
        with:
          app-name: ${{ env.AZURE_WEBAPP_NAME }}
          publish-profile: ${{ secrets.AZURE_PUBLISH_{IDENTIFICADOR} }}
          package: .

      - name: ✅ Deployment complete
        run: |
          echo "=========================================="
          echo "✅ Deploy exitoso!"
          echo "🏛️ Municipio: {Nombre}"
          echo "🌐 URL: https://{nombre-app-service}.azurewebsites.net"
          echo "=========================================="
```

### Placeholders a reemplazar:

| Placeholder | Ejemplo El Manzano | Ejemplo Demo |
|-------------|-------------------|--------------|
| `{NOMBRE_COMPLETO}` | `Municipalidad de El Manzano` | `Demo Alcaldía` |
| `{Nombre}` | `El Manzano` | `Demo` |
| `{identificador}` | `elmanzano` | `demo` |
| `{IDENTIFICADOR}` | `ELMANZANO` | `DEMO` |
| `{nombre-app-service}` | `portal-de-pagos-elmanzano-cba` | `portal-demo-alcaldia` |

---

## ⚙️ Variables de Entorno en Azure

### Variables Requeridas

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `NODE_ENV` | Ambiente de ejecución | `production` |
| `MUNICIPIO` | ID del municipio (coincide con config) | `elmanzano` |
| `DB_HOST` | Servidor de BD Azure SQL | `servidor.database.windows.net` |
| `DB_NAME` | Nombre de la BD | `portal_elmanzano` |
| `DB_USER` | Usuario de BD | `admin_portal` |
| `DB_PASS` | Contraseña de BD | `*****` |
| `DB_DIALECT` | Tipo de BD | `mssql` |
| `DB_PORT` | Puerto de BD | `1433` |

### Variables Opcionales

| Variable | Descripción | Default en código |
|----------|-------------|-------------------|
| `PORT` | Puerto (Azure lo asigna automáticamente) | `3000` |
| `TASA_INTERES_ANUAL` | Tasa de mora (%) | `40` |
| `PAYMENT_GATEWAY` | Pasarela de pago | `mercadopago` |

### Cómo configurar en Azure

1. Ir al App Service en Azure Portal
2. Menú lateral: **Configuración** → **Variables de entorno** (o **Configuración de la aplicación** en versiones anteriores)
3. Agregar cada variable con su valor (botón **+ Agregar**)
4. **Guardar** → **Continuar** (reinicia la aplicación)

---

## 🔧 Troubleshooting

### ❌ Error: "publish-profile is not valid"

**Causa**: El secret está mal configurado o corrupto

**Solución**:
1. Verificar que el contenido del secret empiece con `<publishData>` y termine con `</publishData>`
2. No debe haber espacios ni saltos de línea adicionales al inicio/final
3. Si sigue fallando, regenerar el Publish Profile desde Azure:
   - App Service → Información general → **Restablecer perfil de publicación**
   - Descargar nuevo perfil y actualizar el secret

### ❌ Error: "Resource not found" o "App not found"

**Causa**: El nombre del App Service no coincide

**Solución**:
1. Verificar que `AZURE_WEBAPP_NAME` en el workflow sea EXACTAMENTE igual al nombre en Azure
2. Verificar que el App Service existe y está activo (no pausado/eliminado)
3. El Publish Profile debe ser del mismo App Service

### ❌ Deploy exitoso pero la app muestra error

**Causa**: Variables de entorno mal configuradas

**Solución**:
1. Azure Portal → App Service → **Centro de implementación** → Ver logs de deploy
2. App Service → **Registros** → **Flujo de registro** (ver errores en tiempo real)
3. Verificar que:
   - `MUNICIPIO` coincide con el archivo `config/municipalidad.config.{MUNICIPIO}.js`
   - Las credenciales de BD son correctas
   - El firewall de Azure SQL permite conexiones desde App Services

### ❌ El workflow no se ejecuta al hacer push

**Causa**: Problema con el trigger o el archivo

**Solución**:
1. Verificar que el archivo esté en `.github/workflows/` (con `.yml`)
2. Verificar sintaxis YAML (sin tabs, indentación correcta)
3. Verificar que el push sea a la rama `main`
4. GitHub → Actions → Ver si hay workflows deshabilitados o con errores

### ❌ Error de conexión a Base de Datos

**Causa**: Firewall de Azure SQL bloquea la conexión

**Solución**:
1. Azure Portal → SQL Server (no la BD, el servidor) → **Redes**
2. Habilitar **"Permitir que los servicios y recursos de Azure accedan a este servidor"**
3. Guardar cambios
4. Reiniciar el App Service

---

## 📁 Estructura de Archivos de Deploy

```
.github/
├── workflows/
│   ├── deploy-demo.yml           # Workflow para Demo
│   ├── deploy-elmanzano.yml      # Workflow para El Manzano
│   └── INSTRUCTIVO_DEPLOY.md     # Este archivo
└── perfiles de publicacion/      # NO commitear, solo referencia local
    ├── portal-demo-alcaldia.PublishSettings
    └── portal-de-pagos-elmanzano-cba.PublishSettings
```

---

## 📚 Referencias

- [Documentación Azure App Service](https://docs.microsoft.com/azure/app-service/)
- [Documentación GitHub Actions](https://docs.github.com/actions)
- [azure/webapps-deploy Action](https://github.com/Azure/webapps-deploy)
- [Guía para agregar nuevo municipio](../../docs/GUIA_NUEVO_MUNICIPIO.md)
- [Configuración de municipios](../../config/MUNICIPIO_CONFIG.md)
