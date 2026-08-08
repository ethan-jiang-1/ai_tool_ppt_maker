## Context

See [proposal.md](proposal.md) for the trigger. `image2 artifact-view` already
obtains the selected workflow's canonical candidate and a validated Style
Master scope, then asks the Style Master owner for the current lifecycle
projection. Its next step assumes every projected selection is current raw
authority and calls the raw-only accepted-selection reader. A successor plan
correctly retains the predecessor selection as audit history, so that reader
rejects it before the rebuildable view can be written.

The existing human-view renderer accepts only owner-validated artifact entries
and unavailable descriptions. It deliberately cannot read lifecycle records or
discover currentness. The required change therefore belongs in the existing
cross-owner adapter and Style Master owner, not in the renderer, controller, or
deck data.

## Goals / Non-Goals

**Goals:**

- Rebuild a bounded human view from a current Style Master successor plan after
  source/visual drift, including only candidate bytes with existing immutable
  media/provenance validation.
- Return the Style Master owner's existing single `next_action` only on the
  pending-successor `artifact-view` success projection, while retaining the
  existing ordinary accepted-selection success shape.
- Leave the normal accepted-selection and raw-review view paths unchanged.

**Non-Goals:**

- No new controller node, view schema, state field, authorization command,
  candidate selection, raw-plan recovery, provider retry, or deck migration.
- No display of a generated candidate from a planned, claimed, submitted,
  failed, unknown, missing, or unverifiable media record.
- No use of a historical selection, compatibility JPEG, filename, or prior
  artifact view as current selection or raw authority.

## Decisions

### Reuse Style Master ownership for successor candidate facts

The Style Master owner will expose a read-only current-plan candidate-artifact
projection. It reuses the scope/head/plan records already used by inspection,
requires `input_stale` to be false, validates the predecessor through the
existing historical selection replay, and requires that replay's selection
digest to exactly equal `plan.previous_selection_sha256`. It then compares the
plan's current style intent/context/profile bindings with that predecessor
selection to establish stale raw authority without calling the raw-only
accepted-selection reader.

The projection revalidates local-existing candidates through their confined
immutable snapshot and provenance, and succeeded generated candidates through
their grant-bound attempt, provider-request, confined bytes, media, and
provenance chain. It returns stable candidate identity, verified media facts,
and a confined local locator only for those available candidates. Each planned,
claimed, submitted, failed, or unknown generated slot is returned without a
locator and with its direct lifecycle state. It also carries the existing owner
`next_action`, not a new control action. A malformed required direct record,
mismatched predecessor, or invalid available media is an existing Style Master
hard-stop; it cannot become a partial success projection.

The artifact-view adapter consumes that projection directly. It does not
reconstruct candidate paths, infer currentness from a directory, or call the
raw-only accepted-selection reader for a pending successor. The alternative of
loosening `resolveAcceptedStyleMasterReference` is rejected: that API is raw
authority and must continue to reject a stale selection. Reusing only
`inspectStyleMasterCandidates` is also insufficient because its lifecycle
summary does not prove individual candidate media bytes. The adapter invokes
the derived-view writer only after the complete owner projection validates, so
an owner hard-stop leaves any existing view bytes untouched.

### Short-circuit the view before raw inspection while selection is pending

When the owner projection establishes a valid successor plan whose predecessor
selection is stale for raw authority, the adapter writes a Style Master-only
view and gives each listed candidate a pending-not-accepted inspection purpose.
It lists each generated slot without verified media as unavailable by stable ID
and lifecycle state, then marks provider input, raw/review, final media, and
delivery unavailable. It stops before reading the raw owner, stored raw plan,
or raw-only accepted-selection reader. After the successor selection is
accepted, the existing accepted-selection branch and raw-view path resume
unchanged.

