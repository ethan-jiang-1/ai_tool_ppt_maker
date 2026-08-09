## Context

See [proposal.md](proposal.md) for the motivation. The current artifact-view
adapter already asks the Style Master owner for a pending-successor projection
before inspecting raw work. That owner validates the current scope/head,
current plan inputs, effective predecessor selection, replay, candidate media,
and provenance. Its eligibility additionally requires a difference in one of
three Style Master bindings between predecessor and successor.

That last condition is not equivalent to successor existence. A Page Image
source receipt can become stale after a non-visual literal changes while a
valid successor is current, and all three Style Master bindings can remain
equal. The owner then returns `null`, after which the adapter reaches stale raw
evidence and cannot write the required short human navigation path.

## Goals / Non-Goals

**Goals:**

- Let the existing owner projection identify every unpromoted valid successor
  that is bound to the current effective predecessor selection.
- Preserve the existing adapter short-circuit and short physical navigation
  tree for those successor candidates.
- Keep invalid successor evidence, raw readiness, selection promotion, and
  provider authorization on their established hard-stop or confirm paths.

**Non-Goals:**

- No new lifecycle record, state field, CLI command, recovery route, retry,
  provider request, or migration.
- No display of unverified candidate media or a predecessor artifact as current
  successor evidence.
- No change to raw-plan validity, acceptance, delivery, or the human visual
  decision required to promote a candidate.

## Decisions

### Use immutable successor identity and promotion state, not input-hash divergence

The Style Master owner will retain every existing direct validation: current
scope/head, current inputs, current effective predecessor selection, exact
selection replay, candidate provenance, and media chain. Once a current plan
has a non-null predecessor identity that equals the effective predecessor, it
is pending successor work until promotion changes the effective selection. The
projection will not require one of the three Style Master input hashes to have
changed.

The owner already owns every fact needed to make this distinction. It will
return the pending projection while the effective selection equals the plan's
immutable predecessor. When the current plan's validated `proceed` promotion
has advanced the effective selection to that plan, it will return `null` so the
ordinary accepted-selection branch resumes. Any other selection mismatch stays
on the existing conflict hard-stop. Moving this distinction into the adapter
would duplicate lifecycle logic and still leave local-candidate drift
unresolved. Treating matching hashes as ordinary raw authority before
promotion is rejected because it hides a valid candidate that the human must
review before the successor can become selected.

### Reuse the existing artifact-view short-circuit and writer

The `image2` adapter will consume the broadened owner projection exactly as it
does for the existing stale-binding successor case. It writes the existing
derived short navigation tree from owner-provided verified locators, labels
candidates pending, reports unavailable downstream work, and returns the
owner's `next_action`. It does not resolve the raw-only selected Style Master
reference or read raw lifecycle facts on that path.

No new navigation schema, selector, or display-reference capability is needed.
No adapter or CLI control-path modification is anticipated: the short-copy
writer remains the sole renderer and validates its confined input before
atomically replacing the tree. Focused integration and process coverage will
hold that existing boundary while the owner eligibility predicate changes.

### Preserve gate and control ownership

This is a `guide` under `human-centered-gates.md`: rendering already verified
candidate evidence is provider-free and does not change authority. Integrity,
selection, authorization, and recovery remain hard-stops owned by their
existing evaluators. There is no confirm, waiver, or override.

The Style Master owner remains the direct source of successor facts; the
adapter is a non-authoritative derived-view writer; the CLI only emits their
bounded success or existing failure. This follows
`agent-assistance-and-control.md` and removes the redundant hash-difference
predicate instead of adding a controller or fallback. The direct loop becomes
`current successor records -> owner projection -> navigation tree -> existing
review action`; invalid direct facts retain their one current owner action.

### Verification

- Owner unit coverage will create a valid successor whose three Style Master
  bindings match its exact predecessor, prove verified media projects without
  lifecycle/state writes, and prove its exact promotion returns no pending
  projection. Existing stale-input and mismatched-predecessor tests continue
  to prove fail-closed behavior.
- Artifact-view integration will make a non-visual source edit stale the Page
  Image receipt while preserving the visual projection, then prove the pending
  path writes only short copies, reports downstream artifacts unavailable, and
  does not inspect stale raw authority.
- Direct CLI coverage will prove normal `artifact-view` success and
  `next_action` for that same stale-receipt fixture, with no provider or state
  side effect.
- No real-provider E2E is needed: the changed path is provider-free, and the
  focused owner/adapter/CLI tests exercise its authority boundaries without
  production deck data.

## Risks / Trade-offs

- [A completed successor is mistaken for pending] -> Require the current
  effective selection to equal the plan's immutable predecessor identity;
  an exact current-plan promotion returns no pending projection, while every
  other mismatch retains the existing selection-conflict boundary.
- [Matching hashes conceal invalid inputs] -> Preserve the current-plan input
  validation before projection and cover stale inputs explicitly.
- [Adapter resumes raw inspection] -> Keep the existing projection-first
  branch and test that raw-reader calls are absent on the matching-binding
  successor path.
- [A navigation path becomes lifecycle authority] -> Reuse the existing
  short-copy writer and non-selector rules; add no records or commands.

## Migration Plan

No migration is required. Existing valid successor plans become viewable on
their next provider-free `artifact-view` rebuild. Rollback restores the prior
guide behavior only; immutable plan, grant, attempt, candidate, selection, and
raw records retain their current meanings.
