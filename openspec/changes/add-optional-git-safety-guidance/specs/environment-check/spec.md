## ADDED Requirements

### Requirement: Git safety observation is advisory and secret-safe

`scripts/env-check.mjs` SHALL include one stable base check named `git`, implemented with Node.js built-ins and no npm dependency. The check SHALL first use a bounded, argument-safe invocation equivalent to `git --version`; only after executable availability is established MAY it use a bounded invocation equivalent to `git rev-parse --is-inside-work-tree` for the current working directory.

The check SHALL be `ok` only when Git availability is established and the current directory is inside a worktree. It SHALL be `warn`, never `fail`, when Git is unavailable, the current directory is not inside a worktree, a probe times out or is denied, or command output cannot be safely recognized. Detail and fix text SHALL use only normalized facts: a conservative version token when safely parseable, and generic executable/worktree state. It SHALL NOT expose a remote URL, credential, environment value, username, command path, commit, branch, diff, raw stdout, or raw stderr.

#### Scenario: Missing Git remains an advisory warning

- **WHEN** the bounded `git --version` probe reports executable-not-found
- **THEN** the base report includes one `git` check with status `warn` and an installation-oriented fix
- **AND** it does not expose the failed command's raw error text

#### Scenario: Git is present outside a worktree

- **WHEN** Git is available and the worktree probe returns false for the current directory
- **THEN** the `git` check has status `warn` and states that source history can be set up later at a confirmed project root
- **AND** it does not recommend or execute initialization in the current version leaf or `_generated/`

#### Scenario: Existing worktree is recognized without repository details

- **WHEN** Git is available and the worktree probe returns true
- **THEN** the `git` check has status `ok` and reports only a normalized Git/version and protected-worktree fact
- **AND** no remote, identity, commit, branch, status, or raw command output appears in text or JSON output

#### Scenario: Git probe anomaly is contained

- **WHEN** a Git probe times out, is denied, returns an unexpected exit, or produces malformed output
- **THEN** the `git` check is a concise `warn`
- **AND** the checker completes without throwing or exposing raw process output

### Requirement: Git warnings do not alter environment readiness

The `git` check SHALL participate in the existing text and JSON check list but SHALL NOT change the established meaning of `allPass`, foundation readiness, READY/NOT READY text, or process exit status. Git availability, worktree status, worktree cleanliness, and commit history SHALL NOT be hard prerequisites for `doctor`, `init`, Stage execution, rendering, gate approval, or structural version publication.

#### Scenario: Git-only warning keeps doctor ready

- **WHEN** all existing hard checks pass and `git` is `warn`
- **THEN** human-readable output ends in `READY`
- **AND** JSON reports `allPass: true` and the process exits 0

#### Scenario: Hard failure remains blocking beside Git warning

- **WHEN** `git` is `warn` and an existing hard requirement is `fail`
- **THEN** the overall report remains NOT READY and exits non-zero because of the hard requirement
- **AND** the Git warning does not appear as a blocking diagnostic issue

