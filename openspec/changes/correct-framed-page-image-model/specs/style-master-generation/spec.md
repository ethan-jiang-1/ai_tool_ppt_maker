## ADDED Requirements

### Requirement: Style Master planning is scoped to the current Page Image Workflow

The Style Master owner SHALL resolve exactly one `page-image-workflow-v1`
authoring draft or exact source/state pair with the matching
`image2-page-workflow-v1` state and one version-level workflow, `framed` or
`pure`. Its candidate plan, authorization, attempt, review, effective
selection, and acceptance facts SHALL bind that workflow together with the
current visual-language selection and source context. A fresh authoring draft
MAY reach Style Master work before its first Page Image Workflow receipt is
materialized, but it SHALL never create a raw page plan, Page Image receipt,
or provider-page authority as a side effect.

Candidate composition SHALL use the common Page Image visual semantics. It
SHALL NOT turn provider-visible page literals, the Framed local header overlay,
or a text-free-page rule into Style Master content authority. Candidate history
and promotion retain one immutable, CAS-protected lifecycle per exact
version/workflow scope; only an accepted current selection can satisfy the
page-production Style Master prerequisite.

#### Scenario: A fresh Framed draft reaches Style Master without raw lineage

- **WHEN** a valid fresh authoring draft selects `framed` under
  `page-image-workflow-v1`
- **THEN** Style Master may create and inspect its selected-workflow candidate
  lifecycle before first raw-page planning
- **AND** it does not materialize a page receipt, provider request, raw plan,
  or final-page evidence

#### Scenario: A Style Master selection binds one replacement workflow

- **WHEN** a candidate selection is promoted for a current Pure scope
- **THEN** its acceptance record binds that exact Pure source/visual scope
- **AND** it cannot satisfy Framed planning or a different version

### Requirement: Current Style Master lifecycle retains immutable plans and exact cost control

Style Master planning SHALL remain provider-free and publish one immutable
candidate plan only after current draft or materialized-source facts, canonical
style intent/context, generation profile, selected workflow, and prior
selection identity validate together. Each exact version/workflow scope SHALL
have one CAS-protected lifecycle head naming the current plan generation and
predecessor; status, cost consumption, and next action are derived from the
plan, grant, attempt, decision, and selection records rather than persisted as
a competing head projection. A nonterminal plan is returned idempotently; a
successor requires a terminal current plan and cannot be chosen by directory
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

### Requirement: Style Master rejects retired Page Authority lineage

Before candidate planning, authorization, generation, review, promotion, or
readiness projection, the Style Master owner SHALL reject a
`page-authority-image2-v2` source, `image2-page-authority-v2` state, or any
v2 candidate/effective-selection evidence as unsupported input. It SHALL
preserve supplied bytes and SHALL NOT adopt, translate, reissue, or reuse a
v2 candidate, plan, grant, attempt, review, or selected style as current
Page Image Workflow evidence.

#### Scenario: A v2 selected style cannot satisfy current readiness

- **WHEN** current Page Image Workflow planning encounters a v2 Style Master
  acceptance record or candidate history
- **THEN** it returns the `unsupported-protocol/export` hard-stop before
  candidate or raw-page work
- **AND** it does not copy the selected bytes into a replacement record

## REMOVED Requirements

### Requirement: Style master uses in-Harness image client

**Reason**: Its current-v2 plan, provider profile, candidate schemas, and
Page Authority source assumptions belong to the retired lineage.

**Migration**: Replan and review Style Master work through the current Page
Image Workflow scope; no v2 candidate lifecycle is adopted.

### Requirement: Shared style primitives do not select a retired route

**Reason**: It defines retained behavior around the retired Page Authority
route rather than the replacement protocol.

**Migration**: Resolve common visual semantics through the replacement Style
Master lifecycle.

### Requirement: Style Master review promotes one current effective selection

**Reason**: Its current-selection identity is tied to v2 records.

**Migration**: Promote only a replacement-protocol selection bound to the
current source/workflow scope.

### Requirement: Effective selection and acceptance share one canonical state record

**Reason**: The v2 state record cannot be evidence for the replacement
workflow.

**Migration**: Publish a newly reviewed current Page Image Workflow selection;
do not translate v2 state.
