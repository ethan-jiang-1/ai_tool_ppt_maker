## Purpose

Define the receipt-bound Page Image Workflow raw-image lifecycle. It compiles current
Pure and Framed raw requests, requires a Task-Mandate-backed exact batch grant
before a nonzero provider submission, records deterministic raw evidence, and
exposes a human review projection before finalization.
## Requirements
### Requirement: Page Image Workflow compiles one auditable provider input per slide

For a current schema-declared `page-image-workflow` receipt, the selected
workflow adapter SHALL compile exactly one immutable provider input for each
slide from the canonical source receipt, selected visual language, accepted
Style Master facts, and current adapter policy. The compiled input SHALL carry
the declared `image2-request` schema and role, retain existing digest and
immutability rules, and use no version-suffixed or alternate protocol marker.

For Framed, the exact current input SHALL bind its selected normalized
protected composition and source restrictions, while omitting every
local-header field, header-derived `context_not_to_render` field, and
`protected_geometry` field. Independently source-owned provider content retains
its own permitted literal when its spelling matches a local header. For Pure,
the input remains limited to its selected Pure projection and does not receive
a Framed composition or Framed restriction binding.

#### Scenario: A current provider input is compiled

- **WHEN** a valid current receipt reaches its selected adapter
- **THEN** it emits one immutable declared Image2 request per slide
- **AND** no historical receipt or protocol branch participates

#### Scenario: Framed compilation binds non-rendering header context

- **WHEN** a current Framed source reaches compilation
- **THEN** its compiled declared request binds the selected non-text protected
  composition and source restrictions without a local-header field or
  header-literal context
- **AND** independently sourced provider content may retain matching spelling,
  and the request does not create a second or historical contract

#### Scenario: Transport cannot rewrite an adapter input

- **WHEN** the current transport receives a compiled declared request
- **THEN** it submits the exact adapter-owned input under existing controls
- **AND** it does not rewrite its schema, role, or protocol value

### Requirement: Current raw contracts preserve content authority and literal policy

Current Page Image raw contracts SHALL separately record canonical source
authority, normalized Provider Content Schema, visual direction, generation
profile, Header Rendering Policy, compiled provider-input digest, and any
Framed local header-renderer input. A Framed contract SHALL additionally retain
one selected protected-composition binding and source restrictions without an
exact local-header-literal mirror or `protected_geometry` field. They SHALL
preserve exact literals and explicit presentation-adaptable permissions without
granting the provider semantic authorship.

Before hashing or authorizing a raw contract, the selected adapter SHALL
validate the complete current contract shape. Unknown content roles, unbound
provider bytes, a serialized Framed local-header field or header-literal
context, malformed or stale protected composition/restriction binding, a former
`context_not_to_render` or `protected_geometry` field, or an unrecognized
literal policy SHALL fail closed with the owning source/configuration repair
action before provider work.

#### Scenario: Adaptable supporting copy remains explicitly bounded

- **WHEN** a valid provider input contains a `presentation_adaptable`
  supporting-copy item
- **THEN** the raw contract records that explicit permission with the source
  literal
- **AND** no claim, fact, number, name, label, header, or unmarked literal is
  represented as adaptable

#### Scenario: Invalid current contract stops before authorization

- **WHEN** a compiled Framed contract omits its provider-input digest,
  protected-composition binding, or source restriction binding
- **THEN** raw planning fails before plan publication or provider authorization
- **AND** it returns one owning repair action rather than constructing a
  fallback request

### Requirement: Framed protected composition binds one exact bounded provider request

For every current Framed page, Page Image Core and the selected Framed adapter
SHALL retain the existing parsed source-owned `subject_restrictions` and bind
one selected profile's protected-composition facts into the immutable raw
contract, canonical provider-input bytes, raw-plan bindings, and derived
inspection artifacts. The composition facts SHALL use `coordinate_space:
normalized-canvas`, identify one normalized canvas-relative reserved-header
region, and one normalized body-safe region that excludes it. The body-safe
region SHALL be the exact full-width rectangle below the reserved header:
`x: 0`, `y: reserved_header.y + reserved_header.height`, `width: 1`, and
`height: 1 - reserved_header.y - reserved_header.height`. They are derived only
from the selected Framed presentation projection; a slide, review projection,
derived file, or caller SHALL NOT supply substitute coordinates, restrictions,
or a profile.

The compiled request SHALL retain the full continuous provider canvas and state
one exact Framed-exclusive reservation: `reserved_header` is solely for the
deterministic local kicker, title, and subtitle overlay. It SHALL instruct the
provider to place every provider-rendered readable body literal, provider
label, and key subject in `body_safe`, and to place none of those elements in
`reserved_header`. The request SHALL contain no serialized local-header field,
header-derived `context_not_to_render` equivalent, or local header literal.
Independently source-owned provider content retains its own permitted literal
even when its spelling matches a local header literal. The raw contract retains
local-header facts only for deterministic local rendering.

The exclusive-reservation clause is an adapter-owned compiled-input invariant:
the current Framed compiler SHALL emit it with the exact selected normalized
composition, and provider-free planning SHALL fail closed at the existing
source/configuration repair action before derived publication, authorization,
provider initialization, grant, attempt, review, or lifecycle reuse when that
clause is missing, weakened, stale, cross-workflow, or bound to a different
composition. This deterministic invariant validates the local compiled
contract, not the remote raster result; it SHALL not claim a provider-native
region primitive or automatic remote compliance.

Pure SHALL not receive Framed composition, exclusive-reservation instruction,
or Framed raw/request subject-restriction binding. This SHALL not remove the
existing parser-owned source restriction from a Pure receipt or prevent its
existing Visual Config identity-resolution use.

#### Scenario: A Framed request carries its exact exclusive reservation

- **WHEN** a valid current Framed page reaches provider-free planning
- **THEN** its raw contract and canonical provider request bind the same
  selected normalized reserved-header region, body-safe region, parsed source
  restrictions, and exclusive-reservation clause
- **AND** the request remains an exact adapter-owned byte sequence with no
  provider submission or new human decision

#### Scenario: A Framed request carries its exact selected composition

- **WHEN** a valid current Framed page reaches provider-free planning
- **THEN** its raw contract and canonical provider request bind the same
  selected normalized reserved-header region, body-safe region, and parsed
  source restrictions
