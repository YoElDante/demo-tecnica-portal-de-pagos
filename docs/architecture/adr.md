# 📜 Architecture Decision Records — Portal de Pagos Municipal

> **Propósito**: Registro cronológico de decisiones de arquitectura significativas.
> **Formato**: [ADR simplificado](https://adr.github.io/) — contexto, decisión, consecuencias.
> **Última actualización**: 2026-07-02

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

## Referencias

- [ADR en GitHub](https://adr.github.io/) — Documentación del formato ADR
- [CONTRACT-PORTAL-GATEWAY.md](CONTRACT-PORTAL-GATEWAY.md) — Decisiones técnicas del contrato de integración
