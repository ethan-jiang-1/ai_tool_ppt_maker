## ADDED Requirements

### Requirement: Git safety observation is advisory, bounded, and scope-honest

`scripts/env-check.mjs` SHALL include one stable base check named `git`, implemented with Node.js built-ins and no npm dependency. The check SHALL observe only the process current working directory; its production child runner SHALL fix `cwd` to `process.cwd()`, use `shell: false` with ignored stdin, and expose no caller-controlled cwd/path input. Its public text SHALL describe that scope without emitting the directory path and SHALL NOT claim that a future or separately located run bundle is protected, tracked, clean, or recoverable.

The probe SHALL use only a fixed, argument-safe sequence: a bounded `git --version` with a conservative one-line parse that accepts exactly `git version <major>.<minor>.<patch>` plus only the optional `.windows.<number>` or ` (Apple Git-<number>)` suffix; after a recognized version succeeds, a bounded `git rev-parse --is-inside-work-tree`; and only after literal `true`, a bounded `git rev-parse --verify --quiet HEAD^{commit}` accepting only a 40- or 64-hex object identifier. Each invocation SHALL use `shell: false`, ignored stdin, a 2-second timeout, and Node `maxBuffer` of 4 KiB per captured stdout/stderr stream. Only a quiet no-stdout/no-stderr `rc=1` HEAD verification result MAY be normalized as no-verifiable-HEAD; every other nonzero/timeout/permission/malformed result is unavailable. The child environment SHALL be allowlisted enough to preserve platform-required executable discovery while omitting framework credentials and removing inherited `GIT_*` overrides (case-insensitively on Windows); on Windows it SHALL forward at most one canonicalized `PATH`/`Path` key. It SHALL set `LC_ALL=C` and `LANG=C` on every platform, plus framework-owned `GIT_TERMINAL_PROMPT=0`, `GIT_OPTIONAL_LOCKS=0`, `GIT_NO_REPLACE_OBJECTS=1`, `GIT_CONFIG_NOSYSTEM=1`, and `GIT_CONFIG_GLOBAL` to Node's platform null device so global/system Git configuration and replacement refs do not affect the probe. The implementation SHALL not invoke shell parsing, `git status`, `git log`, `git diff`, `git remote`, `git config`, or any Git mutation command.

The check SHALL be `ok` only when a conservatively recognized version is available, `rev-parse --is-inside-work-tree` exits zero with trimmed literal `true`, and `HEAD^{commit}` is verifiable. It SHALL be `warn`, never `fail`, when Git is unavailable, the current directory is not positively confirmed as a worktree, the positively confirmed worktree has no verifiable commit at HEAD, a probe times out or is denied, or output is malformed/unrecognized. A nonzero worktree probe without a separately classified timeout/permission condition SHALL be rendered only as “current directory not confirmed as a worktree”; it SHALL not infer an exact cause from raw stderr. Detail and fix text SHALL contain only normalized facts and generic state; they SHALL NOT expose a remote URL, credential, environment value, username, command path, commit, branch, diff, status, raw stdout, or raw stderr.

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
- **AND** it does not report “outside a worktree,” retain stderr, or expose the reason for the nonzero exit

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