- **AND** the request remains an exact adapter-owned byte sequence with no
  provider submission or new human decision

#### Scenario: A Framed request does not repeat local header literals

- **WHEN** a valid Framed page has a non-empty local title, kicker, or subtitle
- **THEN** its raw contract retains those facts for the deterministic local
  overlay while its canonical provider request contains no local-header field
  or header-literal context field
- **AND** independently source-owned provider content may retain a matching
  literal while the request carries the exact non-text composition and
  exclusive-reservation guidance

#### Scenario: A weakened local reservation stops before provider work

- **WHEN** a selected Framed projection lacks a valid body-safe region, its
  source restriction binding differs from the current receipt, or its compiled
  input lacks the exact exclusive-reservation clause for that composition
- **THEN** planning stops at the direct repair action before it publishes a
  current plan or authorizes provider work
- **AND** it does not substitute a prior geometry, silently weaken the
  instruction, omit restrictions, or create a partial derived publication

#### Scenario: An incomplete composition stops before provider work

- **WHEN** a selected Framed projection lacks a valid body-safe region or its
  source restriction binding differs from the current receipt
- **THEN** planning stops at the direct repair action before it publishes a
  current plan or authorizes provider work
- **AND** it does not substitute a prior geometry, silently omit restrictions,
  or create a partial derived publication

#### Scenario: Pure remains isolated from Framed reservation facts

- **WHEN** a valid current Pure page reaches its selected adapter
- **THEN** its raw contract and provider input contain no Framed reserved-header
  region, body-safe region, exclusive-reservation instruction, local header
  context, or Framed subject-restriction binding
- **AND** its source receipt may retain the parser-owned restriction for its
  existing identity-resolution use while the request continues to use only the
  selected Pure projection

#### Scenario: Pure remains isolated from Framed protection facts

- **WHEN** a valid current Pure page reaches its selected adapter
- **THEN** its raw contract and provider input contain no Framed reserved-header
  region, body-safe region, local header context, or Framed
  subject-restriction binding
- **AND** its source receipt may retain the parser-owned restriction for its
  existing identity-resolution use while the request continues to use only the
  selected Pure projection

### Requirement: Framed composition evidence preserves one human review decision

The existing Complete Page Review SHALL remain the only acceptance decision for
Framed provider output. It SHALL continue to bind the exact provider page and
production-equivalent transparent-header composite to the composition-bound raw
lineage. Its existing Framed review contribution SHALL display exactly one
normalized `reserved_header` guide rectangle and one normalized `body_safe`
guide rectangle from that lineage. Provider-safe wording, a successful
deterministic contract check, or an observed provider result SHALL not establish
a general layout guarantee or accepted evidence without that review decision.

The review decision SHALL treat provider-generated typography, labels,
provider-rendered body content, or key visual subjects that visibly encroach on
the exact `reserved_header` as a reason to select the existing `repair`
decision rather than `proceed`. The review remains a human visual quality
decision: it SHALL not add a protected-area occupancy, collision, OCR, or other
automated observation, and it SHALL not infer a remote-layout result from the
compiled instruction alone. The two composition guides remain review context
only: they SHALL not submit provider work, set `repair` or `proceed`, create
approval or waiver state, replace Complete Page Review, or become a runtime
dependency.

#### Scenario: A header-encroaching provider page routes through repair

- **WHEN** a Framed Complete Page Review shows provider-generated typography,
  labels, provider body content, or a key subject inside the exact reserved
  header guide or obscuring the local overlay in the composite
- **THEN** the human selects the existing `repair` decision and the owner
  returns the existing raw-rebuild recovery action
- **AND** it does not publish accepted raw evidence, final media, or delivery
  evidence from that page set

#### Scenario: A compliant-looking provider page still requires review

- **WHEN** a Framed provider page appears to respect its exclusive reservation
  and composition guidance
- **THEN** the existing Complete Page Review presents the exact provider and
  composite evidence and the two exact composition guides for the human's
  `proceed` or `repair` decision
- **AND** no prompt fact, deterministic contract check, diagnostic, or probe
  sample accepts the page itself

#### Scenario: Composition guides cannot control the lifecycle

- **WHEN** a Framed Complete Page Review includes the two composition guides
- **THEN** they remain context for the existing human review and repair path
- **AND** they create no additional gate, state transition, retry, or provider
  authorization

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
for its exact version/workflow scope under one active Page Image Task Mandate.
The plan and each ordered stable `slide_id` item SHALL bind the selected
adapter's compiled provider-input digest, raw-contract digest, generation
profile, Style Master selection, Task Mandate reference, and policy-specific
header profile or protected geometry where applicable. A materialized provider
page becomes current only through the exact plan/batch, mandate-bound grant,
submitted terminal attempt, verified bytes, and immutable provenance chain. An
ID match, filename, task projection, copied bytes, last grant digest, or Task
Mandate alone SHALL not establish current raw evidence.

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

`pilot` creates only a provider-free exact batch projection. With a valid active
Task Mandate, routine Pilot scope selection, successor planning, and later
exact batch grant creation are Agent-run work; the grant SHALL still validate
the exact plan, batch, selected IDs, maximum submissions, and mandate binding
before generation. A partial Pilot decision is limited to its complete
attributable sample and may only expose the current Expansion or repair/replan
action; it cannot publish accepted raw evidence, final media, a manifest, PPTX,
notes, or delivery. When paid debt is zero or the current Pilot scope exhausts
the full debt, no synthetic partial Pilot decision is created and the owner
routes to Complete Page Review. Missing partial-Pilot coverage with residual
debt returns the owner-issued successor Pilot planning action before evidence
or decision publication.

#### Scenario: Task-Mandate-covered exact grant remains bounded

- **WHEN** a current mandate-bound plan has an owner-issued Pilot or Expansion
  batch with an exact plan hash and batch hash
- **THEN** the owner records or exact-replays one grant bound to that mandate,
  selected IDs, and maximum submissions without a new human cost decision
- **AND** generation still submits at most one owner-eligible item from that
  exact grant per invocation

#### Scenario: Missing or stale Task Mandate stops before a grant

- **WHEN** current raw work has no active mandate or its version, workflow, or
  execution binding no longer matches the plan
