# Harness Signal Cleanup - Progress Plan

> Type: program control sheet | Updated: 2026-08-14
> Program status: `active`
> Fixed OpenSpec change count: `3`
> Overall: `2 done / 1 active / 0 queued`
> Current gate: Change 3 Git closure
> Next checkbox: Change 3 / verify and close / 5.4

This is the one program-level progress view. OpenSpec artifacts remain the
authority for each change's WHY, WHAT, HOW, and implementation tasks; current
main specs remain the accepted behavior authority.

## At A Glance

- [x] **Change 1 of 3** - `converge-active-harness-authority` - `done`
- [x] **Change 2 of 3** - `retire-historical-protocol-surfaces` - `done` (`22/22` tasks)
- [ ] **Change 3 of 3** - `converge-agent-control-surfaces` - `active` (`20/21` tasks)
- [ ] **Program closure** - final evidence and Git reconciliation; this is not
  another OpenSpec change

| Measure | Count |
| --- | ---: |
| Total OpenSpec changes | 3 |
| Closed | 2 |
| Ready | 1 |
| Remaining after the ready change | 0 |
| Additional unplanned changes | 0 |

The count is fixed at three. The former routing cleanup, Controller metadata
cleanup, and singleton `production_mode` decision are nested workstreams inside
Change 3. A fourth change requires an explicit project-owner decision and an
updated plan explaining why Change 3 cannot safely contain the work.

## Execution Order

```text
[x] Investigation and green baseline
                 |
                 v
[x] Change 1 - repair the active authority map
                 |
                 v
[x] Change 2 - retire historical protocol surfaces       <- done: 22/22
                 |
                 v
[ ] Change 3 - converge remaining Agent control surfaces
       A. remove competing routing/prose surfaces
       B. close Controller metadata grammar
       C. cut over to production identity
       D. prove reachability, residue, and final coherence
                 |
                 v
[ ] Program closure - verify, commit, push, reconcile
```

Only one cleanup change may be active at a time. Change 3 is deliberately one
OpenSpec change with ordered internal gates; its workstreams must not be split
into more changes merely for convenience.

## Update Rules

- [x] Check an item only when its stated evidence exists.
- [x] Update this file and the active change's `tasks.md` at the same stable
  milestone; do not leave implementation progress only in chat.
- [x] Keep the dashboard count, detailed checklist, evidence path, and closure
  SHA consistent.
- [x] Use `done` only after archive, ordinary commit, ordinary push, and
  four-SHA reconciliation.
- [x] Never treat this plan as a second behavioral spec.
- [x] Never use `git add .`, rebase, reset, history rewrite, or force push for
  this program.

Status vocabulary: `queued`, `planning`, `ready`, `active`, `blocked`, `done`.

## Program Invariants

- [x] Source scope is limited to `ppt_maker_harness/`, `openspec/`, `tests/`,
  `tests_e2e/`, root active guidance, and this authorized plan package.
- [x] `deck_*`, `dpt_*`, `_generated/`, and historical production data are
  excluded.
- [x] Compatibility readers, aliases, converters, and migrations are excluded;
  the target is one current active contract.
- [x] `openspec/changes/archive/` remains historical evidence and is excluded
  from active-surface cleanup scans.
- [x] Every deletion closes live entries and consumers and preserves current
  invariants in the owning spec/test before removal.
- [x] Every new guard includes a planted negative control and an explicit scan
  scope.
- [ ] Every P0/P1 finding is resolved or explicitly rejected with owner and
  rationale.
- [ ] Every retained active concept has one declared authority and a live
  consumer.
- [ ] Final `HEAD`, local `master`, `origin/master`, and remote `master` match
  with no cleanup-related worktree residue.

## OpenSpec Lifecycle

Each of the three changes pays this lifecycle cost once:

| Gate | Completion evidence |
| --- | --- |
| `admission` | Start/local/tracking/remote SHAs fetched and recorded |
| `scaffold` | Created through `openspec new change` |
| `proposal` | WHY, scope, owners, impact, and non-goals closed |
| `specs` | Observable current behavior and removals defined |
| `design` | Authority, cutover, recovery, guards, and tests closed |
| `tasks` | Implementation and closure made trackable |
| `artifact-validation` | Strict change and all-spec validation pass |
| `apply` | Implementation complete and `tasks.md` current |
| `focused-verification` | Relevant tests and negative controls pass |
| `baseline-and-residue` | Full tests, strict validation, and searches pass |
| `archive` | Accepted deltas synced, archived, and revalidated |
| `commit` | Exact paths staged and staged diff reviewed |
| `push-and-reconcile` | Normal push succeeds and all four SHAs match |

The list above defines the lifecycle labels; completion is recorded per change
below.

## Change 1 Of 3 - `converge-active-harness-authority`

Status: `done`.

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

Outcome:

- [x] Capability registry is bijective with current main specs.
- [x] Literal authority paths resolve to current public owners.
- [x] Retired lifecycle numbering, aliases, and stale routing were removed from
  active OpenSpec context.
- [x] Registry/path drift guards have planted negative controls.
- [x] Archive path recorded:
  `openspec/changes/archive/2026-08-13-converge-active-harness-authority/`
- [x] Closure commit recorded: `640727a`
- [x] Ordinary push and four-SHA reconciliation completed.

## Change 2 Of 3 - `retire-historical-protocol-surfaces`

Status: `done`; archived, committed, pushed, and reconciled (`22/22`).

Archived task authority:
`openspec/changes/archive/2026-08-14-retire-historical-protocol-surfaces/tasks.md`

Lifecycle:

- [x] `admission`
- [x] `scaffold`
- [x] `proposal`
- [x] `specs`
- [x] `design`
- [x] `tasks`
- [x] `artifact-validation`
- [x] `apply` - `22/22`
- [x] `focused-verification`
- [x] `baseline-and-residue`
- [x] `archive`
- [x] `commit`
- [x] `push-and-reconcile`

### Gate 2A - One Invalid-Protocol Contract (`4/4`)

- [x] `1.1` Workflow inspection projects one production-protocol repair action.
- [x] `1.2` State observation preserves bytes and keeps valid current state
  repair with the state owner.
- [x] `1.3` Finalization, delivery, image, and notes boundaries reject foreign
  identity while preserving current delivery-owner rebuild behavior.
- [x] `1.4` Direct CLI routes, including `state --validate-state`, project the
  shared hard-stop before dependent work.

### Gate 2B - Active Consumer Surfaces (`6/6`)

- [x] `2.1` Converge Controller, command discovery, and handoff guidance.
- [x] `2.2` Converge charter and workflow-inspection reference wording.
- [x] `2.3` Remove protocol-era environment and architecture names.
- [x] `2.4` Replace retired whole-deck renderer terminology with current Page
  Image and private Framed-runtime ownership.
- [x] `2.5` Delete the unreachable reset branch and prove refresh parser scope.
- [x] `2.6` Remove historical fixtures/descriptions while retaining structural
  `3_versions/vN` coverage.

### Gate 2C - Retire Empty Capability (`3/3`)

- [x] `3.1` Prove retained Framed runtime behavior has current owners.
- [x] `3.2` Retire `html-slide-rendering` through accepted OpenSpec flow.
- [x] `3.3` Prove the post-retirement registry/spec bijection.

### Gate 2D - Falsifiable Residue Guard (`3/3`)

- [x] `4.1` Add the bounded active-surface residue evaluator.
- [x] `4.2` Permit only owner-rooted structural Work Version `vN` usage.
- [x] `4.3` Add exact planted negative controls and zero-mutation/provider proof.

### Gate 2E - Verify And Close (`6/6`)

- [x] `5.1` Run focused workflow, CLI, state, delivery, structure, docs, and
  architecture tests.
- [x] `5.2` Sync accepted deltas and confirm the retired capability and registry
  row stay absent from the main-spec set.
- [x] `5.3` Run scoped active-surface residue searches and inspect every
  remaining structural-version or execution-mismatch occurrence.
