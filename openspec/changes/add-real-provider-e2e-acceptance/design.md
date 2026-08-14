## Context

See [proposal.md](proposal.md) for motivation. The repository already has a
selected `real-e2e` dispatch tier: it accepts only an exact
`tests_e2e/**/test_real_*.mjs` path, requires `PPTMAKER_RUN_REAL_E2E=1`, and
runs serially with a ten-minute timeout. It has no checked-in real entry.
Current mock journeys cover public routes with fake external adapters; unit and
integration tests cover the Page Image lifecycle. Neither proves an actual
Image2-compatible endpoint accepts the current exact request and returns native
PNG bytes through the public raw-generation path.

The existing ownership model remains unchanged:

| Fact or action | Existing owner | Real-E2E role |
| --- | --- | --- |
| Live invocation and chargeable endpoint selection | Human operator | Explicitly invokes one selected test with the existing opt-in and configured environment |
| Credential parsing and one-endpoint validation | Image2 credential/runtime owner | Reused as the direct readiness source; no test-local credential parser |
| Task Mandate, exact plan, grant, attempt, and provenance | Existing State and Page Image owners | Exercised only through their public command route in a disposable scope |
| Raw media validity | Existing Page Image media owner | Asserted from the resulting attributable raw attempt |
| Visual acceptance, finalization, and delivery | Existing human review and delivery owners | Deliberately not entered |

The test uses a synthetic, non-sensitive Pure source so no real deck, research
input, or content claim enters test scope. Pure is the narrowest representative
case for a one-provider-submission transport proof: it does not require a
Framed local composite. Existing Framed and Pure contract tests retain their
adapter-specific coverage.

## Goals / Non-Goals

**Goals:**

- Establish one human-operated acceptance probe for the live Image2 transport
  and native PNG return path.
- Bound cost and irreversible external effect to at most one raw submission.
- Make missing readiness, invalid local preconditions, provider failure, and
  uncertain submission visible without secret leakage or automatic retry.
- Leave no production deck, accepted evidence, final media, or delivery output.

**Non-Goals:**

- Do not test visual quality, set a `proceed` decision, or replace Complete
  Page Review.
- Do not cover every provider, workflow, page class, retry path, or provider
  failure shape in this live probe.
- Do not add a runtime flag, new Controller, persistent test ledger, provider
  fallback, credential store, or a second authorization model.
- Do not run live work in CI, `npm test`, `npm run test:sweep`, focused tests,
  or mock E2E.

## Decisions

### 1. Reuse the existing selected real-E2E gate

The only admission to live work is the existing exact-path selection plus
`PPTMAKER_RUN_REAL_E2E=1`. Its absence is a **hard-stop**: it protects against
an accidental chargeable submission and performs no network work. The explicit
operator invocation is the human Work Request for this diagnostic; the test
does not add a duplicate confirmation or ask the operator to reconstruct a
Task Mandate per command.

This follows `openspec/policies/human-centered-gates.md`: a missing explicit
live-test request protects attributable provider work and has no bypass. It
also follows `openspec/policies/agent-assistance-and-control.md`: the existing
test selector is the direct control, rather than a new Controller or test
permission record.

Alternative considered: a new acknowledgement environment variable or an
interactive prompt. Rejected because the existing selected opt-in already
expresses the bounded human decision; another prompt adds friction without a
new protected invariant.

### 2. Use one synthetic Pure page and one public raw-generation route

The real test creates its complete fixture in a process temporary directory,
selects Pure through the normal source/state route, establishes local
preconditions, builds and authorizes exactly one raw plan, and invokes the
public CLI generation route once. It verifies an attributable successful raw
attempt and native PNG media facts from the public outputs. The test does not
call `doctor --smoke`, Style Master generation, a second workflow adapter, or
any second provider operation.

