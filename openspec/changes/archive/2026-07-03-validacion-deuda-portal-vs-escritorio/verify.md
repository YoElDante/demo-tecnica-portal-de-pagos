# Verification Report: validacion-deuda-portal-vs-escritorio

- **Change**: validacion-deuda-portal-vs-escritorio
- **Mode**: hybrid (Engram + OpenSpec)
- **TDD**: strict_tdd = false (standard verify, TDD module skipped)
- **Date**: 2026-07-03
- **Verifier**: sdd-verify sub-agent

## Completeness Table

| Artifact | Present | Notes |
|---|---|---|
| proposal.md | ✅ | Intent, scope, success criteria defined |
| design.md | ✅ | Architecture decisions + data flow |
| tasks.md | ⚠️ | All 17 task checkboxes UNCHECKED — tracking blocker |
| specs/interest-calculation/spec.md | ✅ | ADDED/MODIFIED/REMOVED requirements |
| specs/debt-validation/spec.md | ✅ | New capability, 4 requirements + scenarios |
| Implementation (PR 1) | ✅ | 4 service/config files modified |
| Implementation (PR 2) | ✅ | engine.test.js + validar-contra-csv.js |

## Build / Tests / Coverage Evidence

| Check | Command | Result |
|---|---|---|
| Syntax: intereses.service | `node -e "require('./services/intereses.service')"` | ✅ OK |
| Syntax: intereses.config | `node -e "require('./config/intereses.config')"` | ✅ OK |
| Syntax: datos-generales.service | `node -e "require('./services/datos-generales.service')"` | ✅ OK |
| Syntax: deudas.service | `node -e "require('./services/deudas.service')"` | ✅ OK (loads models + .env) |
| Test suite | `jest tests/intereses/engine.test.js --verbose` | ✅ **19 passed, 19 total** (1.242s) |
| Validation script | `node tests/intereses/validar-contra-csv.js` | ⚠️ NOT RUN — requires production DB access (operator consent required) |
| Lint / type-check | n/a | Project has none |

> Note: Jest is present in `node_modules/.bin/jest.cmd` and runs, but is NOT declared in `package.json` (no `test` script, no `devDependencies`). Tests pass in the current working tree; a clean `npm install` / CI clone could NOT run them. See WARNING W2.

## interest-calculation Spec Compliance Matrix

| Requirement / Scenario | Status | Evidence |
|---|---|---|
| CodMovim = 'H' filter in debt query | ✅ PASS | `deudas.service.js:208` (`obtenerDeudasPorCodigo`), `:270` (`obtenerDeudasPorCodigoODni`) |
| Scenario: Query excludes cobro records | ⚠️ SOURCE-ONLY | Filter present in code; no runtime test on the service query (engine tests cover pure formula only) |
| Scenario: Empty result when only cobro | ⚠️ SOURCE-ONLY | Same as above |
| Formula basada en Saldo (not Importe) | ✅ PASS | `deudas.service.js:302` `total = Number((saldo + resultado.interes).toFixed(2))` |
| 2 modos: A (coeficiente) + B (diario) | ✅ PASS | `intereses.service.js` exports `calcularInteresCoeficiente` + `calcularInteresSimpleFA` only |
| Scenario: Deuda vencida modo B | ✅ PASS (runtime) | `engine.test.js:48` `calcularInteresSimpleFA(10000,40,30)` → 328.77 ✅ |
| Scenario: Deuda vigente sin mora | ✅ PASS (runtime) | `engine.test.js:60` (dias=0→0), `:171` (fecha futura→0) ✅ |
| Scenario: Modo A con coeficiente | ⚠️ PARTIAL | Mode A dispatch tested (`engine.test.js:17,80,92`), but spec's exact formula `Saldo*0.05` (coef=1.05) does NOT match implemented `Saldo*(IndiceFinal/CoeficienteCuota)`. See WARNING W4 |
| Scenario: Total con redondeo tolerance | ⚠️ SOURCE-ONLY | `formatearDeuda` total computation untested at runtime |
| Mode C removed entirely | ✅ PASS | grep: `calcularDescuentoUnicoPago`/`MAPPING_CUOTABASICA` absent from ALL source (only in openspec docs + prior change spec) |
| FechaDesdeInt: ≤ (inclusive) | ✅ PASS (runtime) | `intereses.service.js:110` `fechaVtoDate <= fechaLimite`; boundary test `engine.test.js:92` ✅ |
| RecIntereses commented | ✅ PASS | `intereses.service.js:134-139` (commented block with rationale) |
| DESC_INMUEBLE = 1.0 (deferred) | ✅ PASS | `config/intereses.config.js:9` `const DESC_INMUEBLE = 1.0` |
| Tasa configurable (datosgenerales) | ✅ PASS | `datos-generales.service.js:18-30` reads `TasaInteres/IndiceFinal/FechaDesdeInt` |