- [x] `5.4` Pass full tests, sweep, strict validation, archive, and revalidate.
- [x] `5.5` Update evidence, stage exact paths, commit, fetch, and normally push.
- [x] `5.6` Reconcile `HEAD`, local, tracking, and remote master SHAs.

Evidence:

- [x] Archived change path recorded:
  `openspec/changes/archive/2026-08-14-retire-historical-protocol-surfaces/`
- [x] Planning artifacts passed strict change and all-spec validation.
- [x] Focused tests for completed tasks 1.1, 1.2, and 1.4 passed.
- [x] Task 1.3 delivery, final-manifest, and Pure workflow checks passed;
  malformed/cross-lineage final or receipt records hard-stop before writes,
  while attributable JPEG drift remains delivery rebuild work.
- [x] Task 2.1 Controller grammar and intent-route discovery checks passed;
  active guidance consumes, rather than duplicates, the owner-issued repair.
- [x] Task 2.2 Harness coherence sweep passed after workflow and inspection
  references converged on the shared hard-stop.
- [x] Task 2.3 declared the shared typed-cause interface, preserved the
  private-import and sibling-adapter guards, and passed architecture (`22/22`)
  plus env-check process (`56/56`) verification, including one-endpoint URL
  normalization and pre-network comma-list short-circuiting.
- [x] Task 2.4 made the private `html-render-runtime` and `05-delivery`
  final-manifest ownership explicit and extended the coherence guard; document
  coherence (`11/11`) and the direct coherence sweep passed.
- [x] Task 2.5 removed the unreachable refresh control surface and added a
  parser/help boundary check; command-surface process verification passed
  (`4/4`) with the active registry owner assertion repaired.
- [x] Task 2.6 converged source/state mismatch inspection and direct CLI
  projection on the shared protocol repair; workflow unit (`9/9`), env-check
  process (`56/56`), and mock E2E (`4/4`) passed, and targeted historical
  action/fixture searches returned no active matches.
- [x] Task 3.1 added a focused architecture proof that maps browser/font,
  capture/compositor, Framed finalization, and delivery consumption to current
  owners; the core architecture verification passed with no active old-capability
  command or script surface.
- [x] Task 3.2 synchronized the one retirement delta under the configured
  `retire_capabilities` rule, removed the empty main-spec directory and exact
  registry row, and passed strict main-spec validation (`26/26`).
- [x] Task 3.3 passed the post-cutover authority-map evaluator and its exact
  in-memory missing/extra-capability negative controls; restoring the valid
  registry snapshot passed again without repository mutation.
- [x] Tasks 4.1-4.3 added a provider-free active-surface evaluator and fixed-root
  inventory. Direct Vitest conformance/architecture checks (`32/32`) proved
  semantic residue detection, owner-rooted structural-version and
  execution-mismatch exclusions, binary font classification, unclassified-
  extension failure, and zero repository/provider mutation in the temporary-root
  negative controls. The evaluator now also scans the synchronized repository
  root in regression coverage, so its structural classification is not proven
  only by synthetic fixtures.
- [x] Task 5.1 focused verification passed: workflow (`2`), CLI (`3`), command
  surface (`4`), environment check (`56`), documentation/coherence (`11`),
  state/structural/architecture/conformance (`54`), and mock workflow E2E (`4`).
- [x] Task 5.2 synchronized all remaining accepted deltas; per-requirement
  comparisons, absent retired capability/registry checks, strict main-spec
  validation (`26/26`), and `git diff --check` passed.
- [x] Task 5.3 reran the provider-free active-surface scan over exactly the
  declared roots after synchronization (`342` text and `102` binary files,
  zero issues). Scoped searches found only structural Work Version/exact
  execution-mismatch uses of `vN`, JavaScript identifier references, and the
  explicit normative/negative-control descriptions of rejected residue; no
  active numeric protocol identity, competing recovery action, reset branch,
  affirmative compatibility claim, or whole-deck renderer capability remains.
