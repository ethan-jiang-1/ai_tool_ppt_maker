## MODIFIED Requirements

### Requirement: Run-scoped CLI validates the current Page Image Workflow identity

Every run-scoped CLI operation SHALL first verify the exact local Harness
binding through the existing locator evaluator, then require the exact current
schema-declared Page Image source marker and matching state-owned
`production_identity` record. That record SHALL expose only `workflow` and
`source_epoch`; direct CLI status and state projections SHALL expose those
identity facts without a `production_mode`, fixed mode literal, or compatibility
projection. Every direct CLI failure diagnostic SHALL use the inventory-declared
`schema: pptmaker-cli-diagnostic`; producer and consumer validation SHALL
reject an absent, numeric-version, or undeclared diagnostic schema. A missing,
malformed, source-disagreeing, or undeclared contract value remains an
owner-issued hard failure before any read that depends on production authority,
mutation, or provider work. The CLI SHALL not scan for, decode, convert, or
export a known historical contract.

#### Scenario: CLI receives an undeclared source/state marker

- **WHEN** a run-scoped operation encounters a source marker or identity record
  absent from the current serialization inventory
- **THEN** it returns the existing owner-issued current-contract failure before
  dependent work
- **AND** it does not create a compatibility inspection or migration path

#### Scenario: An inactive production request is fenced before work

- **WHEN** a CLI request names a run other than the active current binding
- **THEN** it retains the existing non-writing execution-version mismatch failure
- **AND** it does not retarget the request or inspect historical artifacts

#### Scenario: An undeclared production request is fenced before work

- **WHEN** a CLI request supplies an undeclared production contract
- **THEN** it fails exact-current validation before dependent work
- **AND** it does not classify the value, create a migration, or initialize a provider

#### Scenario: Status projects a current identity

- **WHEN** a status or state command observes a valid current Framed or Pure run
- **THEN** its machine-readable projection identifies the selected workflow and
  current source epoch through `production_identity`
- **AND** it does not emit a fixed singleton mode field
