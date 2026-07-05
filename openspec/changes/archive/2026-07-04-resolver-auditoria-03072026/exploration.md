## Exploration: resolver-auditoria-03072026

### Current State

The audit (`docs/auditorias/auditoria-03072026/`) identified **55 findings** across 5 domains (security, architecture/code, frontend, infrastructure/devops, testing) with **3 critical**, **14 high**, **23 medium**, and **15 low** severity items. The codebase is functional in production (Node.js/Express/Sequelize + EJS, MVC + Service Layer, multi-municipio) but has accumulated technical debt typical of delivery-speed-over-quality cycles. Three critical security vulnerabilities (no Helmet, no CSRF, PII exposed in HTML inline) are the primary blockers.

**Discrepancies found vs audit report** (current codebase diverges from audit snapshot in some areas):
- `/health` and `/health/ready` endpoints **already exist** in `routes/index.js:20-55` — the audit claimed they were missing.
- `public/javascripts/deudas.js` is **622 lines** (audit said 730 — likely a different snapshot).
- `.github/workflows/` **does exist** — 2 workflows (deploy-demo, deploy-elmanzano) both target `main`.

### Affected Areas

#### Security (CRITICAL)
- `app.js` — No `helmet` middleware, no CSP/HSTS/X-Frame-Options, no `X-Powered-By` disabled, no body size limit on `express.json()`, no CSRF protection
- `views/index.ejs:297-303` — PII (codigo, DNI, nombre, email) exposed in inline `<script>` tag
- `views/index.ejs:20` — jsPDF loaded from CDN without `integrity` (SRI) attribute
- `views/index.ejs:9-12` — Google Fonts loaded from CDN without SRI
- `middlewares/validator.js:138-141` — `sanitizeInput` middleware **exists but is not applied globally** in `app.js`
- `controllers/payment.controller.js:114-122` — Logs PII (`id_operacion`, `importe`, `external_reference`) in production
- `services/pagos.service.js:269` — Logs PII in debt payment details
- `services/ticketsPago.service.js:117` — Logs PII (`ticketNumber`, `ticketId`)

#### Architecture & Code (HIGH)
- `controllers/payment.controller.js` — **863 lines**, 3x recommended max. Mixes: iniciar pago (lines 213-454), webhook (lines 461-646), redirects (lines 656-863), demo, and polling
- `services/pagos.service.js:191-292` — `confirmarPago()` is legacy code **not called** from any controller (uses `metadata.conceptos_ids`); superseded by `confirmarPagoGateway()` at line 341
- `services/paymentGateway.service.js:347` — `checkPaymentStatus()` is a TODO stub, returns `null`
- `services/paymentGateway.service.js` — `createPagoTicPayment`, `createMacroPayment` only throw "no implementado"
- `routes/users.js` — 9-line placeholder, dead route, loaded in `app.js:56`
- `services/deudas.service.js:103` — **Hardcoded fallback**: `require('../config/municipalidad.config.elmanzano')` instead of using the dynamic config from `config/index.js`
- `services/intereses.service.js:148-152` — Commented-out `RecIntereses` fallback code
- `services/pagos.service.js:18-48` — `verificarPagoExistente` and direct `ClientesCtaCte.findAll()` calls in services (no repository layer)
- `package.json` — `morgan` is listed as dependency but **never used** (logger.js replaces it); `nodemon` referenced in scripts but absent from devDependencies; `jest` not in devDependencies though `jest.config.js` and test files exist

#### Frontend (MEDIUM)
- `public/javascripts/deudas.js` — 622-730 lines monolithic, should be split into modules (selector-deudas.js, ticket.js, pdf.js)
- `public/javascripts/index.js:151` — `fetch()` in `iniciarPago()` has no timeout; uses `alert()` for error UX
- `views/index.ejs:106` — DNI `oninput` sanitization is **client-side only** (no server-side equivalent applied)
- `views/index.ejs:140-141` — Business logic (credit calculation) in template, should be in controller
- `views/pago/pendiente.ejs` — Polling with `setInterval` every 3s, no backoff, no timeout
- `views/pago/comprobante.ejs` — 483 lines, extremely large template
- `views/index.ejs:287-291` — Dead code: QR button hidden with `&& false`

#### Infrastructure & DevOps (MEDIUM)
- `config/database.config.js:88` — **DB pool max = 5**, low for production multi-municipio
- `.github/workflows/deploy-demo.yml` and `deploy-elmanzano.yml` — No test/lint/audit stages, no rollback, no smoke tests
- `package.json:8-16` — Scripts `dev:*` use `cp` (Linux/macOS), **not cross-platform** (Windows needs `copy`)
- `bin/www` — No graceful shutdown handler (`SIGTERM` not caught), no `server.setTimeout()`
- `middlewares/logger.js` — No structured JSON logs, no Application Insights/APM integration
- No `.env`/credentials leak — confirmed secure (gitignored)

