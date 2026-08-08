## Purpose

Define the pre-flight environment check at `scripts/00-setup/env-check.mjs`: a zero-dependency Phase 0 adapter for supported Node `22.x|24.x|26.x`, base local Framed-runtime readiness, and operation-scoped Page Image Workflow raw-generation readiness. It emits an actionable structured readiness report without requiring `npm install` to start.
## Requirements

### Requirement: Environment checks are owned by the Harness root

The normal installed environment diagnostic SHALL be invoked through
`node ppt_maker_harness/scripts/ppt_flow.mjs doctor`; the pre-install recovery
entry SHALL be `ppt_maker_harness/scripts/00-setup/env-check.mjs`. Both paths
remain bounded readiness checks and SHALL not use a retired source root as an
alias or infer a Deck, Run Bundle, provider authorization, or Controller
continuation.

#### Scenario: An Agent performs normal Harness readiness

- **WHEN** an installed Agent requests the normal environment diagnostic
- **THEN** it invokes the Harness `ppt_flow doctor` entrypoint
- **AND** it receives existing bounded readiness evidence rather than a retired-root fallback

### Requirement: Zero-dependency runtime check
`scripts/00-setup/env-check.mjs` SHALL have zero static npm dependencies. Its pre-install closure contains only Node built-ins, shared CLI bootstrap/error helpers, and the pure executable inventory; those helpers import neither a production adapter nor an npm dependency. It SHALL remain runnable before `npm install` so it can diagnose the Node/npm/package foundation. It MAY dynamically import the installed Framed runtime only after package presence checks establish npm dependencies; missing packages are normal check failures rather than load failures. `ppt_flow doctor` remains the Commander-based normal command after installation, while direct env-check is the documented recovery command.

Base runtime/font inspection is owned by the import-safe `00-setup` interface, which SHALL NOT import a provider implementation. The direct adapter and root doctor may lazily call the Page Image Workflow raw-readiness diagnostic only after prerequisites pass and raw generation is explicitly selected. Base mode SHALL not load provider implementation.

#### Scenario: Run without node_modules
- **WHEN** `node scripts/00-setup/env-check.mjs` runs in a fresh directory with no `node_modules/`
- **THEN** the script executes and emits actionable missing-package results
- **AND** it does not fail during top-level module loading

#### Scenario: Base mode does not initialize a provider
- **WHEN** direct `00-setup` env-check runs without raw generation selected
- **THEN** no provider or credential implementation is loaded while local Framed readiness remains checkable

### Requirement: Node.js version gate

The env check SHALL verify at startup that Node.js belongs to the checked-in supported major set `22.x`, `24.x`, or `26.x`. If absent, older, or on an undocumented major such as 23/25, it SHALL output FOUNDATION NOT READY and exit non-zero. The `package.json` `>=22` engine range SHALL be treated only as the package floor, not as the executable support set.

#### Scenario: Version check

- **WHEN** Node.js 22.0.0 is installed → version check passes
- **WHEN** Node.js 24.x or 26.x is installed → version check passes
- **WHEN** Node.js 20.0.0 is installed → report shows required vs found version, exits non-zero
- **WHEN** Node.js 23.x or 25.x is installed → report shows the supported major lines vs found version, exits non-zero

### Requirement: API key verification

In Image2 mode, the env check SHALL verify that image-generation credentials can resolve at least one usable API key, consistent with `resolveVendors` / Image2 contract:

- **Shared key path:** non-empty `IMAGE2_API_KEY`.

When no shared key is available, `api_key` SHALL fail the Image2-mode verdict. Fix text SHALL name `IMAGE2_API_KEY`. Base mode SHALL omit this check and SHALL not load or require the key for readiness.

#### Scenario: Canonical IMAGE2 key

- **WHEN** `.env` contains non-empty `IMAGE2_API_KEY`
- **AND** Image2 mode is selected
- **THEN** `api_key` passes and detail identifies `IMAGE2_API_KEY`

#### Scenario: Missing key

- **WHEN** no `IMAGE2_API_KEY` is set
- **AND** Image2 mode is selected
- **THEN** `api_key` fails and fix names `IMAGE2_API_KEY`

#### Scenario: Missing key does not affect base mode

- **WHEN** no `IMAGE2_API_KEY` is set and env-check runs in base mode
- **THEN** no `api_key` check is emitted
- **AND** the missing key does not affect base READY

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

