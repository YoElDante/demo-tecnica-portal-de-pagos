# 🔒 Tareas Pendientes - Mejoras de Seguridad

> **Origen**: Migradas desde `portal-tinoco` durante la unificación
> **Fecha**: 2026-01-31
> **Estado**: ⏳ PENDIENTE

---

## 📋 Lista de Mejoras a Implementar

### 1. Instalar dependencia `helmet`

```bash
npm install helmet
```

**Qué hace**: Configura headers HTTP de seguridad automáticamente.

---

### 2. Crear middleware `forceHttps`

**Archivo a crear**: `middlewares/forceHttps.js`

```javascript
/**
 * Middleware para forzar HTTPS en producción
 * Redirige todas las peticiones HTTP a HTTPS
 */
module.exports = (req, res, next) => {
  // Solo forzar en producción
  if (process.env.NODE_ENV === 'production') {
    // Azure usa x-forwarded-proto
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
  }
  next();
};
```

---

### 3. Modificar `app.js`

**Agregar imports al inicio:**

```javascript
const helmet = require('helmet');
const forceHttps = require('./middlewares/forceHttps');
```

**Agregar middlewares de seguridad (después de crear la app, antes de otros middlewares):**

```javascript
// ============================================
// MIDDLEWARES DE SEGURIDAD (primero)
// ============================================

// Force HTTPS en producción
app.use(forceHttps);

// Helmet: Configura headers HTTP de seguridad
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://sdk.mercadopago.com", "https://cdnjs.cloudflare.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://api.mercadopago.com", "https://*.mercadopago.com"],
            frameSrc: ["'self'", "https://*.mercadopago.com"],
        }
    },
    crossOriginEmbedderPolicy: false, // Necesario para MercadoPago iframe
}));

// Trust proxy (necesario en Azure para obtener IP real y protocolo)
app.set('trust proxy', 1);
```

---

## ✅ Checklist de Implementación

- [ ] Instalar `helmet`
- [ ] Crear `middlewares/forceHttps.js`
- [ ] Modificar `app.js` con los middlewares de seguridad
- [ ] Probar en desarrollo
- [ ] Desplegar a staging/producción
- [ ] Verificar headers con herramientas como [securityheaders.com](https://securityheaders.com)

---

## 🔗 Referencias

- [Helmet.js Documentation](https://helmetjs.github.io/)
- [OWASP Secure Headers](https://owasp.org/www-project-secure-headers/)
- [Azure App Service HTTPS](https://docs.microsoft.com/en-us/azure/app-service/configure-ssl-bindings)
