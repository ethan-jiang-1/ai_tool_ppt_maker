## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: Documentation exceptions are explicit and narrow

Any broken-link or stale-path exclusion SHALL identify the exact historical/template file and reason. Directory-wide or broad regex exclusions that could hide active drift SHALL be forbidden. A command pseudocode exception SHALL use the exact adjacent next-example marker defined by `cli-surface` and SHALL not double as a link/path exclusion.

#### Scenario: Active README is hidden by broad exclusion

- **WHEN** a test exclusion would skip an entire workflow directory
- **THEN** the consistency test fails configuration validation
- **AND** requires a file-specific exception instead
