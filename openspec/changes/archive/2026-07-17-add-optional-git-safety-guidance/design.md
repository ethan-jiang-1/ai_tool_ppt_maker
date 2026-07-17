## Context

The framework has two separate kinds of safety with different owners. Structural Versioning Path creates user-visible deck work versions in `deck_*/3_versions/vN/`; source/control files are the authoring truth, and `_generated/` is reproducible output. Git can add user-owned source audit and history, but it must not become a second version/order source or a production prerequisite.

`env-check.mjs` is a zero-dependency Node ESM checker whose `warn` results preserve `READY` as long as no result is `fail`. It runs in the process current working directory, which may be the framework repository, a parent workspace, or an existing deck; before `init`, it cannot prove anything about a future deck location. BOOTSTRAP maps stable base check names to beginner remediation sections. `bundle_layout.mjs` already seeds a `.gitignore` that excludes `.env`, `_generated/`, and scratch contents while retaining the scratch README.

Existing active documentation is not fully aligned: some pages correctly describe Git as audit history, while others say source is intrinsically Git-tracked, portray archive as mandatory `commit + push`, or show destructive visible-version replacement as rollback. This change reconciles that language without changing user-visible version authority or mutating an existing bundle.

Owners remain deliberately split:

- The environment checker owns bounded, deterministic observation of the invocation environment and existing READY calculation.
- MD/Agent guidance owns explanation, timing, and a recommendation when known context makes a checkpoint useful.
- The user owns repository-root choice and every Git mutation. An Agent may assist only after explicit approval of a named operation and its scope.
- Structural Versioning Path remains the sole framework mechanism for deck structure and visible work-version publication.

## Goals / Non-Goals

**Goals:**

- Surface one stable `git` advisory result through direct `env-check` output and `ppt_flow doctor`'s existing text delegation, without an npm dependency or changed hard-gate exit semantics.
- Give an Agent self-contained BOOTSTRAP guidance to install/verify Git, interpret current-directory scope correctly, and help a user choose a safe repository root before an explicitly user-authorized initialization.
- Define a precise optional model: `vN` is the deck work-version authority; Git is source/control audit; `_generated/` is reproducible derived output, ignored by a fresh bundle's seed, and never a required tracking target.
- Preserve the init-seeded ignore policy and make explicit that Git does not gate init, vNext publication, rendering, gate approval, or pipeline correctness.
- Keep recovery wording honest: a request to revisit a visible deck version preserves every `vN` and follows the established repair/vNext/new-deck escape ladder, rather than treating Git as a rollback command.

**Non-Goals:**

- No Git-based versioning, branching, order storage, render cache, or replacement for Structural Versioning Path.
- No new Git CLI command, Git-history reader, source-content comparison, framework-owned source-file replacement, Git-backed recovery receipt, or `ppt_flow doctor --json` option in this change.
- No automatic `git init`, add, commit, push, pull, remote edit, restore, reset, clean, working-tree inspection, or cleanup; explicit user authorization remains necessary before an Agent assists with a specific Git mutation.
- No remote URL, credential, author identity, commit subject/hash, branch, diff, status, config, raw Git stdout, or raw Git stderr in doctor output.
- No automatic migration or mutation of existing run bundles, and no use of `deck_*` production data as a test fixture.

## Decisions

### 1. One advisory check makes only positive Git facts

`env-check.mjs` will append one base check named exactly `git`. It observes **only the process current working directory**, and its public detail must state that scope without printing the path.

| Observed state | `git` status | Public meaning |
| --- | --- | --- |
| Executable available, cwd positively confirmed as a worktree, and `HEAD^{commit}` verifiable | `ok` | Current invocation directory has an existing Git history boundary |
| Executable missing | `warn` | Git is optional; installation can be considered |
| Cwd not positively confirmed as a worktree | `warn` | Choose a user-confirmed project root later if source audit is wanted |
| Positively confirmed worktree but HEAD not verifiable | `warn` | The repository may be new; first checkpoint remains user-owned |
| Timeout, permission, malformed, or unrecognized result | `warn` | Git safety status is unavailable; deck work may continue |

The existing `allPass = no fail` calculation remains the sole READY authority. The `git` record omits `foundation` so it cannot alter the existing foundation calculation. Git-only warnings therefore preserve direct `env-check` `READY`, `env-check-v1` JSON `allPass: true`, and exit `0`; unrelated hard failures remain failures. One check avoids a second externally synchronized vocabulary such as `git_executable`, `git_worktree`, and `git_head`.

### 2. A dedicated probe keeps privileged observation behind one deep module

