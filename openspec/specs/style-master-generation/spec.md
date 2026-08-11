## Purpose

Define retained visual-style primitives used by Page Image Workflow raw profiles and
readiness. They do not create a separate production route.
## Requirements
### Requirement: Style Master planning is scoped to the current Page Image Workflow

The Style Master owner SHALL resolve exactly one current
`page-image-workflow` authoring draft and matching `image2-page-workflow` state
for one version-level workflow, `framed` or `pure`. Its candidate plan,
authorization, attempt, review, effective selection, and acceptance facts
retain their existing exact workflow, visual-language, source-context,
immutability, and cost-control rules under declared stage/role values. It SHALL
not create raw-page authority or accept an undeclared historical lineage.

#### Scenario: A fresh Framed draft reaches Style Master

- **WHEN** a valid fresh authoring draft selects `framed` under
  `page-image-workflow`
- **THEN** Style Master may create and inspect its selected-workflow candidate
  lifecycle before first raw-page planning
- **AND** it does not materialize a receipt, provider request, raw plan, or
  final-page evidence

#### Scenario: A fresh Framed draft reaches Style Master without raw lineage

- **WHEN** a valid fresh current Framed draft enters Style Master
- **THEN** the owner may inspect candidate lifecycle before raw planning
- **AND** it does not create raw lineage or use an alternate contract

#### Scenario: A Style Master selection binds one replacement workflow

- **WHEN** a current candidate selection is promoted for one workflow
- **THEN** acceptance remains scoped to that workflow and source/visual context
- **AND** it cannot satisfy another workflow

#### Scenario: Visual-language drift starts one replacement Style Master scope

- **WHEN** current visual/source binding drift invalidates a selected candidate
- **THEN** the existing owner exposes a provider-free replacement scope
- **AND** it does not reuse prior current authority

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
failure, or uncertainty outcome. A successful candidate requires verified
media, immutable bytes, and matching provenance before it becomes reviewable.
Unknown submitted work remains cost-preserving and requires the owner-issued
exact abandonment path before a successor; it is never an
implicit retry. A local-existing candidate is an immutable confined snapshot
subject to the same review/selection contract, never file-presence acceptance.

A stale-binding recovery successor SHALL bind only the new validated candidate
facts and its immutable predecessor. It SHALL not inherit a prior plan's
grant, attempt, review decision, effective selection, or acceptance as current.
Existing canonical local-candidate input MAY be snapshotted only through the
same confined-byte validation and immutable local-candidate provenance required
for any new plan; filename presence or historical candidate evidence alone
cannot provide that input. Planning that successor SHALL not publish Page
Image source, raw-plan, authorization, evidence, or provider-work records.

Staged and unreferenced plans, candidate files, grants, attempts, provenance,
or compatibility payloads are not current authority. The lifecycle preserves
the shared bounded credential, endpoint, deadline, async-poll, secret-safe
known-failure, and uncertainty rules without creating a page raw plan, Page
Image receipt, provider-page evidence, alternate provider route, or a second
cost authority.

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

### Requirement: Pending successor projection does not require predecessor input-hash divergence

For an exact current `page-image-workflow` scope with a current Style Master
successor plan, the owner SHALL retain the existing provider-free
pending-successor projection when its direct immutable lifecycle facts validate.
The projection SHALL use declared current stage/role contracts and SHALL not
depend on or interpret a historical source/state marker.

#### Scenario: A current successor remains provider-free

- **WHEN** a current successor's direct immutable facts validate
- **THEN** the owner exposes the existing pending-successor action
- **AND** it does not create Page Image raw authority or read a historical lineage

#### Scenario: A stale source receipt does not hide a matching-binding successor

- **WHEN** a current successor retains valid direct binding facts after non-visual drift
- **THEN** the owner returns its existing pending successor projection
- **AND** it does not create raw authority

#### Scenario: Matching Style Master bindings do not weaken successor validation

- **WHEN** a current successor has matching prior bindings but invalid direct facts
- **THEN** the existing bounded hard-stop remains
- **AND** it does not substitute a predecessor selection

#### Scenario: An exactly promoted successor is no longer pending

- **WHEN** the effective selection is the exact current successor promotion
- **THEN** ordinary accepted-selection handling resumes
- **AND** no predecessor conflict or alternate contract is reported

### Requirement: Current Style Master review and selection have one authority