- **THEN** the owner returns the one current-plan recovery action, whose
  provider-free planning path establishes or reuses the mandate, before
  provider initialization, grant publication, or attempt claim
- **AND** it does not infer a mandate from a task projection, prior grant, or
  historical source bytes

#### Scenario: Historical raw scope is never silently adopted

- **WHEN** a retained historical plan or grant lacks the current Task Mandate
  binding required for a new provider submission
- **THEN** inspection and reconciliation preserve its bytes and attributable
  terminal evidence
- **AND** the owner does not rewrite it, attach a mandate retroactively, or
  submit another provider item from that historical scope

For a complete raw review, the owner SHALL treat an immutable prepared record
as current only when its decision is unset and no validated later decision
record references that prepared record. Current lifecycle actions and evidence,
unaccepted review preparation, review acceptance, and read-only current-review
inspection SHALL apply this same relationship-aware rule. A decision-history
handoff MAY retain the immutable `repair` decision for audit, but SHALL NOT
establish current review availability or select a lifecycle action. A human
`repair` decision SHALL preserve both immutable records, expose no current
Complete Page Review, and return only the existing
`rebuild_progressive_raw_work` recovery action. It SHALL not replay the
historical prepared review, create a second decision from it, create accepted
raw evidence, or make final or delivery artifacts available.

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

#### Scenario: A repaired Complete Page Review returns to raw rebuild

- **WHEN** a valid current Complete Page Review has a later immutable decision
  record with `repair` that references its prepared record
- **THEN** lifecycle inspection returns `rebuild_progressive_raw_work` and no
  current Complete Page Review digest
- **AND** it does not expose review acceptance, accepted evidence, final media,
  or delivery as available
- **AND** an audit-only decision handoff, if projected, identifies the review
  as decided and does not make it current

#### Scenario: Historical prepared evidence cannot be replayed or re-decided

- **WHEN** preparation or acceptance is requested after a repair decision has
  referenced the only prepared Complete Page Review for the current plan
- **THEN** the owner rejects that request with the existing bounded rebuild
  recovery action
- **AND** it writes no review, decision, accepted evidence, grant, attempt, or
  provider request

### Requirement: Stale selected Style Master routes to replacement planning before raw rebuild

When a selected Page Image workflow has a current validated source candidate
but its required Style Master selection is stale because the selected
visual/source context drifted, raw-plan evaluation SHALL stop before source
epoch, raw-plan, batch, grant, attempt, provider request, or Page Image
evidence mutation. It SHALL return the existing Style Master owner's one
provider-free replacement-planning action for the same exact version and
workflow. The raw owner SHALL not treat the prior selection as current,
construct a replacement raw plan, or require a human authorization before the
replacement Style Master plan exists.

The recovery route SHALL preserve prior source receipts, raw plans, grants,
attempts, reviews, accepted raw bytes, final media, and delivery records as
immutable historical evidence. It does not relax the existing requirements for
current Style Master acceptance, exact raw authorization, provider work, or
Complete Page Review after the new selection is made.

#### Scenario: Pure visual-system drift stops at Style Master replacement planning

- **WHEN** a current Pure source candidate changes its selected visual-system
  projection and the existing Style Master selection no longer binds that
  projection
- **THEN** raw planning returns only the replacement Style Master planning
  action before source-epoch or raw-work publication
- **AND** it does not reuse the prior selection, mutate state, or initialize a
  provider request

#### Scenario: Framed visual-language drift keeps raw work blocked

- **WHEN** a current Framed source candidate changes visual-language facts and
  its existing Style Master selection is stale
- **THEN** raw planning returns only the replacement Style Master planning
  action for that same Framed version
- **AND** it does not create a target source receipt, raw authorization,
  attempt, or Page Image evidence

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

### Requirement: Page Image review projections render supported provider PNG layouts as derived evidence

Every rebuildable Page Image raw, Pilot, and Complete Page Review raster
projection SHALL render CRC-valid provider or adapter-complete PNG media with
an exact decoded pixel count and supported 8-bit or 16-bit grayscale,
grayscale-alpha, RGB, or RGBA layout. The projection SHALL normalize only its
derived canvas pixels and retain the exact input bytes, native dimensions,
hashes, compiled-input lineage, provenance, review bindings, and acceptance
authority unchanged.

An inconsistent or unsupported decoded layout SHALL fail the owning derived
review projection clearly. It SHALL not accept, replace, transcode, or
reclassify provider media, create another review decision, or publish a
projection as a selector or evidence authority.

#### Scenario: Pure review renders a non-RGBA provider page without changing it

- **WHEN** a current Pure raw provider page is CRC-valid 16-bit RGB PNG media
  with accepted exact bytes and provenance
- **THEN** Complete Page Review publishes its derived visual projection from
  normalized pixels
- **AND** the review binds the original provider bytes and does not create a
  local composite or replacement media record

#### Scenario: A malformed review layout cannot become review evidence

- **WHEN** a Page Image review projection encounters a decoded media layout
  with an inconsistent sample count
- **THEN** it reports the owning projection failure before publishing that
  projection
- **AND** it leaves current raw media and review authority unchanged

### Requirement: Fully received invalid JSON has a closed response-shape fact

For a current authorized Page Image provider response that was fully read after
an HTTP-success result but cannot be parsed as JSON, the owner SHALL
terminalize the submitted item through the existing `invalid_json` known-
failure outcome and attach exactly one `response_shape` value: `empty`,
`html_like`, or `other_non_json`. Whitespace-only content is `empty`; content
whose leading whitespace is followed, case-insensitively, by `<!doctype html`
or an opening `<html` tag with a tag/doctype boundary is `html_like`; every
other such parse failure is `other_non_json`. The fact SHALL contain neither
response content nor any additional content-derived metadata.

The owner SHALL omit `response_shape` from valid JSON, HTTP failures,
unreadable or lost responses, invalid media, and every other known-failure
classification. An unreadable or lost response SHALL retain its existing
uncertain reconciliation outcome rather than being classified from absent
content.

#### Scenario: An empty successful response terminalizes with its bounded shape

- **WHEN** a current authorized Page Image provider response is HTTP-success,
  fully read, whitespace-only, and not valid JSON
- **THEN** the owner terminalizes the submitted item as the existing
  `invalid_json` known failure with `response_shape: empty`
