## MODIFIED Requirements

### Requirement: Image API base URL is a hard requirement

In Image2 mode, the env check SHALL require a resolvable single image API endpoint configuration via a non-empty
`IMAGE2_BASE_URL` that passes the same one-endpoint normalization used by current-v2 Image2 production
operations. A value containing a comma SHALL be malformed configuration, rather than a list of endpoints.

When none is set or the value is malformed, `image_base_url` SHALL be **`fail`** and the Image2-mode verdict
SHALL be NOT READY. The check SHALL NOT claim a silent default endpoint when URL is unset, split a configured
value, or treat that value as a failover list. Fix text SHALL name `IMAGE2_BASE_URL`. Base mode SHALL omit this check. A
failed `image_base_url` check SHALL prevent `--smoke` or `--probe-vendors` from starting provider network work.

#### Scenario: Canonical IMAGE2 base URL

- **WHEN** `.env` contains `IMAGE2_BASE_URL=https://example/v1`
- **AND** Image2 mode is selected
- **THEN** `image_base_url` passes

#### Scenario: Comma-separated base URL fails before a live probe

- **WHEN** `IMAGE2_BASE_URL` contains a comma-separated value
- **AND** Image2 mode with `--smoke` or `--probe-vendors` is selected
- **THEN** `image_base_url` is `fail` and env-check is NOT READY before a provider POST
- **AND** it does not submit to any portion of the configured value or present the value as a failover list

#### Scenario: Missing base URL fails doctor

- **WHEN** a shared key is present but no base URL variable is set
- **AND** Image2 mode is selected
- **THEN** `image_base_url` is `fail` and env-check is NOT READY

#### Scenario: Missing base URL does not affect base mode

- **WHEN** no base URL is set and env-check runs in base mode
- **THEN** no `image_base_url` check is emitted

### Requirement: Structured READY/NOT READY output

The env check SHALL output a structured report with per-check status and an overall verdict for the selected Page
Authority mode and operation. It SHALL exit 0 on READY and non-zero on NOT READY. The direct `--json` form SHALL
retain the existing `env-check-v1` top-level booleans and generic check-array contract; it SHALL not expose
secrets or add a second incompatible report schema. Every accepted JSON combination SHALL emit exactly one
parseable JSON document on stdout. Live heartbeat, progress, and human Summary text SHALL be sent to stderr or
represented inside structured check evidence, never prepended/appended to stdout JSON. Human text SHALL make
clear whether it reports local or raw-generation readiness.

For a successful `--smoke` invocation, the human conclusion SHALL qualify READY as local-prerequisite and
endpoint-connectivity evidence only. It SHALL state that production prompt fit, requested or returned media
dimensions, decoded media, async completion, and run authorization remain unverified, and SHALL NOT present
smoke success as permission to start building decks or to generate Style Master or Page Authority media. The
existing machine-compatible overall status and JSON schema SHALL remain unchanged; JSON-compatible smoke check
evidence SHALL carry the same qualification without exposing prompt, credential, or provider response content.

Direct `env-check --help` SHALL list only parser-accepted arguments: `--json`, `--mode <mode>`, `--operation
<operation>`, `--smoke`, and `--probe-vendors`. `--image2` is retired and SHALL be rejected with the
operation-scoped replacement. `--operation` SHALL require the current Page Authority mode, and `--smoke` /
`--probe-vendors` remain mutually exclusive.

#### Scenario: Output format

- **WHEN** all checks selected by the invocation pass
- **THEN** output includes READY and exits 0

- **WHEN** any selected hard check fails
- **THEN** output includes NOT READY, lists all failures, and exits non-zero

#### Scenario: Successful smoke conclusion remains qualified

- **WHEN** all selected checks and a `--smoke` submit pass
- **THEN** the human conclusion and smoke check evidence describe connectivity-only success while retaining the
  existing READY status and `env-check-v1` report shape
- **AND** neither form says that production prompt/media compatibility or a later generation authorization passed

#### Scenario: JSON compatibility is preserved

- **WHEN** direct `env-check --json` runs for a supported local or raw-generation operation
- **THEN** the report remains valid under `env-check-v1`
- **AND** mode-specific behavior is represented by included checks and existing live-probe booleans rather than a duplicate diagnostic schema

#### Scenario: Direct help and parser agree

- **WHEN** a user reads direct `env-check --help` or passes a documented form
- **THEN** every advertised flag is accepted by the parser with its documented mode/operation constraints
- **AND** no help or active documentation advertises `--image2`

#### Scenario: Retired Image2 flag is rejected safely

- **WHEN** a user passes direct `env-check --image2`
- **THEN** it returns a bounded usage diagnostic naming the operation-scoped replacement
- **AND** it starts no provider work or lifecycle operation

#### Scenario: Live JSON stdout remains parseable

- **WHEN** direct `env-check --json --smoke` or `env-check --json --probe-vendors` runs
- **THEN** stdout parses as exactly one `env-check-v1` JSON document
- **AND** live progress or human summary lines do not appear outside that document on stdout

## ADDED Requirements

### Requirement: Live Image2 smoke states its connectivity-only evidence boundary

`env-check --smoke` SHALL describe a successful live Image2 submission as connectivity evidence for the selected
endpoint and credential pair only. A successful smoke result SHALL NOT claim that a production Style Master or
Page Authority prompt is within a provider limit, that the provider will honor a requested image size, that a
sync or async result will decode as valid media, or that a current run is authorized to generate. The smoke
request remains the existing single minimal live probe and SHALL not be expanded into a production-like prompt,
image decode, or task-completion workflow.

The provider-free Style Master `plan` operation remains the authoritative deterministic preflight for its
compiled prompt bound. Human and JSON-compatible smoke output SHALL preserve the existing report schema while
making this evidence boundary clear without exposing prompt, credential, or provider response content.

#### Scenario: Smoke success is not presented as Style Master production readiness

- **WHEN** `doctor --smoke` receives an accepted sync image reference or task identifier
- **THEN** it reports successful endpoint connectivity with a statement that production prompt and media
  compatibility are not verified by the probe
- **AND** it does not claim that Style Master generation can proceed or that a provider response meets a native media contract

#### Scenario: Smoke remains a single minimal submission

- **WHEN** `doctor --smoke` runs against a configured Image2 endpoint
- **THEN** it performs only the existing one minimal POST and does not fetch image bytes, poll an async task, or
  submit a compiled Style Master prompt
- **AND** it creates no grant, attempt, authorization, receipt, workflow state, or run-bundle artifact

#### Scenario: Plan owns Style Master prompt preflight

- **WHEN** a Style Master provider brief cannot meet its deterministic framework-owned bound
- **THEN** `style-master plan` fails before authorization regardless of a prior successful smoke result
- **AND** the smoke report is not interpreted as competing readiness authority
