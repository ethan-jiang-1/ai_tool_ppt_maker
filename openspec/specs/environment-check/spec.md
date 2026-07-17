## Purpose

Define the pre-flight environment check (`scripts/env-check.mjs`) that verifies a machine is ready to run the pipeline: a zero-dependency script (Node.js built-ins only) that gates the Node.js version (>= 18), npm and the hard-required packages (`@napi-rs/canvas`, `pptxgenjs`, `commander`), the Image2 API key (`IMAGE2_API_KEY`), and a hard-required image API base URL (`IMAGE2_BASE_URL`), then emits a structured READY / NOT READY report with a matching exit code. This capability guarantees that setup problems are diagnosed with actionable messages before the pipeline runs, and that the check itself never requires `npm install` to execute.

## Requirements

### Requirement: Zero-dependency runtime check

`scripts/env-check.mjs` SHALL have zero npm dependencies. It SHALL run on any Node.js >= 18 installation without `npm install` first, using only Node.js built-in modules (`fs`, `path`, `os`, `child_process`).

#### Scenario: Run without node_modules

- **WHEN** `node scripts/env-check.mjs` runs in a fresh directory with no `node_modules/`
- **THEN** script executes successfully

### Requirement: Node.js version gate

The env check SHALL verify Node.js version >= 18 at startup. If older or absent, SHALL output FOUNDATION NOT READY and exit non-zero.

#### Scenario: Version check

- **WHEN** Node.js 20.0.0 is installed → version check passes
- **WHEN** Node.js 16.0.0 is installed → report shows required vs found version, exits non-zero

### Requirement: npm and dependency check

The env check SHALL verify npm is available. It SHALL verify that the hard-required packages `@napi-rs/canvas`, `pptxgenjs`, and `commander` are each present by walking **upward from `process.cwd()`** (the same upward-search strategy used for `.env` loading) and checking for `node_modules/<package>` under each ancestor. Presence MAY be determined by filesystem checks (consistent with the current checker). The checker SHALL NOT stop at the first ancestor that merely contains a `node_modules` directory if a required package path is missing there — it SHALL continue upward (Node-like). If no ancestor yields a given required package, that check SHALL fail and instruct the user to run `npm install` in the project root (the directory that owns `package.json` / `node_modules`).

#### Scenario: Dependencies installed at project root while cwd is a deck

- **WHEN** `node_modules` with the required packages exists at a parent of `process.cwd()` (for example repo root)
- **AND** the checker is invoked with `cwd` set to a child deck directory that has no local `node_modules`
- **THEN** the dependency checks for `@napi-rs/canvas`, `pptxgenjs`, and `commander` report status `ok`

#### Scenario: Dependencies missing

- **WHEN** no ancestor of `process.cwd()` contains `node_modules/<package>` for a required package
- **THEN** that dependency check reports failure
- **AND** the fix text instructs the user to run `npm install` in the project root

#### Scenario: Dependencies at cwd still work

- **WHEN** `node_modules` with the required packages exists directly in `process.cwd()`
- **THEN** `@napi-rs/canvas`, `pptxgenjs`, and `commander` are verified as present

#### Scenario: Empty local node_modules does not block parent packages

- **WHEN** `process.cwd()` contains an empty or incomplete `node_modules`
- **AND** a parent directory contains `node_modules` with the required packages
- **THEN** the dependency checks for those packages still report status `ok`

### Requirement: API key verification

The env check SHALL verify that image-generation credentials can resolve at least one usable API key, consistent with `resolveVendors` / Image2 contract:

- **Shared key path:** non-empty `IMAGE2_API_KEY`.

When no shared key is available, `api_key` SHALL fail. Fix text SHALL name `IMAGE2_API_KEY`.

#### Scenario: Canonical IMAGE2 key

- **WHEN** `.env` contains non-empty `IMAGE2_API_KEY`
- **THEN** `api_key` passes and detail identifies `IMAGE2_API_KEY`

#### Scenario: Missing key

- **WHEN** no `IMAGE2_API_KEY` is set
- **THEN** `api_key` fails and fix names `IMAGE2_API_KEY`

### Requirement: Image API base URL is a hard requirement

The env check SHALL require a resolvable image API endpoint configuration via:

- non-empty `IMAGE2_BASE_URL`.

