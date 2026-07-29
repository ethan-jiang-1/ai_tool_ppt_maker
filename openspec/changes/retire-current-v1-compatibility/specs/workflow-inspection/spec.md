## REMOVED Requirements

### Requirement: Inspection projects Page Authority direct prerequisites
**Reason**: This requirement projects the retired v1 evidence lifecycle as current work.
**Migration**: Inspection projects only v2 prerequisites; retired input receives the bounded migration/export hard-stop.

### Requirement: Inspection projects one legacy adoption action before legacy workflow evaluation
**Reason**: Legacy adoption is removed from the active controller and inspection graph.
**Migration**: A necessary migration is initiated explicitly outside normal observation and has no implicit inspection continuation.

### Requirement: Inspection projects current Page Authority or bounded legacy action
**Reason**: The dual current/legacy inspection model preserves a second protocol graph.
**Migration**: Workflow inspection has one v2 projection plus a non-mutating retired-input hard-stop.

## MODIFIED Requirements

### Requirement: Inspection is observation-only and not an authority
Inspection SHALL perform zero state, history, metadata, generated-artifact, receipt, authorization, or source writes; it makes zero network/provider calls and shall not cache a verdict, heal state, migrate schema, or recover a journal. A repairable current direct fact is reported with its owning repair action. Mutation owners revalidate their direct source/CAS/authorization/receipt facts immediately before a write or submit and never treat an earlier inspection as authorization or freshness proof. A retired, absent, or ambiguous protocol remains byte-preserving and produces one bounded owner-issued migration/export or identity action, not a compatibility projection.

Every controller-facing observation, including ppt_flow status and ordinary ppt_flow state projection, SHALL consume the same read-only inspection checkpoint or a direct read-only evaluator already used by that checkpoint. It SHALL NOT call a protocol receipt initializer, receipt writer, lifecycle operation, provider-facing adapter, or migration materializer merely to calculate a resume-card condition. An unavailable direct fact SHALL remain unavailable and produce the inspection owner's nearest legal action.

#### Scenario: Inspection observes a repairable current state without healing
- **WHEN** inspection encounters a schema-5 state shape the owner could safely repair
- **THEN** it reports the owner-provided action
- **AND** no state, history, or metadata file changes

#### Scenario: Inspection observes retired input
- **WHEN** identity is retired, absent, or ambiguous
- **THEN** it returns the bounded migration/export or identity action without a workflow route
- **AND** it does not create, replace, or refresh a receipt

### Requirement: Inspection projects TARGET workflow prerequisites marker-first
Inspection SHALL remain observation-only and resolve a target run from the exact v2 source/state pair before projecting workflow status. For a valid target pair it SHALL report the selected `framed` or `pure` workflow, the direct receipt/evidence prerequisite, and one owner-issued nearest action. It SHALL NOT heal state, infer a workflow from artifacts, or calculate a second pass/fail authority from Markdown or a summary.

A partial, hybrid, mismatched, or retired pair SHALL project the owning identity or migration/export hard-stop rather than either workflow. All selected-target controller/status observation SHALL use this marker-first projection without importing or invoking a retired receipt-writing adapter. A v2 receipt is a direct target fact; its presence SHALL NOT cause any other receipt to be created, refreshed, or consulted as a substitute.

#### Scenario: Target Framed raw debt has one inspection action
- **WHEN** a valid target Framed source/state pair has no current accepted raw evidence
- **THEN** inspection reports workflow `framed` and the raw-plan/authorization prerequisite from its owner
- **AND** it does not suggest a Pure path or a per-slide authority repair

#### Scenario: Retired pair is observed without coercion
- **WHEN** a retired source/state pair is read by status or ordinary state observation
- **THEN** inspection returns the bounded migration/export action without mutation
- **AND** it does not classify the run as a current workflow or compatibility work
