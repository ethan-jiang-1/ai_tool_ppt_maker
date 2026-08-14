## 1. Build The Test-Only Admission And Fixture

- [x] 1.1 Add an import-safe test helper that uses the existing test
  bundle/State fixture seam to construct one synthetic, non-sensitive Pure
  test scope in an OS temporary directory, install the provider-free accepted
  `local-existing` Style Master prerequisite, and position the required
  Controller handoff. It must neither submit provider work nor create a Page
  Image raw review/acceptance decision.
- [x] 1.2 Reuse existing Image2 credential normalization and selected-test
  dispatch to fail before fixture/provider work when the real-test opt-in,
  API key, or single endpoint is absent or invalid; do not add another
  authorization flag, state record, retry, or provider fallback.
- [x] 1.3 Prove the fixture's exact one-page scope and local prerequisites can
  reach an attributable raw-generation command without invoking Style Master
  candidate generation or submission, `doctor --smoke`, a Framed adapter, or a
  production `deck_*`.

## 2. Exercise One Live Raw Submission

- [x] 2.1 Add one selected `tests_e2e/**/test_real_*.mjs` journey that is
  serial under the existing `real-e2e` configuration. It must establish one
  paid Pure slide and a grant with `maximum_submissions: 1`, then invoke the
  public raw-generation route exactly once.
- [x] 2.2 Assert only owner-issued raw-attempt/provenance and native PNG media
  facts from the public outputs; prove the journey creates neither accepted
  Page Image raw evidence, a Page Image review decision, final media/manifest,
  delivery evidence, nor a PPTX.
- [x] 2.3 Guarantee `finally` cleanup on success and every local/provider
  failure path; emit only bounded, secret-safe owner-issued diagnostics and
  surface failure/uncertain submission without automatic retry, test-side
  reconciliation, or retained test evidence.

## 3. Prove The Non-Live Guards And Document Operation

- [x] 3.1 Extend offline dispatch/contract coverage to prove the checked-in
  real entry is excluded from ordinary suites, rejects absent opt-in before
  the selected runner spawns Vitest, defensively skips broad E2E discovery
  without the opt-in, and retains the exact single-test selection boundary.
- [x] 3.2 Add provider-free negative controls for missing/invalid credentials,
  local preflight failure, single-page submission budget, cleanup, redaction,
  and the no-Page-Image-review/no-finalization/no-delivery boundary; restore
  each valid control without repository mutation.
- [x] 3.3 Document the exact human-operated invocation, required environment,
  one-submission/cost boundary, non-production endpoint expectation, and the
  fact that a returned PNG is not visual acceptance or permission to proceed.

## 4. Verify And Close

- [x] 4.1 Run the focused test-helper, selected-dispatch, public command-route,
  and provider-free mocked journey suites; include the planted short-circuit
  and no-wrong-owner controls.
- [x] 4.2 Run `npm test`, `npm run test:sweep`, `git diff --check`, and strict
  change/all OpenSpec validation; inspect the test source and output to verify
  no secret, raw prompt, provider body, production deck, or generated artifact
  is retained.
- [x] 4.3 With separate explicit operator authority and a non-production
  Image2-compatible endpoint, run the one selected real test and record only
  redacted successful-result evidence. A provider failure or uncertain outcome
  remains an external blocker: do not retry or reconcile it from the test. An
  explicit project-owner archive waiver may close this change without claiming
  that this live acceptance passed.
  Status (2026-08-14): one authorized run loaded the project `.env`, performed
  its one submission, and returned a succeeded raw materialization, but the
  test then exposed a local direct-record ordering assertion defect. The
  provider-free correction passed; this task remains unchecked pending a fresh
  explicitly authorized run, with no retry or reconciliation of the prior scope.
  A second authorized run returned the provider-owned `known_failure` outcome
  before raw materialization. It is an external blocker under this task's
  no-retry/no-test-side-reconciliation rule.
  The pending entry now emits only bounded known-failure classification facts;
  its sentinel redaction control and the refreshed full provider-free suite
  passed before this external blocker was recorded.
  A further explicitly authorized run again completed its single submission
  and returned `known_failure` with only `provider_failure=http_error:400`
  exposed. This remains an external blocker; the temporary fixture was cleaned
  and no retry or test-side reconciliation followed.
  A provider-free two-fixture preflight reached `authorize` twice with one
  submission budget each and distinct plan/batch identities, excluding a
  cross-run idempotency-key collision as the local cause of the 400 response.
  One authenticated, read-only `GET /models` probe returned 200 JSON and
  listed `gpt-image-2`; it did not submit provider work or validate the
  current reference-image request shape, so it does not close this task.
  The provider-free raw-binding suite passed (`17` tests), including the
  negative control that HTTP failures do not read or retain provider bodies.
  The service's root and versioned OpenAPI paths and `/docs` exposed no
  machine-readable current request schema. No further safe local diagnostic
  remains without a provider-issued rejection classification.
  A later explicitly authorized selected invocation completed cleanup but its
  npm parent exited `1` without returning a redacted terminal outcome to the
  runner transcript. It is therefore an uncertain external outcome, not
  successful-result evidence or a new classified provider failure; no retry
  or reconciliation followed.
  Archive disposition (2026-08-14): the project owner explicitly approved
  archival after the bounded live attempts. This checkbox records that closure
  decision, not a successful live acceptance. The opt-in test remains for a
  later fresh operator run, and no provider transport contract is accepted or
  changed by this waiver.
