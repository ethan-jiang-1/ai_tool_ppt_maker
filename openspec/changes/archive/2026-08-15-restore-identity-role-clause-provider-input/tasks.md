## 1. Visual Asset Identity Contract

- [x] 1.1 Create `tests/02-visual-system/test_page_image_reference_material.mjs` around an OS-temporary run-bundle-like fixture with a synthetic non-`amber-agent` profile and test-owned PNG bytes, so the contract test does not depend on production deck data or the amber doctrine model sheet. Cover one valid registered identity role and assert the exact seven-field path-free projection, confined provider reference, verified reference SHA, exact normalized role clause, matching role-clause SHA, and deterministic repeated resolution.
- [x] 1.2 Reuse that temporary fixture for Visual Asset negative coverage of unregistered profile/role, escaping or missing reference paths, changed reference bytes, invalid role-clause text, incompatible subject count, and incompatible restriction; verify each failure emits no partial projection or fallback reference.
- [x] 1.3 Run the focused Visual Asset tests and make only a bounded resolver correction if the existing implementation fails the new contract. Preserve the registry schema and resolver output shape; if either that shape or `visual-config` must change, stop implementation, revise all affected change artifacts, and pass strict validation again before continuing.

## 2. Pure Raw Validation And Provider Identity

- [x] 2.1 Add failing Pure identity-present and no-identity integration fixtures in `tests/04-pure-image/`, asserting the raw clause/projection pair and the target six-field provider-facing identity with no SHA or path.
- [x] 2.2 Extend `validatePureRawContract` with exact identity/clause null pairing, seven-field projection keys and types, supported count/restriction checks, non-empty clause validation, and exact UTF-8 role-clause digest matching before raw hashing or plan publication.
- [x] 2.3 Add a private deterministic Pure provider-identity builder and update `compilePureProviderInput` to emit the six semantic fields plus exact role clause, or `null`, solely from the validated raw contract.
- [x] 2.4 Add Pure negative checkpoint tests for null asymmetry, missing/extra projection keys, malformed IDs/digests/count/restriction, clause tamper, and digest mismatch; prove failure uses `pure_raw_contract_invalid`, writes no State/derived/current plan, creates no authorization/provider effect, and succeeds after repairing the fixture and rerunning the same plan checkpoint.

## 3. Framed Raw Validation And Exact Compiled Contract

- [x] 3.1 Add failing Framed identity-present and no-identity integration fixtures in `tests/03-framed-image/test_framed_workflow.mjs`, asserting the same six-field provider identity as Pure while retaining protected composition, source restrictions, and the exclusive header reservation.
- [x] 3.2 Extend the Framed raw-contract validator with the same exact identity/clause pairing, projection shape/type, supported value, and digest-match rules as Pure before request or plan construction.
- [x] 3.3 Add one Framed adapter-internal deterministic provider-identity builder usable by both `compileFramedProviderInput` and `framed_provider_input_contract.mjs`; update the exact validator to reject missing/altered clauses, SHA/path reintroduction, extra fields, and non-canonical bytes.
- [x] 3.4 Add Framed negative checkpoint tests for every identity raw-contract failure and compiled-input tamper; prove `framed_raw_contract_invalid` or `framed_provider_input_contract_invalid` occurs before State/derived/current plan, authorization, provider work, or partial publication, then verify same-check recovery with a repaired fixture.

## 4. Exact Transport And Invalidation

- [x] 4.1 Extend existing fake-fetch transport tests for Pure and Framed so post-plan registry drift cannot change the submitted prompt; assert the prompt equals the bound canonical bytes, contains the exact clause with no identity SHA/path, and the submitter performs no semantic reconstruction.
- [x] 4.2 Assert identity-bearing provider bodies attach the bound Style Master plus per-page identity reference, while no-identity controls attach only Style Master and keep `visual.identity: null`; do not change `reference_transport` field semantics or runtime code.
- [x] 4.3 Add lifecycle/invalidation coverage proving an exact role-clause change changes the affected compiled-input digest and routes prior exact work to the existing `compiled_provider_input_drift` / Generated Image Rebuild path without rewriting historical plan, grant, media, review, State, or source epoch.
- [x] 4.4 Seed retained Pure and Framed plans with the former projection-only compiled identity under otherwise current facts, then prove stored-plan preflight recompiles the current candidate and rejects authorization/generation before grant, attempt, or fake provider invocation; cover the progressive `expected_plan` fence as applicable.
- [x] 4.5 Assert provider-input inspection and per-page derived `image2-request` artifacts expose the same new canonical bytes and digest while remaining non-authoritative and provider-free.

## 5. Architecture And Regression Verification

- [x] 5.1 Run and, only if needed, extend `tests/contracts/test_harness_architecture.mjs` to prove provider-input compilation remains confined to the selected adapters and no Page Image Core, shared runtime, root submitter, or sibling-workflow compiler is introduced.
- [x] 5.2 Run the focused Visual Asset, Pure, Framed, transport, invalidation, and architecture Vitest files and resolve all failures without widening the identity contract.
- [x] 5.3 Run `npm test` and resolve protected core-suite regressions.
- [x] 5.4 Run `npm run test:sweep` and resolve the broad Vitest regression sweep; no new E2E test is required unless implementation unexpectedly changes public CLI, Controller, State, authorization, or provider protocol behavior.
- [x] 5.5 Run `openspec validate restore-identity-role-clause-provider-input --strict` and `git diff --check`; verify the implementation adds no dependency, protocol suffix, state/schema field, retry, waiver, fallback, or duplicate controller.
- [x] 5.6 Verify the final implementation leaves `visual-config`, `image-production`, Page Image Core ownership, target runtime/submit semantics, production `deck_*` data, and every `_generated/` tree unchanged; hand off affected runs for a later owner-issued fresh plan, authorization, generation, and Complete Page Review.
