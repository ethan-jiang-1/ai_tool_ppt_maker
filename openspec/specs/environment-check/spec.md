## Purpose

Define the pre-flight environment check at `scripts/00-setup/env-check.mjs`: a zero-dependency Phase 0 adapter for supported Node `22.x|24.x|26.x`, base local HTML readiness, and explicitly selected optional legacy Image2 modes. It emits an actionable structured readiness report without requiring `npm install` to start.
## Requirements
### Requirement: Zero-dependency runtime check

`scripts/00-setup/env-check.mjs` SHALL have zero static npm dependencies. It SHALL remain runnable with Node.js built-ins before `npm install` so it can diagnose the Node/npm/package foundation. It MAY dynamically import the installed `html-render-runtime` implementation only after package presence checks establish that npm dependencies exist; a missing dependency SHALL be reported as a normal check failure rather than causing module-load failure at startup.

#### Scenario: Run without node_modules

- **WHEN** `node scripts/00-setup/env-check.mjs` runs in a fresh directory with no `node_modules/`
- **THEN** the script executes and emits actionable missing-package results
- **AND** it does not fail during top-level module loading

### Requirement: Node.js version gate

The env check SHALL verify at startup that Node.js belongs to the checked-in supported major set `22.x`, `24.x`, or `26.x`. If absent, older, or on an undocumented major such as 23/25, it SHALL output FOUNDATION NOT READY and exit non-zero. The `package.json` `>=22` engine range SHALL be treated only as the package floor, not as the executable support set.

#### Scenario: Version check

- **WHEN** Node.js 22.0.0 is installed → version check passes
- **WHEN** Node.js 24.x or 26.x is installed → version check passes
- **WHEN** Node.js 20.0.0 is installed → report shows required vs found version, exits non-zero
- **WHEN** Node.js 23.x or 25.x is installed → report shows the supported major lines vs found version, exits non-zero

### Requirement: npm and dependency check

The env check SHALL verify npm is available. It SHALL verify that hard-required packages `@napi-rs/canvas`, `pptxgenjs`, `commander`, exact `playwright@1.61.1`, and exact direct `echarts@6.1.0` are each present by walking upward from `process.cwd()` and checking `node_modules/<package>` under every ancestor until found. It SHALL NOT stop at the first incomplete `node_modules`. Exact versions SHALL be read from the discovered package metadata. A missing package or version mismatch SHALL fail with project-root `npm install`/lockfile-alignment guidance.

The discovered Playwright and ECharts package roots/versions SHALL be passed in the validated runtime profile to `html-render-runtime` and `html-slide-rendering`. Those modules SHALL load the exact discovered installations and SHALL NOT repeat bare or module-relative resolution. A nearer shadow copy SHALL not satisfy, replace, or influence the inspected profile.

#### Scenario: Dependencies installed at project root while cwd is a deck

- **WHEN** all required packages exist at a parent of a child deck cwd
- **THEN** every dependency check, including exact Playwright and ECharts, reports `ok`

#### Scenario: ECharts version drifts

- **WHEN** discovered ECharts is not exactly `6.1.0`
- **THEN** the dependency check fails and base readiness is NOT READY
- **AND** renderer production cannot proceed with the mismatched package

#### Scenario: Shadow ECharts exists near the renderer

- **WHEN** cwd discovery selects exact `echarts@6.1.0` but a different copy is resolvable relative to the renderer module
- **THEN** chart generation uses only the discovered exact package root
- **AND** the shadow copy cannot satisfy or replace the inspected profile

#### Scenario: Empty local node_modules does not block parent packages

- **WHEN** the cwd has an incomplete `node_modules` and a parent has every required package
- **THEN** upward discovery continues and the parent packages are verified

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

In Image2 mode, the env check SHALL require a resolvable image API endpoint configuration via:

- non-empty `IMAGE2_BASE_URL`.

When none is set, `image_base_url` SHALL be **`fail`** and the Image2-mode verdict SHALL be NOT READY. The check SHALL NOT claim a silent default endpoint when URL is unset. Fix text SHALL name `IMAGE2_BASE_URL`. Base mode SHALL omit this check.

#### Scenario: Canonical IMAGE2 base URL

