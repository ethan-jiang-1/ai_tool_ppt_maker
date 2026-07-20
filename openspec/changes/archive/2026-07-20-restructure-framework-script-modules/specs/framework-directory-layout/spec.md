## MODIFIED Requirements

### Requirement: Reference documents are under reference/

`quick-start.md`, `glossary.md`, `anti-patterns.md`, `version-log.md`, and the cross-Phase `agent-prompts.md` appendix SHALL be located under `PPTMAKER_FRAMEWORK/reference/`. They SHALL remain lookup documents, not executable script or Phase-interface assets.

#### Scenario: Human looks up glossary or prompt templates

- **WHEN** a human needs a glossary or reusable Agent prompt template
- **THEN** they find it under `reference/`
- **AND** no cross-Phase prompt appendix is loaded from the scripts root

### Requirement: All executable scripts are under scripts/

All `.mjs` production scripts SHALL be located under `PPTMAKER_FRAMEWORK/scripts/` and SHALL follow the delegated ownership tree defined by `framework-script-layout`. The scripts root SHALL keep only the canonical `ppt_flow.mjs` executable; other registered direct executables SHALL live at their owning Phase or categorized shared paths. `contracts/`, `fonts/`, and `fixtures/` SHALL remain resource roots under `scripts/`; the mixed cross-Phase `agent-prompts.md` appendix SHALL move to `PPTMAKER_FRAMEWORK/reference/agent-prompts.md`; and `change-classifier.md` SHALL live under `scripts/05-iteration/`.

#### Scenario: Agent runs the canonical pipeline entry

- **WHEN** Agent runs `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs build <run_dir>`
- **THEN** the script executes successfully from the stable root entrypoint
- **AND** delegation resolves through the owning Phase interfaces

#### Scenario: Maintainer invokes a direct capability CLI

- **WHEN** a maintainer uses a registered direct executable instead of `ppt_flow`
- **THEN** its path identifies its numbered Phase or categorized shared owner
- **AND** no root-level alias is required

### Requirement: scripts/README.md exists

`PPTMAKER_FRAMEWORK/scripts/README.md` SHALL exist as the ownership-oriented script inventory. It SHALL document the exact Phase/shared tree, each Phase interface, registered direct executable paths, allowed import direction, source-to-test ownership manifest, and the stable root `ppt_flow.mjs` entrypoint. It SHALL point to `cli-surface` for diagnostic details rather than duplicate that producer contract.

#### Scenario: Agent surveys available tools

- **WHEN** Agent reads `scripts/README.md`
- **THEN** it can locate an operation by lifecycle owner rather than filename memory
- **AND** it can identify the canonical interface or direct executable without opening private implementation

### Requirement: All cross-references resolve correctly

Every active local Markdown link and `.md`/`.mjs` path reference under `PPTMAKER_FRAMEWORK/`, active OpenSpec context/specs, and repository maintenance guidance SHALL resolve to the final directory/production names. Complete-framework coherence scans SHALL reject old active workflow names, removed historical script roots, flat Change-3 direct executable paths, `scripts/lib/`, the old classifier/prompt locations, unavailable Phase-4 executable links, duplicate active methods, and stale lifecycle/module frontmatter. Narrow historical/archive exceptions MAY remain only in explicitly historical documents outside the active framework.

#### Scenario: Final link graph is clean

- **WHEN** documentation consistency scans every active framework Markdown link and Node path example
- **THEN** each target resolves after the atomic script/test migration

#### Scenario: Old script path remains active

- **WHEN** active framework guidance or node metadata references a removed flat executable or `scripts/lib/` path
- **THEN** coherence validation reports source file, line, and old path

#### Scenario: Main specs use final paths

- **WHEN** OpenSpec coherence scans main specs/config context
- **THEN** active framework path examples use the final workflow and script ownership vocabulary

### Requirement: env-check script is accessible from scripts/

The environment check direct executable SHALL be located at `PPTMAKER_FRAMEWORK/scripts/00-setup/env-check.mjs` and exposed through the Phase 0 `index.mjs` interface. It SHALL function correctly from this location, with internal package, runtime, fixture, and font resolution updated for the ownership tree. `ppt_flow doctor` SHALL remain the canonical user-facing invocation.

#### Scenario: Env check runs from its owner path

- **WHEN** `node PPTMAKER_FRAMEWORK/scripts/00-setup/env-check.mjs` is run
- **THEN** it checks the canonical `scripts/fonts/` and `scripts/fixtures/` resources
- **AND** outputs READY/NOT READY exactly as before the migration

#### Scenario: User runs canonical doctor

- **WHEN** Agent runs `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs doctor`
- **THEN** the root front controller delegates to the Phase 0 environment checker
- **AND** the user does not need to know the moved direct path