This is a provider-free `guide`: a valid plan and verified candidate bytes are
safe to display. Unsupported protocol, invalid source/scope/head/plan,
unverified candidate bytes, identity mismatch, authorization, and raw
readiness remain hard-stops with their existing owner-issued actions. There is
no `confirm` or waiver because displaying a view is not acceptance, authority,
or a reversible risk continuation.

### Keep one bounded CLI handoff

`ppt_flow` remains a projection. For the pending-successor view it returns the
ordinary view locator and exact run/workflow scope plus a `next_action` equal
to the Style Master owner's existing action. Its normal accepted-selection
success shape remains unchanged. It does not return a plan hash or selection,
convert that guide into a second diagnostic format, or add a direct
authorization shortcut. A failed owner projection keeps its bounded
owner-issued diagnostic and must not be mapped to an internal error. The human
still makes the existing exact nonzero cost authorization decision; the Agent
may mechanically rebuild the view and execute only already-legal provider-free
operations.

This is the shortest control loop: immutable plan/candidate records -> one
Style Master projection -> artifact view -> existing authorization checkpoint.
It removes the stale-selection special case that currently produces an opaque
internal failure, adds no durable state or fallback chain, and leaves the raw
owner as the sole authority for raw lifecycle readiness.

### Apply the existing gate and control policies

[`human-centered-gates.md`](../../policies/human-centered-gates.md) classifies
the pending-successor view as a `guide`: the safe display rebuild can proceed,
but identity, lineage, media integrity, authorization, and recovery boundaries
remain hard-stops with their existing legal repair actions. There is no
`confirm`, waiver, or acceptance record.

[`agent-assistance-and-control.md`](../../policies/agent-assistance-and-control.md)
assigns the direct facts and evaluator to the Style Master owner, the derived
view to the `image2` adapter, and mechanical provider-free invocation to the
Agent. [`simple-reliable-control.md`](../../policies/simple-reliable-control.md)
is satisfied by replacing one opaque stale-selection failure with one owner
projection and its existing next action; the path adds no persistent field,
validator, controller node, retry, fallback, or competing authority.

## Risks / Trade-offs

- [A successor view accidentally treats prior selection as current] -> Keep
  accepted raw authority in its existing reader, require historical replay and
  exact predecessor identity, label candidates pending, and test that pending
  successor output has no raw/final/delivery availability.
- [A filename is displayed without proof] -> Reuse the Style Master owner's
  local/succeeded candidate validation before passing a locator to the
  renderer; every other lifecycle state has no locator.
- [A stale or corrupt scope is hidden as a view] -> Require the existing
  canonical candidate/scope, lifecycle-head, current-input, and historical
  predecessor validation before the successor branch; preserve its hard-stop
  and one current action.
- [A view becomes a cost/selection control surface] -> Preserve existing
  display-reference non-selector rules and assert that view rebuild leaves
  state, grants, attempts, decisions, selections, raw records, and provider
  calls unchanged.

## Migration Plan

No migration is required. Existing successor plans and immutable candidate
records become viewable through their current direct facts. Rollback removes
only the new pending-successor projection; records retain their existing
meaning and the affected view returns the prior bounded failure.

## Verification Strategy

- **Owner unit coverage:** create a stale predecessor plus valid successor
  plan; prove local-existing and succeeded generated media are revalidated,
  planned/claimed/submitted/failed/unknown slots have no locator, and
  mismatched/invalid predecessor or candidate evidence fails closed without
  lifecycle or state mutation.
- **Adapter integration:** consume that owner fixture to prove pending labels,
  stable-ID unavailable entries, raw-owner short-circuiting, and a
  byte-identical preexisting artifact view after every failed projection.
- **Process CLI:** exercise `image2 artifact-view` on the same fixture and
  assert normal success with the owner `next_action`, view locator, pending
  labels, no internal envelope, and no provider or authorization side effect.
- **E2E:** no real-provider E2E is needed. This operation is deliberately
  provider-free; fixture-level owner and direct-CLI coverage exercise the
  ownership boundary more directly without using production deck data.
