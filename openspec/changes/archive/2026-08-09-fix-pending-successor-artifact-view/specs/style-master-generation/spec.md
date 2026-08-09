## ADDED Requirements

### Requirement: Pending successor projection does not require predecessor input-hash divergence

For an exact current `page-image-workflow-v1` scope with a current Style
Master successor plan, the Style Master owner SHALL expose its provider-free
pending-successor candidate projection when all of the following direct facts
validate: the current plan head, non-stale current plan inputs, an exact
non-null `previous_selection_sha256`, the current effective predecessor
selection, and its existing exact replay. The effective predecessor selection
and replay SHALL both match that immutable predecessor identity.

The owner SHALL determine that this is pending successor work from those
current immutable lifecycle facts. It SHALL NOT require the successor plan's
style-intent, style-context, or candidate-generation-profile hash to differ
from the predecessor selection. A stale Page Image source receipt does not by
itself change those Style Master bindings, and a valid unpromoted successor can
therefore remain a current successor projection while they remain equal.

The projection SHALL retain its existing verified-media, provenance,
grant/attempt, stable-ID, locator, and no-mutation rules. Invalid scope, plan,
predecessor, replay, input, media, or provenance facts SHALL retain the
existing bounded Style Master hard-stop rather than exposing a partial view.

When the effective selection has advanced through the exact current successor
plan's validated `proceed` promotion, the owner SHALL return no
pending-successor projection so the ordinary accepted-selection path can apply
its existing prerequisites. If the effective selection matches neither the
plan's immutable predecessor identity nor that exact promoted successor, the
owner SHALL retain the existing selection-conflict hard-stop.

#### Scenario: A stale source receipt does not hide a matching-binding successor

- **WHEN** a Page Image source receipt is stale after a non-visual source
  literal changes, a current successor binds the exact effective predecessor,
  its current plan inputs validate, and the predecessor's style-intent,
  style-context, and generation-profile hashes equal the successor's
- **THEN** the owner returns the current successor's verified candidate
  projection and existing `next_action`
- **AND** it does not create a raw plan, authorization, provider request,
  review decision, selection, receipt, or state mutation

#### Scenario: Matching Style Master bindings do not weaken successor validation

- **WHEN** a current successor with matching predecessor Style Master bindings
  has stale inputs or an invalid predecessor replay
- **THEN** the owner returns its existing bounded hard-stop before exposing
  candidate locators
- **AND** it does not substitute the predecessor selection or a filename as
  current successor evidence

#### Scenario: An exactly promoted successor is no longer pending

- **WHEN** the current effective selection is the exact `proceed` promotion of
  the current successor plan
- **THEN** the pending-successor projection returns no pending candidate list
  and the ordinary accepted-selection path remains available
- **AND** it does not report the plan's immutable predecessor as a competing
  selection conflict
