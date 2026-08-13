## 1. Retire the frontmatter field

- [ ] 1.1 Delete every `lifecycle_phase:` line from `ppt_maker_harness/playbook/*.md` (`create-deck`, `edit-text`, `edit-visual`, `edit-notes`, `restructure-slides`, `classify-change`), leaving the adjacent `method_module:` line intact.
- [ ] 1.2 Confirm no legacy `phase:` key remains in any playbook node frontmatter.

## 2. Remove the reader surface

- [ ] 2.1 In `scripts/shared/state/md_controller_reader.mjs`: remove the `LIFECYCLE_PHASES` export and the `lifecyclePhase`/`unsupportedPhase` fields in `normalizeNode`.
- [ ] 2.2 Remove the `unsupported-phase`, `lifecycle-phase`, `phase4-ownership`, and both `target-lifecycle` validation branches; keep `TARGET_STAGE_FOUR_MODULES` and its `image-production-adapter`/`production-workflows` uses.

## 3. Converge lifecycle prose to method-module names

- [ ] 3.1 Rename lifecycle "Phase N" headings/summaries in `workflow/00-setup/README.md`, `workflow/01-content/README.md`, `workflow/02-visual-system/README.md`, and the corresponding `scripts/*/internal/README.md` to method-module names.
- [ ] 3.2 Update preset README references (`AGENTS.md (Phase 1/2)`) to method-module names.
- [ ] 3.3 Update the `harness_coherence.mjs` `hierarchy-ambiguity` regex to drop the retired "Phase" canonical form while still flagging genuine lifecycle/module conflation.

## 4. Update tests and verification

- [ ] 4.1 Update `tests/shared/state/test_md_controller_reader.mjs` and `test_target_authoring_draft_route.mjs` fixtures/assertions to drop `lifecycle_phase`.
- [ ] 4.2 Add/keep a negative case asserting a stray `phase` key is rejected as undeclared.
- [ ] 4.3 Run `npm test`, `openspec validate retire-lifecycle-phase-numbering --strict`, `openspec validate --all --strict`, and `git diff --check`; confirm `grep -rn "lifecycle_phase"` over the four source dirs returns zero hits.

## Execution Log

- 2026-08-13: Change proposed from the keel audit (term-drift #1). Scope and phase→module mapping confirmed against `md_controller_reader.mjs` constants.
