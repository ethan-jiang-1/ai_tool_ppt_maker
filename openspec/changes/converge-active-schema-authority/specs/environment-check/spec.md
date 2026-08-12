## REMOVED Requirements

### Requirement: Structured READY/NOT READY output

**Reason**: Its report contract names a Harness report generation and calls
field stability a compatibility promise.

**Migration**: Replace it with the declared-current report requirement below.
The current READY/NOT READY verdict, bounded live checks, stdout discipline,
and direct-help behavior remain.

## ADDED Requirements

### Requirement: Environment check emits one declared current report

The environment check SHALL output a structured report with per-check status
and an overall verdict for the selected Page Image Workflow mode and operation.
It SHALL exit 0 on READY and non-zero on NOT READY. The direct `--json` form
SHALL retain one declared current set of top-level readiness booleans and a
generic check-array contract; it SHALL not expose secrets, name a Harness report
generation, or add a second incompatible report schema. Every accepted JSON
combination SHALL emit exactly one parseable JSON document on stdout. Live
heartbeat, progress, and human Summary text SHALL be sent to stderr or
represented inside structured check evidence, never prepended/appended to
stdout JSON. Human text SHALL make clear whether it reports local or
raw-generation readiness.

For a successful `--smoke` invocation, the human conclusion SHALL qualify READY
as local-prerequisite and endpoint-connectivity evidence only. It SHALL state
that production prompt fit, requested or returned media dimensions, decoded
media, async completion, and run authorization remain unverified, and SHALL NOT
present smoke success as permission to start building decks or to generate
Style Master or Page Image Workflow media. The current machine-readable
readiness contract remains unchanged other than removal of its named generation.

Direct `env-check --help` SHALL list only parser-accepted arguments:
`--json`, `--mode <mode>`, `--operation <operation>`, `--smoke`, and
`--probe-vendors`. `--image2` is retired and SHALL be rejected with the
operation-scoped replacement. `--operation` SHALL require the current Page
Image Workflow mode, and `--smoke` / `--probe-vendors` remain mutually
exclusive.

#### Scenario: Output format

- **WHEN** all checks selected by the invocation pass
- **THEN** output includes READY and exits 0

- **WHEN** any selected hard check fails
- **THEN** output includes NOT READY, lists all failures, and exits non-zero

#### Scenario: Successful smoke conclusion remains qualified

- **WHEN** all selected checks and a `--smoke` submit pass
- **THEN** the human conclusion and smoke check evidence describe
  connectivity-only success while retaining the current readiness report shape
- **AND** neither form says that production prompt/media compatibility or a
  provider authorization passed

#### Scenario: JSON has one current shape

- **WHEN** direct `env-check --json` runs for a supported local or
  raw-generation operation
- **THEN** stdout is one document under the declared current report contract
- **AND** mode-specific behavior is represented by included checks and live
  probe booleans rather than a duplicate diagnostic schema

#### Scenario: Direct help and parser agree

- **WHEN** a user reads direct `env-check --help` or passes a documented form
- **THEN** every advertised flag is accepted by the parser with its documented
  mode/operation constraints
- **AND** no help or active documentation advertises `--image2`

#### Scenario: Retired Image2 flag is rejected safely

- **WHEN** a user passes direct `env-check --image2`
- **THEN** it returns a bounded usage diagnostic naming the operation-scoped
  replacement
- **AND** it starts no provider work or lifecycle operation

#### Scenario: Live JSON stdout remains parseable

- **WHEN** direct `env-check --json --smoke` or `env-check --json --probe-vendors` runs
- **THEN** stdout parses as exactly one declared current environment-report
  document
- **AND** live progress or human summary lines do not appear outside that
  document on stdout
