## Why

After a human records `repair` on a current Complete Page Review, the
progressive raw owner can incorrectly return the historical prepared review as
current and request another review decision. The prepared evidence record is
intentionally immutable and still has `decision: null`; its later decision
record is linked through the validated `decided_by_prepared` relation. The
owner must honor that relation everywhere it selects a current review so a
repair deterministically returns to the existing raw-rebuild path.

This surfaced during the three-page Pure Pilot. It blocks the authorized
source-edit -> raw-rebuild -> same Complete Page Review recovery loop while
leaving final and delivery correctly unavailable.

## What Changes

- Define one relation-aware selector for an undecided current progressive
  Complete Page Review: a prepared review is current only when it has no
  validated decision referencing it.
- Reuse that selector for current lifecycle actions and evidence, unaccepted
  review preparation, review acceptance, and the existing read-only
  current-review reader; retain the separate decision-history handoff for
  audit without letting it select current work.
- After a valid `repair` decision, expose no current review digest, decline to
  replay or re-accept the decided prepared evidence, and return the existing
  `rebuild_progressive_raw_work` repair action.
- Add focused regression coverage for repair routing and historical prepared
  evidence exclusion, retaining the existing immutable-record lineage.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `image-generation`: make all progressive Complete Page Review currentness
  decisions respect the validated prepared-to-decision relationship and route
  a human `repair` decision to raw rebuild.

## Impact

- Affected Harness code: the progressive raw owner and its focused tests.
- Control owner: the existing progressive raw owner remains the sole evaluator
  of plan, materialization, review, and decision lineage.
- Run-bundle contract: compatible. No command, CLI payload, grant, provider
  call, state schema, evidence schema, or human gate changes.
- Recovery: repair stays an explicit, auditable human decision followed by the
  existing deterministic rebuild action; historical evidence remains intact.
