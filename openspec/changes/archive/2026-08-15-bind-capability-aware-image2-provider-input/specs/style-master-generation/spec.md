## ADDED Requirements

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
