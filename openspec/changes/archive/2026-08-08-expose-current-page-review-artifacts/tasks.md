## 1. Current Review Authority

- [x] 1.1 Add a read-only progressive raw-owner reader that proves the exact current undecided Complete Page Review, its full-plan materializations, and its review binding without directory discovery or state mutation; select only a prepared record with no validated `decided_by_prepared` entry.
- [x] 1.2 Add Pure and Framed current Complete Page Review inspectors that reuse the new owner reader and their existing presentation validators; retain the accepted-only inspectors for finalization and delivery.
- [x] 1.3 Wire the new inspectors into the selected-workflow operation adapter without changing public command forms, JSON success payloads, grants, receipts, or decisions.

## 2. Human Artifact Projection

- [x] 2.1 Update `image2 artifact-view` to project owner-validated undecided Complete Page Review provider pages, Framed composites where applicable, and the current review contact sheet in stable full-plan order.
- [x] 2.2 Preserve the accepted-review branch for final/delivery eligibility and report Complete Page Review unavailable only when neither current undecided nor accepted evidence is owner-established.
- [x] 2.3 Keep the rebuilt view provider-free, read-only, secret-safe, and non-authoritative; do not add a selector, acceptance path, retry, state field, or generated-artifact hand edit.

## 3. Focused Coverage

- [x] 3.1 Cover the raw-owner current-review reader's valid and stale/missing/decided-evidence behavior, including exact-plan/materialization binding and the case where a decision references an otherwise prepared record.
- [x] 3.2 Extend Pure and Framed artifact-view integration fixtures to prepare an undecided Complete Page Review and assert stable page/contact locators, artifact types, purposes, ordering, workflow-specific representations, and unavailable final/delivery categories.
- [x] 3.3 Assert that rebuilding the current-review view performs no provider call and leaves `_state`, grants, attempts, and review decisions unchanged; retain existing no-review, accepted-review/delivery, Pilot, decided-repair, and unsupported-protocol coverage.

## 4. Validation

- [x] 4.1 Run the focused owner, Pure/Framed, artifact-view renderer, and CLI integration suites; run the repository protected baseline required for Harness changes.
- [x] 4.2 Run `openspec validate expose-current-page-review-artifacts --strict`, `openspec validate --all --strict`, and `git diff --check`; record any pre-existing unrelated failure separately.

## Validation Notes

- `tests/03-framed-image/test_framed_workflow.mjs` has 11 pre-existing failures caused by
  its legacy source fixtures and removed Framed test-only API imports. The failures occur
  before the current-review adapter path and are outside this change. The new Framed
  artifact-view integration fixture passes, as do the owner, renderer, Pure workflow,
  CLI integration, protected core, and strict OpenSpec checks.