- **AND** it does not publish response text, headers, size, digest, task
  identifier, raw bytes, retry, or alternate recovery action

#### Scenario: A received HTML document does not expose its contents

- **WHEN** a current authorized Page Image provider response is HTTP-success,
  fully read, begins with an HTML document marker, and is not valid JSON
- **THEN** its existing `invalid_json` known failure carries only
  `response_shape: html_like`
- **AND** media and provenance remain unpublished and the known-failure
  terminal path remains unchanged

#### Scenario: A non-JSON response outside the named shapes remains bounded

- **WHEN** a current authorized Page Image provider response is HTTP-success,
  fully read, nonempty, not an HTML document, and not valid JSON
- **THEN** its existing `invalid_json` known failure carries only
  `response_shape: other_non_json`
- **AND** no provider request, authorization, submission, or reconciliation
  behavior changes

#### Scenario: A response that is not fully available is not shape-classified

- **WHEN** a current authorized Page Image provider response body cannot be
  read or transport is lost before a terminal result is established
- **THEN** the owner retains the existing uncertain exact-reconciliation path
- **AND** it attaches no `response_shape` fact or content-derived diagnostic

### Requirement: Current Page Image human artifact view is bounded and derived from canonical owners

For an exact current Page Image Workflow scope, the Harness SHALL be able to rebuild one local
Human Navigation Path tree from canonical Style Master, provider-input inspection, raw/review,
final, assembly, notes, and delivery owners. The tree SHALL list only artifacts whose owning
current facts establish their availability; it SHALL not discover current evidence by directory
order, filenames, timestamps, copied media, prior navigation content, or display reference.

Before an artifact becomes available through the tree, the projection SHALL validate its
owner-issued confined regular-file locator and then materialize a regular derived copy below the
short navigation root. The index and every human-facing locator SHALL refer only to that short
physical tree, not to an original content-addressed artifact path. A failed owner validation,
unsafe existing navigation root, or copy/materialization failure SHALL fail before replacement and
preserve the prior navigation tree; it SHALL not initialize a provider, infer a fallback artifact,
or mutate lifecycle authority.

Available page artifacts SHALL be ordered by the current full-plan position and stable
`slide_id`; human-facing image entries SHALL retain that order without requiring the stable ID to
be a filename. Style Master entries SHALL use their stable candidate identity. Every entry SHALL
give an artifact type, inspection purpose, and a confined short physical locator. Visible display
references and derived filenames SHALL be kind-prefixed and collision-aware within the rebuilt
tree; no human-facing locator or navigation-tree component SHALL expose a full SHA-256.

When the current progressive raw owner establishes a Complete Page Review whose decision is still
unset, the tree SHALL list that review's current page artifacts and review projection before any
human `proceed` or `repair` decision. The entries SHALL be derived from the same current
owner-established plan, page bytes, and review projection that the `image2 review` operation
uses. They SHALL not require accepted raw evidence, create a second review surface, infer a
review from raw directories, or make final/delivery artifacts appear available.

The tree SHALL be rebuildable, provider-free, secret-safe, and non-authoritative. It SHALL not
contain credentials, authorization headers, environment values, provider response bodies, raw
prompt prose, image data URLs, or a new copy of lifecycle/review/acceptance state. Neither its
short physical paths nor its display references may select a plan, batch, attempt, candidate, or
review decision; authorize provider work; or substitute for source, provenance, or receipt
bindings.

#### Scenario: Current evidence receives stable human locators

- **WHEN** a current plan has available Style Master, review, final, and delivery artifacts
- **THEN** the rebuilt navigation index lists their owner-established derived copies with type and
  inspection purpose in stable candidate or full-plan slide order
- **AND** every reported artifact locator is confined below the short navigation root and its
  labels do not replace the existing exact digest and formal-ID protocol keys

#### Scenario: Current Complete Page Review is inspectable before its decision

- **WHEN** every page in a current Pure or Framed full plan is materialized and the raw owner has
  established a Complete Page Review with no `proceed` or `repair` decision
- **THEN** the rebuilt navigation tree lists each current review page and its complete-review
  projection with stable IDs, typed display references, short physical locators, artifact types,
  and review purposes
- **AND** it leaves final media and delivery unavailable and does not mutate state, receipts,
  grants, attempts, review decisions, or provider work

#### Scenario: A repaired Complete Page Review is not current display evidence

- **WHEN** the current plan has only a Complete Page Review whose `repair` decision is already
  recorded and no accepted raw evidence
- **THEN** the rebuilt navigation tree does not list that historical review's page or contact-sheet
  copies
- **AND** it marks Complete Page Review, final media, and delivery unavailable without mutating
  the next raw-rebuild route

#### Scenario: A later lifecycle artifact does not exist yet

- **WHEN** a current scope has planned or reviewed evidence but no final, notes, or delivery
  artifact
- **THEN** the navigation index marks only those later artifact categories as unavailable
- **AND** it does not infer a path, create placeholder evidence, mutate lifecycle state, or add a
  review or authorization gate

#### Scenario: A display reference is presented to a lifecycle operation

- **WHEN** a caller supplies a Human Navigation Path or short display reference where an exact
  lifecycle selector is required
- **THEN** the lifecycle operation continues to require its existing formal selector or full
  SHA-256 argument through the owner-controlled control path
- **AND** the navigation tree does not resolve, translate, or authorize that request

#### Scenario: A navigation copy is edited after publication

- **WHEN** a person changes or removes a derived file below the Human Navigation Path tree
- **THEN** the canonical owner artifact and its current evidence authority remain unchanged
- **AND** a later successful explicit rebuild replaces the derived tree solely from current
  owner-validated locators

### Requirement: Human Navigation Path short-circuits every validated pending successor

When the Style Master owner returns a validated pending-successor candidate
projection for an exact current Page Image Workflow run, the Human Navigation
Path SHALL render that projection before raw-owner, stored-raw-plan, or
raw-only accepted-selection inspection. This applies whether or not the
predecessor selection's style-intent, style-context, or
candidate-generation-profile hashes differ from the successor plan.

