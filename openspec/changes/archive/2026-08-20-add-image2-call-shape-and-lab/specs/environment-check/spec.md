## MODIFIED Requirements

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
provider-free base scope SHALL omit this check. Environment check SHALL NOT
start provider network work in any mode.

#### Scenario: Canonical IMAGE2 base URL

- **WHEN** `.env` contains `IMAGE2_BASE_URL=https://example/v1`
- **AND** the Image2-inclusive scope is selected
- **THEN** `image_base_url` passes

#### Scenario: Comma-separated base URL fails before a live probe

- **WHEN** `IMAGE2_BASE_URL` contains a comma-separated value
- **AND** the Image2-inclusive scope is selected
- **THEN** `image_base_url` is `fail` and env-check is NOT READY
- **AND** it does not submit to any portion of the configured value or present
  the value as a failover list

#### Scenario: Missing base URL fails doctor

- **WHEN** a shared key is present but no base URL variable is set
- **AND** the Image2-inclusive scope is selected
- **THEN** `image_base_url` is `fail` and env-check is NOT READY

#### Scenario: Missing base URL does not affect base mode

- **WHEN** no base URL is set and env-check runs in the provider-free base scope
- **THEN** no `image_base_url` check is emitted

### Requirement: Environment check emits one declared current report

The environment check SHALL output a structured report with per-check status and an
overall verdict for the selected Page Image Workflow operation. It SHALL
exit 0 on READY and non-zero on NOT READY. The direct `--json` form SHALL
retain one declared current set of top-level readiness booleans and generic
check-array contract; it SHALL not expose secrets, name a Harness report
generation, or add a second incompatible report
schema. Every accepted JSON combination SHALL emit exactly one parseable JSON
document on stdout. Human Summary text SHALL be sent to stderr or represented
inside structured check evidence, never prepended/appended to stdout JSON.
Human text SHALL make clear whether it reports local or raw-generation
readiness. The declared JSON contract SHALL NOT include live-probe, smoke, or
vendors result fields.

Direct `env-check --help` SHALL list only parser-accepted arguments:
`--json` and `--operation <operation>`. `--operation` SHALL select the fixed
current Page Image readiness profile. `--smoke`, `--probe-vendors`, `--mode`,
and `--image2` SHALL be rejected with a bounded usage diagnostic and zero
provider work. `--smoke` and `--probe-vendors` SHALL name `ppt_flow probe
<run-dir>` or Lab rather than becoming silent offline aliases.

#### Scenario: Output format

- **WHEN** all checks selected by the invocation pass
- **THEN** output includes READY and exits 0

- **WHEN** any selected hard check fails
- **THEN** output includes NOT READY, lists all failures, and exits non-zero

#### Scenario: Successful smoke conclusion remains qualified

- **WHEN** a caller invokes `env-check --smoke` expecting a connectivity READY
- **THEN** the command returns a usage migration diagnostic naming
  `probe <run-dir>` or Lab
- **AND** it does not emit a smoke READY conclusion or start an Image2 POST

#### Scenario: JSON has one current shape

- **WHEN** direct `env-check --json` runs for a supported local or
  raw-generation operation
- **THEN** stdout is one document under the declared current report contract
- **AND** operation-specific behavior is represented by included offline checks
  rather than a duplicate diagnostic schema or live-probe booleans

#### Scenario: Direct help and parser agree

- **WHEN** a user reads direct `env-check --help` or passes a documented form
- **THEN** every advertised flag is accepted by the parser with its documented
  operation constraints
- **AND** no help or active documentation advertises `--image2`, `--mode`,
  `--smoke`, or `--probe-vendors` as accepted live work

#### Scenario: Retired Image2 flag is rejected safely

- **WHEN** a user passes direct `env-check --image2`
- **THEN** it returns a bounded usage diagnostic naming the operation-scoped
  replacement
- **AND** it starts no provider work or lifecycle operation

#### Scenario: Retired mode flag is rejected safely

- **WHEN** a user passes direct `env-check --mode`
- **THEN** it returns a bounded usage diagnostic naming the operation-scoped
  replacement
- **AND** it starts no provider work or lifecycle operation

#### Scenario: Retired smoke flag is rejected with migration text

