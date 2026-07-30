## 1. Freeze Baseline And Ownership

- [ ] 1.1 Audit current Framed preset, preflight, compositor, source-resolution, raw-plan, raw-review, refresh, readiness, and CLI call sites; record the exact replacement/removal map and confirm no production `deck_*` path is used as input or fixture.
- [ ] 1.2 Audit `node-specification`, `playbook-execution`, and current Controller consumers against the delta specs; add a delta only if requirement-level consumer behavior changes, and otherwise record that the producer-owned CLI envelope remains sufficient.
- [ ] 1.3 Add or update the focused baseline test that reproduces the known estimated-width false acceptance and proves current browser overflow, so the replacement evaluator has an executable regression target.

## 2. Canonical Preset, Profile, And Fonts

- [ ] 2.1 [visual-config] Normalize `standard-v1` by removing duplicate/unconsumed opacity, border, and padding facts while preserving the declared light frame, both callout variants, field geometry, typography, palette, line limits, and reserved regions.
- [ ] 2.2 [visual-config] Implement canonical render-profile construction and `render_profile_digest` over the specified preset/compiler/font/runtime/capture inputs, excluding literals, page observations, selected shards, bytes, and host-specific values.
- [ ] 2.3 [html-render-runtime] Add the narrow checked-in font-owner interface that validates render-inventory integrity and deterministically selects only the faces required by actual Text Frame code points.
- [ ] 2.4 [visual-config/html-render-runtime] Add unit fixtures proving host/order stability, every pixel-relevant invalidation input, non-pixel metadata stability, Text Frame-only profile stability, supported Latin/CJK/mixed selection, and bounded unsupported-code-point failure.
- [ ] 2.5 [visual-config] Add compiler/profile coherence coverage that fails when pixel-producing compiler behavior changes without its canonical identity changing.

## 3. One Private Framed Render Contract

- [ ] 3.1 [image-production] Introduce the private Framed render-contract module and route deterministic frame description, canonical document compilation, and safe-zone derivation through the normalized preset only.
- [ ] 3.2 [html-render-runtime/image-production] Implement bounded multi-slide browser evaluation with exact slide/panel/field geometry, scroll bounds, y-grouped line counts, leaf markers, selected-font evidence, network denial, capture geometry, timeouts, and cleanup.
- [ ] 3.3 [image-production] Implement batch final composition from verified accepted underlays using the same compiler/evaluator, returning bytes only after the entire batch passes and publishing no partial manifest on failure.
- [ ] 3.4 [image-production] Move test substitution below the public workflow boundary to a private browser/capture seam; make public Framed composition reject caller markup, CSS, paths, capture options, preflight objects, and composition callbacks.
- [ ] 3.5 [html-render-runtime/image-production] Add private browser tests for both variants, supported Latin/CJK/mixed pages, long tokens, extra lines, scroll overflow, panel/field/marker mismatch, noncustom fallback, missing font, denied network, wrong capture size, timeout, cleanup, and the 28-`W` regression.

## 4. Proof-Before-Materialization Planning

- [ ] 4.1 [image-generation] Add a read-only selected-workflow candidate source resolver that parses and hashes current source without initializing/advancing state or writing source receipt, raw plan, or derived evidence.
- [ ] 4.2 [image-generation] Refactor Framed plan compilation to build complete source/contract/provider/plan candidates in memory, run one bounded render-contract verification batch, and only then call the existing source-state/receipt and raw-plan writers.
- [ ] 4.3 [image-generation] Add a read-only current stored-plan context for authorize, generate, prepare-review, decide-review, accept, and delivery; validate exact source/receipt/workflow/contract/profile/plan identity without browser launch, plan rewrite, or source-epoch mutation.
- [ ] 4.4 [image-generation] Make partial post-proof writes fail closed: no incomplete state/receipt/plan tuple can pass authorization, and rerunning `image2 plan` through the same owners repairs the checkpoint without a second journal or success record.
- [ ] 4.5 [image-generation] Add integration tests asserting zero writes/provider calls on source, font, runtime, or layout failure; one browser launch per successful bounded plan batch; exact receipt/epoch/plan binding after success; and zero browser launches or plan writes in later raw commands.
- [ ] 4.6 [image-generation] Add drift and recovery tests proving stale source/profile/contract/plan failures short-circuit provider work, return one owner action, and succeed after owner repair plus the same plan checkpoint rerun.

## 5. Profile Lineage And Refresh

