## 1. Source, Visual Language, And Identity Contracts

- [x] 1.1 [content-parsing] Extend the canonical production-marker parser for the closed `page-authority-image2-v1` mapping, then implement the per-slide authority resolver, single-preset Framed normalization, exact closed `VISUAL BRIEF`/identity/constraint grammar, typed Text Frame receipt, and source-span diagnostics; reject legacy prompt/render ingress for this marker.
- [x] 1.2 [visual-config] Implement `page-authority-visual-language.yaml`, selected-record/edge-only digest semantics, compatibility resolution, and the exact deterministic `page-authority-text-guard-v1` grammar with negative parser coverage.
- [x] 1.3 [visual-config] Implement the `standard-v1` Framed Text Frame preset and deterministic preflight-fit evidence; prove overflow blocks provider authorization.
- [x] 1.4 [visual-asset-management] Promote the verified v1 Amber model sheet (`f71a…c756`) into `deck_ai_sdlc_keynote/2_backbone/visual-style/assets/reference/amber-agent/model-sheet.png`; implement the closed `image2-reference-material.yaml` registry, registered clean role derivatives, SHA/restriction/text-guard resolution, and direct-model-sheet/HTML-catalog rejection.
- [x] 1.5 [style-master-generation] Separate source-owned raw image-contract inputs from provider-owned raw generation-profile inputs and bind the effective style-master byte profile.
- [x] 1.6 [tests] Add focused source/registry/reference/profile tests for invalid syntax, free/quoted visual-brief prose and YAML indirection rejection, Image2-reference registry confinement, exact text-guard character/token/pair rejection, selected-only invalidation, compatibility, authority contradictions, checksum drift, and the explicit Pure choice for readable body semantics.

## 2. Protocol State, Layout, And New-Deck Initialization

- [x] 2.1 [node-specification] Extend the sole `production_mode.mjs` policy table and state validation with `image2-page-authority` / `page-authority-image2-v1`; make its exact version record `{ mode, source_epoch }`, add authorization/raw-review references and bounded repair diagnostics without copying policy in CLI or Controller code.
- [x] 2.2 [run-bundle-layout] Declare canonical Page Authority source, receipt, raw, review, final-manifest, and projection locations; retain rebuildable `_generated/` ownership.
- [x] 2.3 [run-bundle-management] Make fresh init seed only the Page Authority source/state pair with `source_epoch: 1` and the `framed-image2` default; reject legacy init selection without writing a bundle.
- [x] 2.4 [node-specification, pipeline-orchestration, header-lock] Preserve existing legacy dispatch for already-marked runs during this change; make the whole-page adapter the only invoker of legacy Stage 3 and prove a Page Authority source/state pair cannot enter Header-Lock, another legacy adapter, or a generated-artifact-derived route.
- [x] 2.5 [tests] Add state/layout/init coverage for exact `{ mode, source_epoch }` version records, mode/source drift short-circuiting, write-bounded init, and Page Authority derived-artifact rebuildability.

## 3. Raw Image Production And Human Evidence

- [x] 3.1 [image-generation] Implement receipt-only Page Authority raw compilation, exact scoped provider authorization, and provider-free preview/validation/reuse paths.
- [x] 3.2 [image-generation] Emit and validate raw manifests keyed by `{slide_id, raw_sha256, raw_image_contract_digest, raw_generation_profile_digest}`; implement source/profile invalidation rules.
- [x] 3.3 [image-generation] Build version-scoped non-publishing raw-review projections and `proceed|repair|redirect` coverage records bound to actual PNG SHA-256, canonical renderer profile, lexical raw tuples, and source epoch; distinguish current reviewable evidence as a human `confirm` action from missing/partial/stale/mismatched evidence as a hard-stop before finalization.
- [x] 3.4 [tests] Add provider-bound integration tests for canonical payload order, Framed text exclusion, authorization short-circuiting, raw-review PNG/profile freshness, profile drift, partial/stale review rejection, and zero-submit behavior.

## 4. Finalization, Delivery, And Refresh

