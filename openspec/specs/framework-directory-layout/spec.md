## Purpose

Define the canonical directory layout of `PPTMAKER_FRAMEWORK/` after consolidation: a type-based, five-subdirectory root (`workflow/`, `scripts/`, `charter/`, `reference/`, `playbook/`) with all Phase methodology under `workflow/`, all executable scripts under `scripts/`, all lookup appendices under `reference/`, and all workflow controllers under `playbook/`. This capability guarantees that legacy paths (`automation/`, `06_reference_scripts/`, Phase-numbered root dirs) no longer exist and that every cross-reference resolves to the new structure. It describes only the soft bundle `PPTMAKER_FRAMEWORK/`; run-bundle (`deck_*`) folder ontology — three tiers, `_scratch/`, `_generated/` version leaves, structure gradient — is owned by capability `run-bundle-layout` and SHALL NOT be extended here.
## Requirements
### Requirement: Framework root has exactly five subdirectories

`PPTMAKER_FRAMEWORK/` SHALL contain exactly five subdirectories: `workflow/`, `scripts/`, `charter/`, `reference/`, and `playbook/`. No other subdirectories SHALL exist at this level.

#### Scenario: Human lists framework root

- **WHEN** a human runs `ls PPTMAKER_FRAMEWORK/`
- **THEN** they see exactly `workflow/`, `scripts/`, `charter/`, `reference/`, `playbook/` plus the five root .md files
- **AND** directories named with Phase numbers (00_, 01_, etc.) or `automation/` do NOT appear

### Requirement: Phase directories are under workflow/

All six Phase methodology directories SHALL be located under `PPTMAKER_FRAMEWORK/workflow/`: `00-setup/`, `01-visual/`, `02-content/`, `03-prompts/`, `04-production/`, `05-iteration/`.

#### Scenario: Agent finds Phase methodology

- **WHEN** Agent needs to read Phase 1 content design methodology
- **THEN** it finds the files at `workflow/02-content/`

### Requirement: All executable scripts are under scripts/

All `.mjs` production scripts SHALL be located under `PPTMAKER_FRAMEWORK/scripts/`. This includes `bundle_layout.mjs`, `ppt_flow.mjs`, `unified_pipeline.mjs`, all stage scripts, `visual_config.mjs`, `generate_style_master.mjs`, and `env-check.mjs`. The `fonts/` directory, `agent-prompts.md`, and `change-classifier.md` SHALL also be in this directory.

#### Scenario: Agent runs a pipeline script

- **WHEN** Agent runs `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs build <run_dir>`
- **THEN** the script executes successfully from its new location

### Requirement: Reference documents are under reference/

`quick-start.md`, `glossary.md`, `anti-patterns.md`, and `version-log.md` SHALL be located under `PPTMAKER_FRAMEWORK/reference/`.

#### Scenario: Human looks up glossary

- **WHEN** a human needs to understand a framework term
- **THEN** they find the glossary at `reference/glossary.md`

### Requirement: workflow/README.md exists

`PPTMAKER_FRAMEWORK/workflow/README.md` SHALL exist as the workflow overview, documenting Phase order, editing chains, and gate checkpoints.

#### Scenario: Agent needs workflow overview

- **WHEN** Agent reads `workflow/README.md`
- **THEN** they understand the complete process flow

### Requirement: scripts/README.md exists

`PPTMAKER_FRAMEWORK/scripts/README.md` SHALL exist as the script inventory, listing each script's purpose, inputs, outputs, and dependencies.

#### Scenario: Agent surveys available tools

- **WHEN** Agent reads `scripts/README.md`
- **THEN** they know what each script does and how to use it

### Requirement: automation/ directory no longer exists

The `PPTMAKER_FRAMEWORK/automation/` directory SHALL NOT exist. Its contents SHALL be in `scripts/`.

#### Scenario: Old automation path is dead

- **WHEN** any script or document references `automation/`
- **THEN** the reference has been updated to `scripts/`

### Requirement: 06_reference_scripts/ directory no longer exists

The directory `PPTMAKER_FRAMEWORK/06_reference_scripts/` SHALL NOT exist. All its contents SHALL be at `PPTMAKER_FRAMEWORK/scripts/`.