- **WHEN** `.env` contains `IMAGE2_BASE_URL=https://example/v1`
- **AND** Image2 mode is selected
- **THEN** `image_base_url` passes

#### Scenario: Missing base URL fails doctor

- **WHEN** a shared key is present but no base URL variable is set
- **AND** Image2 mode is selected
- **THEN** `image_base_url` is `fail` and env-check is NOT READY

#### Scenario: Missing base URL does not affect base mode

- **WHEN** no base URL is set and env-check runs in base mode
- **THEN** no `image_base_url` check is emitted

### Requirement: In-framework Stage 2 scripts are a hard requirement

In Image2 mode, the env check SHALL treat missing in-framework Stage 2 modules as a hard failure, not a warning. It SHALL verify these files exist under `PPTMAKER_FRAMEWORK/scripts/`: `stage2_generate_images.mjs`, `make_contact_sheet.mjs`, `image_api_client.mjs`. It SHALL NOT search `.claude/skills/` or `.agents/skills/`. Base mode SHALL omit `stage2_generator` because local HTML runtime readiness does not depend on the Image2 implementation.

#### Scenario: Scripts present

- **WHEN** the three Stage 2 modules exist under `scripts/`
- **AND** Image2 mode is selected
- **THEN** `stage2_generator` status is `ok` and detail mentions `in-framework`

#### Scenario: Scripts missing

- **WHEN** any of the three modules is missing
- **AND** Image2 mode is selected
- **THEN** `stage2_generator` status is `fail`, overall verdict is NOT READY, and the process exits non-zero

#### Scenario: Base doctor does not require Stage 2

- **WHEN** Stage 2 modules are absent but all base checks pass
- **AND** env-check runs without an Image2 flag
- **THEN** no `stage2_generator` check is emitted and base readiness remains READY

### Requirement: Structured READY/NOT READY output

The env check SHALL output a structured report with per-check status and an overall verdict for the selected mode. Exit 0 on READY and non-zero on NOT READY. The direct `--json` form SHALL retain the existing `env-check-v1` top-level booleans and generic check-array contract; it SHALL not expose secrets or add a second incompatible report schema. Every accepted JSON combination, including `--image2`, `--smoke`, and `--probe-vendors`, SHALL emit exactly one parseable JSON document on stdout. Live heartbeat, progress, and human Summary text SHALL be sent to stderr or represented inside structured check evidence, never prepended/appended to stdout JSON. Human text SHALL make clear whether it reports base readiness or Image2 readiness.

#### Scenario: Output format

- **WHEN** all checks selected by the invocation pass → output ends with "READY", exit 0
- **WHEN** any selected hard check fails → output ends with "NOT READY", lists all failures, exit non-zero

#### Scenario: JSON compatibility is preserved

- **WHEN** direct `env-check --json` runs in base or Image2 mode
- **THEN** the report remains valid under `env-check-v1`
- **AND** mode-specific behavior is represented by the checks included and existing `smoke`/`probeVendors` booleans rather than a duplicate diagnostic schema

#### Scenario: Live JSON stdout remains parseable

- **WHEN** direct `env-check --json --smoke` or `env-check --json --probe-vendors` runs
- **THEN** stdout parses as exactly one `env-check-v1` JSON document
- **AND** live progress or human summary lines do not appear outside that document on stdout

### Requirement: Optional --smoke performs one live credential probe

`env-check.mjs` SHALL accept `--smoke`. `--smoke` SHALL imply Image2 mode. After base and Image2 presence checks pass, it SHALL perform exactly one minimal live Image2 POST attempt against the **first** vendor from `resolveVendors`. The diagnostic request SHALL disable automatic redirect following and SHALL NOT retry a redirect, transient response, timeout, or ambiguous network failure. Success SHALL be an extractable image ref **or** a task id, using the same exported extract helpers as the client (no forked parser). Full async image completion is NOT required. Without `--smoke` and without `--probe-vendors`, env-check SHALL NOT make Image2 network calls. The zero-static-dependency startup contract remains; dynamic-importing sibling ESM after prerequisites pass is allowed.

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

#### Scenario: --smoke remains backward compatible

- **WHEN** `env-check --smoke` runs without an explicit `--image2`
- **THEN** Image2 presence checks and the first-vendor live probe still run
- **AND** exactly one provider submit is attempted

