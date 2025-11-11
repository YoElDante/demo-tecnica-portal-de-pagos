# **📋 GUÍA COMPLETA: SEPARACIÓN DE API Y LÓGICA WEB** 
08/11/2025

---

## **🎯 CONCEPTOS CLAVE**

**Problema actual:**
- `clientes.controller.js` mezcla lógica de API REST (JSON) con lógica de renderizado web (EJS)
- La función `buscarPorDni` existe duplicada para distintos propósitos
- No hay separación clara entre rutas API y rutas web

**Solución:**
- **Controllers separados**: Uno para API, otro para vistas web
- **Services**: Lógica de negocio reutilizable
- **API RESTful**: Con paginación, HATEOAS, versionado
- **Estructura escalable**: Fácil de mantener y expandir

---

## **🏗️ NUEVA ESTRUCTURA PROPUESTA**

```
/root
├── /controllers
│   ├── web.controller.js           # Renderiza vistas EJS
│   └── /api
│       └── clientes.api.controller.js  # Solo respuestas JSON
│
├── /services
│   ├── clientes.service.js         # Lógica de negocio reutilizable
│   └── deudas.service.js           # Cálculos y formateo de deudas
│
├── /routes
│   ├── index.js                    # Rutas web (vistas)
│   └── /api
│       ├── index.js                # API root con documentación
│       └── clientes.routes.js      # Endpoints REST de clientes
│
├── /middlewares
│   ├── validator.js                # Validaciones de entrada
│   ├── errorHandler.js             # Manejo centralizado de errores
│   └── pagination.js               # Middleware de paginación
│
├── /utils
│   ├── response.js                 # Formatos de respuesta API
│   └── constants.js                # Constantes del proyecto
│
└── app.js                          # Configuración principal
```

---

## **📝 PLAN DE IMPLEMENTACIÓN (PASO A PASO)**

---

### **FASE 1: PREPARACIÓN Y SERVICIOS**

**Objetivo:** Extraer lógica de negocio a servicios reutilizables

#### **Paso 1.1: Crear capa de servicios**
```
Archivos a crear:
- /services/clientes.service.js
- /services/deudas.service.js
```

**¿Qué incluir en services?**
- Consultas a la BD
- Formateo de datos
- Cálculos de negocio (descuentos, totales)
- Validaciones complejas

**Ventajas:**
- Reutilizable desde API y web
- Más fácil de testear
- Lógica centralizada

---

#### **Paso 1.2: Crear utilidades comunes**
```
Archivos a crear:
- /utils/response.js      # Formatos estándar de respuesta API
- /utils/constants.js     # Constantes (límites, mensajes)
- /utils/validators.js    # Validadores reutilizables
```

---

### **FASE 2: SEPARAR CONTROLLERS**

**Objetivo:** Un controller para web, otro para API

#### **Paso 2.1: Crear web.controller.js**
```
Archivo: /controllers/web.controller.js
```

**Responsabilidades:**
- Solo renderizar vistas EJS
- Llamar a services para obtener datos
- Pasar datos formateados a las vistas

**Ejemplo:**
```javascript
exports.buscarPorDni = async (req, res) => {
  const { dni } = req.body;
  const resultado = await ClientesService.buscarConDeudas(dni);
  res.render('index', resultado);
};
```

---

#### **Paso 2.2: Crear clientes.api.controller.js**
```
Archivo: /controllers/api/clientes.api.controller.js
```

**Responsabilidades:**
- Solo responder JSON
- Usar formato REST estándar
- Incluir links HATEOAS
- Códigos HTTP correctos

**Ejemplo:**
```javascript
exports.obtenerDeudas = async (req, res) => {
  const data = await ClientesService.obtenerDeudas(req.params.codigo);
  res.json({
    success: true,
    data,
    links: { ... }
  });
};
```

---

### **FASE 3: REESTRUCTURAR RUTAS**

**Objetivo:** Separar rutas web de rutas API

#### **Paso 3.1: Mantener rutas web simples**
```
Archivo: /routes/index.js (ya existe)
```

**Solo para vistas:**
- `GET /` → Página principal
- `POST /buscar` → Búsqueda desde formulario
- Futuras vistas adicionales

---

#### **Paso 3.2: Crear estructura API REST**
```
Archivo: /routes/api/index.js (nuevo)
Archivo: /routes/api/clientes.routes.js (mover y mejorar)
```

**Endpoints RESTful estándar:**
```
GET    /api/clientes              # Listar (paginado)
GET    /api/clientes/:id          # Obtener uno
GET    /api/clientes/:id/deudas   # Deudas del cliente
POST   /api/clientes              # Crear (futuro)
PUT    /api/clientes/:id          # Actualizar (futuro)
DELETE /api/clientes/:id          # Eliminar (futuro)
```

---

### **FASE 4: MEJORAS DE API REST**

**Objetivo:** API profesional y escalable

#### **Paso 4.1: Implementar paginación estándar**
```
Middleware: /middlewares/pagination.js
```

**Query params:**
- `?page=1&limit=20`
- `?offset=0&limit=50`

