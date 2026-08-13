# Harness Signal Cleanup - Progress Plan

> Type: program control sheet | Updated: 2026-08-13
> Program status: `active`
> Current gate: admit Change 2 after Change 1 normal closure

This file tracks program-level execution and evidence. It is not a second source
of truth for behavior: each OpenSpec change owns its WHY/WHAT/HOW/tasks, current
main specs own accepted behavior, and archived changes preserve history.

## How to Update This File

- Check an item only when its stated evidence exists; update it immediately at
  the same milestone, without creating a commit solely for checkbox churn.
- Keep the summary row, the detailed checklist, and the evidence record in sync.
- Record exact active/archive paths, verification results, and commit SHAs. Do
  not use prose such as "basically done" in place of evidence.
- OpenSpec `tasks.md` owns implementation task detail. This file tracks only
  cross-change order, lifecycle gates, decisions, and Git closure.
- Use `blocked` only with a named blocker and owner. Use `done` only after the
  change is archived, pushed normally, and all four master SHAs reconcile.
- If scope or architecture changes, revise the relevant OpenSpec artifacts
  first, then update this projection. Never resolve a behavioral conflict here.

Status vocabulary: `not-started`, `ready`, `active`, `blocked`,
`decision-required`, `rejected`, `done`.

## Program Invariants

- [x] Scope is limited to `ppt_maker_harness/`, `openspec/`, `tests/`,
  `tests_e2e/`, root active guidance, and this authorized plan package.
- [x] `deck_*`, `dpt_*`, and historical production data are excluded.
- [x] Compatibility readers, aliases, converters, and migrations are excluded;
  the target is one current active contract.
- [x] `openspec/changes/archive/` remains historical evidence and is not cleaned
  as an active authority surface.
- [x] Every deletion must close live entries/consumers and preserve any current
  invariant in its owning spec/test before the old surface disappears.
- [x] Drift guards are part of Changes 1-4, with planted negative controls; they
  are not an optional follow-up batch.
- [x] Git closure uses exact-path staging, ordinary commits, and ordinary
  fast-forward pushes only: no rebase, reset, history rewrite, or force push.
- [ ] Every P0/P1 finding is resolved or explicitly rejected with an owner and
  rationale.
- [ ] Every retained active concept has one declared authority and a live
  consumer.
- [ ] Final `HEAD`, local `master`, `origin/master`, and remote `master` match,
  with no cleanup-related worktree residue.

## Dependency Order

```text
investigation + green baseline (done)
                |
                v
1. converge-active-harness-authority
                |
                v
2. retire-historical-protocol-surfaces
                |
                v
3. remove-competing-agent-routing-surfaces
                |
                v
4. close-controller-metadata-schema
                |
                v
5. production_mode decision gate
       | collapse approved      | retain deliberately
       v                        v
collapse-singleton-       record decision and
production-mode           verify retained authority
       \_______________________/
                |
                v
        final program closure
```

Only one cleanup change should be active at a time. A later change may be
explored while an earlier one runs, but it must not implement against an
unsettled authority surface.

## Status Summary

| Order | Work item | Status | Depends on | Evidence path | Closure commit |
| --- | --- | --- | --- | --- | --- |
| 0 | Investigation and baseline | `done` | - | this plan package | `71e1f85` |
| 1 | `converge-active-harness-authority` | `done` | 0 | `openspec/changes/archive/2026-08-13-converge-active-harness-authority/` | `640727a` |
| 2 | `retire-historical-protocol-surfaces` | `not-started` | 1 | - | - |
| 3 | `remove-competing-agent-routing-surfaces` | `not-started` | 2 | - | - |
| 4 | `close-controller-metadata-schema` | `not-started` | 3 | - | - |
| 5 | Singleton production-mode decision | `decision-required` | 4 | - | - |
| 5a | `collapse-singleton-production-mode` | `blocked` | collapse decision | - | - |
| 5b | Deliberate singleton-mode retention | `blocked` | retention decision | - | - |
| 6 | Final program closure | `blocked` | 1-4 + 5a or 5b | - | - |

## 0. Investigation and Baseline

- [x] Active Harness source boundary was established without reading `deck_*`
  or `dpt_*`.
- [x] Active guidance/spec/config/runtime contradictions were inventoried in
  `findings.md`.
