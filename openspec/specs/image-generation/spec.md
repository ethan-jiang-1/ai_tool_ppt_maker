## Purpose

Define the receipt-bound Page Image Workflow raw-image lifecycle. It compiles current
Pure and Framed raw requests, requires an exact human authorization before a
nonzero provider submission, records deterministic raw evidence, and exposes a
review projection before finalization.
## Requirements
### Requirement: Page Image Workflow compiles one auditable provider input per slide

For a current `page-image-workflow-v1` receipt, the selected workflow adapter
SHALL compile exactly one immutable provider input for each slide from the
canonical source receipt, selected visual language, accepted Style Master
selection, generation profile, and Header Rendering Policy. The compiled input
bytes and SHA-256 digest SHALL be bound into the raw contract, full plan,
inspection projection, authorization scope, attempt, provenance,
reconciliation, and final evidence.

For `pure`, the provider input SHALL instruct rendering of all visible page
content, including exact kicker, title, and subtitle. For `framed`, it SHALL
include the exact header literals as context not to render, the closed
Provider Content Schema, and protected geometry with a duplicate-header
prohibition. The shared transport SHALL submit only the bound bytes; it SHALL
not compile, append, replace, or reinterpret workflow prompt semantics.

#### Scenario: Framed compilation binds non-rendering header context

- **WHEN** a current Framed receipt is compiled for raw planning
- **THEN** the provider input contains exact kicker, title, and subtitle as
  context not to render plus the protected geometry
- **AND** its bound digest changes when any of those literals changes

#### Scenario: Transport cannot rewrite an adapter input

- **WHEN** raw generation is authorized from a compiled provider input
- **THEN** the submitted request bytes match the bytes bound into the current
  authorization and attempt lineage
- **AND** transport does not append a Pure/Framed prompt branch or replace the
  digest

### Requirement: Current raw contracts preserve content authority and literal policy

Current Page Image raw contracts SHALL separately record canonical source
authority, normalized Provider Content Schema, visual direction, generation
profile, Header Rendering Policy, compiled provider-input digest, and any
Framed local header-renderer input. They SHALL preserve exact literals and
explicit presentation-adaptable permissions without granting the provider
semantic authorship.

Before hashing or authorizing a raw contract, the selected adapter SHALL
validate the complete current contract shape. Unknown content roles, unbound
provider bytes, a duplicate Framed header instruction, an invalid protected
geometry, or an unrecognized literal policy SHALL fail closed with the owning
source/configuration repair action before provider work.

#### Scenario: Adaptable supporting copy remains explicitly bounded

- **WHEN** a valid provider input contains a `presentation_adaptable`
  supporting-copy item
- **THEN** the raw contract records that explicit permission with the source
  literal
- **AND** no claim, fact, number, name, label, header, or unmarked literal is
  represented as adaptable

#### Scenario: Invalid current contract stops before authorization

- **WHEN** a compiled Framed contract omits its provider-input digest or
  protected geometry
- **THEN** raw planning fails before plan publication or provider authorization
- **AND** it returns one owning repair action rather than constructing a
  fallback request

### Requirement: Complete Page Review exposes complete current page evidence

Raw evidence and its review projection SHALL bind the exact current provider
page bytes and their compiled-input lineage. The review surface SHALL make the
canonical literals and literal policies available for comparison without
changing provider bytes or creating a competing quality evaluator.

For Framed, the selected review contribution SHALL include both the exact
provider raw page and a production-equivalent composite formed with the
current local header-renderer input. For Pure, the exact provider page is the
complete page evidence and no local composite is created. The raw owner SHALL
expose one owner-issued Complete Page Review action; it SHALL not create a
separate raw-only or composite-only acceptance state.

#### Scenario: Framed review exposes both representations of one page

- **WHEN** a complete current Framed raw plan is ready for page review
- **THEN** its review contribution contains the exact raw provider page and
  its production-equivalent composite bound to the same lineage
- **AND** the owner exposes one `proceed` or `repair` decision for that page

#### Scenario: Pure review does not create a local composite

