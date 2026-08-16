# Environment Check Specification (delta)

## MODIFIED Requirements

### Requirement: Zero-dependency runtime check

`scripts/00-setup/env-check.mjs` SHALL have zero static npm dependencies. Its
pre-install closure contains only Node built-ins, shared CLI bootstrap/error
helpers, and the pure executable inventory; those helpers import neither a
production adapter nor an npm dependency. It SHALL remain runnable before
`npm install` so it can diagnose the Node/npm/package foundation. It MAY
dynamically import the installed Framed runtime only after package presence
checks establish npm dependencies; missing packages are normal check failures
rather than load failures. `ppt_flow doctor` remains the Commander-based normal
command after installation, while direct env-check is the documented recovery
command.

Base runtime/font inspection is owned by the import-safe `00-setup` interface,
which SHALL NOT import a provider implementation. The direct adapter and root
doctor may lazily call the Page Image Workflow raw-readiness diagnostic only
after prerequisites pass and raw generation is explicitly selected. The
provider-free base scope SHALL not load provider implementation.

#### Scenario: Run without node_modules

- **WHEN** `node scripts/00-setup/env-check.mjs` runs in a fresh directory with no `node_modules/`
- **THEN** the script executes and emits actionable missing-package results
- **AND** it does not fail during top-level module loading

#### Scenario: Base mode does not initialize a provider

- **WHEN** direct `00-setup` env-check runs without raw generation selected
- **THEN** no provider or credential implementation is loaded while local Framed readiness remains checkable

### Requirement: API key verification

In the Image2-inclusive scope, the env check SHALL verify that image-generation
credentials can resolve at least one usable API key, consistent with
`resolveVendors` / Image2 contract:

- **Shared key path:** non-empty `IMAGE2_API_KEY`.

When no shared key is available, `api_key` SHALL fail the Image2-inclusive
verdict. Fix text SHALL name `IMAGE2_API_KEY`. The provider-free base scope
SHALL omit this check and SHALL not load or require the key for readiness.

#### Scenario: Canonical IMAGE2 key

- **WHEN** `.env` contains non-empty `IMAGE2_API_KEY`
- **AND** the Image2-inclusive scope is selected
- **THEN** `api_key` passes and detail identifies `IMAGE2_API_KEY`

#### Scenario: Missing key

- **WHEN** no `IMAGE2_API_KEY` is set
- **AND** the Image2-inclusive scope is selected
- **THEN** `api_key` fails and fix names `IMAGE2_API_KEY`

#### Scenario: Missing key does not affect base mode

- **WHEN** no `IMAGE2_API_KEY` is set and env-check runs in the provider-free
  base scope
- **THEN** no `api_key` check is emitted
- **AND** the missing key does not affect base READY

### Requirement: Image API base URL is a hard requirement

In the Image2-inclusive scope, the env check SHALL require a resolvable single
image API endpoint configuration via a non-empty `IMAGE2_BASE_URL` that passes
the same one-endpoint normalization used by current Page Image production
operations. A value containing a comma SHALL be malformed configuration,
rather than a list of endpoints.

When none is set or the value is malformed, `image_base_url` SHALL be **`fail`**
and the Image2-inclusive verdict SHALL be NOT READY. The check SHALL NOT claim
a silent default endpoint when URL is unset, split a configured value, or
treat that value as a failover list. Fix text SHALL name `IMAGE2_BASE_URL`. The
provider-free base scope SHALL omit this check. A failed `image_base_url`
check SHALL prevent `--smoke` or `--probe-vendors` from starting provider
network work.

#### Scenario: Canonical IMAGE2 base URL

- **WHEN** `.env` contains `IMAGE2_BASE_URL=https://example/v1`
- **AND** the Image2-inclusive scope is selected
- **THEN** `image_base_url` passes

#### Scenario: Comma-separated base URL fails before a live probe

- **WHEN** `IMAGE2_BASE_URL` contains a comma-separated value
- **AND** the Image2-inclusive scope with `--smoke` or `--probe-vendors` is
  selected
- **THEN** `image_base_url` is `fail` and env-check is NOT READY before a
  provider POST
- **AND** it does not submit to any portion of the configured value or present
  the value as a failover list

#### Scenario: Missing base URL fails doctor

- **WHEN** a shared key is present but no base URL variable is set
- **AND** the Image2-inclusive scope is selected
- **THEN** `image_base_url` is `fail` and env-check is NOT READY

#### Scenario: Missing base URL does not affect base mode

- **WHEN** no base URL is set and env-check runs in the provider-free base scope
- **THEN** no `image_base_url` check is emitted

### Requirement: Image2 readiness requires explicit runtime profile identity

Raw-generation environment readiness SHALL require a non-empty
`IMAGE2_PROVIDER_PROFILE_ID` whose value is one lower-kebab identifier, in
addition to the existing Image2 API key and one normalized base URL. The check
SHALL report the identifier's presence and bounded identity only; it SHALL not
expose credentials/base URL, infer route/model/budget capability from those
values, or persist the identifier as State, authorization, or provider
evidence. The provider-free base scope and Framed-local scope SHALL omit this
check and remain provider-free.

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
