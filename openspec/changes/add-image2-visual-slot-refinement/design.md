## Context

Change 3 delivered complete local HTML decks and Change 4 established a reserved, empty Phase-4 owner. The product needs an optional professional upgrade without turning Image2 into a second page renderer or making provider setup part of normal creation. The workflow remains MD-first: the controller/Agent recommends and obtains a human cost/visual decision; Phase 4 owns deterministic plan validation, receipts, transport boundaries, persistence, and diagnostics.

The critical integrity boundary is between version source (`slide-specifications.md` and `overrides/`) and rebuildable evidence under `_generated/`. Accepted pixels must survive derived-artifact deletion as version source assets; candidates, attempts, and comparison pages must not become upstream material or silently become current delivery.

## Goals / Non-Goals

**Goals:**

- Add a cost-safe, exactly-scoped Phase-4 lifecycle after current HTML delivery.
- Keep one visual slot and one first-round candidate per selected slide, with independent human adopt/keep-HTML decisions.
- Make submit, provider ambiguity, style-reference setup, promotion, and cleanup crash-recoverable without duplicate chargeable submission.
- Recompose accepted assets locally through Phase 3 while retaining the ordinary HTML build/provider-free closure.
- Make modern refinement and markerless legacy whole-page Image2 mutually inaccessible.

**Non-Goals:**

- A new renderer selection, whole-page generation, multiple slots, automatic retry, or native editable PPT objects.
- Replacing Phase-5 legacy contracts, inferring user authorization, or mutating a deck's `_generated/` by hand.
- A second controller/state/asset authority outside playbooks, shared state, and bundle-layout ownership.

## Decisions

### 1. Phase 4 is a narrow public capability

`scripts/04-image2-refinement/index.mjs` is the only modern refinement interface. Its private transport adapter is injectable and owns provider credentials and submission; its public operations accept canonical run/version identifiers and typed user-approved plan inputs, not arbitrary file paths or provider payloads. `ppt_flow image2` is the sole user command family; Phase 4 adds no standalone executable.

This prevents a Phase-3 build or shared module from acquiring provider knowledge. Reusing Phase 5 was rejected because its whole-page prompts, render modes, artifacts, and legacy prerequisites would make new-deck semantics ambiguous.

### 2. A plan is the sole cost boundary

Phase 4 derives an immutable plan only from a current `html-delivery-review: proceed`, selected slide IDs, one declared slot per slide, current style-reference status, profile, and expected setup/page attempt count. The Agent presents recommendations and total count; the human authorizes one exact plan hash. The plan hash is deterministic and excludes random execution identity; one accepted authorization atomically creates a single-use random authorization ID and its attempt IDs. Any added slide, changed prerequisite/profile, retry, stale source/selection, or stale plan requires a new plan and authorization.

Attempt records move `planned -> submitting -> submitted|failed|unknown-submit`. A crash after `submitting` never permits blind resubmission: reconciliation requires provider-safe evidence keyed by the persisted attempt ID; lacking proof produces `unknown-submit`, where a human can retain a reconciled result or abandon the attempt. Abandoning is terminal and replacement requires a new plan/authorization. This favors bounded cost over automatic liveness.

### 3. Candidate evidence is derived; acceptance is a source transaction

Candidate bytes, SHA, prompt/profile receipt, and comparison preview live in version-owned `_generated/image2_refinement/`. The comparison preview SHALL be a Phase-3 local composition that places the candidate in the same resolved HTML slot geometry/crop as an eventual accepted asset, but it is review-only and cannot become current delivery. Review state refers to immutable candidate identities and is separate from HTML content/visual/delivery gates. `accept` first rejects an active gate-approval journal or pending HTML-production reset, then uses a write-ahead journal in `_scratch/image2_refinement/`: validate candidate/SHA and selection applicability; bind old/new hashes for source provenance, asset manifest, slide specifications, and state; atomically write the asset into `overrides/visual-style/assets/refined/image2/visual-slots/`; update source selection binding and the dedicated `overrides/visual-style/image2-refinement.yaml` provenance; then complete the expected-state-CAS state/local-recomposition transition. Recovery waits for state fences to clear and only completes the exact bound transaction or fails closed. This visual source change stales the former delivery review and requires current final review before the deck is again complete. `use-html` records the per-page fallback decision without deleting candidates.

The accepted asset is source because a clean rebuild must not call the provider. Copying candidate bytes directly into a current manifest or upstream material was rejected because it loses ownership and makes clean rebuild or rollback ambiguous.

### 4. Style reference is an explicit source prerequisite

