## ADDED Requirements

### Requirement: Charter directory exists with exactly three files

`PPTMAKER_FRAMEWORK/charter/` SHALL exist as a subdirectory containing exactly three files: CONSTITUTION.md, WORKFLOW.md, and AGENT_CONTRACT.md. No other files SHALL be placed in this directory.

#### Scenario: Agent enters framework and reads charter

- **WHEN** Agent navigates to `PPTMAKER_FRAMEWORK/charter/`
- **THEN** it finds CONSTITUTION.md (structure constitution), WORKFLOW.md (process constitution), and AGENT_CONTRACT.md (behavioral constitution)
- **AND** no other files exist in this directory

#### Scenario: Human discovers the charter

- **WHEN** a human opens `PPTMAKER_FRAMEWORK/` and sees the `charter/` directory
- **THEN** the README explains that charter contains the three constitutional documents governing the framework

### Requirement: CONSTITUTION.md declares bundle_layout.mjs as the single source of truth

`charter/CONSTITUTION.md` SHALL explicitly state that `PPTMAKER_FRAMEWORK/06_reference_scripts/bundle_layout.mjs` is the single authoritative source for the run bundle directory structure. It SHALL contain a human-readable snapshot of the canonical tree, and SHALL state that the code authority takes precedence over any snapshot.

#### Scenario: Human reads constitution to understand directory layout

- **WHEN** a human opens `charter/CONSTITUTION.md`
- **THEN** they see a clear declaration that `bundle_layout.mjs` is the SSOT
- **AND** they see the canonical directory tree (generated from `renderTree()`)
- **AND** they see the three-tier gradient explanation (upstream/backbone/downstream)
- **AND** they see the override precedence rules
- **AND** they see the init and check commands

#### Scenario: Developer changes run bundle structure

- **WHEN** a developer modifies path constants in `bundle_layout.mjs`
- **THEN** running `node bundle_layout.mjs` shows the updated authoritative tree
- **AND** the snapshot in CONSTITUTION.md is updated to match

### Requirement: WORKFLOW.md describes the complete agent process

`charter/WORKFLOW.md` SHALL document: the 5-Phase overview table (Phase name, purpose, gate, agent role), the four editing chains (A/B/C/Structural) with their stage mappings and estimated durations, the agent entry sequence (CLAUDE → BOOTSTRAP → CONTRACT → per-Phase AGENTS), and the gate checkpoint mechanism.

#### Scenario: Agent reads workflow to understand process structure

- **WHEN** an agent reads `charter/WORKFLOW.md`
- **THEN** it understands the Phase order (00→01→02→03→04→05)
- **AND** it knows each Phase's purpose and which gate must pass
- **AND** it understands the agent's role in each Phase (executor/advisor/creator/learner/judge)

#### Scenario: Agent classifies a user change request

- **WHEN** user says "change slide 5 title"
- **THEN** agent consults WORKFLOW.md editing chain table
- **AND** identifies this as Chain A (text change), stages 1,3,4,5, targeting slide 5, ~5 min

#### Scenario: Agent handles structural change

- **WHEN** user says "add a case study slide after slide 8"
- **THEN** agent identifies this as Structural change
- **AND** knows to use `--new-version` and regenerate affected slides

### Requirement: AGENT_CONTRACT.md is in charter directory

`AGENT_CONTRACT.md` SHALL be located at `PPTMAKER_FRAMEWORK/charter/AGENT_CONTRACT.md`, moved from the framework root via `git mv`. Its file content SHALL remain unchanged. Its git history SHALL be preserved.

#### Scenario: Contract is accessible via charter

- **WHEN** Agent follows the BOOTSTRAP entry flow and reads AGENT_CONTRACT.md
- **THEN** the link resolves to `charter/AGENT_CONTRACT.md`
- **AND** the 10 iron laws are identical to before the move

#### Scenario: Old root location no longer contains contract

- **WHEN** a file listing of `PPTMAKER_FRAMEWORK/` is performed
- **THEN** `AGENT_CONTRACT.md` does NOT appear in the root directory

### Requirement: Framework root contains exactly five markdown files

The `PPTMAKER_FRAMEWORK/` root directory SHALL contain exactly five `.md` files: README.md, CLAUDE.md, BOOTSTRAP.md, AGENTS.md, and COMMANDS.md. No other `.md` files SHALL exist at this level.

