## Purpose

Define the canonical directory layout of `PPTMAKER_FRAMEWORK/`: a type-based, five-subdirectory root (`workflow/`, `scripts/`, `charter/`, `reference/`, `playbook/`) with Phase methodology under `workflow/`, delegated Phase/shared code under `scripts/`, lookup appendices including `reference/agent-prompts.md` under `reference/`, and workflow controllers under `playbook/`. This capability describes only the soft bundle; run-bundle ontology is owned by `run-bundle-layout`.
## Requirements
### Requirement: Framework root has exactly five subdirectories

`PPTMAKER_FRAMEWORK/` SHALL contain exactly five subdirectories: `workflow/`, `scripts/`, `charter/`, `reference/`, and `playbook/`. No other subdirectories SHALL exist at this level.

#### Scenario: Human lists framework root

- **WHEN** a human runs `ls PPTMAKER_FRAMEWORK/`
- **THEN** they see exactly `workflow/`, `scripts/`, `charter/`, `reference/`, `playbook/` plus the five root .md files
- **AND** directories named with Phase numbers (00_, 01_, etc.) or `automation/` do NOT appear

### Requirement: Phase directories are under workflow/
All six active/final Phase methodology directories SHALL be located under `PPTMAKER_FRAMEWORK/workflow/` with exact names `00-setup/`, `01-content/`, `02-visual-system/`, `03-html-production/`, `04-image-production/`, and `05-iteration/`. `04-image-production/` is the active Image Production family: `whole-page` is legal only for `image2-only`, while `visual-slot` is legal only for `html-then-image2` after current HTML delivery. Lifecycle/module metadata classifies ownership and does not schedule either adapter.

The removed active directories `01-visual/`, `02-content/`, `03-prompts/`, and `04-production/` SHALL not remain as aliases or duplicate methodology trees. Current whole-page Image2 methodology SHALL live in the active `workflow/04-image-production/` family and its `create-deck` playbook route; no separate reference/playbook maintenance tree is a supported alternative.

#### Scenario: Agent finds content and production methodology
- **WHEN** Agent needs new-deck content and delivery methods
- **THEN** it reads `workflow/01-content/` and `workflow/03-html-production/`
- **AND** does not encounter a second active whole-page route

#### Scenario: Image Production is visible and adapter-owned
- **WHEN** Agent opens `workflow/04-image-production/`
- **THEN** it finds the active Image Production methodology
- **AND** it does not find a retired Image2-refinement alias

### Requirement: All executable scripts are under scripts/

All `.mjs` production scripts SHALL be located under `PPTMAKER_FRAMEWORK/scripts/` and follow the ownership tree defined by `framework-script-layout`. The root retains only `ppt_flow.mjs`; other registered direct executables live at their numbered-Phase or categorized shared owner path. `contracts/`, `fonts/`, and `fixtures/` remain resource roots; `agent-prompts.md` lives in `reference/`, and `change-classifier.md` lives under `scripts/05-iteration/`.

#### Scenario: Agent runs a pipeline script

- **WHEN** Agent runs `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs build <run_dir>`
- **THEN** the script executes successfully from its new location

### Requirement: Reference documents are under reference/

`quick-start.md`, `glossary.md`, `anti-patterns.md`, `version-log.md`, and cross-Phase `agent-prompts.md` SHALL be located under `PPTMAKER_FRAMEWORK/reference/` as lookup documents rather than executable or interface assets.

#### Scenario: Human looks up glossary

- **WHEN** a human needs to understand a framework term
- **THEN** they find the glossary at `reference/glossary.md`

### Requirement: workflow/README.md exists

`PPTMAKER_FRAMEWORK/workflow/README.md` SHALL exist as the workflow overview, documenting Phase order, editing chains, and gate checkpoints.

#### Scenario: Agent needs workflow overview

- **WHEN** Agent reads `workflow/README.md`
- **THEN** they understand the complete process flow

### Requirement: scripts/README.md exists

`PPTMAKER_FRAMEWORK/scripts/README.md` SHALL be an ownership-oriented inventory documenting the exact Phase/shared tree, each Phase interface, registered direct executable paths, allowed import direction, source-to-test ownership manifest, and stable root entrypoint. It SHALL point to `cli-surface` rather than duplicate diagnostic schema.

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

Every active local Markdown link and `.md`/`.mjs` path reference under `PPTMAKER_FRAMEWORK/` SHALL resolve to the final directory/production names. Complete-framework coherence scans SHALL reject old active workflow names `01-visual`, `02-content`, `03-prompts`, and `04-production`, removed earlier historical names, duplicate active methods, unavailable Phase-4 executable links, and stale lifecycle/module frontmatter. Narrow historical/archive exceptions MAY remain only in explicitly historical documents outside the active framework.

