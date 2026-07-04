# 02 — Auditoría de Ciberseguridad

## Resumen

El proyecto tiene **buenas defensas en la capa de negocio** (rate limiting, webhook autenticado, idempotencia) pero **debilidades en la capa HTTP y de exposición web**. No se encontraron vulnerabilidades de inyección ni exposición de credenciales en el código fuente.

---

## OWASP Top 10 — Evaluación

### A01: Broken Access Control
**Estado:** 🟠 Parcialmente cubierto

**Fortalezas:**
- Webhook protegido por JWT con secret rotativo diario (`gatewayToken.service.js:40-52`)
- Redirect protegido por código opaco intercambiable (`exchangeRedirectCode`)
- Municipio ID validado en token/redirect (`payment.controller.js:124,144`)
- Rate limiting diferenciado por endpoint

**Debilidades:**
- Sin autenticación de usuarios finales (cualquiera puede buscar por DNI)
- Sin control de acceso a endpoints administrativos
- `routes/users.js` expone rutas sin protección
- No hay distinción de roles (admin vs público)

**Severidad:** 🟠 ALTO — Los datos de deuda municipal son información personal. Buscar por DNI sin auth es aceptable si es intencional, pero debe documentarse.

---

### A02: Cryptographic Failures
**Estado:** 🟢 Bien cubierto

**Fortalezas:**
- Conexión BD con `encrypt: true` forzado para Azure SQL
- `trustServerCertificate: false` (no acepta certificados autofirmados)
- JWT con HS256 y secret rotativo diario (`gatewayToken.service.js:48`)
- Validación de issuer en JWT verify
- `hostNameInCertificate: '*.database.windows.net'` verificación estricta

**Debilidades:**
- JWT secret deriva de variable de entorno + fecha → predecible si se conoce el secret base
- Sin rotación forzada periódica del secret base

**Severidad:** 🟢 BAJO — El modelo de secret rotativo diario es adecuado para el contexto.

---

### A03: Injection
**Estado:** 🟢 Bien cubierto

**Fortalezas:**
- Sequelize ORM con queries parametrizadas por defecto
- Validación de entrada con `express-validator` en endpoints API
- Sanitización de DNI (solo dígitos, 7-10 chars)
- `body('*').trim().escape()` en sanitizeInput middleware

**Debilidades:**
- `sanitizeInput` middleware NO está aplicado globalmente en `app.js` — solo existe pero no se usa
- En `index.ejs:106`, el input de DNI tiene `oninput="this.value = this.value.replace(/[^0-9]/g, '')"` que es solo client-side

**Severidad:** 🟡 MEDIO — No hay riesgo de SQL injection por el ORM, pero la sanitización de output XSS no está aplicada.

---

### A04: Insecure Design
**Estado:** 🟡 Parcialmente cubierto

**Fortalezas:**
- Rate limiting en todos los endpoints API
- Idempotencia en procesamiento de pagos
- Separación gateway → portal

**Debilidades:**
- Sin threat model documentado
- Sin security.txt o política de divulgación
- El `confirmarPago()` legacy y `confirmarPagoGateway()` coexisten con lógica similar pero distinta

**Severidad:** 🟡 MEDIO

---

### A05: Security Misconfiguration
**Estado:** 🔴 Crítico

**Debilidades críticas:**
1. **Sin Helmet.** `app.js` no incluye helmet. Faltan:
   - `Content-Security-Policy` (CSP) — protección #1 contra XSS
   - `X-Frame-Options` — previene clickjacking
   - `X-Content-Type-Options: nosniff` — previene MIME sniffing
   - `Strict-Transport-Security` (HSTS) — fuerza HTTPS
   - `Referrer-Policy` — controla fuga de información en headers
   - `X-DNS-Prefetch-Control` — controla prefetch DNS
2. **Sin `X-Powered-By` removido.** Express expone `X-Powered-By: Express` por defecto, revelando la stack.
3. **`trust proxy: 1`.** Correcto para Azure con 1 proxy, pero si se agrega CDN/WAF adelante se rompe `req.ip`.
4. **Cookies sin flags de seguridad.** `cookie-parser` se usa sin configuración `httpOnly`, `secure`, `sameSite`.
5. **Sin límite de tamaño de request body.** `express.json()` y `express.urlencoded()` sin `limit`.

**Severidad:** 🔴 CRÍTICO — Son 5 configuraciones inseguras que se resuelven con ~10 líneas de código.

