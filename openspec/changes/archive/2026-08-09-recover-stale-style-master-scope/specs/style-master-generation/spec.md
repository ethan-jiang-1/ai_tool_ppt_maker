## MODIFIED Requirements

### Requirement: Style Master planning is scoped to the current Page Image Workflow

The Style Master owner SHALL resolve exactly one `page-image-workflow-v1`
authoring draft, exact source/state pair with the matching
`image2-page-workflow-v1` state, or recovery candidate for one version-level
workflow, `framed` or `pure`. Its candidate plan, authorization, attempt,
review, effective selection, and acceptance facts SHALL bind that workflow
together with the current visual-language selection and source context. A
fresh authoring draft MAY reach Style Master work before its first Page Image
Workflow receipt is materialized, but it SHALL never create a raw page plan,
Page Image receipt, or provider-page authority as a side effect.

When visual or other selected-workflow source drift makes a previously
selected Style Master binding stale, the owner SHALL allow a current,
validated selected-workflow candidate from canonical source to establish one
provider-free replacement Style Master candidate-plan scope. This recovery
applies only when the existing source/state evaluator reports its explicit
source identity or source-receipt drift; it SHALL not convert state
initialization, state integrity, workflow identity, unsupported lineage, or
uncertain scope failures into a recovery candidate. The owner SHALL validate
the current run/workflow identity and candidate bytes and SHALL reject invalid
source or a candidate from another workflow. The prior plan, selection, review,
and acceptance records remain immutable audit history and cannot satisfy the
replacement scope or be rewritten as current evidence.

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

#### Scenario: Visual-language drift starts one replacement Style Master scope

- **WHEN** a selected workflow has an immutable prior Style Master selection
  whose visual/source binding is stale and the canonical current candidate
  validates for that same workflow and version
- **THEN** the Style Master owner exposes the provider-free replacement
  candidate-plan action for that current candidate
- **AND** it does not materialize a source epoch, raw plan, raw authorization,
  provider request, Page Image evidence, or rewrite of the prior history

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
Generation SHALL revalidate current compiled brief/profile inputs,
CAS-persist one `claimed` attempt before provider initialization, bind its
request identity when it becomes `submitted`, and permit exactly one terminal
success, known failure, or uncertainty outcome. A successful candidate
requires verified media, immutable bytes, and matching provenance before it
becomes reviewable. Unknown submitted work remains cost-preserving and
requires the owner-issued exact abandonment path before a successor; it is
never an implicit retry. A local-existing candidate is an immutable confined
snapshot subject to the same review/selection contract, never file-presence
acceptance.

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
