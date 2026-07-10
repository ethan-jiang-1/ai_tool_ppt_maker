## ADDED Requirements

### Requirement: Framework root has exactly four subdirectories

`PPTMAKER_FRAMEWORK/` SHALL contain exactly four subdirectories: `workflow/`, `scripts/`, `charter/`, and `reference/`. No other subdirectories SHALL exist at this level.

#### Scenario: Human lists framework root

- **WHEN** a human runs `ls PPTMAKER_FRAMEWORK/`
- **THEN** they see exactly `workflow/`, `scripts/`, `charter/`, `reference/` plus the five root .md files
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

QUICK_START.md, GLOSSARY.md, ANTI_PATTERNS.md, and VERSION_LOG.md SHALL be located under `PPTMAKER_FRAMEWORK/reference/`.

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

Every cross-reference in .md and .mjs files SHALL use the new directory names. A grep for old directory names SHALL return zero results.

#### Scenario: Grep for old names is clean

- **WHEN** `grep -r "06_reference_scripts\|00_project_setup\|automation/" PPTMAKER_FRAMEWORK/` is run
- **THEN** no matches are found
