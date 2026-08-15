## MODIFIED Requirements

### Requirement: Page Image Workflow compiles one auditable provider input per slide

For a current schema-declared `page-image-workflow` receipt, the selected
workflow adapter SHALL compile exactly one immutable compact provider input for
each slide from the canonical source receipt, selected visual language,
accepted Style Master facts, selected Image2 capability profile, and current
adapter policy. The final canonical UTF-8 serialization SHALL directly become
`compiled_provider_input.utf8`; its SHA-256 SHALL remain the sole compiled
provider-input digest bound through plan, authorization, request, attempt, and
invalidation. The compiled input SHALL carry the declared `image2-request`
schema and role and use no version-suffixed or alternate protocol marker.

Pure's provider input SHALL contain exactly the top-level fields `schema`,
`slide_id`, `instruction`, `design_system`, `provider_rendered_content`,
`visual`, and `page_presentation`, where `page_presentation` contains exactly
the validated selected semantic `profile`. Framed's provider input SHALL
contain exactly `schema`, `slide_id`, `instruction`, `design_system`,
`provider_rendered_content`, `subject_restrictions`,
`protected_composition`, and `visual`. Both `visual` mappings SHALL retain the
existing recipe, composition, motifs, nullable relationship, and semantic
identity role-clause projection.

The provider input SHALL NOT contain `generation_profile`, a raw contract,
profile identity/digest, presentation provenance, source path/origin,
authorization/lifecycle facts, or structured lineage fields named `sha256`,
`digest`, or `binding_sha256`. These exclusions apply to declared structured
fields and SHALL NOT scan or rewrite provider-rendered authored prose. Local
raw contracts, Core facts, generation profiles, and plan bindings SHALL retain
the complete attributable lineage required for validation without duplicating
it into prompt bytes.

For Framed, the exact current input SHALL retain the byte-exact
`FRAMED_EXCLUSIVE_HEADER_RESERVATION_INSTRUCTION`, selected normalized
protected composition without provenance, and source restrictions, while
omitting every local-header field, header-derived `context_not_to_render`
field, `protected_geometry` field, and Pure presentation profile. Independently
source-owned provider content retains its permitted literal when its spelling
matches a local header. For Pure, the input SHALL retain only the selected
whole-page semantic profile and SHALL receive no Framed composition,
restriction, or local-header fact.

The shared runtime and submitter SHALL treat the compiled input as opaque exact
bytes. They SHALL submit those bytes as `prompt`, use the model already bound
by the selected generation profile, and attach reference media through the
existing separate transport fields without deriving, projecting, trimming,
adding, removing, or recompiling prompt content.

#### Scenario: A current provider input is compiled

- **WHEN** a valid current Pure receipt reaches its selected adapter
- **THEN** it emits one immutable declared Image2 request per slide containing
  only the Pure semantic top-level fields and selected profile
- **AND** its local generation profile, presentation provenance/digests, raw
  contract, and filesystem lineage remain outside the exact prompt bytes

#### Scenario: Framed compilation binds non-rendering header context

- **WHEN** a current Framed source reaches compilation
- **THEN** its compiled declared request binds the selected non-text protected
  composition, source restrictions, and exact reservation instruction without
  a local-header field, header-literal context, provenance, or Pure profile
- **AND** independently sourced provider content may retain matching spelling,
  and the request does not create a second or historical contract

#### Scenario: Transport cannot rewrite an adapter input

- **WHEN** the current transport receives an authorized compiled declared
  request with Style Master and optional identity references
- **THEN** it submits byte-for-byte `compiled_provider_input.utf8` and keeps
  references in their existing separate request fields
- **AND** it does not derive another prompt, inject the generation profile,
  reread a source, or rewrite schema, role, or protocol value

#### Scenario: Semantic identity remains provider-visible without lineage

- **WHEN** a current Pure or Framed page selects a registered identity role
- **THEN** the compact `visual.identity` retains its exact semantic role clause
  and existing six-field provider-facing shape
- **AND** it contains no identity path, reference digest, role-clause digest,
  profile lineage, or transport-time reconstruction

### Requirement: Pure raw work binds one selected deck visual system