---

### A06: Vulnerable Components
**Estado:** 🟡 Precaución necesaria

**Fortalezas:**
- Dependencias pineadas con versión exacta (sin `^` ni `~`)
- `express@4.21.2` (parche de seguridad aplicado)
- `jsonwebtoken@9.0.2` (versión segura)

**Debilidades:**
- Sin `npm audit` en CI/CD
- Sin Dependabot/Renovate configurado
- `debug@2.6.9` — versión legacy sin soporte
- `http-errors@1.6.3` — versión antigua (actual es 2.x)

**Severidad:** 🟡 MEDIO — Agregar `npm audit --audit-level=high` al pipeline de CI.

---

### A07: Authentication Failures
**Estado:** 🟠 Parcialmente cubierto

**Fortalezas:**
- Webhook: JWT con secret rotativo + validación de issuer (`gatewayToken.service.js:70-72`)
- Redirect: code opaco exchange + token verification (`payment.controller.js:92-154`)
- Tolerancia a clock skew con secret de ayer y hoy

**Debilidades:**
- El JWT secret se deriva de `GATEWAY_WEBHOOK_SECRET + fecha`. Si el secret base es débil, el JWT es vulnerable.
- Sin rate limiting específico anti-forcing para tokens JWT (aunque el apiLimiter global ayuda)
- Sin invalidación de tokens (no hay blacklist)

**Severidad:** 🟠 ALTO — Depende de la fortaleza del secret configurado en producción. Recomiendo longitud mínima 256 bits.

---

### A08: Software and Data Integrity Failures
**Estado:** 🟡 Precaución

**Debilidades:**
- `jspdf@2.5.1` cargado desde CDN (`cdnjs.cloudflare.com`) sin subresource integrity (SRI)
- Google Fonts cargado desde CDN sin SRI
- Sin verificación de integridad de dependencias npm (sin `npm ci` con lockfile verification)

**Severidad:** 🟡 MEDIO

---

### A09: Logging and Monitoring Failures
**Estado:** 🟠 Alto

**Fortalezas:**
- Logger personalizado con timestamp y niveles (`logger.js`)
- Registro de errores con stack trace en desarrollo
- Logs de request/response con duración y status
- `PAYMENT_REDIRECT_DEBUG` para debugging de redirects

**Debilidades:**
1. **Sin logs de seguridad.** No se registran intentos fallidos de autenticación, rate limit hits, o patrones sospechosos.
2. **Sin retención de logs.** `console.log` → stdout. En Azure App Service, los logs se pierden al reiniciar.
3. **Sin alertas.** Si el webhook de pago falla 10 veces seguidas, nadie se entera.
4. **Logs en producción exponen datos.** `payment.controller.js:114-122` loguea `id_operacion`, `importe`, y `external_reference` — esto es PII sensible.
5. **Sin correlación de requests.** `requestId` se genera pero no se propaga a servicios ni a respuestas HTTP.

**Severidad:** 🟠 ALTO

---

### A10: SSRF (Server-Side Request Forgery)
**Estado:** 🟢 Bajo riesgo

**Fortalezas:**
- Las URLs de gateway vienen de `process.env.API_GATEWAY_URL` — no de input de usuario
- `exchangeRedirectCode` envía `municipio_id` validado, no user-controlled

**Debilidades:**
- `API_GATEWAY_URL` tiene default `http://localhost:3000` — en producción debe ser HTTPS
- Sin validación de que `API_GATEWAY_URL` sea HTTPS en producción

**Severidad:** 🟢 BAJO

---

## Hallazgos Fuera de OWASP Top 10

### H1: Exposición de PII en Frontend
**Severidad:** 🔴 CRÍTICO

`views/index.ejs:297-303` expone datos del contribuyente en un `<script>` inline:
```javascript
const contribuyenteData = {
  codigo: '<%= cliente ? cliente.Codigo : "" %>',
  dni: '<%= cliente ? (cliente.DOCUMENTO || "").trim() : "" %>',
  nombre: '<%= cliente ? (cliente.Nombre + " " + cliente.Apellido).trim() : "" %>',
  email: '<%= cliente ? (cliente.Email || "") : "" %>'
};
```
Esto expone DNI, nombre completo y código de contribuyente en texto plano en el HTML. Aunque ya se buscó por DNI, esta data queda en el historial del navegador, en cachés de CDN, y accesible vía "View Source".

