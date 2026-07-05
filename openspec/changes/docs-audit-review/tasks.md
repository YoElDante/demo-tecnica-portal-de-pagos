# Tasks: Documentation Audit Review

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 300–400 |
| 400-line budget risk | Medium |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (Phase 1) → PR 2 (Phase 2 + 3) |
| Delivery strategy | auto-forecast |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Fix all broken cross-references (Phase 1) | PR 1 | develop; mechanical find/replace, grep-verified |
| 2 | Create guia-ramas.md + freshness/merge/housekeeping (Phase 2+3) | PR 2 | develop; depends on PR 1; editorial judgment required |

## Phase 1: Cross-Reference Mass Fix (🔴 Critical)

- [ ] **T1** Fix `docs/ai-context.md` — 7 broken paths in "Si vas a tocar…" section (lines 93-97). `CONTRACT-PORTAL-GATEWAY` → `integration/contract-portal-gateway`, `INTEGRACION_PAGOS` → `integration/integracion-pagos`, `bd/LOGICA_DEUDAS_PAGOS` → `domain/logica-deudas-pagos`, `PLAN_CONFIGURACION_MULTIAMBIENTE` → `guides/plan-multiambiente`, `GUIA_NUEVO_MUNICIPIO` → `guides/nuevo-municipio`, `DEPLOY_AZURE` → `guides/deploy-azure`, `integracion/GUIA_INTEGRACION_MULTIPROYECTO` → `integration/guia-multiproyecto`. Deps: none. Effort: small. Verify: no old paths remain in file.

- [ ] **T2** Fix `docs/architecture/adr.md` — 9 broken refs. 8× `docs/CONTRACT-PORTAL-GATEWAY.md` → `../integration/contract-portal-gateway.md` (ADRs 001-007 + Referencias line 204). 1× `docs/GUIA_NUEVO_MUNICIPIO.md` → `../guides/nuevo-municipio.md`. Deps: none. Effort: small. Verify: grep for old paths returns 0.

- [ ] **T3** Fix `docs/guides/nuevo-municipio.md` — 2 broken refs (line 491: `CONTRACT-PORTAL-GATEWAY.md` → `../integration/contract-portal-gateway.md`; line 494: `GUIA_RAMAS.md` → `guia-ramas.md`). Deps: none. Effort: small. Verify: no old paths remain.

- [ ] **T4** Fix `docs/guides/runbook.md` — 3 broken refs. Line 144: `DIAGNOSTICO_TICKET_VACIO.md` → `../_archive/diagnostico-ticket-vacio.md`. Line 257: `CONTRACT-PORTAL-GATEWAY.md` → `../integration/contract-portal-gateway.md`. Line 259: `GUIA_RAMAS.md` → `guia-ramas.md`. Deps: none. Effort: small. Verify: no old paths remain.

- [ ] **T5** Fix `docs/guides/plan-multiambiente.md` — 3 broken refs (lines 75-77) + add `Última actualización: 2026-07-04`. `GUIA_NUEVO_MUNICIPIO` → `nuevo-municipio.md`, `DEPLOY_AZURE` → `deploy-azure.md`, `AI_CONTEXT.md` → `../ai-context.md`. Deps: none. Effort: small. Verify: no old paths remain; date header present.

- [ ] **T6** Fix `docs/integration/checklist-appsettings.md` — 3 broken refs + add date. Line 51: `docs/bd/AZURE_SQL_TICKETS_PAGO_SETUP.sql` → `../_archive/database/AZURE_SQL_TICKETS_PAGO_SETUP.sql`. Line 137: `docs/CONTRACT-PORTAL-GATEWAY.md` → `contract-portal-gateway.md`. Line 138: `docs/INTEGRACION_PAGOS.md` → `integracion-pagos.md`. Add `Última actualización: 2026-07-04`. Deps: none. Effort: small. Verify: no old paths remain.

- [ ] **T7** Fix `docs/integration/guia-multiproyecto.md` — 4 broken refs. Lines 265, 290: `docs/GUIA_RAMAS.md` → `../guides/guia-ramas.md`. Line 397: local `GUIA_RAMAS.md` → `../guides/guia-ramas.md`. Line 398: `INTEGRACION_PAGOS.md` → `integracion-pagos.md`. Deps: none. Effort: small. Verify: no old paths remain.

- [ ] **T8** Fix `docs/GLOSSARY.md` — 2 broken refs in "Referencias" (lines 109-110). `docs/CONTRACT-PORTAL-GATEWAY.md` → `integration/contract-portal-gateway.md`. `docs/bd/LOGICA_DEUDAS_PAGOS.md` → `domain/logica-deudas-pagos.md`. Deps: none. Effort: small. Verify: no old paths remain.