- [x] Candidate deletions and their preconditions were recorded in
  `deletion-matrix.md`.
- [x] Cleanup work was split into ownership-coherent OpenSpec changes in
  `program.md`.
- [x] Git, recovery, pre-push, and post-push invariants were recorded in
  `safety-and-closure.md`.
- [x] `openspec list --json` reported no active changes at investigation close.
- [x] `npm test` passed.
- [x] `npm run test:sweep` passed: 68 files, 552 tests.
- [x] Focused docs consistency passed: 6/6 tests.
- [x] Focused architecture/schema/controller verification passed: 43/43 tests.
- [x] `openspec validate --all --strict` passed: 27/27 specs.

Baseline note: green tests coexist with known contradictions because current
coherence guards do not exercise all surfaces they claim to cover.

## OpenSpec Lifecycle Definition

Every approved change below has its own lifecycle checklist. Each label means:

| Label | Done when |
| --- | --- |
| `admission` | `origin/master` was fetched; start/local/tracking/remote SHAs, worktree state, and active changes were checked |
| `scaffold` | `openspec new change <name>` created the change; its directory was not made by hand |
| `proposal` | WHY, scope, capabilities, control owner, run-bundle impact, non-goals, and retired concepts are captured |
| `specs` | Current-only observable behavior and required REMOVED notes are assigned to the actual owning capabilities |
| `design` | Authority, readers/writers, deletion/cutover, failure/recovery, guard sensitivity, tests, and net concepts are closed |
| `tasks` | Source/spec/controller/consumer/docs work, negative controls, verification, archive, and Git closure are covered |
| `artifact-validation` | Planning artifacts are coherent and the active change passes strict OpenSpec validation before apply |
| `apply` | Accepted tasks are implemented and checked as completed; material scope changes first revise the artifacts |
| `focused-verification` | Affected tests and safe planted violations prove the changed guards fail and recover as designed |
| `baseline-and-residue` | Baseline tests, strict validation, `git diff --check`, and scoped old-surface searches pass |
| `archive` | Accepted deltas are reflected in main specs and the change is archived through OpenSpec, then strictly revalidated |
| `commit` | Exact intended paths and staged diff were inspected; ordinary coherent commit(s) and closure SHA are recorded |
| `push-and-reconcile` | Remote parent was rechecked; ordinary push succeeded; four master SHAs match; status/path/evidence are projected here |

Checkpoint commits are allowed when a change spans sessions, but only the
post-archive ordinary commit/push/reconciliation closes a change. Never use
`git add .`, force push, or history rewriting.

Use the local OpenSpec root and let the CLI supply artifact-specific
instructions rather than guessing a template:

```bash
openspec new change <name>
openspec status --change <name> --json
openspec instructions <artifact> --change <name> --json
openspec validate <name> --type change --strict --no-interactive
openspec archive <name> -y
openspec validate --all --strict --no-interactive
```

## 1. `converge-active-harness-authority`

Status: `done`; archived, ordinarily committed, pushed, and reconciled.

Lifecycle:

- [x] `admission`
- [x] `scaffold`
- [x] `proposal`
- [x] `specs`
- [x] `design`
- [x] `tasks`
- [x] `artifact-validation`
- [x] `apply`
- [x] `focused-verification`
- [x] `baseline-and-residue`
- [x] `archive`
- [x] `commit`
- [x] `push-and-reconcile`

Change-specific closure:

- [x] Make the config capability registry bijective with current main specs.
- [x] Replace all nonexistent implementation paths with current public owner
  paths, without exposing private internals as new authority.
- [x] Remove retired lifecycle numbering, render aliases, Chain aliases, and
  stale Stage 1-5 routing from active OpenSpec context.
- [x] Replace `Frozen Identifier` compatibility framing with exact current
  schema-contract language.
- [x] Fill the `slide-identity-and-ordering` purpose and correct stale source
  ownership comments/README labels.
- [x] Add guards for registry/spec mismatch and nonexistent literal authority
  paths, including missing-capability, extra-capability, and stale-path negative
  controls.
- [x] Prove every literal authority path exists and every current spec is
  represented exactly once.
