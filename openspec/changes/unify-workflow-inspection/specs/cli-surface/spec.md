## ADDED Requirements

### Requirement: Status and state JSON publish one shared workflow inspection
`ppt_flow status --json` and `ppt_flow state <runDir> --json` SHALL invoke the shared workflow inspection for the same resolved run/checkpoint and expose it as `workflow_inspection`. The canonical serialized nested projection SHALL be byte-equivalent between the two JSON outputs for that checkpoint. Each command SHALL retain its existing compatible outer fields and command-specific context; neither command SHALL independently derive or override the workflow primary action.

#### Scenario: JSON observation surfaces agree
- **WHEN** Agent runs `status --json` and `state <runDir> --json` without a fact change between calls
- **THEN** both outputs contain byte-equivalent `workflow_inspection` objects
- **AND** status/artifact summary and raw state remain available in their respective outer outputs

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