#### Scenario: --smoke redirect or ambiguous failure is not retried

- **WHEN** the diagnostic POST receives a 307/308 redirect, times out, or fails with an ambiguous network error
- **THEN** the smoke check fails without following the redirect
- **AND** no second POST attempt occurs in that invocation

### Requirement: Optional --probe-vendors reports every Image2 channel

`env-check.mjs` SHALL accept `--probe-vendors`, which SHALL imply Image2 mode. After base and Image2 presence checks pass, it SHALL make exactly one live POST attempt to **each** entry returned by `resolveVendors` in order (same success rule as `--smoke`: image ref or task id; no forked parser). Each diagnostic request SHALL disable automatic redirect following and SHALL NOT retry a redirect, transient response, timeout, or ambiguous network failure. The current `image-generation` SSOT continues to produce one canonical entry from `IMAGE2_API_KEY` plus `IMAGE2_BASE_URL`; this change SHALL NOT add an alternate multi-vendor credential schema. The loop SHALL nevertheless remain array-generic and be testable with injected multi-entry resolver output. It SHALL log `probing i/N` progress and per-vendor submit heartbeats consistent with the image client's wait contract. For each vendor it SHALL print `base_url`, `ok|fail`, `mode` (`sync`|`async`|`unknown`), `elapsed_s`, and a short `error` on failure — never API key values. After all probes it SHALL print a Summary (OK vs FAIL) with working vendors first sorted by ascending elapsed time; failed vendors appended in original relative order. Exit 0 if at least one vendor is OK; otherwise non-zero with an actionable failure path. It SHALL NOT write `.env` or `_lessons/`. If both `--smoke` and `--probe-vendors` are passed, the tool SHALL fail with a clear usage error. `--image2` MAY accompany either live flag without changing behavior.

#### Scenario: --probe-vendors lists per-vendor outcomes

- **WHEN** the probe receives three ordered entries from the shared resolver (for example through the injected regression seam) and `--probe-vendors` runs
- **THEN** output includes a result line for each vendor
- **AND** exactly three provider submits are attempted
- **AND** no API key values appear in the output

#### Scenario: --probe-vendors exits non-zero when all fail

- **WHEN** every vendor probe fails
- **AND** `--probe-vendors` runs
- **THEN** the process exits non-zero

#### Scenario: --smoke and --probe-vendors together are rejected

- **WHEN** both `--smoke` and `--probe-vendors` are passed
- **THEN** the process exits non-zero with a usage/mutual-exclusion error

#### Scenario: --probe-vendors remains backward compatible

- **WHEN** `env-check --probe-vendors` runs without explicit `--image2`
- **THEN** Image2 presence checks and all-vendor probing still run

#### Scenario: Probe does not retry a vendor

- **WHEN** one resolver entry redirects, returns a transient 5xx, times out, or has an ambiguous network failure
- **THEN** that entry is recorded as failed or unknown after one POST attempt
- **AND** probing continues to the next resolver entry without retrying the failed entry

### Requirement: Git safety observation is advisory, bounded, and scope-honest

`scripts/00-setup/env-check.mjs` SHALL include one stable base check named `git`, implemented with Node.js built-ins and no npm dependency. The check SHALL observe only the process current working directory; its production child runner SHALL fix `cwd` to `process.cwd()`, use `shell: false` with ignored stdin, and expose no caller-controlled cwd/path input. Its public text SHALL describe that scope without emitting the directory path and SHALL NOT claim that a future or separately located run bundle is protected, tracked, clean, or recoverable.

