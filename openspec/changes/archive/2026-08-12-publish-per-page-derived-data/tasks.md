# C5 Apply Ledger

> Apply protocol: update this checklist and the Verification Ledger immediately
> after every verified task group and after every failed verification/recovery.
> Mark a checkbox only when its named evidence is recorded below; do not defer
> all task updates until the end. Publication is derived inspection output, not
> a reason to hand-edit `_generated/` or to use a production Run Bundle fixture.

## 1. Current Contracts And Layout

- [x] 1.1 Update `schema/stages/`, `flow.yaml`, and
  `serialization-contracts.yaml` so all seven C5 artifacts have one declared
  current producer, role, provenance, materialization status, and
  workflow-specific presence rule; preserve C4's current Page Class/profile
  terms, and convert the two C5 planned stages to materialized without creating
  a historical contract.
- [x] 1.2 Extend `page_image_paths.mjs` and the public Run Bundle layout export
  with the one `derived/` root, deck index, and stable-ID page paths; update
  the rendered tree/layout checks so the directory is a regenerable sibling of
  Human Navigation, never a navigation child or immutable store.
- [x] 1.3 Add focused schema/layout tests for the declared file set, path
  confinement, stable-ID identity, Framed HTML-only presence, Pure absence,
  and clean `new-version` generated-output boundary.

## 2. Shared Derived-Data Publisher

- [x] 2.1 Implement one shared provider-free C5 publisher/validator that accepts
  only selected adapter typed candidate facts and produces canonical envelopes
  for page-source-receipt, page-layout, page-render-model,
  page-generation-spec, image2-request, page-artifact-index, and the deck
  index; every output must name purpose, adjustment scope, downstream
  controller, producer, upstream bindings, digest, rebuild impact, and
  `invalidated_by` facts.
- [x] 2.2 Build the publisher's all-or-nothing staging/replacement path. It must
  validate all page IDs, workflow rules, confined references, cross-artifact
  digests, and plan/source lineage before replacement; it must neither read a
  previous derived tree nor expose a partial tree after failure.
- [x] 2.3 Add unit coverage for canonical serialization, independent index
  references, exact request UTF-8/digest preservation, malformed or mismatched
  inputs, unsafe paths, one-page failure, and stale/manual output remaining
  non-authoritative.

## 3. Typed Producer Integration

- [x] 3.1 Expose the parser-owned per-page normalized receipt and the C4
  workflow-isolated resolved layout/provenance to the publisher without making
  either published file an input to parsing, resolution, invalidation, or
  adapter compilation.
- [x] 3.2 Expose Core generation semantics and the selected adapter's exact
  compiled provider bytes/bindings to the publisher. Confirm the writer copies
  those bytes rather than reconstituting prompt text or importing an
  unselected profile.
- [x] 3.3 Integrate Framed with the existing deterministic header renderer so it
  publishes one exact `framed-header.html` and rejects a sibling JSON header
  controller; cover Page Class/profile provenance per page.
- [x] 3.4 Integrate Pure with the same shared chain while asserting that no
  Framed overlay, geometry, HTML, or placeholder is emitted.

## 4. Provider-Free Plan Publication

- [x] 4.1 Invoke the publisher from both selected adapter plan paths only after
  candidate compilation (and Framed proof) but before
  `publishProgressiveRawWorkPlan()` makes the plan current or the CLI exposes
  authorization.
- [x] 4.2 Preserve one owner-issued failure action for an invalid publication:
  prove it short-circuits current-plan/grant/attempt/review/provider work,
  adds no state, waiver, retry, or new gate, and succeeds through the same
  planning checkpoint after direct repair.
- [x] 4.3 Keep detailed request content outside Human Navigation, CLI
  diagnostics, and lifecycle selectors; extend direct Human Navigation and
  provider-input inspection tests to prove C5 data is not copied or accepted
  as a control input, while the existing aggregate inspection remains a
  separate non-C5 derived projection.

## 5. Contract And Review Safeguards

