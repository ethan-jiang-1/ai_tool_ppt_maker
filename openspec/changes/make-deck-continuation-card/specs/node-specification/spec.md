## ADDED Requirements

### Requirement: State owns inactive continuation target version

The durable state owner SHALL retain `run_version` exclusively as active-execution identity.
It SHALL retain normalized `continuation_target_version` as the non-execution exact-run
selector after a verified `RUN_BUNDLE.md` locator has identified a deck. The selector SHALL name
one existing canonical `3_versions/vN` target and SHALL be written only by existing init, exact
version-publication, and terminal-handoff owners through their atomic/CAS boundary. Plain
observation SHALL neither initialize, heal, replace, nor choose this selector. No generic state
setter or new CLI is introduced.

#### Scenario: Active execution takes precedence
- **WHEN** state has a normalized active `run_version` and a different continuation target
- **THEN** entry selects the active run
- **AND** the inactive selector cannot override execution identity

#### Scenario: Terminal bundle retains an exact target
- **WHEN** execution clears after visible vN becomes terminal
- **THEN** durable state retains `continuation_target_version: vN`
- **AND** verified locator entry can inspect that exact run without a latest-version guess

#### Scenario: Invalid target is a non-writing guide
- **WHEN** the target is missing, malformed, or no longer visible
- **THEN** entry requests an explicit run path after root verification
- **AND** state/status observation does not repair or choose another version
