## 1. Freeze Baseline And Ownership

- [x] 1.1 Audit current Framed preset, preflight, compositor, source-resolution, raw-plan, raw-review, refresh, readiness, and CLI call sites; record the exact replacement/removal map and confirm no production `deck_*` path is used as input or fixture.
- [x] 1.2 Audit `node-specification`, `playbook-execution`, and current Controller consumers against the delta specs; add a delta only if requirement-level consumer behavior changes, and otherwise record that the producer-owned CLI envelope remains sufficient.
- [x] 1.3 Add or update the focused baseline test that reproduces the known estimated-width false acceptance and proves current browser overflow, so the replacement evaluator has an executable regression target.

## 2. Canonical Preset, Profile, And Fonts

- [x] 2.1 [visual-config] Normalize `standard-v1` by removing duplicate/unconsumed opacity, border, and padding facts while preserving the declared light frame, both callout variants, field geometry, typography, palette, line limits, and reserved regions.
- [x] 2.2 [visual-config] Implement canonical render-profile construction and `render_profile_digest` over the specified preset/compiler/font/runtime/capture inputs, excluding literals, page observations, selected shards, bytes, and host-specific values.
- [x] 2.3 [html-render-runtime] Add the narrow checked-in font-owner interface that validates render-inventory integrity and deterministically selects only the faces required by actual Text Frame code points.
- [x] 2.4 [visual-config/html-render-runtime] Add unit fixtures proving host/order stability, every pixel-relevant invalidation input, non-pixel metadata stability, Text Frame-only profile stability, supported Latin/CJK/mixed selection, and bounded unsupported-code-point failure.
- [x] 2.5 [visual-config] Add compiler/profile coherence coverage that fails when pixel-producing compiler behavior changes without its canonical identity changing.

## 3. One Private Framed Render Contract

- [x] 3.1 [image-production] Introduce the private Framed render-contract module and route deterministic frame description, canonical document compilation, and safe-zone derivation through the normalized preset only.
- [x] 3.2 [html-render-runtime/image-production] Implement one pinned-process, finite raw-plan browser batch with per-page and whole-batch deadlines, exact slide/panel/field geometry, scroll bounds, y-grouped line counts, leaf markers, selected-font evidence, network denial, capture geometry, and cleanup.
- [x] 3.3 [image-production] Implement batch final composition from verified accepted underlays using the same compiler/evaluator, returning bytes only after the entire batch passes and publishing no partial manifest on failure.
- [x] 3.4 [image-production] Move test substitution below the public workflow boundary to a private browser/capture seam; make public Framed composition reject caller markup, CSS, paths, capture options, preflight objects, and composition callbacks.
- [x] 3.5 [html-render-runtime/image-production] Add private browser tests for both variants, supported Latin/CJK/mixed pages, long tokens, extra lines, scroll overflow, panel/field/marker mismatch, noncustom fallback, missing font, denied network, wrong capture size, per-page and whole-batch timeout cleanup, and the 28-`W` regression.

## 4. Proof-Before-Materialization Planning

- [x] 4.1 [image-generation] Add a read-only selected-workflow candidate source resolver that parses and hashes current source without initializing/advancing state or writing source receipt, raw plan, or derived evidence.
- [x] 4.2 [image-generation] Refactor Framed plan compilation to build complete source/contract/provider/plan candidates in memory, run one bounded render-contract verification batch, and only then call the existing source-state/receipt and raw-plan writers.
- [x] 4.3 [image-generation/image-production] Add a read-only current stored-plan context for authorize, generate, prepare-review, decide-review, accept, and delivery; validate exact source/receipt/workflow/contract/profile/plan identity without plan rewrite or source-epoch mutation. Authorize/generate/review/accept launch no browser; Framed delivery invokes only the one final composition batch, never plan-time proof.
- [x] 4.4 [image-generation] Make partial post-proof writes fail closed: no incomplete state/receipt/plan tuple can pass authorization, and rerunning `image2 plan` through the same owners repairs the checkpoint without a second journal or success record.
- [x] 4.5 [image-generation] Add integration tests asserting zero writes/provider calls on source, font, runtime, or layout failure; one browser launch per successful bounded plan batch; exact receipt/epoch/plan binding after success; and zero browser launches or plan writes in later raw commands.
- [x] 4.6 [image-generation] Add drift and recovery tests proving stale source/profile/contract/plan failures short-circuit provider work, return one owner action, and succeed after owner repair plus the same plan checkpoint rerun.

## 5. Profile Lineage And Raw-Review Evidence

- [x] 5.1 [image-generation/visual-config] Add `render_profile_digest` to the canonical Framed raw contract and validators so the existing plan hash binds it transitively into authorization, review, accepted raw, final, and delivery evidence.
- [x] 5.2 [pipeline-orchestration] Update refresh classification so preset/compiler/font/runtime/capture profile drift creates Generated Image Rebuild debt without silently rebinding underlays or manufacturing a source epoch solely for profile drift.

