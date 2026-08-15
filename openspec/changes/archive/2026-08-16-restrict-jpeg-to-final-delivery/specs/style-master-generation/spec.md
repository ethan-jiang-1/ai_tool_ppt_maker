## MODIFIED Requirements

### Requirement: Current Style Master lifecycle retains immutable plans and exact cost control

Style Master planning SHALL remain provider-free and publish one immutable
candidate plan only after current draft, materialized-source, or validated
stale-binding recovery candidate facts, canonical style intent/context,
generation profile, selected workflow, and prior selection identity validate
together. Each exact version/workflow scope SHALL have one CAS-protected
lifecycle head naming the current plan generation and predecessor; status,
cost consumption, and next action are derived from the plan, grant, attempt,
decision, and selection records rather than persisted as a competing head
projection. A nonterminal plan is returned idempotently; a successor requires
a terminal current plan, including one made terminal by canonical input drift
when no submitted outcome is unresolved, and cannot be chosen by directory
order, timestamp, or caller nonce.

For generated candidates, an explicit exact-plan authorization SHALL create or
exact-match one immutable grant scoped only to its ordered generated slots.
Generation SHALL revalidate current compiled brief/profile inputs, CAS-persist
one `claimed` attempt before provider initialization, bind its request identity
when it becomes `submitted`, and permit exactly one terminal success, known
failure, or uncertainty outcome. Every candidate newly admitted to a current
plan, and every selection newly promoted from one, SHALL be a CRC-valid PNG
with positive native dimensions, immutable bytes, and matching provenance. A
local-existing candidate is a confined immutable snapshot of the
layout-resolved optional `style_master.png` source only, never file-presence
acceptance. Unknown submitted work remains cost-preserving and requires the
owner-issued exact abandonment path before a successor; it is never an
implicit retry.

Historical immutable plans, provenance, and selections that record JPEG media
SHALL remain readable only to preserve their existing attribution and
predecessor bindings. They SHALL not satisfy current selection, Controller
readiness, raw-plan authority, or a new local-existing candidate admission, and
the owner SHALL not transcode, rewrite, or promote them as PNG.

A stale-binding recovery successor SHALL bind only the new validated candidate
facts and its immutable predecessor. It SHALL not inherit a prior plan's
grant, attempt, review decision, effective selection, or acceptance as current.
Existing canonical local-candidate input MAY be snapshotted only through the
same confined PNG-byte validation and immutable local-candidate provenance
required for any new plan; filename presence or historical candidate evidence
alone cannot provide that input. Planning that successor SHALL not publish Page
Image source, raw-plan, authorization, evidence, or provider-work records.

Staged and unreferenced plans, candidate files, grants, attempts, or provenance
are not current authority. The lifecycle preserves the shared bounded
credential, endpoint, deadline, async-poll, secret-safe known-failure, and
uncertainty rules without creating a page raw plan, Page Image receipt,
provider-page evidence, alternate provider route, a presentation-JPEG
projection, or a second cost authority.

#### Scenario: A grant cannot authorize a sibling or successor candidate plan

- **WHEN** an exact current Style Master plan receives a generated-candidate
  authorization
- **THEN** its immutable grant can authorize only that plan's named generated
  slots and their disclosed maximum submissions
- **AND** it cannot authorize a page request, local candidate, retry, sibling
  workflow, or successor plan

#### Scenario: An uncertain Style Master submission remains non-retryable

- **WHEN** a submitted current candidate has no provable terminal provider
  outcome
- **THEN** the lifecycle returns only its exact abandonment or recovery action
- **AND** it does not consume another slot, overwrite the attempt, or submit a
  replacement candidate automatically

#### Scenario: A stale selection receives a separate successor plan

- **WHEN** visual/source drift makes an accepted Style Master selection stale
  and derives a terminal prior plan with no unresolved submitted candidate
- **THEN** replacement planning publishes an immutable successor bound to the
  current validated candidate and predecessor identity
- **AND** it does not reuse prior authorization, review, selection, or Page
  Image raw authority, and any local-existing candidate is revalidated from
  canonical source as a new immutable snapshot

#### Scenario: A local PNG candidate is accepted without a JPEG projection

- **WHEN** the layout-resolved optional `style_master.png` is a CRC-valid PNG
  with positive dimensions
- **THEN** planning can publish its local-existing immutable candidate using
  those exact PNG bytes
- **AND** it does not create or require a `style_master.jpg` file

#### Scenario: JPEG bytes at the current local source path stop before planning

- **WHEN** the layout-resolved `style_master.png` local Style Master input is
  JPEG media
- **THEN** planning hard-stops before a plan, grant, attempt, selection, raw
  plan, or provider call
- **AND** it returns the one deck-source refresh action without decoding,
  converting, or adopting the historical media

#### Scenario: Historical JPEG lineage remains history only

- **WHEN** an existing immutable Style Master plan or selection records a JPEG
  candidate from before this change
- **THEN** the owner preserves that record as attributable history and
  predecessor evidence while requiring a newly selected PNG before raw work
- **AND** it does not alter the historical bytes, infer a PNG candidate, or
  promote the JPEG as current

### Requirement: Current Style Master review and selection have one authority

Review SHALL expose only complete current attributable candidates for the exact
scope-head plan. Before recording a decision or promotion, the owner SHALL
revalidate the plan/head, PNG candidate bytes and provenance, grant/attempt
chain where generated, visual/source context, workflow, and previous selection
identity. `proceed` names exactly one eligible candidate; `repair` and
`redirect` preserve the current selection and return their owner checkpoint.
No decision authorizes Page Image raw work, Pilot, complete-page acceptance, or
a workflow switch.

On current `proceed`, one immutable review decision and one compare-and-swap
promotion SHALL publish the single effective-selection/acceptance record bound
to the candidate's exact PNG bytes, provenance, plan, selection scope, current
context/profile, and prior selection. Exact replay returns that same selection;
a stale or cross-scope promotion cannot overwrite it. Promotion SHALL complete
at that existing selection record and SHALL neither create nor require a
layout-resolved JPEG projection. The accepted immutable PNG remains available
to raw planning and derived human navigation without broadening selection
authority.

#### Scenario: A preplaced candidate cannot be promoted from its filename

- **WHEN** a candidate image exists without the exact current plan, provenance,
  and terminal-attempt chain required for its kind
- **THEN** review and promotion stop before a decision or selection CAS
- **AND** they do not infer local-candidate status or copy the bytes into a
  replacement selection

#### Scenario: Selection promotion remains scoped and idempotent

- **WHEN** the same reviewed current candidate is replayed after its selection
  CAS succeeds
- **THEN** the owner returns the original selection/acceptance record for that
  exact version/workflow scope
- **AND** it does not mint a second decision, selection, timestamp, provider
  request, cross-version selection, or JPEG projection

## REMOVED Requirements

### Requirement: Style Master presentation JPEG projection supports valid decoded PNG layouts

**Reason**: A Style Master JPEG is not final delivery media and is not required
for planning, review, navigation, or raw-page production. Keeping the derived
projection created a second non-authoritative media path whose failure could
interrupt otherwise valid selection replay.

**Migration**: Remove the projection writer, replay diagnostic, and
`style_master.jpg` current path. Use the accepted immutable PNG candidate
through the existing review/navigation projection paths. Retain historical
JPEG candidate records unchanged for audit and predecessor binding; refresh a
deck-owned `style_master.png` and create a new lifecycle selection before
resuming raw work.
