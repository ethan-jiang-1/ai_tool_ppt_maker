## Why

The 2026-08-19 progressive checkpoint handoff made durable `current_node` a
monotonic ratchet: a checkpoint behind the cursor fails closed as
`TARGET_PROGRESSIVE_CHECKPOINT_NODE_CONFLICT`. After a terminal all-`known_failure`
Pilot, or after a source rewrite whose `image2 plan` already persisted a new
plan, the raw owner checkpoint is `plan_progressive_pilot` while the cursor is
still `generate-target-<workflow>-pilot`. The owner write succeeded; the CLI then
wraps the projection throw as `internal` / `report_internal`. Agent recovery has
two stories: inspection names one owner action, State names a conflicting node.

This is a spec amendment, not a restore. Current `node-specification` requires
fail-closed on rewind. Maintainer 2026-08-20 locked cursor as a projection of
the image2 owner checkpoint (forward or back) without deleting history.

## What Changes

- `recordTargetProgressiveCheckpointCliHandoff` projects `current_node` onto the
  owner checkpoint node, including when that node is behind the cursor.
- A successful write still records the checkpoint as `in_progress` (with
  `waiting_for` when the owner action requires a human). Forward still completes
  prior absent/`in_progress` nodes as today's projection. Rewind does not mark
  later `in_progress` nodes completed, does not un-complete any completed node
  other than the checkpoint itself, and does not delete attempt / grant /
  receipt / history bytes.
- Unknown or undeclared checkpoint nodes still fail closed.
- The handoff remains image2-mutation-only. Observation still does not write.
  This change does not extend the handoff to Style Master.
- When the image2 owner mutation has already persisted and the subsequent cursor
  projection fails, the command reports existing `partial-effect` (owner effect
  and failed projection as separate fields). It SHALL NOT emit `internal` /
  `report_internal` or imply the owner write rolled back.

Not in this change: CLI Next/draft/`--check` restore (archived
`restore-draft-and-cli-projections`), unproduced v1 reset
(`reset-unproduced-v1`), Image2 transport capability
(`bind-image2-transport-capability-vector`), changing `known_failure` semantics,
Pilot item-level recovery (BUG-087 suspended).

## Capabilities

### New Capabilities

- 无。

### Modified Capabilities

- `node-specification`: the progressive checkpoint CLI handoff is a bidirectional
  projection of the owner checkpoint, not a monotonic fail-closed ratchet.
- `cli-surface`: image2 owner success plus failed cursor projection uses the
  existing `partial-effect` owner-result class already required of mutating
  commands.

## Impact

- Harness source: `ppt_maker_harness/scripts/shared/state/state.mjs`
  (`recordTargetProgressiveCheckpointCliHandoff`),
  `scripts/shared/cli/command_support.mjs`
  (`advanceProgressiveControllerCheckpoint`),
  `scripts/shared/cli/commands/image2.mjs` (separate owner effect from projection
  failure). Tests in `tests/shared/workflow/test_progressive_checkpoint_cursor.mjs`
  and the image2 command path.
- Control owner: JS owns the cursor projection. MD Controller node graph is
  unchanged. Agent still follows the owner-issued inspection action and does
  not hand-edit `_state`.
- Run-bundle contract: `compatible`. Cursor projection rules change; attempt /
  grant / receipt / history bytes are not rewritten by rewind.
- Policies: `openspec/policies/agent-assistance-and-control.md` — one owner
  action; Agent does not repair State by hand.