- [x] Record active path: `openspec/changes/converge-active-harness-authority/`
- [x] Record archive path: `openspec/changes/archive/2026-08-13-converge-active-harness-authority/`
- [x] Record closure SHA: `640727a`

## 2. `retire-historical-protocol-surfaces`

Status: `not-started`; dependency: Change 1 is `done`.

Lifecycle:

- [ ] `admission`
- [ ] `scaffold`
- [ ] `proposal`
- [ ] `specs`
- [ ] `design`
- [ ] `tasks`
- [ ] `artifact-validation`
- [ ] `apply`
- [ ] `focused-verification`
- [ ] `baseline-and-residue`
- [ ] `archive`
- [ ] `commit`
- [ ] `push-and-reconcile`

Change-specific closure:

- [ ] Confirm Change 1's authority map is the accepted starting point.
- [ ] Delete the retired `html-slide-rendering` main-spec capability only after
  confirming all current Framed behavior has another explicit owner.
- [ ] Replace v2-named tombstones with positive current contracts and generic
  undeclared-input rejection where that boundary remains required.
- [ ] Converge action ID, action kind, human requirement, byte preservation, and
  zero-provider/mutation semantics on one owner-issued recovery taxonomy.
- [ ] Update runtime, specs, Controllers/guidance, fixtures, and tests atomically;
  delete historical aliases and fixtures rather than converting them.
- [ ] Plant negative controls for historical-version prose, retired recovery
  actions, and compatibility-reader claims across the full declared active
  scan scope.
- [ ] Prove known-invalid current-shaped inputs hard-stop without byte changes,
  provider work, or mutation.
- [ ] Record active path: `-`
- [ ] Record archive path: `-`
- [ ] Record closure SHA: `-`

## 3. `remove-competing-agent-routing-surfaces`

Status: `not-started`; dependency: Change 2 is `done`.

Lifecycle:

- [ ] `admission`
- [ ] `scaffold`
- [ ] `proposal`
- [ ] `specs`
- [ ] `design`
- [ ] `tasks`
- [ ] `artifact-validation`
- [ ] `apply`
- [ ] `focused-verification`
- [ ] `baseline-and-residue`
- [ ] `archive`
- [ ] `commit`
- [ ] `push-and-reconcile`

Change-specific closure:

- [ ] Confirm Changes 1-2 leave one current authority/recovery vocabulary.
- [ ] Reconfirm `reference/agent-prompts.md` has no live inbound current
  consumer, then delete it.
- [ ] Compare both workflow-inspection prose records against their owning main
  spec and machine ledger; absorb only unique current invariants, then delete
  both prose projections.
- [ ] Enumerate every Intent Route Catalog reference and first-handoff behavior.
- [ ] Decide the catalog family as one surface. Default: delete its JSON, reader,
  schema declaration, dedicated tests, and duplicate guidance if existing
  `COMMANDS`/classifier/Controllers/inspection fully own the handoff.
- [ ] If any catalog surface is retained, record its fact authority, owner,
  live consumer, non-overlapping jurisdiction, and why deletion would lose a
  current contract; do not retain it as an unexplained exception.
- [ ] Add a reachability guard rooted in declared executable/public/contract
  entries, with planted orphan detection and exact, owned, shrink-only
  exceptions for any justified data/plugin entry.
- [ ] Prove no prompt cookbook, orphan prose projection, or unconsumed parallel
  routing authority remains active.
- [ ] Record active path: `-`
- [ ] Record archive path: `-`
- [ ] Record closure SHA: `-`

## 4. `close-controller-metadata-schema`

Status: `not-started`; dependency: Change 3 is `done`.

Lifecycle:

- [ ] `admission`
- [ ] `scaffold`
- [ ] `proposal`
- [ ] `specs`
- [ ] `design`
- [ ] `tasks`
- [ ] `artifact-validation`
- [ ] `apply`
- [ ] `focused-verification`
- [ ] `baseline-and-residue`
- [ ] `archive`
- [ ] `commit`
- [ ] `push-and-reconcile`

Change-specific closure:

- [ ] Confirm earlier deletion work did not leave metadata consumers outside
  the declared Controller reader path.
- [ ] Specify exact allowed keys separately for Controller frontmatter,
  shared-node frontmatter, and fenced node declarations.
