## ADDED Requirements

### Requirement: Raw state observation nests workflow inspection without replacement
The state observation protocol SHALL retain raw durable state, schema, recovery, and debug fields as independently readable output. `workflow_inspection` SHALL be an additional nested projection and SHALL NOT become a state record, cache, migration target, or substitute for raw state. Resume-card/status consumers SHALL use its primary action and observations rather than independently synthesizing mode, gate, recovery, or completion readiness.

#### Scenario: Raw state remains inspectable beside workflow projection
- **WHEN** Agent requests `state <runDir> --json` for a durable run
- **THEN** the response retains raw state/recovery fields and includes nested `workflow_inspection`
- **AND** no raw field is replaced by a derived inspection verdict

#### Scenario: Compatibility state remains observable
- **WHEN** a markerless historical run has no durable state
- **THEN** state exposes its existing compatibility/raw-state absence context with workflow inspection
- **AND** observation does not fabricate an active execution record

### Requirement: State mutation revalidates direct facts after observation
State-owned transition, gate, journal, reset, and recovery mutations SHALL continue to perform their existing direct-fact and CAS checks at write time. A workflow inspection result SHALL be consumed only as observation; it SHALL not satisfy an identity, receipt, provenance, authorization, journal, or CAS precondition.

#### Scenario: Journal changes after inspection
- **WHEN** a journal owner or state byte changes after a workflow inspection is produced
- **THEN** the subsequent state mutation revalidates the current journal and CAS facts
- **AND** it fails or follows the existing owner recovery path when they no longer match
