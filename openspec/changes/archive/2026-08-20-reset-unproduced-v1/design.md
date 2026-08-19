## Context

See proposal.md for why. Constraints that shape HOW:

- `initialDraftEligibility()` in `narrative_page_plan.mjs` is
  `sourceText === pageImageInitialDraftSource(deckType) && !hasInitialEvidence(state, "v1") && !existsSync(generatedRoot)`.
  Reset must restore all three. Clearing identity alone leaves non-seed source
  and still forces `publication: next-version`.
- `createTargetAuthoringState` plus init's `continuation_target_version = v1`,
  pending gates, completed `checkpoint-intake`, and
  `current_node = author-target-narrative-sources` is the existing unbound
  draft. Reuse it; do not invent a second State shape.
- Irreversible provider facts live outside rebuildable `_generated`:
  `1_upstream_raw_material/page-image-workflow-iterations` and
  `page-image-style-master-iterations` are append-mostly. Reset must not delete
  those files. If any grant/attempt/materialization/generated-candidate-media
  exists, refuse. Mutable `scopes/v1/.../head.json` pointers may be removed
  only after admission passes.
- Deck `_state` is shared. A published `v2+` means resetting v1 would destroy
  another version's lease. Admission requires the only `3_versions/vN` to be
  `v1`.
- Closed CLI inventory: `COMMAND_CONTRACTS`, `PPT_FLOW_COMMAND_INVENTORY`,
  `ppt_flow.mjs` `.command()` order, `PUBLIC_SHARED_INTERFACES`,
  `source-test-ownership.json`, and the process-test command-file map must all
  gain the new command together.

Policies: `agent-assistance-and-control.md`, `simple-reliable-control.md`.

## Goals / Non-Goals

**Goals:**

- Unproduced unique v1 can be owner-reset to the exact init draft, then
  `paginate apply` again as `target_run_version: v1`.
- Any irreversible record refuses with zero writes and still requires vNext.

**Non-Goals:**

- Binding a new page source in the same command, in-place edits of produced
  v1, deleting append-mostly iteration history, resetting when v2 exists,
  Image2 transport, cursor rewind, Style Master handoff changes.

## Decisions

1. **Command is `reset-unproduced-v1 <run-dir> --confirm-abandon`.** Missing
   flag is `usage`. Non-v1 run-dir is `usage` naming exact `v1`. Alternative:
   reuse `new-version` — rejected; that publishes vNext rather than keeping v1.

2. **Success restores exact seed + init authoring draft, then existing paginate.**
   Do not add a second in-place structural publication path for non-seed
   source. Alternative: atomically bind the new candidate in reset — rejected;
   that would skip the confirmed paginate exact-plan path.

3. **Admission is a closed irreversible scan before any write.** Refuse on:
   other published versions; identity missing or `inspectProductionIdentity`
   not ok; any `page_image_raw_provider_authorization` / Style Master grant
   record; non-null provider/raw/final/delivery digests in v1 target evidence;
   any attempt/grant/materialization/pilot-evidence/accepted-evidence file or
   incomplete staging under the progressive or Style Master iteration stores;
   any raw/final PNG or PPTX under v1 `_generated`. Rebuildable local source
   receipt, target-evidence identity row, and `_generated` derived JSON are
   not irreversible. Alternative: treat any `_generated` presence as
   irreversible — rejected; that is exactly the unproduced-materialized case.

4. **Refuse keeps every byte.** Compare a pre-admission snapshot in tests.
   Success may delete rebuildable v1 `_generated` (keep README) and `_scratch`
   (keep README), rewrite seed source, replace State via CAS
   `expectedStateSha`, clear v1 scope heads, and append one history event
   `unproduced_v1_reset`. Do not delete `plans/` history.

5. **Owner lives in run-bundle, CLI is the public envelope.**
   `resetUnproducedV1Draft` performs admission + mutation. The command module
   binds the run-dir, requires the flag, and emits `commandResult` plus
   `GATE_BLOCKED` / `usage` envelopes. Next on irreversible evidence is
   `repair_prerequisite` naming `new-version` / paginate vNext, not hand-edit.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| Crash between source rewrite and State | Retry is allowed: identity still present and unproduced; command is idempotent toward the same draft |
| Hidden attempt under an unreferenced plan | Scan the whole iteration `plans/` tree, not only the current scope head |
| Scope-head clear looks like history deletion | Receipt lists cleared heads and states iteration plan bytes were retained |
| Inventory drift | Same registration set as any new ppt_flow command |

## Migration Plan

No migration. Decks with irreversible v1 evidence keep today's vNext path.
Old unique unproduced v1 becomes resettable only after this command exists.

## Open Questions

None. Command name, confirm flag, seed restore, and irreversible hard-stop
were locked by the four-change plan and BUG-081.
