# ⚙️ Configuración de Municipios

> **Propósito**: Documentar cómo cambiar la configuración de municipios
> **Última actualización**: 2026-03-09
> **Estado**: ✅ IMPLEMENTADO (Fase 1 completada)

---

## 🎯 Cómo Cambiar de Municipio

### Método: Variable de Entorno

En el archivo `.env`, cambiar la variable `MUNICIPIO`:

```env
# Opciones disponibles: elmanzano, sanjosedelassalinas, tinoco
MUNICIPIO=elmanzano
```

**¡Listo!** Solo con cambiar esta variable y reiniciar el servidor, el portal cambia completamente de municipio (BD y datos visuales).

---

## 🔧 Cómo Funciona

### Archivo Central: `config/index.js`

Este archivo:
1. Lee la variable `MUNICIPIO` del `.env` (para datos visuales)
2. Lee las variables `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS` (para conexión a BD)
3. Carga `database.config.js` (UN SOLO archivo para todas las BD)
4. Carga `municipalidad.config.{MUNICIPIO}.js` (datos visuales específicos)
5. Exporta todo centralizado

### Archivos de configuración:
- `config/database.config.js` → Conexión a BD (lee de variables de entorno)
- `config/municipalidad.config.{municipio}.js` → Datos visuales (nombre, logo, etc.)

### Archivos que usan la config centralizada:
- `models/model.index.js` → usa `sequelize`
- `services/ticket.service.js` → usa `municipalidad`
- `services/paymentGateway.service.js` → usa `municipalidad` y `MUNICIPIO`
- `tests/connection.db.test.js` → usa `sequelize`

---

## 📍 Estado Anterior (YA NO APLICA - solo referencia histórica)

> ⚠️ **IMPORTANTE**: Esta sección documenta cómo funcionaba ANTES de la Fase 1.
> Actualmente TODO se configura mediante variables de entorno.
> NO es necesario modificar ningún archivo de código.

Antes de la centralización, había que modificar archivos manualmente:

### 1. Conexión a Base de Datos
**Archivo**: `models/model.index.js` (líneas 10-11)

```javascript
// Descomentar el municipio deseado:
const sequelize = require('../config/database.config.elmanzano.js');
//const sequelize = require('../config/database.config.sanjosedelassalinas.js');
```

### 2. Datos del Municipio (nombre, logo, etc.)
**Archivo**: `services/paymentGateway.service.js` (línea 16)

```javascript
const municipalidadConfig = require('../config/municipalidad.config.elmanzano');
```

Y también en `controllers/web.ticket.controller.js`.

---

## ➕ Agregar un Nuevo Municipio

### Paso 1: Crear archivo de datos visuales

```bash
# Solo necesitas el archivo de municipalidad (nombre, logo, dirección)
cp config/municipalidad.config.elmanzano.js config/municipalidad.config.NUEVO.js
```

### Paso 2: Editar `municipalidad.config.NUEVO.js`
- Nombre del municipio
- Dirección, teléfono, email
- Rutas de logos (agregar imágenes en `public/images/`)

### Paso 3: Registrar en `config/index.js`

```javascript
const municipiosDisponibles = ['elmanzano', 'sanjosedelassalinas', 'tinoco', 'nuevo'];
```

### Paso 4: Configurar Azure App Service

En **Configuración → Configuración de la aplicación** del App Service:

```
MUNICIPIO=nuevo
DB_HOST=xxx.database.windows.net
DB_NAME=NombreBD
DB_USER=Usuario
DB_PASS=Contraseña
```

> ✅ **No necesitas crear ningún archivo `database.config.nuevo.js`**
> La conexión a BD se configura 100% por variables de entorno.

---

## 🧹 Preparar para Producción (un solo municipio)

Cuando copies el proyecto para un cliente específico:

### Opción A: Dejar el sistema multi-municipio
- Solo configurar `MUNICIPIO=X` en producción
- Ventaja: Fácil de actualizar si agregamos features

### Opción B: Limpiar y dejar fijo
1. Eliminar configs de otros municipios
2. Simplificar `config/index.js` o eliminarlo
3. Hardcodear el municipio en los imports

**Recomendación**: Opción A es mejor para mantenimiento.

---

## � Estructura de Imágenes

```
public/images/
├── common/              → Recursos compartidos (alcaldiaLogo.webp, default-favicon.svg)
├── demo/                → Imágenes del entorno demo
├── elmanzano/           → elmanzano-logo-web.webp, elmanzano-favicon.ico
├── sanjosedelassalinas/ → sanjosedelassalinas-logo-web.webp, sanjosedelassalinas-favicon.ico
└── tinoco/              → tinoco-logo-web.webp, tinoco-favicon.ico
```

Las rutas se configuran en `municipalidad.config.{municipio}.js`:
```javascript
// Estándar: {municipio}-logo-web, {municipio}-logo-ticket, {municipio}-favicon
logos: {
  web: '/images/elmanzano/elmanzano-logo-web.webp',
  ticket: '/images/elmanzano/elmanzano-logo-web.webp',  // Usa logo-web si no hay específico
  favicon: '/images/elmanzano/elmanzano-favicon.ico'
}
```

---

## 📋 Checklist de Cambio de Municipio

- [ ] Cambiar variable `MUNICIPIO` en `.env`
- [ ] Verificar que existan los archivos de config (`config/municipalidad.config.{municipio}.js`)
- [ ] Verificar logos en `public/images/{municipio}/` (con nombres estandarizados)
- [ ] Reiniciar servidor (`npm run dev`)
- [ ] Probar con un DNI válido de ese municipio
- [ ] Verificar que el ticket muestre el logo correcto

---

## 📚 Documentación Relacionada

| Documento | Descripción |
|-----------|-------------|
| `docs/PLAN_CONFIGURACION_MULTIAMBIENTE.md` | Plan maestro de configuración |
| `docs/DEPLOY_AZURE.md` | Guía de despliegue en Azure |
| `.env.example` | Template de variables de entorno |
