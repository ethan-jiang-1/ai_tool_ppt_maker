## ADDED Requirements

### Requirement: Artifact-view success covers a valid successor with matching predecessor bindings

For a current supported Pure or Framed run whose Style Master owner establishes
a validated pending successor, `image2 artifact-view <run-dir>` SHALL return
its normal provider-free success projection even when the predecessor
selection's style-intent, style-context, and candidate-generation-profile
hashes match the successor plan. The result SHALL retain the ordinary exact
run/workflow, short navigation-index, and short navigation-root fields and
include the owner-issued pending-successor `next_action`.

The command SHALL not translate that valid guide into a stale raw-plan failure,
initialize a provider, authorize or submit work, select a candidate, or alter
source, state, receipt, raw, attempt, or review authority. Invalid owner facts
remain subject to their existing bounded hard-stop and no navigation write.
When the effective selection has advanced through the exact current successor
plan's promotion, the command SHALL continue through the ordinary
accepted-selection path and its existing prerequisites; it SHALL not emit a
pending-successor action or a predecessor-selection conflict.

#### Scenario: Direct artifact-view reports a matching-binding successor normally

- **WHEN** an Agent invokes `image2 artifact-view` for a current successor
  whose predecessor identity validates but whose Style Master input hashes
  match the successor
- **THEN** the command exits successfully with the normal short navigation
  fields and the owner-issued successor action
- **AND** it does not emit a raw-source-receipt diagnostic or perform provider
  work

#### Scenario: A promoted successor does not remain a pending CLI conflict

- **WHEN** the effective selection is the exact accepted promotion of the
  current successor plan
- **THEN** `image2 artifact-view` uses its ordinary accepted-selection path
  and any existing prerequisite outcome from that path
- **AND** it does not emit a pending-successor action or a
  `style_master_selection_conflict` diagnostic