The tree SHALL materialize short physical copies only from the owner-provided
verified candidate locators, label them pending and not accepted, and mark raw,
review, final, and delivery work unavailable. The artifact-view success
projection SHALL report the owner's existing next action. Neither surface
SHALL display the predecessor as current Style Master authority, infer a raw
plan from it, or expose a SHA-named storage path.

The projection remains a provider-free guide. Any owner hard-stop for scope,
plan, predecessor, media, provenance, or navigation materialization SHALL
preserve the existing navigation tree and return the existing nearest recovery
without writing lifecycle authority.

#### Scenario: Source-receipt successor is visible before stale raw inspection

- **WHEN** a valid current successor has verified candidate media while a
  non-visual source edit makes the Page Image source receipt stale and its
  predecessor's three Style Master input hashes still match
- **THEN** rebuilding the Human Navigation Path publishes the successor's
  short candidate artifact copy and pending inspection purpose
- **AND** it does not read the stale raw plan, publish raw/final/delivery
  artifacts, initialize a provider, or mutate state

#### Scenario: Invalid pending candidate evidence leaves navigation unchanged

- **WHEN** an owner-projected successor candidate fails immutable media or
  provenance validation
- **THEN** the navigation rebuild returns the existing owner hard-stop before
  replacing the navigation tree
- **AND** it does not publish a partial candidate list or use a predecessor
  artifact as fallback

### Requirement: Pure raw work binds one selected deck visual system

Every current Pure Page Image Core slide, raw contract, compiled provider input, provider-input
inspection projection, and raw-plan item binding SHALL carry the exact digest of the same
validated Pure deck visual-system projection. The closed provider-input binding field SHALL be
named `deck_visual_system_sha256`; it is required for Pure and exactly `null` for Framed. The
ordinary and progressive raw-plan validators SHALL enforce the same shape. The compiled input
SHALL describe the deterministic typography hierarchy, Style-Master-derived colour use, zones,
whitespace, and allowed layout families without adding content literals or a local compositor.
The Pure raw contract and compiled input SHALL each expose the identical content-neutral
`deck_visual_system` object containing that `sha256` and the validated token projection.

The visual-system projection SHALL remain a source input, not a lifecycle selector, acceptance
record, provider authorization, or pixel-quality proof. Pure's provider page remains the complete
page evidence; Framed bindings retain their existing null/not-applicable Pure visual-system value.

#### Scenario: Every Pure page receives the same visual-system binding

- **WHEN** a current Pure full plan contains multiple slides
- **THEN** each compiled provider input and plan item binding contains the same selected
  visual-system digest and deterministic projection
- **AND** per-slide content and visual-language facts remain independently bound

#### Scenario: Pure has no local typography renderer

- **WHEN** a current Pure provider input is compiled with its deck visual system
- **THEN** it instructs the provider to render the entire page, including provider-visible text
- **AND** it does not create a Framed Text Frame, local overlay, protected geometry, or second
  review/acceptance surface

### Requirement: Pure visual-system drift invalidates exact raw evidence

When the selected Pure visual-system source projection changes, current planning and invalidation
SHALL classify the resulting binding drift as a Pure raw rebuild. They SHALL preserve existing
accepted raw bytes, provenance, review, final, and delivery facts as historical evidence; they
SHALL not perform provider work, reuse the old evidence as current, or modify State until the
existing exact authorization path is used.

#### Scenario: A typography or zone token changes after Pure acceptance

- **WHEN** a current accepted Pure scope is replanned after its selected visual-system digest
  changes while its slide literals and Style Master selection are unchanged
- **THEN** the raw-plan bindings differ and the owner returns the existing Pure raw-rebuild action
- **AND** it does not expose a provider-free final refresh or treat the old provider page as current

#### Scenario: Inspection is deterministic but not pixel acceptance

- **WHEN** an Agent inspects a current Pure provider-input projection for multiple pages
- **THEN** it can verify that the same visual-system digest and token projection were submitted
- **AND** it does not infer that the provider pixels obeyed the system or bypass Complete Page Review

### Requirement: Progressive terminal siblings preserve verified success

For one exact submitted progressive raw attempt, a childless `succeeded` and
`unknown` terminal pair SHALL have one effective `succeeded` terminal only when
both records bind the same immutable attempt tuple and the succeeded record's
existing materialization provenance and provider bytes validate through the
ordinary direct owner evidence path. The unknown record SHALL remain immutable
audit history; it SHALL not replace, downgrade, retry, reopen, or authorize the
item.

The progressive owner SHALL retain a non-bypassable integrity hard-stop for
every terminal branch other than the existing childless `known_failure` plus
`unknown` compatibility pair and the verified pair defined above, for a missing
or invalid succeeded provenance or bytes chain, or for any plan, batch, grant,
attempt-key, slide, or raw-contract mismatch. Valid terminal-sibling
classification is a deterministic `guide` and requires no human decision;
invalid branches protect immutable identity and provenance and create no retry,
record rewrite, replacement authorization, or provider request.

The owner SHALL complete the existing direct materialization provenance and
byte validation before exposing the succeeded child as an effective terminal.
If an exact `reconcile` request names the submitted parent of an already
validated effective pair, the owner SHALL return its current next-action
projection without calling lookup or appending an attempt, provenance, grant,
or provider request. This idempotent result SHALL NOT make the retained
`unknown` child eligible, current, or retryable.

#### Scenario: Verified success dominates its unknown sibling without mutation

- **WHEN** one submitted attempt has childless `succeeded` and `unknown`
  terminal records and the succeeded record's exact provenance and provider
  bytes validate
- **THEN** lifecycle inspection, reconciliation, and next-action evaluation
  treat that tuple as succeeded and retain the unknown record only for audit
- **AND** they create no retry, replacement grant, record rewrite, provider
  request, or human confirmation

#### Scenario: Reconcile does not append a third terminal after effective success

- **WHEN** `reconcile` receives the exact submitted parent for an already
  validated succeeded/unknown terminal pair
- **THEN** it returns the current owner-issued next action without lookup or a
  raw-owner record write
- **AND** it does not append a terminal sibling, submit a provider request, or
  alter the batch grant or materialization evidence

#### Scenario: An unproven success sibling remains an integrity hard-stop

- **WHEN** a submitted attempt has a `succeeded` and `unknown` sibling pair
  but the succeeded provenance or bytes cannot validate, or a terminal branch
  other than the preserved known-failure/unknown pair exists