## debt-validation Spec Compliance Matrix

| Requirement / Scenario | Status | Evidence |
|---|---|---|
| CSV test data ingestion from `docs/pruebas_documentos_a_comparar/` | ✅ PASS (source) | `validar-contra-csv.js:260-261` reads dir; 5 CSVs present (CACERES, PLAINO, OLMOS, MISERENDINO, CRAVERO) |
| Scenario: Load single CSV | ✅ PASS (source) | `parsearCSV` (`:45-87`), reports row count (`:132`) |
| Scenario: Handle missing CSV directory | ⚠️ PARTIAL | `fs.readdirSync` (`:261`) throws ENOENT → caught `:322`, generic message (not a dedicated "missing directory" message) |
| Scenario: Skip AUAU records (per-row) | ❌ FAIL | Script excludes PLAINO **file** by name (`:269`) but does NOT skip individual AUAU rows in other CSVs. Spec requires row-level skip |
| Portal debt query per taxpayer | ⚠️ DEVIATION | Script uses **raw SQL** (`:150-152`) + direct `calcularMovimiento` (`:210`) instead of `deudas.service.obtenerDeudasPorCodigoODni` as spec requires ("query the portal debt service directly") |
| Row-by-row comparison (Saldo, Interés, Total) | ⚠️ PARTIAL | Compares Importe/Saldo/Interes (`:212-214`); **Total not compared** (Saldo+Interes implies it, but spec explicitly lists Total) |
| Tolerance ±0.1 | ✅ PASS | `validar-contra-csv.js:216` `const tolerancia = 0.1` |
| CodMovim filter in query | ✅ PASS | `validar-contra-csv.js:151` `CodMovim = 'H'` |
| Scenario: All taxpayers pass / Mixed pass-fail | ✅ PASS (source) | Summary report `:300-320` (per-DNI ✅/❌ + totals) |
| Scenario: No test data → exit non-zero | ❌ FAIL | No `process.exit(non-zero)` on zero rows; prints `Total: 0...` and exits 0 |

## Correctness Table (Tasks → Implementation)

| Task | Goal | Implemented | Evidence |
|---|---|---|---|
| 1.1 | CodMovim 'H' in WHERE + QUERY_ATTRIBUTES | ✅ | `deudas.service.js:208,270` (note: CodMovim added to WHERE; not in QUERY_ATTRIBUTES select but filtered) |
| 1.2 | TOTAL = saldo + interes | ✅ | `deudas.service.js:302` |
| 1.3 | Remove calcularDescuentoUnicoPago + exports + header "2 modos" | ✅ | Function gone; header `:4` "2 modos" |
| 1.4 | Remove cuotabasica detection + branch | ✅ | No cuotabasica branch in dispatcher |
| 1.5 | FechaDesdeInt `<` → `<=` | ✅ | `intereses.service.js:110` |
| 1.6 | Commented RecIntereses block | ✅ | `intereses.service.js:134-139` |
| 1.7 | Remove MAPPING_CUOTABASICA from config | ✅ | `intereses.config.js` exports only DESC_INMUEBLE |
| 2.1 | Remove Mode C describe block + import | ✅ | No Mode C describe; no calcularDescuentoUnicoPago import |
| 2.2 | Fix Modo B tests (3 params) | ✅ | `calcularInteresSimpleFA(saldo,tasa,dias)` 3-param calls |
| 2.3 | Rewrite dispatcher tests (A/B) | ✅ | `engine.test.js:80-158` |
| 2.4 | Edge-case tests (coef=0, null, boundary <=) | ✅ | `:104,115,148,92` |
| 3.1-3.5 | Create validation script at `scripts/validate-debt-vs-csv.js` | ⚠️ | Created at `tests/intereses/validar-contra-csv.js` (relocated); uses manual CSV parse (no csv-parse dep); raw SQL not service |

## Design Coherence Table

| Design Decision | Code Matches | Notes |
|---|---|---|
| G1: TOTAL = Saldo + Interés | ✅ | `deudas.service.js:302` |
| G2: CodMovim 'H' in both queries | ✅ | `:208,270` |
| G5: Remove Mode C entirely | ✅ | No calcularDescuento, no cuotabasica branch |
| FechaDesdeInt `<=` inclusive | ✅ | `intereses.service.js:110` |
| RecIntereses kept commented | ✅ | `:134-139` |
| AUAU exclusion (PLAINO file) | ✅ | `validar-contra-csv.js:269` (file-level; design said file-level — consistent with design, but spec demanded row-level) |
| Tolerance ±0.1 | ✅ | `:216` |
| Mode A formula `saldo*(indiceFinal/coefCuota)` | ✅ | `intereses.service.js:28` matches design `:33` (NOTE: diverges from SPEC table — see W4) |

