# Apply baseline

Recorded before the canonical-path cutover for Change 4. This record covers framework source only; no `deck_*` or `dpt_*` data was read.

## Repository point

- Branch: `master`
- HEAD: `f457bf5` (`chore: add openspec change restructure-framework-script-modules`)
- Script-root executable/business `.mjs` files: 17
- Flat `PPTMAKER_FRAMEWORK/scripts/lib/*.mjs` modules: 31
- Registered direct executables: 14
- Unit/integration suites discovered by the pre-change Vitest configuration: 40 test files

## Pre-change direct executable inventory

The old producer registry was basename-only. Its fourteen entries were `ppt_flow.mjs`, `env-check.mjs`, `stage1_build_inputs.mjs`, `stage2_render_html.mjs`, `stage3_compose_slides.mjs`, `stage4_build_pptx.mjs`, `stage5_inject_notes.mjs`, `unified_pipeline.mjs`, `generate_style_master.mjs`, `make_contact_sheet.mjs`, `stage2_generate_images.mjs`, `stage3_lock_headers.mjs`, `bundle_layout.mjs`, and `lessons.mjs`. Direct-entry guards/bootstrap imports were recursively observed in those executables; `lib/cli_bootstrap.mjs` and `lib/cli_error.mjs` were the two library helpers participating in CLI transaction installation. The contract generators also contained direct-entry indicators and therefore require conversion to import-safe functions during this change.

The canonical replacement is the path-qualified registry in `PPTMAKER_FRAMEWORK/scripts/contracts/executable_inventory.mjs`.

## Pre-change import and path observations

- Root business scripts imported both sibling executables and `scripts/lib/*` implementation files.
- `ppt_flow.mjs` and `unified_pipeline.mjs` contained orchestration and child-process path references to the flat direct executables.
- `scripts/lib/` mixed CLI, run-bundle, state, identity, content, visual, HTML-production, migration, and legacy Image2 ownership.
- Active framework Markdown, tests, OpenSpec main specs/deltas, controller metadata, and CLI audit fixtures referenced flat `PPTMAKER_FRAMEWORK/scripts/*.mjs` paths and `scripts/lib/` paths.
- The pre-change Vitest include patterns enumerated root-level `tests/test_*.mjs` and `tests/test-*.mjs`; they were not recursive.

## Recursive regression baseline

Command: `npm test`

- Test files: 39 passed, 1 failed (40 total)
- Tests: 453 passed, 1 failed (454 total)
- Duration: approximately 50.97 seconds
- Known pre-existing failure: `tests/test_docs_consistency.mjs` reports `openspec/specs/framework-charter/spec.md:275 [unpaired-legacy-alias] Chain A is not paired locally with Header Text & Style Refresh`. This is documentation coherence work explicitly covered by tasks 5.4 and 5.6, not a migration-code regression.

## Required regression commands

The cutover must rerun at least:

```sh
npm test
npx vitest run tests_e2e/**/*.mjs
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs doctor
node tests/ci_html_runtime_evidence.mjs
node tests/benchmarks/html_delivery_acceptance.mjs
node PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs --help
npx vitest run tests/test_cli_error.mjs tests/test_docs_consistency.mjs
openspec validate restructure-framework-script-modules --strict
openspec validate --all --strict
git diff --check
```

The final owner paths replace the flat CLI/test paths in this command list during cutover; observable command envelopes, exits, state semantics, receipts, and artifact fingerprints remain the comparison surface.
