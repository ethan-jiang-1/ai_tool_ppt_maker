## 1. Source, Visual Language, And Identity Contracts

- [ ] 1.1 [content-parsing] Implement the closed `page-authority-image2-v1` source grammar, authority resolver, typed Text Frame/visual-brief receipt, and source-span diagnostics; reject legacy prompt/render ingress for this marker.
- [ ] 1.2 [visual-config] Implement `page-authority-visual-language.yaml`, compatibility resolution, selected-language digest, and deterministic `page-authority-text-guard-v1` with negative parser coverage.
- [ ] 1.3 [visual-config] Implement the `standard-v1` Framed Text Frame preset and deterministic preflight-fit evidence; prove overflow blocks provider authorization.
- [ ] 1.4 [visual-asset-management] Promote the verified v1 Amber model sheet (`f71a…c756`) into `deck_ai_sdlc_keynote/2_backbone/visual-style/assets/reference/amber-agent/model-sheet.png`; add registered clean role derivatives, SHA-bound resolution, and direct-model-sheet rejection.
- [ ] 1.5 [style-master-generation] Separate source-owned raw image-contract inputs from provider-owned raw generation-profile inputs and bind the effective style-master byte profile.
- [ ] 1.6 [tests] Add focused source/registry/reference/profile tests for invalid syntax, text-bearing clauses, compatibility, local invalidation, authority contradictions, checksum drift, and the explicit Pure choice for readable body semantics.

## 2. Protocol State, Layout, And New-Deck Initialization

- [ ] 2.1 [node-specification] Add `image2-page-authority` state/source-pair validation, source epoch ownership, authorization scope, raw-review references, and bounded repair diagnostics.
- [ ] 2.2 [run-bundle-layout] Declare canonical Page Authority source, receipt, raw, review, final-manifest, and projection locations; retain rebuildable `_generated/` ownership.
- [ ] 2.3 [run-bundle-management] Make fresh init seed only the Page Authority source/state pair and `framed-image2` default; reject legacy init selection without writing a bundle.
- [ ] 2.4 [node-specification, pipeline-orchestration] Preserve existing legacy dispatch for already-marked runs during this change, while proving a Page Authority run cannot enter any legacy adapter or infer a route from generated artifacts.
- [ ] 2.5 [tests] Add state/layout/init coverage for exact version resolution, mode/source drift short-circuiting, write-bounded init, and Page Authority derived-artifact rebuildability.

## 3. Raw Image Production And Human Evidence

- [ ] 3.1 [image-generation] Implement receipt-only Page Authority raw compilation, exact scoped provider authorization, and provider-free preview/validation/reuse paths.
- [ ] 3.2 [image-generation] Emit and validate raw manifests keyed by `{slide_id, raw_sha256, raw_image_contract_digest, raw_generation_profile_digest}`; implement source/profile invalidation rules.
- [ ] 3.3 [image-generation] Build raw-review projections and `proceed|repair|redirect` coverage records; require exact tuple, projection/profile, and epoch freshness before finalization.
- [ ] 3.4 [tests] Add provider-bound integration tests for canonical payload order, Framed text exclusion, authorization short-circuiting, profile drift, partial/stale review rejection, and zero-submit behavior.

## 4. Finalization, Delivery, And Refresh

- [ ] 4.1 [image-production] Implement the `page-authority-image2` adapter and the sole `finalizePage(...)` Interface for Pure pass-through and Framed composition.
- [ ] 4.2 [html-render-runtime] Implement the private Framed composition runtime with fixed viewport, font wait, denied network, opaque panels, bounds/PNG verification, cleanup, and no legacy artifact access.
- [ ] 4.3 [pipeline-orchestration] Implement the receipt -> raw -> raw review -> final manifest -> projection -> assembly -> notes -> delivery lifecycle and ownership-based Pure/Framed refresh routing.
- [ ] 4.4 [pptx-assembly] Consume only verified Page Authority final-manifest entries and preserve resolved stable-slide ordering.
- [ ] 4.5 [notes-injection] Bind notes injection and receipt validation to Page Authority assembly/final-manifest lineage.
- [ ] 4.6 [tests] Add finalizer and pipeline tests for one external finalization seam, nonblank/dimension/font/network invariants, Framed local refresh, Pure raw invalidation, and final/PPTX/notes lineage.

## 5. Readiness, CLI, Controller, And Documentation

- [ ] 5.1 [environment-check] Add operation-scoped `framed-runtime` and `image2-raw` doctor profiles, with explicit live probing and source/state-first diagnostics.
- [ ] 5.2 [cli-surface] Add receipt-bound Page Authority commands, new-init default, legacy-init rejection, and secret-safe producer diagnostics; fence direct prompt/style/output/legacy-artifact overrides.
- [ ] 5.3 [playbook-execution] Add the Page Authority create/iterate lifecycle, scoped authorization handoff, human raw/delivery review decisions, and one direct recovery action for every hard-stop.
- [ ] 5.4 [commands-reference] Rewrite new-deck guidance around Pure/Framed ownership and remove legacy production choices from new-deck routing.
- [ ] 5.5 [tests] Add CLI/Controller/doctor negative coverage for unauthorized work, invalid identity, missing review coverage, runtime-only refresh without provider credentials, and bounded recovery diagnostics.

## 6. End-To-End Verification And Completion

- [ ] 6.1 [tests_e2e] Add a fresh mixed Pure/Framed deck journey covering init, provider-free validation, authorized raw generation, raw review, finalization, PPTX, notes, and delivery decision.
- [ ] 6.2 [tests_e2e] Add refresh journeys proving Framed Text Frame edits are provider-free and Pure display edits require new raw evidence and review.
- [ ] 6.3 [tests] Classify or repair the pre-existing full-suite baseline at a recorded code checkpoint; do not attribute unrelated failures to Page Authority.
- [ ] 6.4 Run focused tests, affected integration/E2E tests, `npm test`, the full suite, and `openspec validate introduce-page-authority-image2 --strict`; record any remaining baseline exclusion with owner and follow-up.
- [ ] 6.5 Review the implemented main-spec delta and public help/playbook output to confirm that new decks expose only Page Authority, while existing legacy markers retain bounded interim dispatch for Change 2.