- [ ] Keep `method_module` as the sole lifecycle-location declaration.
- [ ] Reject `phase`, `lifecycle_phase`, misspellings, duplicate keys where
  ambiguous, and every other undeclared key with a bounded diagnostic.
- [ ] Replace legacy-acceptance tests with planted negative controls for every
  closed metadata boundary.
- [ ] Validate all checked-in Controllers under the closed grammar.
- [ ] Prove a stale or misspelled key cannot be silently ignored or projected
  into state.
- [ ] Record active path: `-`
- [ ] Record archive path: `-`
- [ ] Record closure SHA: `-`

## 5. Singleton Production-Mode Decision Gate

Status: `decision-required`; dependency: Change 4 is `done`.

This is a design decision, not a presumed deletion. Do not scaffold
`collapse-singleton-production-mode` until the collapse branch is approved.

- [ ] Enumerate every `production_mode` reader, writer, persisted field,
  Controller key, CLI surface, schema anchor, and test.
- [ ] Separate current pipeline identity/checksum facts from historical layering
  and from the version-level `framed|pure` workflow choice.
- [ ] Model missing, corrupt, mismatched, stale, retry, restart, replay,
  concurrent-write, partial-cutover, and uncertain-commit paths.
- [ ] Define decision authority, recovery owner/action, terminal invariant, and
  evidence for each material negative path.
- [ ] Compare exact concept subtraction and addition: schema fields, functions,
  branches, Controller keys, public/persisted promises, tests, and guards.
- [ ] Confirm the proposed clean cutover enumerates all consumers/state and
  requires no Run Bundle scan, migration, alias, or compatibility reader.
- [ ] Choose one outcome with project-owner approval: collapse because it
  demonstrably removes net concepts, or deliberate retention because the
  dimension owns a distinct invariant.
- [ ] Record the rationale in a dedicated decision note in this plan package.
  If collapse is chosen, carry it into the change proposal/design; if retention
  changes any active contract, scope that modification through OpenSpec before
  claiming closure.
- [ ] Record decision outcome: `-`
- [ ] Record decision artifact/path: `-`
- [ ] Record decision commit SHA: `-`

### 5a. Collapse Branch (Conditional)

Status: `blocked` pending an approved collapse decision.

Lifecycle (do not start before project-owner approval):

- [ ] `admission`
- [ ] `scaffold`
- [ ] `proposal`
- [ ] `specs`
- [ ] `design`
- [ ] `tasks`
- [ ] `artifact-validation`
- [ ] `apply`
- [ ] `focused-verification`
- [ ] `baseline-and-residue`
- [ ] `archive`
- [ ] `commit`
- [ ] `push-and-reconcile`

Change-specific closure:

- [ ] Scaffold name is exactly `collapse-singleton-production-mode` unless the
  approved decision note records why its scope requires a different name.
- [ ] Update every active reader/writer/schema/controller/test in one clean
  cutover; leave no forwarding reader, legacy field, alias, or migration path.
- [ ] Prove source/state identity, failure, restart, and concurrency behavior at
  the same or stronger boundary with fewer net concepts.
- [ ] Record active path: `-`
- [ ] Record archive path: `-`
- [ ] Record closure SHA: `-`

### 5b. Retention Branch (Conditional)

Status: `blocked` pending project-owner approval of deliberate retention.

- [ ] Name the distinct invariant owned by `production_mode` and why the current
  pipeline/workflow authorities cannot own it without distortion.
- [ ] Confirm one fact authority, accountable owner, writer/admission path,
  consumers, persisted contract, failure/recovery behavior, and drift guard.
- [ ] Confirm the accepted decision note is sufficient evidence when no active
  behavior changes; otherwise complete a scoped OpenSpec lifecycle before
  marking this branch `done`.
- [ ] Remove any incidental residue found during the decision work through an
  appropriately scoped OpenSpec change; do not hide cleanup inside the record.
- [ ] Record the accepted retention evidence and commit SHA in the summary.

## 6. Final Program Closure

Status: `blocked` until Changes 1-4 and exactly one Change 5 branch close.

- [ ] Changes 1-4 are `done` and each has an archive path and reconciled closure
  SHA.
- [ ] Exactly one singleton-mode outcome is accepted and fully recorded; Change
  5a is also `done` if collapse was selected.