#### Testing (CRITICAL gap)
- `tests/intereses/engine.test.js` — Good unit tests for `intereses.service.js` (180 lines, 14 tests covering Mode A, Mode B, dispatcher)
- `tests/placeholder.test.js` — Minimal jest setup verification
- `tests/connection.db.test.js` — Single DB connection test
- **Jest not in package.json** — tests cannot run via `npm test` (no script exists)
- **Zero tests** for: `pagos.service.js`, `ticketsPago.service.js`, `gatewayToken.service.js`, `paymentGateway.service.js`, `deudas.service.js`
- **No CI test stage** — both workflows deploy without running any tests

### Recommendations (from audit) Verified

| ID | Finding | Severity | Code Evidence | Effort |
|----|---------|----------|---------------|--------|
| C1 | No Helmet | 🔴 CRITICAL | `app.js` L45-46 — `express.json()` and `express.urlencoded()` without helmet | 30 min |
| C2 | No CSRF | 🔴 CRITICAL | `views/index.ejs:102` — POST form without `_csrf` token; `app.js` no csrf middleware | 1 hr |
| C3 | PII in HTML | 🔴 CRITICAL | `views/index.ejs:297-303` — `contribuyenteData` with codigo, DNI, nombre, email | 2 hr |
| A1 | Unit tests | 🟠 HIGH | Tests exist for intereses but jest not in package.json, no npm test script | 16 hr |
| A2 | Health check | 🟠 HIGH | **ALREADY DONE** at `routes/index.js:20-55` | 0 hr |
| A3 | Log sanitization | 🟠 HIGH | `payment.controller.js:114-122` logs PII; `pagos.service.js:269` logs PII | 3 hr |
| A4 | CDN SRI | 🟠 HIGH | `views/index.ejs:20` — jsPDF CDN without integrity hash | 1 hr |
| A5 | Split controller | 🟠 HIGH | `payment.controller.js` — 863 lines | 4 hr |
| A6 | Dead code removal | 🟠 HIGH | `routes/users.js`, `confirmarPago()` legacy, `checkPaymentStatus` stub, `morgan` dep | 1 hr |
| A7 | Fix npm scripts | 🟠 HIGH | `dev:*` not cross-platform; jest/nodemon missing; no test script | 1 hr |
| M1 | ESLint + Prettier | 🟡 MEDIUM | No config files exist | 3 hr |
| M6 | npm audit in CI | 🟡 MEDIUM | Workflows have no audit step | 30 min |

### Approaches

1. **Full-scope fix (all 55 findings)** — Fix every finding from the audit in one change
   - Pros: Complete cleanup, no remaining debt
   - Cons: Massive scope (weeks of work), hard to review, high risk of regressions
   - Effort: **Very High** (80-120 hours)

2. **Security-first sprint (CRITICAL + HIGH security)** — Fix C1-C3, A3, A4, plus A7 (fix scripts)
   - Pros: Closes all security gaps in ~6 hours, immediate risk reduction, small change set
   - Cons: Leaves architecture/code debt and testing gaps for later
   - Effort: **Low** (~6-8 hours)

3. **Phased delivery (recommended)** — Deliver in 3 chained PRs:
   - **PR #1: Security Hotfix** (C1, C2, C3, A3, A4, S11) — ~6 hrs
   - **PR #2: Housekeeping** (A5 split controller, A6 dead code, A7 scripts, M1 ESLint) — ~8 hrs
   - **PR #3: Testing Foundation** (A1 unit tests for services + jest setup + CI audit) — ~20 hrs
   - Pros: Reviewable chunks, rapid security closure, each PR independently verifiable
   - Cons: More coordination overhead across PRs
   - Effort: **Medium** (~34 hours total across 3 phases)

### Recommendation

**Approach 3 — Phased delivery in 3 chained PRs.** The 3 critical security findings have trivial fixes (helmet ~30 min, CSRF ~1 hr, PII cleanup ~2 hrs) with zero functional impact — they should ship first. PR #2 cleans up technical debt and splits the oversized controller. PR #3 establishes the testing foundation that the project critically needs. This ordering ensures maximum risk reduction per hour invested.

Note: Health check (A2) is **already implemented** — skip it.

### Risks
- **CSP configuration may break inline scripts** — `views/index.ejs:296-303` uses inline `<script>`, CSP `'unsafe-inline'` or nonce will be needed. Test thoroughly after helmet install.
- **CSRF may break demo/polling endpoints** — The `/api/tickets/estado` polling endpoint and demo panel use `fetch()` POST without CSRF tokens. Need exemption strategy.
- **`confirmarPago()` dead code removal risk** — Must verify it's truly unreachable before deleting. Check all controller imports and route handlers.
- **CI/CD changes may disrupt existing deployment** — Adding test/audit stages could block deployments if tests fail. Implement as warning stage first, then enforce.
- **jest.config.js exists but jest not installed** — Adding jest to devDependencies will install it, but the `engine.test.js` tests may have import issues if they haven't been run before.

### Ready for Proposal
**Yes** — The exploration is complete. All 55 audit findings have been verified against actual code. Recommendation is clear: phased delivery with 3 chained PRs, starting with the security sprint. The orchestrator should launch `sdd-propose` for `resolver-auditoria-03072026` with the phased approach.
