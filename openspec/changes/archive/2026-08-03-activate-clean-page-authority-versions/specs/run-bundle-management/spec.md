## ADDED Requirements

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