- [ ] Every P0/P1 finding in `findings.md` maps to a closed change or an explicit
  rejection with decision authority, owner, and rationale.
- [ ] Every `delete`/`absorb` row in `deletion-matrix.md` satisfies the deletion
  rule; every `decide` row has an accepted outcome.
- [ ] Active specs/config/guidance contain no targeted old term, path, alias,
  tombstone, or competing authority; archive and legitimate domain examples are
  excluded explicitly rather than silently.
- [ ] Every retained active authority has a named owner, live consumer, and
  falsifiable guard or explicit auditable review.
- [ ] Every new/changed guard has fresh planted-negative-control evidence and
  an explicit scan scope that cannot be escaped by moving a file.
- [ ] Exception baselines, if any, are exact-path, owned, reasoned, dated,
  removal-conditioned, and shrink-only.
- [ ] Final `npm test` passes.
- [ ] Final `npm run test:sweep` passes.
- [ ] Final `openspec validate --all --strict` passes.
- [ ] Final `git diff --check` passes.
- [ ] `openspec list --json` reports no unintended active changes.
- [ ] Final exact-path staged diff and final commit are inspected.
- [ ] Final ordinary `git push origin master` succeeds.
- [ ] Final `HEAD`, local `master`, `origin/master`, and remote `master` SHAs are
  identical.
- [ ] Worktree is clean except for separately identified user work.
- [ ] Move this plan package to the repository's closed-plan location only after
  all checks above are true; preserve it as the program operation record.

## Evidence Log

Append one row per stable milestone. Keep evidence concise and reproducible;
OpenSpec artifacts and commits hold the detail.

| Date | Work item | Event | Evidence/path/SHA | Recorded by |
| --- | --- | --- | --- | --- |
| 2026-08-13 | Investigation | Baseline and cleanup program completed | `71e1f85` | Codex |
| 2026-08-13 | Progress control | Checklist created; no OpenSpec change started | `progress-plan.md` | Codex |
| 2026-08-13 | Change 1 | Proposal, delta, design, and tasks strictly validated; implementation not started | `openspec/changes/converge-active-harness-authority/` | Codex |
| 2026-08-13 | Change 1 | Tasks 1.1-5.1 implemented and checked: bounded registry/evaluator, active-authority convergence, targeted terminology cleanup, and focused planted-negative verification | `openspec/changes/converge-active-harness-authority/tasks.md`; focused tests: 11/11 documentation coherence and 20/20 architecture | Codex |
| 2026-08-13 | Change 1 | Scoped active-surface residue audit completed; replaced the remaining active `Phase 0 adapter` label in `environment-check`; retained only current guard patterns, prohibition assertions, Change 2 tombstones, or ordinary presentation-domain examples | excluded `openspec/changes/archive/`, this change rationale, `deck_*`, `dpt_*`, and `_generated/`; targeted searches recorded no unresolved active authority conflict | Codex |
| 2026-08-13 | Change 1 | Baseline verification passed without provider work or production-data changes | `npm test` passed; `npm run test:sweep`: 68 files/552 tests; `openspec validate converge-active-harness-authority --strict --no-interactive` passed; `openspec validate --all --strict --no-interactive`: 28/28; `git diff --check` passed | Codex |
| 2026-08-13 | Change 1 | Final implementation diff reviewed against proposal, delta, design, and Change 1 closure checklist; all 15 OpenSpec tasks are complete | authority map uses the existing coherence checkpoint and manifest admission; no CLI/state/provider/run-bundle surface added; archive, commit, and push remain intentionally pending | Codex |
| 2026-08-13 | Change 1 | Archived after synchronizing the `harness-charter` delta to its main spec; no active OpenSpec changes remain | `openspec/changes/archive/2026-08-13-converge-active-harness-authority/`; post-archive `openspec validate --all --strict --no-interactive`: 27/27 | Codex |
| 2026-08-13 | Change 1 | Ordinary implementation/archive commit created after exact-path staged-diff review | `640727a` (`refactor(harness): converge active authority`) | Codex |
| 2026-08-13 | Change 1 | Ordinary push and four-SHA reconciliation completed | `HEAD`, `master`, `origin/master`, and `remote master`: `3bad2a67d8654280fcdd8a46d6d7fddaf3bdb338`; worktree clean | Codex |
