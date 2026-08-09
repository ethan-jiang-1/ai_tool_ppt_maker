## Why

`image2 artifact-view` must be the only human-facing path for inspecting a
pending Style Master candidate. A valid successor can coexist with a stale Page
Image source receipt or canonical local-candidate drift even when the
predecessor selection's style-intent, style-context, and generation-profile
hashes still match. In that legal state the current implementation falls
through to stale raw-plan inspection, so it cannot publish the short
navigation path needed to review the generated successor candidate.

This is happening on a real current Pure run: the successor candidate is
verified and ready for review, but its required provider-free human view is
blocked. The repair must preserve all selection, authorization, and raw-work
boundaries while exposing that candidate through the existing view owner.

## What Changes

- Treat every valid unpromoted current Style Master successor plan with an
  exact predecessor selection and non-stale plan inputs as a pending-successor
  artifact projection, regardless of whether the predecessor's three Style
  Master input hashes differ from the successor plan. Return an exactly
  promoted successor to the ordinary accepted-selection path rather than
  reporting its predecessor as a conflict.
- Keep the existing owner revalidation of predecessor replay, candidate bytes,
  media, provenance, grants, and attempts; expose only verified candidate media
  through the existing short physical human-navigation tree.
- Make `image2 artifact-view` short-circuit to that projection before raw
  source/plan inspection, report the existing owner `next_action`, and retain
  the normal bounded hard-stop for invalid successor facts.
- Add focused owner, artifact-view, and direct CLI regression coverage for a
  valid successor with matching Style Master bindings while a non-visual source
  edit leaves the Page Image source receipt stale.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `style-master-generation`: expand the read-only pending-successor projection
  to cover every validated unpromoted current successor plan, not only those
  whose predecessor's Style Master input hashes differ, and distinguish exact
  promotion from a competing-selection conflict.
- `image-generation`: project that owner-validated successor through the
  provider-free human artifact view before any stale raw authority is read.
- `cli-surface`: return the existing normal artifact-view success projection
  and owner-issued successor action for this valid successor state.

## Impact

- Affected Harness implementation:
  `ppt_maker_harness/scripts/shared/image2/style_master_plan.mjs`. The
  existing projection boundary in `ppt_maker_harness/scripts/ppt_flow.mjs` is
  exercised by regression coverage but needs no new control path.
- Affected verification: focused Style Master owner and human artifact-view
  tests under `tests/`; no real-provider E2E is required.
- Control owner: the Style Master JS owner remains the source of successor
  facts; the `image2` adapter remains the deterministic projection writer; the
  human still owns cost authorization and visual selection.
- Run-bundle contract: compatible. The change only enables rebuilding the
  existing derived navigation tree for a valid pending successor. It creates
  no state field, source receipt, raw plan, provider request, authorization,
  selection, or deck migration.
- Gate posture: this is a provider-free `guide`. Invalid scope, predecessor,
  media, provenance, authorization, and raw-evidence conditions remain their
  existing hard-stops; no confirmation or override is added.