Every current Pure Page Image Core slide, raw contract, provider-input
inspection projection, and raw-plan item binding SHALL retain the exact
`page_presentation_sha256` of the validated Pure presentation projection
selected for that page's normalized Page Class. The ordinary and progressive
raw-plan validators SHALL enforce that same per-page binding, which MAY differ
across Page Classes in one plan. The Pure raw contract SHALL retain the
selected page class, profile identity, binding digest, provenance, and complete
semantic profile required to establish lineage.

The compact compiled input SHALL describe the selected profile's deterministic
typography hierarchy, Style-Master-derived colour use, zones, whitespace, and
allowed layout families only as
`page_presentation: { profile: <semantic-profile> }`. It SHALL contain no page
class, profile identifier, source provenance, presentation digest, content
literal added by the profile, or local compositor. The presentation projection
remains source/configuration input, not a lifecycle selector, acceptance
record, provider authorization, or pixel-quality proof. Pure's provider page
remains the complete page evidence; Framed receives no Pure presentation
profile or binding.

#### Scenario: Every Pure page receives the same visual-system binding

- **WHEN** a current Pure full plan contains pages from one or more normalized
  Page Classes
- **THEN** each local raw-plan binding retains that page's exact selected
  presentation digest while its compiled prompt contains only the corresponding
  semantic profile
- **AND** per-slide content and visual-language facts remain independently
  bound and no deck-wide digest is copied into the prompt

#### Scenario: Pure has no local typography renderer

- **WHEN** a current Pure provider input is compiled with its selected semantic
  presentation profile
- **THEN** it instructs the provider to render the entire page, including
  provider-visible text
- **AND** it does not create a Framed Text Frame, local overlay, protected
  geometry, or second review/acceptance surface

### Requirement: Current provider-input inspection and human-facing projections are derived

Provider-free current planning SHALL materialize a deterministic local
inspection projection for the exact plan. It binds the plan, ordered stable IDs,
compiled provider-input and raw-contract digests, source/selection/generation-
profile lineage, selected Image2 profile identifier/digest, operation,
endpoint/route/model identity, prompt-budget limit/unit, exact measured prompt
value, and the request contract needed for deliberate local inspection. The
artifact may contain the selected adapter's exact provider input locally but
SHALL exclude credentials, authorization headers, base URL, environment values,
provider responses, and image data URLs. It is rebuildable and may not serve as
a selector, authorization assertion, plan replacement, capability source, or
provider request source.

Every rebuildable Page Image projection intended for human browsing SHALL use
the current full-plan position and stable ID as `NN_slideID.png`, with the
one-based position padded to at least two digits. A Pilot subset retains the
position from the complete current plan rather than renumbering its subset.
The display name does not change the stable ID or any plan, authorization,
attempt, provenance, review, receipt, profile, or budget binding.

Detailed prompt prose and operation-budget measurements SHALL remain in the
existing local Agent inspection surfaces and outside Human Navigation. A
derived inspection edit or deletion SHALL not alter the source profile,
compiled bytes, plan, grant, attempt, or provider work; only current
provider-free planning may rebuild it.

#### Scenario: Inspection is local evidence, not a provider override

- **WHEN** a current plan publishes its provider-input inspection projection
- **THEN** the projection follows exact plan order and shows each bound input's
  operation, measured value, limit, unit, profile digest, and compiled-input
  digest
- **AND** a caller cannot select a capability, submit, authorize, or repair
  source/environment facts from the projection

#### Scenario: A Pilot image keeps its full-plan ordinal

- **WHEN** a Pilot contains one slide from position ten in a current full plan
- **THEN** its human-facing projection uses the position-ten ordinal and stable
  slide ID
- **AND** the subset does not renumber it to position one or expose prompt prose
  or profile capability as Human Navigation content

## ADDED Requirements

### Requirement: Page Image provider work binds one selected capability profile

Before compiling or publishing a current Page Image raw plan, the selected
adapter SHALL resolve one confirmed current Run Bundle Image2 provider profile
and select exactly `page-image-reference-generation`. It SHALL bind the profile
identifier and full profile digest, endpoint profile, route identity, operation,
model, prompt-budget limit, and prompt-budget unit into the existing canonical
Page Image generation profile. The generation-profile digest SHALL remain the
plan's `provider_profile_sha256`; each item and request SHALL retain the existing
generation-profile digest binding, and the complete binding map SHALL remain in
the authorization-scope and attempt/request lineage. No State field, derived
inspection, or second authorization record SHALL duplicate or replace that
authority.

