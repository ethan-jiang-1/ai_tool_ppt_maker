## MODIFIED Requirements

### Requirement: Structured READY/NOT READY output

The env check SHALL output a structured report with per-check status and an
overall verdict for the selected Page Authority mode and operation. It SHALL
exit 0 on READY and non-zero on NOT READY. The direct `--json` form SHALL
retain the existing `env-check-v1` top-level booleans and generic check-array
contract; it SHALL not expose secrets or add a second incompatible report
schema. Every accepted JSON combination SHALL emit exactly one parseable JSON
document on stdout. Live heartbeat, progress, and human Summary text SHALL be
sent to stderr or represented inside structured check evidence, never
prepended/appended to stdout JSON. Human text SHALL make clear whether it
reports local or raw-generation readiness.

Direct `env-check --help` SHALL list only parser-accepted arguments:
`--json`, `--mode <mode>`, `--operation <operation>`, `--smoke`, and
`--probe-vendors`. `--image2` is retired and SHALL be rejected with the
operation-scoped replacement. `--operation` SHALL require the current Page
Authority mode, and `--smoke` / `--probe-vendors` remain mutually exclusive.

#### Scenario: Output format

- **WHEN** all checks selected by the invocation pass
- **THEN** output ends with `READY` and exits 0

- **WHEN** any selected hard check fails
- **THEN** output ends with `NOT READY`, lists all failures, and exits non-zero

#### Scenario: JSON compatibility is preserved

- **WHEN** direct `env-check --json` runs for a supported local or
  raw-generation operation
- **THEN** the report remains valid under `env-check-v1`
- **AND** mode-specific behavior is represented by included checks and existing
  live-probe booleans rather than a duplicate diagnostic schema

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

- **WHEN** direct `env-check --json --smoke` or `env-check --json
  --probe-vendors` runs
- **THEN** stdout parses as exactly one `env-check-v1` JSON document
- **AND** live progress or human summary lines do not appear outside that
  document on stdout

### Requirement: Optional --probe-vendors reports every Image2 channel

`env-check.mjs` SHALL accept `--probe-vendors`, which SHALL select
raw-generation readiness. After local and raw-generation presence checks pass,
it SHALL make exactly one live POST attempt to each entry returned by the
current resolver in order, using the same success rule as `--smoke`: an image
reference or task ID. Each diagnostic request SHALL disable automatic redirect
following and SHALL not retry a redirect, transient response, timeout, or
ambiguous network failure. The current credential source remains unchanged; the
array-generic resolver behavior shall not introduce an alternate credential
schema.

The report SHALL disclose the ordered total submission count before execution
can be presented by an Agent for confirmation. It SHALL log bounded progress
and per-channel results without API key values, list working channels first by
ascending elapsed time followed by failed channels in original order, and exit
0 only when at least one channel succeeds. It SHALL not write `.env`, a
lesson, authorization, grant, attempt, receipt, or workflow state. Passing
both live flags SHALL be a usage error.

#### Scenario: Probe lists every channel outcome

- **WHEN** the resolver supplies three ordered entries and a confirmed
  `--probe-vendors` invocation runs
- **THEN** output includes one result per entry and exactly three provider
  submissions occur
- **AND** no credential value appears in the output

#### Scenario: Probe does not retry a channel

- **WHEN** one channel returns a redirect, times out, or has an ambiguous
  network failure
- **THEN** that channel reports a failed result without a second POST attempt
- **AND** later ordered channels are handled only by their own one permitted
  attempt

#### Scenario: Live flags cannot be combined

- **WHEN** both `--smoke` and `--probe-vendors` are passed
- **THEN** the process exits non-zero with a bounded usage diagnostic
- **AND** no provider submission occurs

## ADDED Requirements

### Requirement: Direct environment check is a bounded recovery entry

`ppt_flow doctor` SHALL remain the normal installed-framework diagnostic entry.
Direct `scripts/00-setup/env-check.mjs` SHALL remain runnable before npm
installation and SHALL be documented for pre-install recovery or an unavailable
main entry. It MAY report bounded local or operation-scoped readiness, but it
SHALL not locate a Deck, infer a run, create/resume a controller, begin a
production workflow, or authorize provider work.

Default direct and unified doctor checks SHALL be offline. `--smoke` makes one
live first-channel submission and `--probe-vendors` makes one submission per
resolved channel; an Agent SHALL disclose that count and obtain the existing
human confirmation before invoking either live form. Successful readiness or
probe evidence SHALL not authorize a later production action.

#### Scenario: Pre-install recovery stays available

- **WHEN** framework npm dependencies are absent or the main entry cannot
  start
- **THEN** direct env-check reports bounded local prerequisites without loading
  an unavailable production dependency at startup
- **AND** it does not create a Deck or provider authorization

#### Scenario: Default foundation check remains offline

- **WHEN** a user requests local foundation readiness without a live probe
- **THEN** the selected doctor path performs no provider network request
- **AND** it reports a guide or owner-issued repair action rather than treating
  readiness as production permission

#### Scenario: Live channel probe needs an explicit human boundary

- **WHEN** an Agent offers smoke or all-channel diagnosis
- **THEN** it states the exact maximum provider submission count and waits for
  human confirmation before invocation
- **AND** declining leaves offline evidence valid and makes zero live calls
