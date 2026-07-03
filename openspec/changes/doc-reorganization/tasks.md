# Tasks: Documentation Reorganization

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~295 total (30 + 95 + 170) |
| 400-line budget risk | Low |
| Chained PRs recommended | Yes (force-chained) |
| Suggested split | PR 1 → PR 2 → PR 3 |
| Delivery strategy | force-chained |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | PR | Notes |
|------|------|----|-------|
| 1 | Critical fixes: broken links + develop branch | PR 1 | ~30 lines; 16 files touched, 1 line each |
| 2 | Structural reorg: 7 subfolders, move 14 files, update links in moved files | PR 2 | ~95 lines; 8 new READMEs + git mv + link patches |
| 3 | Index rewrites + archive docs-audit-reorg | PR 3 | ~170 lines; docs/README.md rewrite + AGENTS.md map + archive |

## Phase 1: Critical Fixes (PR 1 → main)

- [ ] 1.1 Fix 11 refs `docs/bd/LOGICA_DEUDAS_PAGOS` → `docs/formulas_calculo_de_deuda/LOGICA_DEUDAS_PAGOS` in: AGENTS.md, docs/AI_CONTEXT.md, docs/INTEGRACION_PAGOS.md, docs/README.md, openspec/specs/ticket-lifecycle/spec.md, openspec/specs/interest-calculation/spec.md, openspec/changes/ticket-payment-tracking/proposal.md, openspec/changes/archive/2026-07-03-fix-debt-calculation-discrepancy/{tasks.md,proposal.md,archive.md}, skills/deuda-interest-calculation/SKILL.md
- [ ] 1.2 Remove 3 `INSTRUCTIVO_DEPLOY` refs: delete row in docs/README.md, remove link in docs/GUIA_RAMAS.md, remove `.github/workflows/` mention in docs/DEPLOY_AZURE.md
- [ ] 1.3 Remove `configurable-interest-rate` as active change from docs/README.md and docs/AI_CONTEXT.md
- [ ] 1.4 Create `develop` branch from main and push upstream
- [ ] 1.5 Verify: `grep -rn "INSTRUCTIVO_DEPLOY" .` returns 0 (excluding _archive); `git branch --list develop` shows branch

## Phase 2: Structural Reorganization (PR 2 → main, after PR 1)

- [ ] 2.1 Create 8 READMEs (~10 lines each): `docs/{onboarding,architecture,operations,security,integration,database,database/scripts,snapshots}/README.md` — purpose sentence + file table
- [ ] 2.2 `git mv` loose files: AI_CONTEXT.md + GLOSSARY.md → `docs/onboarding/`; ADR.md + CONTRACT-PORTAL-GATEWAY.md + GUIA_RAMAS.md → `docs/architecture/`; DEPLOY_AZURE.md + GUIA_NUEVO_MUNICIPIO.md + PLAN_CONFIGURACION_MULTIAMBIENTE.md + DIAGNOSTICO_TICKET_VACIO.md → `docs/operations/`; PENDIENTE_SEGURIDAD.md → `docs/security/`; INTEGRACION_PAGOS.md → `docs/integration/`; informe-estado-*.md → `docs/snapshots/`
- [ ] 2.3 `git mv docs/integracion/` → `docs/integration/` (merge into existing); delete empty `docs/integracion/`
- [ ] 2.4 `git mv docs/GUIDES/` → `docs/operations/GUIDES/`; delete empty `docs/GUIDES/`
- [ ] 2.5 `git mv docs/bd/*.sql` → `docs/database/scripts/`; delete empty `docs/bd/`
- [ ] 2.6 `git mv docs/formulas_calculo_de_deuda/LOGICA_DEUDAS_PAGOS.md` → `docs/database/`; delete empty `docs/formulas_calculo_de_deuda/` (or keep if grid_form.py remains)
- [ ] 2.7 `git mv docs/pruebas_documentos_a_comparar/` → `test-data/comparacion/`; create parent `test-data/`
- [ ] 2.8 Fix `integracion/` → `integration/` in AGENTS.md, docs/onboarding/AI_CONTEXT.md
- [ ] 2.9 Fix internal links in moved files: LOGICA_DEUDAS_PAGOS refs in AI_CONTEXT.md + INTEGRACION_PAGOS.md; `integracion/` refs in GUIA_RAMAS.md
- [ ] 2.10 Verify: `grep -rn "docs/bd/" .` returns 0; `grep -rn "docs/integracion/" .` returns 0; zero loose .md in docs/ root except README.md

## Phase 3: Index Rewrites + Archive (PR 3 → main, after PR 2)

- [ ] 3.1 Rewrite `docs/README.md`: master index with sections per subfolder, freshness badges, all paths verified
- [ ] 3.2 Update AGENTS.md doc map (L148-162): all 10 paths to new locations grouped by area
- [ ] 3.3 Fix `formulas_calculo_de_deuda/README.md` misleading title; add grid_form.py context
- [ ] 3.4 Update `docs/_archive/README.md` with docs-audit-reorg reference
- [ ] 3.5 Create `docs/snapshots/README.md` with snapshot context
- [ ] 3.6 Archive: `git mv openspec/changes/docs-audit-reorg/` → `openspec/changes/archive/2026-07-03-docs-audit-reorg/`; add archive.md
- [ ] 3.7 Verify: all paths in docs/README.md resolve to existing files; AGENTS.md map paths valid; `configurable-interest-rate` absent from indexes

## Dependencies

- Phase 2 requires PR 1 merged (LOGICA_DEUDAS_PAGOS links at correct interim path)
- Phase 3 requires PR 2 merged (files at final locations for index accuracy)
- All phases use `git mv` to preserve rename history
