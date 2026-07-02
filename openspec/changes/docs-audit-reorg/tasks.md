# Tasks: docs-audit-reorg

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 700-900 (additions + deletions across ~20 files) |
| 400-line budget risk | Medium |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (Cleanup + Corrections) -> PR 2 (Consolidations) -> PR 3 (New Docs + Index) |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Delete dangerous/dead files + fix stale references | PR 1 | Pure deletions + text fixes; zero new content; ~250 lines |
| 2 | Merge redundant doc pairs into single sources of truth | PR 2 | 3 merges; depends on PR 1 (deleted files must be gone); ~250 lines |
| 3 | Create new docs + master index + AGENTS.md map | PR 3 | 4 new docs + rewrite; depends on PR 1+2 (stable file set); ~350 lines |

## Phase 1: Cleanup (DELETE + ARCHIVE)

- [ ] 1.1 **Delete dangerous + noise files** - Remove: `docs/_archive/ai/QUICK_RESUME.ai.md`, `docs/_archive/ai/PROJECT_CONTEXT.ai.md`, `docs/_archive/ai/ROADMAP.ai.md`, `docs/_archive/PLAN_CONFIGURACION_MULTIAMBIENTE.md`, `docs/bd/generacion_de_deuda_122026.md`, and 6x `skills/*/references/docs.md` stubs. **Verify**: grep all `.md` for inbound links to each file before deleting; update or remove any linkers found.
- [ ] 1.2 **Update archive README** - Edit `docs/_archive/README.md` to mark remaining files (`PLAN_INTEGRACION_MERCADOPAGO.md`, `INTEGRACION_PAGOS_MERCADOPAGO.md`, `instrucciones.md`, `INFORME_FASE1_BD_UNIFICADA.md`) as historical with date and reason. **Verify**: confirm each referenced file still exists in `docs/_archive/`.

## Phase 2: Consolidation (MERGE)

- [ ] 2.1 **Merge onboarding-municipio.md INTO GUIA_NUEVO_MUNICIPIO.md** - Read actual `config/municipalidad.config.*.js` files and `config/database.config.js` FIRST. Reconcile onboarding steps against real config layout, `MUNICIPIO` env var, and current municipal configs. Merge unique content from `docs/onboarding-municipio.md` into `docs/GUIA_NUEVO_MUNICIPIO.md`. Delete `docs/onboarding-municipio.md`. **Verify**: every step in merged doc matches actual file paths and config keys; grep for inbound links to deleted file.
- [ ] 2.2 **Merge REDIRECT-WEBHOOK-DESIGN.md INTO CONTRACT-PORTAL-GATEWAY.md** - Extract design decisions from `docs/integracion/REDIRECT-WEBHOOK-DESIGN.md` and fold into `docs/CONTRACT-PORTAL-GATEWAY.md` as a design-rationale section. Keep CONTRACT scannable. Delete design doc. **Verify**: no unique content lost (diff original design doc vs merged sections); grep for inbound links to deleted file.
- [ ] 2.3 **Reduce copilot-instructions.md to thin shim** - Replace `.github/copilot-instructions.md` content with a short pointer: "See `AGENTS.md` at repo root for full agent instructions." **Verify**: `AGENTS.md` exists and covers all topics the original contained.

## Phase 3: Correction (FIX)

- [ ] 3.1 **Fix mercadopago->siro in INSTRUCTIVO_DEPLOY.md** - Edit `.github/workflows/INSTRUCTIVO_DEPLOY.md` L382 area: replace `PAYMENT_GATEWAY=mercadopago` with `PAYMENT_GATEWAY=siro` (or equivalent SIRO reference). **Verify**: grep entire repo for remaining `mercadopago` references outside `docs/_archive/`; confirm `siro` matches actual env var names in deploy YAML files.
- [ ] 3.2 **Fix SIRA->SIRO in GUIA_INTEGRACION_MULTIPROYECTO.md** - Edit `docs/integracion/GUIA_INTEGRACION_MULTIPROYECTO.md` at L37, L78, L99, L383: replace all `SIRA` occurrences with `SIRO`. **Verify**: `grep -n "SIRA" docs/integracion/GUIA_INTEGRACION_MULTIPROYECTO.md` returns 0 results; confirm `SIRO` is used consistently in `docs/CONTRACT-PORTAL-GATEWAY.md`.
- [ ] 3.3 **Remove dead section in MUNICIPIO_CONFIG.md** - Edit `config/MUNICIPIO_CONFIG.md`: remove the "Estado Anterior" section. **Verify**: remaining content is self-consistent; no broken cross-references.
- [ ] 3.4 **Add staleness banners to informe-estado files** - Add a top banner to `docs/informe-estado-20260630-0426.md` and `docs/informe-estado-ai-20260630-0426.md` marking them as point-in-time snapshots with date and link to latest authoritative sources (`AGENTS.md`, `docs/README.md`). **Verify**: banner includes correct date from filename; links resolve.
- [ ] 3.5 **Add superseded banner to PRD.md** - Add top banner to `PRD.md` (project root) pointing to `AGENTS.md` and `docs/README.md` as current sources of truth. **Verify**: file is at root `PRD.md` (not `docs/PRD.md`); linked files exist.

## Phase 4: Creation (NEW)

- [ ] 4.1 **Create docs/GLOSSARY.md** - Define domain terms: CodMovim (H=haber/deuda, D=debe/cobro), TIPO_BIEN codes (AUAU, ININ, CICI, OBSA, CACA, CEM1, PEPE), NRO_OPERACION, external_reference, id_operacion, idempotency, ticket validity. **Verify**: grep actual source code (`services/`, `routes/`, `models/`) to confirm each term's usage matches definition; confirm CodMovim values and TIPO_BIEN codes exist in code.
- [ ] 4.2 **Create docs/GUIDES/RUNBOOK.md** - Consolidate ops guide from `docs/DIAGNOSTICO_TICKET_VACIO.md` + deployment procedures from `docs/DEPLOY_AZURE.md` + incident workflows. **Verify**: every npm script mentioned exists in `package.json`; every config path referenced exists on filesystem; every env var is used in `config/` or source.
- [ ] 4.3 **Create docs/ADR.md** - Architecture Decision Record log: SIRO over MercadoPago, exchange-code redirect pattern, 45-day ticket purge, multi-municipio config via `MUNICIPIO` env var, webhook-as-truth principle. **Verify**: each ADR references actual implementation files that confirm the decision is live (not aspirational).
- [ ] 4.4 **Rewrite docs/README.md as master index** - List every live doc with: relative path, one-line purpose, freshness badge, last-reviewed date. Separate live docs from archive references. Include reading order for newcomers. **Verify**: every file path in the index resolves to an actual file; no deleted/merged files listed.

## Phase 5: Indexing (MAP)

- [ ] 5.1 **Add DOCUMENTATION MAP to AGENTS.md** - Add a "DOCUMENTATION MAP" section to `AGENTS.md` with: minimal reading route for AI agents, onboarding route for humans, and quick-reference pointers to glossary and ADR. **Verify**: all linked paths exist; minimal route matches the one already in `AGENTS.md` Entrada Rapida section.
- [ ] 5.2 **Final validation pass** - Grep entire repo for: (a) `mercadopago` outside `docs/_archive/`, (b) `SIRA` anywhere, (c) references to deleted files. Fix any remaining broken references. **Verify**: all grep checks return clean; `docs/README.md` index has zero broken paths.
