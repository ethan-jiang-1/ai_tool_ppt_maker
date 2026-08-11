# C5 Apply Ledger

> Apply protocol: update this checklist and the Verification Ledger immediately
> after every verified task group and after every failed verification/recovery.
> Mark a checkbox only when its named evidence is recorded below; do not defer
> all task updates until the end. Publication is derived inspection output, not
> a reason to hand-edit `_generated/` or to use a production Run Bundle fixture.

## 1. Current Contracts And Layout

- [ ] 1.1 Update `schema/stages/`, `flow.yaml`, and
  `serialization-contracts.yaml` so all seven C5 artifacts have one declared
  current producer, role, provenance, materialization status, and
  workflow-specific presence rule; preserve C4's current Page Class/profile
  terms, and convert the two C5 planned stages to materialized without creating
  a historical contract.
- [ ] 1.2 Extend `page_image_paths.mjs` and the public Run Bundle layout export
  with the one `derived/` root, deck index, and stable-ID page paths; update
  the rendered tree/layout checks so the directory is a regenerable sibling of
  Human Navigation, never a navigation child or immutable store.
- [ ] 1.3 Add focused schema/layout tests for the declared file set, path
  confinement, stable-ID identity, Framed HTML-only presence, Pure absence,
  and clean `new-version` generated-output boundary.

## 2. Shared Derived-Data Publisher

- [ ] 2.1 Implement one shared provider-free C5 publisher/validator that accepts
  only selected adapter typed candidate facts and produces canonical envelopes
  for page-source-receipt, page-layout, page-render-model,
  page-generation-spec, image2-request, page-artifact-index, and the deck
  index; every output must name purpose, adjustment scope, downstream
  controller, producer, upstream bindings, digest, rebuild impact, and
  `invalidated_by` facts.
- [ ] 2.2 Build the publisher's all-or-nothing staging/replacement path. It must
  validate all page IDs, workflow rules, confined references, cross-artifact
  digests, and plan/source lineage before replacement; it must neither read a
  previous derived tree nor expose a partial tree after failure.
- [ ] 2.3 Add unit coverage for canonical serialization, independent index
  references, exact request UTF-8/digest preservation, malformed or mismatched
  inputs, unsafe paths, one-page failure, and stale/manual output remaining
  non-authoritative.

## 3. Typed Producer Integration

- [ ] 3.1 Expose the parser-owned per-page normalized receipt and the C4
  workflow-isolated resolved layout/provenance to the publisher without making
  either published file an input to parsing, resolution, invalidation, or
  adapter compilation.
- [ ] 3.2 Expose Core generation semantics and the selected adapter's exact
  compiled provider bytes/bindings to the publisher. Confirm the writer copies
  those bytes rather than reconstituting prompt text or importing an
  unselected profile.
- [ ] 3.3 Integrate Framed with the existing deterministic header renderer so it
  publishes one exact `framed-header.html` and rejects a sibling JSON header
  controller; cover Page Class/profile provenance per page.
- [ ] 3.4 Integrate Pure with the same shared chain while asserting that no
  Framed overlay, geometry, HTML, or placeholder is emitted.

## 4. Provider-Free Plan Publication

- [ ] 4.1 Invoke the publisher from both selected adapter plan paths only after
  candidate compilation (and Framed proof) but before
  `publishProgressiveRawWorkPlan()` makes the plan current or the CLI exposes
  authorization.
- [ ] 4.2 Preserve one owner-issued failure action for an invalid publication:
  prove it short-circuits current-plan/grant/attempt/review/provider work,
  adds no state, waiver, retry, or new gate, and succeeds through the same
  planning checkpoint after direct repair.
- [ ] 4.3 Keep detailed request content outside Human Navigation, CLI
  diagnostics, and lifecycle selectors; extend direct Human Navigation and
  provider-input inspection tests to prove C5 data is not copied or accepted
  as a control input, while the existing aggregate inspection remains a
  separate non-C5 derived projection.

## 5. Contract And Review Safeguards

- [ ] 5.1 Extend the opt-in production-schema conformance test and its pure
  evaluator snapshot with positive Framed/Pure C5 chains and negative cases for
  an undeclared stage/role, missing provenance, mixed identity, and a
  Framed-only artifact on Pure.
- [ ] 5.2 Extend architecture/import-boundary checks so the shared publisher
  uses public owner interfaces and no adapter imports another phase's private
  source helper.
- [ ] 5.3 Run and extend `test_complete_page_review.mjs` plus the raw lifecycle
  tests to prove C5 publication is guide-only and cannot create, accept,
  replace, or split a Complete Page Review.

## 6. Focused Integration And Regression

- [ ] 6.1 Add temporary-bundle integration coverage for one Framed and one Pure
  `image2 plan`: inspect every per-page file and deck index from receipt through
  exact request bytes, verify provenance/invalidation links, and assert zero
  provider invocations before authorization.
- [ ] 6.2 Add or extend a mock-provider public-CLI E2E that confirms the
  published C5 chain precedes the existing authorization route and remains
  absent from Human Navigation; do not use a production `deck_*` or research
  input as a fixture.
- [ ] 6.3 Run the C5 focused unit/integration/E2E suite, `npm test`, strict
  OpenSpec validation, Run Bundle layout self-check, and `git diff --check`.
  Record each command's pass/fail evidence and any bounded recovery below; do
  not mark this task complete while a required verification is still blocked.

## Verification Ledger

- Pending implementation.
