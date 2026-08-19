## 1. Cursor projection

- [x] 1.1 [node-specification] In `recordTargetProgressiveCheckpointCliHandoff`, project onto a checkpoint behind the cursor instead of `TARGET_PROGRESSIVE_CHECKPOINT_NODE_CONFLICT`. Keep identity, unknown-node, missing-current-node, and equal-cursor `current` fences. Done when a fixture whose cursor is `generate-target-pure-pilot` and whose owner checkpoint node is `recommend-target-pure-pilot` writes `current_node` to that checkpoint.
- [x] 1.2 [node-specification] On rewind, change only `current_node` and the checkpoint `in_progress` record. Do not complete later `in_progress` nodes, do not un-complete other completed nodes, do not delete attempt/grant/receipt bytes. Done when a rewind fixture keeps later generate `in_progress` and existing attempt files byte-identical.
- [x] 1.3 [node-specification] Keep unknown checkpoint fail-closed with no writes. Done when the existing unknown-node fixture still throws `TARGET_PROGRESSIVE_CHECKPOINT_NODE_UNKNOWN`.

## 2. Image2 partial-effect

- [x] 2.1 [cli-surface] After a successful image2 owner mutation, catch cursor-projection failure separately from owner failure. Report `commandResult` `state: "partial-effect"` with owner `effect` and failed projection `partial`. Envelope category is not `internal`; next is not `report_internal`. Done when a fixture that persists `image2 plan` then fails the handoff is not classified as `internal`.
- [x] 2.2 [cli-surface] Do not call the progressive checkpoint handoff from Style Master or from `state` / `status` / inspection. Done when those paths still have no handoff call.

## 3. Tests and validation

- [x] 3.1 Replace the backward-handoff conflict assertion in `tests/shared/workflow/test_progressive_checkpoint_cursor.mjs` with a rewind success case, and keep unknown/mismatch fail-closed cases.
- [x] 3.2 Add a focused image2 process or seam test that a persisted owner mutation plus failed projection is `partial-effect`.
- [x] 3.3 Run `openspec validate --strict --change project-cursor-to-owner-checkpoint` and the touched suites. Done when both pass.
- [x] 3.4 Confirm no v1-reset, capability-vector, `known_failure` exit-code, or Style Master handoff work landed in this change.
