> Apply protocol: update this ledger immediately after every verified task group
> and after every failed verification/recovery. Mark a checkbox only when its
> named evidence is recorded below; do not defer all task updates until the end.

## Verification Ledger

- 2026-08-11 - `npx vitest run tests/01-content/test_page_image_source.mjs`
  passed: 1 file, 13 tests. It verifies omitted `PAGE CLASS` normalizes to
  `standard`, explicit class reaches the trusted resolver, invalid/repeated
  values stop before a receipt, and retired `FRAME PRESET` is an unsupported
  current source field.
- 2026-08-11 - `npx vitest run tests/01-content/test_page_image_source.mjs
  tests/02-visual-system/test_pure_deck_visual_system.mjs` passed: 2 files,
  19 tests. The four-file resolver seed, override-first selection, cross-file
  missing-profile hard-stop, workflow-isolated projection, title-only Framed
  guard, unselected-sibling stable binding, and missing-source hard-stop now
  have temporary-bundle evidence.
- 2026-08-11 - First Core binding checkpoint failed as expected during the
  breaking contract cutover: `npx vitest run
  tests/shared/page-image/test_page_image_core.mjs
  tests/04-pure-image/test_pure_page_image_core.mjs
  tests/04-pure-image/test_pure_workflow.mjs` reported 5 failures. The bounded
  causes are old unit fixtures/expectations still supplying `frame_preset` and
  deck-wide Pure binding names, plus the deliberate new presentation-package
  missing-source diagnostic. No lifecycle or production bundle was written;
  the same command will be rerun after the fixtures and raw contract consumer
  are converted.
- 2026-08-11 - First Framed adapter checkpoint failed: `npx vitest run
  tests/03-framed-image/test_framed_render_contract.mjs
  tests/03-framed-image/test_framed_plan_lifecycle.mjs
  tests/03-framed-image/test_framed_workflow.mjs` reported 36 failures.
  Bounded causes are active test source fixtures that still author the retired
  `FRAME PRESET`, direct overlay fixtures that do not yet supply a resolved
  profile, and hand-built raw-plan bindings still setting the new per-page
  presentation digest to null. The implementation failure occurs before source
  receipt/plan materialization, so no lifecycle evidence was created; migrate
  the fixtures and rerun this exact checkpoint.
- 2026-08-11 - Recovery checkpoints passed. `npx vitest run
  tests/01-content/test_page_image_source.mjs
  tests/02-visual-system/test_pure_deck_visual_system.mjs
  tests/shared/run-bundle/test_page_image_layout.mjs
  tests/shared/page-image/test_page_image_core.mjs
  tests/03-framed-image/test_framed_render_contract.mjs` passed: 5 files,
  45 tests. The source parser, all four package documents, per-page Core
  binding, strict bundle paths, and per-page Framed browser contract now agree.
- 2026-08-11 - `npx vitest run
  tests/shared/run-bundle/test_page_image_layout.mjs` passed: 1 file, 14
  tests. Its clean-successor case proves a presentation override copies into
  `v2` while a source version's raw generated evidence does not.
- 2026-08-11 - `npx vitest run
  tests/contracts/test_page_image_schema_definitions.mjs
  tests/contracts/test_production_schema_conformance.mjs` passed: 2 files, 8
  tests. C4 is materialized in the conceptual flow, stage owners, and active
  serialization inventory; C5 remains the only planned per-page publisher.
- 2026-08-11 - `npx vitest run
  tests/02-visual-system/test_pure_deck_visual_system.mjs
  tests/03-framed-image/test_framed_render_contract.mjs` passed: 2 files, 15
  tests. Four-file package validation now rejects malformed selected and
  unselected sources before adapter work; resolved profiles survive the browser
  contract with no package fallback.
- 2026-08-11 - `npx vitest run
  tests/03-framed-image/test_framed_plan_lifecycle.mjs -t "mixed Page Class"`
  passed: 1 selected test. One candidate with standard and opening pages proves
  exact ordered per-page profile and protected-guide lineage without a global
  render-profile equality check.