Git probing will not reuse the general environment `run()` helper because that helper retains raw child output, inherits the full process environment, and has a longer timeout. A deep internal `probeGitSafety` module inside `env-check.mjs` owns parsing, command order, environment construction, and normalization behind one check-record interface. The production runner remains private, fixes child `cwd` to `process.cwd()`, uses `shell: false`, and gives the child ignored stdin. Tests may use a deliberately named non-CLI helper such as `probeGitSafetyForTest({ run, platform, env })`; it returns only the normalized public `git` check record. Its sole injected collaborator receives a fixed invocation record `{ command: "git", args, cwd: process.cwd(), shell: false, timeoutMs: 2000, maxBuffer: 4096, env }` and returns only `{ kind: "ok"|"missing"|"timeout"|"permission"|"exit"|"malformed", rc?, stdout?, stderrEmpty? }`. It accepts no shell string, caller-controlled cwd, arbitrary command/path, environment extension, or child stderr. Bounded stdout is consumed only inside the probe/test seam, never returned in the public check record.

The real runner uses the invocation's argument array, fixed **2-second** per-invocation timeout, and Node `maxBuffer` **4 KiB per captured stdout/stderr stream**, plus an allowlisted OS launch environment. It always sets `LC_ALL=C` / `LANG=C`. On POSIX it preserves `PATH`. On Windows it selects at most one case-insensitively found `PATH`/`Path` value and writes it under one canonical child key, then preserves `PATHEXT`, `SystemRoot`, `ComSpec`, and `WINDIR` when present; duplicate differently cased inherited keys are never forwarded. It copies no other inherited values, omits `IMAGE2_API_KEY`, `IMAGE2_BASE_URL`, and `PPT_FONT_DIR`, removes all inherited `GIT_*` names (case-insensitively on Windows), and then sets framework-owned `GIT_TERMINAL_PROMPT=0`, `GIT_OPTIONAL_LOCKS=0`, `GIT_NO_REPLACE_OBJECTS=1`, `GIT_CONFIG_NOSYSTEM=1`, and `GIT_CONFIG_GLOBAL` to Node's platform null device. The probe itself never exposes a raw child result outside its implementation/test seam.

The fixed probe sequence is:

1. `git --version`, accepting only one line matching `git version <major>.<minor>.<patch>` optionally followed by either `.windows.<number>` or ` (Apple Git-<number>)`; if displayed at all, only `<major>.<minor>.<patch>` is public.
2. After that succeeds, `git rev-parse --is-inside-work-tree`. Only `rc=0` with trimmed literal `true` positively confirms a worktree. `false`, nonzero, and non-positive results are normalized as unconfirmed without decoding stderr; malformed success output is unavailable/anomalous.
3. Only when step 2 positively confirms a worktree, `git rev-parse --verify --quiet HEAD^{commit}`. `rc=0` with a trimmed 40- or 64-hex object identifier is the sole positive history fact. Only an otherwise ordinary quiet `rc=1` with no stdout and `stderrEmpty: true` is normalized as generic “no verifiable HEAD”; timeout, permission, malformed success output, and every other nonzero result remain unavailable/anomalous.

The probe does not run `git status`, `git log`, `git diff`, `git remote`, `git config`, or any Git mutation command. A substituted executable on an untrusted `PATH` remains an operating-environment risk, so no sensitive environment values or raw output cross the module seam.

### 3. CWD observation and future deck safety are intentionally separate

Before `init`, doctor cannot know where the user will create a deck. Even after init, the process cwd might be an outer framework repository rather than the deck's intended audit root. Public wording therefore says only “current invocation directory”; it never claims that the deck is protected, tracked, clean, or recoverable.

BOOTSTRAP tells the Agent to explain this limitation when relevant. If a user wants Git protection for a deck, the Agent first asks them to identify and confirm the project root that should own the source. If the Agent must inspect whether that target lies in an existing worktree, it obtains separate explicit authorization for that named target-root inspection; it never infers the answer from doctor or a hidden command. Only after explicit user direction may the Agent assist with the named initialization or checkpoint operation. An ancestor worktree means no nested initialization. A deck version leaf and `_generated/` are never acceptable initialization roots.

### 4. Checkpoint advice uses known context, not hidden Git inspection

The Agent may give one concise optional reminder per **continuous source-work episode** when it already knows that real source has been authored, a structurally significant source publish has validated, or delivery/archival is occurring. An episode starts when the current interaction begins or resumes substantive source work for one deck and ends when the user changes task/deck or the interaction ends. A user decline or deferral suppresses every further reminder until that episode ends; a later interaction or different deck is a new episode without any persistent Git state. “Known” means user-provided context or source edits the Agent made in the current interaction; it does not authorize `git status` or other undisclosed working-tree inspection.

The reminder asks whether the user wants a Git action. It is not a gate and must not repeat as a blocking prompt. Before helping with a mutation, the Agent repeats the user-supplied named operation and scope; it must not infer files, staged changes, or effect from hidden inspection. If a user wants an inspection such as `git status` or `git diff`, that inspection and its scope need separately named authorization before the Agent runs it. A user who declines installation, initialization, or a checkpoint continues on the normal deck workflow as soon as existing hard gates pass.

### 5. Align the active documentation corpus rather than adding a lone paragraph

