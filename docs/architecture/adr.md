# 📜 Architecture Decision Records — Portal de Pagos Municipal

> **Propósito**: Registro cronológico de decisiones de arquitectura significativas.
> **Formato**: [ADR simplificado](https://adr.github.io/) — contexto, decisión, consecuencias.
> **Última actualización**: 2026-07-04

---

## ADR-001: Gateway intermedio obligatorio

**Fecha**: 2026-03  
**Estado**: ✅ Aceptado

### Contexto

El portal necesita procesar pagos pero no debe comunicarse directamente con plataformas de pago (SIRO, MercadoPago, etc.). Cada plataforma tiene su propio protocolo, autenticación y formato de respuesta.

### Decisión

Toda comunicación con plataformas de pago pasa por un **API Gateway intermedio** (`api-gateway-pagos`). El portal solo conoce los endpoints del gateway, nunca los de SIRO u otras pasarelas.

### Consecuencias

- ✅ Una sola integración que atiende a múltiples municipios
- ✅ Las credenciales bancarias viven en un solo lugar (el gateway)
- ✅ Cambiar de pasarela no requiere modificar el portal
- ❌ El gateway es un punto único de fallo — requiere monitoreo y alta disponibilidad

### Archivos relacionados

- `docs/CONTRACT-PORTAL-GATEWAY.md`
- `api-gateway-pagos/` (repositorio separado)

---

## ADR-002: Webhook como única fuente de verdad

**Fecha**: 2026-03  
**Estado**: ✅ Aceptado

### Contexto

Cuando un contribuyente paga en SIRO, el resultado puede llegar al portal por dos vías: el redirect del navegador (visible al usuario) y el webhook server-to-server (invisible). Se necesita decidir cuál actualiza la base de datos.

### Decisión

Solo el **webhook server-to-server** (Flujo B) actualiza la BD del portal. El redirect del navegador (Flujo A) se usa exclusivamente para mostrar la vista de resultado. Si el webhook no llegó, la vista muestra "pendiente de confirmación".

### Consecuencias

- ✅ Consistencia garantizada: la BD solo refleja confirmaciones server-to-server
- ✅ El contribuyente no puede manipular la URL para simular un pago
- ❌ Si el webhook se demora, el contribuyente ve "pendiente" aunque ya pagó
- ❌ Requiere lógica de polling en el frontend y reintentos en el gateway

### Archivos relacionados

- `docs/CONTRACT-PORTAL-GATEWAY.md` (Flujo A y Flujo B)
- `services/paymentGateway.service.js`

---

## ADR-003: Código opaco en redirect (no JWT en URL)

**Fecha**: 2026-04  
**Estado**: ✅ Aceptado

### Contexto

El diseño original usaba un JWT en la URL del redirect del navegador. Un JWT firmado (no cifrado) expone el payload en historial de navegación, logs de proxy y encabezados Referer.

### Decisión

El gateway genera un **código opaco de un solo uso** con TTL corto. El payload sensible (estado, referencia, importe) viaja exclusivamente en el exchange server-to-server, autenticado con `GATEWAY_REDIRECT_EXCHANGE_SECRET`.

```
Navegador recibe:    /pagos/exitoso?code=abc123          ← opaco
Portal backend hace: POST /api/pagos/redirect/exchange   ← autenticado
Gateway responde:    { estado, external_reference, ... } ← datos reales
```

### Consecuencias

- ✅ Sin datos sensibles en URLs, historial o logs
- ✅ El código es de un solo uso (no se puede reutilizar)
- ❌ Una llamada extra server-to-server por cada redirect

### Archivos relacionados

- `docs/CONTRACT-PORTAL-GATEWAY.md` (sección "Por qué este diseño")

---

## ADR-004: Modelo multi-municipio por configuración

**Fecha**: 2026-03  
**Estado**: ✅ Aceptado

### Contexto

El portal debe soportar múltiples municipios con diferente branding, credenciales de BD y reglas de negocio. Las alternativas eran: un repo por municipio (duplicación explosiva) o feature flags (complejidad de runtime).

### Decisión

Un solo código base. La diferenciación entre municipios se logra 100% por **variables de entorno** y archivos de configuración específicos (`config/municipalidad.config.{municipio}.js`). El municipio activo se selecciona con `MUNICIPIO={municipio}`.

### Consecuencias

- ✅ Un solo repo para mantener
- ✅ Agregar un municipio no requiere tocar código de negocio
- ✅ Despliegues independientes por App Service
- ❌ Las variables de entorno deben estar sincronizadas entre desarrollo y Azure
- ❌ No hay隔离 total entre municipios en el código (si se rompe algo, afecta a todos)

### Archivos relacionados

- `config/index.js`
- `config/municipalidad.config.*.js`
- `docs/GUIA_NUEVO_MUNICIPIO.md`

---

## ADR-005: Migración de MercadoPago a SIRO

**Fecha**: 2026-04  
**Estado**: ✅ Completado

### Contexto

La integración original usaba MercadoPago como pasarela de pago. Por requisitos del cliente (municipios de Córdoba), se migró a SIRO (Banco Roela), que es la plataforma usada por el sistema Alcaldía.

### Decisión

Reemplazar MercadoPago por SIRO como pasarela activa. La arquitectura de gateway intermedio hizo que esta migración impactara solo al gateway, no al portal. Los documentos de MercadoPago se archivaron en `docs/_archive/`.

### Consecuencias

- ✅ Migración transparente para el portal (solo cambió `PAYMENT_GATEWAY=siro`)
- ✅ Documentación histórica preservada en `_archive/`
- ❌ Las credenciales de prueba de SIRO son compartidas entre municipios en homologación

### Archivos relacionados

- `docs/_archive/PLAN_INTEGRACION_MERCADOPAGO.md`
- `docs/_archive/INTEGRACION_PAGOS_MERCADOPAGO.md`

---

## ADR-006: Idempotencia por external_reference

**Fecha**: 2026-03  
**Estado**: ✅ Aceptado

### Contexto

El webhook del gateway puede llegar más de una vez (reintentos). Procesar el mismo pago dos veces generaría registros contables duplicados.

### Decisión

La idempotencia se verifica por `external_reference`. Si un webhook llega con un `external_reference` que ya fue procesado (ticket en estado `APROBADO`), el portal responde `200` sin reprocesar.

### Consecuencias

- ✅ Sin pagos duplicados incluso con reintentos del gateway
- ✅ La conciliación matutina puede reenviar webhooks sin riesgo
- ❌ Requiere que `external_reference` sea único y nunca se reutilice

### Archivos relacionados

- `services/paymentGateway.service.js`
- `docs/CONTRACT-PORTAL-GATEWAY.md` (sección "Idempotencia obligatoria")

---

## ADR-007: Rotación diaria de claves JWT

**Fecha**: 2026-04  
**Estado**: ✅ Aceptado

### Contexto**

Los webhooks y el exchange del redirect usan JWTs. Si una clave se compromete y no rota, un atacante podría falsificar webhooks indefinidamente.

### Decisión**

La clave efectiva de firma/cifrado es `WEBHOOK_SECRET` + `YYYY-MM-DD`. Esto produce una rotación automática diaria sin intervención manual. Un token capturado hoy es inválido mañana.

### Consecuencias

- ✅ Rotación automática sin despliegues ni coordinación entre equipos
- ✅ Ventana de exposición limitada a 24 horas
- ❌ Ambos servidores deben tener la hora sincronizada (NTP)
- ❌ Si el secreto base se compromete, todos los tokens son vulnerables hasta que se reemplace

### Archivos relacionados

- `docs/CONTRACT-PORTAL-GATEWAY.md` (sección "Secretos compartidos")

---

## ADR-008: csrf-csrf como biblioteca CSRF (double-submit cookie)

**Fecha**: 2026-07-04
**Estado**: ✅ Aceptado  
**SDD Change**: `resolver-auditoria-03072026`

### Contexto

El portal no tenía protección CSRF en formularios POST. La biblioteca tradicional `csurf` está deprecada y requiere `express-session` para almacenar el secreto CSRF, lo que introduce una dependencia stateful en una arquitectura actualmente stateless.

### Decisión

Usar `csrf-csrf` con patrón **double-submit cookie**. El token CSRF se envía como cookie `httpOnly` + `sameSite: strict` y el cliente lo devuelve en header `CSRF-Token` (fetch) o campo `_csrf` (form EJS). El servidor compara ambos — no necesita session store.

### Consecuencias

- ✅ Sin dependencia de session-store (compatible con stateless actual)
- ✅ Funciona tanto con `<form>` POST como con `fetch()`
- ✅ Feature flag `SECURITY_CSRF_ENABLED` para hot-disable
- ❌ Requiere que el cliente envíe el token explícitamente
- ❌ La cookie no usa prefijo `__Host-` (rompería desarrollo local sin HTTPS)

### Archivos relacionados

- `middlewares/csrf.js`
- `openspec/changes/resolver-auditoria-03072026/design.md`

---

## ADR-009: Signed cookies para sesión de PII

**Fecha**: 2026-07-04  
**Estado**: ✅ Aceptado  
**SDD Change**: `resolver-auditoria-03072026`

### Contexto

La auditoría detectó PII del contribuyente (`codigo`, `DNI`, `nombre`, `email`) embebida en un `<script>` inline en `views/index.ejs`. Para eliminarla, se necesita un mecanismo que permita al frontend obtener esos datos vía API pero solo para el contribuyente autenticado.

### Decisión

Usar **signed cookies** (`cookie-parser` con `COOKIE_SECRET`) en lugar de `express-session`. El controller `buscarPorDni` setea `res.cookie('ccodigo', codigo, { signed: true, httpOnly: true, sameSite: 'strict' })`. El endpoint `GET /api/contribuyente/:codigo` valida que `req.signedCookies.ccodigo === :codigo` antes de retornar datos.

### Consecuencias

- ✅ Sin session-store — el único dato de sesión es `codigo`
- ✅ La cookie es `httpOnly` (no legible desde JS) y `signed` (no falsificable)
- ✅ El frontend lee el código desde `<body data-codigo="...">` (atributo DOM, no cookie)
- ❌ Si el secreto se compromete, las cookies firmadas son falsificables

### Archivos relacionados

- `controllers/web.controller.js`
- `controllers/api/contribuyente.controller.js`
- `openspec/changes/resolver-auditoria-03072026/design.md`

---

## ADR-010: jsPDF como bundle local

**Fecha**: 2026-07-04  
**Estado**: ✅ Aceptado  
**SDD Change**: `resolver-auditoria-03072026`

### Contexto

`views/index.ejs` cargaba jsPDF desde CDN sin atributo `integrity` (SRI). Agregar SRI a un CDN externo es frágil: al actualizar la versión de la librería, el hash cambia y rompe la carga hasta que se actualice manualmente.

### Decisión

Descargar jsPDF 2.5.1 UMD y servirlo como **bundle local** en `public/javascripts/vendor/jspdf.umd.min.js`. Esto elimina la dependencia del CDN, simplifica la política CSP (todo es `'self'`), y hace el SRI innecesario (el archivo es local).

### Consecuencias**

- ✅ Sin dependencia externa de CDN para funcionalidad core (generación de PDF)
- ✅ CSP más simple: `script-src 'self'` alcanza
- ✅ El hash del archivo no cambia con actualizaciones externas
- ❌ ~400 KB adicionales en el repo (vendor)
- ❌ Actualizar jsPDF requiere commit manual del nuevo bundle

### Archivos relacionados

- `public/javascripts/vendor/jspdf.umd.min.js`
- `views/index.ejs`
- `openspec/changes/resolver-auditoria-03072026/design.md`

---

## Referencias

- [ADR en GitHub](https://adr.github.io/) — Documentación del formato ADR
- [CONTRACT-PORTAL-GATEWAY.md](CONTRACT-PORTAL-GATEWAY.md) — Decisiones técnicas del contrato de integración