A style-reference setup call is represented as a separately counted plan attempt. On success, its bytes/provenance become a version source reference under `overrides/.../style-reference/`; page attempts may depend only on a current, intact binding. A stale reference expands the next plan; failed or unknown setup blocks dependent page submissions. Provider profile and setup provenance influence future candidate generation but do not retroactively invalidate accepted pixels.

### 5. Existing selection and asset contracts remain the sole render authority

Phase 4 SHALL use the existing `primary_visual.selection {asset_id, accepted_for, output_sha256}` and v2 asset manifest without extending either schema. Existing Phase-2 resolution remains authoritative: a current accepted binding selects the image; a semantically stale binding visibly falls back to HTML; a missing/unregistered/SHA-mismatched accepted asset is `broken` and blocks publication. Phase 4 coordinates source promotion but does not parse/write either closed schema: Phase 2 exposes a bounded asset-registration transaction and Phase 3 exposes a bounded selection-binding transaction. Refinement-specific provider/profile/attempt provenance is an adjacent version-source record owned by Phase 4, not a manifest field or renderer input. Phase 3 consumes the public resolved result and recomposes locally; Phase 4 never writes final-slide manifests directly.

### 6. Candidate comparison crosses Phase 3 as verified values, never Phase-4 paths

Existing Phase-3 composition can render only source/catalog assets, so it cannot make an honest pre-promotion comparison by itself. Phase 3 therefore gains one public review-only operation accepting a bounded verified candidate value: stable candidate ID, byte SHA, in-memory raster bytes/media evidence, and the semantic slide/slot identity. It rejects paths, manifests, provider fields, arbitrary geometry, and delivery publication. Phase 4 validates/loads its own candidate then supplies that value; Phase 3 resolves the existing source geometry and emits review-only artifacts. Thus Phase 3 imports no Phase-4 module or directory, Phase 4 imports no renderer private module, and the candidate cannot enter an effective/delivery manifest before source promotion.

### 7. Lifecycle and migration are explicit

Only a marked HTML-first run with current `html-delivery-review: proceed` may enter the optional `image2-refine` controller. Declining leaves no plan, directory, authorization, or pending node. vNext copies source/control material and re-evaluates selection/style-reference applicability but does not inherit candidates, scratch plans, attempt authorization, or unresolved review work. Cleanup is an explicit hash-bound operation: retain at most one unaccepted recent candidate per slide with provenance under the derived refinement root, fail closed on ambiguous review ordering, and never delete source assets.

## Risks / Trade-offs

- [Provider submit outcome is unknowable after a crash] → Persist attempt identity before submit, reconcile only with safe provider evidence, otherwise require a human decision rather than retrying.
- [Promotion can leave source and state divergent] → Use a journal with idempotent recovery and validate source asset/SHA before committing state or local recomposition.
- [Optional path leaks into ordinary HTML work] → Static load-closure tests and E2E assert normal init/build/local refresh neither creates refinement state nor loads transport.
- [Candidate retention consumes disk] → Bound retained rejected bytes per slide and make cleanup explicit, review-aware, and derived-only.
- [Legacy behavior regresses] → Marker-first routing and bidirectional rejection tests; Phase 4 never calls Phase-5 private implementation.

## Migration Plan

1. Add Phase-4 contracts, source/test owners, fake provider, and static isolation tests before exposing commands.
2. Add plan/authorization/attempt persistence and candidate review artifacts using synthetic temporary bundles.
3. Add promotion/recovery and Phase-2/3 local recomposition through public interfaces.
4. Add controller/docs/onboarding only after command, state, and artifact contracts pass.
5. Existing HTML and markerless bundles remain valid with absent lazy paths. A failed rollout can disable Phase-4 entry; no existing HTML or legacy source is rewritten. Journals recover forward or fail closed, never discard accepted source assets.

## Verification Strategy

Unit tests cover plan hashes, scope/attempt state machine, provider reconciliation classification, source asset integrity, journals, cleanup ordering, and selection resolution. Integration tests exercise Phase-4 public operations against a fake provider plus Phase-2/3 interfaces. E2E covers HTML-only no-op, authorization and partial failure, accept/use-html/restart recovery, vNext non-inheritance, and legacy rejection. Existing full tests, architecture/load-closure checks, CLI return audits, bundle self-check, and strict OpenSpec validation remain required.

## Open Questions

No open product or persistence decision blocks implementation. Provider reconciliation is intentionally capability-dependent: the adapter may use only safe evidence it can prove for the persisted attempt ID, and an unsupported proof path is conclusively `unknown-submit` rather than a reason to relax the cost boundary.
