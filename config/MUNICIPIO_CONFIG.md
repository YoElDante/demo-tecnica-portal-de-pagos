# ⚙️ Configuración de Municipios

> **Propósito**: Documentar cómo cambiar la configuración de municipios
> **Última actualización**: 2026-01-31
> **Estado**: ✅ IMPLEMENTADO

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
1. Lee la variable `MUNICIPIO` del `.env`
2. Carga la BD correcta (`database.config.{municipio}.js`)
3. Carga los datos del municipio (`municipalidad.config.{municipio}.js`)
4. Exporta todo centralizado

### Archivos que usan la config centralizada:
- `models/model.index.js` → usa `sequelize`
- `services/ticket.service.js` → usa `municipalidad`
- `services/paymentGateway.service.js` → usa `municipalidad` y `MUNICIPIO`
- `tests/connection.db.test.js` → usa `sequelize`

---

## 📍 Estado Anterior (referencia histórica)

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

### Paso 1: Crear archivos de configuración

```bash
# Copiar templates existentes
cp config/database.config.elmanzano.js config/database.config.NUEVO.js
cp config/municipalidad.config.elmanzano.js config/municipalidad.config.NUEVO.js
```

### Paso 2: Editar `database.config.NUEVO.js`
- Cambiar nombre de la BD en Azure
- Las credenciales se leen del `.env`

### Paso 3: Editar `municipalidad.config.NUEVO.js`
- Nombre del municipio
- Dirección, teléfono, email
- Rutas de logos (agregar imágenes en `public/images/`)

### Paso 4: Registrar en `config/index.js`

```javascript
const municipiosDisponibles = {
  elmanzano: { ... },
  sanjosedelassalinas: { ... },
  // Agregar nuevo:
  nuevo: {
    database: () => require('./database.config.NUEVO'),
    municipalidad: () => require('./municipalidad.config.NUEVO')
  }
};
```

### Paso 5: Usar el nuevo municipio

```env
MUNICIPIO=nuevo
```

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

## 📋 Checklist de Cambio de Municipio

- [ ] Cambiar variable `MUNICIPIO` en `.env`
- [ ] Verificar que existan los archivos de config
- [ ] Verificar logos en `public/images/`
- [ ] Reiniciar servidor (`npm run dev`)
- [ ] Probar con un DNI válido de ese municipio
- [ ] Verificar que el ticket muestre el logo correcto