Planning SHALL remain provider-free and require neither credentials nor a base
URL. Before creating or replaying a Pilot/Expansion grant, the selected adapter
SHALL re-resolve the source, compiler, generation profile, and final budget and
require the non-secret `IMAGE2_PROVIDER_PROFILE_ID` runtime selector to exactly
match the plan-bound profile identifier. Generation SHALL repeat those exact
checks and resolve credential/base-URL readiness before a new attempt claim or
provider initialization. Submit SHALL then use the already bound model and
prompt bytes without rereading the profile source.

A missing, pending, malformed, unconfirmed, stale, cross-operation, or runtime-
mismatched profile is a non-bypassable hard-stop protecting attributable
provider work. It SHALL return one owning source/environment repair action and
create no partial derived publication, plan, grant, attempt, provider request,
or remote failure. It SHALL not infer capability from an API key, endpoint,
model alias, inspection artifact, prior lifecycle record, smoke result, or
provider error.

Changing profile identifier, endpoint profile, route, model, operation, limit,
unit, or confirmed source digest SHALL change the generation-profile/plan/
authorization identity and route former current work through the existing
fresh-plan and Generated Image Rebuild path. Existing plans, grants, submitted
attempts, provider bytes, reviews, final media, and delivery remain immutable
historical evidence. An unresolved submitted attempt retains only the existing
exact reconciliation path and SHALL not be resubmitted through the new profile.

#### Scenario: Pure and Framed bind the same Page Image operation contract

- **WHEN** current Pure and Framed scopes resolve the same confirmed provider
  profile
- **THEN** both generation profiles bind the exact
  `page-image-reference-generation` capability facts and full profile digest
- **AND** each adapter retains its own prompt schema without selecting another
  operation or inferring a route from its workflow

#### Scenario: Runtime mismatch stops before authorization

- **WHEN** a current Pilot or Expansion is presented for authorization while
  `IMAGE2_PROVIDER_PROFILE_ID` is absent, malformed, or differs from the
  plan-bound profile identifier
- **THEN** authorization hard-stops before grant publication, attempt claim,
  credential initialization, or provider work
- **AND** it returns one environment/profile repair action without a waiver,
  automatic fallback, or inferred selector

#### Scenario: Capability profile drift invalidates exact work

- **WHEN** any selected profile capability fact changes after a plan or
  accepted provider page was produced
- **THEN** current planning produces a different exact generation-profile and
  plan identity and returns the existing fresh-plan/rebuild path
- **AND** it does not patch, migrate, reinterpret, or reuse former provider
  work as current under the changed profile

#### Scenario: Profile failure is not a provider failure

- **WHEN** local profile resolution or runtime matching fails before a Page
  Image attempt is claimed
- **THEN** no attempt or remote `known_failure` is written and no provider
  client is initialized
- **AND** repairing the owning source/environment and rerunning the same
  checkpoint is the only legal continuation

### Requirement: Page Image prompt admission enforces exact selected budgets

Each selected adapter SHALL evaluate its final canonical
`compiled_provider_input.utf8` under two separate bounds before publishing a
raw plan: the Harness-wide 32,768 UTF-8-byte compiler safety ceiling and the
selected `page-image-reference-generation` prompt budget. It SHALL repeat the
same exact-byte/profile evaluation before authorization, provider
initialization, grant, and attempt claim. It SHALL measure neither Page Design
System text, identity clause text, a source file, an intermediate request
object, nor the outer HTTP JSON body as a substitute for the final prompt.

For `utf8-bytes`, the measured value SHALL be the final prompt's UTF-8 byte
length. For `utf16-code-units`, it SHALL be the ECMAScript string length after
fatal UTF-8 decoding. For `unicode-code-points`, it SHALL be the number of
values produced by ECMAScript string iteration after fatal UTF-8 decoding, so
one valid surrogate pair counts once. A final prompt SHALL be admitted only
when its measured value is less than or equal to the selected positive limit
and its UTF-8 byte length is at most the separate safety ceiling.

