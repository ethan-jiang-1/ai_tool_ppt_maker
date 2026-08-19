## Why

After the first `paginate apply` on v1, later structural publication is locked
to vNext even when the Deck never received provider grant, submit, attempt,
fee, unknown commit, raw, final, PPTX, or delivery. Deck Authors still treat
that v1 as an unpublished draft. Cursor rewind does not restore the
initial-draft publication path because source receipt and target evidence remain.

This is an enhancement. Current `slide-identity-and-ordering` deliberately
routes non-seed structure to vNext. The missing piece is an owner-issued
abandon/reseed of an unproduced unique v1.

## What Changes

- Direct CLI `ppt_flow reset-unproduced-v1 <run-dir> --confirm-abandon` is the
  only public mutation. It requires an exact `3_versions/v1` run-dir, the
  confirm flag, a resolvable current v1 identity, and that v1 is the deck's
  only published version.
- Admission refuses, with zero writes, when any irreversible record exists:
  grant, submit, attempt, fee, unknown commit, Style Master grant or generated
  candidate media, raw/final PNG, PPTX, or delivery. Append-mostly iteration
  history is never deleted.
- Success restores the exact current deck-type seed source and the same
  unbound authoring draft State that `init` writes, wipes rebuildable v1
  `_generated` / `_scratch` derived bytes, and clears only mutable v1 scope
  heads. After that, the existing initial-draft `paginate apply` path may
  materialize a new page source as `target_run_version: v1`.
- The success receipt states that no irreversible provider or decision record
  was deleted. Irreversible evidence remains a hard-stop that keeps every
  byte and still requires vNext.

Not in this change: cursor rewind, Image2 transport capability, in-place
structure edits of a produced v1, Agent hand-edits of source/state, binding a
new page source inside the reset command, or `_scratch/` PNG as delivery.

## Capabilities

### New Capabilities

- 无。

### Modified Capabilities

- `cli-surface`: register `reset-unproduced-v1` in the closed inventory with
  confirm-flag usage, success/no-op/gate diagnostics, and a structured owner
  result.
- `slide-identity-and-ordering`: owner reset restores the initialized v1
  initial-draft exception so a later confirmed page plan may materialize in
  place as v1; irreversible evidence still forces vNext.
- `run-bundle-management`: unique-v1 admission, exact seed restore, and wipe of
  rebuildable v1 derived trees without deleting append-mostly iteration history.

## Impact

- Harness source: new command module, inventory/contracts/architecture
  registration, owner reset in run-bundle, tests. `COMMANDS.md` gets one
  Agent-routing request for this unpublished-v1 abandon.
- Control owner: JS owns admission and mutation. MD Controller graph is
  unchanged; State returns to the existing authoring-draft node used by init.
- Run-bundle contract: new mutation, no automatic migration. Unique v1 only.
- Policies: `agent-assistance-and-control.md` (one owner action; Agent does
  not hand-edit). `simple-reliable-control.md` (reuse init seed + authoring
  draft + existing paginate apply; do not invent a second in-place edit path).