- **THEN** the owner hard-stops before lifecycle continuation
- **AND** it neither selects a terminal child nor creates a retry, state edit,
  replacement authorization, or provider request

### Requirement: Framed render identity is one current compiler contract

The Framed render profile SHALL bind one declared current compiler identity,
canonical geometry invariant, external runtime/font facts, and deterministic
render-profile digest. It SHALL contain no numeric compiler version or retained
compiler history. A change to any current compiler identity, canonical geometry,
or external reproducibility fact SHALL continue to change the digest and follow
the existing selected-profile invalidation and raw-rebuild path.

#### Scenario: Current Framed compilation is stable

- **WHEN** the same current Framed input and external runtime facts compile
  twice
- **THEN** both render profiles have the same declared compiler identity and
  deterministic digest
- **AND** neither profile contains a numeric compiler marker or retained
  alternative identity

#### Scenario: Current compiler input changes invalidate raw work

- **WHEN** the declared current compiler identity, canonical geometry, or a
  reproducibility fact consumed by the profile changes
- **THEN** the render-profile digest changes and the existing raw-rebuild path
  applies
- **AND** the owner does not select or support another compiler identity

### Requirement: Current provider compilation binds one resolved Page Class projection

Before compiling a current provider input, the selected adapter SHALL receive
exactly one validated presentation projection for the source receipt page's
normalized Page Class and the version's selected workflow. The binding SHALL
retain the normalized class, selected profile identity, and inherited-value
provenance required to establish the compiled input's exact direct sources. For
Framed, every raw contract and provider-input binding SHALL use the profile and
protected geometry resolved for that same stable page ID. Framed SHALL use only
its resolved local header/protected-region facts and Pure SHALL use only its
resolved whole-page Pure facts.

The adapter SHALL not accept a caller-supplied profile, reuse a projection from
another workflow or class, consult a derived file, or revive raw evidence
whose bound projection differs. This binding is part of the existing immutable
raw contract; it SHALL not create a provider call, a separate approval, or a
duplicate header-controller JSON. The exact bound projection MAY be published
only through the independent derived `page-layout` artifact for the same successful
provider-free plan.

#### Scenario: Framed compilation receives its class-bound header treatment

- **WHEN** a current Framed page with a valid resolved presentation projection
  reaches compilation
- **THEN** its provider input and local header controller bind that one
  Framed class/profile projection
- **AND** the compiler does not accept a source `FRAME PRESET` or a Pure fact

#### Scenario: Projection drift cannot reuse raw evidence

- **WHEN** a selected page's resolved class/profile or inherited default differs
  from the binding on existing raw evidence
- **THEN** the existing lifecycle routes through raw rebuild before provider submission or review
- **AND** it does not reuse the former provider page or Complete Page Review

### Requirement: Framed raw-plan proof is exact per page, not per batch

Before ordinary or progressive Framed raw-plan materialization, the compiler
SHALL validate each raw contract against that page's resolved Framed profile.
Its browser proof SHALL return exactly the candidate's ordered stable page IDs
and SHALL bind each returned page's profile digest and protected-region guide to
the same candidate page. A mismatching, missing, duplicate, reordered, or
extra page result, or a profile/guide mismatch for any one page, SHALL stop
before receipt, State, raw-plan, provider authorization, provider work, review,
or local-rebind publication.

The Framed header-contract batch verifier and compositor SHALL derive each page
from its own resolved profile. They SHALL NOT require, publish, or compare a
single batch/deck-wide render-profile digest. This removes no per-page
raw-contract, provider-input, composite, or review binding and creates no new
durable proof record or control state.

#### Scenario: A mixed-profile candidate receives one exact proof per page

- **WHEN** one current Framed candidate contains `standard` and `opening`
  pages whose selected profiles differ
- **THEN** both raw contracts validate against their own selected profiles and
  browser proof binds each stable page ID to its own digest and guide
- **AND** raw planning does not reject the candidate for lacking one global
  Framed render profile

#### Scenario: One stale proof result blocks the complete candidate

- **WHEN** a Framed browser proof returns the expected page set but one page's
  selected profile digest or protected-region guide differs from its candidate
- **THEN** raw planning stops with the bounded profile/proof repair action
- **AND** it does not materialize or rebind any lifecycle record merely because
  every other page matched

### Requirement: Framed review coverage binds each page's selected presentation profile

A Framed raw-review contribution SHALL retain the exact selected presentation
profile digest and protected-region guide for each covered stable page ID. A
complete or Pilot review MAY contain pages whose class-bound Framed profiles
differ, provided every page's composite, guide, and raw-contract lineage bind
that page's own selected projection. The contribution SHALL NOT require one
deck-wide Framed profile, merge a sibling page's profile into another page, or
create a second review decision/control state.

#### Scenario: Mixed Framed classes remain reviewable as one exact scope

- **WHEN** a current Framed raw plan covers one `standard` page and one `opening`
  page with different resolved profiles
- **THEN** the one review contribution retains each page's own profile digest
  and protected-region guide with its exact raw lineage
- **AND** the existing Complete Page Review still exposes one `proceed` or
  `repair` decision without a deck-wide profile check

### Requirement: Provider-free raw planning publishes one complete page-derived chain

After the selected adapter has compiled a valid current full raw-plan candidate
and before any authorization or provider initialization, the raw-planning owner
SHALL publish a deck index and one independent page directory for every ordered
stable `slide_id`. Each page directory SHALL contain a separately serialized
`page-source-receipt`, `page-layout`, `page-render-model`,
`page-generation-spec`, `image2-request`, and `page-artifact-index`; a Framed
page SHALL additionally contain only the exact deterministic
`framed-header-html` representation, and a Pure page SHALL contain no Framed
placeholder or sibling header-controller JSON.

Every published artifact SHALL name its declared schema/stage, stable page
identity, purpose, producing owner, exact upstream bindings or canonical digest,
adjustment scope, downstream controller, and the direct
source/configuration/raw-plan inputs that make it stale. The `image2-request`
artifact SHALL expose the adapter's exact canonical UTF-8 request serialization
and matching digest for local inspection. The page index and deck index SHALL
refer to independent artifacts by confined path and digest, identify each
page's current full-plan position and stable ID, and explain the rebuild impact
of their bindings; they SHALL not duplicate page payloads, authorize work,
select a plan, or record an acceptance state.

