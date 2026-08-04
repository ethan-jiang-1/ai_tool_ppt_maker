## 1. Shared Provider-Clause Shape

- [x] 1.1 [image-generation] Add and export `isPageAuthorityProviderClausesShape(value)` in `PPTMAKER_FRAMEWORK/scripts/shared/image2/page_authority_target_runtime.mjs`. It accepts frozen or ordinary non-null, non-array records only when their exact keys are `recipe`, `composition`, and `motifs`; recipe/composition and every motif are non-empty after trim, while `motifs: []` remains valid.

## 2. Pure Raw Contract Validation

- [x] 2.1 [image-generation] Add and export `validatePureRawContract(rawContract)` in `PPTMAKER_FRAMEWORK/scripts/04-pure-image/index.mjs`, mirroring the existing public Framed validator. Require the exact Pure top-level key set, schema, non-empty slide ID, Pure workflow, resolved visual-language record, canonical provider-clause shape, and the declared nullable/display/body fields; return `{ ok: true, raw_contract_sha256 }` or `{ ok: false, code: "pure_raw_contract_invalid", message }`.
- [x] 2.2 [image-generation] Invoke `validatePureRawContract` immediately after `pureRawContract(slide)` and before provider-request construction, authorization-scope derivation, or source/raw-plan materialization. On success, use `raw_contract_sha256` for `raw_contracts_by_slide`; on failure, throw `PureImageWorkflowError` before provider work or state materialization.

## 3. Framed Provider-Clause Validation

- [x] 3.1 [image-generation] In `validateFramedRawContractAgainstProfile` (03-framed-image/index.mjs), replace the `object-or-null` provider-clause check with `isPageAuthorityProviderClausesShape`. Keep `validateFramedRawContract` as the direct test seam and preserve the existing profile/owner checks.

## 4. Regression Tests

- [x] 4.1 [image-generation] In `tests/04-pure-image/test_pure_workflow.mjs`, exercise exported `validatePureRawContract` with a plan-produced valid contract plus null, missing/extra-key, empty-text, and non-string-motif clause cases. Assert the valid plan stores the validator's returned raw-contract digest. Wrap the existing trusted resolver only in the test to return its otherwise valid selection with `provider_clauses: null`; `buildPureTargetRawPlan` must throw `PureImageWorkflowError` with code `pure_raw_contract_invalid` before source/raw-plan state materialization.
- [x] 4.2 [image-generation] In `tests/shared/image2/test_style_master_raw_binding.mjs`, add an isolated accepted Pure plan whose VISUAL BRIEF selects the seeded non-empty `connected-nodes` motif. After creating the plan, replace that temporary bundle registry's `connected-nodes` provider clause with a different text-guard-safe value. Invoke `targetPageAuthoritySubmitFactory` with fake `fetch` returning the existing valid native PNG fixture, parse the posted `body.prompt`, and assert its raw-contract recipe, composition, and ordered motif strings exactly equal the plan-bound values.
- [x] 4.3 [image-generation] In `tests/03-framed-image/test_framed_plan_lifecycle.mjs`, extend the existing `validateFramedRawContract` coverage with the same malformed provider-clause cases and assert its bounded invalid-contract result. Wrap the existing trusted resolver only in the test to return its otherwise valid selection with `provider_clauses: null`; `buildFramedTargetRawPlan` must throw `FramedImageWorkflowError` with code `framed_raw_contract_invalid` before source/raw-plan state materialization.
- [x] 4.4 [image-generation] In `tests/03-framed-image/test_framed_workflow.mjs`, add an isolated Framed plan whose VISUAL BRIEF selects the seeded non-empty `connected-nodes` motif. After creating the plan, replace that temporary bundle registry's `connected-nodes` provider clause with a different text-guard-safe value. Invoke `targetPageAuthoritySubmitFactory` with fake `fetch` returning the existing valid native PNG fixture (not the raw-generation callback), parse the posted `body.prompt`, and assert its raw-contract recipe, composition, and ordered motif strings exactly equal the plan-bound values. No real provider call is permitted.

## 5. Validation And Closeout

- [x] 5.1 [image-generation] Run the four exact adapter/transport test files under `vitest.config.mjs`: `tests/04-pure-image/test_pure_workflow.mjs`, `tests/03-framed-image/test_framed_plan_lifecycle.mjs`, `tests/03-framed-image/test_framed_workflow.mjs`, and `tests/shared/image2/test_style_master_raw_binding.mjs`; fix failures without real provider calls.
- [x] 5.2 [image-generation] Run the required protected baseline `npm test`, `openspec validate harden-page-authority-provider-clause-delivery --strict`, `openspec validate --all --strict`, and `git diff --check`; confirm no `deck_*` production artifact or `_generated/` file was used as a fixture or edited.
- [x] 5.3 [image-generation] After the code/tests pass, move BUG-035 to `_backlog/_done/_fixed_bugs/` with `git mv` and update the active/fixed/global backlog indexes according to their established migration ritual.
