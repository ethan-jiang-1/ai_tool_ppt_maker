## Context

The framework already has two separate safeguards that solve different problems. The Structural Versioning Path creates user-visible work versions in `deck_*/3_versions/vN/`; source/control files remain the authoring truth, and `_generated/` is reproducible output. Git can add lower-level source comparison, audit, and recovery, but it is not currently visible during startup and must never become another version/order source or a production prerequisite.

`env-check.mjs` is a zero-dependency Node ESM checker whose `warn` results preserve `READY` as long as no result is `fail`. BOOTSTRAP maps stable base check names to beginner remediation sections. `bundle_layout.mjs` already seeds a `.gitignore` that excludes `.env`, `_generated/`, and scratch contents while retaining the scratch README. The design must turn those facts into a consistent optional-safety contract without reading, altering, or relying on a production deck.

Owners are deliberately split:

- JS owns the bounded, deterministic Git availability/worktree observation and the existing READY calculation.
- MD/Agent guidance owns when to recommend installation, repository setup, comparison, recovery, or a source checkpoint.
- The user owns any Git mutation such as repository initialization, staging, commit, restore, remote configuration, or push.

## Goals / Non-Goals

**Goals:**

- Surface a stable `git` advisory result through `doctor` and its JSON report without adding an npm dependency or changing hard-gate exit semantics.
- Give an Agent enough self-contained BOOTSTRAP guidance to tell a beginner how to install Git, verify it, identify an existing worktree, and choose a safe project root before any `git init`.
- State plainly that run-bundle `vN` is the work-version authority, Git is optional source audit/recovery, and `_generated/` stays derived and untracked.
- Preserve the init-seeded ignore policy and make explicit that Git does not gate `init`, vNext publication, rendering, gate approval, or pipeline correctness.

**Non-Goals:**

- No Git-based versioning, branching, order storage, render cache, or replacement for Structural Versioning Path.
- No new Git CLI command, no automatic `git init`, add, commit, restore, reset, push, pull, remote edit, or cleanup of a working tree.
- No remote URL, credential, author identity, commit subject, diff, status, or raw Git stderr in doctor output.
- No automatic migration or mutation of existing run bundles, and no use of `deck_*` production data as a test fixture.

## Decisions

### 1. One advisory `git` check, not a new readiness class

`env-check.mjs` will append one base check named exactly `git`. It will be `ok` only when a recognized Git executable is available and the current directory is inside a worktree. It will be `warn` when Git is absent, when the current directory is outside a worktree, or when the limited Git probe times out, fails, or returns an unrecognized result.

The existing `allPass = no fail` calculation remains the sole READY authority. Therefore Git-only warnings keep text output at `READY`, JSON `allPass: true`, and process exit `0`; unrelated hard failures remain failures. A single check avoids exposing a second externally synchronized vocabulary such as `git_executable` and `git_worktree`, while BOOTSTRAP needs only one matching `### git` section.

Alternative considered: make Git a hard prerequisite. Rejected because it would impose a creative-workflow barrier and make a source-audit enhancement control pipeline correctness. Alternative considered: omit Git from doctor and document it only. Rejected because the first-run safety opportunity is then easy to miss.

### 2. Bounded, read-only, sanitized observation

The checker will use Node's `execFileSync`-style argument API, never a shell, with a short bounded timeout. It may run only:

1. `git --version` to establish executable availability and parse a conservative version token.
2. `git rev-parse --is-inside-work-tree` only after the first command succeeds.

The result helper will return normalized facts rather than raw process output. Details may contain a parsed version token and generic state such as "worktree detected" or "current directory is not in a worktree"; they must never include raw stdout/stderr, command paths, remotes, user identity, commit data, or environment values. A timeout, permission error, or malformed output collapses to a concise advisory state.

The Git observation belongs in `environment-check`; it does not alter `ppt_flow` command registration, failure-envelope schema, node state, or run-bundle data. A small exported/pure helper or injected command runner makes unit coverage independent of the machine's actual Git installation, while the public CLI continues to use the real bounded runner.

Alternative considered: call `git status`, `git log`, or `git remote -v` for richer advice. Rejected because the details are unnecessary for startup readiness and materially increase privacy/output risk. Alternative considered: parse arbitrary Git output. Rejected because an advisory check must remain secret-safe even under a fake or compromised executable.

### 3. Startup guidance recommends a user-confirmed root, never a silent mutation

BOOTSTRAP Step 1 will add `### git`, matching the new stable check name. It will begin with the Agent-facing statement that Git is optional but recommended for source history and recovery, and that work may continue without it.