The publisher SHALL validate the whole candidate and replace the derived-data
tree only as one complete validated publication. A publication failure is a
provider-free plan-materialization failure: it SHALL not expose a partial
current tree, publish a current raw plan, initialize a provider, create a
grant/attempt/review, or offer a fallback from a previous publication.

#### Scenario: A Pure plan publishes an inspectable request without provider work

- **WHEN** a valid current Pure full plan is compiled
- **THEN** each page has the complete non-Framed derived chain, including its
  exact canonical request bytes and provenance, before authorization
- **AND** the operation creates no provider client, grant, attempt, review, or
  new human decision

#### Scenario: A Framed plan publishes HTML but no duplicate header controller

- **WHEN** a valid current Framed full plan is compiled
- **THEN** each page publishes its selected layout and the exact deterministic
  `framed-header-html` file alongside its request chain
- **AND** no sibling JSON header controller or provider-visible body copy is published

#### Scenario: One broken page prevents a partial publication

- **WHEN** one page cannot supply a valid declared artifact or matching lineage
- **THEN** the publisher reports the owning provider-free repair action before
  current raw-plan publication
- **AND** it leaves prior derived data non-authoritative and starts no provider work

### Requirement: Detailed provider input remains outside Human Navigation

The independent derived-data directory SHALL be the canonical per-page
publication for its canonical request serialization and raw prompt prose. The
existing aggregate provider-input inspection retains its own current contract;
it SHALL neither be a derived-publication input nor cause derived payloads to be copied
into Human Navigation. The existing Human Navigation Path remains a short,
secret-safe, non-authoritative browsing projection and SHALL not copy, link, or
render derived request payloads into its tree. Detailed-derived files remain Agent
inspection inputs; a path or digest from them SHALL not be accepted as a
lifecycle selector.

#### Scenario: Rebuilding Human Navigation does not expose a provider request

- **WHEN** an exact current plan has a published derived `image2-request` artifact
  and its Human Navigation Path is rebuilt
- **THEN** navigation can continue to describe available review artifacts
  without copying the request's raw prompt prose
- **AND** its short locator cannot authorize, select, or submit that request

### Requirement: Framed Provider Constraint Trial records bounded empirical evidence

After an explicit human Work Request identifies and authorizes one newly
initialized disposable probe run for bounded provider cost, the Page Image
Workflow SHALL conduct a Framed Provider Constraint Trial only through the existing
provider-free plan, Task Mandate, exact batch grant, one-item attempt,
provenance, and Complete Page Review paths. Each selected sample SHALL bind one
current protected-composition-bound compiled provider input, its selected
profile and composition digests, the current transport field set, and the exact
provider/composite review evidence. It SHALL submit no more than three one-item
samples for that Work Request.

A multi-sample trial SHALL use distinct stable `slide_id` values in one exact
current batch and grant, whose `maximum_submissions` is the selected sample
count. Each selected probe page SHALL retain the same declared non-identity
probe content, visual direction, subject restrictions, generation profile, and
Framed presentation selection; its compiled provider input remains
page-specific because formal identity is bound into the current request. A
submitted page SHALL not be reopened, resubmitted, or replaced to obtain an
additional sample.

The trial evidence SHALL preserve only stable identifiers, digests, artifact
locators, submitted sample count, and bounded observations for
`provider_body_in_reserved_header`, `key_subject_in_reserved_header`,
`provider_body_in_body_safe`, and `local_header_legible_in_composite`. It SHALL
classify every observation as `observed`, `not_observed`, or `indeterminate`;
it SHALL not copy credentials, authorization headers, exact prompt prose,
provider response bodies, or raster bytes into a parallel record.
The conclusion SHALL be a bounded statement about the sampled current request
and transport only. It SHALL NOT accept a page, establish a general provider
guarantee or native capability, decide `proceed` or `repair`, establish a
provider-native region/mask contract, or authorize a transport extension.

The MD Controller SHALL use its existing changed-goal Work Request path before
the trial can create a provider attempt. A missing current protected-composition
binding, exact plan/grant, sample capacity, or lineage SHALL stop through the
existing nearest JS owner. Either failure SHALL not create a trial attempt,
acceptance, approval, waiver, retry, native-capability claim, fallback request,
or production-bundle mutation. Complete Page Review remains the only human
acceptance decision for each actual provider page.

The Work Request authorizes only the bounded raw-page provider cost. It SHALL
NOT replace the existing exact narrative-plan confirmation, Style Master review
and promotion, or Complete Page Review decision. A fresh probe without a valid
canonical local Style Master candidate SHALL stop at the existing Style Master
candidate-planning action before raw planning, grant, attempt, or provider
initialization. The trial SHALL not infer a candidate from an unrelated production
material, use the Work Request as generated-Style-Master authorization, or add
a candidate-acquisition path.

#### Scenario: An authorized disposable trial binds its exact samples

- **WHEN** a human Work Request identifies a valid newly initialized disposable
  current Framed run with a protected-composition-bound exact selected-ID batch
  and current grant
- **THEN** each of at most three submitted samples binds the exact compiled
  input, composition, transport field set, and existing provider/composite
  evidence for that run
- **AND** the trial conclusion remains bounded to those submitted samples

#### Scenario: Multiple samples use one bounded grant without resubmission

- **WHEN** a Work Request authorizes three probe samples
- **THEN** one exact grant binds three distinct selected slide IDs with
  `maximum_submissions: 3`, and each generation invocation claims at most one
  eligible page
- **AND** no submitted page is reopened or resubmitted to obtain another sample

#### Scenario: An unauthorized or invalid trial stops before provider work

- **WHEN** a requested trial lacks an explicit Work Request for a newly
  initialized disposable scope, exceeds three samples, or cannot establish
  current protected-composition/plan/grant lineage
- **THEN** the MD Controller or owning JS preflight returns its nearest existing
  scope, repair, or authorization action before provider submission
- **AND** it creates no trial result, provider attempt, acceptance, or
  substitute request

#### Scenario: Trial observations cannot accept a page or prove a capability

- **WHEN** every bounded observation for a submitted sample appears favorable
- **THEN** the result records only the observation and references the existing
  Complete Page Review evidence and decision path