- 2026-08-11 - Hard-coded-profile cleanup checkpoint initially reported two
  test-baseline failures: the test's alleged alternate font-selection algorithm
  equaled the current value, and config-fed geometry canonical bytes differed
  from the v2 compiler fixture. Recovery is bounded to a real v3 compiler
  identity/history entry and corrected alternate test value; no run bundle or
  lifecycle data was touched. The same renderer checkpoint follows.
- 2026-08-11 - Hard-coded-profile cleanup recovery passed: `npx vitest run
  tests/03-framed-image/test_framed_render_profile.mjs
  tests/03-framed-image/test_framed_render_contract.mjs
  tests/00-setup/test_html_fonts.mjs` passed: 3 files, 32 tests. The seeded
  Framed profile preserves deterministic geometry, browser/capture and font
  evidence without a caller-selectable preset. A clean-cutover search found
  `FRAME PRESET` only in the parser's explicit negative test fixture; no
  production selector or hard-coded overlay selection remains.
- 2026-08-11 - Core-to-adapter projection checkpoint passed. `npx vitest run
  tests/shared/page-image/test_page_image_core.mjs` passed: 1 file, 4 tests;
  `npx vitest run tests/04-pure-image/test_pure_page_image_core.mjs
  tests/04-pure-image/test_pure_workflow.mjs` passed: 2 files, 17 tests; and
  `npx vitest run tests/03-framed-image/test_framed_workflow.mjs` passed: 11
  tests (3 pre-existing documentation scenarios skipped). The Core binds each
  resolved page presentation, Pure accepts no Framed-local facts, and Framed
  compiles only its page-selected header/protected-region facts.
- 2026-08-11 - First 3.2 raw-binding checkpoint failed: `npx vitest run
  tests/03-framed-image/test_framed_plan_lifecycle.mjs
  tests/03-framed-image/test_framed_review_contribution.mjs
  tests/04-pure-image/test_pure_review_contribution.mjs
  tests/shared/image2/test_artifact_contracts.mjs
  tests/shared/image2/test_progressive_raw_owner.mjs` reported three bounded
  failures. Two generic artifact fixtures still expect the retired
  `deck_visual_system` diagnostic rather than `page_presentation`; one Framed
  review fixture constructs a slide without its required resolver-selected
  profile. The failures occur in test-only in-memory inputs before any
  run-bundle/lifecycle mutation. Migrate those fixtures, then rerun this exact
  checkpoint.
- 2026-08-11 - The 3.2 recovery exposed one further retired assumption in the
  Framed lifecycle test: its public raw-contract validator expected a global
  `standard` profile to identify a stale digest. With a per-page resolver this
  check belongs at candidate compilation against that page's resolved profile,
  where production already performs it. Replace the context-free assertion with
  the existing candidate/profile-drift path; no production data or lifecycle
  state was changed.
- 2026-08-11 - 3.2 raw-binding recovery passed. `npx vitest run
  tests/shared/image2/test_artifact_contracts.mjs
  tests/shared/image2/test_progressive_raw_owner.mjs` passed: 2 files, 34
  tests; `npx vitest run tests/03-framed-image/test_framed_review_contribution.mjs`
  passed: 1 file, 3 tests; `npx vitest run
  tests/04-pure-image/test_pure_review_contribution.mjs` passed: 1 file, 1
  test; and all 17 scenarios in `tests/03-framed-image/test_framed_plan_lifecycle.mjs`
  passed. The raw contract and binding now agree on each page's resolved
  presentation digest; profile/guide drift invalidates reuse before provider
  work, review, or other lifecycle mutation.
