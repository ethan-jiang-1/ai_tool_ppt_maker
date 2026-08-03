## ADDED Requirements

### Requirement: Page Authority new-version success includes draft activation

For an exact current Page Authority source with an explicit selected workflow,
whether its Controller execution is active or inactive, `ppt_flow new-version`
SHALL report success only after both the clean filesystem copy and state-owned
target-draft activation complete. Its successful output SHALL identify the
clean target and its selected authoring workflow without exposing raw prompt
text, credentials, provider response data, authorization, or quality
acceptance. The command SHALL make no provider request.

#### Scenario: New-version activates a clean Page Authority target

- **WHEN** a caller creates a new version from an exact current selected-workflow Page Authority run
- **THEN** stdout reports the created clean version and its ready authoring draft
- **AND** a following provider-free validation reaches the draft route rather than failing with `MODE_MISSING`

#### Scenario: New-version activates from a completed Page Authority source

- **WHEN** a caller creates a new version from an inactive exact current-v2 selected-workflow Page Authority run
- **THEN** the command uses the same state-owned activation path
- **AND** it does not treat the absence of an active Controller as a reason to omit draft activation

#### Scenario: Draft activation does not complete

- **WHEN** the clean copy succeeds but target-draft activation fails
- **THEN** `ppt_flow new-version` exits nonzero with the normal secret-safe failure envelope
- **AND** it does not print a successful creation receipt or submit provider work