Review SHALL expose only complete current attributable candidates for the exact
scope-head plan. Before recording a decision or promotion, the owner SHALL
revalidate the plan/head, candidate bytes and provenance, grant/attempt chain
where generated, visual/source context, workflow, and previous selection
identity. `proceed` names exactly one eligible candidate; `repair` and
`redirect` preserve the current selection and return their owner checkpoint.
No decision authorizes Page Image raw work, Pilot, complete-page acceptance, or
a workflow switch.

On current `proceed`, one immutable review decision and one compare-and-swap
promotion SHALL publish the single effective-selection/acceptance record bound
to the candidate's exact bytes, provenance, plan, selection scope, current
context/profile, and prior selection. Exact replay returns that same selection;
a stale or cross-scope promotion cannot overwrite it. Any layout-resolved
`style_master.jpg` compatibility payload is a derived projection of the
accepted immutable candidate and neither creates, replaces, nor broadens
selection authority. Its projection failure cannot roll back the committed
selection or make page raw work current.

#### Scenario: A preplaced candidate cannot be promoted from its filename

- **WHEN** a candidate image or compatibility payload exists without the exact
  current plan, provenance, and terminal-attempt chain required for its kind
- **THEN** review and promotion stop before a decision or selection CAS
- **AND** they do not infer local-candidate status or copy the bytes into a
  replacement selection

#### Scenario: Selection promotion remains scoped and idempotent

- **WHEN** the same reviewed current candidate is replayed after its selection
  CAS succeeds
- **THEN** the owner returns the original selection/acceptance record for that
  exact version/workflow scope
- **AND** it does not mint a second decision, selection, timestamp, provider
  request, or cross-version compatibility selection

### Requirement: Style Master compatibility projection supports valid decoded PNG layouts

After current Style Master selection, the layout-resolved `style_master.jpg`
compatibility payload SHALL be derivable from selected CRC-valid PNG media with
an exact decoded pixel count and supported 8-bit or 16-bit grayscale,
grayscale-alpha, RGB, or RGBA layout. The payload SHALL use a derived RGBA8
pixel representation for JPEG encoding while preserving the selected candidate
bytes, dimensions, hash, provenance, review decision, and selection authority
unchanged.

A malformed, inconsistent, or unsupported decoded layout SHALL fail only the
compatibility projection with its existing owning replay/repair path. It SHALL
not reinterpret a source stride, replace selected bytes, roll back the
selection, or make Page Image raw work current.

#### Scenario: A 16-bit RGB selected Style Master has a compatibility JPEG

- **WHEN** a current selected Style Master has CRC-valid 16-bit RGB PNG bytes
  with its recorded native dimensions
- **THEN** the owner publishes a decodable same-dimension `style_master.jpg`
  compatibility payload from derived normalized pixels
- **AND** the selection continues to bind the original PNG bytes and hash

#### Scenario: An unsupported selected PNG layout does not alter selection

- **WHEN** compatibility projection encounters a decoded layout whose sample
  count or channel/depth combination cannot be represented reliably
- **THEN** the projection returns its bounded owning failure
- **AND** it does not mutate the effective selection or selected candidate

### Requirement: Style Master shares bounded invalid-JSON classification without new lifecycle state

When a current authorized Style Master provider response is fully read after
an HTTP-success result but cannot be parsed as JSON, the common provider
boundary SHALL classify its existing `invalid_json` known-failure error with
exactly one `response_shape` value: `empty`, `html_like`, or `other_non_json`.
Whitespace-only content is `empty`; leading-whitespace-prefixed, case-
insensitive `<!doctype html` or opening `<html` document markers with a
tag/doctype boundary are `html_like`; all other parse failures are
`other_non_json`. The classification SHALL use the same closed meanings as
Page Image and SHALL not contain response content or any additional
content-derived metadata.

The Style Master lifecycle SHALL consume that error through its existing
terminal known-failure path. It SHALL not persist a response-shape field,
add a CLI result field, change replay behavior, create a recovery route, or
alter authorization, submission, retry, or cost control.

#### Scenario: Style Master terminalizes a classified invalid-JSON response

- **WHEN** a current authorized Style Master provider response is HTTP-success,
  fully read, and not valid JSON
- **THEN** the common boundary supplies the existing `invalid_json`
  known-failure error with exactly one closed response shape
- **AND** the Style Master lifecycle records only its existing terminal failure
  outcome

#### Scenario: Style Master does not turn the fact into new state or control

- **WHEN** Style Master consumes a known-failure error with a response shape
- **THEN** replay, authorization, submission count, and next action retain
  their existing semantics
- **AND** no response-shape record, provider content, or alternate retry path
  is published
