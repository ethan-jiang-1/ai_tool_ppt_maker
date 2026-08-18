# Node Specification Specification (delta)

## ADDED Requirements

### Requirement: Progressive checkpoint CLI handoff advances the durable cursor

`state.mjs` SHALL expose a closed mutation API
`recordTargetProgressiveCheckpointCliHandoff` that advances the durable
`current_node` to the Controller node matching the raw owner's current
checkpoint action, and SHALL be invoked only from the successful image2
mutation command path — never from observation (`state`, `status`, inspection,
or projection refresh).

The handoff SHALL:

- require the exact current run/workflow identity (run version, source epoch,
  selected workflow) before any write, failing closed otherwise;
- accept a checkpoint node that SHALL be a declared active node of the current
  `create-deck` Controller for the selected workflow;
- advance the cursor only monotonically forward in the Controller's active node
  order — a checkpoint at or before the current cursor is an idempotent
  `current` result and a checkpoint behind the cursor fails closed;
- record the checkpoint node as `in_progress` (with `waiting_for` naming the
  human decision when the owner action requires a human); completion SHALL come
  only from the node's own exit evidence (for example the authorize CLI handoff
  completing the authorize node) and SHALL NOT be fabricated by this handoff;
- mark every active Controller node strictly before the checkpoint whose record
  is absent or `in_progress` as `completed` (a projection of owner facts — the
  checkpoint's owner inspection proves each prior node's purpose is satisfied)
  so no upstream node remains an eligible candidate; `completed`/`skipped`
  records SHALL stay untouched, and no node SHALL receive per-node evidence;
- preserve all existing node records and fabricate no per-node evidence;
- append one typed history event naming the checkpoint transition.

The durable cursor SHALL therefore equal the owner checkpoint node after every
successful image2 mutation operation, so `state --json`, `status`, the task
projection eligibility, and node eligibility expose one identical resume
position.

#### Scenario: Pilot review success lands the cursor on the review node

- **WHEN** `image2 pilot-review` succeeds for an exact partial Pilot batch whose
  owner next action is `accept_progressive_pilot`
- **THEN** the durable `current_node` becomes `review-target-<workflow>-pilot`
  with the node `in_progress` and `waiting_for` naming the human visual decision
- **AND** `state --json` and `status` report that same node, upstream authoring
  nodes are no longer eligible candidates, and the task projection is no longer
  `not-applicable`

#### Scenario: Pilot acceptance advances the cursor to expansion planning

- **WHEN** `image2 pilot-accept` succeeds with `decision: proceed` and the owner
  next action is `plan_progressive_expansion`
- **THEN** the durable `current_node` becomes
  `plan-target-<workflow>-expansion`
- **AND** it does not return to content authoring

#### Scenario: Observation never advances the cursor

- **WHEN** `state --json` or `status` observes a run whose durable cursor lags
  the owner checkpoint
- **THEN** observation reports the lag without writing state, history, or
  metadata
- **AND** the cursor advances only on the next successful image2 mutation
  transition

### Requirement: Lock contention does not mutate the durable cursor

A `progressive_raw_store_locked` failure SHALL leave the durable cursor, node
records, and history unchanged. The failure envelope's next action SHALL be the
only recovery authority, and the envelope SHALL NOT imply that a state write
occurred.

#### Scenario: Failed mutation preserves state bytes

- **WHEN** an image2 mutation fails with `progressive_raw_store_locked`
- **THEN** `_state/state.yaml`, history, and node records are byte-identical to
  their pre-invocation state
- **AND** the CLI emits the typed three-branch envelope without a mutation
