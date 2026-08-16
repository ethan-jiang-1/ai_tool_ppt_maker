## Purpose

Define retained visual-style primitives used by Page Image Workflow raw profiles and
readiness. They do not create a separate production route.

## Requirements

### Requirement: Style Master planning is scoped to the current Page Image Workflow

The Style Master owner SHALL resolve exactly one current
`page-image-workflow` authoring draft and matching state-owned
`production_identity` record
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
revalidate the plan/head, PNG candidate bytes and provenance, grant/attempt
chain
where generated, visual/source context, workflow, and previous selection
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

### Requirement: Style Master binds one selected Image2 capability profile

Before publishing a generated-candidate plan, the Style Master owner SHALL
resolve one confirmed current Run Bundle Image2 provider profile and select
exactly its `style-master-text-generation` operation. The selected operation
SHALL bind the profile identifier and digest, endpoint profile, route identity,
operation, model, prompt-budget limit, and prompt-budget unit into the canonical
candidate generation profile. Its existing generation-profile digest SHALL
continue to bind the immutable plan, grant, provider request, attempt,
generated provenance, selection, and current-selection evaluation; no State or
inspection copy SHALL become a second profile authority.

Provider-free planning SHALL require neither an API key nor a base URL. Before
creating or replaying a generated-candidate grant, the owner SHALL re-resolve
the source/compiler facts and require the non-secret
`IMAGE2_PROVIDER_PROFILE_ID` runtime selector to exactly match the plan-bound
profile identifier. Generation SHALL repeat that match and current prompt
preflight before a new `claimed` attempt, then retain the existing claimed-
before-credential-initialization and submitted-before-provider-call order.
Missing credentials after claim remain the existing resumable pre-submit
condition; no profile failure may become a submitted attempt or remote known
failure.

A missing, pending, malformed, unconfirmed, stale, or runtime-mismatched profile
is a non-bypassable hard-stop with one owning source/environment repair action.
Changing profile identifier, endpoint profile, route, model, operation, limit,
unit, or confirmed source digest SHALL make former current work stale and
require the existing successor-plan and exact authorization path. Immutable
history remains attributable through its own recorded digests; an unresolved
submitted candidate retains only its existing abandonment path and SHALL not be
reinterpreted or resubmitted under the new profile.

#### Scenario: Style Master plan binds its operation profile

- **WHEN** a confirmed profile supplies a valid
  `style-master-text-generation` operation
- **THEN** the generated-candidate plan's generation-profile digest binds that
  exact profile, route, model, operation, limit, and unit
- **AND** provider-free planning reads no credential, environment URL, remote
  result, or model-alias default to establish those facts

#### Scenario: Runtime selector mismatch stops before a grant

- **WHEN** a current Style Master plan is presented for authorization while
  `IMAGE2_PROVIDER_PROFILE_ID` is absent, malformed, or differs from its bound
  profile identifier
- **THEN** authorization hard-stops before grant publication, attempt claim,
  credential initialization, or provider work
- **AND** it returns the one environment/profile repair action without a waiver,
  fallback route, or inferred identity

#### Scenario: Profile drift requires a successor without rewriting history

- **WHEN** a confirmed operation changes after an unsubmitted or selected Style
  Master plan was created
- **THEN** current evaluation treats the former generation-profile binding as
  stale and uses the existing successor planning and selection path
- **AND** it does not patch the old plan, grant, selection, provenance, or
  candidate bytes or make them current under the new profile

#### Scenario: Unresolved submitted candidate preserves its cost boundary

- **WHEN** the profile changes while an exact Style Master attempt remains
  submitted without a provable terminal outcome
- **THEN** the existing exact abandonment requirement remains the only path
  before a successor can advance
- **AND** profile repair does not retry, relabel, migrate, or submit that
  candidate through another route

### Requirement: Style Master prompt admission uses the selected exact budget

The Style Master compiler SHALL deterministically serialize its existing
provider brief, preserve the authored intent and compact semantic summary
without truncation, and evaluate those final exact prompt bytes under two
separate bounds before publishing a plan: the Harness-wide 32,768 UTF-8-byte
compiler safety ceiling and the selected operation's positive prompt budget.
It SHALL NOT retain a Harness-wide fixed 4,000-byte provider default or special
branch for 4,000, 16,000, or any other limit.

For `utf8-bytes`, the measured value SHALL be the final serialization's UTF-8
byte length. For `utf16-code-units`, it SHALL be the ECMAScript string length
after fatal UTF-8 decoding. For `unicode-code-points`, it SHALL be the number
of values produced by ECMAScript string iteration after fatal UTF-8 decoding,
so one valid surrogate pair counts once. Admission SHALL require measured value
less than or equal to the selected limit and SHALL measure neither authored
source length, an intermediate object, nor the outer HTTP request body.

