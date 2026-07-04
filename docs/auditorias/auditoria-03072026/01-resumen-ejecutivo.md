# 01 — Resumen Ejecutivo

## Nivel General del Repositorio

**Calificación: Junior+ / Mid-level (6/10)**

El repositorio muestra un proyecto funcional en producción con decisiones arquitectónicas correctas en su núcleo, pero con acumulación de deuda técnica típica de velocidad de entrega sobre calidad. Está **por encima del promedio de proyectos municipales** que he auditado, pero **lejos de estándares enterprise**.

---

## Lo Bueno

### Fortalezas Arquitectónicas
1. **Separación MVC + Service Layer limpia.** Controllers no acceden a modelos directamente; la lógica de negocio está en services. Esto es correcto y facilita testing.
2. **Multi-municipio por configuración.** `MUNICIPIO=elmanzano` + `config/municipalidad.config.*.js` es elegante, 12-factor compliant, y evita forks por municipio.
3. **Idempotencia en pagos.** El webhook verifica `NRO_OPERACION` antes de procesar, y el controller diferencia `already_processed` de `processed`. Esto es nivel senior.
4. **Doble registración contable.** `actualizarDeudaComoPagada` + `crearRegistroCobro` en una transacción Sequelize. Correcto desde el punto de vista contable (CodMovim H → Saldo=0 + CodMovim D como contrapartida).
5. **Gateway externo para pagos.** El portal nunca habla directo con SIRO/MercadoPago. El API Gateway intermedia. Buena separación de responsabilidades.
6. **Redirect con code opaco + JWT rotativo.** `exchangeRedirectCode` evita exponer payload sensible en la URL del browser. La rotación diaria del secret es un plus.
7. **Rate limiting con IP limpia.** `cleanIpKeyGenerator` maneja correctamente el formato `IP:PUERTO` de Azure Load Balancer.
8. **Modelos Sequelize bien definidos.** 23 modelos mapeando el esquema real de la BD municipal, con asociaciones correctas.
9. **Motor de intereses puro.** `intereses.service.js` no depende de BD ni de `process.env` — recibe config por parámetro. Esto es testeable y correcto.

### Fortalezas de Dominio
1. **Modelo de datos rico.** `TIPO_BIEN` con 11 categorías tributarias, `CodMovim` H/D, registro de eventos de pago.
2. **Tickets con ciclo de vida.** `CREADO → PENDIENTE → APROBADO/RECHAZADO/EXPIRADO` con fechas de expiración y retención.
3. **Numeración única de tickets.** `ELMANZANO-20260413-00001` con reintentos ante colisiones de concurrencia.
4. **Modo demo completo.** Simulación de flujo de pago sin tocar BD productiva. Excelente para ventas y capacitación.

---

## Lo Malo

### Problemas Estructurales
1. **Sin tests automatizados reales.** Solo hay 1 test de conexión BD. Cero tests unitarios de services, cero tests de integración, cero E2E. Esto es el mayor riesgo del proyecto.
2. **Sin linting ni formateo.** Sin ESLint, sin Prettier. El código es consistente por disciplina del desarrollador, no por tooling. Esto no escala a múltiples devs.
3. **Sin TypeScript.** 10,880 líneas de JS sin tipos. En un proyecto que maneja dinero y deuda municipal, esto es un riesgo.
4. **Sin protección HTTP (Helmet).** Sin CSP, sin X-Frame-Options, sin HSTS. Depende 100% de Azure para cabeceras de seguridad.
5. **Sin CSRF.** Los formularios POST no tienen token anti-CSRF.

### Deuda Técnica
1. **`payment.controller.js` (863 líneas).** 3 veces el tamaño recomendado. Mezcla iniciar pago, webhook, redirects, demo, y polling.
2. **`deudas.js` frontend (730 líneas).** Monolítico. Incluye manipulación de DOM, PDF, selección, filtrado, y cálculos en un solo archivo.
3. **Lógica duplicada.** `parseCivilDate` en `intereses.service.js` y `normalizarFechaCivil` en `deudas.service.js`. Las URLs del gateway se construyen en el controller en vez de en el service.
4. **Código muerto.** `confirmarPago()` en `pagos.service.js` parece legacy (usa `metadata.conceptos_ids`). `routes/users.js` es un placeholder de 9 líneas.
5. **Hardcodeo.** `require('../config/municipalidad.config.elmanzano')` hardcodeado en `deudas.service.js` línea 103 como fallback de tasa.

### Riesgos Operativos
1. **Sin health check endpoint.** Azure no puede verificar si la app está realmente saludable.
2. **Sin métricas de negocio.** No se puede saber cuántos pagos por día, tasa de éxito, tiempo promedio de pago.
3. **Sin alertas.** Si el webhook deja de funcionar, nadie se entera hasta que un contribuyente reclama.
4. **DB pool size = 5.** Para producción multi-municipio con picos de consulta, es bajo.
5. **Sin estrategia de caché.** Cada búsqueda de DNI recalcula intereses para todas las deudas. Con 1000+ consultas/día, esto pega fuerte en BD.

---

## Comparación con la Industria

| Aspecto | Este proyecto | Startup típica | Enterprise | Brecha |
|---------|---------------|----------------|------------|--------|
| Arquitectura | MVC + Services | Similar | Hexagonal/DDD | Media |
| Tipado | JS vanilla | JS/TS mixto | TypeScript | Alta |
| Testing | 0% coverage | 30-50% | 80%+ | **Crítica** |
| CI/CD | Deploy solamente | Test + Deploy | Test + Lint + Build + Deploy + Rollback | Alta |
| Seguridad HTTP | Sin helmet | Helmet básico | CSP + HSTS + HPKP | Alta |
| Monitoreo | Console.log | CloudWatch/Loggly | Datadog/NewRelic + APM | Alta |
| Documentación | Buena (docs/) | Variable | OpenAPI + ADRs | Baja |
| Multi-tenancy | Por config | Por BD/tenant | Por tenant con isolation | Baja |

---

## Conclusión

El proyecto **funciona y genera valor real** para municipios. Las decisiones de arquitectura del núcleo (separación de pagos, idempotencia, multi-municipio) son sólidas.

**El gap principal es calidad de software profesional:** testing, tipado, tooling, y seguridad HTTP. Esto es normal en un proyecto que priorizó velocidad de entrega, pero ahora que está en producción con múltiples municipios, **la deuda técnica empieza a doler**.

La buena noticia: las 3 vulnerabilidades críticas de seguridad se resuelven con cambios pequeños (instalar helmet, agregar CSRF, sanitizar output). El resto es mejora progresiva.

---

## Recomendación Estratégica

**Fase 1 (Sprint 1-2): Seguridad** — helmet, CSRF, CSP, sanitización.
**Fase 2 (Sprint 3-4): Estabilidad** — tests unitarios de services, health check, pool size, alertas.
**Fase 3 (Sprint 5-8): Profesionalización** — ESLint, Prettier, TypeScript gradual, tests de integración.
**Fase 4 (Sprint 9+): Enterprise** — APM, métricas de negocio, caché, blue-green deploy.
