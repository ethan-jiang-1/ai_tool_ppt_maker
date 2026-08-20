## MODIFIED Requirements

### Requirement: Page Image provider work binds one selected capability profile

Before compiling or publishing a current Page Image raw plan, the selected
adapter SHALL resolve one confirmed current Run Bundle Image2 provider profile
and select exactly `page-image-reference-generation`. It SHALL bind the profile
identifier and full profile digest, endpoint profile, route identity, operation,
model, prompt-budget limit, prompt-budget unit, and the resolved page-image
Call Shape value into the existing canonical Page Image generation profile.
The generation-profile digest SHALL remain the plan's `provider_profile_sha256`;
each item and request SHALL retain the existing generation-profile digest
binding, and the complete binding map SHALL remain in the authorization-scope
and attempt/request lineage. No State field, derived inspection, Lab trial, or
second authorization record SHALL duplicate or replace that authority.

Planning SHALL remain provider-free and require neither credentials nor a base
URL. Before creating or replaying a Pilot/Expansion grant, the selected adapter
SHALL re-resolve the source, compiler, generation profile, and final budget and
require the non-secret `IMAGE2_PROVIDER_PROFILE_ID` runtime selector to exactly
match the plan-bound profile identifier. Generation SHALL repeat those exact
checks and resolve credential/base-URL readiness before a new attempt claim or
provider initialization. Submit and retrieve SHALL then use the already bound
Call Shape value, prompt bytes, and reference bytes through the shared Image2
executor without rereading the profile source or reading `_lab/`. The executor
SHALL POST to `${IMAGE2_BASE_URL}/images/${http_operation}` with the bound
encoding and `width`x`height`, retrieve via the bound `result_protocol`, and
accept media only through the current production PNG inspector, including
actual dimensions. `sync` SHALL NOT poll; a task identifier in a sync response
is the existing known-failure path. `async-poll` keeps the existing
same-invocation poll. Undeclared transport combos and unregistered result
protocols SHALL NOT reach fetch.

A missing, pending, malformed, unconfirmed, stale, cross-operation, illegal
transport combo, unregistered result protocol, or runtime-mismatched profile is
a non-bypassable hard-stop protecting attributable provider work. It SHALL
return one owning source/environment repair action and create no partial
derived publication, plan, grant, attempt, provider request, or remote failure.
It SHALL not infer capability from an API key, endpoint, model alias,
inspection artifact, prior lifecycle record, Lab trial, smoke result, or
provider error.

Changing profile identifier, endpoint profile, route, model, operation, limit,
unit, transport vector, result protocol, or confirmed source digest SHALL change
the generation-profile/plan/authorization identity and route former current work
through the existing fresh-plan and Generated Image Rebuild path. Existing
plans, grants, submitted attempts, provider bytes, reviews, final media, and
delivery remain immutable historical evidence. An unresolved submitted attempt
retains only the existing exact reconciliation path and SHALL not be
resubmitted through the new profile.

#### Scenario: Pure and Framed bind the same Page Image operation contract

- **WHEN** current Pure and Framed scopes resolve the same confirmed provider
  profile
- **THEN** both generation profiles bind the exact
  `page-image-reference-generation` capability facts, resolved Call Shape
  value, and full profile digest
- **AND** each adapter retains its own prompt schema without selecting another
  operation or inferring a route from its workflow

#### Scenario: Declared edits multipart uses that vector on submit

- **WHEN** the bound page-image transport is `edits` + `multipart` + a declared
  size and a mock transport returns a CRC-valid PNG under `json-inline-b64`
- **THEN** submit addresses `/images/edits`, sends multipart, and uses that size
- **AND** the PNG may enter the existing receipt chain
- **AND** assertions do not require a vendor product name

#### Scenario: Runtime mismatch stops before authorization

- **WHEN** a current Pilot or Expansion is presented for authorization while
  `IMAGE2_PROVIDER_PROFILE_ID` is absent, malformed, or differs from the
  plan-bound profile identifier
- **THEN** authorization hard-stops before grant publication, attempt claim,
  credential initialization, or provider work
- **AND** it returns one environment/profile repair action without a waiver,
  automatic fallback, or inferred selector

#### Scenario: Capability profile drift invalidates exact work

- **WHEN** any selected profile capability fact, including transport or
  result protocol, changes after a plan or accepted provider page was produced
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

#### Scenario: Generate does not read the Lab workspace

- **WHEN** `_lab/` contains sealed trials and `image2 generate` runs with a
  confirmed profile
- **THEN** submit uses only the validated Call Shape value from that profile
- **AND** it does not read trial files or treat a trial as authorization

#### Scenario: Shared executor retrieve matches production inspector

- **WHEN** generate and Lab are given the same Call Shape value, credentials,
  prompt bytes, and reference bytes against a mock that returns inline
  Base64 PNG
- **THEN** both retrieve the same inspector-valid PNG dimensions
- **AND** neither accepts a redirect or an unregistered retrieve dialect
