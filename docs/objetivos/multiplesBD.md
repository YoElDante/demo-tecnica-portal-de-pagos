# 🏗️ **PLAN DE APLICACIÓN: MULTI-TENANT CON ROUTING POR PATH**

### **📋 Concepto:**

```
/prueba/*           → BD Azure 1 (actual)
/sanjosedeladormida/* → BD Azure 2 (nueva)
/                   → Redirect a /prueba
```

Ambos tenants comparten:
- ✅ Mismo código (controllers, services, routes)
- ✅ Mismos modelos (Cliente, ClientesCtaCte)
- ✅ Misma lógica de negocio
- ❌ Bases de datos DIFERENTES

---

## 🎯 **ESTRATEGIA TÉCNICA**

### **Opción 1: Middleware de Tenant (RECOMENDADA PARA MVP)**

**Ventajas:**
- Simple de implementar
- Fácil de mantener
- Escalable (agregar más tenants es trivial)
- No duplica código

**Cómo funciona:**
1. Middleware detecta tenant por path (`/prueba` o `/sanjosedeladormida`)
2. Inyecta conexión de BD correspondiente en `req.dbConnection`
3. Services usan `req.dbConnection` en lugar de la global

---

## 📝 **PLAN PASO A PASO**

### **FASE 1: CONFIGURACIÓN DE MÚLTIPLES BD**

#### **Paso 1.1: Actualizar .env**
```
# BD Prueba (actual)
DB_HOST_PRUEBA=alcaldiasmlqdsprueba.database.windows.net
DB_NAME_PRUEBA=s586W5bxyqU7VDu
DB_USER_PRUEBA=tu_usuario
DB_PASS_PRUEBA=tu_password

# BD San José de la Dormida (nueva)
DB_HOST_SANJOSE=nuevo_servidor.database.windows.net
DB_NAME_SANJOSE=nombre_bd_sanjose
DB_USER_SANJOSE=tu_usuario
DB_PASS_SANJOSE=tu_password

DB_DIALECT=mssql
DB_PORT=1433
```

#### **Paso 1.2: Crear archivo `/config/databases.config.js`**
```javascript
// Gestiona múltiples conexiones de BD
module.exports = {
  prueba: { /* config BD prueba */ },
  sanjosedeladormida: { /* config BD san jose */ }
};
```

#### **Paso 1.3: Crear pool de conexiones**
```javascript
// /config/database-pool.js
// Mantiene conexiones abiertas para cada tenant
const connections = {
  prueba: sequelizeInstancePrueba,
  sanjosedeladormida: sequelizeInstanceSanJose
};
```

---

### **FASE 2: MIDDLEWARE DE TENANT**

#### **Paso 2.1: Crear `/middlewares/tenant.js`**

**Responsabilidades:**
- Detectar tenant desde URL
- Validar que el tenant existe
- Inyectar conexión de BD en `req`
- Manejar errores de tenant no encontrado

**Pseudo-código:**
```javascript
exports.detectTenant = (req, res, next) => {
  // Extraer tenant de la URL: /prueba/api/clientes → "prueba"
  const tenant = extraerTenantDeUrl(req.path);
  
  // Validar tenant
  if (!tenantValido(tenant)) {
    return res.status(404).send('Tenant no encontrado');
  }
  
  // Inyectar conexión y modelos
  req.tenant = tenant;
  req.db = getConnectionForTenant(tenant);
  req.models = getModelsForTenant(tenant);
  
  next();
};
```

---

### **FASE 3: REFACTORIZAR MODELOS**

#### **Paso 3.1: Crear factory de modelos**

**Problema actual:** Los modelos están hardcodeados a una conexión global

**Solución:** Función que genera modelos por tenant

```javascript
// /models/model.factory.js
function createModelsForTenant(sequelizeInstance) {
  const Cliente = ClienteModel(sequelizeInstance);
  const ClientesCtaCte = ClientesCtaCteModel(sequelizeInstance);
  
  // Relaciones
  Cliente.hasMany(ClientesCtaCte, { ... });
  
  return { Cliente, ClientesCtaCte };
}
```

#### **Paso 3.2: Actualizar model.index.js**

```javascript
// Exportar factory en lugar de instancias fijas
module.exports = {
  createModelsForTenant,
  // Para backward compatibility (opcional)
  ...createModelsForTenant(sequelizeDefault)
};
```

---

### **FASE 4: REFACTORIZAR SERVICES**

#### **Paso 4.1: Pasar modelos como parámetro**