An overflow is a local deterministic hard-stop. The bounded diagnostic SHALL
identify the operation, measured value, limit, unit, and one provider-profile
or source/configuration repair action without exposing prompt prose or
credentials. The owner SHALL preserve historical evidence and SHALL NOT
truncate, summarize, compress, split, reroute, retry, create a waiver, or
record the condition as a provider `known_failure`.

#### Scenario: Multiple limits remain data-driven

- **WHEN** otherwise identical current profiles declare 4,000, 16,000, and
  12,347 in the same count unit
- **THEN** Pure and Framed apply the same ordinary `measured <= limit`
  admission rule to their final exact prompt bytes
- **AND** no number selects a special provider, compiler, fallback, or error
  branch

#### Scenario: Exact boundary passes and one-over fails

- **WHEN** one compact final prompt measures exactly the selected limit and an
  otherwise valid prompt measures one unit more
- **THEN** the exact-boundary plan remains eligible and the one-over plan
  hard-stops before derived publication or lifecycle authority
- **AND** the adapter does not truncate a design system or identity role clause
  to make either prompt fit

#### Scenario: Multilingual prompts use the declared count unit

- **WHEN** ASCII, CJK, BMP emoji, and non-BMP emoji occur in a final compact
  provider prompt
- **THEN** the selected exact UTF-8 byte, UTF-16 code-unit, or Unicode-code-
  point algorithm determines admission
- **AND** the adapter does not accept ambiguous `chars`, token estimates, or
  source-length approximations

#### Scenario: Safety and capability bounds remain separate

- **WHEN** a final prompt fits the selected remote budget but exceeds 32,768
  UTF-8 bytes, or fits the safety ceiling but exceeds the selected remote
  budget
- **THEN** the applicable independent bound hard-stops before plan publication
- **AND** neither bound is relabeled as the other or inferred from a provider
  response

### Requirement: Compact compiler cutover preserves old Page Image evidence

Current adapter, authorization, and generation preflight SHALL always rebuild
the complete expected provider-input and capability-profile facts from current
owners. A stored plan whose formerly compiled prompt or generation-profile
digest differs from that expected current plan SHALL be stale before a new
batch, grant, attempt, provider initialization, or submission. The owner SHALL
preserve its immutable history and return the existing fresh-plan / Generated
Image Rebuild action without parsing, projecting, normalizing, or transporting
the former prompt shape.

The cutover SHALL add no old prompt-schema reader, dual writer, field patch,
automatic migration, or compatibility authorization. The existing bounded
historical progressive validator for an earlier declared binding omission MAY
continue only its current reconciliation/head-lineage role; it SHALL receive no
profile/prompt parser and cannot make a former plan current or eligible for
provider work, reuse, review, finalization, or delivery.

If an exact former plan has a persisted unresolved submitted attempt, its
existing no-resubmit reconciliation action SHALL remain the earliest legal
action. Otherwise a fresh compact/profile-bound plan MAY advance through the
existing successor head CAS with the former plan retained as predecessor audit
history. Missing profile source SHALL be reported first as the independent
source prerequisite; after repair, the same checkpoint MAY then report the
stale plan and rebuild action.

#### Scenario: Former metadata-heavy prompt cannot submit

- **WHEN** authorization or generation is requested from a retained plan whose
  exact compiled bytes used the former metadata-heavy prompt shape
- **THEN** current preflight rejects it as stale before a grant, attempt, or
  provider request and returns the fresh compact-plan route
- **AND** it does not derive a compact prompt from that plan, patch its digest,
  or submit either former or replacement bytes under its authorization

#### Scenario: Former profile plan remains immutable history

- **WHEN** a retained plan binds the former fixed model/profile while current
  source declares a confirmed capability profile
- **THEN** the owner preserves the retained plan and compares only against the
  freshly compiled current expected plan
- **AND** it does not add a former-profile schema reader, mutate the record, or
  adopt it as current capability evidence

#### Scenario: Unresolved former attempt keeps reconciliation precedence

- **WHEN** a former current progressive plan has an exact unresolved submitted
  attempt during cutover
- **THEN** the owner returns only its existing reconciliation action before
  successor head advancement
- **AND** compact compilation does not resubmit, abandon automatically, reuse
  media, or erase the attempt's attributable cost lineage