The section will provide copy-pasteable macOS, Linux, and Windows installation and `git --version` verification commands. When Git exists but the cwd is outside a worktree, the guidance will tell the Agent to identify and confirm a project root that contains the desired source before proposing `git init`. It will explicitly forbid initialization inside `_generated/` or an individual `3_versions/vN/` directory, and forbid nested initialization when an ancestor worktree is already detected.

The Agent may recommend a user-owned source checkpoint after initial real source authoring, before a structurally significant apply with important uncommitted source work, after a validated vNext, or at final delivery/archival. Recommendation is not authorization: no framework code or Agent default may create a repository, commit, push, change a remote, discard changes, or invoke a destructive restore without explicit user direction.

Alternative considered: seed and run `git init` during `ppt_flow init`. Rejected because the correct repository root is user/project-context dependent and nested repositories are harmful. Alternative considered: require a clean working tree before vNext. Rejected because vNext is a deck-owned source publication boundary, not a Git commit transaction.

### 4. Keep the ignore boundary declarative and independent of Git presence

`initBundle` will continue to seed `.gitignore` for every new run bundle whether or not the directory is currently a worktree. The contract is:

- ignore `.env`;
- ignore `3_versions/*/_generated/`;
- ignore `3_versions/*/_scratch/*` while re-including `3_versions/*/_scratch/README.md`;
- do not broadly ignore source/control Markdown, version source, overrides, metadata, `_state`, or required control README files.

The layout authority owns the seed text and validates no structural behavior through Git. `init`, ordinary `--new-version`, and structural hidden-staging publication must neither invoke Git nor require a repository, a clean worktree, or a successful commit. Existing bundles remain untouched because init writes are create-if-absent; an intentional future migration may address legacy ignores separately.

Alternative considered: track generated outputs to gain a visual history. Rejected because derived bytes are reproducible, can be large, and would blur the source/derived boundary. Alternative considered: omit `.gitignore` until a user initializes Git. Rejected because it makes a later `git init` more likely to capture secrets and regenerable artifacts accidentally.

### 5. Verification is focused on behavior boundaries, not a live Git dependency

Unit tests will cover the Git helper with injected fake command results for absent executable, worktree success, non-worktree result, timeout/error, malformed version output, and sanitization. Public env-check tests will use a temporary fake `git` on `PATH` where portable, asserting JSON/text reports include the one advisory check and Git-only warnings preserve exit `0`/`READY`. Existing hard-failure tests will prove that an advisory warning does not mask a real failure.

Integration tests will initialize temporary run bundles and inspect `.gitignore`, confirming the precise ignore/re-include rules, source/control non-exclusion, and absence of an auto-created nested `.git` directory. Documentation consistency tests will confirm BOOTSTRAP's `### git` header, safe-root guidance, optional wording, and charter vocabulary. An E2E test is not required: no user-visible production pipeline or persisted run-bundle workflow changes, and the public `doctor` CLI integration plus temporary-bundle tests cover the externally observable boundaries.

## Risks / Trade-offs

- [A fake, aliased, or unusual Git executable yields unexpected text] → Parse only a conservative version token; collapse anything else to a generic warning and never expose raw output.
- [A Git process stalls during startup] → Use a short per-command timeout and downgrade timeout/permission/unknown failures to warning.
- [Documentation accidentally implies Git is required] → Test the exact optional/continue wording and preserve the existing warning-versus-hard-failure gate contract.
- [A beginner initializes in a nested or generated directory] → Put root-confirmation and "do not initialize here" language in the one check-name-matched BOOTSTRAP section; require explicit user approval for any mutation.
- [Git becomes a shadow version/order system] → Charter and run-bundle requirements explicitly retain `vN`, source files, and structural receipts as their existing authorities and prohibit Git dependencies in publication paths.
- [Existing decks have different or absent ignore files] → Do not rewrite them incidentally; document the seed guarantee for new bundles only.

## Migration Plan

1. Add the advisory check and its focused tests first, retaining current hard-check behavior.
2. Add the matching BOOTSTRAP/charter guidance and documentation consistency coverage in the same change.
3. Verify the current init seed against the formal ignore contract; make only any required seed/test adjustments for fresh bundles.
4. Run targeted tests, full regression, `doctor` in both text and JSON modes, and OpenSpec validation.

No data migration runs. Existing decks are not modified, no repository is initialized, and no commit is created. Rollback is a source-only revert of the advisory check and guidance; it leaves user Git repositories and existing run bundles untouched.

## Open Questions

None. The project-root choice is intentionally user-owned: the framework will provide safe guidance but will not infer or mutate a repository boundary.