**Antes:**
```javascript
// services/clientes.service.js
const { Cliente } = require('../models/model.index');

exports.buscarPorDni = async (dni) => {
  return await Cliente.findOne({ where: { DOCUMENTO: dni } });
};
```

**Después:**
```javascript
exports.buscarPorDni = async (dni, models) => {
  return await models.Cliente.findOne({ where: { DOCUMENTO: dni } });
};
```

O mejor aún (patrón recomendado):

```javascript
class ClientesService {
  constructor(models) {
    this.Cliente = models.Cliente;
  }
  
  async buscarPorDni(dni) {
    return await this.Cliente.findOne({ where: { DOCUMENTO: dni } });
  }
}

module.exports = ClientesService;
```

---

### **FASE 5: REFACTORIZAR CONTROLLERS**

#### **Paso 5.1: Usar modelos desde req**

**Antes:**
```javascript
const ClientesService = require('../../services/clientes.service');

exports.listarClientes = async (req, res) => {
  const resultado = await ClientesService.listarClientes(limit, offset);
  // ...
};
```

**Después:**
```javascript
exports.listarClientes = async (req, res) => {
  const service = new ClientesService(req.models);
  const resultado = await service.listarClientes(limit, offset);
  // ...
};
```

O inyectar service en middleware:

```javascript
// En middleware tenant
req.services = {
  clientes: new ClientesService(req.models),
  deudas: new DeudasService(req.models)
};

// En controller
exports.listarClientes = async (req, res) => {
  const resultado = await req.services.clientes.listarClientes(limit, offset);
  // ...
};
```

---

### **FASE 6: REESTRUCTURAR RUTAS**

#### **Paso 6.1: Crear tenant routers**

**Estructura propuesta:**
```
/routes
  ├── tenant.routes.js        # Monta rutas con tenant prefix
  ├── index.js                # Rutas web (compartidas)
  └── /api
      ├── index.js            # API routes (compartidas)
      └── clientes.routes.js  # Rutas de clientes (compartidas)
```

#### **Paso 6.2: Actualizar app.js**

```javascript
const tenantMiddleware = require('./middlewares/tenant');
const tenantRoutes = require('./routes/tenant.routes');

// Redirect / → /prueba
app.get('/', (req, res) => res.redirect('/prueba'));

// Rutas con tenant
app.use('/:tenant', tenantMiddleware.detectTenant, tenantRoutes);

// Rutas que siguen funcionando sin tenant (legacy, opcional)
// app.use('/api', apiRouter);
```

#### **Paso 6.3: Crear `/routes/tenant.routes.js`**

```javascript
const express = require('express');
const router = express.Router({ mergeParams: true });

const indexRouter = require('./index');
const apiRouter = require('./api/index');

// Web routes
router.use('/', indexRouter);

// API routes
router.use('/api', apiRouter);

module.exports = router;
```

---

### **FASE 7: ACTUALIZAR FRONTEND**

#### **Paso 7.1: Ajustar rutas en vistas**

**Antes:**
```html
<form action="/buscar" method="POST">
```

**Después:**
```html
<form action="/<%= tenant %>/buscar" method="POST">
```

O mejor (usando helper):

```javascript
// Pasar tenant a todas las vistas
app.use((req, res, next) => {
  res.locals.tenant = req.tenant || 'prueba';
  res.locals.basePath = `/${res.locals.tenant}`;
  next();
});
```

```html
<form action="<%= basePath %>/buscar" method="POST">
```

#### **Paso 7.2: Actualizar JS del cliente**

```javascript
// public/javascripts/deudas.js
const basePath = window.location.pathname.split('/')[1]; // "prueba" o "sanjosedeladormida"

fetch(`/${basePath}/api/clientes`, ...);
```

---

## 📊 **ESTRUCTURA DE ARCHIVOS NUEVA**

```
/config
  ├── database.config.js         # DEPRECADO (o renombrar)
  ├── databases.config.js        # Configuraciones de múltiples BD
  └── database-pool.js           # Pool de conexiones

/middlewares
  └── tenant.js                  # Detecta tenant e inyecta BD

/models
  ├── Cliente.js                 # Sin cambios
  ├── ClientesCtasCtes.js        # Sin cambios
  ├── model.factory.js           # NUEVO: Factory de modelos
  └── model.index.js             # Exporta factory

/services
  ├── clientes.service.js        # Refactorizado a clase
  └── deudas.service.js          # Refactorizado a clase

/routes
  ├── tenant.routes.js           # NUEVO: Monta rutas con tenant
  ├── index.js                   # Rutas web (sin cambios mayores)
  └── /api
      └── ...                    # Sin cambios mayores

/app.js                          # Monta middleware tenant
```