The exact plan and State attempt record are the direct submission evidence;
the test must not infer success from a file name, a timestamp, or a provider
response body. The one-page plan and one generation invocation form the
submission budget. An existing runtime failure before submission is a
**hard-stop** that protects plan/mandate/provenance integrity. It yields the
existing nearest repair diagnostic and no network fallback.

Alternative considered: run both Framed and Pure live paths. Rejected because
it doubles cost and external variability while existing local coverage already
proves the adapter distinction. Alternative considered: exercise only
`doctor --smoke`. Rejected because that probe is a readiness diagnostic, not
the public Page Image raw-lifecycle path this change needs to validate.

### 3. Stop before human quality acceptance and remove the disposable scope

Provider success proves only transport and raw media materialization. The test
explicitly asserts that it has not created accepted raw evidence, a review
decision, final manifest, delivery record, or PPTX. The test-owned temporary
directory is removed in `finally` on both success and failure. It may emit only
bounded, secret-safe failure facts needed to identify the failing checkpoint;
it must not print keys, raw prompts, provider response bodies, or raw media.

Provider rejection, timeout, invalid response, or uncertain submission is a
terminal test failure with no retry. The existing runtime remains the only
owner of any attempt classification while the test reports the nearest legal
operator action: correct endpoint/credentials or inspect the provider before a
new explicit invocation. This is intentionally not a `confirm`: a test cannot
waive an unknown external submission or accept visual output. The test has no
durable recovery state because the temporary scope is intentionally discarded.

Alternative considered: retain failed temporary bundles for manual repair.
Rejected because they can be mistaken for production run bundles and create a
second evidence store. The synthetic input plus bounded diagnostic preserves
the useful failure information without retaining mutable artifacts.

### 4. Make offline tests prove the live-test guard, not the provider

A small test-only helper may centralize fixture construction and preflight
without owning provider semantics. Offline contract tests must prove that an
absent opt-in, missing/invalid credential configuration, and local preflight
failure reach no submission; that the fixture has one selected page; and that
the test does not call review/final/delivery routes. The live entry remains
serial and excluded from ordinary suites by the existing selection/config
contracts.

This applies `openspec/policies/simple-reliable-control.md`: the shortest
control loop is direct environment/configuration facts, existing runtime
preflight, one generation attempt, and one bounded outcome. No test-local
validator, retry manager, or provider success projection is introduced.

## Risks / Trade-offs

- [A live endpoint can be unavailable or rate-limited] -> The test is manually
  selected, serial, bounded to one submission, and reports failure without
  retry; ordinary verification remains provider-free.
- [A successful PNG is mistaken for visual approval] -> The journey stops
  before review and asserts the absence of accepted/final/delivery evidence.
- [Secrets or provider content leak in test output] -> Reuse existing
  credential handling and assert a bounded redaction policy for test failures.
- [Temporary artifacts are mistaken for production data] -> Use an OS
  temporary directory, avoid `deck_*` names/paths, and delete it in `finally`.
- [The test drifts into a parallel workflow] -> Route only through the public
  CLI and existing State/Image2 owners; architecture tests prohibit production
  imports from test helpers.
- [A real submission is uncertain] -> Do not retry or accept it; surface the
  existing attempt classification and require a new explicit operator run only
  after external diagnosis.

## Migration Plan

1. Add the test-only fixture/preflight helper, selected real test, offline
   guard tests, and developer invocation guidance.
2. Run all offline tests and the selected-test dispatch checks without live
   credentials or `PPTMAKER_RUN_REAL_E2E=1`.
3. An operator may then run the one selected real test with explicit opt-in and
   a non-production Image2-compatible endpoint. This acceptance run is not
   automatic and is not required to invoke the change's implementation tests.
4. If the lane proves unsafe or unhelpful, remove the test and its guidance;
   no production data, schema, state migration, or compatibility path exists.

## Open Questions

None. The endpoint's provider-specific availability and account policy are
operator environment facts, not an alternative Harness design.