- [x] Task 5.4 passed `npm test`; full sweep (`68` files / `560` tests); strict
  active Change validation; strict all-spec validation before archive (`27`)
  and after archive (`26`); and `git diff --check` before and after archive.
  The archive sync assessment found all 14 delta operations already reflected
  in main specs, including the absent retired capability, before the move.
- [x] Archive path recorded:
  `openspec/changes/archive/2026-08-14-retire-historical-protocol-surfaces/`
- [x] Closure implementation commit recorded: `ac7be51`
- [x] Tracking-closure commit recorded: `99716f2`
- [x] Post-push reconciliation after tracking closure:
  `HEAD = master = origin/master = remote master = 99716f25587c88ad5397a576a2a43e6145c228fd`

## Change 3 Of 3 - `converge-agent-control-surfaces`

Status: `active`; dependency: Change 2 is `done` and reconciled. Tasks
`1.1` through `5.3` are complete (`20/21`); only Git closure remains.

Terminal invariant: active guidance, Controller metadata, route discovery, and
persisted production identity form one attributable control model with no
orphan prompt cookbook, parallel routing registry, silent metadata dialect, or
unjustified singleton state layer.

This one change absorbs the former Changes 3 and 4 and the conditional Change
5. The three workstreams remain ordered gates inside one OpenSpec lifecycle.

Lifecycle:

- [x] `admission` - baseline `dc53149`; `HEAD`, local `master`, tracking
  `origin/master`, and remote `master` matched before change creation
- [x] `scaffold` - `openspec new change converge-agent-control-surfaces`
- [x] `proposal`
- [x] `specs`
- [x] `design`
- [x] `tasks` - `21` implementation/closure tasks
- [x] `artifact-validation` - strict change plus strict all-spec validation
  passed (`27/27`)
- [x] `apply` - `20/21`; implementation is complete and the archived checklist is current
- [x] `focused-verification`
- [x] `baseline-and-residue`
- [x] `archive`
- [ ] `commit`
- [ ] `push-and-reconcile`

### Gate 3A - Planning And Decision

- [x] Reconfirm the remaining F5-F10 findings against post-Change-2 master:
  F5-F7, F9, and F10 remain in Change 3 scope; F8 was closed by Change 2.
- [x] Enumerate all affected specs, entry surfaces, readers, writers, persisted
  fields, tests, and guards before locking artifacts.
- [x] Decide the Intent Route Catalog as one family: delete it because its
  reader has no production consumer and `COMMANDS` plus Controllers/CLI already
  own the handoff.
- [x] Decide `production_mode`: collapse its fixed singleton into
  `production_identity.by_version {workflow, source_epoch}`. Source owns the
  pipeline/workflow; State owns agreement and the invalidation fence.
- [x] Record the project-owner-approved no-compatibility outcome in this plan
  package and in Change 3 design/specs before artifact validation.
- [x] Complete and strictly validate one coherent Change 3 artifact set.

### Gate 3B - Remove Competing Agent Routes (`3/3`)

- [x] `1.1` Delete `reference/agent-prompts.md` after reconfirming no live consumer.
- [x] `1.1` Absorb any unique current invariant from both workflow-inspection prose
  records, then delete the duplicate projections.
- [x] `1.2` Remove the Intent Route Catalog JSON, reader, schema
  declaration, tests, and guidance as one atomic family.
- [x] `1.3` Prove no prompt cookbook, orphan prose projection, or unconsumed routing
  authority remains active.

### Gate 3C - Close Controller Metadata (`4/4`)

- [x] `2.1` Define exact keys for Controller frontmatter, shared-node frontmatter, and
  fenced node declarations.
- [x] `2.3` Keep `method_module` as the sole lifecycle-location declaration.
- [x] `2.1` Reject `phase`, `lifecycle_phase`, misspellings, ambiguous duplicates, and
  every undeclared key with bounded diagnostics.
- [x] `2.4` Replace legacy-acceptance tests with planted negative controls.
- [x] `2.3` Validate every checked-in Controller under the closed grammar.

### Gate 3D - Cut Over To Production Identity (`5/5`)