The env check SHALL output a structured report with per-check status and an
overall verdict for the selected Page Image Workflow mode and operation. It SHALL
exit 0 on READY and non-zero on NOT READY. The direct `--json` form SHALL
retain the existing `env-check-v1` top-level booleans and generic check-array
contract; it SHALL not expose secrets or add a second incompatible report
schema. Every accepted JSON combination SHALL emit exactly one parseable JSON
document on stdout. Live heartbeat, progress, and human Summary text SHALL be
sent to stderr or represented inside structured check evidence, never
prepended/appended to stdout JSON. Human text SHALL make clear whether it
reports local or raw-generation readiness.

For a successful `--smoke` invocation, the human conclusion SHALL qualify READY as local-prerequisite and
endpoint-connectivity evidence only. It SHALL state that production prompt fit, requested or returned media
dimensions, decoded media, async completion, and run authorization remain unverified, and SHALL NOT present
smoke success as permission to start building decks or to generate Style Master or Page Image Workflow media. The
existing machine-compatible overall status and JSON schema SHALL remain unchanged; JSON-compatible smoke check
evidence SHALL carry the same qualification without exposing prompt, credential, or provider response content.

Direct `env-check --help` SHALL list only parser-accepted arguments:
`--json`, `--mode <mode>`, `--operation <operation>`, `--smoke`, and
`--probe-vendors`. `--image2` is retired and SHALL be rejected with the
operation-scoped replacement. `--operation` SHALL require the current Page
Authority mode, and `--smoke` / `--probe-vendors` remain mutually exclusive.

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

- **WHEN** direct `env-check --json --smoke` or `env-check --json --probe-vendors` runs
- **THEN** stdout parses as exactly one `env-check-v1` JSON document
- **AND** live progress or human summary lines do not appear outside that document on stdout

### Requirement: Live Image2 smoke states its connectivity-only evidence boundary

`env-check --smoke` SHALL describe a successful live Image2 submission as connectivity evidence for the selected
endpoint and credential pair only. A successful smoke result SHALL NOT claim that a production Style Master or
Page Image Workflow prompt is within a provider limit, that the provider will honor a requested image size, that a
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

- **WHEN** a Style Master provider brief cannot meet its deterministic Harness-owned bound
- **THEN** `style-master plan` fails before authorization regardless of a prior successful smoke result
- **AND** the smoke report is not interpreted as competing readiness authority

### Requirement: Optional --smoke performs one live credential probe

`env-check.mjs` SHALL accept `--smoke`. `--smoke` SHALL select
raw-generation readiness for its diagnostic. After local and raw-generation
presence checks pass, it SHALL perform exactly one minimal live Image2 POST
attempt against the **first** vendor from `resolveVendors`. The diagnostic
request SHALL disable automatic redirect following and SHALL NOT retry a
redirect, transient response, timeout, or ambiguous network failure. Success
SHALL be an extractable image ref **or** a task id, using the same exported
extract helpers as the client (no forked parser). Full async image completion
is NOT required. Without `--smoke` and without `--probe-vendors`, env-check
SHALL NOT make Image2 network calls. The zero-static-dependency startup
contract remains; dynamic-importing sibling ESM after prerequisites pass is
allowed.

#### Scenario: --smoke fails on bad credentials

- **WHEN** credentials resolve but the API rejects the probe
- **AND** `env-check --smoke` runs
- **THEN** overall status is NOT READY
- **AND** the report indicates the smoke/probe failed

#### Scenario: --smoke succeeds on task_id without waiting for image

- **WHEN** the API accepts submit and returns a task id
- **AND** `env-check --smoke` runs
- **THEN** the smoke check passes without waiting for image completion

#### Scenario: --smoke succeeds on sync image without task_id

- **WHEN** the API accepts submit and returns an extractable image ref with no task id
- **AND** `env-check --smoke` runs
- **THEN** the smoke check passes

#### Scenario: Default doctor stays offline

- **WHEN** `env-check` runs without `--smoke` and without `--probe-vendors`
- **THEN** it does not perform an Image2 network probe
- **AND** the base browser smoke remains local-only

#### Scenario: --smoke redirect or ambiguous failure is not retried

- **WHEN** the diagnostic POST receives a 307/308 redirect, times out, or fails with an ambiguous network error
- **THEN** the smoke check fails without following the redirect
- **AND** no second POST attempt occurs in that invocation

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

### Requirement: Git safety observation is advisory, bounded, and scope-honest

`scripts/00-setup/env-check.mjs` SHALL include one stable base check named `git`, implemented with Node.js built-ins and no npm dependency. The check SHALL observe only the process current working directory; its production child runner SHALL fix `cwd` to `process.cwd()`, use `shell: false` with ignored stdin, and expose no caller-controlled cwd/path input. Its public text SHALL describe that scope without emitting the directory path and SHALL NOT claim that a future or separately located run bundle is protected, tracked, clean, or recoverable.

