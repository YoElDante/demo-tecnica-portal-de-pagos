# 06 — Recomendaciones Priorizadas

## Roadmap de Mejora

Cada recomendación incluye: severidad, esfuerzo estimado, archivos a modificar, y justificación de negocio.

---

## 🔴 CRÍTICO — Resolver en < 1 semana

Estos 3 items presentan riesgo inmediato de seguridad o exposición de datos. Son cambios pequeños y acotados.

### C1: Instalar y configurar Helmet
- **Severidad:** 🔴 CRÍTICO
- **Esfuerzo:** 30 minutos
- **Archivos:** `app.js`, `package.json`
- **Qué hacer:**
  ```
  npm install helmet@8.1.0
  ```
  En `app.js`, antes de los middlewares:
  ```javascript
  const helmet = require('helmet');
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "cdnjs.cloudflare.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
        fontSrc: ["'self'", "fonts.gstatic.com"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'"]
      }
    }
  }));
  app.disable('x-powered-by');
  ```
- **Impacto:** Cierra 5 vectores de ataque HTTP simultáneamente (XSS, clickjacking, MIME sniffing, MITM downgrade, information disclosure).

### C2: Agregar protección CSRF
- **Severidad:** 🔴 CRÍTICO
- **Esfuerzo:** 1 hora
- **Archivos:** `app.js`, `routes/index.js`, `views/index.ejs`, `package.json`
- **Qué hacer:**
  ```
  npm install csrf-csrf@3.1.0
  ```
  En `app.js`:
  ```javascript
  const { doubleCsrf } = require('csrf-csrf');
  const { generateToken, doubleCsrfProtection } = doubleCsrf({
    getSecret: () => process.env.CSRF_SECRET || process.env.GATEWAY_WEBHOOK_SECRET
  });
  app.use(doubleCsrfProtection);
  ```
  En `views/index.ejs`, agregar `<input type="hidden" name="_csrf" value="<%= csrfToken %>">` en cada formulario POST.
- **Impacto:** Previene CSRF en formularios de búsqueda e inicio de pago.

### C3: Remover PII del HTML inline
- **Severidad:** 🔴 CRÍTICO
- **Esfuerzo:** 2 horas
- **Archivos:** `views/index.ejs`, `public/javascripts/deudas.js`, `controllers/web.controller.js`
- **Qué hacer:**
  - Eliminar el bloque `<script>const contribuyenteData = {...}</script>` de `index.ejs`.
  - En su lugar, exponer solo `codigo` y `dni` como `data-*` attributes en el DOM.
  - El email y nombre completo NO deben estar en el HTML.
  - Crear endpoint `GET /api/contribuyente/:codigo` que requiera un token de sesión para devolver datos completos.
- **Impacto:** Elimina exposición de PII en cachés de navegador, CDN, y view-source.

---

## 🟠 ALTO — Resolver en < 1 mes

Cambios importantes de seguridad, estabilidad y calidad. Algunos requieren más esfuerzo pero tienen alto impacto.

### A1: Agregar tests unitarios para services críticos
- **Esfuerzo:** 16 horas (2 días)
- **Archivos:** `tests/services/intereses.test.js`, `tests/services/pagos.test.js`, `tests/services/ticketsPago.test.js`, `tests/services/gatewayToken.test.js`, `package.json` (jest)
- **Cobertura mínima objetivo:** 80% en services críticos
- **Qué testear:**
  - `intereses.service.js`: Modo A, Modo B, edge cases (saldo=0, sin fecha, sin coeficiente)
  - `pagos.service.js`: confirmarPagoGateway con mock de BD, idempotencia, rollback
  - `ticketsPago.service.js`: creación con colisión de ticketNumber, fallback ticketId→ticketNumber
  - `gatewayToken.service.js`: sign/verify, rotación diaria, token expirado
- **Impacto:** Esto es lo que más valor aporta a la estabilidad del proyecto. Sin tests, cada deploy a producción es una apuesta.

### A2: Agregar health check endpoint
- **Esfuerzo:** 1 hora
- **Archivos:** `routes/index.js` (o nuevo `routes/health.js`)
- **Qué hacer:**
  ```javascript
  router.get('/health', async (req, res) => {
    try {
      await sequelize.authenticate();
      res.json({ status: 'ok', timestamp: new Date().toISOString(), db: 'connected' });
    } catch {
      res.status(503).json({ status: 'error', db: 'disconnected' });
    }
  });
  ```
- **Impacto:** Permite a Azure App Service detectar instancias no saludables y reiniciarlas.

### A3: Implementar sanitización de logs en producción
- **Esfuerzo:** 3 horas
- **Archivos:** `middlewares/logger.js`, `controllers/payment.controller.js`, `services/pagos.service.js`
- **Qué hacer:**
  - Crear helper `redactPII(obj)` que reemplace `external_reference`, `dni`, `idOperacion` con versiones truncadas/hasheadas.
  - Aplicar en todos los `console.log` que incluyen datos sensibles.
  - En producción, el valor completo va a una cola de logs segura, no a stdout.
- **Impacto:** Compliance de datos. Si alguna vez se auditan los logs, no deben contener PII.

### A4: CDN con Subresource Integrity (SRI)
- **Esfuerzo:** 1 hora
- **Archivos:** `views/index.ejs` (y cualquier template que use CDN)
- **Qué hacer:**
  - Generar hash SRI para jsPDF 2.5.1: `sha384-...`
  - Agregar `integrity="sha384-..."` y `crossorigin="anonymous"` al `<script>` tag
  - Mismo proceso para Google Fonts CSS