- 2026-08-11 - Mixed Framed review/proof checkpoint passed: `npx vitest run
  tests/03-framed-image/test_framed_plan_lifecycle.mjs -t "mixed Page Class"
  --reporter=verbose` passed: 1 selected test. One `standard` and one
  `opening` page preserve ordered per-page profile digests and protected-region
  guides through browser proof and review contribution, without a batch-wide
  profile equality check.
- 2026-08-11 - First 3.4 selected-Framed-presentation checkpoint failed only
  because its new test supplied the fixture's existing `page_presentation`
  digest, producing no actual drift and the correct local-refresh result.
  Replace it with a distinct digest and rerun the invalidation/configuration
  checkpoint; the evaluator performed no mutation.
- 2026-08-11 - 3.4 invalidation recovery passed: `npx vitest run
  tests/shared/page-image/test_page_image_invalidation.mjs
  tests/02-visual-system/test_pure_deck_visual_system.mjs` passed: 2 files,
  14 tests. Selected Framed and Pure presentation drift routes to raw rebuild;
  Framed local refresh requires every binding to remain equal; a valid
  unselected sibling keeps the selected binding stable, while malformed
  siblings stop package evaluation before plan/lifecycle work.
- 2026-08-11 - 1.2 lexical clean-cutover check passed. `npx vitest run
  tests/01-content/test_page_image_source.mjs` passed: 1 file, 13 tests.
  `rg -n -i "FRAME PRESET|frame_preset|framed_header_preset|pure-deck-visual-system-v1|pure_deck_visual_system_v1"
  ppt_maker_harness tests tests_e2e` found only the parser's explicit negative
  test input. The remaining active CLI source-validation diagnostic now directs
  repair to Page Source header fields or the selected Framed presentation
  profile, not a retired preset.
- 2026-08-11 - 3.5 authoring/refresh guidance checkpoint passed: `npx vitest
  run tests/shared/state/test_md_controller_reader.mjs
  tests/contracts/test_intent_route_catalog.mjs
  tests/01-content/test_page_image_source.mjs` passed: 3 files, 28 tests.
  The current source template, authoring method, visual-system guidance, and
  edit/classify playbooks agree that Page Class is an optional Agent
  recommendation and that a bad presentation package is repaired at its named
  source before the same planning checkpoint.
- 2026-08-11 - 4.1 source/configuration coverage passed: `npx vitest run
  tests/01-content/test_page_image_source.mjs
  tests/02-visual-system/test_pure_deck_visual_system.mjs` passed: 2 files,
  20 tests. The resolver test now asserts all selected source provenance and
  deterministic repeated binding digests, alongside omitted/explicit/invalid
  Page Class, retired field, four-file package, override, cross-file,
  workflow-isolation, sibling, and title-only short-circuit coverage.
- 2026-08-11 - First 4.2 mixed-Framed-Pilot checkpoint failed in its test-only
  generated Markdown: the conditional Page Class interpolation let the parser
  see a duplicate `SLIDE BODY` field. Source parsing stopped before Style Master
  readiness, raw planning, browser work, state mutation, or provider work.
  Generate the optional Page Class as its own complete line and rerun the same
  mock Pilot test.
- 2026-08-11 - 4.2 core/adapter/invalidation recovery passed. `npx vitest run
  tests/04-pure-image/test_pure_page_image_core.mjs --reporter=verbose` passed:
  1 file, 4 tests; `npx vitest run
  tests/03-framed-image/test_framed_workflow.mjs -t "publishes a partial Framed
  Pilot" --reporter=verbose` passed: 1 selected test; and `npx vitest run
  tests/03-framed-image/test_framed_plan_lifecycle.mjs -t "one mixed-class
  proof page" --reporter=verbose` passed: 1 selected test. Together with the
  14-test shared invalidation/configuration checkpoint, these prove selected
  drift rebuilds, valid siblings remain unselected, malformed siblings stop
  before lifecycle mutation, and one stale mixed-batch proof page stops all
  materialization.
