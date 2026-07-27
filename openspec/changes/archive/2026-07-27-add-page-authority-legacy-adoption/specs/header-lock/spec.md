## RENAMED Requirements

- FROM: `### Requirement: Header-Lock is a legacy whole-page stage`
- TO: `### Requirement: Header-Lock is a historical whole-page stage`

## MODIFIED Requirements

### Requirement: Header-Lock is a historical whole-page stage
Header-Lock SHALL remain a historical whole-page Stage 3 implementation, not a normal production entry.
An exact recognized legacy source/state pair SHALL return the adoption-required diagnostic before
Header-Lock reads source beyond protocol identity, inspects generated artifacts, initializes a renderer,
or publishes `header_locked/`. A current Page Authority pair SHALL remain rejected before any
Header-Lock call; Page Authority publishes only through `finalizePage(...)`.

#### Scenario: Recognized legacy run cannot continue through Header-Lock
- **WHEN** a recognized legacy run requests a Header-Lock build or refresh path
- **THEN** the route returns `LEGACY_PROTOCOL_ADOPTION_REQUIRED` before renderer or provider work
- **AND** it names only the provider-free adoption action