#### Scenario: Old script path is dead

- **WHEN** any document references `06_reference_scripts/`
- **THEN** the reference has been updated to `scripts/`

### Requirement: All cross-references resolve correctly

Every local Markdown cross-reference in active files under `PPTMAKER_FRAMEWORK/` SHALL resolve relative to its containing file, and every active `.md`/`.mjs` path reference SHALL use the current directory and production-path names. The test suite SHALL scan the complete active framework rather than only a hand-selected entry subset. Explicit historical documents and intentionally unresolved template examples MAY be excluded only through narrow, visible rules.

#### Scenario: Markdown link graph is clean

- **WHEN** the documentation consistency test scans every active Markdown link under `PPTMAKER_FRAMEWORK/`
- **THEN** each local target exists after resolving it relative to the source file
- **AND** broken links report source file, line, and target

#### Scenario: Grep for old names inside framework is clean

- **WHEN** the coherence test scans active framework files for removed directories and production paths
- **THEN** no active reference to `06_reference_scripts`, `00_project_setup`, `automation/`, `01_visual_style_master`, `02_content_design`, `03_image_prompts`, `04_production_pipeline`, `05_iteration`, or external Image2 skill production paths remains
- **AND** explicitly historical version-log text may remain under a documented exception

#### Scenario: Grep for old names in openspec specs is clean

- **WHEN** the coherence test scans `openspec/specs/` and `openspec/config.yaml`
- **THEN** path references use current framework locations such as `scripts/change-classifier.md`
- **AND** removed paths or directory names including `automation/change-classifier.md`, `06_reference_scripts`, `00_project_setup`, `01_visual_style_master`, `02_content_design`, `03_image_prompts`, `04_production_pipeline`, and `05_iteration` are absent

### Requirement: workflow/00-setup README reflects reduced file inventory

The file `PPTMAKER_FRAMEWORK/workflow/00-setup/README.md` SHALL be updated to remove references to the 4 moved appendix files (now in `reference/`) and the env-check script (now in `scripts/`).

#### Scenario: README accurately lists remaining contents

- **WHEN** a human reads `workflow/00-setup/README.md`
- **THEN** the file inventory no longer mentions QUICK_START, GLOSSARY, ANTI_PATTERNS, VERSION_LOG, or the env-check script
- **AND** it mentions that reference documents are in `../reference/`

### Requirement: env-check script is accessible from scripts/

The environment check script SHALL be located at `PPTMAKER_FRAMEWORK/scripts/env-check.mjs`. It SHALL function correctly from this location, with internal font search paths updated to reflect the new directory structure.

#### Scenario: Env check runs from new location

- **WHEN** `node PPTMAKER_FRAMEWORK/scripts/env-check.mjs` is run
- **THEN** it checks fonts from `scripts/fonts/` (not `06_reference_scripts/fonts/`)
- **AND** outputs READY/NOT READY correctly

### Requirement: Soft-bundle layout does not define run-bundle trees

`framework-directory-layout` SHALL describe only `PPTMAKER_FRAMEWORK/` (five type-based subdirectories and root entry markdown). It SHALL NOT define `deck_*` run-bundle tiers, `_scratch/`, `_generated/` version leaves, or run-bundle structure gradient. Run-bundle folder ontology is owned by capability `run-bundle-layout`.

#### Scenario: Soft-bundle layout stays soft-bundle-only

- **WHEN** a reader opens `openspec/specs/framework-directory-layout/spec.md`
- **THEN** its requirements address `PPTMAKER_FRAMEWORK/` paths
- **AND** do not define `deck_*/3_versions/` or version `_scratch/` as soft-bundle folders

### Requirement: Documentation exceptions are explicit and narrow

Any broken-link or stale-path exclusion SHALL identify the exact historical/template file and reason. Directory-wide or broad regex exclusions that could hide active drift SHALL be forbidden. A command pseudocode exception SHALL use the exact adjacent next-example marker defined by `cli-surface` and SHALL not double as a link/path exclusion.

#### Scenario: Active README is hidden by broad exclusion

- **WHEN** a test exclusion would skip an entire workflow directory
- **THEN** the consistency test fails configuration validation
- **AND** requires a file-specific exception instead