- 2026-08-11 - 4.3 bundle/schema integration coverage passed: `npx vitest run
  tests/shared/run-bundle/test_page_image_layout.mjs
  tests/contracts/test_page_image_schema_definitions.mjs
  tests/contracts/test_production_schema_conformance.mjs` passed: 3 files, 22
  tests. Synthetic bundles prove init seeds the confined source package,
  overrides/new-version preserve the source/evidence boundary, C4 schema and
  inventory ownership conform, and C5 remains unmaterialized with no provider,
  review, or migrated production data.
- 2026-08-11 - 4.4 selected mock E2E passed: `npx vitest run --config
  vitest.e2e.config.mjs tests_e2e/shared/workflow/test_mock_target_workflow_journey.mjs
  -t "Framed selected Page Class" --reporter=json
  --outputFile=/tmp/c4-framed-page-class-e2e.json` passed: 1 selected test, 7
  intentionally skipped. Through the public `ppt_flow` path, a Framed page
  changes from `standard` to `opening`, takes raw rebuild plus Complete Page
  Review, then performs a notes-only refresh without another provider request.
  It uses only the mock provider and a temporary Run Bundle.
- 2026-08-11 - First 4.5 architecture/lexical checkpoint found two real
  architecture failures in `npx vitest run
  tests/contracts/test_harness_architecture.mjs
  tests/contracts/test_production_schema_conformance.mjs
  tests/01-content/test_page_image_source.mjs --reporter=verbose`: the new
  resolver imported `PAGE_IMAGE_CLASSES` from `01-content/internal`, producing
  `phase-adjacency` and `foreign-phase-private-import`. The focused lexical and
  schema assertions passed, but the boundary failure prevents task completion.
  No Run Bundle, lifecycle record, provider, or research input was read or
  modified; move the shared class vocabulary to an existing public interface,
  then rerun this exact checkpoint.
- 2026-08-11 - 4.5 architecture/lexical recovery passed: `npx vitest run
  tests/contracts/test_harness_architecture.mjs
  tests/contracts/test_production_schema_conformance.mjs
  tests/01-content/test_page_image_source.mjs --reporter=verbose` passed: 3
  files, 34 tests. `PAGE_IMAGE_CLASSES` now crosses Phase boundaries through
  the existing public Run Bundle layout interface; C4's resolver has no
  `01-content/internal` dependency. The architecture test rejects every
  retired selector/source-shape token in Harness executable source and
  requires resolver-owned presentation selection, while schema conformance
  requires exactly the four materialized `layout-config` contracts and no
  `framed_header_preset` selector. The Page Source negative fixture remains
  isolated in tests.
- 2026-08-11 - 5.1 focused regression passed: `npx vitest run
  tests/01-content/test_page_image_source.mjs
  tests/02-visual-system/test_pure_deck_visual_system.mjs
  tests/shared/run-bundle/test_page_image_layout.mjs
  tests/shared/page-image/test_page_image_core.mjs
  tests/shared/page-image/test_page_image_invalidation.mjs
  tests/03-framed-image/test_framed_render_profile.mjs
  tests/03-framed-image/test_framed_render_contract.mjs
  tests/03-framed-image/test_framed_plan_lifecycle.mjs
  tests/03-framed-image/test_framed_review_contribution.mjs
  tests/03-framed-image/test_framed_workflow.mjs
  tests/04-pure-image/test_pure_page_image_core.mjs
  tests/04-pure-image/test_pure_review_contribution.mjs
  tests/04-pure-image/test_pure_workflow.mjs
  tests/contracts/test_page_image_schema_definitions.mjs
  tests/contracts/test_production_schema_conformance.mjs
  tests/contracts/test_harness_architecture.mjs --reporter=json
  --outputFile=/tmp/c4-focused-page-class.json` passed: 32 suites, 146 tests,
  0 failures, and 3 existing TODOs. It covers source, resolver, layout, Core,
  invalidation, both adapters, review binding, and C4 schema/architecture.
