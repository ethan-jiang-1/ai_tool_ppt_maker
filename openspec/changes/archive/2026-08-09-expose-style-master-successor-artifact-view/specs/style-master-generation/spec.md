## ADDED Requirements

### Requirement: Pending successor candidates are projected only from current verified owner facts

For an exact current `page-image-workflow-v1` scope whose accepted Style
Master selection is stale for raw authority, the Style Master owner SHALL
provide one provider-free, read-only pending-successor candidate projection
only when its current scope head and plan validate, the plan inputs are not
stale, the historical predecessor selection validates through the existing
exact selection replay, and that replay's selection SHA-256 exactly matches
the plan's `previous_selection_sha256`. The owner SHALL establish staleness
from the current plan's style-intent, style-context, or generation-profile
binding relative to that predecessor selection; an ordinary current accepted
selection or an input-stale plan is not a pending-successor projection.

The projection SHALL return its exact run/workflow scope, current plan
identity, and the existing owner-issued `next_action`. It SHALL expose an
available local-existing candidate only after revalidating its confined
immutable bytes, media facts, and local provenance against the current plan.
It SHALL expose an available generated candidate only after revalidating its
current succeeded grant-bound attempt, provider-request binding, confined
immutable bytes, media facts, and generated provenance. An available candidate
SHALL carry only its stable ID, verified media/provenance identity and facts,
and an absolute confined local locator. Every generated slot that is planned,
claimed, submitted, failed, or unknown SHALL be represented by its stable ID
and direct lifecycle state without a locator.

The projection SHALL create no selection, review decision, grant, attempt,
provider request, Page Image source/raw record, receipt, or compatibility
payload. It SHALL not make a predecessor selection current or use candidate
filenames, directory order, copied media, or a prior human view as evidence.
An invalid scope, head, plan, predecessor replay, candidate byte, media, or
provenance fact SHALL retain the existing Style Master hard-stop instead of
returning a partial projection.

#### Scenario: A current stale-selection successor exposes only verified candidate media

- **WHEN** a valid current successor plan binds its stale predecessor exactly,
  contains one verified local-existing candidate, one succeeded generated
  candidate, and generated slots that are planned and submitted
- **THEN** the owner projection returns confined locators only for the
  local-existing and succeeded candidates, labels the other slots by stable ID
  and lifecycle state without locators, and returns its existing next action
- **AND** it does not select a candidate, authorize provider work, or write
  any lifecycle, state, raw, or compatibility record

#### Scenario: Invalid pending-successor evidence fails closed

- **WHEN** a pending successor's predecessor replay, succeeded candidate
  bytes, media, or provenance does not validate
- **THEN** the owner returns its existing bounded hard-stop before projecting
  that candidate list
- **AND** it does not substitute the stale selection, a filename, or a partial
  view as current evidence