- [x] 5.1 Extend the opt-in production-schema conformance test and its pure
  evaluator snapshot with positive Framed/Pure C5 chains and negative cases for
  an undeclared stage/role, missing provenance, mixed identity, and a
  Framed-only artifact on Pure.
- [x] 5.2 Extend architecture/import-boundary checks so the shared publisher
  uses public owner interfaces and no adapter imports another phase's private
  source helper.
- [x] 5.3 Run and extend `test_complete_page_review.mjs` plus the raw lifecycle
  tests to prove C5 publication is guide-only and cannot create, accept,
  replace, or split a Complete Page Review.

## 6. Focused Integration And Regression

- [x] 6.1 Add temporary-bundle integration coverage for one Framed and one Pure
  `image2 plan`: inspect every per-page file and deck index from receipt through
  exact request bytes, verify provenance/invalidation links, and assert zero
  provider invocations before authorization.
- [x] 6.2 Add or extend a mock-provider public-CLI E2E that confirms the
  published C5 chain precedes the existing authorization route and remains
  absent from Human Navigation; do not use a production `deck_*` or research
  input as a fixture.
- [x] 6.3 Run the C5 focused unit/integration/E2E suite, `npm test`, strict
  OpenSpec validation, Run Bundle layout self-check, and `git diff --check`.
  Record each command's pass/fail evidence and any bounded recovery below; do
  not mark this task complete while a required verification is still blocked.

## Verification Ledger

- 2026-08-11 - First C5 publisher unit checkpoint failed before publication
  logic ran: `npx vitest run tests/shared/image2/test_page_derived_data.mjs
  --reporter=verbose` reported 4 fixture-construction failures because its
  synthetic SHA-256 placeholders used non-hex characters. No staged tree,
  Run Bundle lifecycle state, authorization, review, or provider work was
  created. Repair the test fixture to use valid lowercase-hex digests and
  rerun the exact command.
- 2026-08-11 - The recovery rerun passed 3 publisher cases but one unsafe-ID
  case still failed in the shared raw-plan fixture constructor rather than in
  the publisher. No publication or lifecycle mutation occurred. Construct a
  valid candidate, then alter only its receipt ID to exercise the publisher's
  path validator before rerunning the same command.
- 2026-08-11 - C5 publisher/schema/architecture checkpoint found one bounded
  repository-contract failure: the new owned publisher test was out of
  alphabetical order in `source-test-ownership.json`. All other 31 focused
  tests passed. Reorder the manifest entry, then rerun the same focused group;
  no Run Bundle, lifecycle, authorization, review, or provider work occurred.
- 2026-08-11 - C5 publisher/schema/architecture recovery passed: `npx vitest
  run tests/shared/image2/test_page_derived_data.mjs
  tests/contracts/test_page_image_schema_definitions.mjs
  tests/contracts/test_production_schema_conformance.mjs
  tests/contracts/test_harness_architecture.mjs --reporter=verbose` reported
  4 files / 32 tests passing. The shared publisher validates exact typed
  request bytes and all raw/progressive lineage before atomically replacing a
  complete Framed or Pure tree; failure staging leaves the former tree intact
  and unread. The declared C5 producer, roles, materialization, and
  workflow-presence rules now have one inventory anchor. Tasks 1.1 and 2.1--2.3
  are complete.
- 2026-08-11 - First C5 plan-failure integration checkpoint found a bounded
  assertion mismatch: after publication is blocked, the progressive lifecycle
  represents absent grant/attempt/review records by omitting their fields,
  rather than setting them to `null`. The C5 failure itself correctly returned
  the owner-issued direct rebuild action and no current plan. Update the test
  to assert field absence, then rerun the exact Pure integration test.
- 2026-08-11 - C5 Human Navigation checkpoint found one pre-existing stale
  CLI assertion: an undeclared source marker now emits the current
  `repair-current-protocol` diagnostic with `current_protocol_invalid`, while
  the test still expected its retired export diagnostic. The C5 navigation
  assertion itself passed: detailed provider input stayed outside Human
  Navigation. Update the stale expected diagnostic and rerun the focused
  navigation/adapter group.
