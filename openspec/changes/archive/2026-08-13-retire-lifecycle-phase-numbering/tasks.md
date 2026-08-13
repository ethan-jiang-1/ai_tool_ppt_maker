## 1. Remove the reader surface

- [x] 1.1 In `scripts/shared/state/md_controller_reader.mjs`, remove the `LIFECYCLE_PHASES` export and the `lifecyclePhase`/`unsupportedPhase` fields in `normalizeNode`; done when parsed nodes expose `methodModule` but no numeric lifecycle projection.
- [x] 1.2 Remove the `unsupported-phase`, `lifecycle-phase`, `phase4-ownership`, and both `target-lifecycle` branches; retain `METHOD_MODULES`, `TARGET_STAGE_FOUR_MODULES`, and their existing adapter/workflow ownership checks. A legacy `phase` key becomes an otherwise unconsumed key: no lifecycle-specific parse field, validation rule, or diagnostic is added.

## 2. Retire the frontmatter field

- [x] 2.1 Delete every `lifecycle_phase:` line from active node declarations in `create-deck`, `edit-text`, `edit-visual`, `edit-notes`, `restructure-slides`, and shared `classify-change`, leaving each adjacent `method_module:` intact; done when the active playbook index validates without the numeric field.

## 3. Converge lifecycle prose to method-module names

- [x] 3.1 Rename numeric lifecycle labels in `workflow/00-setup/README.md`, `workflow/01-content/README.md`, `workflow/02-visual-system/README.md`, `scripts/01-content/internal/README.md`, and `scripts/02-visual-system/internal/README.md` to their method-module names; also update the direct process references in `workflow/02-visual-system/01-gather-product-context-dna.md` and `workflow/01-content/presets/block-arc-catalog.md`. Leave the latter's customer-content examples untouched.
- [x] 3.2 Update `workflow/01-content/presets/README.md` and every visual preset README reference from `AGENTS.md (Phase 1/2)` to the matching method-module name, and change the shared `probe-image-channels.md` `Phase-0` description to `00-setup`.
- [x] 3.3 Remove only the legacy `phase: 04` alternative from `harness_coherence.mjs`'s `hierarchy-ambiguity` regex; retain its remaining hierarchy-conflation detection and do not add a replacement documentation validator.

## 4. Update tests and verification

- [x] 4.1 Update `tests/shared/state/test_md_controller_reader.mjs` and `test_target_authoring_draft_route.mjs` fixtures/assertions to use method-module-only node declarations. Preserve invalid-method-module and target-module ownership coverage, and prove that a legacy `phase` key is accepted as an unconsumed key with no retired lifecycle-specific effect.
- [x] 4.2 Update `tests/contracts/test_process_docs_consistency.mjs` to prove that `phase: 04` no longer triggers `hierarchy-ambiguity` while a remaining genuine hierarchy-conflation sample still does.
- [x] 4.3 Run `npm run test:focused -- tests/shared/state/test_md_controller_reader.mjs`, `npm run test:focused -- tests/shared/state/test_target_authoring_draft_route.mjs`, and `npm run test:focused -- tests/contracts/test_process_docs_consistency.mjs`, then `npm test`, `openspec validate retire-lifecycle-phase-numbering --strict`, `openspec validate --all --strict`, and `git diff --check`. Confirm no active playbook declaration has `lifecycle_phase:` and no retired reader identifier remains in the reader or its focused test surfaces.

## Execution Log

- 2026-08-13: Change proposed from the keel audit (term-drift #1). Scope and phase→module mapping confirmed against `md_controller_reader.mjs` constants.
