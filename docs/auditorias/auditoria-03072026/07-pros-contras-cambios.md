# 07 — Pros y Contras de Cambios Estructurales

Este documento analiza los tradeoffs de las decisiones de cambio más significativas. No son recomendaciones binarias — son análisis para que el equipo técnico decida con información completa.

---

## 1. Migrar a TypeScript

### Pros
- **Seguridad de tipos.** Previene bugs como `undefined is not a function`, acceso a propiedades inexistentes, y coercion errors en cálculos de dinero.
- **Documentación viva.** Las interfaces son documentación que el compilador fuerza. Un dev nuevo entiende la forma de los datos sin leer código.
- **Refactoring seguro.** Renombrar una propiedad de un modelo propaga el cambio a todos los usos en tiempo de compilación.
- **Mejor IDE.** Autocompletado, navegación, y errores en tiempo real.

### Contras
- **Curva de aprendizaje.** El equipo necesita aprender TypeScript. En gobierno municipal, puede ser difícil encontrar devs con este skill.
- **Tiempo de migración.** 23 modelos Sequelize + 10 services + 4 controllers = ~2-3 meses de trabajo.
- **Build step adicional.** Hoy `node app.js` funciona directo. Con TS, necesitás compilar.
- **Complejidad de tipos para Sequelize.** Sequelize + TypeScript tiene fricción conocida. Los tipos de queries dinámicas son complejos.
- **¿Vale la pena para este tamaño de proyecto?** 10,880 líneas es borderline para TS. El ROI es claro en proyectos >50K líneas.

### Veredicto
**Migración gradual, no big-bang.** Empezar por `intereses.service.js` y `gatewayToken.service.js` (los más puros). Agregar `tsconfig.json` con `allowJs: true`. No migrar modelos Sequelize inicialmente. Re-evaluar en 6 meses.

---

## 2. Agregar Tests Automatizados

### Pros
- **Confianza en deploys.** Hoy cada deploy a producción es fe. Con tests, sabés que lo básico funciona.
- **Documentación ejecutable.** Los tests muestran cómo se usa cada service.
- **Previene regresiones.** El bug de fecha timezone (ya corregido) no habría llegado a producción con tests.
- **Facilita onboarding.** Un dev nuevo lee los tests para entender el comportamiento.

### Contras
- **Tiempo inicial.** Escribir tests para código que no fue diseñado para testing lleva 2-3x más.
- **Mantenimiento.** Los tests también son código que hay que mantener.
- **Falsos positivos.** Tests frágiles que fallan por cambios irrelevantes generan ruido.
- **BD dependency.** La mayoría de los tests necesitan mock de Sequelize o una BD de prueba.

### Veredicto
**Invertir en tests YA.** El código que maneja dinero de contribuyentes sin tests es riesgo operacional y reputacional. Priorizar tests unitarios de services (sin BD). Dejar tests de integración para la Fase 3.

---

## 3. Extraer Capa de Repositorio

### Pros
- **Desacopla ORM de lógica de negocio.** Cambiar de Sequelize a Prisma o raw SQL no toca services.
- **Testeabilidad.** Los services se pueden testear con repositorios mock sin BD real.
- **Consulta centralizada.** Si hay un query complejo que se usa en 3 services, vive en un solo lugar.

### Contras
- **Capa extra de indirección.** Más archivos, más imports, más boilerplate.
- **Sobre-ingeniería para queries simples.** `ClientesCtaCte.findOne({ where: { IdTrans } })` no necesita repositorio.
- **Riesgo de leaky abstraction.** Si el repositorio expone métodos como `findWithComplexJoin()`, no ganaste nada.

### Veredicto
**No prioritario para el contexto actual.** Con 10 services y 1-2 developers, la capa de repositorio agrega más complejidad que valor. Reconsiderar cuando el proyecto crezca a 20+ services o múltiples fuentes de datos.

---

## 4. Adoptar Framework Frontend (React/Vue/Svelte)

### Pros
- **Componentización.** Reusar lógica entre vistas (header, footer, ticket preview, deudas table).
- **Estado global.** Manejo de selección de deudas, filtros, y modo demo sin DOM queries.
- **Ecosistema.** Librerías de UI components, form handling, HTTP clients.
- **Testing.** Component testing con Testing Library.

### Contras
- **Reescritura total del frontend.** 11 templates EJS + 2 archivos JS vanilla → hay que rehacer todo.
- **Build complexity.** Webpack/Vite, SSR vs SPA decision, routing.
- **Perfíl del equipo.** Si el equipo es full-stack JS vanilla, React tiene curva.
- **Sobrecarga para un portal simple.** El portal tiene 1 página principal + 5 vistas de resultado. ¿Justifica un framework?
- **SEO.** Si se usa SPA (React sin SSR), los motores de búsqueda no indexan. Necesitás Next.js/Nuxt.