- 2026-08-11 - 5.1 selected mock E2E passed: `npx vitest run --config
  vitest.e2e.config.mjs tests_e2e/shared/workflow/test_mock_target_workflow_journey.mjs
  -t "Framed selected Page Class" --reporter=json
  --outputFile=/tmp/c4-framed-page-class-e2e.json` passed: 1 selected test, 0
  failures, 7 filter-skipped scenarios. It exercises only a mock provider and
  temporary Run Bundle.
- 2026-08-11 - 5.2 in progress: `npm test` passed the core development
  verification (`development-verification`, tier `core`) in 1111 ms. The full
  sweep, strict OpenSpec validation, layout self-check, and whitespace check
  remain before task completion.
- 2026-08-11 - First 5.2 full sweep failed: `npm run test:sweep --
  --reporter=json --outputFile=/tmp/c4-full-sweep.json` reported 138 suites,
  511 passed tests, and 5 failures (plus 3 TODOs). Failures are the Framed
  partial-Pilot workflow case, one human-artifact-reference CLI diagnostic,
  two clean-target-draft State assertions, and the Style Master raw-binding
  case that edits the former Pure visual-system source. No completion checkbox
  is claimed. Rerun each file independently to distinguish a full-sweep
  interference from a C4 contract break; only update the affected contract or
  test after that bounded result is recorded.
- 2026-08-11 - Full-sweep isolation completed. The Framed partial-Pilot test
  passes alone (`1 passed`, `17` filter-skipped), so it is sweep interference.
  The C4 Pure raw-binding test exposed one stale expected error: selected
  presentation drift now first returns `target_source_receipt_stale`, with the
  same `rebuild_target_raw_plan` repair action, rather than
  `target_raw_plan_stale`. Its updated focused rerun passed (`1 passed`, `16`
  filter-skipped). The human-artifact CLI diagnostic and two clean-target-draft
  State failures reproduce independently in files untouched by C4; they remain
  non-C4 full-sweep blockers and are not hidden or changed here.
- 2026-08-11 - Remaining 5.2 checks passed: `openspec validate
  land-page-class-and-layout-config --strict` passed; `openspec validate --all
  --strict` passed 29/29 items; `node
  ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs --self-check`
  reported a self-consistent render tree, whitelist, and init; and `git diff
  --check` returned no whitespace errors. No production Run Bundle or research
  input was read, modified, or used as a fixture. The only unmet criterion is
  the independently reproducing non-C4 full-sweep baseline failures above.

## Execution Log

- 2026-08-11 - In progress: task group 1 and the resolver prerequisite. The
  source parser now recognizes `PAGE CLASS` and no longer writes the retired
  Framed selector; Page Image Core's Framed header policy has the matching
  selector-free shape; Run-Bundle layout work has begun for the four-document
  presentation package. This is intentionally not checked off yet: the package
  resolver, adapter cutover, and focused temporary-bundle verification have not
  run. The next log entry will record either that verification or its bounded
  recovery.
- 2026-08-11 - Verified 1.1. Page Source now stores normalized `page_class` in
  each receipt and supplies it to the trusted resolver context; source-focused
  tests passed. Task 1.2 remains in progress: `FRAME PRESET` is rejected at
  the parser, but the old selector still has active Framed/Pure adapter,
  template, guidance, and test ownership to remove in the clean cutover.
- 2026-08-11 - Resolver slice verified but not yet task-complete. Both workflow
  entry parsers now attach one class/workflow projection to the trusted visual
  selection. The next slice replaces the adapters' current deck-wide Pure and
  hard-coded Framed profile assumptions with that per-page projection; until
  then no resolver or adapter checkbox is claimed.
- 2026-08-11 - Verified 1.3. The canonical presentation directory now has four
  exact files under both backbone and version override layout; init seeds the
  complete package and `new-version` retains only canonical source/overrides.
  No production Run Bundle was read or changed.