#### Scenario: Human opens framework and sees clean entry

- **WHEN** a human lists `PPTMAKER_FRAMEWORK/` contents
- **THEN** they see only five markdown files, all of which are self-explanatory entry points
- **AND** AGENT_CONTRACT.md is NOT in the root (it is in charter/)
- **AND** QUICK_START.md, GLOSSARY.md, ANTI_PATTERNS.md, VERSION_LOG.md are NOT in the root (they are in 00_project_setup/)

### Requirement: Reference documents are in 00_project_setup

QUICK_START.md, GLOSSARY.md, ANTI_PATTERNS.md, and VERSION_LOG.md SHALL be located in `PPTMAKER_FRAMEWORK/00_project_setup/`, moved from the framework root via `git mv`. Their content SHALL remain unchanged except for cross-reference links updated to reflect new locations.

#### Scenario: Human looks for reference material

- **WHEN** a human navigates to `00_project_setup/`
- **THEN** they find QUICK_START.md (5-minute onboarding), GLOSSARY.md (terminology), ANTI_PATTERNS.md (common mistakes), and VERSION_LOG.md (changelog)

#### Scenario: Agent does not need to read reference files at startup

- **WHEN** Agent enters the framework
- **THEN** the BOOTSTRAP startup sequence does NOT require reading QUICK_START, GLOSSARY, ANTI_PATTERNS, or VERSION_LOG
- **AND** these files are only consulted when explicitly needed

### Requirement: 01-directory-template.md is deleted and merged

The file `PPTMAKER_FRAMEWORK/00_project_setup/01-directory-template.md` SHALL be deleted via `git rm`. Its essential content (directory tree, three-tier philosophy, override rules) SHALL be merged into `charter/CONSTITUTION.md`.

#### Scenario: Old template no longer exists

- **WHEN** a file listing of `00_project_setup/` is performed
- **THEN** `01-directory-template.md` does NOT appear

#### Scenario: Old template content is preserved in constitution

- **WHEN** a reader opens `charter/CONSTITUTION.md`
- **THEN** they find the same structural information (tree, gradient, override rules) that was in `01-directory-template.md`
- **AND** they are directed to `bundle_layout.mjs` as the authoritative source

### Requirement: All internal links resolve correctly after reorganization

Every cross-reference to moved files SHALL be updated to their new paths. A full-text search for old root-level filenames SHALL return zero results outside of `charter/` and `00_project_setup/` internal self-references.

#### Scenario: No broken links after reorganization

- **WHEN** `grep -r "QUICK_START\|GLOSSARY\|ANTI_PATTERNS\|VERSION_LOG\|01-directory-template" PPTMAKER_FRAMEWORK/` is run
- **THEN** no matches are found (except charter/ and 00_project_setup/ internal self-references)

### Requirement: 00_project_setup README reflects new file inventory

The file `PPTMAKER_FRAMEWORK/00_project_setup/README.md` SHALL be updated to list the four newly-added files (QUICK_START, GLOSSARY, ANTI_PATTERNS, VERSION_LOG) and remove the deleted `01-directory-template.md`.

#### Scenario: README accurately lists directory contents

- **WHEN** a human reads `00_project_setup/README.md`
- **THEN** the file inventory matches the actual directory contents

### Requirement: Root README references charter directory

The file `PPTMAKER_FRAMEWORK/README.md` SHALL mention the `charter/` directory and describe its purpose: housing the three constitutional documents (CONSTITUTION, WORKFLOW, AGENT_CONTRACT). The README's directory tree diagram SHALL include `charter/` and `COMMANDS.md`.

#### Scenario: Human discovers charter from root README

- **WHEN** a human reads `PPTMAKER_FRAMEWORK/README.md`
- **THEN** they see `charter/` in the directory tree
- **AND** they understand it contains the framework's governing documents

### Requirement: Moved files preserve content and git history

Files moved via `git mv` SHALL have identical content to their originals. Their git history SHALL be preserved (verified via `git log --follow`).

#### Scenario: Diff confirms content unchanged

- **WHEN** `git diff HEAD -- PPTMAKER_FRAMEWORK/charter/AGENT_CONTRACT.md` is run after the move
- **THEN** no diff output is produced (file content is identical to before the move)
