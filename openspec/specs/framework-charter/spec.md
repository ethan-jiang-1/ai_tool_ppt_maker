## Purpose

Define the framework's constitutional and entry layer: the `PPTMAKER_FRAMEWORK/charter/` directory and its four governing documents (CONSTITUTION.md, WORKFLOW.md, AGENT_CONTRACT.md, NODE-SPEC.md), together with the clean top-level entry surface — exactly five root markdown files, five type-based subdirectories, and the pure-lookup appendices relocated to `reference/`. This capability guarantees that an agent or human entering the framework finds a stable, unambiguous set of entry points and a single authoritative declaration (`bundle_layout.mjs` as the SSOT for run-bundle structure), with governing documents cleanly separated from reference material.

## Requirements

### Requirement: Charter directory exists with exactly four files

`PPTMAKER_FRAMEWORK/charter/` SHALL exist as a subdirectory containing exactly four files: CONSTITUTION.md, WORKFLOW.md, AGENT_CONTRACT.md, and NODE-SPEC.md. No other files SHALL be placed in this directory.

#### Scenario: Agent enters framework and reads charter

- **WHEN** Agent navigates to `PPTMAKER_FRAMEWORK/charter/`
- **THEN** it finds CONSTITUTION.md (structure constitution), WORKFLOW.md (process constitution), AGENT_CONTRACT.md (behavioral constitution), and NODE-SPEC.md (node constitution)
- **AND** no other files exist in this directory

### Requirement: CONSTITUTION.md declares bundle_layout.mjs as the single source of truth

`charter/CONSTITUTION.md` SHALL explicitly state that `PPTMAKER_FRAMEWORK/scripts/bundle_layout.mjs` is the single authoritative source for the run bundle directory structure. It SHALL contain a human-readable snapshot of the canonical tree, and SHALL state that the code authority takes precedence over any snapshot.

#### Scenario: Human reads constitution to understand directory layout

- **WHEN** a human opens `charter/CONSTITUTION.md`
- **THEN** they see a clear declaration that `bundle_layout.mjs` is the SSOT
- **AND** they see the canonical directory tree (generated from `renderTree()`)
- **AND** they see the three-tier gradient explanation (upstream/backbone/downstream)
- **AND** they see the override precedence rules

### Requirement: WORKFLOW.md describes the complete agent process

`charter/WORKFLOW.md` SHALL document: the 5-Phase overview table (Phase name, purpose, gate, agent role), the four editing chains (A/B/C/Structural) with their stage mappings and estimated durations, the agent entry sequence, and the gate checkpoint mechanism.

#### Scenario: Agent reads workflow to understand process structure

- **WHEN** an agent reads `charter/WORKFLOW.md`
- **THEN** it understands the Phase order (00→01→02→03→04→05)
- **AND** it knows each Phase's purpose and which gate must pass

### Requirement: AGENT_CONTRACT.md is in charter directory

`AGENT_CONTRACT.md` SHALL be located at `PPTMAKER_FRAMEWORK/charter/AGENT_CONTRACT.md`. Its content SHALL remain unchanged from the framework-directory-restructure change.

#### Scenario: Contract is accessible via charter

- **WHEN** Agent follows the BOOTSTRAP entry flow and reads AGENT_CONTRACT.md
- **THEN** the link resolves to `charter/AGENT_CONTRACT.md`

### Requirement: Framework root contains exactly five markdown files

The `PPTMAKER_FRAMEWORK/` root directory SHALL contain exactly five `.md` files: README.md, CLAUDE.md, BOOTSTRAP.md, AGENTS.md, and COMMANDS.md. No other `.md` files SHALL exist at this level.

#### Scenario: Human opens framework and sees clean entry

- **WHEN** a human lists `PPTMAKER_FRAMEWORK/` contents
- **THEN** they see only five markdown files, all of which are entry points
- **AND** reference documents (`quick-start.md`, `glossary.md`, `anti-patterns.md`, `version-log.md`) are NOT in the root

### Requirement: Reference documents are in reference/ directory

`quick-start.md`, `glossary.md`, `anti-patterns.md`, and `version-log.md` SHALL be located in `PPTMAKER_FRAMEWORK/reference/`. These are pure lookup appendices, not entry points.

#### Scenario: Human looks for reference material

- **WHEN** a human navigates to `reference/`
- **THEN** they find `quick-start.md` (onboarding), `glossary.md` (terminology), `anti-patterns.md` (common mistakes), and `version-log.md` (changelog)

### Requirement: Root README references charter directory

The file `PPTMAKER_FRAMEWORK/README.md` SHALL mention the `charter/` directory and describe its purpose: housing the three constitutional documents. The README's directory tree diagram SHALL include `charter/` and `COMMANDS.md`.

#### Scenario: Human discovers charter from root README

- **WHEN** a human reads `PPTMAKER_FRAMEWORK/README.md`
- **THEN** they see `charter/` in the directory tree
- **AND** they understand it contains the framework's governing documents

### Requirement: Framework root subdirectories follow type-based organization

The `PPTMAKER_FRAMEWORK/` root SHALL contain exactly five subdirectories: `workflow/` (methodology), `scripts/` (executable code), `charter/` (constitution), `reference/` (appendices), and `playbook/` (workflow controllers). Phase-numbered directories (00_*, 01_*, etc.) SHALL NOT exist at root level.

#### Scenario: Human lists root subdirectories

- **WHEN** a human runs `ls PPTMAKER_FRAMEWORK/`
- **THEN** they see exactly `workflow/`, `scripts/`, `charter/`, `reference/`, `playbook/`
- **AND** no directory names contain Phase numbers at root level

