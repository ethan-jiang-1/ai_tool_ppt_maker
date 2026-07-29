## ADDED Requirements

### Requirement: Inspection projects TARGET workflow prerequisites marker-first

Inspection SHALL remain observation-only and resolve a target run from the
exact v2 source/state pair before projecting workflow status. For a valid
target pair it SHALL report the selected `framed` or `pure` workflow, the
direct receipt/evidence prerequisite, and one owner-issued nearest action. It
SHALL NOT heal state, infer a workflow from artifacts, or calculate a second
pass/fail authority from Markdown or a compatibility summary.

CURRENT v1 mixed runs SHALL continue to project their bounded compatibility
route. A partial, hybrid, or mismatched v1/v2 pair SHALL project the owning
repair hard-stop rather than either workflow.

#### Scenario: Target Framed raw debt has one inspection action

- **WHEN** a valid target Framed source/state pair has no current accepted raw evidence
- **THEN** inspection reports workflow `framed` and the raw-plan/authorization prerequisite from its owner
- **AND** it does not suggest a Pure path or a per-slide authority repair

#### Scenario: Hybrid pair is observed without coercion

- **WHEN** a v2 source is paired with a CURRENT v1 state mode
- **THEN** inspection reports the marker/state repair hard-stop without mutation
- **AND** it does not classify the run as CURRENT compatibility or TARGET workflow work