- **Impacto:** Si cdnjs es comprometido, el navegador rechaza el script modificado.

### A5: Dividir `payment.controller.js`
- **Esfuerzo:** 4 horas
- **Archivos:** Crear `controllers/payment.init.controller.js`, `controllers/payment.webhook.controller.js`, `controllers/payment.redirect.controller.js`
- **Qué hacer:**
  - `init.controller.js`: `iniciarPago()` (líneas 213-454)
  - `webhook.controller.js`: `confirmacion()` (líneas 461-646)
  - `redirect.controller.js`: `pagoExitoso`, `pagoFallido`, `pagoPendiente`, `pagoErrorGenerico`, `obtenerEstadoTicket` (líneas 656-863)
  - `payment.routes.js` importa de los 3 archivos nuevos
- **Impacto:** Mantenibilidad. 863 líneas en un archivo es inmanejable.

### A6: Eliminar código muerto
- **Esfuerzo:** 1 hora
- **Archivos:** `routes/users.js`, `services/pagos.service.js` (confirmarPago legacy), `services/paymentGateway.service.js` (checkPaymentStatus, gateways no implementados)
- **Impacto:** Reduce superficie de ataque y confusión. Si los placeholders de PagoTic/Macro no se necesitan en 3 meses, fuera.

### A7: Arreglar scripts npm y dependencias
- **Esfuerzo:** 1 hora
- **Archivos:** `package.json`
- **Qué hacer:**
  - Agregar `cross-env` para scripts multiplataforma
  - Agregar `nodemon` como devDependency
  - Agregar `jest` como devDependency
  - Agregar script `"test": "jest"`
  - Agregar script `"lint": "eslint ."` (cuando se configure ESLint)
  - Remover `morgan` si no se usa
  - Agregar `"engines": { "node": ">=20.0.0" }`
- **Impacto:** Developer experience. `npm run dev` debería funcionar en cualquier OS.

---

## 🟡 MEDIO — Planificar en 2-3 meses

Mejoras importantes que requieren más planificación o tienen dependencias.

### M1: Configurar ESLint + Prettier
- **Esfuerzo:** 3 horas
- **Archivos:** `.eslintrc.json`, `.prettierrc`, `package.json`
- **Configuración recomendada:** `eslint:recommended` + `plugin:node/recommended`
- **Impacto:** Consistencia de código. Previene bugs por estilos inconsistentes.

### M2: Iniciar migración a TypeScript
- **Esfuerzo:** 40 horas (2-3 semanas progresivo)
- **Estrategia:** Empezar por `services/intereses.service.js` (el más puro). Luego `gatewayToken.service.js`. Luego el resto.
- **Impacto:** TypeScript previene categorías enteras de bugs. En código que maneja dinero, esto es invaluable.

### M3: Tests de integración para flujo de pago
- **Esfuerzo:** 24 horas (3 días)
- **Alcance:** POST /buscar → POST /pagos/iniciar → simular webhook → verificar BD
- **Impacto:** Cubre el happy path más crítico del negocio.

### M4: Extraer capa de repositorio
- **Esfuerzo:** 20 horas
- **Archivos:** Crear `repositories/` con `cliente.repository.js`, `deuda.repository.js`, etc.
- **Impacto:** Desacopla lógica de negocio del ORM. Facilita testing con mocks.

### M5: Mejorar logging con Application Insights
- **Esfuerzo:** 8 horas
- **Archivos:** `middlewares/logger.js`, `app.js`
- **Impacto:** Tracing distribuido, métricas de performance, alertas.

### M6: Agregar npm audit al CI
- **Esfuerzo:** 30 minutos
- **Archivos:** `.github/workflows/deploy-*.yml`
- **Impacto:** Detección temprana de vulnerabilidades en dependencias.

---

## 🟢 BAJO — Backlog

Mejoras deseables pero no urgentes. Se pueden hacer cuando haya tiempo.

### B1: Sistema de migraciones de BD
- Usar Sequelize migrations para versionar el schema

### B2: Containerización con Docker
- Dockerfile multi-stage para Node.js 20

### B3: CDN para assets estáticos
- Mover `/public` a Azure Blob Storage + Azure CDN

### B4: Métricas de negocio
- Dashboard con: pagos/día, tasa de éxito, monto promedio, tiempo hasta pago

### B5: Blue-green deployment
- Usar deployment slots de Azure App Service

### B6: Rate limiting por municipio
- Evitar que un municipio afecte a otros en la misma instancia

---

## Resumen Visual del Roadmap

```
SEMANA 1-2: SEGURIDAD (🔴)
├── C1: Helmet             [30 min]
├── C2: CSRF               [1 hora]
├── C3: PII cleanup        [2 horas]
├── A7: Scripts npm        [1 hora]
└── A4: CDN SRI            [1 hora]
    Total: ~6 horas

SEMANA 3-4: ESTABILIDAD (🟠)
├── A2: Health check       [1 hora]
├── A1: Unit tests         [16 horas]
├── A3: Log sanitization   [3 horas]
├── A6: Dead code removal  [1 hora]
└── M6: npm audit CI       [30 min]
    Total: ~22 horas

MES 2: PROFESIONALIZACIÓN (🟡)
├── A5: Split controller   [4 horas]
├── M1: ESLint + Prettier  [3 horas]
├── M2: TypeScript start   [40 horas inicio]
├── M3: Integration tests  [24 horas]
└── M4: Repository layer   [20 horas]
    Total: ~91 horas

MES 3+: ENTERPRISE (🟢)
├── M5: App Insights       [8 horas]
├── B1-B6: Backlog items   [variable]
└── B4: Business metrics   [16 horas]
```