The probe SHALL use only a fixed, argument-safe sequence: a bounded `git --version` with a conservative one-line parse that accepts exactly `git version <major>.<minor>.<patch>` plus only the optional `.windows.<number>` or ` (Apple Git-<number>)` suffix; after a recognized version succeeds, a bounded `git rev-parse --is-inside-work-tree`; and only after literal `true`, a bounded `git rev-parse --verify --quiet HEAD^{commit}` accepting only a 40- or 64-hex object identifier. Each invocation SHALL use `shell: false`, ignored stdin, a 2-second timeout, and Node `maxBuffer` of 4 KiB per captured stdout/stderr stream. Only a quiet no-stdout/no-stderr `rc=1` HEAD verification result MAY be normalized as no-verifiable-HEAD; every other nonzero/timeout/permission/malformed result is unavailable. The child environment SHALL be allowlisted enough to preserve platform-required executable discovery while omitting framework credentials and removing inherited `GIT_*` overrides (case-insensitively on Windows); on Windows it SHALL forward at most one canonicalized `PATH`/`Path` key. It SHALL set `LC_ALL=C` and `LANG=C` on every platform, plus framework-owned `GIT_TERMINAL_PROMPT=0`, `GIT_OPTIONAL_LOCKS=0`, `GIT_NO_REPLACE_OBJECTS=1`, `GIT_CONFIG_NOSYSTEM=1`, and `GIT_CONFIG_GLOBAL` to Node's platform null device so global/system Git configuration and replacement refs do not affect the probe. The implementation SHALL not invoke shell parsing, `git status`, `git log`, `git diff`, `git remote`, `git config`, or any Git mutation command.

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

### Requirement: Environment check separates base and Image2 readiness modes

`env-check.mjs` SHALL resolve one readiness mode per invocation. An invocation without `--image2`, `--smoke`, or `--probe-vendors` SHALL run base checks only. `--image2` SHALL run base checks plus Image2 presence checks and remain offline. `--smoke` and `--probe-vendors` SHALL imply Image2 mode, remain mutually exclusive, and retain their live-probe behavior after presence checks pass.

Base checks SHALL include Node/npm, required local framework packages including exact `playwright@1.61.1` and exact direct `echarts@6.1.0`, matching installed Chromium, distributed HTML-font integrity/coverage, fixed offline browser smoke, and advisory checks. Base checks SHALL omit `api_key`, `image_base_url`, and `stage2_generator`. Missing or mismatched ECharts SHALL make base readiness NOT READY; missing Image2 configuration SHALL not.

#### Scenario: New user has no Image2 configuration

- **WHEN** all local/base requirements including exact ECharts pass and no Image2 configuration exists
- **THEN** default env-check ends READY and exits 0

#### Scenario: Required ECharts is missing

- **WHEN** exact local ECharts cannot be discovered
- **THEN** default env-check ends NOT READY with a base dependency repair
- **AND** no browser or renderer work is attempted with an unknown chart runtime

#### Scenario: Explicit Image2 presence mode

- **WHEN** env-check runs with `--image2`
- **THEN** it runs all base checks plus `api_key`, `image_base_url`, and `stage2_generator`
- **AND** makes no Image2 network call

### Requirement: HTML browser and font checks are blocking base checks

After npm package presence succeeds, env-check SHALL dynamically enter the runtime owned by `html-render-runtime` and emit stable base check records for `chromium`, `html_fonts`, and `html_runtime_smoke`. Missing/mismatched Chromium, absent/corrupt font, CSS, manifest, provenance, or license assets, unsupported fixed sentinel coverage, network attempts, browser-launch failure, or fixture-geometry failure SHALL be `fail` and SHALL make base readiness NOT READY. The checker SHALL NOT install/download a browser or font and SHALL NOT accept OS font fallback as readiness evidence. With no run-dir, these checks SHALL NOT claim actual deck code-point coverage or pixel-overflow validation.

#### Scenario: Chromium has not been installed

- **WHEN** the pinned Playwright package exists but its paired Chromium is absent
- **THEN** `chromium` is `fail`, base readiness is NOT READY, and fix text identifies the explicit browser setup command
- **AND** no install or download is attempted

#### Scenario: Bundled font coverage is invalid

- **WHEN** the canonical font manifest, license, digest, or sentinel coverage check fails
- **THEN** `html_fonts` is `fail` and base readiness is NOT READY
- **AND** the checker does not hide the failure behind a system-font warning

#### Scenario: Static smoke succeeds

- **WHEN** the package-paired browser and valid distributed fonts render the fixed offline fixture with expected geometry and no network attempt
- **THEN** `html_runtime_smoke` is `ok`

#### Scenario: Base doctor has no deck coverage claim

- **WHEN** base readiness succeeds without a run-dir
- **THEN** its font result is scoped to the fixed sentinel corpus
- **AND** it does not assert that arbitrary slide source will fit or has complete glyph coverage