- [x] `3.1` Model missing, corrupt, mismatched, stale, retry, restart, replay,
  concurrent-write, partial-cutover, and uncertain-commit behavior.
- [x] `3.1` Record fact authority, owner, writers, admission, recovery, terminal
  invariant, and completion evidence for the chosen outcome.
- [x] `3.2` Implement State creation, mutation, CAS/replay, and epoch invalidation
  writers with only the identity record.
- [x] `3.3` Update Controller, structural, Style Master, and inspection consumers.
- [x] `3.4` and `3.5` Remove mode CLI contracts and update active schema/guidance.

Collapse completion means every active reader, writer, schema, Controller, and
test is updated in one clean cutover with no compatibility path or Run Bundle
scan. Retention completion means the distinct invariant, live consumers,
failure path, and falsifiable guard are proved and incidental residue in Change
3 scope is removed.

- [x] Prove the chosen outcome has fewer unexplained concepts and no weaker
  source/state identity boundary.

### Gate 3E - Prove The Clean Break (`5/5`)

- [x] `4.1` Add missing, malformed, source-disagreeing, and retired-record State
  controls that short-circuit before a write or provider work.
- [x] `4.2` Prove Controller, Style Master, inspection, CLI/status, and direct
  environment-check identity propagation and no wrong-owner fallback.
- [x] `4.3` Prove mocked end-to-end inactive-write lifecycle fencing.
- [x] `4.4` Add reachability/residue guards rooted in declared active entries, with
  exact owned shrink-only exceptions where justified.
- [x] `4.4` Plant orphan-module, stale-metadata, duplicate-route, and selected
  production-identity negative controls.
- [x] `4.5` Resolve or explicitly reject every remaining P0/P1 finding with owner and
  rationale.
- [x] `5.1`–`5.2` Pass focused tests, `npm test`, `npm run test:sweep`, strict OpenSpec
  validation, scoped residue searches, and `git diff --check`.
- [x] `5.3` Sync accepted delta specs, revalidate, and archive Change 3.
- [ ] `5.4` Stage exact paths, inspect, ordinarily commit, fetch, push, and
  reconcile all four master SHAs.
- [x] Record archive path; closure SHA remains pending Git closure.

Ordering note: 4.4 exposed seven positive old declarations in accepted main
specs. The 5.3 **sync** substep was therefore completed early as a direct
precondition for 4.5; strict validation and the repository-clean guard passed
afterward. Archive completed after a second strict validation. Commit, push,
and 5.4 completion remain pending. No runtime or scan exception masks the
resolved drift.

## Final Program Closure - Not A Change

Status: `blocked` until all three changes are `done`.

- [ ] Changes 1-3 are archived and each has a reconciled closure SHA.
- [ ] Every P0/P1 finding maps to a closed change or explicit rejection.
- [ ] Every `delete`/`absorb` row in `deletion-matrix.md` satisfies the deletion
  rule; every `decide` row has an accepted outcome.
- [ ] Active specs, config, guidance, runtime, and tests contain no targeted old
  term, path, alias, tombstone, or competing authority.
- [ ] Every retained authority has a named owner, live consumer, and falsifiable
  guard or explicit auditable review.
- [ ] Final `npm test` passes.
- [ ] Final `npm run test:sweep` passes.
- [ ] Final `openspec validate --all --strict --no-interactive` passes.
- [ ] Final `git diff --check` passes.
- [ ] `openspec list --json` reports no unintended active change.
- [ ] Final exact-path staged diff and ordinary commit are inspected.
- [ ] Final ordinary `git push origin master` succeeds.
- [ ] Final `HEAD`, local `master`, `origin/master`, and remote `master` SHAs are
  identical.
- [ ] Worktree is clean except for separately identified user work.
- [ ] Move this plan package to the closed-plan location and preserve it as the
  program operation record.

## Evidence Log

