# 🏛️ Guía: Incorporar un Nuevo Municipio

> **Propósito**: Documentar paso a paso cómo agregar un nuevo municipio al Portal de Pagos  
> **Última actualización**: 2026-03-11  
> **Autor**: Documentación del proyecto  

---

## 📋 Índice

1. [Resumen del Proceso](#resumen-del-proceso)
2. [Prerequisitos](#prerequisitos)
3. [Paso 1: Crear Archivo de Configuración](#paso-1-crear-archivo-de-configuración)
4. [Paso 2: Registrar el Municipio](#paso-2-registrar-el-municipio)
5. [Paso 3: Crear Carpeta de Imágenes](#paso-3-crear-carpeta-de-imágenes)
6. [Paso 4: Crear Archivo de Variables de Entorno](#paso-4-crear-archivo-de-variables-de-entorno)
7. [Paso 5: Agregar Script de Desarrollo](#paso-5-agregar-script-de-desarrollo)
8. [Paso 6: Verificar Funcionamiento Local](#paso-6-verificar-funcionamiento-local)
9. [Paso 7: Configurar Azure App Service](#paso-7-configurar-azure-app-service)
10. [Paso 8: Desplegar](#paso-8-desplegar)
11. [Checklist Final](#checklist-final)

---

## 🎯 Resumen del Proceso

Para incorporar un nuevo municipio llamado `{municipio}`:

| # | Acción | Archivo/Ubicación |
|---|--------|-------------------|
| 1 | Crear archivo de configuración | `config/municipalidad.config.{municipio}.js` |
| 2 | Registrar en array de municipios | `config/index.js` |
| 3 | Crear carpeta de imágenes | `public/images/{municipio}/` |
| 4 | Crear archivo de variables | `envs/.env.{municipio}` |
| 5 | Agregar script de desarrollo | `package.json` |
| 6 | Verificar localmente | `npm run dev:{municipio}` |
| 7 | Configurar Azure App Service | Portal de Azure |
| 8 | Desplegar | GitHub Actions / Azure CLI |

---

## ⚠️ Prerequisitos

Antes de comenzar, asegurarse de tener:

- [ ] Acceso al repositorio del proyecto
- [ ] Datos del municipio (nombre, dirección, contacto)
- [ ] Logos del municipio (formatos: `.webp`, `.png` o `.svg`)
- [ ] Credenciales de la base de datos (Azure SQL)
- [ ] Acceso al Portal de Azure (para crear App Service)
- [ ] Dominio personalizado (opcional: `portal.{municipio}.gob.ar`)

---

## 📝 Paso 1: Crear Archivo de Configuración

### 1.1 Copiar plantilla

```bash
cp config/municipalidad.config.demo.js config/municipalidad.config.{municipio}.js
```

### 1.2 Editar el nuevo archivo

Abrir `config/municipalidad.config.{municipio}.js` y completar todos los campos:

```javascript
module.exports = {
  // ============================================
  // IDENTIFICACIÓN DEL MUNICIPIO
  // ============================================
  nombre: 'NombreCorto',                    // Se muestra en títulos
  nombreCompleto: 'Municipalidad de X',     // Nombre oficial completo

  // ============================================
  // DATOS DE CONTACTO Y UBICACIÓN
  // ============================================
  direccion: 'Calle Principal 123',
  localidad: 'Localidad',
  provincia: 'Córdoba',
  codigoPostal: 'X5000',
  telefono: '+54 (3XX) XXX-XXXX',

  // ============================================
  // IMÁGENES Y LOGOS
  // Estándar: {municipio}-logo-web, {municipio}-logo-ticket, {municipio}-favicon
  // ============================================
  logos: {
    web: '/images/{municipio}/{municipio}-logo-web.webp',
    ticket: '/images/{municipio}/{municipio}-logo-web.webp',  // Usa logo-web por defecto
    favicon: '/images/{municipio}/{municipio}-favicon.ico'
  },

  // ============================================
  // CONFIGURACIÓN DE TICKETS
  // ============================================
  ticket: {
    conceptosPorPagina: 30,
    mensajeValidez: 'Este ticket tiene validez hasta las 23:59 hs del día de emisión.',
    encabezado: 'Sistema de Pago Online',
    piePagina: 'Conserve este comprobante hasta completar su pago'
  },

  // ============================================
  // INFORMACIÓN ADICIONAL
  // ============================================
  web: 'https://{municipio}.gob.ar/',
  email: 'info@{municipio}.gob.ar',

  // ============================================
  // CONFIGURACIÓN DE NEGOCIO
  // ============================================
  tasaInteresAnual: 40  // Tasa de mora (respaldo si no está en .env)
};
```

---

## 📝 Paso 2: Registrar el Municipio

### 2.1 Editar `config/index.js`

Buscar la línea con `municipiosDisponibles` y agregar el nuevo municipio:

```javascript
// ANTES
const municipiosDisponibles = ['elmanzano', 'sanjosedelassalinas', 'tinoco', 'demo'];

// DESPUÉS
const municipiosDisponibles = ['elmanzano', 'sanjosedelassalinas', 'tinoco', 'demo', '{municipio}'];
```

---

## 📝 Paso 3: Crear Carpeta de Imágenes

### 3.1 Crear directorio

```bash
mkdir public/images/{municipio}
```

### 3.2 Agregar logos con nombres estandarizados

Subir a la carpeta creada con el siguiente formato de nombres:

| Archivo | Uso | Tamaño Recomendado |
|---------|-----|-------------------|
| `{municipio}-logo-web.webp` | Encabezado del portal | 200x80 px |
| `{municipio}-logo-ticket.webp` | PDF de deuda (opcional, usa logo-web si no existe) | 150x60 px |
| `{municipio}-favicon.ico` | Pestaña del navegador | 32x32 px |

**Ejemplo para municipio "villanueva":**
```
public/images/villanueva/
├── villanueva-logo-web.webp
├── villanueva-logo-ticket.webp  (opcional)
└── villanueva-favicon.ico
```

> 💡 **Tip**: Si no hay logos disponibles, usar los de `public/images/common/` temporalmente

---

## 📝 Paso 4: Crear Archivo de Variables de Entorno

### 4.1 Copiar plantilla

```bash
cp envs/.env.demo envs/.env.{municipio}
```

### 4.2 Editar el archivo

```env
# ============================================
# ENTORNO
# ============================================
NODE_ENV=development
PORT=4000

# ============================================
# IDENTIFICACIÓN DEL MUNICIPIO
# ============================================
MUNICIPIO={municipio}
MUNICIPIO_ID={municipio}

# ============================================
# BASE DE DATOS (Azure SQL)
# ============================================
DB_HOST=servidor.database.windows.net
DB_NAME=nombre_base_datos
DB_USER=usuario_db
DB_PASS=contraseña_segura
DB_DIALECT=mssql
DB_PORT=1433

# ============================================
# CONFIGURACIÓN DE NEGOCIO
# ============================================
TASA_INTERES_ANUAL=40

# ============================================
# PASARELA DE PAGOS
# ============================================
PAYMENT_GATEWAY=mercadopago
API_GATEWAY_URL=https://api.mercadopago.com
FRONTEND_PUBLIC_URL=https://portal-{municipio}.azurewebsites.net

# ============================================
# SEGURIDAD
# ============================================
WEBHOOK_SECRET=generar_secreto_unico
```

> ⚠️ **IMPORTANTE**: Nunca commitear credenciales reales al repositorio

---

## 📝 Paso 5: Agregar Script de Desarrollo

### 5.1 Editar `package.json`

Agregar en la sección `scripts`:

```json
{
  "scripts": {
    "dev:{municipio}": "cp envs/.env.{municipio} .env && npm run dev"
  }
}
```

Ejemplo completo de scripts:

```json
{
  "scripts": {
    "start": "node ./bin/www",
    "dev": "node --watch ./bin/www",
    "dev:demo": "cp envs/.env.demo .env && npm run dev",
    "dev:elmanzano": "cp envs/.env.elmanzano .env && npm run dev",
    "dev:{municipio}": "cp envs/.env.{municipio} .env && npm run dev",
    "testDB": "node ./tests/connection.db.test.js"
  }
}
```

---

## 📝 Paso 6: Verificar Funcionamiento Local

### 6.1 Ejecutar en modo desarrollo

```bash
npm run dev:{municipio}
```

### 6.2 Verificar en consola

Deberías ver:
```
🏛️  Municipio activo: Municipalidad de {Nombre}
🚀 Servidor corriendo en puerto 4000
```

### 6.3 Probar en navegador

- Abrir: `http://localhost:4000`
- Verificar que aparezcan los logos correctos
- Verificar que se pueda consultar un contribuyente
- Verificar que el ticket muestre los datos del municipio

---

## 📝 Paso 7: Configurar Azure App Service

### 7.1 Crear App Service

En el Portal de Azure:

1. Ir a **App Services** → **Crear**
2. Configurar:
   - **Nombre**: `portal-{municipio}`
   - **Runtime**: Node 20 LTS
   - **Plan**: B1 (básico) o superior
   - **Región**: Brazil South (más cercana a Argentina)

### 7.2 Configurar Variables de Entorno

En el App Service creado:

1. Ir a **Configuración** → **Configuración de la aplicación**
2. Agregar las siguientes variables:

| Nombre | Valor |
|--------|-------|
| `NODE_ENV` | `production` |
| `MUNICIPIO` | `{municipio}` |
| `DB_HOST` | `servidor.database.windows.net` |
| `DB_NAME` | `nombre_base_datos` |
| `DB_USER` | `usuario_db` |
| `DB_PASS` | `contraseña_segura` |
| `DB_DIALECT` | `mssql` |
| `DB_PORT` | `1433` |
| `TASA_INTERES_ANUAL` | `40` |
| `PAYMENT_GATEWAY` | `mercadopago` |
| `FRONTEND_PUBLIC_URL` | `https://portal-{municipio}.azurewebsites.net` |

3. Clic en **Guardar**

### 7.3 Configurar Dominio Personalizado (Opcional)

1. Ir a **Configuración** → **Dominios personalizados**
2. Agregar dominio: `portal.{municipio}.gob.ar`
3. Configurar DNS en el proveedor (ej: DonWeb):
   - CNAME: `portal` → `portal-{municipio}.azurewebsites.net`
4. Agregar certificado SSL (Azure puede generarlo gratis)

---

## 📝 Paso 8: Desplegar

### Opción A: GitHub Actions (Recomendado)

Si ya está configurado CI/CD:

```bash
git add .
git commit -m "feat: agregar municipio {municipio}"
git push origin main
```

El deploy se ejecutará automáticamente.

### Opción B: Azure CLI

```bash
# Login
az login

# Deploy
az webapp deployment source config-zip \
  --resource-group rg-portales-municipales \
  --name portal-{municipio} \
  --src ./deploy.zip
```

### Opción C: VS Code + Azure Extension

1. Instalar extensión "Azure App Service"
2. Click derecho en el App Service → "Deploy to Web App"
3. Seleccionar la carpeta del proyecto

---

## ✅ Checklist Final

Antes de dar por completada la incorporación:

### Archivos Creados/Modificados
- [ ] `config/municipalidad.config.{municipio}.js` - Creado y completado
- [ ] `config/index.js` - Municipio agregado al array
- [ ] `public/images/{municipio}/` - Carpeta creada con logos
- [ ] `envs/.env.{municipio}` - Archivo creado con credenciales
- [ ] `package.json` - Script de desarrollo agregado

### Verificaciones Locales
- [ ] `npm run dev:{municipio}` funciona sin errores
- [ ] Portal muestra logos correctos
- [ ] Consulta de contribuyente funciona
- [ ] Ticket muestra datos del municipio

### Azure
- [ ] App Service creado
- [ ] Variables de entorno configuradas
- [ ] Dominio personalizado configurado (si aplica)
- [ ] Certificado SSL activo
- [ ] Deploy exitoso
- [ ] Portal accesible desde URL pública

### Base de Datos
- [ ] BD Azure SQL creada/existente
- [ ] Tablas y datos cargados
- [ ] Conexión verificada desde App Service

### Documentación
- [ ] README actualizado con nuevo municipio (si aplica)
- [ ] Credenciales almacenadas en lugar seguro (Key Vault recomendado)

---

## 🔧 Troubleshooting

### Error: "Municipio no configurado"

**Causa**: El municipio no está en el array de `municipiosDisponibles`

**Solución**: Verificar que el nombre en `.env` coincida exactamente con el registrado en `config/index.js`

### Error: "Connection refused" en BD

**Causa**: Firewall de Azure SQL no permite la conexión

**Solución**: En Azure SQL → Redes → Agregar IP del cliente o habilitar "Permitir servicios de Azure"

### Logos no aparecen

**Causa**: Rutas incorrectas en `municipalidad.config.{municipio}.js`

**Solución**: Verificar que las rutas comiencen con `/images/{municipio}/` y que los archivos existan

### Variables de entorno no se cargan en Azure

**Causa**: Las variables deben estar en "Configuración de la aplicación", no en "Cadenas de conexión"

**Solución**: Mover todas las variables a la sección correcta en el Portal de Azure

---

## 📚 Referencias

- [Documentación de Azure App Service](https://docs.microsoft.com/es-es/azure/app-service/)
- [Documentación del proyecto](./README.md)
- [Configuración de BD](../config/MUNICIPIO_CONFIG.md)
- [Plan de despliegue](./DEPLOY_AZURE.md)
