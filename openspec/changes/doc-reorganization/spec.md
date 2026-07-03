# Delta for Documentation

## ADDED Requirements

### Requirement: Thematic Folder Structure

The `docs/` directory MUST organize all content into thematic subfolders: `onboarding/`, `architecture/`, `operations/`, `security/`, `integration/`, `database/`, `snapshots/`. The root of `docs/` MUST contain only `README.md` (the master index) and no other loose `.md` files.

#### Scenario: New contributor navigates docs

- GIVEN a contributor opens the `docs/` folder
- WHEN browsing the directory contents
- THEN they MUST find only `README.md` and subfolders at the root level
- AND each subfolder MUST have a name that signals its thematic domain

#### Scenario: File has a thematic home

- GIVEN a document about deployment, runbooks, or multi-environment config
- WHEN placing it in the docs structure
- THEN it MUST reside under `operations/`
- AND NOT at the root of `docs/`

#### Scenario: Test fixtures are not in docs

- GIVEN CSV files used for comparing portal vs desktop results
- WHEN locating them in the repo
- THEN they MUST live under `test-data/comparacion/`
- AND NOT under `docs/`

### Requirement: Subfolder READMEs

Every subfolder inside `docs/` (except `_archive/`) MUST contain a `README.md` that explains the folder's purpose, lists its files, and provides brief context for each.

#### Scenario: Reader understands a subfolder at a glance

- GIVEN a reader opens any `docs/` subfolder (e.g., `database/`, `security/`)
- WHEN reading its `README.md`
- THEN they MUST find a description of what the folder contains
- AND a list of files with one-line explanations

#### Scenario: No folder without README

- GIVEN the docs structure after reorganization
- WHEN checking each subfolder (excluding `_archive/`)
- THEN every folder MUST have a `README.md`
- AND `bd/`, `GUIDES/`, `integration/`, `database/`, `snapshots/` MUST each have one

### Requirement: Master Index Accuracy

`docs/README.md` MUST serve as the master index with accurate paths, freshness badges, and links that resolve to existing files. No link in the index MUST point to a non-existent file.

#### Scenario: All index links resolve

- GIVEN a script checks every relative link in `docs/README.md`
- WHEN following each link
- THEN every link MUST resolve to an existing file or folder
- AND zero links MUST return 404

#### Scenario: Index reflects new structure

- GIVEN the reorganization is complete
- WHEN reading `docs/README.md`
- THEN all paths MUST reflect the new thematic folders
- AND `configurable-interest-rate` MUST NOT appear as an active change
- AND freshness badges MUST be present for each listed document

### Requirement: Incoming Link Integrity

When a document is moved to a new path, ALL incoming references across the entire repository (including `AGENTS.md`, specs, skills, archived changes) MUST be updated to the new path. Zero broken internal links MUST remain after the move.

#### Scenario: LOGICA_DEUDAS_PAGOS.md references are fixed

- GIVEN `LOGICA_DEUDAS_PAGOS.md` is moved to `docs/database/`
- WHEN grepping the entire repo for the old path `docs/bd/LOGICA_DEUDAS_PAGOS`
- THEN the result MUST be zero matches
- AND all 11 previously broken references MUST point to the new location

#### Scenario: No stale INSTRUCTIVO_DEPLOY references

- WHEN grepping the entire repo for `INSTRUCTIVO_DEPLOY`
- THEN results MUST be zero OR only appear inside `_archive/`

### Requirement: AGENTS.md Documentation Map Update

`AGENTS.md` MUST include an updated "Mapa de Documentacion" table that reflects the new folder structure, with correct paths to all key documents.

#### Scenario: Agent finds documents via AGENTS.md

- GIVEN an AI agent reads the documentation map in `AGENTS.md`
- WHEN following any listed path
- THEN the path MUST resolve to an existing file
- AND the table MUST group documents by thematic area matching the new structure

## MODIFIED Requirements

### Requirement: AGENTS.md Branch Contradiction Fix

AGENTS.md Rule 11 MUST state that `develop` is the active working branch and `main` is production-only, consistent with `docs/GUIA_RAMAS.md` and `README.md`. The `develop` branch MUST exist in the repository (created from `main` as part of this change). All commands in `docs/GUIA_RAMAS.md` referencing `develop` MUST be functional.

(Previously: Required documentation consistency but `develop` branch did not exist in the repo)

#### Scenario: Agent reads corrected branch strategy

- GIVEN an AI agent reads AGENTS.md Rule 11
- WHEN the agent needs to choose a working branch for a new feature
- THEN the agent MUST find `develop` documented as the active branch
- AND MUST find `main` documented as production-only, receiving only approved merges from `develop`

#### Scenario: Develop branch exists

- GIVEN a developer runs `git branch` in the repository
- WHEN listing local branches
- THEN `develop` MUST appear in the list
- AND `main` MUST also exist as the production branch

#### Scenario: GUIA_RAMAS commands work

- GIVEN a developer follows a command from `docs/GUIA_RAMAS.md`
- WHEN executing `git checkout develop` or `git push origin develop`
- THEN the command MUST succeed without "branch not found" errors

**Acceptance Criteria:**
- Rule 11 contradicts neither GUIA_RAMAS.md nor README.md
- The word "develop fue eliminada" does not appear in AGENTS.md
- `git branch` shows both `main` and `develop`
- All `develop` references in GUIA_RAMAS.md resolve to a real branch

## REMOVED Requirements

### Requirement: Stale Change References in Index

(Reason: `configurable-interest-rate` was already absorbed by `sequelize-mapping-manzano-debt-formulas`; references to it as an active change are incorrect and misleading)
(Migration: Remove from `docs/README.md` and `docs/AI_CONTEXT.md` indexes; no replacement needed as the capability lives in the absorbed change)

## RENAMED Requirements

### Requirement: Database Logic Location → Database Content Organization

(Reason: The folder `docs/formulas_calculo_de_deuda/` contained `LOGICA_DEUDAS_PAGOS.md` but was misleadingly named; the new `docs/database/` folder provides a clearer, more general home for database logic, SQL scripts, and calculation formulas)
(Migration: Update all references from `docs/bd/LOGICA_DEUDAS_PAGOS.md` and `docs/formulas_calculo_de_deuda/LOGICA_DEUDAS_PAGOS.md` to `docs/database/LOGICA_DEUDAS_PAGOS.md`. The `formulas_calculo_de_deuda/` folder may remain for `grid_form.py` and `formulas_alcaldia_072026.txt` with an updated README.)
