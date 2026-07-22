## MODIFIED Requirements

### Requirement: Phase directories are under workflow/
All six active/final Phase methodology directories SHALL be located under
`PPTMAKER_FRAMEWORK/workflow/` with exact names `00-setup/`, `01-content/`,
`02-visual-system/`, `03-html-production/`, `04-image-production/`, and
`05-iteration/`. `04-image-production/` owns the two Image Production adapter methods; it is a
capability taxonomy and its number SHALL NOT itself create a scheduling, HTML-delivery, provider, or
final-review dependency. `05-iteration/` owns only mode-aware local iteration and compatibility
routing. Lifecycle/module annotations remain inventory metadata; adapter entry legality is owned by
canonical production mode and declared direct dependencies.

The removed active directories `01-visual/`, `02-content/`, `03-prompts/`, `04-production/`, and
`04-image2-refinement/` SHALL not remain as aliases or duplicate methodology trees. Retired Image
Production paths may remain only as exact entries in the canonical legacy-token exception inventory,
which names the token/path, reason, owner, public-compatibility status, and removal trigger.

#### Scenario: Agent finds Image Production methodology
- **WHEN** Agent needs whole-page or visual-slot Image Production guidance
- **THEN** it reads `workflow/04-image-production/` and the selected adapter's declared prerequisites
- **AND** it does not infer a prerequisite from the directory number

#### Scenario: Retired Phase 4 path is inspected
- **WHEN** architecture validation inspects active framework layout
- **THEN** `workflow/04-image2-refinement/` is absent
- **AND** every retained historical token is an exact inventoried exception rather than an active route

## ADDED Requirements

### Requirement: Active Image Production layout has one family root
Active framework layout SHALL contain `04-image-production` and SHALL not retain
`04-image2-refinement` as an active module. Historical tokens may remain only in an exception
inventory naming token, path, reason, owner, public-compatibility status, and removal trigger.

#### Scenario: Active tree is inspected
- **WHEN** architecture validation inspects the framework tree
- **THEN** Image Production has one active family root
- **AND** every retained old token is inventoried