- [ ] **T9** Fix `docs/architecture/security-pending.md` — fix `docs/DEPLOY_AZURE.md` → `../guides/deploy-azure.md` + add `Última actualización: 2026-07-04`. Deps: none. Effort: small. Verify: no old paths; date present.

- [ ] **T10** Fix `docs/integration/integracion-pagos.md` — 3 broken refs. Line 111: `docs/CONTRACT-PORTAL-GATEWAY.md` → `contract-portal-gateway.md`. Line 112: `docs/bd/LOGICA_DEUDAS_PAGOS.md` → `../domain/logica-deudas-pagos.md`. Line 113: `docs/integracion/GUIA_INTEGRACION_MULTIPROYECTO.md` → `guia-multiproyecto.md`. Add `Última actualización: 2026-07-04`. Deps: none. Effort: small. Verify: no old paths remain.

- [ ] **T11** Global verification — run `grep -rE "docs/(CONTRACT-PORTAL-GATEWAY|DEPLOY_AZURE|GUIA_NUEVO_MUNICIPIO|INTEGRACION_PAGOS|bd/|integracion/)" docs/` — must return 0 results. Also verify `grep -rn "GUIA_RAMAS" docs/` only shows correct `guia-ramas.md` paths. Deps: T1–T10. Effort: small. Verify: both greps pass.

## Phase 2: Create Missing Document (🟡 High)

- [ ] **T12** Create `docs/guides/guia-ramas.md` — branch strategy guide. Structure per cognitive-doc-design: Quick path → Details → Checklist → Next step. Content: `develop`→`main` flow, feature branch naming (`feature/<name>`), PR process, merge rules, `MUNICIPIO` per environment, `.env` not versioned. Add `Última actualización: 2026-07-04`. Deps: T11. Effort: medium (~100 lines). Verify: file exists, follows kebab-case, has date header.

- [ ] **T13** Register `guia-ramas.md` in `docs/README.md` — add entry in guides section with ✅ Nuevo badge. Also remove phantom `openspec/changes/configurable-interest-rate/` entry (does not exist on disk). Also add `doc-conventions` to skills table. Deps: T12. Effort: small. Verify: README lists guia-ramas with ✅ Nuevo; no configurable-interest-rate reference; doc-conventions present.

## Phase 3: Freshness, Merge & Housekeeping (🟢 Medium)

- [ ] **T14** Update `docs/domain/logica-deudas-pagos.md` — bump date to 2026-07-04. Remove "A CREAR" from `services/pagos.service.js` reference (file exists). Add cross-reference to `formulas-intereses.txt` as "Material fuente del contador — ver apéndice". Deps: T11. Effort: small. Verify: no "A CREAR" remains; date updated; formulas referenced.

- [ ] **T15** Merge `docs/integration/integracion-pagos.md` → `contract-portal-gateway.md` — extract unique content from `integracion-pagos.md` and add as "Resumen ejecutivo" section at top of `contract-portal-gateway.md`. Move `integracion-pagos.md` to `docs/_archive/integration/integracion-pagos.md`. Remove entry from `docs/README.md` (or mark 🗄️). Deps: T10, T13. Effort: medium. Verify: contract doc has executive summary; original archived in `_archive/integration/`; README updated.

- [ ] **T16** Process `docs/domain/formulas-intereses.txt` — add header: `# Material fuente: Fórmulas de intereses (Contador)\nFuente: [nombre del contador]\nFecha: 2026-07-04\nVer implementación en: [logica-deudas-pagos.md](logica-deudas-pagos.md)`. Deps: T14. Effort: small. Verify: file has context header referencing implementation doc.

- [ ] **T17** Sync `docs/architecture/politica-documentacion.md` — add `auditorias/` row to taxonomy table: `| docs/auditorias/ | Auditorías técnicas con fecha y estructura formal | auditoria-03072026/ |`. Deps: T11. Effort: small. Verify: taxonomy table matches AGENTS.md (6 folders).

- [ ] **T18** Verify `docs/guides/deploy-azure.md` — review Azure CLI commands against current stack. Bump date if content is still valid, or update commands. Deps: T11. Effort: medium. Verify: commands match current `config/` and Azure setup.

- [ ] **T19** Clean empty `_archive/` subdirectories — remove `guides/`, `domain/`, `architecture/` if still empty (do NOT remove `integration/` — T15 adds a file there). Deps: T15. Effort: small. Verify: no empty dirs under `_archive/` except those with content.

- [ ] **T20** Final verification — run all grep checks from proposal success criteria. Confirm: 0 broken old paths, `guia-ramas.md` exists and is in README, no configurable-interest-rate phantom, 5 docs now have dates, `integracion-pagos.md` archived, `doc-conventions` in README skills, taxonomy synced, no empty archive subdirs. Deps: T1–T19. Effort: small. Verify: all proposal success criteria pass.
