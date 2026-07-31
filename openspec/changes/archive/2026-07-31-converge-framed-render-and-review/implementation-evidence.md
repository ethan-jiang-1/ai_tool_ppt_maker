# Implementation evidence

All test fixtures used for this change create temporary bundles beneath the
operating-system temporary directory. No production `deck_*`, `dpt_*`, or
production `_generated/` path was read, modified, copied, or used as a fixture.

## Replacement and ownership checks

- `npx vitest run tests/03-framed-image/test_framed_workflow.mjs tests/03-framed-image/test_framed_render_contract.mjs`
  - 16 passed: the canonical browser contract rejects the 28-`W` regression,
    composes whole batches, and retains no public composition injection.
- `npx vitest run tests/03-framed-image/test_framed_plan_lifecycle.mjs`
  - 15 passed: candidate proof precedes writes; later raw commands are
    browser-free; profile and canonical safe-zone drift require raw rebuild.
- `npx vitest run tests/contracts/test_framework_architecture.mjs tests/contracts/test_framework_governance_ledger.mjs`
  - 15 passed: owner graph, test ownership, selected workflow isolation, and
    no production-data fixture boundary remain enforced.
- Residual scans found no production/test reference to the removed estimated
  preflight, old Framed compositor, old input error codes, or a persisted
  layout/render proof identity. The sole Framed document compiler is private
  to `03-framed-image/internal/framed_render_contract.mjs`.

## Focused regression tiers

- `npx vitest run tests/03-framed-image/test_framed_render_profile.mjs tests/03-framed-image/test_framed_plan_lifecycle.mjs`
  - 25 passed: canonical profile identity and proof-before-materialization
    lifecycle coverage.
- `npx vitest run tests/00-setup/test_html_fonts.mjs tests/00-setup/test_html_runtime_profile.mjs tests/03-framed-image/test_framed_render_contract.mjs`
  - 33 passed: font inventory/selection, pinned runtime, single browser batch,
    capture invariants, timeout cleanup, network denial, and atomic final output.
- `npx vitest run --config vitest.process.config.mjs tests/00-setup/test_process_env_check.mjs`
  - 53 passed: provider-free local readiness and unavailable runtime/font
    diagnostics remain bounded.

## Shared lifecycle and public journeys

- `npx vitest run tests/03-framed-image/test_framed_review_contribution.mjs`
  - 3 passed: generic review contribution binds safe zones and render profile
    without title-label coverage identity.
- `npx vitest run tests/shared/image2/test_artifact_contracts.mjs tests/shared/image2/test_credentials.mjs tests/shared/image2/test_final_manifest.mjs tests/shared/image2/test_raw_mechanics.mjs tests/shared/image2/test_target_raw_review_coverage.mjs`
  - 11 passed: exact raw bytes, review coverage, owner rebuild, and final
    artifact contracts.
- `npx vitest run tests/shared/state/test_md_controller_reader.mjs tests/shared/state/test_state_yaml.mjs tests/shared/state/test_target_page_authority_state.mjs`
  - 16 passed: source/evidence lineage and Controller consumption.
- `npx vitest run --config vitest.process.config.mjs tests/shared/cli/test_process_cli_error.mjs tests/shared/cli/test_process_target_diagnostics.mjs`
  - 29 passed: secret-safe producer diagnostics, earliest-owner routing, and
    same-check repair.
- `npm run test:mock-e2e -- tests_e2e/shared/workflow/test_mock_target_workflow_journey.mjs`
  - 3 passed: homogeneous Framed provider-free title/notes refresh, Pure raw
    rebuild recovery, and mixed-workflow evidence rejection.

## Delta ownership audit

| Delta capability | Audited responsibility |
| --- | --- |
| `visual-config` | Normalized frame preset, render-profile identity, and evaluator authority. |
| `html-render-runtime` | Private pinned browser, selected checked-in fonts, capture, timeout, and cleanup. |
| `image-production` | One private evidence-bound Framed compiler/evaluator/final compositor. |
| `image-generation` | Proof-before-materialization, stored plans, raw contracts, and review coverage. |
| `pipeline-orchestration` | Homogeneous selected workflow and profile-aware refresh routing. |
| `run-bundle-layout` | Rebuildable derived raw/review/final evidence ownership. |
| `environment-check` | Lazy operation-scoped Framed runtime/profile readiness. |
| `cli-surface` | Producer-owned bounded diagnostics and one nearest repair action. |

`node-specification` was audited and intentionally has no delta: consumers keep
using producer-issued structured `category` and `next` facts without a new
consumer contract.

## Closeout readiness

- `npm test` passed (`development-verification-v1`, core inventory).
- `openspec validate converge-framed-render-and-review --strict` passed.
- `git diff --check` passed.
- All 43 implementation tasks are complete; no requirement is deferred to a
  follow-up change. The change is ready for spec sync and archive review.
