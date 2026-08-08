## 1. Baseline And Source Layout

- [x] 1.1 (`image-generation`, Pure tests) Repair the pre-replacement `receipt()` fixture in `test_pure_workflow.mjs` so it has ordered positions and no per-slide workflow, then prove the existing Pure focused suite is green before visual-system behavior is added.
- [x] 1.2 (`run-bundle-layout`) Add the canonical `pure-deck-visual-system.yaml` visual-style path, valid source seed, tree/Where Map documentation, version-override resolution, and structure coverage; do not put the record in `_generated/` or any immutable lifecycle root.

## 2. Pure Visual Config

- [x] 2.1 (`visual-config`) Implement one dependency-light Pure deck visual-system parser/resolver that owns confined version-resolved read, exact YAML shape, bounded token normalization, immutable projection, canonical digest, and one source/configuration failure for missing, malformed, unsupported, or escaping records.
- [x] 2.2 (`visual-config`) Add focused unit tests for seed validity, canonical digest stability, version override, all required token families, forbidden free prompt/content/lifecycle fields, invalid geometry/enums, escaping paths, missing legacy source, and Framed non-consumption.
- [x] 2.3 (`visual-config`, Pure adapter) Make Pure source parsing receive the canonical `runDir` and validate the selected override-or-backbone visual-system prerequisite before Style Master scope/readiness, without changing the source receipt's exact `slide-specifications.md` byte hash or serializing the profile into Style Master context.

## 3. Pure Binding And Invalidation

- [x] 3.1 (`image-generation`) Extend the common Page Image Core and closed provider-input binding with the explicit `deck_visual_system_sha256` slot. Update the ordinary raw-plan artifact validator, progressive raw-plan schema, invalidation field/reason table, provider-input inspection projection, and shared binding fixture atomically: Pure requires the validated digest; Framed retains exact `null`/not-applicable behavior.
- [x] 3.2 (`image-generation`, Pure adapter) Resolve the visual-system once for each current Pure target/progressive raw compilation and bind its projection/digest to each Core slide, raw contract (`deck_visual_system: { sha256, projection }`), compiled provider input, inspection projection, and raw-plan item. Keep every visible Pure page provider-rendered and preserve Style Master candidate/selection scope.
- [x] 3.3 (`image-generation`) Reuse current raw-plan binding comparison to classify `deck_visual_system_sha256` drift as the existing Pure raw-rebuild action. Add focused negative coverage for stale accepted evidence, no provider/state mutation during planning, Framed null compatibility, and earliest source/configuration failure before plan/provider work.
- [x] 3.4 (`image-generation`) Add multi-page integration coverage proving all Pure inputs share one deterministic token projection/digest while per-slide literals and visual-language selections stay distinct; prove inspection is secret-safe and cannot imply pixel acceptance, authorization, or a selector.

## 4. Regression And Quality Boundaries

- [x] 4.1 Run the focused Pure adapter, Visual Config, Page Image Core/invalidation, ordinary and progressive raw-plan schema, provider-input inspection, run-bundle layout, and relevant contract suites. Include the former 13/14 fixture as a green regression; update the shared binding fixtures and source-test-ownership manifest for every added test seam.
- [x] 4.2 Verify Framed and Style Master regression boundaries: no Pure record is read by Framed, a Pure token edit does not replan/reselect Style Master, and no local overlay/protected-geometry/review-state surface is introduced.
- [x] 4.3 Run `npm test`, `git diff --check`, `openspec validate bind-pure-deck-visual-system --strict`, and `openspec validate --all --strict`. Do not perform provider-backed E2E or a Pilot without a separate explicit human cost authorization.

## 5. Closeout

- [x] 5.1 After provider-free evidence is green, update this change's tasks, the progressive backlog plan, and BUG-057 with the exact resolved scope and the explicit boundary that prompt binding is not pixel proof. Move the BUG only if the approved scope is fully resolved.
- [x] 5.2 Before apply completion, record the post-implementation human Pilot acceptance protocol: three representative Pure slides with distinct content/composition demands, evaluated for hierarchy, Style-Master-derived colour use, zones, whitespace, and permitted layout-family discipline through the existing authorization/review workflow, not a new gate.
