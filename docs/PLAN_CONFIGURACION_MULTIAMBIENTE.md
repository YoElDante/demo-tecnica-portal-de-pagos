# Plan de Configuración Multi-Ambiente

> **Portal de Pagos Municipal - Preparación para Producción**  
> **Versión:** 1.0  
> **Fecha:** Marzo 2026  
> **Autor:** Equipo de Desarrollo  
> **Estado:** 📋 PLANIFICADO

---

## 📋 Índice

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Situación Actual](#2-situación-actual)
3. [Arquitectura Objetivo](#3-arquitectura-objetivo)
4. [Plan de Implementación](#4-plan-de-implementación)
5. [Detalle de Variables de Entorno](#5-detalle-de-variables-de-entorno)
6. [Estructura de Archivos](#6-estructura-de-archivos)
7. [Guía de Despliegue en Azure](#7-guía-de-despliegue-en-azure)
8. [Alta de Nuevo Municipio](#8-alta-de-nuevo-municipio)
9. [Checklist de Implementación](#9-checklist-de-implementación)
10. [Consideraciones de Seguridad](#10-consideraciones-de-seguridad)

---

## 1. Resumen Ejecutivo

### Objetivo

Preparar el portal de pagos para funcionar en **múltiples instancias de Azure App Service**, donde cada instancia corresponde a un municipio diferente, configurado exclusivamente mediante **variables de entorno**.

### Beneficios

| Beneficio | Descripción |
|-----------|-------------|
| **Seguridad** | Credenciales fuera del código fuente |
| **Escalabilidad** | Soporte para 10, 50 o más municipios |
| **Mantenibilidad** | Un solo código base para todos los municipios |
| **Independencia** | Cada App Service funciona de forma autónoma |
| **Flexibilidad** | Configuración diferente por entorno (dev/test/prod) |

### Alcance

- ✅ Estandarizar configuración de base de datos
- ✅ Parametrizar tasa de interés por municipio
- ✅ Organizar recursos visuales (logos, imágenes)
- ✅ Preparar para múltiples pasarelas de pago
- ✅ Documentar proceso de despliegue

---

## 2. Situación Actual

### 2.1 Problemas Detectados

```
┌─────────────────────────────────────────────────────────────────┐
│  ⚠️  PROBLEMAS DE SEGURIDAD Y MANTENIBILIDAD                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Credenciales hardcodeadas en código                         │
│     └── database.config.manzano.js (línea 13)                   │
│                                                                 │
│  2. Host y nombre de BD hardcodeados                            │
│     └── database.config.sanjosedelassalinas.js (líneas 12-13)   │
│                                                                 │
│  3. Múltiples archivos de configuración de BD                   │
│     └── Dificulta mantenimiento y aumenta riesgo de errores     │
│                                                                 │
│  4. Tasa de interés hardcodeada                                 │
│     └── deudas.service.js (línea 17): TASA_INTERES_ANUAL = 40   │
│                                                                 │
│  5. Archivos .env con credenciales en repositorio               │
│     └── .env, .env.manzano, .env.sanjosedelassalinas            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Arquitectura Actual de Configuración

```
config/
├── index.js                              ← Selector de municipio (OK)
├── database.config.manzano.js            ← ❌ Credenciales hardcodeadas
├── database.config.sanjosedelassalinas.js ← ⚠️ Parcialmente parametrizado
├── database.config.tinoco.js             ← ✅ Todo desde variables de entorno
├── municipalidad.config.manzano.js       ← ✅ Datos públicos (OK)
├── municipalidad.config.sanjosedelassalinas.js
└── municipalidad.config.tinoco.js
```

### 2.3 Inconsistencias en Archivos de BD

| Archivo | Host | DB_NAME | Usuario | Contraseña | Estado |
|---------|------|---------|---------|------------|--------|
| `database.config.manzano.js` | Hardcodeado | Hardcodeado | Hardcodeado | Hardcodeado | ❌ |
| `database.config.sanjosedelassalinas.js` | Hardcodeado | Hardcodeado | Variable | Variable | ⚠️ |
| `database.config.tinoco.js` | Variable | Variable | Variable | Variable | ✅ |

---

## 3. Arquitectura Objetivo

### 3.1 Diagrama de Despliegue

```
                    ┌─────────────────────────────────────────┐
                    │           REPOSITORIO GITHUB            │
                    │         (código sin credenciales)       │
                    └─────────────────┬───────────────────────┘
                                      │
                    ┌─────────────────┼───────────────────────┐
                    │                 │                       │
                    ▼                 ▼                       ▼
        ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐
        │  AZURE APP SERVICE │ │  AZURE APP SERVICE │ │  AZURE APP SERVICE │
        │     (Manzano)      │ │     (Tinoco)       │ │  (San José)        │
        ├───────────────────┤ ├───────────────────┤ ├───────────────────┤
        │ Variables Entorno: │ │ Variables Entorno: │ │ Variables Entorno: │
        │ MUNICIPIO=manzano  │ │ MUNICIPIO=tinoco   │ │ MUNICIPIO=sanjose  │
        │ DB_HOST=xxx        │ │ DB_HOST=yyy        │ │ DB_HOST=zzz        │
        │ DB_NAME=xxx        │ │ DB_NAME=yyy        │ │ DB_NAME=zzz        │
        │ TASA_INTERES=40    │ │ TASA_INTERES=35    │ │ TASA_INTERES=45    │
        └─────────┬─────────┘ └─────────┬─────────┘ └─────────┬─────────┘
                  │                     │                     │
                  ▼                     ▼                     ▼
        ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐
        │   AZURE SQL DB    │ │   AZURE SQL DB    │ │   AZURE SQL DB    │
        │   (BD Manzano)    │ │   (BD Tinoco)     │ │   (BD San José)   │
        └───────────────────┘ └───────────────────┘ └───────────────────┘
```

### 3.2 Principios de Diseño

| Principio | Implementación |
|-----------|----------------|
| **12-Factor App** | Configuración en variables de entorno |
| **DRY** | Un solo archivo de configuración de BD |
| **Seguridad** | Cero credenciales en código |
| **Inmutabilidad** | Mismo código, diferente configuración |

### 3.3 Estructura de Archivos Objetivo

```
config/
├── index.js                    ← Selector central (mantener)
├── database.config.js          ← ÚNICO archivo de BD (nuevo)
├── municipalidad.config.manzano.js
├── municipalidad.config.sanjosedelassalinas.js
├── municipalidad.config.tinoco.js
└── MUNICIPIO_CONFIG.md         ← Documentación

public/images/
├── manzano/                    ← Carpeta por municipio (nuevo)
│   ├── logo.webp
│   ├── logo-secundario.webp
│   └── favicon.ico
├── tinoco/
│   ├── logo.webp
│   ├── logo-secundario.webp
│   └── favicon.ico
└── sanjosedelassalinas/
    ├── logo.webp
    ├── logo-secundario.webp
    └── favicon.ico

envs/                           ← Carpeta local (NO en repo)
├── .env.manzano
├── .env.tinoco
└── .env.sanjosedelassalinas
```

---

## 4. Plan de Implementación

### FASE 1: Estandarizar Configuración de Base de Datos

**Duración estimada:** 1-2 horas

#### Tarea 1.1: Crear archivo único de BD

Crear `config/database.config.js` que lea TODO de variables de entorno:

```javascript
/**
 * Configuración ÚNICA de conexión a Base de Datos
 * Todas las credenciales vienen de variables de entorno
 */
const { Sequelize } = require('sequelize');
require('dotenv').config();

// Validar variables requeridas
const required = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASS'];
const missing = required.filter(key => !process.env[key]);

if (missing.length > 0) {
  console.error('');
  console.error('╔══════════════════════════════════════════════════════════════╗');
  console.error('║  ❌ ERROR: Faltan variables de entorno de Base de Datos      ║');
  console.error('╠══════════════════════════════════════════════════════════════╣');
  console.error(`║  Variables faltantes: ${missing.join(', ')}`);
  console.error('║                                                              ║');
  console.error('║  Solución: Configurar en Azure App Service o archivo .env    ║');
  console.error('╚══════════════════════════════════════════════════════════════╝');
  console.error('');
  process.exit(1);
}

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 1433,
    dialect: process.env.DB_DIALECT || 'mssql',
    dialectOptions: {
      options: {
        encrypt: true,
        trustServerCertificate: false,
        hostNameInCertificate: '*.database.windows.net'
      }
    },
    logging: process.env.NODE_ENV === 'development' 
      ? console.log 
      : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

module.exports = sequelize;
```

#### Tarea 1.2: Actualizar config/index.js

Simplificar para usar el archivo único de BD:

```javascript
require('dotenv').config();

const MUNICIPIO = process.env.MUNICIPIO;

if (!MUNICIPIO) {
  console.error('❌ ERROR: Variable MUNICIPIO no definida en .env');
  process.exit(1);
}

// Base de datos: UN SOLO archivo para todos
const sequelize = require('./database.config');

// Datos del municipio: archivo específico por municipio
const municipiosDisponibles = ['manzano', 'sanjosedelassalinas', 'tinoco'];

if (!municipiosDisponibles.includes(MUNICIPIO)) {
  console.error(`❌ ERROR: Municipio "${MUNICIPIO}" no configurado`);
  console.error(`   Disponibles: ${municipiosDisponibles.join(', ')}`);
  process.exit(1);
}

const municipalidad = require(`./municipalidad.config.${MUNICIPIO}`);

console.log(`🏛️  Municipio activo: ${municipalidad.nombreCompleto}`);

module.exports = {
  MUNICIPIO,
  sequelize,
  municipalidad,
  municipiosDisponibles
};
```

#### Tarea 1.3: Eliminar archivos obsoletos

Archivos a eliminar (después de migrar):
- `config/database.config.manzano.js`
- `config/database.config.sanjosedelassalinas.js`
- `config/database.config.tinoco.js`

---

### FASE 2: Configurar Tasa de Interés Variable

**Duración estimada:** 30 minutos

#### Tarea 2.1: Modificar deudas.service.js

```javascript
// ANTES (hardcodeado):
const TASA_INTERES_ANUAL = 40;

// DESPUÉS (configurable):
const TASA_INTERES_ANUAL = parseFloat(process.env.TASA_INTERES_ANUAL) || 40;
```

#### Tarea 2.2: Agregar a municipalidad.config (opcional)

Como respaldo, agregar tasa por defecto en cada archivo de municipio:

```javascript
module.exports = {
  nombre: 'El Manzano',
  // ... otros datos ...
  
  // Configuración de negocio
  tasaInteresAnual: 40,  // Respaldo si no hay variable de entorno
};
```

---

### FASE 3: Organizar Imágenes por Municipio

**Duración estimada:** 1 hora

#### Tarea 3.1: Crear estructura de carpetas

```
public/images/
├── manzano/
│   ├── logo.webp
│   ├── logo-secundario.webp
│   └── favicon.ico
├── tinoco/
│   └── ...
└── sanjosedelassalinas/
    └── ...
```

#### Tarea 3.2: Actualizar municipalidad.config.*.js

```javascript
// ANTES:
logos: {
  principal: '/images/ISOLOGOTIPO-EL_MANZANO.webp',
  secundario: '/images/alcaldiaLogo.webp',
  favicon: '../images/logo_El_Manzano.jpg'
}

// DESPUÉS (patrón consistente):
logos: {
  principal: '/images/manzano/logo.webp',
  secundario: '/images/manzano/logo-secundario.webp',
  favicon: '/images/manzano/favicon.ico'
}
```

#### Tarea 3.3: Mover imágenes existentes

| Imagen actual | Nueva ubicación |
|---------------|-----------------|
| `ISOLOGOTIPO-EL_MANZANO.webp` | `manzano/logo.webp` |
| `alcaldiaLogo.webp` | `manzano/logo-secundario.webp` |
| `logo_El_Manzano.jpg` | `manzano/favicon.ico` |

---

### FASE 4: Organizar Archivos de Entorno

**Duración estimada:** 30 minutos

#### Tarea 4.1: Crear carpeta envs/ (local)

```bash
mkdir envs
```

#### Tarea 4.2: Mover archivos .env.*

```bash
mv .env.manzano envs/
mv .env.tinoco envs/
mv .env.sanjosedelassalinas envs/
```

#### Tarea 4.3: Actualizar .gitignore

```gitignore
# Variables de entorno
.env
.env.*
envs/

# Excepto el ejemplo
!.env.example
```

#### Tarea 4.4: Crear scripts en package.json

```json
{
  "scripts": {
    "dev": "nodemon ./bin/www",
    "dev:manzano": "cp envs/.env.manzano .env && npm run dev",
    "dev:tinoco": "cp envs/.env.tinoco .env && npm run dev",
    "dev:sanjose": "cp envs/.env.sanjosedelassalinas .env && npm run dev",
    "start": "node ./bin/www"
  }
}
```

---

### FASE 5: Preparar para Múltiples Pasarelas de Pago

**Duración estimada:** 1 hora (estructura base)

#### Tarea 5.1: Agregar variable PAYMENT_GATEWAY

```env
# Pasarela de pago activa
PAYMENT_GATEWAY=mercadopago
# Opciones futuras: pagotic, siro
```

#### Tarea 5.2: Preparar estructura en paymentGateway.service.js

```javascript
const PAYMENT_GATEWAY = process.env.PAYMENT_GATEWAY || 'mercadopago';

// Estructura preparada para múltiples gateways
const gateways = {
  mercadopago: {
    createPayment: createMercadoPagoPayment,
    // ... otros métodos
  },
  pagotic: {
    createPayment: createPagoTicPayment,  // A implementar
  },
  siro: {
    createPayment: createSiroPayment,     // A implementar
  }
};

// Usar gateway configurado
const activeGateway = gateways[PAYMENT_GATEWAY];
```

---

### FASE 6: Documentación y Limpieza

**Duración estimada:** 1 hora

#### Tarea 6.1: Actualizar .env.example

Ver sección 5 de este documento.

#### Tarea 6.2: Crear DEPLOY_AZURE.md

Documentar proceso de despliegue (ver sección 7).

#### Tarea 6.3: Actualizar QUICK_RESUME.ai.md

Reflejar los cambios realizados.

#### Tarea 6.4: Eliminar archivos obsoletos

- Archivos de BD individuales (después de migrar)
- Archivos .env.* del repositorio

---

## 5. Detalle de Variables de Entorno

### 5.1 Variables Requeridas

| Variable | Descripción | Ejemplo | Requerida |
|----------|-------------|---------|-----------|
| `NODE_ENV` | Entorno de ejecución | `production` | ✅ |
| `PORT` | Puerto del servidor | `4000` | ✅ |
| `MUNICIPIO` | Identificador del municipio | `manzano` | ✅ |
| `DB_HOST` | Host de Azure SQL | `xxx.database.windows.net` | ✅ |
| `DB_NAME` | Nombre de la base de datos | `mi_base_datos` | ✅ |
| `DB_USER` | Usuario de BD | `admin` | ✅ |
| `DB_PASS` | Contraseña de BD | `***` | ✅ |

### 5.2 Variables Opcionales

| Variable | Descripción | Default | Requerida |
|----------|-------------|---------|-----------|
| `DB_DIALECT` | Dialecto SQL | `mssql` | ❌ |
| `DB_PORT` | Puerto de BD | `1433` | ❌ |
| `MUNICIPIO_ID` | ID para APIs externas | `= MUNICIPIO` | ❌ |
| `TASA_INTERES_ANUAL` | Tasa de interés (%) | `40` | ❌ |
| `API_GATEWAY_URL` | URL del API Gateway | - | ⚠️ Para pagos |
| `FRONTEND_PUBLIC_URL` | URL pública del portal | - | ⚠️ Para pagos |
| `WEBHOOK_SECRET` | Secreto para webhooks | - | ⚠️ Para pagos |
| `PAYMENT_GATEWAY` | Pasarela activa | `mercadopago` | ❌ |

### 5.3 Archivo .env.example Completo

```env
# ╔══════════════════════════════════════════════════════════════╗
# ║  PORTAL DE PAGOS MUNICIPAL - VARIABLES DE ENTORNO            ║
# ║  Copiar este archivo como .env y completar los valores       ║
# ╚══════════════════════════════════════════════════════════════╝

# ============================================
# ENTORNO
# ============================================
# Valores: development, test, production
NODE_ENV=development

# Puerto del servidor web
PORT=4000

# ============================================
# IDENTIFICACIÓN DEL MUNICIPIO
# ============================================
# Determina qué configuración visual cargar
# Valores disponibles: manzano, sanjosedelassalinas, tinoco
MUNICIPIO=manzano

# ID para APIs externas (opcional, usa MUNICIPIO si no está definido)
MUNICIPIO_ID=manzano

# ============================================
# BASE DE DATOS (Azure SQL)
# ============================================
# Host del servidor de base de datos
DB_HOST=tu-servidor.database.windows.net

# Nombre de la base de datos
DB_NAME=nombre_base_datos

# Usuario de la base de datos
DB_USER=usuario

# Contraseña de la base de datos
DB_PASS=contraseña_segura

# Dialecto SQL (opcional)
DB_DIALECT=mssql

# Puerto (opcional, default: 1433)
DB_PORT=1433

# ============================================
# CONFIGURACIÓN DE NEGOCIO
# ============================================
# Tasa de interés anual para cálculo de mora (%)
TASA_INTERES_ANUAL=40

# ============================================
# PASARELA DE PAGOS
# ============================================
# Gateway activo: mercadopago, pagotic, siro
PAYMENT_GATEWAY=mercadopago

# URL del API Gateway de pagos
API_GATEWAY_URL=https://api-gateway.ejemplo.com

# URL pública del portal (para callbacks de pago)
FRONTEND_PUBLIC_URL=https://portal.ejemplo.com

# ============================================
# SEGURIDAD
# ============================================
# Secreto para validar webhooks
WEBHOOK_SECRET=generar_secreto_seguro_aqui

# ============================================
# LOGGING (opcional)
# ============================================
# Nivel de log: debug, info, warn, error
LOG_LEVEL=info
```

---

## 6. Estructura de Archivos

### 6.1 Estructura Final del Proyecto

```
demo-portal-de-pago/
├── .env.example                    ← Template de variables
├── .gitignore                      ← Excluye .env y envs/
├── package.json                    ← Scripts por municipio
├── app.js
├── bin/
│   └── www
├── config/
│   ├── index.js                    ← Selector central
│   ├── database.config.js          ← ÚNICO archivo de BD
│   ├── municipalidad.config.manzano.js
│   ├── municipalidad.config.sanjosedelassalinas.js
│   ├── municipalidad.config.tinoco.js
│   └── MUNICIPIO_CONFIG.md
├── controllers/
├── docs/
│   ├── INTEGRACION_PAGOS.md
│   ├── PLAN_CONFIGURACION_MULTIAMBIENTE.md  ← Este documento
│   ├── DEPLOY_AZURE.md             ← Nuevo
│   └── ...
├── envs/                           ← 🚫 NO en repositorio
│   ├── .env.manzano
│   ├── .env.tinoco
│   └── .env.sanjosedelassalinas
├── middlewares/
├── models/
├── public/
│   ├── images/
│   │   ├── manzano/                ← Imágenes por municipio
│   │   │   ├── logo.webp
│   │   │   ├── logo-secundario.webp
│   │   │   └── favicon.ico
│   │   ├── tinoco/
│   │   └── sanjosedelassalinas/
│   ├── javascripts/
│   └── stylesheets/
├── routes/
├── services/
├── tests/
├── utils/
└── views/
```

### 6.2 Archivos a Eliminar (post-migración)

| Archivo | Razón |
|---------|-------|
| `config/database.config.manzano.js` | Reemplazado por database.config.js |
| `config/database.config.sanjosedelassalinas.js` | Reemplazado por database.config.js |
| `config/database.config.tinoco.js` | Reemplazado por database.config.js |
| `.env` (con credenciales reales) | Mover a envs/ local |
| `.env.manzano` | Mover a envs/ local |
| `.env.tinoco` | Mover a envs/ local |
| `.env.sanjosedelassalinas` | Mover a envs/ local |

---

## 7. Guía de Despliegue en Azure

### 7.1 Prerequisitos

- Azure App Service creado (Plan B1)
- Azure SQL Database configurada
- Repositorio conectado a Azure (GitHub Actions o Azure DevOps)

### 7.2 Configurar Variables en Azure App Service

1. Ir a **Azure Portal** → **App Service** → **Configuración** → **Configuración de la aplicación**

2. Agregar las siguientes variables:

| Nombre | Valor | Notas |
|--------|-------|-------|
| `NODE_ENV` | `production` | |
| `PORT` | `4000` | O el que use Azure |
| `MUNICIPIO` | `manzano` | Según el municipio |
| `DB_HOST` | `xxx.database.windows.net` | |
| `DB_NAME` | `nombre_bd` | |
| `DB_USER` | `usuario` | |
| `DB_PASS` | `contraseña` | Marcar como "Secreto" |
| `TASA_INTERES_ANUAL` | `40` | Según municipio |
| `API_GATEWAY_URL` | `https://...` | URL del gateway |
| `FRONTEND_PUBLIC_URL` | `https://portal-xxx.azurewebsites.net` | URL pública |
| `WEBHOOK_SECRET` | `secreto` | Marcar como "Secreto" |

3. Guardar y reiniciar el App Service

### 7.3 Verificar Despliegue

```bash
# 1. Verificar que la aplicación responde
curl https://portal-manzano.azurewebsites.net/

# 2. Verificar conexión a BD (desde logs)
# Azure Portal → App Service → Registros

# 3. Probar búsqueda de contribuyente
# Navegar al portal y buscar un DNI de prueba
```

### 7.4 Troubleshooting

| Problema | Solución |
|----------|----------|
| Error de conexión a BD | Verificar firewall de Azure SQL permite IP del App Service |
| Variable no encontrada | Verificar nombre exacto (case-sensitive) |
| Logo no carga | Verificar ruta en municipalidad.config.*.js |
| Puerto incorrecto | Azure asigna puerto dinámico, usar `process.env.PORT` |

---

## 8. Alta de Nuevo Municipio

### Paso 1: Crear archivo de configuración

```bash
# Copiar template existente
cp config/municipalidad.config.manzano.js config/municipalidad.config.NUEVO.js
```

### Paso 2: Editar datos del municipio

```javascript
// config/municipalidad.config.NUEVO.js
module.exports = {
  nombre: 'Nuevo Municipio',
  nombreCompleto: 'Municipalidad de Nuevo',
  direccion: 'Calle Principal 123',
  localidad: 'Nuevo',
  provincia: 'Córdoba',
  codigoPostal: 'X1234',
  telefono: '+54 (XXX) XXXXXX',
  
  logos: {
    principal: '/images/nuevo/logo.webp',
    secundario: '/images/nuevo/logo-secundario.webp',
    favicon: '/images/nuevo/favicon.ico'
  },
  
  ticket: {
    conceptosPorPagina: 30,
    mensajeValidez: 'Este ticket tiene validez hasta las 23:59 hs del día de emisión.',
    encabezado: 'Sistema de Pago Online',
    piePagina: 'Conserve este comprobante'
  },
  
  web: 'https://nuevo.gob.ar/',
  email: 'info@nuevo.gob.ar',
  
  // Configuración de negocio (respaldo)
  tasaInteresAnual: 40
};
```

### Paso 3: Agregar imágenes

```bash
mkdir public/images/nuevo
# Copiar: logo.webp, logo-secundario.webp, favicon.ico
```

### Paso 4: Registrar en config/index.js

```javascript
const municipiosDisponibles = [
  'manzano', 
  'sanjosedelassalinas', 
  'tinoco',
  'nuevo'  // ← Agregar aquí
];
```

### Paso 5: Crear archivo de entorno local

```bash
# envs/.env.nuevo
NODE_ENV=development
PORT=4000
MUNICIPIO=nuevo
DB_HOST=xxx.database.windows.net
DB_NAME=bd_nuevo
DB_USER=admin
DB_PASS=contraseña
TASA_INTERES_ANUAL=40
```

### Paso 6: Agregar script en package.json

```json
"dev:nuevo": "cp envs/.env.nuevo .env && npm run dev"
```

### Paso 7: Crear App Service en Azure

1. Crear nuevo App Service
2. Conectar al repositorio
3. Configurar variables de entorno
4. Desplegar

---

## 9. Checklist de Implementación

### FASE 1: Base de Datos ⬜

- [ ] Crear `config/database.config.js` único
- [ ] Actualizar `config/index.js`
- [ ] Probar conexión con cada municipio
- [ ] Eliminar archivos de BD individuales
- [ ] Commit: `refactor: unificar configuración de BD`

### FASE 2: Tasa de Interés ⬜

- [ ] Modificar `services/deudas.service.js`
- [ ] Agregar `TASA_INTERES_ANUAL` a `.env.example`
- [ ] Probar cálculo de intereses
- [ ] Commit: `feat: tasa de interés configurable`

### FASE 3: Imágenes ⬜

- [ ] Crear carpetas por municipio en `public/images/`
- [ ] Mover imágenes existentes
- [ ] Actualizar rutas en `municipalidad.config.*.js`
- [ ] Verificar que logos cargan correctamente
- [ ] Commit: `refactor: organizar imágenes por municipio`

### FASE 4: Archivos de Entorno ⬜

- [ ] Crear carpeta `envs/`
- [ ] Mover archivos `.env.*` a `envs/`
- [ ] Actualizar `.gitignore`
- [ ] Agregar scripts a `package.json`
- [ ] Actualizar `.env.example`
- [ ] Commit: `chore: organizar archivos de entorno`

### FASE 5: Pasarelas de Pago ⬜

- [ ] Agregar variable `PAYMENT_GATEWAY`
- [ ] Preparar estructura en `paymentGateway.service.js`
- [ ] Documentar opciones disponibles
- [ ] Commit: `feat: preparar múltiples pasarelas de pago`

### FASE 6: Documentación ⬜

- [ ] Actualizar `docs/QUICK_RESUME.ai.md`
- [ ] Actualizar `docs/MUNICIPIO_CONFIG.md`
- [ ] Crear `docs/DEPLOY_AZURE.md`
- [ ] Verificar que `.env.example` está completo
- [ ] Eliminar credenciales del historial de Git (si es necesario)
- [ ] Commit: `docs: actualizar documentación de despliegue`

### Verificación Final ⬜

- [ ] Probar en desarrollo con cada municipio
- [ ] Verificar que no hay credenciales en el código
- [ ] Desplegar en Azure (ambiente de prueba)
- [ ] Verificar funcionamiento en producción

---

## 10. Consideraciones de Seguridad

### 10.1 Credenciales

| ✅ Hacer | ❌ No hacer |
|----------|-------------|
| Usar variables de entorno | Hardcodear contraseñas |
| Marcar secretos en Azure | Commitear archivos .env |
| Rotar contraseñas periódicamente | Compartir credenciales por chat |
| Usar contraseñas fuertes | Usar la misma contraseña en todos los entornos |

### 10.2 Git y Repositorio

```bash
# Verificar que .gitignore excluye archivos sensibles
cat .gitignore | grep -E "\.env|envs/"

# Si ya se commitearon credenciales, considerar:
# 1. Rotar TODAS las contraseñas expuestas
# 2. Usar git-filter-repo para limpiar historial (avanzado)
```

### 10.3 Azure App Service

- Usar **Identidad Administrada** si es posible (evita credenciales de BD)
- Habilitar **HTTPS Only** en configuración
- Configurar **Restricciones de IP** si aplica
- Revisar **Registros de diagnóstico** periódicamente

### 10.4 Webhooks

- Siempre validar `WEBHOOK_SECRET` en peticiones entrantes
- Usar HTTPS para todos los callbacks
- Implementar rate limiting en endpoints de webhook

---

## 📝 Historial de Cambios

| Fecha | Versión | Descripción |
|-------|---------|-------------|
| 2026-03-09 | 1.0 | Documento inicial |

---

## 🔗 Documentos Relacionados

| Documento | Descripción |
|-----------|-------------|
| [INTEGRACION_PAGOS.md](./INTEGRACION_PAGOS.md) | Flujo de integración con MercadoPago |
| [QUICK_RESUME.ai.md](./ai/QUICK_RESUME.ai.md) | Resumen rápido del proyecto |
| [ROADMAP.ai.md](./ai/ROADMAP.ai.md) | Tareas pendientes del proyecto |
| [MUNICIPIO_CONFIG.md](../config/MUNICIPIO_CONFIG.md) | Cómo cambiar de municipio |

---

*Documento generado para planificación y presentación del plan de configuración multi-ambiente.*
