# Documentation — Delta Spec

## ADDED Requirements

### Requirement: AGENTS.md Branch Contradiction Fix

AGENTS.md Rule 11 MUST state that `develop` is the active working branch and `main` is production-only, consistent with `docs/GUIA_RAMAS.md` and `README.md`.

#### Scenario: Agent reads corrected branch strategy

- GIVEN an AI agent reads AGENTS.md Rule 11
- WHEN the agent needs to choose a working branch for a new feature
- THEN the agent MUST find `develop` documented as the active branch
- AND MUST find `main` documented as production-only, receiving only approved merges from `develop`

**Acceptance Criteria:**
- Rule 11 contradicts neither GUIA_RAMAS.md nor README.md
- The word "develop fue eliminada" does not appear in AGENTS.md

### Requirement: AGENTS.md Missing Sections

AGENTS.md MUST include: `npm test` command, "Qué NO hace" section, "Estado de Desarrollo" section, and corrected SDD step numbering (no gap between 5 and 7).

#### Scenario: Agent finds test command

- GIVEN an agent needs to run tests
- WHEN reading AGENTS.md Comandos de Trabajo
- THEN the agent MUST find `npm test` listed

#### Scenario: Agent understands scope boundaries

- GIVEN an agent reads AGENTS.md
- WHEN searching for what the project does NOT do
- THEN the agent MUST find a "Qué NO hace" section listing: no direct payment processing, no credential storage, no SIRO communication

#### Scenario: Agent assesses development status

- GIVEN an agent needs to understand project maturity
- WHEN reading AGENTS.md
- THEN the agent MUST find an "Estado de Desarrollo" section with: completed phases, current phase, and known gaps

#### Scenario: Agent follows numbered SDD flow

- GIVEN an agent follows the SDD flow in AGENTS.md
- WHEN reaching step 5 and continuing
- THEN step 6 MUST exist between 5 and 7
- AND step numbering MUST be sequential without gaps

**Acceptance Criteria:**
- AGENTS.md contains `npm test` in command list
- AGENTS.md has a "Qué NO hace" heading with at least 3 items
- AGENTS.md has an "Estado de Desarrollo" heading with a table or list
- SDD flow steps are numbered 1-7 with no gaps

### Requirement: Human-Readable Status Report

The system SHALL generate `docs/informe-estado-YYYYMMDD-HHMM.md` with timestamped filename, documenting completed features, pending tasks, technical debt, missing pieces for professional quality, and integration status.

#### Scenario: Developer opens status report

- GIVEN a developer opens the report
- WHEN reading the document
- THEN they MUST find completed features with checkmarks
- AND pending tasks with priority levels
- AND technical debt items catalogued by severity
- AND missing professional-quality items identified
- AND gateway integration status documented

#### Scenario: Report is timestamped

- GIVEN the report exists in `docs/`
- WHEN inspecting its filename
- THEN the filename MUST match `informe-estado-YYYYMMDD-HHMM.md` with actual generation date/time

**Acceptance Criteria:**
- Report contains all 5 required sections
- Filename has timestamp in the exact format YYYYMMDD-HHMM
- Each section has at least 3 meaningful entries

### Requirement: AI-Actionable Status Report

The system SHALL generate `docs/informe-estado-ai-YYYYMMDD-HHMM.md` with structured task list, exact file paths, priority levels, estimated effort, and dependency information.

#### Scenario: AI agent plans work from report

- GIVEN an AI agent reads the AI report
- WHEN planning implementation work
- THEN the agent MUST find a structured task list with exact file paths
- AND priority levels (CRITICAL/HIGH/MEDIUM/LOW)
- AND estimated effort per task (hours or complexity)
- AND dependencies between tasks documented
- AND code locations to modify explicitly listed

**Acceptance Criteria:**
- Each task has: priority, file path, effort estimate, dependencies
- Dependencies are directional (task A blocks task B)
- File paths are absolute or relative to project root
- Priority levels use the classification CRITICAL/HIGH/MEDIUM/LOW