#### Scenario: Final link graph is clean

- **WHEN** documentation consistency scans every active framework Markdown link
- **THEN** each target resolves after the atomic directory migration

#### Scenario: Old workflow paths remain active

- **WHEN** active framework guidance or node metadata references a removed workflow directory
- **THEN** coherence validation reports source file, line, and old path

#### Scenario: Main specs use final paths

- **WHEN** OpenSpec coherence scans main specs/config context
- **THEN** active framework path examples use the final six-directory vocabulary

### Requirement: workflow/00-setup README reflects reduced file inventory

The file `PPTMAKER_FRAMEWORK/workflow/00-setup/README.md` SHALL be updated to remove references to the 4 moved appendix files (now in `reference/`) and the env-check script (now in `scripts/`).

#### Scenario: README accurately lists remaining contents

- **WHEN** a human reads `workflow/00-setup/README.md`
- **THEN** the file inventory no longer mentions QUICK_START, GLOSSARY, ANTI_PATTERNS, VERSION_LOG, or the env-check script
- **AND** it mentions that reference documents are in `../reference/`

### Requirement: env-check script is accessible from scripts/

The environment check direct executable SHALL be located at `PPTMAKER_FRAMEWORK/scripts/00-setup/env-check.mjs` and exposed through the Phase-0 interface. It SHALL resolve its package/runtime/fixture/font resources through the ownership tree; `ppt_flow doctor` remains the normal user-facing invocation.

#### Scenario: Env check runs from new location

- **WHEN** `node PPTMAKER_FRAMEWORK/scripts/00-setup/env-check.mjs` is run
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

### Requirement: scripts/fonts is the canonical distributed-font and license root

`PPTMAKER_FRAMEWORK/scripts/fonts/` SHALL be the canonical soft-bundle root for framework-distributed font binaries used by the HTML runtime, original and local CSS snapshots, integrity/coverage inventory, provenance, copyright notices, and license texts. The tree MAY contain family-specific and license subdirectories beneath `scripts/fonts/`; it SHALL NOT add a sixth top-level `PPTMAKER_FRAMEWORK/` directory and SHALL NOT define or write font assets inside a `deck_*` run bundle.

The active fonts README SHALL distinguish required HTML-runtime WOFF2 assets from the existing optional Stage-3 canvas/system-font fallback behavior. Every active path reference SHALL resolve to `scripts/fonts/`, and tests SHALL reject a second canonical font-distribution location.

#### Scenario: Maintainer locates distributed HTML fonts

- **WHEN** a maintainer follows framework documentation for the HTML runtime font profile
- **THEN** the binaries, CSS snapshots, inventory, provenance, and license files are all discoverable under `PPTMAKER_FRAMEWORK/scripts/fonts/`
- **AND** no remote-font or run-bundle path is presented as canonical

#### Scenario: Framework root layout remains unchanged

- **WHEN** the distributed font tree is added
- **THEN** `PPTMAKER_FRAMEWORK/` still has exactly the existing five top-level subdirectories
- **AND** all new font subdirectories are descendants of `scripts/fonts/`

#### Scenario: Stage 3 and HTML font contracts are not conflated

- **WHEN** a reader opens `scripts/fonts/README.md`
- **THEN** it identifies the checked-in WOFF2 profile as required for HTML runtime readiness
- **AND** separately explains that legacy `@napi-rs/canvas` font resolution may require supported OTF/TTF assets or its existing system fallback

#### Scenario: Duplicate font authority is rejected

- **WHEN** an active framework document or runtime helper defines another canonical directory for distributed HTML fonts/licenses
- **THEN** documentation/layout coherence validation fails

### Requirement: Current whole-page work has direct framework ownership
`PPTMAKER_FRAMEWORK/playbook/create-deck.md` SHALL own human/Agent methodology for supported whole-page style-master, prompt, pilot/review, production, and refresh work. Its normal Controller route SHALL be `create-deck`. Active workflow pages SHALL identify this route as `image2-only` / `whole-page-image2-v1` work and SHALL not link to a separate retired-maintenance reference.

#### Scenario: New whole-page deck follows the active method tree
- **WHEN** a fresh `image2-only` deck is created
- **THEN** active setup through production guidance routes through `create-deck`
- **AND** no separate maintenance reference is offered

#### Scenario: Supported whole-page run resumes
- **WHEN** a supported whole-page run is resumed
- **THEN** its framework documentation and Controller reference the same current owner
- **AND** no historical Controller is discoverable as an alternate route