- **WHEN** a user passes direct `env-check --smoke` or `--probe-vendors`
- **THEN** it returns a usage migration diagnostic naming `probe <run-dir>` or
  Lab
- **AND** it starts no Image2 network call

#### Scenario: Live JSON stdout remains parseable

- **WHEN** direct `env-check --json --smoke` or `env-check --json --probe-vendors` runs
- **THEN** the failure remains one bounded usage diagnostic without mixing
  live progress into a readiness JSON document
- **AND** no Image2 network call occurs

### Requirement: Direct environment check is a bounded recovery entry

`ppt_flow doctor` SHALL remain the normal installed-Harness diagnostic entry.
Direct `scripts/00-setup/env-check.mjs` SHALL remain runnable before npm
installation and SHALL be documented for pre-install recovery or an unavailable
main entry. It MAY report bounded local or operation-scoped readiness, but it
SHALL not locate a Deck, infer a run, create/resume a controller, begin a
production workflow, or authorize provider work.

Normal raw-generation readiness SHALL remain exact-run-bound through
`ppt_flow preflight <run-dir> --operation raw-generation` (`cli-surface` already
retired `doctor --run-dir`). Direct `env-check` MAY provide an unbound
operation-scoped report only at its pre-install/unavailable-main-entry recovery
boundary; that report is not a normal provider-readiness continuation and cannot
substitute for exact-run validation.

Default direct and unified doctor checks SHALL be offline. Environment check
SHALL make zero Image2 network calls in every mode, including raw-generation.
Successful readiness SHALL not authorize a later production action. Live
confirmed-Call-Shape connectivity belongs to `ppt_flow probe`; candidate
discovery belongs to Image2 Lab.

#### Scenario: Pre-install recovery stays available

- **WHEN** Harness npm dependencies are absent or the main entry cannot
  start
- **THEN** direct env-check reports bounded local prerequisites without loading
  an unavailable production dependency at startup
- **AND** it does not create a Deck or provider authorization

#### Scenario: Default foundation check remains offline

- **WHEN** a user requests local foundation readiness without a live probe
- **THEN** the selected doctor path performs no provider network request
- **AND** it reports a guide or owner-issued repair action rather than treating
  readiness as production permission

#### Scenario: Normal raw readiness requires its exact run

- **WHEN** the installed `ppt_flow` entry is available and raw-generation
  readiness is requested for normal work
- **THEN** the check requires the exact run before operation-scoped preflight
  work begins
- **AND** direct `env-check` is not presented as an unbound normal substitute

#### Scenario: Raw-generation preflight and doctor make zero Image2 POSTs

- **WHEN** `preflight <run-dir> --operation raw-generation` or offline `doctor`
  runs with valid local credentials and profile identity
- **THEN** it performs no Image2 network request
- **AND** READY means local presence/syntax/match only

#### Scenario: Live channel probe needs an explicit human boundary

- **WHEN** an Agent offers live Image2 diagnosis
- **THEN** it names `ppt_flow probe <run-dir>` or Lab and treats entering that
  playbook as the Work Request
- **AND** declining leaves offline env-check evidence valid and makes zero
  live calls from doctor/env-check

### Requirement: Image2 readiness requires explicit runtime profile identity

Raw-generation environment readiness SHALL require a non-empty
`IMAGE2_PROVIDER_PROFILE_ID` whose value is one lower-kebab identifier, in
addition to the existing Image2 API key and one normalized base URL. The check
SHALL report the identifier's presence and bounded identity only; it SHALL not
expose credentials/base URL, infer route/model/budget capability from those
values, or persist the identifier as State, authorization, or provider
evidence. The provider-free base scope and Framed-local scope SHALL omit this
check and remain provider-free.

The installed exact-run preflight SHALL resolve the selected Run Bundle's
confirmed profile through its owning source validator and require the runtime
identifier to exactly equal that profile's `profile_id`. Offline `doctor` SHALL
not take `--run-dir`. Direct pre-install `env-check` has no Run Bundle authority
and SHALL limit its result to presence and syntax; it SHALL not locate a Deck or
claim source/profile equality. The direct entry SHALL preserve
zero-static-npm-dependency startup and SHALL not import the YAML profile parser,
production adapter, provider implementation, or Call Shape executor before
package prerequisites pass.