### Veredicto
**No en este momento.** La complejidad del frontend actual no justifica un framework. En su lugar, mejoras incrementales: modularizar JS vanilla, usar ES modules, agregar HTMX para interacciones dinámicas sin SPA. Reconsiderar en 12 meses si la complejidad crece.

---

## 5. Containerizar con Docker

### Pros
- **Entorno idéntico dev/prod.** Adiós a "en mi máquina funciona".
- **Escalabilidad.** Kubernetes/Azure Container Apps permiten auto-scale más granular.
- **Cold start más rápido.** Containers inician más rápido que App Service en Windows.
- **Infrastructure as Code.** Dockerfile + docker-compose son documentación ejecutable del entorno.

### Contras
- **Complejidad operacional.** El equipo necesita saber Docker, Kubernetes, o Azure Container Apps.
- **Migración de Azure App Service.** Hay que mover secretos, configurar registro de containers, networking.
- **Costo.** Azure Container Apps puede ser más caro que App Service para cargas bajas.
- **Windows → Linux.** App Service en Windows no soporta containers Linux. Hay que migrar el App Service plan.

### Veredicto
**Planificar para mediano plazo (6-12 meses).** Crear Dockerfile ahora (20 líneas) para desarrollo local. La migración de producción requiere planificación de infraestructura y costo.

---

## 6. Cambiar de Sequelize a Prisma

### Pros
- **Type-safe queries.** Prisma genera tipos automáticamente del schema.
- **Migraciones built-in.** Prisma Migrate es muy superior a scripts SQL manuales.
- **Mejor DX.** Autocompletado, validación en tiempo de compilación, Prisma Studio para explorar datos.
- **Performance.** Prisma 5+ tiene mejor performance que Sequelize 6 en benchmarks.

### Contras
- **Migración masiva.** 23 modelos Sequelize → schema.prisma. 2-3 semanas de trabajo.
- **Curva del equipo.** Prisma tiene su propio DSL y conceptos.
- **Riesgo de regresión.** Cambiar el ORM en un sistema que maneja pagos es riesgoso.
- **Compatibilidad.** Prisma con Azure SQL / tedious tiene soporte, pero Sequelize es más maduro en este stack específico.

### Veredicto
**No prioritario.** Sequelize funciona, está estable, y el equipo lo conoce. Si se inicia migración a TypeScript, Prisma se vuelve más atractivo (tipos automáticos). Revisar en 2027.

---

## 7. Separar en Microservicios

### Pros
- **Escalabilidad independiente.** El servicio de consulta de deudas puede escalar distinto que el de pagos.
- **Aislamiento de fallos.** Si el webhook de pago falla, la búsqueda de DNI sigue funcionando.
- **Equipos independientes.** Cada municipio podría tener su propio deploy si fuera necesario.

### Contras
- **Complejidad operacional masiva.** Orquestación, service discovery, distributed tracing, circuit breakers.
- **Transacciones distribuidas.** El pago que actualiza deuda Y registra cobro en una transacción Sequelize → ahora necesitás saga pattern.
- **Costo.** Multiplicás recursos de infraestructura.
- **Sobre-ingeniería extrema.** Para 6 municipios y ~1000 consultas/día, los microservicios son absurdo.

### Veredicto
**NO. Rotundamente no.** Esto es un portal municipal, no Netflix. La arquitectura monolítica actual es correcta para el contexto. Si algún día hay 100 municipios y 100K consultas/día, se reconsidera.

---

## 8. Mejorar Seguridad HTTP (Helmet + CSRF + CSP)

### Pros
- **Protección inmediata.** 5 vectores de ataque eliminados con 30 minutos de trabajo.
- **Sin impacto en funcionalidad.** Helmet es transparente para el usuario.
- **Estándar de industria.** Toda app web en 2026 debería tener helmet.

### Contras
- **CSP puede romper funcionalidad.** Si la política es muy estricta, Google Fonts, jsPDF CDN, o inline scripts se bloquean.
- **Requiere testing.** Hay que probar en todos los navegadores.

### Veredicto
**Hacerlo AHORA.** Es el cambio con mejor relación costo/beneficio de todo el roadmap.

---

## Resumen de Veredictos

| Cambio | Veredicto | Timing |
|--------|-----------|--------|
| TypeScript | Gradual, empezar por services puros | Mes 2-3 |
| Tests | **Prioridad máxima** | Semana 3-4 |
| Repository layer | No prioritario | Revisar en 6 meses |
| Framework frontend | No ahora | Revisar en 12 meses |
| Docker (desarrollo) | Crear Dockerfile básico | Mes 3 |
| Docker (producción) | Planificar migración | Mes 6-12 |
| Prisma | No prioritario | Revisar en 2027 |
| Microservicios | **NO** | Nunca para este contexto |
| Helmet + CSRF | **HACER AHORA** | Semana 1 |
