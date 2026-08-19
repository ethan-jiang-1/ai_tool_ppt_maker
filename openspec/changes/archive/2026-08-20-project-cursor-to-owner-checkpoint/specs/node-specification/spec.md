## MODIFIED Requirements

### Requirement: Progressive checkpoint CLI handoff advances the durable cursor

`state.mjs` SHALL expose a closed mutation API
`recordTargetProgressiveCheckpointCliHandoff` that projects the durable
`current_node` to the Controller node matching the raw owner's current
checkpoint action, and SHALL be invoked only from the successful image2
mutation command path — never from observation (`state`, `status`, inspection,
or projection refresh).

The handoff SHALL:

- require the exact current run/workflow identity (run version, source epoch,
  selected workflow) before any write, failing closed otherwise;
- accept a checkpoint node that SHALL be a declared active node of the current
  `create-deck` Controller for the selected workflow;
- project the cursor onto that checkpoint in either direction of the
  Controller's active node order — a checkpoint equal to the current cursor is
  an idempotent `current` result; a checkpoint ahead of the cursor remains a
  forward write; a checkpoint behind the cursor is a rewind write, not a
  fail-closed conflict;
- record the checkpoint node as `in_progress` (with `waiting_for` naming the
  human decision when the owner action requires a human); completion SHALL come
  only from the node's own exit evidence (for example the authorize CLI handoff
  completing the authorize node) and SHALL NOT be fabricated by this handoff;
- on a forward write, mark every active Controller node strictly before the
  checkpoint whose record is absent or `in_progress` as `completed` (a
  projection of owner facts — the checkpoint's owner inspection proves each
  prior node's purpose is satisfied) so no upstream node remains an eligible
  candidate; `completed`/`skipped` records SHALL stay untouched, and no node
  SHALL receive per-node evidence;
- on a rewind write, change only `current_node` and the checkpoint node's
  `in_progress` record (plus `waiting_for` when required); it SHALL NOT mark
  later `in_progress` nodes `completed`, SHALL NOT un-complete any completed
  node other than the checkpoint itself, and SHALL NOT delete attempt, grant,
  receipt, or history bytes;
- preserve all existing node records and fabricate no per-node evidence;
- append one typed history event naming the checkpoint transition;
- fail closed on an unknown or undeclared checkpoint node.

The durable cursor SHALL therefore equal the owner checkpoint node after every
successful image2 mutation whose cursor projection succeeds, so `state --json`,
`status`, the task projection eligibility, and node eligibility expose one
identical resume position. A persisted owner mutation whose projection then
fails is the `cli-surface` `partial-effect` case and SHALL leave cursor, node,
and history bytes unchanged.

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
- **AND** the cursor is projected only on the next successful image2 mutation
  transition

#### Scenario: Terminal Pilot rewinds the cursor onto successor planning

- **WHEN** a successful image2 mutation leaves the owner checkpoint behind the
  durable cursor (a terminal all-`known_failure` Pilot, or a persisted
  successor `image2 plan` after source rewrite)
- **THEN** the handoff projects `current_node` onto that checkpoint node and
  records it `in_progress`
- **AND** later `in_progress` node records, completed nodes other than the
  checkpoint, and attempt / grant / receipt bytes remain

#### Scenario: Unknown checkpoint still fails closed

- **WHEN** the handoff is asked to project onto a node that is not a declared
  active `create-deck` node for the selected workflow
- **THEN** it fails closed without writing cursor, node records, or history
- **AND** it does not treat that unknown node as a rewind
