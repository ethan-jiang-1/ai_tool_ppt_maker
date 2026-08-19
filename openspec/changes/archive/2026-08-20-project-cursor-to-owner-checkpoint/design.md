## Context

See proposal.md for why. Constraints that shape HOW:

- `recordTargetProgressiveCheckpointCliHandoff` already writes a forward
  projection: complete prior absent/`in_progress` nodes, set the checkpoint
  `in_progress`, append history. The fail-closed line is
  `currentIndex > checkpointIndex` → `TARGET_PROGRESSIVE_CHECKPOINT_NODE_CONFLICT`.
  Removing that comparison is the rewind. The existing write loop only touches
  indices `< checkpointIndex`, so later `in_progress` nodes are already left
  alone. Completed priors are already skipped (`status === "in_progress"` or
  missing). Setting the checkpoint `in_progress` is the one allowed
  un-complete (the checkpoint itself).
- `image2.mjs` runs owner mutation, then `inspectWorkflow`, then
  `advanceProgressiveControllerCheckpoint` inside the same `try`. A handoff
  throw is fed to `targetPageImageFailure`, which maps unknown codes to
  `internal` / `report_internal`. `build` and `new-version` already separate a
  persisted owner effect from a later failed effect as `commandResult`
  `state: "partial-effect"` plus an artifact envelope, not `report_internal`.
- The rewind target is `progressiveControllerCheckpoint(inspection).controller_node`.
  Inspection action `plan_progressive_pilot` maps to
  `recommend-target-<workflow>-pilot`, not `plan-target-<workflow>-progressive-raw`.
- Observation (`state`, `status`, inspection) still must not call the handoff.
  Eligibility already keys off `current_node === checkpoint.controller_node`;
  later leftover `in_progress` records do not block that predicate.
- A current_node missing from the active Controller list still fails closed
  (`currentIndex < 0`). That is not rewind.
- Handoff stays image2-only. Style Master has its own authorize CLI handoff.

Policies: `agent-assistance-and-control.md` (one owner action; Agent does not
hand-edit state). `simple-reliable-control.md` (reuse the existing handoff; do
not add a second cursor writer).

## Goals / Non-Goals

**Goals:**

- Durable cursor equals the image2 owner checkpoint after a successful mutation
  whose cursor projection succeeds, including rewind.
- Persisted owner writes are never reclassified as `internal` because the
  cursor projection failed.

**Non-Goals:**

- Style Master cursor handoff, v1 reset, transport capability, changing
  `known_failure` recording, item-level Pilot recovery, deleting later node
  records on rewind.

## Decisions

1. **Rewind is the same handoff, not a second API.** Drop the
   `currentIndex > checkpointIndex` fail-closed. Keep identity, unknown-node,
   missing-current-node (`currentIndex < 0`), and observation-never-writes
   fences. Alternative: a dedicated rewind function — rejected; that would be a
   second cursor writer.

2. **Rewind mutates only cursor + checkpoint `in_progress`.** Do not complete
   later nodes. Do not un-complete completed nodes other than the checkpoint.
   Do not delete attempts/grants/receipts. History still gets one typed
   transition event (existing append). Alternative: reset later nodes to
   `pending` — rejected; that would fabricate a lifecycle the owner did not
   issue.

3. **Owner-persisted + projection-fail = existing `partial-effect`.** Follow
   `build` / `new-version`: `commandResult({ state: "partial-effect", effect,
   partial })` plus an artifact-category envelope whose next is
   `repair_prerequisite` naming the owner-issued inspection action. Do not
   invent a new result class. Do not use `report_internal`. Alternative: return
   0 and hide the projection failure — rejected; the two effects must stay
   distinguishable.

4. **Scope stays image2 mutation.** Do not call this handoff from Style Master
   or observation.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| Later `in_progress` generate records confuse eligibility | Eligibility already requires `current_node ===` owner checkpoint node |
| Partial-effect looks like the plan was not written | Separate `effect` (owner records) from `partial` (cursor projection) |
| Unknown checkpoint accidentally treated as rewind | Keep `TARGET_PROGRESSIVE_CHECKPOINT_NODE_UNKNOWN` fail-closed before any write |

## Migration Plan

No run-bundle migration. Existing attempt/grant/receipt bytes stay. Stuck
cursors recover on the next successful image2 mutation that projects the
owner checkpoint.

## Open Questions

None. v1 reset and transport capability remain named sibling changes.