- [x] 4.1 [image-production] Implement the `page-authority-image2` adapter and the sole `finalizePage(...)` Interface for Pure pass-through and Framed composition.
- [x] 4.2 [html-render-runtime] Implement the private Framed composition runtime with fixed viewport, font wait, denied network, opaque panels, bounds/PNG verification, cleanup, and no legacy artifact access.
- [x] 4.3 [pipeline-orchestration] Implement the receipt -> raw -> raw review -> final manifest -> projection -> assembly -> notes -> delivery lifecycle and ownership-based Pure/Framed refresh routing.
- [x] 4.4 [pptx-assembly] Consume only verified Page Authority final-manifest entries and preserve resolved stable-slide ordering.
- [x] 4.5 [notes-injection] Bind notes injection and receipt validation to Page Authority assembly/final-manifest lineage.
- [x] 4.6 [tests] Add finalizer and pipeline tests for one external finalization seam, nonblank/dimension/font/network invariants, Framed local refresh, Pure raw invalidation, and final/PPTX/notes lineage.
- [x] 4.7 [slide-identity-and-ordering, node-specification, image-generation, run-bundle-layout, pipeline-orchestration] Extend the existing preview/hash/CAS structural transaction for Page Authority: classify exact reusable raw tuples or `needs_raw_generation`, initialize target epoch `1`, atomically materialize only byte-verified target-owned `unreviewed` raw provenance, and copy no review/final/delivery/authorization state or provider work.
- [x] 4.8 [tests] Add structural preview/apply coverage for a mixed Page Authority vNext: plan-bound raw materialization, corrupt-source rejection, target-local raw debt, no inherited human acceptance, and zero provider calls.

## 5. Readiness, CLI, Controller, And Documentation

- [x] 5.1 [environment-check] Add operation-scoped `framed-runtime` and `image2-raw` doctor profiles, with explicit live probing and source/state-first diagnostics.
- [x] 5.2 [cli-surface] Add receipt-bound Page Authority commands, new-init default, legacy-init rejection, and secret-safe producer diagnostics; fence direct prompt/style/output/legacy-artifact overrides.
- [x] 5.3 [playbook-execution] Add the Page Authority create/iterate lifecycle, scoped human authorization and raw/delivery review `confirm` gates, and one direct recovery action for every hard-stop.
- [x] 5.4 [workflow-inspection] Extend the controller-reader vocabulary and the sole read-only projection for the Page Authority pipeline; hash and order only direct Page Authority prerequisites and prove it never substitutes HTML review, Image2 refinement, or Header-Lock for the exact source/state pair.
- [x] 5.5 [commands-reference, bootstrap-env-guidance] Rewrite new-deck and BOOTSTRAP guidance around Pure/Framed ownership, unbound Page Authority readiness, and later operation-scoped credentials; remove legacy production choices from new-deck routing while retaining them only for explicitly targeted existing runs.
- [x] 5.6 [tests] Add CLI/Controller/doctor/BOOTSTRAP/inspection coverage distinguishing review/authorization confirms from invalid evidence or unauthorized-submit hard-stops, plus invalid identity, runtime-only refresh without provider credentials, legacy-stage exclusion, and bounded recovery diagnostics.

## 6. End-To-End Verification And Completion

- [x] 6.1 [tests_e2e] Add a fresh mixed Pure/Framed deck journey covering init, provider-free validation, authorized raw generation, raw review, finalization, PPTX, notes, and delivery decision.
- [x] 6.2 [tests_e2e] Add refresh journeys proving Framed Text Frame edits are provider-free and Pure display edits require new raw evidence and review.
- [x] 6.3 [tests_e2e] Add a Page Authority structural vNext journey proving plan-bound zero-submit raw materialization, target re-review, and finalization only after the target accepts current raw evidence.
- [x] 6.4 [tests] Classify or repair the pre-existing full-suite baseline at a recorded code checkpoint; do not attribute unrelated failures to Page Authority.
- [x] 6.5 Run focused tests, affected integration/E2E tests, `npm test`, the full suite, and `openspec validate introduce-page-authority-image2 --strict`; record any remaining baseline exclusion with owner and follow-up.
- [x] 6.6 Review the implemented main-spec delta and public help/playbook output to confirm that new decks expose only Page Authority, while existing legacy markers retain bounded interim dispatch for Change 2.