## Issues

### CRITICAL

- **C1 — Hardcoded production DB credentials in source.** `tests/intereses/validar-contra-csv.js:17-19` embeds production Azure SQL database name, user, and password (`SMLQDS-2024-0022-101-pesospesos-0022`) in plaintext. Violates `AGENTS.md` Rule 1 ("Toda credencial debe vivir fuera del código fuente") and Rule 2 (centralize DB config in `config/database.config.js`). File is currently untracked (not yet in git history) but is intended for commit — merge-blocking. **Fix before commit**: read from `config/database.config.js` / `.env`, never inline.

- **C2 — All tasks.md checkboxes unchecked.** `tasks.md` has 17 implementation tasks all marked `- [ ]` even though the implementation is substantively complete (verified above). Per SDD verify hard rule, any unchecked implementation task is CRITICAL and blocks archive readiness. **Fix**: tick completed boxes (1.1–1.7, 2.1–2.4 are done; 3.1–3.5 done-with-relocation).

### WARNING

- **W1 — debt-validation "Skip AUAU records" scenario unmet (row-level).** Spec requires per-row skip when `TIPO_BIEN='AUAU'`; implementation only excludes the PLAINO file by name. Other CSVs containing AUAU rows would process them.

- **W2 — Jest not declared in package.json.** `node_modules/.bin/jest.cmd` exists and tests pass (19/19), but Jest is absent from `dependencies`/`devDependencies` and there is no `test` script. A clean install or CI run cannot execute the suite. Declare Jest (pinned exact version per AGENTS.md Rule 13) and add `"test": "jest"`.

- **W3 — Validation script bypasses the service layer.** Spec requires "query the portal debt service directly (not via HTTP)"; script uses raw SQL + direct `calcularMovimiento` instead of `deudas.service.obtenerDeudasPorCodigoODni`. Functionally equivalent for the engine, but does not exercise the service's CodMovim/Saldo filter path under test.

- **W4 — interest-calculation spec Mode A formula inaccurate vs implementation.** Spec table lists Mode A as `Saldo * CoeficienteCuota` and the scenario implies `interes = Saldo*(coef-1)` (coef=1.05→0.05). Implemented + design-approved formula is `Saldo * (IndiceFinal / CoeficienteCuota)`. The spec delta should be corrected to match the built formula before archive.

- **W5 — interest-calculation spec: dias_mora source mismatch.** Spec says `dias_mora` is "from `FechaDesdeInt` (inclusive)"; code computes it from the record's `FechaVto` (`calcularDiasMora(fechaVto)`). `FechaDesdeInt` is used only as the Mode A threshold. Spec wording should be corrected.

- **W6 — debt-validation: Total not compared; no exit-non-zero on empty.** Script compares Importe/Saldo/Interes (not Total), and does not `process.exit(1)` when zero valid rows remain after filtering.

- **W7 — Cross-change spec conflict.** Prior change `sequelize-mapping-manzano-debt-formulas` spec still mandates `calcularDescuentoUnicoPago` as a MUST-export. This change removes it. The archive phase must reconcile the consolidated `debt-formula-engine` spec to drop the Mode C export requirement.

- **W8 — File path divergence.** Tasks/spec specify `scripts/validate-debt-vs-csv.js`; actual artifact lives at `tests/intereses/validar-contra-csv.js`. Functionally fine, but tasks.md should reflect the final path.

- **W9 — Service-layer runtime coverage gap.** `formatearDeuda` (Total computation) and the CodMovim-filtered queries have no runtime test; only the pure engine is unit-tested. Source evidence is strong, but spec scenarios on the query path are source-only.

### SUGGESTION

- **S1 — Test count.** `engine.test.js` contains 19 tests (task forecast ~16). More coverage than estimated — positive.
- **S2 — Missing-directory UX.** Add a dedicated `fs.existsSync(formulasDir)` check with a clear message before `readdirSync` to satisfy the "clear error message" scenario.

## Final Verdict

**FAIL** — 2 CRITICAL blockers (C1 hardcoded production credentials, C2 unchecked tasks) must be resolved before merge/archive.

Implementation logic is substantively correct: 19/19 engine tests pass at runtime, all source-level spec checks pass with line evidence, Mode C fully removed, formulas match the design. The blockers are a security defect in the validation script and stale task tracking — both fixable without touching the verified core logic. After fixing C1 + C2 (and ideally W1–W9), a re-verify should yield PASS WITH WARNINGS or PASS.