The implementation will update BOOTSTRAP, AGENT_CONTRACT, the generated deck-guide/reference template, COMMANDS, the change classifier, and the exact active documents currently characterizing Git or rollback: `PPTMAKER_FRAMEWORK/README.md`, `PPTMAKER_FRAMEWORK/AGENTS.md`, glossary, `workflow/00-setup/00-run-bundle-concept.md`, `04-conventions.md`, `README.md`, `workflow/01-visual/04-iterate-review-lock.md`, `workflow/04-production/05-stage-5-inject-speaker-notes.md`, and `workflow/05-iteration/02-style-iteration-workflow.md`. Their shared rule is:

```
deck vN + Structural Versioning Path = deck work-version authority
optional Git at a user-confirmed project root = source/control audit
_generated = reproducible derived output, not forced Git history
```

No active document may make Git installation, a clean worktree, a first commit, or `commit + push` an automatic prerequisite or terminal step. When history is mentioned, wording must make Git conditional on a user-owned repository; source/control files are eligible for tracking rather than inherently tracked. References to version snapshots must say clean downstream-source delta rather than full deck copy. Generic references to Git for framework-repository maintenance or to `git clone` as an optional diagnostic are not prohibited, but they must not tell a deck-production Agent to inspect status or mutate Git without the authorization model above.

When a user asks to revisit a **deck work version**, the Agent preserves every visible `vN`; it does not delete, overwrite, rename, or copy one visible version over another as a rollback shortcut. It follows the existing heading repair, fresh vNext, or new-deck escape ladder. This change does not choose or prescribe a generic Git recovery command. If a user independently gives explicit authorization for a named Git operation and scope, the general authorization rule applies, but no framework recovery protocol, state receipt, or source-replacement helper is introduced. Any future automated source-history recovery requires a separate change with its own source semantics, filesystem mutation, state, and authorization design.

### 6. Keep the ignore boundary declarative and Git-independent

`initBundle` will continue to seed `.gitignore` for every new run bundle whether or not the directory is currently a worktree. The contract is:

- Ignore `.env`.
- Ignore `3_versions/*/_generated/`.
- Ignore `3_versions/*/_scratch/*` while re-including `3_versions/*/_scratch/README.md`.
- Do not broadly ignore source/control Markdown, version source, overrides, metadata, `_state`, `_lessons`, or required control README files.

The layout authority owns the seed text and validates no structural behavior through Git. Its generated `deck-guide.md` remains create-if-absent. `workflow/00-setup/template-deck-guide.md` is a reference template rather than a second runtime seed, but both authoring surfaces must carry the same concise optional-Git rule. `init`, ordinary `--new-version`, and structural hidden-staging publication must neither invoke Git nor require a repository, a clean worktree, or a successful commit. Existing bundles remain untouched because init writes are create-if-absent; an intentional future migration may address legacy ignores separately.

## Risks / Trade-offs

- [A fake, aliased, or unusual Git executable yields unexpected text] -> Parse only a conservative version shape; collapse anything else to a generic warning and never expose raw output.
- [A child executable receives Image2 credentials through inherited environment] -> Use a dedicated allowlisted child environment that omits application credentials and inherited `GIT_*` overrides.
- [A Git process stalls during startup] -> Apply the fixed 2-second per-command timeout and downgrade timeout/permission/unknown failures to warning.
- [A worktree result is mistaken for deck protection] -> State current-invocation-directory scope in reports and BOOTSTRAP; require a user-confirmed root for any later action.
- [Documentation accidentally implies Git is required] -> Test the named active Git/rollback corpus for optional wording and forbidden mandatory `commit + push`/Git-tracked claims, while allowing scoped framework-maintenance references.
- [A beginner initializes in a nested or generated directory] -> Put root-confirmation and “do not initialize here” language in the one check-name-matched BOOTSTRAP section; require explicit user approval for any mutation.
- [A request to undo source is mistaken for a version rollback] -> Commands guidance preserves every visible `vN`, uses the existing escape ladder, and explicitly says this change provides no automated source-history recovery or default recovery command.
- [Git becomes a shadow version/order system] -> Charter and run-bundle requirements retain `vN`, source files, and structural receipts as their existing authorities and prohibit Git dependencies in publication paths.
- [Existing decks have different or absent ignore files] -> Do not rewrite them incidentally; document the seed guarantee for new bundles only.

## Migration Plan

1. Add and test the dedicated advisory probe first, retaining current hard-check behavior and the existing generic JSON schema.
2. Add the matching BOOTSTRAP/charter and active-document consistency updates in the same change.
3. Verify the current init seed against the formal ignore contract; make only any required seed/test adjustments for fresh bundles.
4. Run focused tests, direct `env-check` text/JSON checks, delegated `ppt_flow doctor` text checks, full regression, and OpenSpec validation.

No data migration runs. Existing decks are not modified, no repository is initialized, and no commit is created. Rollback is a source-only revert of the advisory check and guidance; it leaves user Git repositories and existing run bundles untouched.

## Open Questions

None. Source-history recovery is intentionally deferred instead of being hidden behind underspecified routing prose. The repository-root decision and every Git mutation remain user-owned; the framework only offers bounded observation and safe guidance. `cli-surface` is included deliberately because direct `env-check` changes child invocation and public check records, even though the existing generic `env-check-v1` schema needs no new top-level field or envelope rule.
