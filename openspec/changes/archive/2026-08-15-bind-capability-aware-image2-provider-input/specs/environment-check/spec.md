## ADDED Requirements

### Requirement: Image2 readiness requires explicit runtime profile identity

Raw-generation environment readiness SHALL require a non-empty
`IMAGE2_PROVIDER_PROFILE_ID` whose value is one lower-kebab identifier, in
addition to the existing Image2 API key and one normalized base URL. The check
SHALL report the identifier's presence and bounded identity only; it SHALL not
expose credentials/base URL, infer route/model/budget capability from those
values, or persist the identifier as State, authorization, or provider
evidence. Base and Framed-local modes SHALL omit this check and remain
provider-free.

The installed exact-run doctor SHALL resolve the selected Run Bundle's
confirmed profile through its owning source validator and require the runtime
identifier to exactly equal that profile's `profile_id`. Direct pre-install
`env-check` has no Run Bundle authority and SHALL limit its result to presence
and syntax; it SHALL not locate a Deck or claim source/profile equality. The
direct entry SHALL preserve zero-static-npm-dependency startup and SHALL not
import the YAML profile parser, production adapter, or provider implementation
before package prerequisites pass.

A missing, malformed, or exact-run-mismatched identifier SHALL make selected
raw-generation readiness NOT READY with one environment/profile repair action
before a smoke/probe request. The check SHALL not select a fallback profile,
rewrite the source, infer identity from a model alias or endpoint, or authorize
later production work.

#### Scenario: Exact-run doctor matches source and runtime identity

- **WHEN** installed raw-generation doctor receives an exact current run with
  a confirmed profile and matching `IMAGE2_PROVIDER_PROFILE_ID`
- **THEN** the profile-identity readiness check passes alongside the existing
  credential and base-URL checks
- **AND** it does not claim that the prompt fits, a provider route is remotely
  verified, or generation is authorized

#### Scenario: Runtime profile mismatch fails before live diagnosis

- **WHEN** an exact current run selects one confirmed profile but the runtime
  identifier is missing, malformed, or different and `--smoke` or
  `--probe-vendors` is requested
- **THEN** raw-generation readiness is NOT READY before any provider POST
- **AND** it returns the profile/environment repair action without fallback,
  source mutation, or credential disclosure

#### Scenario: Direct pre-install check remains unbound

- **WHEN** direct `env-check` runs in raw-generation mode before npm packages
  or without an exact Run Bundle
- **THEN** it can report runtime profile-ID presence/syntax using its
  zero-dependency path
- **AND** it does not load YAML, locate a Deck, compare a source profile, or
  present the result as normal exact-run readiness

#### Scenario: Base and Framed-local modes remain profile-free

- **WHEN** environment check runs without raw generation selected
- **THEN** it omits API key, base URL, and provider-profile-ID checks
- **AND** a missing runtime profile identity does not affect local foundation
  or Framed composition readiness

### Requirement: Live probes do not establish prompt capability

`doctor --smoke` and `--probe-vendors` SHALL retain their existing bounded live
submission counts and connectivity-only evidence boundary when a runtime
profile identity is present. Success SHALL NOT confirm the Run Bundle profile's
route, model alias resolution, operation, prompt limit, count unit, production
prompt fit, authorization, media compatibility, or later provider outcome. A
live failure SHALL NOT rewrite, downgrade, or infer the profile source.

The exact Style Master or Page Image provider-free plan remains the only
deterministic evaluator of its final prompt against the selected operation
profile. Live diagnostic requests SHALL remain minimal and SHALL NOT send a
production compact prompt, inspect a production Bundle to build one, or create
a plan, grant, attempt, capability record, or recovery route.

#### Scenario: Successful smoke remains connectivity-only

- **WHEN** a live smoke request succeeds under a syntactically valid runtime
  profile identity
- **THEN** human and structured evidence continue to qualify success as
  endpoint/credential connectivity only
- **AND** neither result confirms a 4K, 16K, or other prompt budget or permits
  production work

#### Scenario: Probe failure cannot become capability source

- **WHEN** a live probe receives a prompt-related, route-related, or other
  provider failure
- **THEN** the diagnostic retains its existing bounded connectivity failure
  handling
- **AND** it does not parse that response into a limit/unit/profile, mutate the
  Run Bundle source, or create an automatic retry/fallback
