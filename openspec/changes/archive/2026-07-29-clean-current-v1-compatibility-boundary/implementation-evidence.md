# Implementation evidence

All fixtures below are temporary bundles created beneath the operating-system
temporary directory. No `deck_*`, `dpt_*`, or production `_generated/` tree
was read or modified.

## Read-only observation and retained compatibility

- `npx vitest run tests/shared/workflow/test_target_workflow_inspection.mjs`
  — 3 passed; marker-first workflow selection, selected target readiness, and
  hybrid hard-stop stay read-only.
- `npx vitest run --config vitest.process.config.mjs tests/shared/workflow/test_process_workflow_inspection.mjs tests/contracts/test_process_workflow_inspection_cli.mjs`
  — 13 passed; missing v1 receipt remains absent under observation, while
  explicit `validate` remains the sanctioned receipt-writing route.
- `npx vitest run --config vitest.e2e.config.mjs tests_e2e/shared/workflow/test-workflow-inspection-flow.mjs`
  — 4 passed; workflow-selection-pending and selected Framed/Pure preserve
  complete bundle trees, preserve v2 receipt bytes, create no v1 receipt, and
  the v1/v2 hybrid returns its existing repair envelope without mutation.
- `npm run test:mock-e2e -- tests_e2e/shared/workflow/test_mock_target_workflow_journey.mjs`
  — 3 passed; fresh Framed, fresh Pure, and exact CURRENT v1 bounded journeys
  remain isolated from one another.
- `npx vitest run tests/compatibility/current-v1-page-authority/test_page_authority_raw_manifest.mjs tests/05-delivery/test_delivery.mjs`
  — 8 passed; v1 raw, final/notes lineage, structural materialization, and
  shared delivery proof remain valid after relocation.

## Ownership, documentation, and regression checks

- `npx vitest run tests/contracts/test_framework_architecture.mjs tests/contracts/test_framework_directory_layout.mjs tests/contracts/test_framework_governance_ledger.mjs tests/contracts/test_retirement_ledger_audit.mjs`
  — 21 passed; old numbered owners, unowned moved tests, target-to-v1 imports,
  and second delivery writers are rejected.
- `npx vitest run --config vitest.process.config.mjs tests/contracts/test_process_docs_consistency.mjs`
  — 12 passed; command links point v1 to the compatibility classifier and
  target classification to `06-iteration`.
- `npm test` — passed (`development-verification-v1`, core inventory).
- `git diff --check` — passed.
- `openspec validate clean-current-v1-compatibility-boundary --strict` — passed.

## Closeout

- The five accepted delta specs were manually merged into their corresponding
  main specs, preserving main-spec requirements outside this change.
- The change was archived at
  `openspec/changes/archive/2026-07-29-clean-current-v1-compatibility-boundary/`.
- The following repository commit records the synchronized, archived closeout.
