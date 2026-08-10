## 1. Establish The V2-Only Protocol Boundary

- [ ] 1.1 [content-parsing, run-bundle-management, node-specification] Replace
  source marker, receipt, State mode, initialization, and clean-successor
  construction with the exact V2 source/state pair and one version workflow;
  prove a fresh source waits for an explicit `framed|pure` choice before
  provider work.
- [ ] 1.2 [workflow-inspection, pipeline-orchestration, image-production]
  Implement one marker-first V2 evaluator and route every Page Image operation,
  finalization, and delivery projection through only its selected workflow
  owner. A non-V2/partial/hybrid/mismatched pair must hard-stop before any
  receipt, State, generated-artifact, adapter, or provider read/write.
- [ ] 1.3 [cli-surface, playbook-execution, commands-reference,
  harness-charter, bootstrap-env-guidance] Update CLI dispatch, diagnostic
  producer use, Controller/playbook handoff, and all active guidance to name
  only V2. Preserve one bounded `unsupported-protocol/export` action without
  an alternate command, fallback, or controller node.
- [ ] 1.4 [slide-identity-and-ordering, style-master-generation,
  image-generation] Bind structural previews, State activation, Style Master,
  raw plans, grants, review, final evidence, and delivery to V2 lineage while
  preserving exact-plan and fresh-evidence invariants.
- [ ] 1.5 [all V2 protocol capabilities] Delete obsolete protocol constants,
  parsers, state branches, dispatch registrations, imports, writers, fixtures,
  guidance, and tests only after their retained invariant has a V2/shared
  owner. Add an active-root audit excluding OpenSpec archives that fails on an
  executable, importable, selectable, or documented obsolete protocol route.

## 2. Layout And Presentation Sources

- [ ] 2.1 [run-bundle-layout, run-bundle-management] Add canonical constants,
  confined override/backbone selection, generated Data View paths, and valid
  V2 four-file presentation-package seeds. Layout inspection remains
  observational and must not seed, infer, or route from generated evidence.
- [ ] 2.2 [page-image-presentation] Implement a deep resolver for strict
  package parsing, cross-file references, baseline/profile inheritance,
  workflow-isolated projections, and canonical package/selected-presentation
  digests.
- [ ] 2.3 [content-parsing, page-image-presentation] Parse closed optional
  `PAGE CLASS` with explicit/defaulted provenance; reject redundant `standard`,
  invalid or duplicate values, `FRAME PRESET`, and slide-level workflow/layout
  escape hatches before receipt publication.
- [ ] 2.4 [page-image-presentation, visual-config] Materialize the initial V2
  mapping: all classes use existing Pure `baseline`; Framed `standard`,
  `transition`, and `closing` use `standard`; Framed `opening` uses
  `opening-title-only`. Preserve existing baseline/header facts and validate
  fields, geometry, fonts, colour, density, zones, and profile references
  without local body ownership or arbitrary source paths.

## 3. V2 Planning And Rendering Semantics

- [ ] 3.1 [visual-config, image-generation] Resolve selected presentation
  while the V2 receipt is still a candidate, before source-epoch advancement;
  pass only the selected workflow projection to Core and its adapter, and map
  identity/package/class failures to the existing source/configuration repair
  diagnostic.
- [ ] 3.2 [image-generation] Extend Core facts, raw contracts, compiled
  provider-input bindings, grants, attempts, review, and final evidence with
  the selected presentation digest. Prove class, baseline, and selected-profile
  edits rebuild raw while an unselected profile does not stale another page.
- [ ] 3.3 [image-generation, visual-config] Refactor Pure and Framed compilers
  to produce one structured non-secret controller before exact compiled bytes;
  derive deterministic Framed Header HTML through the overlay contract without
  a provider underlay or second Header Controller JSON.
- [ ] 3.4 [image-generation] Add focused negative coverage for invalid Header
  Profile body/callout ownership, absent selected profiles, and invalid source
  facts. Each must short-circuit before provider initialization, State mutation,
  or transport submission and return its owner-issued repair action.

## 4. Pre-Production Data View And CLI

- [ ] 4.1 [image-generation] Implement an atomic provider-free Data View
  writer consuming only matching V2 receipt, resolved-presentation, raw-plan
  binding, and controller facts; it must not read/write State or create a
  lifecycle transition.
- [ ] 4.2 [image-generation] Publish independent per-slide receipt, resolved
  presentation, Image2 controller, and Framed Header HTML files plus an
  index-only Presentation Control Map with schema IDs, direct bindings,
  selected digests, scopes, and raw/review impact paths, without raw prompt
  prose, credentials, or provider responses.
- [ ] 4.3 [image-generation, cli-surface] Invoke the writer after adapter
  compilation and before the public plan projection. Add the safe run-relative
  Data View locator to successful V2 `image2 plan` JSON without changing
  command forms, selectors, Task Mandate behavior, or diagnostic ownership.
- [ ] 4.4 [image-generation, cli-surface] Test path safety, binding checks,
  idempotent replacement, stale-locator rejection, provider/grant/review
  isolation, State-free writer execution, and bounded source-repair diagnostics.

## 5. Proof And Documentation

- [ ] 5.1 [all affected capabilities] Update source guidance, controller
  manifest/playbooks, root/Harness documentation, and all accepted main specs
  from their synchronized deltas so V2 is the only current route. Do not turn
  archived protocol history into active guidance.
- [ ] 5.2 [tests, tests_e2e] Convert protocol fixtures to V2 and run focused
  parser, evaluator, State, inspection, structural, Style Master, Core,
  adapter, binding, layout, target-runtime, delivery, and CLI coverage. Add
  V2 Pure/Framed mocked end-to-end planning journeys and a no-write non-V2
  hard-stop journey; use no production deck or real provider endpoint.
- [ ] 5.3 Run `npm test`, `openspec validate
  introduce-page-image-presentation-system --strict`, `openspec validate --all
  --strict`, and `git diff --check`; reconcile implementation and every change
  artifact before archive consideration.
