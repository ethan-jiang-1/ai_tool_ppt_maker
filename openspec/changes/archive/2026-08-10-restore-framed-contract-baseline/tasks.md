## 1. Restore Current Framed Fixtures

- [x] 1.1 Replace retired `text_frame` receipt construction and invalid
  `VISUAL SCENE` / text-free source snippets in
  `tests/03-framed-image/test_framed_workflow.mjs` with reusable current
  `page-image-workflow-v1` Framed source and receipt helpers.
- [x] 1.2 Update lifecycle assertions to the documented current Framed
  ownership and invalidation behavior, without changing production source,
  state, CLI, review, or transport behavior.
- [x] 1.3 Confirm the restored workflow suite contains no retired Text Frame
  API, `VISUAL SCENE`, or text-free Framed grammar before accepting its new
  baseline.

## 2. Add Contract Observation Coverage

- [x] 2.1 Add one focused parsed-source -> raw-plan -> adapter request ->
  `targetPageImageSubmitFactory` test proving the fake provider receives the
  exact bound Framed compiled input.
- [x] 2.2 Add three named pending tests for future hardening: source
  `subject_restrictions` propagation through Core, raw contract, and compiled
  provider input; normalized coordinate/canvas semantics; and a provider
  body-safe region. Keep them as `it.todo` rather than encoding current
  omissions as accepted behavior.

## 3. Verify the Baseline

- [x] 3.1 Run the repaired Framed workflow test and the focused parser,
  render-contract, review-contribution, Page Image Core, binding, and
  invalidation suites; the repaired workflow suite completes with 16 passing
  executable tests and the three explicitly named pending cases.
- [x] 3.2 Run `openspec validate restore-framed-contract-baseline --strict`,
  `git diff --check`, and `npm test`; all completed successfully before
  declaring Progressive Phase 0.5 complete.
- [x] 3.3 Record completion in this task list and the progressive plan, while
  retaining the three named `it.todo` cases for the later
  protected-composition change rather than treating them as current provider
  guarantees.