- [ ] 5.1 [image-generation/visual-config] Add `render_profile_digest` to the canonical Framed raw contract and validators so the existing plan hash binds it transitively into authorization, review, accepted raw, final, and delivery evidence.
- [ ] 5.2 [pipeline-orchestration] Update refresh classification so preset/compiler/font/runtime/capture profile drift creates Generated Image Rebuild debt without silently rebinding underlays or manufacturing a source epoch solely for profile drift.
- [ ] 5.3 [pipeline-orchestration/image-production] Preserve Text Frame-only local rebind only when workflow, order, raw contract, safe zones, provider profile, render profile, and accepted underlay bytes are exact; repeat current layout proof before final publication.
- [ ] 5.4 [pipeline-orchestration] Preserve notes-only browser/provider freedom and exact Structural Versioning routing for order or workflow changes.
- [ ] 5.5 [pipeline-orchestration] Replace the stale mixed-workflow lifecycle scenario and any matching implementation/test assumption with homogeneous selected-workflow ownership and a fail-closed mixed-evidence negative case.
- [ ] 5.6 [pipeline-orchestration/image-production] Add focused tests for provider-free Text Frame refresh, final fit failure, profile-drift rebuild, notes-only zero browser/provider work, workflow-switch structural routing, and no cross-workflow underlay rebind.

## 6. Complete Typed Raw-Review Evidence

- [ ] 6.1 [image-generation] Define one canonical ephemeral generic review-contribution interface and make Framed contribute ordered identity labels, safe-zone guide primitives, and the current render-profile contribution digest.
- [ ] 6.2 [image-generation] Make Pure contribute only generic identity/profile facts and add a boundary test proving shared review receives no Text Frame or Framed safe-zone semantics.
- [ ] 6.3 [image-generation/run-bundle-layout] Give the existing shared raw-review owner a canonical projection/capture profile and bind coverage to exact raw byte identities, workflow-contribution digest, projection PNG digest, and projection/capture-profile digest without adding a durable contribution artifact or second ledger.
- [ ] 6.4 [image-generation] Render current `position + formal slide_id + title` labels and generic safe-zone guides while preserving stable ID as byte identity and position as current-order projection.
- [ ] 6.5 [image-generation] Preserve the existing human raw-quality decision only after complete/current coverage; make missing, partial, stale, mismatched, or incompletely attributable evidence hard-stop before `confirm`, with no waiver or force path.
- [ ] 6.6 [image-generation/run-bundle-layout] Add review tests for both Framed variants, Pure isolation, exact labels/guides, byte/order/profile drift invalidation, copied-artifact rejection, owner rebuild, same-check recovery, and finalization refusal without current accepted evidence.

## 7. Readiness, Diagnostics, And Controller Handoff

- [ ] 7.1 [environment-check] Expose the canonical Framed runtime/font/capture profile through the existing lazy package-backed readiness owner while preserving direct env-check zero-static-dependency startup and provider-free local mode.
- [ ] 7.2 [environment-check] Add tests for missing `node_modules`, missing/mismatched paired browser, missing/changed selected font, no browser acquisition, no provider initialization in local mode, and doctor/production agreement on the same profile facts.
- [ ] 7.3 [cli-surface] Map invalid literals/code points/fit to `source_validation`, runtime/font readiness to `environment`, preset/compiler/capture contradictions to `internal`, and stale plan/evidence to its existing owning category using `cli_error.mjs` and one secret-safe nearest action.
- [ ] 7.4 [cli-surface] Add process-level tests proving prerequisite-first short-circuiting, bounded diagnostics, final stderr JSON ownership, zero wrong-owner writes/provider calls, no force/waiver/retry menu, and successful same-check reruns.
- [ ] 7.5 [MD Controller/Agent] Update only the affected Controller and reference wording to present owner-issued facts, perform legal mechanical repair, and preserve the existing raw visual `confirm`; do not duplicate producer schema or add another Controller branch.
- [ ] 7.6 [cli-surface/node-specification] Run producer-consumer contract tests proving MD consumption uses structured category/next fields rather than matching prose; if no consumer contract changes, retain no `node-specification` delta.

## 8. Remove Competing Paths And Verify The Change

- [ ] 8.1 Remove the estimated-width authorization authority, duplicate dark Arial compositor CSS, caller-trusted preflight, public arbitrary composition injection, and later-command plan rebuild/write paths after replacement coverage is green; remove dead exports and fixtures without retaining a fallback.
- [ ] 8.2 Run architecture and terminology scans proving one Framed compiler/evaluator owner, no public production bypass, no stale mixed-workflow contract, no persistent layout proof, and no production `deck_*` fixture or migration target.
- [ ] 8.3 Run the focused preset/profile/font and private browser test tiers, including launch-count, provider-count, owner-write, atomic-publication, and negative-control assertions.
- [ ] 8.4 Run the Framed workflow suite, shared Image2/state/CLI integration suites, and both current target mock-E2E journeys including repair and provider-free refresh.
- [ ] 8.5 Run `npm test` and the appropriate checked-in E2E tier; investigate every regression without weakening identity, integrity, authorization, or evidence-completeness checks.
- [ ] 8.6 Run `openspec validate converge-framed-render-and-review --strict`, audit every delta against its main capability, and prepare sync/archive evidence showing no required task was deferred.