The probe SHALL use only a fixed, argument-safe sequence: a bounded `git --version` with a conservative one-line parse that accepts exactly `git version <major>.<minor>.<patch>` plus only the optional `.windows.<number>` or ` (Apple Git-<number>)` suffix; after a recognized version succeeds, a bounded `git rev-parse --is-inside-work-tree`; and only after literal `true`, a bounded `git rev-parse --verify --quiet HEAD^{commit}` accepting only a 40- or 64-hex object identifier. Each invocation SHALL use `shell: false`, ignored stdin, a 2-second timeout, and Node `maxBuffer` of 4 KiB per captured stdout/stderr stream. Only a quiet no-stdout/no-stderr `rc=1` HEAD verification result MAY be normalized as no-verifiable-HEAD; every other nonzero/timeout/permission/malformed result is unavailable. The child environment SHALL be allowlisted enough to preserve platform-required executable discovery while omitting Harness credentials and removing inherited `GIT_*` overrides (case-insensitively on Windows); on Windows it SHALL forward at most one canonicalized `PATH`/`Path` key. It SHALL set `LC_ALL=C` and `LANG=C` on every platform, plus Harness-owned `GIT_TERMINAL_PROMPT=0`, `GIT_OPTIONAL_LOCKS=0`, `GIT_NO_REPLACE_OBJECTS=1`, `GIT_CONFIG_NOSYSTEM=1`, and `GIT_CONFIG_GLOBAL` to Node's platform null device so global/system Git configuration and replacement refs do not affect the probe. The implementation SHALL not invoke shell parsing, `git status`, `git log`, `git diff`, `git remote`, `git config`, or any Git mutation command.

The check SHALL be `ok` only when a conservatively recognized version is available, `rev-parse --is-inside-work-tree` exits zero with trimmed literal `true`, and `HEAD^{commit}` is verifiable. It SHALL be `warn`, never `fail`, when Git is unavailable, the current directory is not positively confirmed as a worktree, the positively confirmed worktree has no verifiable commit at HEAD, a probe times out or is denied, or output is malformed/unrecognized. A nonzero worktree probe without a separately classified timeout/permission condition SHALL be rendered only as "current directory not confirmed as a worktree"; it SHALL not infer an exact cause from raw stderr. Detail and fix text SHALL contain only normalized facts and generic state; they SHALL NOT expose a remote URL, credential, environment value, username, command path, commit, branch, diff, status, raw stdout, or raw stderr.

#### Scenario: Missing Git remains an advisory warning

- **WHEN** the bounded `git --version` probe reports executable-not-found
- **THEN** the base report includes one `git` check with status `warn` and an installation-oriented fix
- **AND** it does not expose the failed command's raw error text

#### Scenario: Current directory is not confirmed as a worktree

- **WHEN** Git is available and the worktree probe returns `false`, a nonzero result, or another non-positive result for the current working directory
- **THEN** the `git` check has status `warn` and says that a user may later choose a project root for source history
- **AND** it does not claim anything about a future deck or recommend or execute initialization in the current version leaf or `_generated/`

#### Scenario: Worktree probe failure is not overclassified

- **WHEN** `git rev-parse --is-inside-work-tree` exits nonzero with no trusted positive output
- **THEN** the `git` check remains `warn` with the generic unconfirmed-worktree fact
- **AND** it does not report "outside a worktree," retain stderr, or expose the reason for the nonzero exit

#### Scenario: New worktree has no verifiable first checkpoint

- **WHEN** Git is available, the current working directory is inside a worktree, and `HEAD^{commit}` cannot be verified
- **THEN** the `git` check has status `warn` with a generic no-verifiable-history fact
- **AND** it does not expose a branch name, a raw Git error, or a requirement to create a commit before continuing

#### Scenario: HEAD probe anomaly is not misreported as an unborn repository

- **WHEN** the HEAD verification probe times out, is denied, has malformed successful output, or fails outside its expected quiet no-HEAD result
- **THEN** the `git` check has a generic availability `warn`
- **AND** it does not claim that the repository is new or that its HEAD is unborn

#### Scenario: Existing current-directory history is recognized without repository details

- **WHEN** Git is available, the current working directory is inside a worktree, and `HEAD` is verifiable
- **THEN** the `git` check has status `ok` and reports only normalized version/current-directory history facts
- **AND** no remote, identity, commit, branch, status, or raw command output appears in text or JSON output

#### Scenario: Git probe anomaly is contained

- **WHEN** a Git probe times out, is denied, returns an unexpected exit, or produces malformed output
- **THEN** the `git` check is a concise `warn`
- **AND** the checker completes without throwing, retaining child output, or exposing raw process output

