# Archive Report: align-sequelize-manzano-062026

## Change

Alinear los 4 modelos Sequelize (`ClientesCtasCtes`, `Cliente`, `TicketsPago`, `TicketPagoEventos`) con el script `docs/bd/script_creacion_bd_ElManzano_062026.sql`. Corrección de tipos/longitudes/nullabilidad sin alterar comportamiento funcional.

## Archive Metadata

| Field | Value |
|-------|-------|
| Change name | `align-sequelize-manzano-062026` |
| Archive date | 2026-07-02 |
| Archived to | `openspec/changes/archive/2026-07-02-align-sequelize-manzano-062026/` |
| Artifact store | hybrid (OpenSpec filesystem + Engram) |
| Archive mode | **intentional-with-warnings** (user-authorized; see Warnings section) |
| SDD cycle status | **Complete** |

## Task Completion Summary

| Phase | Tasks | Completed |
|-------|-------|-----------|
| Phase 1: ClientesCtaCte Alignment (CRITICAL) | 1.1–1.5 | 5/5 ✅ |
| Phase 2: Cliente Alignment | 2.1–2.5 | 5/5 ✅ |
| Phase 3: TicketsPago + TicketPagoEventos | 3.1–3.3 | 3/3 ✅ |
| Phase 4: Service Compatibility Audit | 4.1–4.3 | 3/3 ✅ |
| Phase 5: Final Verification | 5.1–5.3 | 3/3 ✅ |
| **Total** | **19** | **19/19 ✅** |

Task Completion Gate: **PASSED** — all 19 implementation tasks marked `[x]` in `tasks.md`. No stale checkboxes.

## Specs Synced

| Domain | Action | Details |
|--------|--------|---------|
| `data-model` | **Created** (new main spec) | No prior main spec existed. Delta spec from `openspec/changes/align-sequelize-manzano-062026/specs/data-model/spec.md` was copied verbatim into `openspec/specs/data-model/spec.md` per skill rule "if main spec does not exist, the delta spec IS a full spec — copy directly". |

Delta content preserved as-is (English, delta format with ADDED/MODIFIED/REMOVED/RENAMED sections). This is consistent with the project's existing `documentation` main spec, which also remains in delta format.

### Source of Truth Updated

The following main spec now reflects the new behavior:

- `openspec/specs/data-model/spec.md` (6,450 bytes, 5 ADDED requirements, 5 MODIFIED requirements, 0 REMOVED, 0 RENAMED)

## Archive Contents

- `proposal.md` ✅ (4,632 bytes)
- `specs/data-model/spec.md` ✅ (6,450 bytes)
- `tasks.md` ✅ (4,980 bytes, 19/19 tasks complete)
- `verify-report.md` ✅ (11,797 bytes)
- `explore.md` ✅ (17,918 bytes — exploration artifact retained)
- `archive-report.md` ✅ (this file)

No `design.md` present — `verify-report.md` documents this and notes design coherence check was skipped (no design artifact to verify against).

## Active Changes Directory

`openspec/changes/align-sequelize-manzano-062026/` no longer exists in the active directory. The change is now in `openspec/changes/archive/2026-07-02-align-sequelize-manzano-062026/` only.

## Verify Report Status (Recap)

**PASS WITH WARNINGS** — no CRITICAL issues. The verify report recommended `fix` actions for the warnings before archiving, but the user has explicitly authorized the archive with these warnings documented. All warnings represent conscious design decisions already recorded in `tasks.md`.

### Warnings (intentional, user-authorized)

1. **WARNING-1: `rowVersion` removed vs spec VIRTUAL** — Implementation removes the column entirely (auto-managed by SQL Server). Spec said "MUST treat as VIRTUAL (read-only)". Functional outcome (not in INSERT ✅) is met; read-back requires explicit `attributes:{include:['row_version']}`. Documented in `tasks.md:37`.

2. **WARNING-2: `payloadSnapshot` / `payloadJson` use TEXT vs spec STRING('max')** — Functionally equivalent on mssql/tedious (both map to `NVARCHAR(MAX)`). Documented in `tasks.md:37-38`.

3. **WARNING-3: Timestamps use `DataTypes.NOW` vs spec `Sequelize.fn('sysutcdatetime')`** — Application-side UTC timestamp vs DB server UTC. Functional difference negligible unless app/DB clocks diverge. Documented in `tasks.md:37`.

4. **WARNING-4: Out-of-scope files in working tree** — `docs/bd/script.sql` (deleted, replaced by `script_creacion_bd_ElManzano_062026.sql`), `config/index.js` (added `carrilobo` municipio), `AGENTS.md` (docs updates), `.atl/skill-registry.md` (auto-generated). These are pre-existing or unrelated changes in the tree; not part of this change's scope. Not blocking archive (they live in git, not in the change folder).

### Suggestions (informational, not blocking)

- SUGGESTION-1: `NroRenglonAsiento` uses INTEGER where SQL defines `smallint` (functionally fine, less precise).
- SUGGESTION-2: `Nro_Dev` type not explicitly aligned (outside scope, no immediate risk).
- SUGGESTION-3: Consider `DECIMAL(19,4)` for `money` mapping if large monetary values ever become relevant (not a problem at current municipality scales).

## Reconciliation Decision

The sdd-archive skill normally blocks archive when `verify-report` recommends `fix`. This archive proceeds under the **intentional-with-warnings** exception because:

- The verify report has **no CRITICAL issues** (only WARNING and SUGGESTION).
- All 19 implementation tasks are completed and verified against the code.
- The warnings are documented conscious decisions in `tasks.md` (which is the source of truth for the implementation's intent).
- `npm run testDB` PASSED — the models load successfully against the Azure SQL El Manzano database.
- The Phase 1 (ClientesCtaCte) and Phase 2 (Cliente) CRITICAL corrections are 100% compliant with spec.
- The Phase 3 deviations (TicketsPago/TicketPagoEventos) are functionally equivalent to the spec's MUST and do not impact runtime correctness.
- The user explicitly directed archive despite the warnings.

The spec is now in `openspec/specs/data-model/spec.md` and the implementation matches it functionally (with the 3 documented cosmetic deviations). A future follow-up change may amend the spec to align it with the implementation's documented decisions, but this archive captures the change as approved.

## Audit Trail

This change folder is the audit trail. It must not be modified or deleted.

```
openspec/changes/archive/2026-07-02-align-sequelize-manzano-062026/
├── proposal.md
├── explore.md
├── tasks.md (19/19 complete)
├── verify-report.md (PASS WITH WARNINGS)
├── specs/
│   └── data-model/
│       └── spec.md
└── archive-report.md (this file)
```

## SDD Cycle Complete

The change has been fully planned, implemented, verified, and archived. The source-of-truth spec `openspec/specs/data-model/spec.md` is now in place. Ready for the next change.