- **WHEN** a complete current Pure raw plan is ready for page review
- **THEN** its review contribution contains the exact provider page as the
  complete page representation
- **AND** it does not invoke Framed overlay, safe-zone, or compositor behavior

### Requirement: Current raw lifecycle is immutable, scoped, and adapter-owned

After current source receipt and Style Master readiness are established, the
selected Page Image adapter SHALL publish one provider-free immutable full plan
for its exact version/workflow scope. The plan and each ordered stable
`slide_id` item SHALL bind the selected adapter's compiled provider-input
digest, raw-contract digest, generation profile, Style Master selection, and
policy-specific header profile or protected geometry where applicable. A
materialized provider page becomes current only through the exact plan/batch,
grant, submitted terminal attempt, verified bytes, and immutable provenance
chain. An ID match, filename, task projection, copied bytes, or last grant
digest SHALL not establish current raw evidence.

The common progressive owner SHALL consume only a validated typed plan from the
selected adapter. It SHALL retain immutable full plans, batches, grants,
attempts, provenance, and media beneath its replacement-owned append-mostly
store, with one CAS-protected current head per exact scope. A batch is an
immutable selected-ID projection of the full plan, not a partial plan or a
second authority; its generation/predecessor and paid scope are derived from
direct records. Generation SHALL claim and submit at most one eligible item per
invocation. Direct attempt transitions, unknown-submission reconciliation, and
successor planning SHALL preserve the existing exact-attempt/CAS discipline:
an uncertain submitted item consumes its exact scope and cannot be retried,
reopened, or replaced without the owner-issued reconciliation or successor path.
Staging, unreferenced history, directory order, timestamps, and derived files
are not current authority.

`pilot` creates only a provider-free exact batch projection. Provider work
requires later exact batch authorization and generation. A partial Pilot
decision is limited to its complete attributable sample and may only expose the
current Expansion or repair/replan action; it cannot publish accepted raw
evidence, final media, a manifest, PPTX, notes, or delivery. When paid debt is
zero or the current Pilot scope exhausts the full debt, no synthetic partial
Pilot decision is created and the owner routes to Complete Page Review. Missing
partial-Pilot coverage with residual debt returns the owner-issued successor
Pilot planning action before evidence or decision publication.

#### Scenario: Pilot planning cannot submit or accept a page

- **WHEN** a current full plan receives an exact selected-ID `pilot` request
- **THEN** the owner publishes only the provider-free batch projection and its
  bounded cost/sample facts
- **AND** it creates no provider attempt, grant, accepted raw evidence, or
  Complete Page Review decision

#### Scenario: A submitted uncertain item cannot reopen its grant

- **WHEN** a current raw attempt has no provable terminal provider result
- **THEN** the owner preserves that exact submitted lineage and returns only
  the reconciliation or bounded successor action
- **AND** it does not infer a retry, resubmit the item, or use copied bytes as
  materialization

### Requirement: Structural Page Image targets begin without raw reuse

An exact structural publication or `new-version` target SHALL begin as a clean
current authoring draft with no replacement raw plan, authorization, attempt,
provider bytes/provenance, Pilot evidence, Complete Page Review, or accepted
raw evidence. It SHALL not rebind, copy, or materialize a source-version raw
tuple as target current or unreviewed provenance, even when stable IDs and
compiled inputs appear unchanged. Target raw work begins only from its own
revalidated replacement source/Style Master facts and new current plan; apply
performs no provider call.

#### Scenario: A retained slide does not transfer Page Image raw authority

- **WHEN** a structural target retains a source slide with apparently matching
  source and visual facts
- **THEN** the target starts without its source raw plan, media, provenance, or
  review evidence
- **AND** it does not make a provider call or publish target page acceptance

### Requirement: Current provider results are verified and remain bounded

The direct `image2 generate` provider boundary SHALL resolve one scoped,
non-overwriting credential/endpoint pair from the selected Deck root and then
the process current working directory only after current identity, plan, batch,
grant, and item preconditions pass. Inherited environment values retain
precedence. Missing or malformed credentials shall fail before a new
claimed/submitted attempt, provider request, materialization, or provenance
write; provider-free planning, authorization, reconciliation, review,
acceptance, and delivery SHALL not require or mutate dotenv configuration. The
same resolved pair is used for the original submit and any same-invocation async
poll.

