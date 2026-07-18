## MODIFIED Requirements

### Requirement: Phase directories are under workflow/

All six active/final Phase methodology directories SHALL be located under `PPTMAKER_FRAMEWORK/workflow/` with exact names `00-setup/`, `01-content/`, `02-visual-system/`, `03-html-production/`, `04-image2-refinement/`, and `05-iteration/`. Lifecycle Phase and `method_module` numbering SHALL align with those names. In Change 3, `04-image2-refinement/` SHALL contain only a README that states the capability is unavailable, optional after complete HTML delivery, and not an active gate/controller/command; no other Phase-4 workflow file SHALL exist until an owning later change.

The removed active directories `01-visual/`, `02-content/`, `03-prompts/`, and `04-production/` SHALL not remain as aliases or duplicate methodology trees. Legacy whole-page Image2 maintenance SHALL live under `reference/` and `playbook/`, not under the active Phase tree.

#### Scenario: Agent finds content and production methodology

- **WHEN** Agent needs new-deck content and delivery methods
- **THEN** it reads `workflow/01-content/` and `workflow/03-html-production/`
- **AND** does not encounter a second active legacy path

#### Scenario: Phase 4 is visible but unavailable

- **WHEN** Agent opens `workflow/04-image2-refinement/` after Change 3
- **THEN** only the unavailable README exists
- **AND** no active node/controller link claims refinement can execute

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

## ADDED Requirements

### Requirement: Legacy maintenance has isolated framework ownership

`PPTMAKER_FRAMEWORK/reference/legacy-image2-first-maintenance.md` SHALL own human/Agent methodology for markerless style-master, whole-page prompt, pilot/review, production, and refresh compatibility. `PPTMAKER_FRAMEWORK/playbook/legacy-image2-maintenance.md` SHALL own its controller route. New-deck active workflow pages SHALL link to legacy maintenance only from explicit existing-deck classification/migration guidance.

#### Scenario: New deck follows active method tree

- **WHEN** a fresh HTML-first deck is created
- **THEN** no active Phase 1-3 step routes through the legacy maintenance reference

#### Scenario: Markerless deck needs maintenance

- **WHEN** an existing legacy deck is classified
- **THEN** the dedicated reference/controller remains discoverable without pretending to be modern Phase 4