**Remediación:** Mover a un endpoint API que requiera un token de sesión, o al menos no incluir `codigo` y `email`.

---

### H2: Sin Protección CSRF
**Severidad:** 🔴 CRÍTICO

El formulario `POST /buscar` y `POST /pagos/iniciar` no incluyen token CSRF. Un atacante puede:
1. Crear una página maliciosa que haga POST al portal
2. Si el usuario tiene una sesión activa, el request se ejecuta

**Remediación:** `csurf` o `csrf-csrf` middleware. ~5 líneas.

---

### H3: Dependencia de CDN Externo sin SRI
**Severidad:** 🟠 ALTO

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
```
Sin `integrity` attribute. Si cdnjs es comprometido, se inyecta JS malicioso en el portal de pagos.

**Remediación:** Agregar `integrity="sha384-..."` o bundler jsPDF con el resto de los assets.

---

### H4: Logging de PII en Producción
**Severidad:** 🟠 ALTO

- `payment.controller.js:114` loguea `external_reference`, `id_operacion`, `importe`
- `ticketsPago.service.js:117` loguea `ticketNumber`, `ticketId`
- `pagos.service.js:269` loguea detalles de deuda pagada

En producción, los logs de Azure App Service pueden ser accedidos por cualquier persona con acceso al recurso.

**Remediación:** Redactar datos sensibles en logs de producción. Usar hash o truncado.

---

## Evaluación de Configuración Segura

### Variables de Entorno
| Variable | ¿En .env.example? | ¿Expuesta en código? | Riesgo |
|----------|-------------------|---------------------|--------|
| DB_HOST | Sí | Solo en logs dev | Bajo |
| DB_USER | Sí | Solo en logs dev | Bajo |
| DB_PASS | Sí | Nunca | Bajo |
| GATEWAY_WEBHOOK_SECRET | Sí | Nunca | Bajo |
| API_GATEWAY_URL | Sí | En config export | Medio |

✅ Buenas prácticas: `.env` y `envs/` en `.gitignore`. `.env.example` existe como template.

### Manejo de Errores
- `payment.controller.js:448-453`: En producción, errores genéricos sin leak de stack trace. ✅ Correcto.
- `errorHandles.js:58-61`: Stack trace solo en desarrollo. ✅ Correcto.
- `pagos.service.js:538-545`: El error de transacción se loguea antes de propagar. ✅ Correcto.
- **Falta:** No hay sanitización de mensajes de error de Sequelize que pueden revelar estructura de BD.

---

## Resumen de Vulnerabilidades

| ID | Hallazgo | OWASP | Severidad | Esfuerzo |
|----|----------|-------|-----------|----------|
| S01 | Sin Helmet (CSP, HSTS, X-Frame, etc.) | A05 | 🔴 CRÍTICO | 30 min |
| S02 | Sin CSRF en formularios | - | 🔴 CRÍTICO | 1 hora |
| S03 | PII expuesta en HTML inline | - | 🔴 CRÍTICO | 2 horas |
| S04 | Logging de PII en producción | A09 | 🟠 ALTO | 3 horas |
| S05 | Sin `X-Powered-By` removido | A05 | 🟠 ALTO | 5 min |
| S06 | Cookies sin flags de seguridad | A05 | 🟠 ALTO | 30 min |
| S07 | CDN sin SRI (jsPDF, Google Fonts) | A08 | 🟠 ALTO | 1 hora |
| S08 | Sin alertas de fallos de webhook | A09 | 🟠 ALTO | 4 horas |
| S09 | JWT secret derivado de fecha | A02 | 🟡 MEDIO | 2 horas |
| S10 | Sin `npm audit` en CI | A06 | 🟡 MEDIO | 30 min |
| S11 | SanitizeInput no aplicado globalmente | A03 | 🟡 MEDIO | 15 min |
| S12 | Sin límite de request body size | A05 | 🟡 MEDIO | 5 min |
| S13 | `trust proxy: 1` no escala | A05 | 🟢 BAJO | 30 min |
| S14 | `http-errors` versión legacy | A06 | 🟢 BAJO | 1 hora |
| S15 | Sin security.txt | A04 | 🟢 BAJO | 10 min |

---

## Recomendación de Acción Inmediata

Los tres hallazgos 🔴 CRÍTICOS (S01, S02, S03) se resuelven en menos de 4 horas totales y deberían ser la prioridad #1 del próximo sprint.
