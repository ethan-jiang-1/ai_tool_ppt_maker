## ADDED Requirements

### Requirement: Status and state JSON publish one shared workflow inspection
Successful `ppt_flow status --json` and `ppt_flow state <runDir> --json` reports SHALL invoke the shared workflow inspection for the same resolved run/checkpoint and expose it as `workflow_inspection` through the existing registered CLI JSON transaction/sanitizer. The projection's canonical JSON serialization, independent of outer-report pretty formatting, SHALL be byte-equivalent between the two outputs only when their checkpoints contain identical stable direct-fact identities; no cache may manufacture parity after a fact changes. Each command SHALL retain its existing compatible outer fields and command-specific context; neither command SHALL independently derive or override the workflow primary action. `state --json` SHALL additionally expose the exact parsed durable-state document used for observation as `durable_state`. It SHALL NOT duplicate raw durable-state keys at top level; top-level keys are the documented card/compatibility projection. A workflow projection SHALL NOT overwrite any field in the `durable_state` namespace or expand existing registered CLI JSON report bounds. A non-zero input, identity, or unusable-state failure SHALL retain the existing single producer-owned stderr envelope and SHALL NOT emit a partial stdout projection.

#### Scenario: JSON observation surfaces agree
- **WHEN** Agent runs `status --json` and `state <runDir> --json` without a fact change between calls
- **THEN** both outputs contain byte-equivalent `workflow_inspection` objects
- **AND** status/artifact summary and raw state remain available in their respective outer outputs

#### Scenario: Durable state field cannot be shadowed by projection
- **WHEN** a durable-state field has the same name as a compatibility or inspection-derived field
- **THEN** `state --json.durable_state` retains the exact observed durable value
- **AND** any outer compatibility projection does not replace it

#### Scenario: Raw state is not double-serialized
- **WHEN** `state --json` observes a durable state with a large version-scoped record
- **THEN** the raw record appears only under `durable_state`
- **AND** the report remains subject to the existing CLI JSON depth and byte limits

#### Scenario: Unusable state retains the error envelope
- **WHEN** status or state JSON cannot establish a usable observation context
- **THEN** it retains the existing single producer-owned stderr failure envelope
- **AND** it does not emit a partial `workflow_inspection` or fabricate `durable_state` on stdout

#### Scenario: Human-readable output adapts the shared action
- **WHEN** inspection reports a primary action for a human-readable state or status command
- **THEN** the command presents that action with its own contextual text
- **AND** it does not print a different independently computed next action

### Requirement: CLI observation does not mutate or invoke providers
Plain `status`, `status --json`, `state`, and `state --json` SHALL consume the read-only inspection path without healing state, migrating schema, recovering a journal, writing history/metadata/generated artifacts, or invoking a remote provider. A state or recovery condition requiring mutation SHALL retain the producer-owned repair/recovery diagnostic and action.

#### Scenario: Plain observation sees an interrupted journal
- **WHEN** status or state JSON observes an interrupted journal
- **THEN** it reports the owner-provided recovery primary action
- **AND** it does not claim, recover, or modify the journal