The owner SHALL repeat the same exact-byte/profile evaluation before
authorization and before a new attempt claim. A safety or capability overflow
SHALL preserve prior evidence and hard-stop locally before a plan, grant,
attempt, provider request, or provider initialization, with the measured value,
limit, unit, operation, and one source/profile repair action when safe. It SHALL
not truncate, summarize further, switch a route, retry, or record a provider
known failure.

#### Scenario: Arbitrary declared limits use one evaluator

- **WHEN** otherwise identical confirmed profiles declare limits of 4,000,
  16,000, and 12,347 in the same count unit
- **THEN** Style Master admits or rejects the exact brief by ordinary
  `measured <= limit` comparison for each profile
- **AND** no declared number selects a provider-specific code path or fallback

#### Scenario: Exact boundary and one-over are deterministic

- **WHEN** one final Style Master prompt measures exactly the selected limit
  and another measures one unit more under the same profile
- **THEN** the exact-boundary prompt is eligible for plan publication and the
  one-over prompt hard-stops before publication
- **AND** neither prompt is truncated or measured from an intermediate source

#### Scenario: Count units distinguish multilingual text exactly

- **WHEN** ASCII, CJK, BMP emoji, and non-BMP emoji occur in final canonical
  Style Master prompt bytes
- **THEN** each declared unit applies its exact UTF-8 byte, UTF-16 code-unit, or
  Unicode-code-point algorithm
- **AND** the owner does not treat an ambiguous `chars` label or token estimate
  as a supported unit

#### Scenario: Transport receives the admitted Style Master bytes

- **WHEN** an authorized current Style Master candidate reaches submission
- **THEN** transport sends the exact plan-bound compiled prompt and selected
  operation model after the same profile preflight
- **AND** it does not recompile, trim, project, or replace the prompt at submit
  time

### Requirement: Style Master binds one nearest legal next for source/config preconditions

Before or during provider-free `style-master inspect` / `style-master plan`
scope resolution, when the canonical Page Source, Visual Language, or
Presentation source fails its precondition, the Style Master owner SHALL
report the producer-issued source/config problem fact (per `diagnostic-facts`)
with one nearest legal next action: repair the failing source through its
owner, then rerun the same command. The owner SHALL NOT return a next that
re-enters the same command with the same failed precondition, SHALL NOT
classify a known source/config defect as a lifecycle artifact or internal
defect, and SHALL NOT invent a Style Master recovery story for a fact it does
not own. The Style Master owner SHALL consume the producer fact; it SHALL NOT
rewrite the source fact or claim source ownership.

#### Scenario: Inspect fails on an invalid registry without a self-loop

- **WHEN** `style-master inspect` fails on an invalid selected Visual
  Language registry record
- **THEN** its next names the registry repair and rerun of inspect
- **AND** it does not return an `artifact`/`inspect` action that has the same
  failed precondition

#### Scenario: Plan fails on a presentation package defect

- **WHEN** `style-master plan` fails because a presentation package file is
  missing or malformed
- **THEN** its next names the exact package source repair
- **AND** it does not call the defect internal or create a Style Master
  lifecycle story

### Requirement: Style Master provider operations share the restricted startup environment

The current Style Master authorize and generate entries SHALL resolve their
Image2 runtime facts through the same shared restricted startup loader as
Page Image (`shared/image2/startup_env.mjs`) with the same fixed precedence:
explicit process environment first, the selected deck `.env` filling only
missing declared keys, then the project/cwd `.env` filling only keys still
missing. The loader SHALL read only the declared runtime keys
(`IMAGE2_API_KEY`, `IMAGE2_BASE_URL`, `IMAGE2_PROVIDER_PROFILE_ID`), SHALL NOT
overwrite explicit environment values, and SHALL NOT output values or
secrets. Style Master and Image2 therefore share one startup source and
precedence; provider-free Style Master planning SHALL continue to require
neither an API key nor a base URL and SHALL NOT load dotenv configuration.

A missing, invalid, or profile-mismatched runtime fact SHALL hard-stop before
grant publication, attempt claim, credential initialization, or provider
request, with the existing secret-safe owner repair action; it SHALL NOT relax
profile identity, infer a fallback, or produce a provider side effect.

#### Scenario: Style Master authorize uses the deck .env profile

- **WHEN** a current exact run's deck `.env` supplies
  `IMAGE2_PROVIDER_PROFILE_ID` while the shell does not
- **THEN** Style Master authorize resolves the same profile identity through
  the shared loader and continues to its existing grant preconditions
- **AND** provider-free planning remains credential-free and dotenv-free

#### Scenario: Style Master mismatch keeps its hard-stop

- **WHEN** the resolved runtime profile ID differs from the plan-bound profile
- **THEN** Style Master authorization hard-stops before grant publication with
  the existing environment repair action
- **AND** no attempt claim, credential initialization, or provider request
  occurs