The selected adapter SHALL accept provider media only after validating a
CRC-valid PNG with positive native dimensions, then retain the exact bytes and
actual dimensions without resize, crop, or transcode. A fully received
non-success/unusable response, invalid media, or terminal async task failure
shall terminalize the submitted item through the secret-safe owner-issued
known-failure outcome before media/provenance acceptance. Lost or unreadable
responses remain uncertain and use only the exact reconciliation path. A
provider task identifier may be polled only within the original invocation and
its bounded deadline; it creates no durable task record, second submission,
grant, or provider recovery command. No outcome exposes provider body,
headers, task identifier, prompt, credentials, raw bytes, or an alternate
retry/failover route.

#### Scenario: Verified non-default native media succeeds unchanged

- **WHEN** an authorized current provider result is a CRC-valid PNG with
  positive dimensions different from the requested size
- **THEN** the owner records those exact bytes and actual dimensions in its
  terminal provenance chain
- **AND** it does not resize the image or terminalize it as invalid

#### Scenario: A definite response and a transport loss have different outcomes

- **WHEN** one authorized result is fully received but unusable and another
  loses transport before a terminal outcome is established
- **THEN** the former is a bounded known failure and the latter remains an
  uncertain exact reconciliation case
- **AND** neither output leaks provider data or creates a direct retry

#### Scenario: Async success remains the original submission

- **WHEN** a current authorized submit returns a provider task and its
  same-invocation poll returns verified media
- **THEN** the original attempt receives the verified result and provenance
- **AND** no task state, second authorization, or second submission is created

### Requirement: Current provider-input inspection and human-facing projections are derived

Provider-free current planning SHALL materialize a deterministic local
inspection projection for the exact plan. It binds the plan, ordered stable IDs,
compiled provider-input and raw-contract digests, source/selection/profile
lineage, and the request contract needed for deliberate local inspection. The
artifact may contain the selected adapter's exact provider input locally but
SHALL exclude credentials, authorization headers, environment values, provider
responses, and image data URLs. It is rebuildable and may not serve as a
selector, authorization assertion, plan replacement, or provider request
source.

Every rebuildable Page Image projection intended for human browsing SHALL use
the current full-plan position and stable ID as `NN_slideID.png`, with the
one-based position padded to at least two digits. A Pilot subset retains the
position from the complete current plan rather than renumbering its subset.
The display name does not change the stable ID or any plan, authorization,
attempt, provenance, review, or receipt binding.

#### Scenario: Inspection is local evidence, not a provider override

- **WHEN** a current plan publishes its provider-input inspection projection
- **THEN** the projection follows the exact plan order and bound input digests
- **AND** a caller cannot submit, authorize, or select work from the projection

#### Scenario: A Pilot image keeps its full-plan ordinal

- **WHEN** a Pilot contains one slide from position ten in a current full plan
- **THEN** its human-facing projection uses the position-ten ordinal and stable
  slide ID
- **AND** the subset does not renumber it to position one

### Requirement: v2 bytes cannot become current raw authority

`page-authority-image2-v2` source/state, receipt, plan, authorization, raw
evidence, review evidence, or delivery evidence SHALL fail at the current
protocol identity check before raw planning, provider initialization,
authorization, generated-artifact reads, review publication, or state
mutation. The failure SHALL preserve the supplied bytes and identify the
`unsupported-protocol/export` recovery boundary; it SHALL not decode, convert,
reuse, or reinterpret those bytes.

#### Scenario: v2 raw evidence cannot seed a current plan

- **WHEN** a caller presents v2 accepted raw evidence to a current Page Image
  Workflow operation
- **THEN** the operation returns the `unsupported-protocol/export` hard-stop
  before inspecting its media or provenance
- **AND** it does not issue a new plan, grant, or current evidence reference
