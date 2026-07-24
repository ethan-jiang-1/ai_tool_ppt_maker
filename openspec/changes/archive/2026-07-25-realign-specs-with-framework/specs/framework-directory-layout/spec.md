## MODIFIED Requirements

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

## REMOVED Requirements

### Requirement: Legacy maintenance has isolated framework ownership
**Reason**: Current whole-page Image2 work is first-class `image2-only` work through `create-deck`; a dedicated maintenance route would preserve retired routing semantics.

**Migration**: Recreate unsupported historical runs. Route every supported whole-page run through the current `create-deck` Controller and `04-image-production/whole-page` implementation.

## ADDED Requirements

### Requirement: Current whole-page work has direct framework ownership
`PPTMAKER_FRAMEWORK/playbook/create-deck.md` SHALL own human/Agent methodology for supported whole-page style-master, prompt, pilot/review, production, and refresh work. Its normal Controller route SHALL be `create-deck`. Active workflow pages SHALL identify this route as `image2-only` / `whole-page-image2-v1` work and SHALL not link to a separate maintenance, compatibility, or migration reference.

#### Scenario: New whole-page deck follows the active method tree
- **WHEN** a fresh `image2-only` deck is created
- **THEN** active setup through production guidance routes through `create-deck`
- **AND** no separate maintenance reference is offered

#### Scenario: Supported whole-page run resumes
- **WHEN** a supported whole-page run is resumed
- **THEN** its framework documentation and Controller reference the same current owner
- **AND** no historical Controller is discoverable as an alternate route
