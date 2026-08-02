## ADDED Requirements

### Requirement: State owns clean Page Authority target-draft activation

After a successful clean copy of an exact current Page Authority version with
an explicit selected workflow, the state owner SHALL atomically create a new
`create-deck` execution bound to the target version and one manifest-valid
selected-workflow draft-route node. The activation SHALL preserve source-version
mode and evidence records and shall only use the copied canonical source marker
to establish the target workflow. If a Controller execution is active, it SHALL
be bound to the exact selected source version. An inactive source is eligible
when its exact current-v2 source marker and durable production-mode record
agree; the caller's explicit source directory is its identity and no
continuation pointer is inferred.

The activation SHALL NOT materialize or synthesize a target production-mode
record, source receipt, target evidence, Style Master selection, raw
authorization, progressive handoff, raw acceptance, final manifest, delivery
receipt, provider grant, or provider submission. A malformed source/state
identity, target record conflict, or active Controller execution bound to
another version SHALL be a hard-stop before state mutation or provider work.

#### Scenario: A clean target receives its own active draft execution

- **WHEN** the state owner activates a clean selected-workflow target after a current source version is copied
- **THEN** the active Controller execution and `continuation_target_version` bind the exact target version
- **AND** the source version's durable mode/evidence records remain unchanged while no target lineage records are created

#### Scenario: An inactive selected source receives a clean target draft

- **WHEN** the caller explicitly selects a completed current-v2 Page Authority source whose source marker and durable mode agree
- **THEN** the state owner starts the target's `create-deck` draft without requiring a prior active source execution
- **AND** it does not infer or copy a source continuation, receipt, or target lineage record

#### Scenario: A target activation precondition fails

- **WHEN** the target source, an active source execution, or target-cleanliness check is inconsistent
- **THEN** state activation fails before writing a replacement Controller execution
- **AND** it does not reinterpret source evidence as target evidence or invoke a provider
