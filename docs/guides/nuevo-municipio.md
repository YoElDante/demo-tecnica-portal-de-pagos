# 🏛️ Guía: Incorporar un Nuevo Municipio

> **Propósito**: Documentar paso a paso cómo agregar un nuevo municipio al Portal de Pagos
> **Última actualización**: 2026-07-02
> **Audiencia**: Desarrolladores y personal técnico municipal

---

## 📋 Índice

1. [Resumen del Proceso](#resumen-del-proceso)
2. [Prerequisitos](#prerequisitos)
3. [Paso 1: Recolectar datos del municipio](#paso-1-recolectar-datos-del-municipio)
4. [Paso 2: Crear archivo de configuración](#paso-2-crear-archivo-de-configuración)
5. [Paso 3: Registrar el municipio](#paso-3-registrar-el-municipio)
6. [Paso 4: Crear carpeta de imágenes](#paso-4-crear-carpeta-de-imágenes)
7. [Paso 5: Crear archivo de variables de entorno](#paso-5-crear-archivo-de-variables-de-entorno)
8. [Paso 6: Agregar script de desarrollo](#paso-6-agregar-script-de-desarrollo)
9. [Paso 7: Verificar funcionamiento local](#paso-7-verificar-funcionamiento-local)
10. [Paso 8: Credenciales SIRO en el gateway](#paso-8-credenciales-siro-en-el-gateway)
11. [Paso 9: Configurar Azure App Service](#paso-9-configurar-azure-app-service)
12. [Paso 10: Desplegar](#paso-10-desplegar)
13. [Demo sin App Service propio](#demo-sin-app-service-propio)
14. [Checklist Final](#checklist-final)
15. [Troubleshooting](#troubleshooting)

---

## 🎯 Resumen del Proceso

Para incorporar un nuevo municipio llamado `{municipio}`:

| # | Acción | Archivo/Ubicación |
|---|--------|-------------------|
| 1 | Recolectar datos | Checklist de datos |
| 2 | Crear archivo de configuración | `config/municipalidad.config.{municipio}.js` |
| 3 | Registrar en array de municipios | `config/index.js` |
| 4 | Crear carpeta de imágenes | `public/images/{municipio}/` |
| 5 | Crear archivo de variables | `envs/.env.{municipio}` |
| 6 | Agregar script de desarrollo | `package.json` |
| 7 | Verificar localmente | `npm run dev:{municipio}` |
| 8 | Credenciales SIRO (gateway) | `api-gateway-pagos/.env` + Azure |
| 9 | Configurar Azure App Service | Portal de Azure |
| 10 | Desplegar | GitHub Actions / Azure CLI |

---

## ⚠️ Prerequisitos

Antes de comenzar, asegurarse de tener:

- [ ] Acceso al repositorio del proyecto
- [ ] Datos del municipio (ver checklist abajo)
- [ ] Logos del municipio (formatos: `.webp`, `.png` o `.svg`)
- [ ] Credenciales de la base de datos (Azure SQL)
- [ ] Credenciales SIRO del municipio (usuario, password, convenio)
- [ ] Acceso al Portal de Azure (para crear App Service)
- [ ] Dominio personalizado (opcional: `portal.{municipio}.gob.ar`)

---

## 📋 Paso 1: Recolectar datos del municipio

Antes de tocar código, completar esta tabla con los datos del municipio.

### Datos del config visual (`municipalidad.config.{municipio}.js`)

| Dato | Descripción | Ejemplo |
|------|-------------|---------|
| `nombre` | Nombre corto (títulos, menús) | `El Manzano` |
| `nombreCompleto` | Nombre oficial del organismo | `Comuna de El Manzano` |
| `direccion` | Sede física | `Av. J.D. Perón 571` |
| `localidad` | Ciudad o pueblo | `El Manzano` |
| `provincia` | Provincia | `Córdoba` |
| `codigoPostal` | CP IRAM | `X5107` |
| `telefono` | Teléfono principal | `+54 (3525) 493225` |
| `email` | Correo institucional | `info@municipio.gob.ar` |
| `web` | URL del sitio oficial | `https://municipio.gob.ar` |
| `tasaInteresAnual` | Porcentaje de mora | `40` |

### WhatsApp (opcional)

| Dato | Descripción |
|------|-------------|
| `habilitarBoton` | `true` / `false` |
| `telefono` | Número con código de país |
| `textoBoton` | Texto del botón |
| `mensajeInicial` | Mensaje predefinido |

### Imágenes

| Archivo | Uso | Dimensiones recomendadas |
|---------|-----|--------------------------|
| `{municipio}-logo-web.webp` | Encabezado del portal | Ancho máx. 300px, fondo transparente |
| `{municipio}-logo-ticket.webp` | Tickets/comprobantes PDF (opcional) | Ancho máx. 200px, fondo blanco |
| `{municipio}-favicon.ico` | Pestaña del navegador | 32×32px o 64×64px |

> Si solo hay un logo, usar el mismo archivo para web y ticket.

---

## 📝 Paso 2: Crear archivo de configuración

### 2.1 Copiar plantilla

```bash
cp config/municipalidad.config.demo.js config/municipalidad.config.{municipio}.js
```

### 2.2 Editar el nuevo archivo

```javascript
module.exports = {
  // ============================================
  // IDENTIFICACIÓN DEL MUNICIPIO
  // ============================================
  nombre: 'NombreCorto',
  nombreCompleto: 'Municipalidad de X',

  // ============================================
  // DATOS DE CONTACTO Y UBICACIÓN
  // ============================================
  direccion: 'Calle Principal 123',
  localidad: 'Localidad',
  provincia: 'Córdoba',
  codigoPostal: 'X5000',
  telefono: '+54 (3XX) XXX-XXXX',

  // ============================================
  // CONTACTO WHATSAPP (OPCIONAL)
  // ============================================
  contactoWhatsapp: {
    habilitarBoton: true,
    telefono: '+54 (3XX) XXX-XXXX',
    textoBoton: 'Contactanos',
    mensajeInicial: 'Hola, necesito ayuda con el portal de pagos.'
  },

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

## 📝 Paso 3: Registrar el municipio

Editar `config/index.js`, buscar `municipiosDisponibles` y agregar el nuevo municipio:

```javascript
// Municipios actuales (verificar en config/index.js antes de copiar):
const municipiosDisponibles = ['elmanzano', 'sanjosedelassalinas', 'tinoco', 'demo', 'calchinoeste', 'carrilobo', '{municipio}'];
```

---

## 📝 Paso 4: Crear carpeta de imágenes

### 4.1 Crear directorio

```bash
mkdir public/images/{municipio}
```

### 4.2 Agregar logos con nombres estandarizados

Subir a la carpeta creada:

```
public/images/{municipio}/
├── {municipio}-logo-web.webp
├── {municipio}-logo-ticket.webp  (opcional, usa logo-web si no existe)
└── {municipio}-favicon.ico
```

> 💡 **Tip**: Si no hay logos disponibles, usar los de `public/images/common/` temporalmente.

---

## 📝 Paso 5: Crear archivo de variables de entorno

### 5.1 Copiar plantilla

```bash
cp envs/.env.demo envs/.env.{municipio}
```

### 5.2 Editar el archivo

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
PAYMENT_GATEWAY=siro
API_GATEWAY_URL=https://gateway-pagos.alcaldia.com.ar
FRONTEND_PUBLIC_URL=https://portal-{municipio}.azurewebsites.net

# ============================================
# SEGURIDAD
# ============================================
WEBHOOK_SECRET=generar_secreto_unico
```

> ⚠️ **IMPORTANTE**: Nunca commitear credenciales reales al repositorio.

---

## 📝 Paso 6: Agregar script de desarrollo

Editar `package.json`, sección `scripts`:

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

## 📝 Paso 7: Verificar funcionamiento local

### 7.1 Ejecutar en modo desarrollo

```bash
npm run dev:{municipio}
```

### 7.2 Verificar en consola

Deberías ver:
```
🏛️  Municipio activo: Municipalidad de {Nombre}
🚀 Servidor corriendo en puerto 4000
```

### 7.3 Probar en navegador

- Abrir: `http://localhost:4000`
- Verificar que aparezcan los logos correctos
- Verificar que se pueda consultar un contribuyente
- Verificar que el ticket muestre los datos del municipio

---

## 📝 Paso 8: Credenciales SIRO en el gateway

El portal no habla directo con SIRO — es el **API Gateway** quien gestiona esa comunicación. Las credenciales SIRO del nuevo municipio deben configurarse en el proyecto `api-gateway-pagos`.

### Variables en el gateway (`.env` local y Azure App Service)

| Variable | Descripción |
|----------|-------------|
| `SIRO_{MUNICIPIO}_USUARIO` | Usuario API de SIRO para este municipio |
| `SIRO_{MUNICIPIO}_PASSWORD` | Contraseña API de SIRO |
| `SIRO_{MUNICIPIO}_CONVENIO` | Número de convenio SIRO |
| `SIRO_{MUNICIPIO}_BASE_URL` | URL pública del portal (`https://{municipio}.alcaldia.com.ar`) |

> `{MUNICIPIO}` va en mayúsculas: `SIRO_ELMANZANO_USUARIO`, `SIRO_TINOCO_CONVENIO`, etc.

### Ambiente de homologación (pruebas)

Credenciales de prueba compartidas: usuario `UsuarioTestApi`, password `Hola123`, convenio `5150058293`.

### CORS

Agregar la URL del portal a `CORS_ALLOWED_ORIGINS` en el Azure App Service del gateway.

---

## 📝 Paso 9: Configurar Azure App Service

### 9.1 Crear App Service

En el Portal de Azure:

1. Ir a **App Services** → **Crear**
2. Configurar:
   - **Nombre**: `portal-{municipio}`
   - **Runtime**: Node 20 LTS
   - **Plan**: B1 (básico) o superior
   - **Región**: Brazil South

### 9.2 Configurar variables de entorno

En el App Service creado, ir a **Configuración** → **Configuración de la aplicación**:

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
| `PAYMENT_GATEWAY` | `siro` |
| `FRONTEND_PUBLIC_URL` | `https://portal-{municipio}.azurewebsites.net` |

Clic en **Guardar** (reinicia la aplicación).

### 9.3 Configurar dominio personalizado (opcional)

1. Ir a **Configuración** → **Dominios personalizados**
2. Agregar dominio: `portal.{municipio}.gob.ar`
3. Configurar DNS en el proveedor (ej: DonWeb):
   - CNAME: `portal` → `portal-{municipio}.azurewebsites.net`
4. Agregar certificado SSL (Azure puede generarlo gratis)

---

## 📝 Paso 10: Desplegar

### Opción A: GitHub Actions (Recomendado)

```bash
git add .
git commit -m "feat: agregar municipio {municipio}"
git push origin main
```

### Opción B: Azure CLI

```bash
az login
az webapp deployment source config-zip \
  --resource-group rg-portales-municipales \
  --name portal-{municipio} \
  --src ./deploy.zip
```

### Opción C: VS Code + Azure Extension

1. Instalar extensión "Azure App Service"
2. Click derecho en el App Service → "Deploy to Web App"

---

## 🎭 Demo sin App Service propio

Si el municipio todavía no tiene su portal productivo pero querés mostrarlo en `demo.alcaldia.com.ar`:

1. Completar Paso 1 (datos visuales) y Paso 4 (logos)
2. En el Azure App Service de **demo**, agregar variable:
   ```
   DEMO_MUNICIPIO = {municipio}
   ```
3. El portal demo cargará el branding del municipio sin tocar las credenciales de BD.

> El mecanismo `DEMO_MUNICIPIO` está implementado en `config/index.js`: cuando `MUNICIPIO=demo` y `DEMO_MUNICIPIO` está definido, el sistema carga los datos visuales del municipio objetivo pero usa las credenciales de BD del entorno demo.

---

## ✅ Checklist Final

### Archivos creados/modificados
- [ ] `config/municipalidad.config.{municipio}.js` — Creado y completado
- [ ] `config/index.js` — Municipio agregado al array `municipiosDisponibles`
- [ ] `public/images/{municipio}/` — Carpeta creada con logos
- [ ] `envs/.env.{municipio}` — Archivo creado con credenciales (NO commitear)
- [ ] `package.json` — Script `dev:{municipio}` agregado

### Verificaciones locales
- [ ] `npm run dev:{municipio}` funciona sin errores
- [ ] Portal muestra logos correctos
- [ ] Consulta de contribuyente funciona
- [ ] Ticket muestra datos del municipio

### Gateway
- [ ] Credenciales `SIRO_{MUNICIPIO}_*` en `.env` del `api-gateway-pagos` (local)
- [ ] Credenciales `SIRO_{MUNICIPIO}_*` en Azure App Service del gateway
- [ ] URL del portal agregada a `CORS_ALLOWED_ORIGINS` del gateway

### Azure
- [ ] App Service creado (`portal-{municipio}`)
- [ ] Variables de entorno configuradas
- [ ] Dominio personalizado configurado (si aplica)
- [ ] Certificado SSL activo
- [ ] Deploy exitoso
- [ ] Portal accesible desde URL pública

### Base de datos
- [ ] BD Azure SQL creada/existente
- [ ] Tablas y datos cargados
- [ ] Conexión verificada desde App Service

### Prueba end-to-end
- [ ] Flujo completo: búsqueda de deuda → selección → pago SIRO → comprobante

---

## 🔧 Troubleshooting

### Error: "Municipio no configurado"

**Causa**: El municipio no está en `municipiosDisponibles` o no coincide con `MUNICIPIO` en `.env`.

**Solución**: Verificar que el nombre en `.env` coincida exactamente con el registrado en `config/index.js`.

### Error: "Connection refused" en BD

**Causa**: Firewall de Azure SQL no permite la conexión.

**Solución**: En Azure SQL → Redes → Agregar IP del cliente o habilitar "Permitir servicios de Azure".

### Logos no aparecen

**Causa**: Rutas incorrectas en `municipalidad.config.{municipio}.js`.

**Solución**: Verificar que las rutas comiencen con `/images/{municipio}/` y que los archivos existan.

### Variables de entorno no se cargan en Azure

**Causa**: Las variables deben estar en "Configuración de la aplicación", no en "Cadenas de conexión".

**Solución**: Mover todas las variables a la sección correcta en el Portal de Azure.

### Error 401 al crear pago en SIRO

**Causa**: Credenciales `SIRO_{MUNICIPIO}_*` no configuradas o incorrectas en el gateway.

**Solución**: Verificar las variables en el Azure App Service del gateway. Las credenciales de homologación son `UsuarioTestApi` / `Hola123` / `5150058293`.

---

## 📚 Referencias

- [CONTRACT-PORTAL-GATEWAY.md](./CONTRACT-PORTAL-GATEWAY.md) — Contrato de integración portal↔gateway
- [MUNICIPIO_CONFIG.md](../config/MUNICIPIO_CONFIG.md) — Configuración de municipios
- [DEPLOY_AZURE.md](./DEPLOY_AZURE.md) — Guía de despliegue en Azure
- [README.md](../README.md) — README principal del proyecto