| Date | Work item | Event | Evidence/path/SHA |
| --- | --- | --- | --- |
| 2026-08-13 | Investigation | Baseline and cleanup program completed | `71e1f85` |
| 2026-08-13 | Change 1 | Archived, committed, pushed, and reconciled | archive `2026-08-13-converge-active-harness-authority`; closure commit `640727a` |
| 2026-08-13 | Change 2 | Proposal, deltas, design, and tasks strictly validated | `openspec/changes/retire-historical-protocol-surfaces/` |
| 2026-08-14 | Change 2 | Tasks 1.1, 1.2, and 1.4 implemented; focused workflow/CLI/state tests passed | `tasks.md` progress `3/22` |
| 2026-08-14 | Change 2 | Full verification, sync assessment, and archive completed | archive `2026-08-14-retire-historical-protocol-surfaces`; `20/22` |
| 2026-08-14 | Change 2 | Ordinary commit, fast-forward push, and four-SHA reconciliation completed | closure `ac7be51`; `22/22` |
| 2026-08-14 | Program control | Remaining work consolidated into fixed Change 3; total change count fixed at three | this file + `program.md` |
| 2026-08-14 | Change 3 | Admitted and scaffolded from clean reconciled master | baseline `dc53149`; `openspec/changes/converge-agent-control-surfaces/` |
| 2026-08-14 | Change 3 | Proposal, eight capability deltas, design, and 19-task checklist completed; strict validation passed | `openspec/changes/converge-agent-control-surfaces/`; change + all specs `27/27` |
| 2026-08-14 | Change 3 | Tasks `1.1`–`3.5` applied: competing routes removed, Controller grammar closed, and State identity cut over | `tasks.md` progress `12/21`; focused State/structural/inspection/CLI/environment/schema tests passed |
| 2026-08-14 | Change 3 / 4.1 | Identity negative controls verified | `npx vitest run tests/shared/run-bundle/test_page_image_layout.mjs tests/shared/state/test_target_page_image_state.mjs` (`2` files, `29` tests passed); invalid identity records preserved State bytes before target publication |
| 2026-08-14 | Change 3 / 4.2 | Cross-owner identity propagation verified | Controller/Style Master/inspection suite (`6` files, `41` tests), workflow status E2E (`4`), env-check process suite (`56`), and command-surface process suite (`5`) passed; retired `--mode` is rejected before init/state writes |
| 2026-08-14 | Change 3 / 4.3 | Inactive-write lifecycle fence verified | `npx vitest run --config vitest.e2e.config.mjs tests_e2e/shared/state/test_mock_inactive_run_state_writes.mjs` (`1` E2E passed); inactive build hard-stops before writes/provider work and permits only exact active-state repair |
| 2026-08-14 | Change 3 / 4.4 | Fixed-root residue guard verified | `npx vitest run tests/contracts/test_production_schema_conformance.mjs` (`10` tests passed); fixture controls prove exact prompt/catalog/metadata/mode categories, root guidance coverage, historical-root exclusion, and zero repository/provider mutation |
| 2026-08-14 | Change 3 / 4.5 | Main specs synchronized and active residue cleared | `openspec validate --specs --strict --no-interactive` (`26/26`), fixed-root scan (`338` text / `102` binary; zero issues), scoped residue search, and `git diff --check` passed; remaining terms are explicit normative rejection, test negative controls, or guard definitions |
| 2026-08-14 | Change 3 / 5.1 | Focused verification passed | Controller/state/Style Master/inspection/CLI/schema suite (`10` files, `70`), env process (`56`), command process (`5`), inactive-write E2E (`1`), and workflow-inspection E2E (`4`) passed; concurrent E2E timeout was eliminated by normal serial reruns |
| 2026-08-14 | Change 3 / 5.2 | Release gate passed | `npm test`, `npm run test:sweep`, strict active-change validation, strict all validation (`27`), fixed-root scan (`338` text / `102` binary; zero issues), scoped residue audit, and `git diff --check` passed; no unresolved P0/P1 findings |
| 2026-08-14 | Change 3 / 5.3 | Archived after synchronized-spec revalidation | archive `openspec/changes/archive/2026-08-14-converge-agent-control-surfaces/`; post-archive strict main-spec validation (`26`) and fixed-root scan remained clean; Git closure pending |