- **AND** it does not mark the page accepted, assert a provider guarantee, or
  enable a native transport field

#### Scenario: A Work Request does not bypass existing content or Style Master decisions

- **WHEN** an authorized fresh probe has not received its exact narrative-plan
  confirmation or has no accepted current Style Master selection
- **THEN** the existing owner returns its current confirmation or Style Master
  action before raw planning or provider submission
- **AND** the Work Request does not create a substitute source, selection,
  generated Style Master authorization, grant, attempt, or acceptance
### Requirement: Page Image provider identity preserves registered semantics and separated lineage

For a current Page Image slide with a selected `VISUAL IDENTITY`, the selected
Pure or Framed adapter SHALL retain both the exact normalized registered role
clause and one path-free identity lineage projection in its raw contract. The
projection SHALL contain exactly `profile`, `role`, `reference_sha256`,
`role_clause_sha256`, `subject_class`, `identity_subject_count`, and
`subject_restrictions`. Profile, role, and subject-class values SHALL be
non-empty lower-kebab identifiers; both digest values SHALL be lowercase
64-character SHA-256 values; identity-subject count SHALL be exactly `one`;
and subject restrictions SHALL be the supported value already bound to the
current source receipt and identity resolution.

Before hashing the raw contract, constructing provider input, publishing a raw
plan, deriving authorization scope, or performing provider work, the selected
adapter SHALL validate that the identity projection and role clause are either
both `null` or both present, that the projection has the exact shape and value
types above, and that `role_clause_sha256` equals the SHA-256 of the exact
normalized UTF-8 role-clause text. Missing, extra, malformed, asymmetric, or
digest-mismatched identity facts SHALL produce a non-bypassable integrity
hard-stop at the existing provider-free planning checkpoint. Recovery SHALL
repair the owning source, resolver, or adapter defect and rerun that same
checkpoint; no waiver, fallback identity, partial plan, authorization, or
provider request SHALL be created.

When identity is present, the adapter-owned canonical provider input SHALL
contain one `visual.identity` record with exactly `profile`, `role`,
`subject_class`, `identity_subject_count`, `subject_restrictions`, and the exact
`role_clause` from the validated raw contract. It SHALL contain no identity
reference path, `reference_sha256`, `role_clause_sha256`, or other
lineage-only field. When identity is absent, the canonical provider input SHALL
contain `visual.identity: null` and SHALL carry no identity role clause for
that page. Pure and Framed SHALL use the same provider-facing identity shape,
while retaining their existing workflow-specific contracts.

The current transport SHALL submit the exact immutable adapter-owned provider
input and the already bound per-page identity reference bytes without rereading
the registry or adding, removing, or rewriting identity text. A change to the
registered role clause SHALL change the affected compiled provider-input
digest and route prior exact plans, grants, generated pages, and review evidence
through the existing Generated Image Rebuild path. Deterministic contract
validity SHALL not establish visual compliance or acceptance; Complete Page
Review remains the authority for the actual provider result.

#### Scenario: Pure compiles an exact semantic identity

- **WHEN** a valid current Pure slide selects a registered identity role
- **THEN** its raw contract retains the exact clause and lineage projection,
  and its canonical provider input contains the six semantic identity fields
  including that exact clause
- **AND** the provider-facing identity contains no SHA-256 field or physical
  path

#### Scenario: Framed compiles the same identity shape without weakening its own contract

- **WHEN** a valid current Framed slide selects a registered identity role
- **THEN** its canonical provider input uses the same six-field semantic
  identity shape as Pure
- **AND** its existing protected composition, source restriction, exclusive
  header reservation, and canonical-byte invariants remain required

#### Scenario: A page without identity remains explicitly null

- **WHEN** a valid current Pure or Framed slide has no selected
  `VISUAL IDENTITY`
- **THEN** its raw identity projection and role clause are both `null`, and its
  canonical provider input contains `visual.identity: null`
- **AND** no identity clause or per-page identity reference bytes are added for
  that slide

#### Scenario: A mismatched clause and projection stop before plan publication

- **WHEN** a raw contract has only one of identity projection or role clause,
  or the exact clause digest differs from `role_clause_sha256`
- **THEN** the selected adapter hard-stops at provider-free planning before it
  hashes or publishes a current plan or authorization scope
- **AND** it creates no provider request, fallback identity, waiver, state
  mutation, or partial derived publication

#### Scenario: Projection shape drift is rejected

- **WHEN** an identity projection has a missing or extra key, a non-lowercase
  digest, an unsupported count or restriction, or a malformed identifier
- **THEN** provider-free planning rejects the raw contract at the same adapter
  checkpoint
- **AND** a valid sibling page or historical projection cannot substitute for
  the invalid identity

#### Scenario: Transport preserves the adapter-owned identity bytes

- **WHEN** an authorized identity-bearing Pure or Framed item reaches the
  current provider submitter
- **THEN** the submitted prompt is byte-for-byte the adapter's bound canonical
  provider input and the bound per-page identity reference is attached
- **AND** submit does not reread the registry, reconstruct the identity, or add
  a digest or path to the prompt

#### Scenario: Role-clause drift invalidates exact generated work

- **WHEN** a registered role clause changes and the affected slide is compiled
  again with otherwise unchanged current inputs
- **THEN** its compiled provider-input digest changes and prior exact raw work
  is not current for that request
- **AND** the existing owner preserves historical evidence and returns the
  fresh-plan, authorization, generation, and review path rather than patching
  derived artifacts

#### Scenario: A retained projection-only plan cannot submit after the compiler cutover

- **WHEN** a current stored identity-bearing plan was compiled with the former
  projection-only provider identity and is presented for authorization or
  generation under the semantic-identity compiler
- **THEN** current-plan preflight rejects the retained plan as stale before a
  grant, attempt, or provider request can use it
- **AND** the owner preserves the retained records for audit and returns the
  existing fresh-plan and Generated Image Rebuild route

#### Scenario: A valid prompt still requires visual review

- **WHEN** a provider result was produced from a locally valid semantic
  identity contract
- **THEN** Complete Page Review still determines whether the profile is
  visually consistent and acceptable
- **AND** the clause/digest check alone does not assert provider compliance or
  accept the generated page