- [x] 5.3 [image-generation] Define one canonical ephemeral generic review-contribution interface with separate coverage facts and projection-only labels; make Framed contribute ordered stable identities, safe-zone guide primitives, and the current render-profile coverage digest while excluding title/label values from coverage identity.
- [x] 5.4 [image-generation] Make Pure contribute only generic identity/profile facts and add a boundary test proving shared review receives no Text Frame or Framed safe-zone semantics.
- [x] 5.5 [image-generation/run-bundle-layout] Give the existing shared raw-review owner a canonical projection/capture profile and bind coverage to source epoch, exact raw byte identities, typed review-contribution digest, actual projection PNG digest, and projection/capture-profile digest without adding a durable contribution artifact or second ledger.
- [x] 5.6 [image-generation] Render generic contribution items in current `raw_work_plan.ordered_slide_ids` order with `position + formal slide_id + title` labels and safe-zone guides at projection capture, while preserving stable ID as byte identity and position/label text as presentation snapshots.
- [x] 5.7 [image-generation] Verify complete/current coverage, including actual projection bytes/hash and every required contribution, before exposing the existing human raw-quality decision; make missing, partial, stale, mismatched, or incompletely attributable evidence hard-stop before `confirm`, with no waiver or force path.
- [x] 5.8 [image-generation/run-bundle-layout] Add review tests for both Framed variants, Pure isolation, exact labels/guides/current order at capture, title-label exclusion from coverage identity, Text Frame-only accepted-review reuse, byte/source-epoch/profile/safe-zone drift invalidation, copied-artifact rejection, owner rebuild, same-check recovery, and finalization refusal without current accepted evidence.

## 6. Profile-Aware Refresh And Workflow Routing

- [x] 6.1 [pipeline-orchestration/image-production] After 5.3-5.7 establish typed review coverage, preserve Text Frame-only local rebind only when source epoch, workflow, order, raw contract, safe zones, provider profile, accepted underlay bytes, render profile, typed review-contribution digest, and projection/capture profile are exact; before retaining the accepted raw-review reference, validate its stored record and actual projection bytes/hash, then rebind without projection rebuild, keep its historical label presentation-only, and repeat current layout proof before final publication.
- [x] 6.2 [pipeline-orchestration] Preserve notes-only browser/provider freedom and exact Structural Versioning routing for order or workflow changes.
- [x] 6.3 [pipeline-orchestration] Replace the stale mixed-workflow lifecycle scenario and any matching implementation/test assumption with homogeneous selected-workflow ownership and a fail-closed mixed-evidence negative case.
- [x] 6.4 [pipeline-orchestration/image-production] Add focused tests for provider-free Text Frame refresh that retains the raw-review reference and source epoch, final fit failure, profile/safe-zone coverage-drift rebuild, notes-only zero browser/provider work, workflow-switch structural routing, and no cross-workflow underlay rebind.

## 7. Readiness, Diagnostics, And Controller Handoff

- [x] 7.1 [environment-check] Expose the canonical Framed runtime/font/capture profile through the existing lazy package-backed readiness owner while preserving direct env-check zero-static-dependency startup and provider-free local mode.
- [x] 7.2 [environment-check] Add tests for missing `node_modules`, missing/mismatched paired browser, missing/changed selected font, no browser acquisition, no provider initialization in local mode, and doctor/production agreement on the same profile facts.
- [x] 7.3 [cli-surface] Map invalid literals/code points/fit to `source_validation`, runtime/font readiness or unknown proof timeout to `environment`, preset/compiler/capture contradictions to `internal`, and stale plan/evidence to its existing owning category using `cli_error.mjs` and one secret-safe nearest action.
- [x] 7.4 [cli-surface] Add process-level tests proving prerequisite-first short-circuiting, bounded diagnostics, final stderr JSON ownership, zero wrong-owner writes/provider calls, no force/waiver/retry menu, and successful same-check reruns.
- [x] 7.5 [MD Controller/Agent] Update only the affected Controller and reference wording to present owner-issued facts, perform legal mechanical repair, and preserve the existing raw visual `confirm`; do not duplicate producer schema or add another Controller branch.
- [x] 7.6 [cli-surface/node-specification] Run producer-consumer contract tests proving MD consumption uses structured category/next fields rather than matching prose; if no consumer contract changes, retain no `node-specification` delta.

## 8. Remove Competing Paths And Verify The Change

- [x] 8.1 Remove the estimated-width authorization authority, duplicate dark Arial compositor CSS, caller-trusted preflight, public arbitrary composition injection, and later-command plan rebuild/write paths after replacement coverage is green; remove dead exports and fixtures without retaining a fallback.
- [x] 8.2 Run architecture and terminology scans proving one Framed compiler/evaluator owner, no public production bypass, no stale mixed-workflow contract, no persistent layout proof, and no production `deck_*` fixture or migration target.
- [x] 8.3 Run the focused preset/profile/font and private browser test tiers, including launch-count, provider-count, owner-write, atomic-publication, and negative-control assertions.
- [x] 8.4 Run the Framed workflow suite, shared Image2/state/CLI integration suites, and both current target mock-E2E journeys including repair and provider-free refresh.
- [x] 8.5 Run `npm test` and the appropriate checked-in E2E tier; investigate every regression without weakening identity, integrity, authorization, or evidence-completeness checks.
- [x] 8.6 Run `openspec validate converge-framed-render-and-review --strict`, audit every delta against its main capability, and prepare sync/archive evidence showing no required task was deferred.