When none is set, `image_base_url` SHALL be **`fail`** and overall NOT READY. The check SHALL NOT claim a silent default endpoint when URL is unset. Fix text SHALL name `IMAGE2_BASE_URL`.

#### Scenario: Canonical IMAGE2 base URL

- **WHEN** `.env` contains `IMAGE2_BASE_URL=https://example/v1`
- **THEN** `image_base_url` passes

#### Scenario: Missing base URL fails doctor

- **WHEN** a shared key is present but no base URL variable is set
- **THEN** `image_base_url` is `fail` and env-check is NOT READY

### Requirement: In-framework Stage 2 scripts are a hard requirement

The env check SHALL treat missing in-framework Stage 2 modules as a hard failure
when absent — not a warning. It SHALL verify these files exist under
`PPTMAKER_FRAMEWORK/scripts/`:
`stage2_generate_images.mjs`, `make_contact_sheet.mjs`, `image_api_client.mjs`.
It SHALL NOT search `.claude/skills/` or `.agents/skills/`.

#### Scenario: Scripts present

- **WHEN** the three Stage 2 modules exist under `scripts/`
- **THEN** `stage2_generator` status is `ok` and detail mentions `in-framework`

#### Scenario: Scripts missing

- **WHEN** any of the three modules is missing
- **THEN** `stage2_generator` status is `fail`, overall verdict is NOT READY, exit non-zero

### Requirement: Structured READY/NOT READY output

The env check SHALL output a structured report with per-check status and an overall verdict. Exit 0 on READY, non-zero on NOT READY.

#### Scenario: Output format

- **WHEN** all checks pass → output ends with "READY", exit 0
- **WHEN** any check fails → output ends with "NOT READY", lists all failures, exit non-zero

### Requirement: Optional --smoke performs one live credential probe

`env-check.mjs` SHALL accept `--smoke`. When set (and `--probe-vendors` is not set), after presence checks pass, it SHALL perform one minimal live Image2 probe against the **first** vendor from `resolveVendors`. Success SHALL be an extractable image ref **or** a task id, using the same exported extract helpers as the client (no forked parser). Full async image completion is NOT required. Without `--smoke` and without `--probe-vendors`, env-check SHALL NOT make Image2 network calls. Zero npm dependencies (dynamic-import sibling ESM allowed).

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

### Requirement: Optional --probe-vendors reports every Image2 channel

`env-check.mjs` SHALL accept `--probe-vendors`. When set, after presence checks pass, it SHALL live-probe **each** vendor from `resolveVendors` in order (same success rule as `--smoke`: image ref or task id; no forked parser). It SHALL log `probing i/N` progress and per-vendor submit heartbeats consistent with the image client's wait contract. For each vendor it SHALL print `base_url`, `ok|fail`, `mode` (`sync`|`async`|`unknown`), `elapsed_s`, and a short `error` on failure — never API key values. After all probes it SHALL print a Summary (OK vs FAIL) with working vendors first sorted by ascending elapsed time; failed vendors appended in original relative order. Exit 0 if at least one vendor is OK; otherwise non-zero with an actionable failure path. It SHALL NOT write `.env` or `_lessons/`. If both `--smoke` and `--probe-vendors` are passed, the tool SHALL fail with a clear usage error (mutually exclusive).

#### Scenario: --probe-vendors lists per-vendor outcomes

- **WHEN** three vendors are configured and `--probe-vendors` runs
- **THEN** output includes a result line for each vendor
- **AND** no API key values appear in the output

#### Scenario: --probe-vendors exits non-zero when all fail

- **WHEN** every vendor probe fails
- **AND** `--probe-vendors` runs
- **THEN** the process exits non-zero

#### Scenario: --smoke and --probe-vendors together are rejected

- **WHEN** both `--smoke` and `--probe-vendors` are passed
- **THEN** the process exits non-zero with a usage/mutual-exclusion error

### Requirement: Git safety observation is advisory, bounded, and scope-honest

`scripts/env-check.mjs` SHALL include one stable base check named `git`, implemented with Node.js built-ins and no npm dependency. The check SHALL observe only the process current working directory; its production child runner SHALL fix `cwd` to `process.cwd()`, use `shell: false` with ignored stdin, and expose no caller-controlled cwd/path input. Its public text SHALL describe that scope without emitting the directory path and SHALL NOT claim that a future or separately located run bundle is protected, tracked, clean, or recoverable.

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