**Respuesta con metadatos:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  },
  "links": {
    "self": "/api/clientes?page=1",
    "next": "/api/clientes?page=2",
    "prev": null,
    "first": "/api/clientes?page=1",
    "last": "/api/clientes?page=8"
  }
}
```

---

#### **Paso 4.2: Versionado de API**
```
/api/...  # Versión actual
/api/v2/...  # Futura versión (cambios breaking)
```

**En app.js:**
```javascript
app.use('/api', require('./routes/api'));
```

---

#### **Paso 4.3: HATEOAS (Links relacionados)**

**Ejemplo de respuesta con links:**
```json
{
  "data": {
    "codigo": "0012345",
    "nombre": "Juan Pérez"
  },
  "links": {
    "self": "/api/clientes/0012345",
    "deudas": "/api/clientes/0012345/deudas",
    "pagos": "/api/clientes/0012345/pagos"
  }
}
```

---

#### **Paso 4.4: Manejo de errores centralizado**
```
Middleware: /middlewares/errorHandler.js
```

**Errores consistentes:**
```json
{
  "success": false,
  "error": {
    "code": "CLIENT_NOT_FOUND",
    "message": "Cliente no encontrado",
    "details": "DNI 12345678 no existe en el sistema"
  }
}
```

---

### **FASE 5: MIDDLEWARE Y VALIDACIONES**

**Objetivo:** Código más limpio y seguro

#### **Paso 5.1: Validaciones con express-validator**
```
npm install express-validator
```

**Ejemplo:**
```javascript
// /middlewares/validators/clientes.validator.js
const { body, param } = require('express-validator');

exports.validateDni = [
  body('dni')
    .isNumeric()
    .isLength({ min: 7, max: 10 })
    .withMessage('DNI debe tener entre 7 y 10 dígitos')
];
```

---

#### **Paso 5.2: Rate limiting (protección API)**
```
npm install express-rate-limit
```

**Prevenir abuso:**
```javascript
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // máx 100 requests
});

app.use('/api/', apiLimiter);
```

---

### **FASE 6: DOCUMENTACIÓN DE API**

**Objetivo:** API autodocumentada

#### **Paso 6.1: Swagger/OpenAPI**
```
npm install swagger-ui-express swagger-jsdoc
```

**Acceso:** `http://localhost:3000/api-docs`

#### **Paso 6.2: Endpoint de documentación simple**
```
GET /api
```

**Responde con:**
```json
{
  "version": "1.0.0",
  "endpoints": {
    "clientes": "/api/clientes",
    "deudas": "/api/clientes/:id/deudas"
  },
  "documentation": "/api-docs"
}
```

---

## **🔄 ESTRATEGIA DE MIGRACIÓN (SIN ROMPER NADA)**

### **Enfoque recomendado: "Strangler Fig Pattern"**

**Paso a paso:**

1. **Crear nueva estructura en paralelo** (no tocar código existente)
2. **Migrar endpoint por endpoint** (uno a la vez)
3. **Testear cada migración** antes de continuar
4. **Mantener ambas versiones** hasta validar
5. **Deprecar versión antigua** gradualmente
6. **Eliminar código legacy** al final

---

### **Orden de migración sugerido:**

```
1. Crear services → Extraer lógica común
2. Crear utils → Helpers reutilizables
3. Crear API v1 → Nuevos endpoints
4. Migrar GET /clientes → Primer endpoint
5. Migrar GET /deudas → Segundo endpoint
6. Actualizar web controller → Usar services
7. Testear todo → Validar funcionamiento
8. Documentar → Swagger/README
9. Limpiar código antiguo → Eliminar duplicados
```

---

## **✅ CHECKLIST DE IMPLEMENTACIÓN**

```
FASE 1: SERVICIOS
✅ Crear /services/clientes.service.js
✅ Crear /services/deudas.service.js
✅ Extraer lógica de BD a services
✅ Testear services independientemente

FASE 2: CONTROLLERS
✅ Crear /controllers/web.controller.js
✅ Crear /controllers/api/clientes.api.controller.js
✅ Migrar funciones existentes
✅ Eliminar duplicación de código

FASE 3: RUTAS
✅ Crear /routes/api/index.js
✅ Reorganizar /routes/api/clientes.routes.js
✅ Actualizar /routes/index.js
✅ Configurar rutas en app.js

FASE 4: MEJORAS API
✅ Implementar paginación
✅ Agregar HATEOAS
✅ Versionado (/api)
✅ Formatos de respuesta estándar

FASE 5: MIDDLEWARES
✅ Validaciones con express-validator
✅ Error handler centralizado
✅ Rate limiting
✅ Logging middleware

FASE 6: DOCUMENTACIÓN - A futuro al terminar el proyecto
□ Swagger/OpenAPI
□ README de API
□ Ejemplos de uso
□ Postman collection
```

---

## **📚 RECURSOS RECOMENDADOS**

- **REST API Best Practices**: [restfulapi.net](https://restfulapi.net/)
- **Express Patterns**: Estructura MVC/Clean Architecture
- **HATEOAS**: Richardson Maturity Model
- **Versionado**: Semantic Versioning (semver.org)

---

## **🎯 BENEFICIOS DE ESTA ARQUITECTURA**

✅ **Separación de responsabilidades**: API vs Web  
✅ **Código reutilizable**: Services compartidos  
✅ **Escalabilidad**: Fácil agregar endpoints  
✅ **Mantenibilidad**: Código organizado y limpio  
✅ **Testeable**: Cada capa se puede testear independientemente  
✅ **Profesional**: Estándares de industria  

---
