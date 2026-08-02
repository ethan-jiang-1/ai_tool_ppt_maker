## 1. Lock The New Contract With Focused Tests

- [ ] 1.1 Add a `commands-reference` contract test for
  `intent-routes-v1.json`: exact closed inventory, eight fields, valid
  kind/risk enums, legal fallbacks, leaf-to-existing-playbook targets, and no
  CLI grammar/hash/grant/lifecycle-sequence content.
- [ ] 1.2 Add discovery-boundary tests proving explicit work changes enter
  `classify-change`, resume is state-first only for a known exact run, missing
  run context goes to the supported locator without scanning `deck_*`, and a
  Route Gap produces no persistent record or automatic maintenance work.
- [ ] 1.3 Add `cli-surface` regression tests for valid delegated doctor child
  diagnostics (all producer fields and exact `next` survive) and invalid,
  missing, or truncated child output (bounded delegated/internal
  `report_internal`, no copied prose or invented recovery).
- [ ] 1.4 Extend task-projection/state CLI tests with authority-file snapshots
  for `created`, `updated`, `current`, and `not-applicable`; cover text and
  JSON `state`, `status`, and `state --validate-state`, with no provider call.
- [ ] 1.5 Extend environment/document process tests to assert actual direct
  env-check help/parser grammar, default offline behavior, live-probe submit
  disclosure, fixed twelve-command inventory, current verification-tier
  vocabulary, current classifier/config pointers, and no active retired
  one-shot/raw wording.

## 2. Add The Audit-First Discovery Surface

- [ ] 2.1 Create `PPTMAKER_FRAMEWORK/playbook/intent-routes-v1.json` with the
  `pptmaker-intent-routes-v1` schema, the fourteen agreed route IDs, concise
  stable discovery labels, short legal fallback graph, and the three risk
  boundaries; do not add it to the Controller manifest or a CLI dispatcher.
- [ ] 2.2 Add the smallest checked-in catalog validation/read seam needed by
  the contract tests, keeping Agent natural-language interpretation outside the
  framework runtime and rejecting malformed/unknown catalog data before it can
  be presented as a route.
- [ ] 2.3 Update MD/playbook routing guidance so `work-new`, exact-run resume,
  explicit change classification, locator, environment recovery, and Route Gap
  enter existing owners only; prove no `selected_route_id` is written to state,
  receipts, grants, attempts, history, or the collaboration projection.

## 3. Repair Deterministic Entry And Observation Seams

- [ ] 3.1 Change the doctor delegation adapter to preserve a valid child
  diagnostic's bounded producer fields and exact action while appending only
  delegated lineage; make invalid child output fail closed with
  `report_internal` and retain secret-safe output limits.
- [ ] 3.2 Introduce one explicit eligibility predicate for the progressive
  collaboration-card writer: exact v2 run, selected workflow, active
  `create-deck` Controller identity, and active progressive node. Keep
  `inspectWorkflow` fully zero-write and prevent ineligible observation from
  importing or invoking the writer.
- [ ] 3.3 Update text `state` and `state --json` to return
  `task_projection.status` as `created`, `updated`, `current`, or
  `not-applicable`; preserve atomic/idempotent card rebuilding and ensure no
  authority source/state/receipt/grant/attempt/history/generated artifact is
  changed.
- [ ] 3.4 Keep `status` and `state --validate-state` on their true zero-write
  paths, and preserve all current owner validation, hash binding, gate, and
  provider-authorization behavior outside the named collaboration projection.
- [ ] 3.5 Correct direct `env-check` help and argument guidance to the parser's
  `--json`, `--mode`, `--operation`, `--smoke`, and `--probe-vendors` forms;
  reject retired `--image2`, retain pre-install startup, and keep normal
  `ppt_flow doctor` as the installed-framework entry.

## 4. Reconcile User And Agent Documentation

- [ ] 4.1 Rewrite `PPTMAKER_FRAMEWORK/COMMANDS.md` as the catalog's
  novice-facing request rendering: goal, Agent clarification/inspection,
  expected result, one confirmation/cost boundary, and coarse timing. Keep
  route IDs, CLI syntax, hashes, grants, and lifecycle mechanics out of its
  main table.
- [ ] 4.2 Replace fixed new-deck/raw command sequences in `BOOTSTRAP.md` and
  related active playbook/script guidance with the current durable handoff and
  owner-issued continuation. Keep channel probes offline-first, confirmed when
  live, and non-authorizing; remove all active `doctor --image2` guidance.
- [ ] 4.3 Update active help descriptions and verification documentation so
  `ppt_flow test` is clearly the core tier and core/focused/sweep/mock-E2E/
  real-E2E scopes are distinguishable without implying provider work.
- [ ] 4.4 Reconcile affected active main specs and `openspec/config.yaml` with
  the approved deltas, including the current `06-iteration` classifier pointer
  and retired Page Authority wording. Preserve archived specs/history and use
  only narrow historical exceptions when a retirement audit requires one.

## 5. Validate The Change Without Provider Work

- [ ] 5.1 Run the new focused catalog, entry-seam, diagnostic, projection, and
  process/document contract suites; fix failures without adding fallback
  routes, persistent route state, force flags, or real provider calls.
- [ ] 5.2 Run `npm test` and report it as the core tier. Run affected sweep or
  mock-E2E coverage only where the changed public boundary warrants it; do not
  run real E2E without separate authorization.
- [ ] 5.3 Run `openspec validate reconcile-command-surface-and-entry-seams
  --strict`, `openspec validate --all --strict`, and `git diff --check`; verify
  every delta requirement and task has an observable implementation/test
  result before asking to apply or archive the change.
