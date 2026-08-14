## ADDED Requirements

### Requirement: CLI projects one current production identity contract

For an exact current run, direct CLI status and state projections SHALL expose
the selected workflow and state-owned production identity only as
`production_identity` with `workflow` and `source_epoch`. They SHALL NOT emit
`production_mode`, a fixed mode literal, or a compatibility projection. A
missing, malformed, or source-disagreeing identity record SHALL retain the
existing owner-issued integrity failure before the CLI performs dependent work.

#### Scenario: Status projects a current identity

- **WHEN** a status or state command observes a valid current Framed or Pure run
- **THEN** its machine-readable projection identifies the selected workflow and
  current source epoch through `production_identity`
- **AND** it does not emit a fixed singleton mode field

#### Scenario: An invalid identity cannot reach dependent CLI work

- **WHEN** a run-scoped CLI command observes a missing, malformed, or
  source-disagreeing production identity record
- **THEN** it returns the existing owner-issued integrity failure before
  dependent mutation, artifact reading, or provider work
- **AND** it does not accept `production_mode` as an alternate input
