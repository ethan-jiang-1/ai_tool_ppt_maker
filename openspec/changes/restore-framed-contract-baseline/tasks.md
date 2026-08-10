## 1. Restore Current Framed Fixtures

- [ ] 1.1 Replace retired `text_frame` receipt construction and invalid
  `VISUAL SCENE` / text-free source snippets in
  `tests/03-framed-image/test_framed_workflow.mjs` with reusable current
  `page-image-workflow-v1` Framed source and receipt helpers.
- [ ] 1.2 Update lifecycle assertions to the documented current Framed
  ownership and invalidation behavior, without changing production source,
  state, CLI, review, or transport behavior.

## 2. Add Contract Observation Coverage

- [ ] 2.1 Add one focused parsed-source -> raw-plan -> adapter request ->
  `targetPageImageSubmitFactory` test proving the fake provider receives the
  exact bound Framed compiled input.
- [ ] 2.2 Add three named pending tests for future hardening: source
  `subject_restrictions` propagation, normalized coordinate/canvas semantics,
  and a body-safe region. Keep them pending rather than encoding current
  omissions as accepted behavior.

## 3. Verify the Baseline

- [ ] 3.1 Run the repaired Framed workflow test and the focused parser,
  render-contract, review-contribution, Page Image Core, binding, and
  invalidation suites; investigate any non-fixture failure before continuing.
- [ ] 3.2 Run `openspec validate restore-framed-contract-baseline --strict`,
  `git diff --check`, and the relevant repository regression command; record
  the result before considering Progressive Phase 0.5 complete.