---

## ⚠️ **CONSIDERACIONES IMPORTANTES**

### **Seguridad:**
- ✅ Validar que tenant existe antes de conectar a BD
- ✅ Sanitizar nombre de tenant (solo alfanuméricos/guiones)
- ✅ No exponer nombres de BD reales en errores
- ✅ Rate limiting por tenant (no global)

### **Performance:**
- ✅ Mantener pool de conexiones abierto (no crear/cerrar por request)
- ✅ Configurar max connections por tenant
- ✅ Implementar healthcheck por BD

### **Mantenibilidad:**
- ✅ Config de tenants en archivo separado (fácil agregar nuevos)
- ✅ Migrations/Seeds por tenant
- ✅ Logging con tenant_id para debug

---

## 🧪 **TESTING DEL PLAN**

### **Casos de prueba:**

1. ✅ `GET /` → Redirect a `/prueba`
2. ✅ `GET /prueba` → Renderiza index con BD prueba
3. ✅ `GET /sanjosedeladormida` → Renderiza index con BD nueva
4. ✅ `GET /api/clientes` → 404 (sin tenant)
5. ✅ `GET /prueba/api/clientes` → Lista de BD prueba
6. ✅ `GET /sanjosedeladormida/api/clientes` → Lista de BD nueva
7. ✅ `GET /tenant-inexistente/api/clientes` → 404
8. ✅ POST `/prueba/buscar` → Busca en BD prueba
9. ✅ POST `/sanjosedeladormida/buscar` → Busca en BD nueva

---

## 📚 **ORDEN DE IMPLEMENTACIÓN SUGERIDO**

```
1. FASE 1: Configurar múltiples BD
   ├─ Paso 1.1: Actualizar .env
   ├─ Paso 1.2: Crear databases.config.js
   └─ Paso 1.3: Crear database-pool.js

2. FASE 2: Crear middleware tenant
   └─ Paso 2.1: /middlewares/tenant.js

3. FASE 3: Refactorizar modelos
   ├─ Paso 3.1: Crear model.factory.js
   └─ Paso 3.2: Actualizar model.index.js

4. FASE 4: Refactorizar services (uno a la vez)
   └─ Paso 4.1: Convertir a clases con inyección

5. FASE 5: Refactorizar controllers
   └─ Paso 5.1: Usar req.models o req.services

6. FASE 6: Reestructurar rutas
   ├─ Paso 6.1: Crear tenant.routes.js
   ├─ Paso 6.2: Actualizar app.js
   └─ Paso 6.3: Montar rutas

7. FASE 7: Actualizar frontend
   ├─ Paso 7.1: Pasar tenant a vistas
   └─ Paso 7.2: Actualizar JS cliente

8. TESTING: Probar ambos tenants
```

---

## ✅ **CHECKLIST DE IMPLEMENTACIÓN**

```
PREPARACIÓN
□ Obtener credenciales BD San José
□ Probar conexión manual a ambas BD
□ Verificar que esquemas son idénticos

FASE 1: CONFIGURACIÓN
□ Actualizar .env con ambas BD
□ Crear databases.config.js
□ Crear database-pool.js
□ Testear conexiones

FASE 2-6: CÓDIGO
□ Middleware tenant
□ Factory de modelos
□ Refactor services
□ Refactor controllers
□ Reestructurar rutas

FASE 7: FRONTEND
□ Pasar tenant a vistas
□ Actualizar forms y links
□ Actualizar JS cliente

TESTING
□ Probar /prueba completo
□ Probar /sanjosedeladormida completo
□ Probar redirect /
□ Probar tenant inexistente
```

---

## 🚀 **RESULTADO FINAL**

**URLs esperadas:**

```
Tenant Prueba:
- http://localhost:3000/prueba
- http://localhost:3000/prueba/api/clientes
- http://localhost:3000/prueba/buscar (POST)

Tenant San José:
- http://localhost:3000/sanjosedeladormida
- http://localhost:3000/sanjosedeladormida/api/clientes
- http://localhost:3000/sanjosedeladormida/buscar (POST)

Redirect:
- http://localhost:3000/ → /prueba
```

---

**¿Te parece bien este plan? ¿Quieres que creemos un documento completo tipo `separacionAPI&WEB.md` con esto, o empezamos directamente con la Fase 1?**