- 2026-08-11 - C5 adapter/publication safeguards passed. The Framed and Pure
  temporary-bundle plan tests inspect receipt, layout, render model, Core
  generation facts, exact selected-adapter request bytes, deck/page indexes,
  Framed renderer HTML, and Pure's absent header path before any provider
  route. A derived-root replacement failure returns only
  `rebuild_target_raw_plan`, publishes no current plan/grant/attempt/review,
  and succeeds at the same plan checkpoint after repair. Human Navigation no
  longer copies either C5 request text or the separate aggregate inspection
  sidecar. The existing raw-owner/Complete Page Review surface remains the
  only review controller.
- 2026-08-11 - C5 contract and review safeguards passed: `npx vitest run
  tests/contracts/test_production_schema_conformance.mjs
  tests/contracts/test_harness_architecture.mjs
  tests/shared/image2/test_complete_page_review.mjs
  tests/shared/image2/test_progressive_raw_owner.mjs --reporter=verbose`
  reported 4 files / 57 tests passing. Its C5 evaluator accepts valid Framed
  and Pure chains and rejects undeclared role/stage, missing provenance, mixed
  identity, and a Framed-only artifact on Pure. Tasks 3.1--6.1 except 6.2 and
  final regression are complete.
- 2026-08-11 - C5 public-CLI mock E2E passed: `npx vitest run --config
  vitest.e2e.config.mjs tests_e2e/shared/workflow/test_mock_target_workflow_journey.mjs
  -t "publishes C5 before public authorization" --reporter=verbose` reported
  1 passed / 8 filtered tests. After the public `image2 plan`, both C5 page
  artifacts and deck index exist before the existing pilot/authorize route;
  the mock provider receives no page call before authorization, and Human
  Navigation contains neither request bytes nor the derived root. Task 6.2 is
  complete.
- 2026-08-11 - First final strict-validation command used an obsolete OpenSpec
  argument: `openspec validate --change "publish-per-page-derived-data"
  --strict` was rejected because this CLI takes the change name positionally.
  No files were written. The corrected strict command is recorded below.
- 2026-08-11 - C5 final verification passed. The focused unit/integration
  suite (publisher, Pure/Framed plans, Human Navigation, schema/architecture,
  Complete Page Review, and progressive raw owner) completed successfully;
  the public mock E2E is recorded above. `npm test` reported core inventory
  passed; `openspec validate "publish-per-page-derived-data" --strict`
  reported the change valid; `node
  ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs --self-check`
  reported the SSOT self-consistent; and `git diff --check` passed. Task 6.3
  is complete.
- 2026-08-11 - C5 layout foundation passed: `npx vitest run
  tests/shared/run-bundle/test_page_image_layout.mjs --reporter=verbose`
  reported 1 file / 14 tests passing, and
  `node ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs
  --self-check` passed. The new derived root and stable-ID paths are confined
  below the Page Image generated owner; temporary bundles retain the clean
  successor boundary.
- 2026-08-11 - First C5 schema-definition checkpoint failed as expected:
  `npx vitest run tests/contracts/test_page_image_schema_definitions.mjs
  --reporter=verbose` reported 1 failing assertion because the C1-era test
  explicitly required C5 producers to remain `planned`. The current C5 schema
  change has materialized them. No Run Bundle, lifecycle state, or provider
  work was created; update the contract assertion, then rerun this exact test.
- 2026-08-11 - C5 schema/layout recovery passed: `npx vitest run
  tests/shared/run-bundle/test_page_image_layout.mjs
  tests/contracts/test_page_image_schema_definitions.mjs --reporter=verbose`
  reported 2 files / 20 tests passing. The materialized C5 flow owner, safe
  per-page path resolver, Framed/Pure declared paths, and clean-successor
  generated boundary agree. `bundle_layout.mjs --self-check` and
  `git diff --check` also passed. Tasks 1.2 and 1.3 are complete; task 1.1
  remains open until the publisher's schema inventory entry and concrete anchor
  are added with the implementation.
