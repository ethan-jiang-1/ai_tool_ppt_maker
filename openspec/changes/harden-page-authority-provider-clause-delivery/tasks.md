## 1. Shared Provider-Clause Shape

- [ ] 1.1 Add and export `isPageAuthorityProviderClausesShape(value)` in `PPTMAKER_FRAMEWORK/scripts/shared/image2/page_authority_target_runtime.mjs`: returns true only for a plain object with exactly `recipe` (non-empty string), `composition` (non-empty string), and `motifs` (array of non-empty strings).

## 2. Pure Raw Contract Validation

- [ ] 2.1 Add `validatePureRawContract(rawContract)` in `PPTMAKER_FRAMEWORK/scripts/04-pure-image/index.mjs`: validate `schema === TARGET_RAW_CONTRACT_SCHEMA`, non-empty `slide_id`, `workflow === PURE_IMAGE_WORKFLOW`, `visual_language` plain object, `provider_clauses` passing `isPageAuthorityProviderClausesShape`, plus `visual_identity_role_clause` string-or-null, `visual_scene` string-or-null, `visual_identity` object-or-null, `display` plain object, `body` string-or-null; return `{ ok, raw_contract_sha256 }` mirroring the framed validator.
- [ ] 2.2 Wire `validatePureRawContract` into `compilePureTargetRawPlanCandidate` before hashing/authorization; malformed contracts throw a PureWorkflowError and produce no provider request.

## 3. Framed Provider-Clause Validation

- [ ] 3.1 In `validateFramedRawContractAgainstProfile` (03-framed-image/index.mjs), replace the `object-or-null` provider_clauses check with `isPageAuthorityProviderClausesShape` and require it non-null whenever a `visual_language` is resolved.

## 4. Regression Tests

- [ ] 4.1 Pure plan-level test: malformed raw contract shape hard-stops before authorization and no provider request is produced.
- [ ] 4.2 Pure submit-factory test (`tests/shared/image2/test_style_master_raw_binding.mjs`): parse `providerBody.prompt` and assert the exact `raw_contract.provider_clauses` recipe/composition text is present.
- [ ] 4.3 Framed validator test: malformed provider_clauses (null despite resolved visual language, or wrong shape) are rejected by `validateFramedRawContractAgainstProfile`.
- [ ] 4.4 Framed provider-request test: serialized provider request (inspection `prompt`) contains the exact provider clause text.

## 5. Validation And Closeout

- [ ] 5.1 Run focused test files (`tests/04-pure-image/test_pure_workflow.mjs`, `tests/03-framed-image/test_framed_workflow.mjs`, `tests/shared/image2/test_style_master_raw_binding.mjs`) and fix regressions without real provider calls.
- [ ] 5.2 Run the regression suite and `openspec validate harden-page-authority-provider-clause-delivery --strict`; confirm no `deck_*` production artifact or `_generated/` file was used as a fixture or edited.
- [ ] 5.3 Move BUG-035 to `_backlog/_done/_fixed_bugs/` and update backlog README counts.