- 2026-08-11 - Verified 1.4. Schema-stage owners now name the parser, layout
  owner, resolver, Core, and adapters that actually produce/consume Page Class
  and per-page presentation bindings. The retired selector and Pure's former
  visual-language inventory membership are removed.
- 2026-08-11 - Verified 2.1, 2.2, and 2.3. The resolver loads only four
  confined override-first/backbone-default sources, validates the whole
  package, returns immutable workflow-isolated class projections with selected
  binding/provenance, and validates every sibling. Pure now parses only the
  selected unversioned profile inside that package; no old source loader or
  revision reader remains.
- 2026-08-11 - Verified 2.4. The former Framed `standard` overlay is seeded
  in the canonical default profile and reaches the deterministic local renderer
  only through the resolver-selected projection. Render-profile and browser
  contract coverage prove its font, capture, geometry and protected-region
  behavior; the old caller-selectable preset path is gone.
- 2026-08-11 - Verified 3.1. Page Image Core carries the trusted resolved
  projection and canonical per-page binding into each adapter. The Pure adapter
  consumes only its selected whole-page profile, while Framed consumes only
  allowed header, local-overlay, and protected-region facts from that page's
  selected Framed profile.
- 2026-08-11 - Verified 3.2. The immutable raw-plan binding carries each
  normalized page's selected presentation digest alongside its class/profile
  lineage. Framed raw contracts bind that same selected presentation before
  they are planned, and the candidate path validates its own resolved
  profile/geometry before later raw media or Complete Page Review can be
  reused. No C5 page record, duplicate header data, or durable control state
  was introduced.
- 2026-08-11 - Verified 3.3. Framed raw-review contribution, ordinary and
  progressive plan proof, and header composition operate on each ordered page's
  resolved profile/guide. A single existing review decision remains bound to
  heterogeneous but attributable page evidence; no review-wide profile field
  or durable proof record was added.
- 2026-08-11 - Verified 3.4. Invalidation compares the resolved per-page
  binding, so selected class/default/profile/workflow drift routes to the
  existing raw rebuild and a new Complete Page Review. Package validation
  remains before the pure evaluator; valid unselected siblings have no selected
  binding drift, and malformed siblings stop without a refresh or lifecycle
  mutation. Framed local refresh remains legal only when all existing bindings
  match exactly.
- 2026-08-11 - Verified 1.2. `FRAME PRESET` is absent from active page grammar,
  receipts, templates, source consumers, and user-facing repair guidance. It
  remains only as an isolated negative parser fixture that receives the
  unsupported-current-field diagnostic; no reader, translation, migration, or
  dual selection path remains.
- 2026-08-11 - Verified 3.5. Current authoring and refresh guidance treats a
  potentially better Page Class as an Agent recommendation, never a parser
  inference, blocking prompt, confirmation, or gate. Missing/malformed package
  facts return to direct source repair and the same planning checkpoint without
  a new Controller route or review.
- 2026-08-11 - Verified 4.1. Unit coverage proves the closed Page Class parser
  and four-file resolver accept only current direct source shapes, carry
  selected provenance/binding facts deterministically, and reject invalid
  source/configuration before a receipt, raw-plan, generated artifact, or
  wrong-owner mutation.
- 2026-08-11 - Verified 4.2. Core and adapters cover standard and special
  classes in both workflows, immutable selected binding/projection drift, and
  the exact-all-bindings Framed refresh rule. A mixed Framed raw plan, browser
  proof, and partial Pilot review retain each page's own profile/guide lineage
  under one decision; a single stale proof or malformed sibling stops before
  materialization or lifecycle mutation.
- 2026-08-11 - Verified 4.3. Temporary-bundle integration covers package init,
  layout validation, clean successor behavior, and schema/inventory conformance.
  It confirms C4 only resolves in memory: it creates neither C5-derived files
  nor provider/review work, and reads or changes no production Run Bundle.