A missing, malformed, or exact-run-mismatched identifier SHALL make selected
raw-generation readiness NOT READY with one environment/profile repair action.
The check SHALL not select a fallback profile, rewrite the source, infer
identity from a model alias or endpoint, authorize later production work, or
start a live probe.

#### Scenario: Exact-run doctor matches source and runtime identity

- **WHEN** installed raw-generation preflight receives an exact current run with
  a confirmed profile and matching `IMAGE2_PROVIDER_PROFILE_ID`
- **THEN** the profile-identity readiness check passes alongside the existing
  credential and base-URL checks
- **AND** it does not claim that the prompt fits, a provider route is remotely
  verified, or generation is authorized

#### Scenario: Runtime profile mismatch fails before live diagnosis

- **WHEN** an exact current run selects one confirmed profile but the runtime
  identifier is missing, malformed, or different
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

### Requirement: Exact-run readiness and its consumers share one restricted startup environment

`ppt_flow preflight <run-dir> --operation raw-generation` SHALL resolve its
Image2 runtime facts through the same restricted startup loader used by the
exact-run `image2 authorize`/`generate` and Style Master authorize/generate
entries, with the same precedence: explicit process environment first, the
selected deck `.env` filling only missing declared keys, and the project/cwd
`.env` filling only keys still missing. The loader SHALL read only declared
runtime keys (`IMAGE2_API_KEY`, `IMAGE2_BASE_URL`,
`IMAGE2_PROVIDER_PROFILE_ID`), SHALL NOT overwrite explicit environment values,
and SHALL NOT output values or secrets. A raw-generation READY result therefore
implies that the same exact run's authorized consumer can resolve the same
non-secret configuration without a shell export. Offline `doctor` SHALL NOT
take `--run-dir` and SHALL NOT become that exact-run loader entry.

#### Scenario: Doctor READY reaches the exact authorize checkpoint

- **WHEN** exact-run raw-generation preflight reports READY with the profile ID
  present in the deck `.env` and absent from the shell
- **THEN** the same exact run's `image2 authorize` resolves the same profile
  identity and proceeds to its existing grant preconditions
- **AND** it does not require the human to export the `.env` values manually

#### Scenario: Shell precedence beats deck .env

- **WHEN** the shell exports one `IMAGE2_PROVIDER_PROFILE_ID` and the deck
  `.env` declares a different one
- **THEN** preflight and authorize both resolve the explicit shell value
- **AND** the deck `.env` value never overrides it

## REMOVED Requirements

### Requirement: Live Image2 smoke states its connectivity-only evidence boundary

**Reason**: env-check cannot honestly execute a Call Shape; live confirmed
connectivity moves to `ppt_flow probe`.
**Migration**: use `ppt_flow probe <run-dir>` for declared Call Shape
connectivity; use Image2 Lab for candidate discovery.

### Requirement: Optional --smoke performs one live credential probe

**Reason**: the hardcoded generations/`gpt-image-2`/`1024x1024`/`task_id`
probe was a second truth path.
**Migration**: `ppt_flow probe <run-dir>` submits the confirmed Call Shape
once through the shared executor. Passing `--smoke` returns a usage migration
diagnostic.

### Requirement: Optional --probe-vendors reports every Image2 channel

**Reason**: one credential pair plus one confirmed Call Shape has no legal
multi-vendor walk (CLS-007 stays rejected).
**Migration**: confirmed connectivity is one `probe <run-dir>` submit; candidate
discovery is Lab. Passing `--probe-vendors` returns a usage migration
diagnostic.

### Requirement: Live probes do not establish prompt capability

**Reason**: env-check no longer performs live probes; the evidence-boundary
rule is restated on probe and Lab rather than on retired doctor flags.
**Migration**: `ppt_flow probe` success remains connectivity of the declared
Call Shape only; Lab success remains inspector-valid PNG for that trial;
neither confirms prompt budget, authorization, or generate permission.

### Requirement: Live probe binds an exact run with a pre-POST profile fence

**Reason**: live probing is no longer an env-check/doctor flag pair.
**Migration**: the pre-POST confirmed-profile fence is owned by
`cli-surface` `probe <run-dir>` and the shared executor wrappers.
