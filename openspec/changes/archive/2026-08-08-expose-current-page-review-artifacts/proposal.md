## Why

The current human artifact reference view can omit real current Complete Page
Review evidence until a person has already accepted it. This was observed on a
current Pure run: the raw owner prepared a review for all materialized pages,
but `image2 artifact-view` reported Page Artifacts and Complete Page Review as
unavailable. The Agent therefore cannot lawfully give the human the locators
needed to make the existing `proceed` or `repair` decision.

The view already has a canonical owner for this fact and is intended to expose
current review evidence. The gap must be repaired before the real review can
continue, without creating a second review surface or bypassing the existing
human confirmation.

## What Changes

- Rebuild the human artifact reference view from the progressive raw owner's
  current complete-review projection as well as accepted evidence.
- List each current review page in full-plan order with its stable `slide_id`,
  typed display reference, absolute read-only locator, artifact type, and
  Complete Page Review inspection purpose.
- Preserve the existing accepted/final/delivery projections and mark a page
  category unavailable only when the corresponding owner-established current
  evidence is genuinely absent.
- Add focused coverage for Pure and Framed current Complete Page Review views,
  including non-authority and no-mutation guarantees.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `image-generation`: make the canonical human artifact view expose
  owner-established current Complete Page Review pages before the human records
  `proceed` or `repair`.

## Impact

- Affected Harness code: the existing artifact-view projection/reader and its
  focused tests under `ppt_maker_harness/` and `tests/`.
- Control owner: existing JS owners; the Agent and MD Controller only consume
  the derived view and keep the existing human `confirm` gate.
- Run-bundle contract: compatible. The change rebuilds an existing derived
  `_generated` reference view; it adds no source migration, state field,
  receipt, grant, provider request, CLI argument, or success-schema change.
- Existing generated pages are not edited or adopted. The view remains
  provider-free, secret-safe, non-authoritative, and read-only.