- 2026-08-11 - Verified 4.4. The selected Framed mock E2E journey covers Page
  Source through resolver and adapter, selected Page Class drift to raw rebuild
  and Complete Page Review, and the later provider-free notes-only refresh.
  It used only a temporary Run Bundle and mock provider.
- 2026-08-11 - Verified 4.5. Architecture and lexical tests prove the clean
  C4 cutover has no active legacy selector, old Pure contract shape, revision
  marker, hard-coded caller-selected overlay, or planned C4 producer. The
  isolated Page Source rejection fixture is the only retained old-field text.
- 2026-08-11 - Verified 5.1. The complete focused C4 suite and selected mock
  E2E are green. No production Run Bundle or research input was read, modified,
  or used as a fixture.
- 2026-08-11 - 5.2 verification is in progress. Core development verification
  passed; no completion checkbox is claimed until every required repository,
  specification, layout, and diff check has passed.

## 1. Canonical Source And Layout Cutover

- [x] 1.1 [content-parsing] Extend Page Source parsing and receipt normalization
  with the optional closed `PAGE CLASS` field; omit-to-`standard` must be silent,
  while unknown/repeated/malformed values stop before receipt creation.
- [x] 1.2 [content-parsing] Remove `FRAME PRESET` from active page grammar,
  receipts, templates, guidance, and source consumers. Reject it as an unsupported
  current field without translation, legacy reader, or migration path.
- [x] 1.3 [run-bundle-layout, run-bundle-management] Add the canonical
  `visual-style/page-image-presentation/` source package and matching
  version-override paths to the layout owner; seed all four valid unversioned
  schema-declared default documents during init and preserve `new-version`'s
  clean evidence boundary.
- [x] 1.4 [harness-directory-layout] Materialize C4's `page_class`,
  `layout-config`, and `page-layout` schema/inventory owners with current
  executable anchors, direct inputs/outputs, provenance, and invalidation
  language. Declare all four presentation source contracts under `layout-config`,
  move Pure out of visual-language, and remove `framed_header_preset`; leave no
  planned producer, revision/version marker, or obsolete selector ownership.

## 2. Presentation Package Resolver

- [x] 2.1 [visual-config] Implement one confined, override-first/backbone-default
  loader for the four exact source files. Validate them together with closed
  document shapes, class/profile bindings, file confinement, and bounded direct
  source/configuration diagnostics; no partial YAML merge or generated fallback.
- [x] 2.2 [visual-config] Implement immutable deterministic per-page resolution
  from normalized class and selected workflow. Return exactly one isolated Pure
  or Framed projection with selected profile ID, resolved values, per-value
  provenance, and canonical binding digests. Before Framed adapter input, reject
  a non-null source header literal not permitted by the selected profile; never
  omit it, make it provider-visible, or infer another class.
- [x] 2.3 [visual-config] Move the existing Pure deck visual-system parser behind
  the presentation package while keeping `pure-deck-visual-system.yaml` Pure-only
  and its digest forbidden to Framed. Reject cross-workflow fields and content,
  prompt, geometry-override, evidence, or state ingress in every source file;
  remove the old Pure source shape and revision parser without a reader or conversion.
- [x] 2.4 [visual-config] Seed the current hard-coded Framed `standard` overlay
  as the default Framed profile, then delete hard-coded caller-selectable preset
  selection. Preserve deterministic local fit/protected-region behavior through
  resolved profile data only.

## 3. Core, Adapter, And Lifecycle Binding

- [x] 3.1 [image-generation] Pass the resolved projection through Page Image Core
  into both adapters. Framed must consume only allowed header/local-overlay/
  protected-region facts; Pure must consume only its whole-page profile; neither
  accepts a caller profile or the other workflow's facts.
- [x] 3.2 [image-generation] Bind normalized class, selected profile, provenance,
  and projection digest into the existing immutable raw contract/input lineage.
  Validate each Framed raw contract against its page's own selected profile;
  a projection mismatch cannot reuse prior raw media or Complete Page Review.
  Do not publish any C5 per-page file, duplicate header JSON, or new
  state/approval record.
