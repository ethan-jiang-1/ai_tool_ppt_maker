# Implementation Audit: Style Master Feedback

Completed for task 1.1 on 2026-08-01. The audit was limited to framework
source, OpenSpec artifacts, and test fixtures. No `deck_*` or `dpt_*` path was
read, used as a fixture, or selected as an implementation input.

## Current Surface And Replacement Map

| Current surface | Current responsibility | Replacement / owning surface |
| --- | --- | --- |
| `scripts/shared/run-bundle/bundle_layout.mjs` (`STYLE_MASTER_IMAGE`, `styleAsset`) | Resolves an existing version override before `2_backbone/visual-style/style_master.jpg`; layout validation permits that file. | Keep this as the compatibility-payload resolver. Add Style Master iteration path constants and confined ownership validation. It must not determine selection or plan currentness. |
| `scripts/shared/image2/page_authority_target_runtime.mjs` (`TARGET_STYLE_MASTER_RELATIVE_PATH`, `buildTargetRawGenerationProfile`) | Reads `2_backbone/visual-style/style_master.jpg` directly and publishes its bytes/path into the raw profile. | Replace with the scoped effective-selection resolver and immutable candidate bytes. The raw profile retains selected-byte identity, never a compatibility path authority. |
| `scripts/03-framed-image/index.mjs` and `scripts/04-pure-image/index.mjs` | Pass the existing raw profile and its style path to the Image2 request layer. | Pass the immutable bytes returned by the accepted selection resolver through the selected workflow request boundary. |
| `scripts/ppt_flow.mjs` (`resolveTargetAuthoringDraftAdapter`) | Treats only `select-target-page-authority-workflow` as an unbound fresh-v2 draft route. | Consume the reader-owned, selected-workflow `draft_route_nodes` projection. Extract a read-only Style Master scope resolver; preserve exact current-pair resolution for bound runs. |
| `scripts/shared/state/md_controller_reader.mjs` and `playbook/controller-manifest-v3.json` | Parse/index active nodes and manifest facts, without a canonical draft-route projection. | Validate optional literal `draft_route: true` declarations and exact manifest agreement, then export the ordered per-workflow projection. |
| `scripts/shared/state/state.mjs` | Owns schema-v5 structural validation, atomic state writes, source/state pair validation, target evidence, and current Conditions; `style_master_exists` is file-presence based. | Add optional `page_authority_style_master.by_version` validation/CAS helpers and `style_master_accepted`; leave candidate plans, grants, attempts, and decisions to the Style Master owner. |
| `scripts/01-content/internal/target_structural_version.mjs`, `scripts/ppt_flow.mjs`, and `state.mjs` structural helpers | Publish a first target vNext and currently fence an already visible target. | Add an exact visible-target replay branch before target-absent/source-execution fences. Revalidate source/receipt/evidence/style map and preserve later target state byte-for-byte. |
| `scripts/shared/cli/cli_error.mjs`, `scripts/ppt_flow.mjs`, contracts/tests | Inventory has 11 commands; `style-master` is intentionally retired. | Register exactly one current-v2 `style-master` command family, retain producer-owned diagnostic envelopes, and update inventory/help/coherence tests to 12 commands. |
| Existing Style Master fixtures in `tests/03-framed-image`, `tests/04-pure-image`, `tests/shared`, and `tests_e2e` | Seed static `style_master.jpg` bytes directly. | Keep only explicit local-existing compatibility fixtures where needed; add isolated temporary run-bundle fixtures for candidate plan, grant, attempts, selection, Controller, and CLI behavior. |

## New Internal Boundary

The implementation will add a pure Style Master schema/record module for
canonical identity and selection validation, plus one lifecycle owner for
filesystem publication, candidate authorization, attempts, review, promotion,
and scoped inspection. The state module will import only the pure schema
validator, avoiding a second selection ledger or a state-to-lifecycle cycle.

The layout-resolved `style_master.jpg` remains a derived JPEG compatibility
projection. Its presence, timestamp, directory position, or bytes cannot name
a plan, grant authorization, candidate evidence, or effective selection.

## Verification (2026-08-01)

The remaining Style Master tasks were verified with isolated temporary
run-bundle fixtures only. No production `deck_*` or `dpt_*` path was used.
The process diagnostic fixture now first promotes a real local-existing Style
Master selection, so it continues to exercise Framed source/runtime diagnostics
after the new required selection gate.

### Owner, State, CLI, And Controller Suites

| Command | Result |
| --- | --- |
| `npx vitest run tests/shared/image2/test_style_master_plan.mjs` | Passed: 29 tests. |
| `npx vitest run tests/shared/image2/test_style_master_raw_binding.mjs` | Passed: 6 tests. |
| `npx vitest run tests/shared/image2/test_style_master_schema.mjs` | Passed: 8 tests. |
| `npx vitest run tests/shared/image2/test_style_master_scope.mjs` | Passed: 2 tests. |
| `npx vitest run tests/contracts/test_retired_cli_surface.mjs` | Passed: 3 tests. |
| `npm run test:focused -- tests/shared/state/test_target_page_authority_state.mjs` | Passed: 8 tests. |
| `npm run test:focused -- tests/shared/cli/test_process_cli_error.mjs` | Passed: 27 tests. |
| `npm run test:focused -- tests/contracts/test_process_style_master_cli.mjs` | Passed: 4 tests. |
| `npm run test:focused -- tests/contracts/test_process_style_master_lifecycle_integration.mjs` | Passed: 2 tests. |
| `npm run test:focused -- tests/shared/state/test_md_controller_reader.mjs` | Passed: 9 tests. |
| `npm run test:focused -- tests/shared/state/test_target_authoring_draft_route.mjs` | Passed: 4 tests. |
| `npm run test:focused -- tests/contracts/test_process_docs_consistency.mjs` | Passed: 5 tests. |
| `npm run test:focused -- tests/01-content/test_target_structural_version.mjs` | Passed: 5 tests. |
| `npm run test:focused -- tests/01-content/test_target_structural_cli.mjs` | Passed: 3 tests. |
| `npx vitest run --config vitest.process.config.mjs tests/shared/cli/test_process_target_diagnostics.mjs` | Passed: 2 tests. |

### Visual Closure And Journey Suites

`npm run test:focused` intentionally rejects selected visual-engine closures.
The following exact one-file direct Vitest runs therefore supplied the required
local verification and all passed:

```text
npx vitest run tests/03-framed-image/test_style_master_scope.mjs        # 1 test
npx vitest run tests/04-pure-image/test_style_master_scope.mjs          # 1 test
npx vitest run tests/shared/run-bundle/test_page_authority_layout.mjs   # 9 tests
npx vitest run tests/shared/image2/test_target_raw_review_coverage.mjs # 3 tests
npx vitest run tests/03-framed-image/test_framed_plan_lifecycle.mjs     # 15 tests
npx vitest run tests/03-framed-image/test_framed_workflow.mjs           # 10 tests
npx vitest run tests/04-pure-image/test_pure_workflow.mjs               # 5 tests
npm run test:mock-e2e -- tests_e2e/shared/workflow/test_mock_target_workflow_journey.mjs # 3 tests
```

No real-provider or real-E2E evidence was run because it was not authorized.

### Protected Validation

```text
npm test                                                       # passed
openspec validate establish-style-master-feedback --strict     # passed
openspec validate --all --strict                               # 27 passed, 0 failed
git diff --check                                               # passed
node --check tests/shared/cli/test_process_target_diagnostics.mjs # passed
```
