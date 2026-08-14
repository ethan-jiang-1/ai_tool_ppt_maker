## Why

The repository protects its Page Image provider lifecycle with unit and mock
journey coverage, but its explicitly opt-in `real-e2e` test lane has no checked-
in `test_real_*.mjs` entry. A real Image2-compatible endpoint can therefore
drift in transport, authentication, request submission, or native PNG response
handling without one bounded, reproducible acceptance probe.

This is the right time to close that gap because the Harness has just converged
on one current Page Image workflow and one attributable execution model. The
acceptance probe must strengthen that contract without treating a remote raster
as automatic visual approval or placing a production deck in test scope.

## What Changes

- Add one checked-in, selected `test_real_*.mjs` acceptance journey for a
  synthetic, non-sensitive, one-page Pure raw-generation scope against an
  operator-selected Image2-compatible endpoint.
- Reuse the existing `PPTMAKER_RUN_REAL_E2E=1` selected-test gate; the test
  remains absent from ordinary, focused, mock-E2E, and sweep invocation.
- Require one configured endpoint and credentials before any network attempt;
  perform at most one provider submission, with no automatic retry, fallback,
  Style Master generation, review decision, finalization, or delivery.
- Drive the accepted public Page Image command route through a disposable
  temporary run bundle, assert only attributable raw-attempt/media facts, and
  delete all temporary material on success or failure without logging secrets,
  prompts, or provider response bodies.
- Add offline contract coverage for the live-test gate, preflight short
  circuits, single-submission budget, cleanup, and non-acceptance boundary.
- Document the human-operated invocation and its cost/effect boundary in the
  existing developer-facing test guidance.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. This is a test-only acceptance lane that reuses accepted runtime
behavior; it does not alter a Harness requirement or run-bundle contract.
`skip_specs: true` is declared in `.openspec.yaml`.

## Impact

- Affected scope: `tests_e2e/`, `tests/`, test configuration and developer
  verification guidance; any change remains within Harness repository
  maintenance boundaries.
- Control owners: the human explicitly elects a live test invocation; the
  existing CLI/State/Image2 owners remain the only runtime authorities for
  credentials, Task Mandate, submission, provenance, and raw media. The new
  test is evidence only and creates no competing Controller, state record, or
  acceptance authority.
- Run-bundle impact: `none`. The journey uses a temporary test-owned run
  bundle, never a `deck_*` production directory, and removes it in `finally`.
- External effect: one chargeable provider request at most when the existing
  explicit live-test environment gate and valid Image2 credentials are present.
  Missing/invalid readiness must fail before a network attempt; an uncertain or
  failed submission is reported without retry.