- [x] 3.3 [image-generation] Update Framed raw-review contribution assembly to
  retain each stable page's selected profile digest and protected-region guide
  without requiring all pages in one complete/Pilot review to share a profile.
  Remove the same global-profile assumption from ordinary/progressive raw-plan
  browser proof and header-contract batch composition: exact ordered per-page
  profile/guide proof must gate materialization, while one existing review
  decision and exact per-page lineage remain. Add no review-wide profile field,
  second publisher, or durable proof record.
- [x] 3.4 [pipeline-orchestration] Extend the existing pure invalidation evaluator
  to compare resolved bindings: class, selected default, selected profile, and
  workflow drift require existing raw rebuild and a new complete-page review;
  a valid unselected sibling class/profile leaves the page current. A malformed
  sibling must hard-stop package evaluation without mutating existing evidence or
  emitting a rebuild/refresh/authorization/review. Keep local Framed refresh
  legal only when every existing binding remains equal.
- [x] 3.5 [playbook/guidance] Update current authoring and refresh guidance to
  present a potentially better Page Class as an Agent recommendation, not a
  blocking prompt; point malformed package failures to the direct source repair
  and same planning checkpoint without adding a Controller or gate.

## 4. Focused Test Coverage

- [x] 4.1 [content-parsing, visual-config] Add unit coverage for omitted/valid/
  invalid Page Class, removed Frame Preset, four-file grammar, override
  confinement, cross-file mismatch, workflow isolation, provenance, stable
  resolver digests, and title-only-profile/source-subtitle mismatch. Prove each
  invalid source short-circuits before receipt, raw-plan, generated-file, or
  wrong-owner mutation.
- [x] 4.2 [image-generation, pipeline-orchestration] Add core/adapter and
  invalidation tests for standard and special classes in both workflows, selected
  default/profile drift, unselected sibling edits, projection mismatch, and the
  all-bindings-equal Framed refresh condition. Add a mixed-Framed-class
  raw-plan/browser-proof/complete-Pilot-review case that preserves per-page
  guide/profile lineage and one decision. Prove a one-page stale proof mismatch
  short-circuits before any materialization and a malformed unselected sibling
  short-circuits at package validation without lifecycle mutation. Assert
  selected drift routes to raw rebuild plus a new Complete Page Review.
- [x] 4.3 [run-bundle-layout, run-bundle-management, harness-directory-layout]
  Add synthetic temporary-bundle integration coverage for init/layout/new-version,
  package validation, schema/inventory conformance, and the absence of C5 derived
  files, provider work, review records, or migrated production data.
- [x] 4.4 [image-generation] Extend one selected mock E2E Page Image Workflow
  journey from Page Source through resolver and adapter to the existing
  raw-rebuild/review route after a selected class/profile edit. Use only mock
  provider and temporary fixtures; do not select a paid or real-provider flow.
- [x] 4.5 [clean cutover] Add/refresh architecture and lexical tests proving
  active Harness source has no `FRAME PRESET` control path, no hard-coded
  caller-selected overlay or `framed_header_preset` selector, no old Pure source
  location/shape or revision marker, and no C4 producer left marked planned.
  Verify the four declared source contracts are grouped under `layout-config`
  rather than visual language. Keep explicit negative-test fixtures separate
  from active source ownership.

## 5. Validate And Record Evidence

- [x] 5.1 Run the focused source/config/layout/core/adapter/invalidation suites
  and the selected mock E2E suite. Record exact commands/results here; on a
  failure, record the bounded cause and same-check recovery before continuing.
- [ ] 5.2 Run `npm test`, `npm run test:sweep`, `openspec validate
  land-page-class-and-layout-config --strict`, `openspec validate --all --strict`,
  the Run Bundle layout self-check, and `git diff --check`. Record results and
  confirm no production Run Bundle or research input was read, modified, or used
  as a fixture.
