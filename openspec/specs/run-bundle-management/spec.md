# Run Bundle Management Specification

## Purpose

Define creation, validation, current topology, and bounded historical handling for
run bundles.
## Requirements
### Requirement: Init and bundle validation seed only Page Authority topology
Fresh initialization and normal bundle validation SHALL create and validate only v2 Page Authority source, state, and topology. A non-v2 source/state pair remains byte-preserving under read-only classification and SHALL not be mutated, initialized, or adopted by normal validation.

#### Scenario: A fresh bundle is initialized
- **WHEN** init creates a new run bundle
- **THEN** its canonical source marker and production-mode record are v2 Page Authority values

#### Scenario: A non-v2 bundle is checked
- **WHEN** normal validation reads a non-v2 source/state identity
- **THEN** it returns the unsupported-protocol hard-stop without writing bundle state or artifacts

### Requirement: Current bundle ownership is explicit

Bundle validation SHALL identify source, state, raw, review, final, assembly, and
notes ownership through Page Authority paths. `_generated/` remains rebuildable
derived data and is never hand-edited source.

#### Scenario: A current version is checked

- **WHEN** a Page Authority run is validated
- **THEN** it receives current ownership diagnostics without selecting historical artifacts

### Requirement: Init and validation distinguish target workflow authoring from CURRENT compatibility
After retirement, fresh run-bundle initialization SHALL seed only the v2 Page Authority topology and a source-authoring path that requires an explicit `framed` or `pure` workflow selection before the source becomes a valid provider-work route. Init and validation SHALL bind a selected target source to `page-authority-image2-v2` and `image2-page-authority-v2`; they SHALL not infer the workflow from deck type or create a mixed default.

Bundle validation SHALL reject every non-v2 pair with the owner-issued identity or unsupported-protocol hard-stop. It SHALL NOT migrate, rewrite, or use production deck artifacts as evidence.

#### Scenario: Fresh target authoring waits for one explicit choice
- **WHEN** a new run bundle has not yet recorded `framed` or `pure` in its target source
- **THEN** validation identifies the workflow-selection prerequisite before provider work
- **AND** it does not seed a per-slide authority default or a state mode by guesswork

#### Scenario: Non-v2 pair is not reinitialized
- **WHEN** bundle validation reads a non-v2 source/state pair
- **THEN** it preserves source bytes and reports its bounded unsupported-protocol action
- **AND** it does not create v2 evidence or a compatibility route

### Requirement: A clean current Page Authority version becomes an authoring draft

When `ppt_flow new-version` copies an exact current Page Authority version whose
canonical source has an explicitly selected `framed` or `pure` workflow, the
new visible version SHALL become a usable `create-deck` authoring draft after
the source-only copy succeeds, whether the selected source has an active or
completed Controller execution. The target SHALL retain the normal clean-version
filesystem contract: it contains only copied source/overrides and clean derived
directories, and it SHALL not inherit production, Style Master, raw, review,
final, or delivery facts from the source version.

#### Scenario: A selected current Page Authority version is copied

- **WHEN** `ppt_flow new-version <current-page-authority-run> --name vN` completes for a source with an explicitly selected workflow
- **THEN** `vN` is a current `create-deck` draft for that workflow and provider-free validation can resolve its legal draft route
- **AND** its production mode, source receipt, Style Master selection, raw plan/grant/acceptance, final manifest, and delivery receipt remain absent

#### Scenario: A completed selected Page Authority version is copied

- **WHEN** `ppt_flow new-version <completed-current-page-authority-run> --name vN` selects a source with matching current-v2 marker and durable mode
- **THEN** `vN` receives the same clean authoring-draft handoff as an active source
- **AND** no continuation, evidence, or paid-work authority is inferred from the completed source

#### Scenario: A non-current or non-Page-Authority source is copied

- **WHEN** `ppt_flow new-version` copies a source that is not an exact current Page Authority route
- **THEN** it retains the existing source-only clean-copy behavior
- **AND** it does not infer a Page Authority target execution or production facts