### Requirement: Git warnings do not alter environment readiness

The `git` check SHALL participate in the existing text and direct `env-check --json` check list but SHALL omit the optional `foundation` field and SHALL NOT change the established meaning of `allPass`, foundation readiness, READY/NOT READY text, or process exit status. Git availability, worktree status, verifiable history, worktree cleanliness, and commit history SHALL NOT be hard prerequisites for `doctor`, `init`, Stage execution, rendering, gate approval, or structural version publication. This change SHALL retain the existing generic `env-check-v1` JSON check-array contract and SHALL NOT add `--json` to `ppt_flow doctor`.

#### Scenario: Git-only warning keeps direct environment check ready

- **WHEN** all existing hard checks pass and `git` is `warn`
- **THEN** direct `env-check` human-readable output ends in `READY`
- **AND** direct `env-check --json` reports `allPass: true`, omits `foundation` from the `git` record, and exits 0

#### Scenario: Delegated doctor keeps its existing text contract

- **WHEN** all existing hard checks pass and `ppt_flow doctor` delegates to an env check whose `git` result is `warn`
- **THEN** the delegated doctor command exits 0 and presents the warning plus READY text
- **AND** it does not gain a new `--json` option in this change

#### Scenario: Hard failure remains blocking beside Git warning

- **WHEN** `git` is `warn` and an existing hard requirement is `fail`
- **THEN** the overall report remains NOT READY and exits non-zero because of the hard requirement
- **AND** the Git warning does not appear as a blocking diagnostic issue

### Requirement: Environment checks are operation-scoped for Page Image Workflow
Environment diagnostics SHALL distinguish Page Image Workflow raw-generation readiness from the canonical
Framed render-profile readiness required for plan-time layout proof and final local composition. A
Framed-local check SHALL validate the same pinned browser, checked-in font inventory, font integrity,
and capture-profile facts consumed by the Framed owner; it SHALL not require provider credentials,
initialize a provider, download a browser, or select a retired production family.

The direct environment adapter SHALL preserve its zero-static-npm-dependency startup. It SHALL inspect
package-backed Framed runtime facts only after package prerequisites pass, and shall report a missing or
mismatched runtime/font profile as an actionable environment result rather than a module-load crash or
source-validation failure.

#### Scenario: Framed-local doctor is provider-free
- **WHEN** doctor is invoked for Framed planning or local composition without Image2 credentials
- **THEN** it reports the browser, font, and capture-profile readiness result without a provider-credential failure
- **AND** it performs no provider initialization or network setup

#### Scenario: Fresh checkout reports missing runtime normally

- **WHEN** direct environment check runs before npm dependencies or paired browser assets are present
- **THEN** it starts successfully and reports the earliest missing package or runtime prerequisite
- **AND** it does not crash during static module loading or attempt browser acquisition

#### Scenario: Production and doctor consume the same profile facts

- **WHEN** doctor reports the current Framed runtime profile ready
- **THEN** Framed plan verification and final composition validate against those same owned runtime/font identities
- **AND** neither path constructs a competing readiness profile

### Requirement: Direct environment check is a bounded recovery entry

`ppt_flow doctor` SHALL remain the normal installed-Harness diagnostic entry.
Direct `scripts/00-setup/env-check.mjs` SHALL remain runnable before npm
installation and SHALL be documented for pre-install recovery or an unavailable
main entry. It MAY report bounded local or operation-scoped readiness, but it
SHALL not locate a Deck, infer a run, create/resume a controller, begin a
production workflow, or authorize provider work.

Normal raw-generation readiness SHALL remain exact-run-bound through
`ppt_flow doctor --run-dir <run-dir> --operation raw-generation`. Direct
`env-check` MAY provide an unbound operation-scoped report only at its
pre-install/unavailable-main-entry recovery boundary; that report is not a
normal provider-readiness continuation and cannot substitute for exact-run
validation.

Default direct and unified doctor checks SHALL be offline. `--smoke` makes one
live first-channel submission and `--probe-vendors` makes one submission per
resolved channel; an Agent SHALL disclose that count and obtain the existing
human confirmation before invoking either live form. Successful readiness or
probe evidence SHALL not authorize a later production action.

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
- **THEN** the check requires the exact run before the operation-scoped doctor
  work begins
- **AND** direct `env-check` is not presented as an unbound normal substitute

#### Scenario: Live channel probe needs an explicit human boundary

- **WHEN** an Agent offers smoke or all-channel diagnosis
- **THEN** it states the exact maximum provider submission count and waits for
  human confirmation before invocation
- **AND** declining leaves offline evidence valid and makes zero live calls
