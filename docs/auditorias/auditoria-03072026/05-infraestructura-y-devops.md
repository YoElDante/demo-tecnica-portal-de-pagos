# 05 — Infraestructura y DevOps

## Stack de Infraestructura

- **Runtime:** Node.js 20+ en Azure App Service (Windows)
- **Base de datos:** Azure SQL Database
- **CI/CD:** GitHub Actions (2 workflows activos)
- **Sin containerización** (sin Docker, sin Kubernetes)
- **Sin CDN** (assets servidos desde Express static)
- **Sin APM** (Application Performance Monitoring)

---

## GitHub Actions Workflows

### `deploy-demo.yml`
- **Trigger:** Push a `develop` (NOTA: rama `develop` no existe — posiblemente roto o en desuso)
- **Target:** Azure App Service demo
- **Sin pasos de:** lint, test, audit, build verification
- **Solo hace:** checkout → deploy a Azure

### `deploy-elmanzano.yml`
- **Trigger:** Push a `main`
- **Target:** Azure App Service El Manzano (producción)
- **Misma carencia:** sin validación pre-deploy

### Problemas
1. **Sin stage de testing.** El código va directo a producción sin pasar por tests.
2. **Sin `npm ci` verification.** No se verifica que `package-lock.json` sea consistente.
3. **Sin rollback automático.** Si el deploy falla o la app no arranca, no hay vuelta atrás.
4. **Sin smoke tests post-deploy.** No se verifica que la app responda 200 después del deploy.
5. **Sin secretos en GitHub Secrets.** Las credenciales de Azure están en archivos `*.PublishSettings` gitignored — esto es frágil.

---

## Azure App Service

### Configuración Actual

| Aspecto | Estado | Recomendación |
|---------|--------|---------------|
| `trust proxy: 1` | ✅ Correcto para 1 proxy | Si se agrega CDN/WAF, cambiar a número de proxies |
| HTTPS | ✅ Azure lo fuerza | Agregar HSTS header (vía helmet) |
| Always On | ❓ No verificado | Debe estar ON para producción |
| Health check | ❌ No implementado | Agregar `GET /health` |
| ARR Affinity | ❓ No verificado | Debe estar OFF para stateless apps |
| WebSockets | ❓ No verificado | OFF (no se usan) |
| Auto-scale | ❓ No verificado | Configurar basado en CPU/memoria |

### `bin/www` (HTTP Server Bootstrap)
- No lo leí completo, pero es el entry point estándar de Express Generator.
- Debería incluir `server.setTimeout()` para evitar conexiones colgadas.
- Debería manejar `SIGTERM` para graceful shutdown (Azure envía SIGTERM en slot swap).

---

## Base de Datos

### Azure SQL
- **Pool size: 5** — bajo para producción con múltiples municipios
- **Sin read replicas** — todas las consultas van al primary
- **Sin elastic pool** documentado (¿está usando DTU básico?)
- **Connection string** con `encrypt: true` — correcto

### Migraciones
- **Sin sistema de migraciones.** Los esquemas se crean con scripts SQL manuales en `docs/bd/`.
- Esto es frágil: no hay tracking de qué versión de schema está aplicada en cada ambiente.

### Scripts SQL
- `docs/bd/script_creacion_bd_092025.sql` — creación inicial
- `docs/bd/script_creacion_bd_ElManzano_062026.sql` — schema El Manzano
- `docs/bd/AZURE_SQL_TICKETS_PAGO_SETUP.sql` — tablas de tickets
- **Problema:** No está claro cuál es el orden de ejecución ni qué scripts ya se aplicaron en producción.

---

## Logging y Monitoreo

### Situación Actual
- Logger custom en `middlewares/logger.js` → stdout
- `console.log`/`console.error` en todo el código
- Sin estructura de logs JSON (dificulta parsing en Azure)
- Sin niveles de log por módulo (todo o nada con `LOG_LEVEL`)

### Lo que falta
1. **Application Insights.** Sin SDK de Azure para tracing distribuido.
2. **Métricas de negocio.** Sin contadores de: pagos iniciados, pagos completados, tasa de error, tiempo de respuesta.
3. **Alertas.** Sin alertas para:
   - Tasa de error > 5% en webhook
   - Tiempo de respuesta > 2s en búsqueda de DNI
   - Errores 500 consecutivos
   - Tickets expirados sin pagar acumulados
4. **Dashboards.** Sin visibilidad operacional.

---

## Ambiente de Desarrollo

### `envs/` directory
- 6 `.env.{municipio}` + 6 `azure.{municipio}.json`
- Bien organizado por municipio
- **Riesgo:** Los `.env` están gitignored pero existen localmente con credenciales reales. Una mala configuración de `.gitignore` los expondría.

### Scripts npm
| Script | Comando |
|--------|---------|
| `start` | `node bin/www` |
| `dev` | `nodemon bin/www` (nodemon no está en package.json!) |
| `dev:demo` | `MUNICIPIO=demo node bin/www` |
| `dev:elmanzano` | `MUNICIPIO=elmanzano node bin/www` |
| `testDB` | `node tests/connection.db.test.js` |
| `test` | ❌ No existe script `test` |

**Problemas:**
- `nodemon` referenciado en scripts pero no está en `package.json` → falla `npm run dev`
- Sin script `test` para correr Jest
- `dev:*` usan `MUNICIPIO=xxx` (Linux/macOS). En Windows (PowerShell) esto falla. Los scripts `dev:*` no son cross-platform.

---

## Recomendaciones

### Corto Plazo (Sprint 1-2)
1. **Agregar stage de validación al CI:** `npm ci` → `npm audit --audit-level=high` → `npm test` (placeholder).
2. **Agregar `GET /health` endpoint.** Devuelve 200 + timestamp + DB status.
3. **Configurar Application Insights.** SDK de Azure para Node.js. ~10 líneas.
4. **Arreglar scripts `dev:*`.** Usar `cross-env` para compatibilidad multiplataforma.

### Mediano Plazo (Sprint 3-5)
5. **Health check en Azure App Service.** Apuntar a `/health`.
6. **Alertas Azure Monitor.** Tasa de error, latencia, disponibilidad.
7. **Subir DB pool size** de 5 a 20 para producción.
8. **Agregar graceful shutdown** en `bin/www` (manejar SIGTERM).

### Largo Plazo (Sprint 6+)
9. **Containerizar** (Dockerfile → Azure Container Apps o AKS).
10. **Blue-green deployment** con deployment slots de Azure.
11. **Sistema de migraciones** (Sequelize migrations o `db-migrate`).
12. **Métricas de negocio** con dashboard en Azure Monitor o Grafana.
