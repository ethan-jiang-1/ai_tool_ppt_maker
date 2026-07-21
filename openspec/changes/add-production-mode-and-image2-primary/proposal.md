## Why

The current new-deck flow always enters HTML-first production even though its present visual quality is not ready to be the mandatory release path. Whole-page Image2 production is already usable, but it is exposed only as markerless legacy maintenance, while modern Image2 is limited to optional post-HTML visual-slot refinement; users therefore must pass through HTML before reaching the production path that is currently fit to ship.

This framework-maintenance change makes a user's production intent explicit per run version, promotes whole-page Image2 to a first-class new-deck path, and keeps both HTML modes available for later quality work. The MD Controller continues to own workflow and human decisions, JS owns canonical state, deterministic policy/routing, evidence, and diagnostics, and the protocol between them prevents either side from guessing mode from derived artifacts.

## What Changes

- Add authoritative, mutable, version-scoped `production_mode.by_version` state with exactly `html-only`, `html-then-image2`, and `image2-only`; `project-metadata.yaml` becomes a human-readable mirror only.
- Add one-time migration of missing mode records from the canonical marker probe: the existing markerless branch (normalized as pipeline `legacy-image2-first`) becomes `image2-only`, and the explicit `html-first-v1` marker becomes `html-only`. Image2-primary source remains markerless; this change does not invent a `production.pipeline: legacy-image2-first` frontmatter marker. Existing optional refinement history never implies `html-then-image2`; after migration, missing, invalid, or drifting state fails closed instead of falling back to metadata or generated artifacts.
- Centralize the mode vocabulary and policy mapping so public commands inspect the exact requested run version and dispatch to one existing HTML or whole-page Image2 adapter. A mode/pipeline mismatch returns typed transition/state-drift guidance rather than choosing an authority implicitly.
- **BREAKING**: Add `ppt_flow init --mode <mode>` and change the omitted-mode default from HTML-first to `image2-only`. Init, help, and structured results report the selected mode, derived pipeline, and next action.
- Require every same-pipeline `new-version`/Structural Versioning publication to register the target version's inherited mode through the state owner after verifying the visible target and source relationship. Existing legacy-to-HTML migration registers its successful target as `html-only`; a missing post-publication registration is a typed repair state, never permission for ordinary routing to infer mode.
- Promote whole-page Image2 from compatibility-only maintenance to a first-class `create-deck` route that can complete init, intake/authoring, explicit chargeable-work authorization, style master, pilot/review, build, PPTX, notes, and evidence-bound final review without HTML production or modern visual-slot refinement.
- Route validate, pilot, approvals, style-master, build, refresh, state, and status by the canonical mode policy. `image2-only` uses whole-page Image2 through normal pilot/build; it does not enter the modern `ppt_flow image2` refinement lifecycle. `doctor` accepts an explicit mode or exact run and selects a scoped readiness profile, so Image2-primary is not blocked by HTML-only Playwright/ECharts/Chromium/font checks.
- Keep `html-only` locally complete with modern refinement disabled, while retaining historical/accepted refinement work without treating it as completion debt. Make refinement executable and required only for `html-then-image2`, preserving its separate exact authorization, provider, candidate-review, promotion, and final-review boundaries.
- Allow the state owner to switch `html-only <-> html-then-image2` atomically for the same run version, append audit history, and retain all refinement plans, candidates, accepted source assets, and evidence. Cross-pipeline `html-* <-> image2-only` switching is deferred to `add-versioned-production-mode-transitions` and cannot be achieved by mutating the current version in place.
- Make controller working sets mode-aware without marking inapplicable branch nodes `skipped` or deleting their records. The active mode filters eligibility/completion; `skipped` remains reserved for an explicit human bypass, and switching modes re-evaluates retained branch work.
- Preserve the `style-master` command seam for future HTML visual-system work. Image2 mode keeps the current implementation; HTML modes may currently return typed `capability_not_available` guidance but are not specified as permanently unsupported.
- Apply `openspec/policies/human-centered-gates.md`: readiness advice is `guide`; content, visual, header, candidate, and final-quality acceptance remains `confirm` with the owning evidence; unknown mode/pipeline identity, state integrity/CAS conflicts, and missing provider authorization are non-waivable `hard-stop` outcomes protecting exact identity, attributable state, single-writer integrity, and explicit provider authority.
- Apply `openspec/policies/agent-assistance-and-control.md`: state is the direct mode authority, one shared evaluator supplies routing/status/gates, the Agent performs authorized mechanical routing and repair, and only semantic mode selection, quality acceptance, and existing chargeable-provider authorization remain human decisions. No mirror, history log, source marker, or diagnostic becomes a competing runtime authority.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `node-specification`: Define version-scoped production-mode state, migration, mode-filtered controller working sets, state-owned same-pipeline transitions/version registration, drift handling, and mode-aware completion/status truth.
- `playbook-execution`: Make `create-deck` mode-aware, add the complete Image2-primary controller route with explicit provider and final-review gates, and express mode-specific eligibility/completion without conflating whole-page Image2 with Phase-4 refinement.
- `cli-surface`: Define the exact mode/init/doctor/state-management grammar plus typed mode-aware routing, results, diagnostics, and return-audit coverage across public commands.
- `run-bundle-management`: Seed all three mode/pipeline shapes, default new init to `image2-only`, register modes for published versions, and keep metadata a non-authoritative mode mirror.
- `pipeline-orchestration`: Dispatch normal production operations through one canonical mode policy to the existing isolated HTML or whole-page Image2 adapters.
- `image-generation`: Promote whole-page Image2 generation to the normal Image2-primary production adapter while preserving provider authorization, provenance, and modern-refinement isolation.
- `commands-reference`: Route new-deck, resume, and iteration intent by production mode and describe Image2-primary as a normal production path rather than legacy-only maintenance.
- `bootstrap-env-guidance`: Align first-run setup and profile-specific remediation with the selected/default production mode instead of assuming all fresh decks are local HTML-first.
- `environment-check`: Separate common, HTML, and Image2 readiness profiles so each production mode is blocked only by prerequisites it actually uses, while retaining explicit offline/live probe boundaries.
- `style-master-generation`: Make the current Image2 style-master implementation mode-aware and retain a typed extension seam for a future HTML adapter.
- `visual-slot-refinement`: Keep modern slot refinement isolated to HTML-first source, disabled for `html-only`, and required for `html-then-image2` completion without deleting historical work or weakening authorization/promotion controls.

## Impact

- Framework maintenance touches `PPTMAKER_FRAMEWORK/` controllers, charter/state APIs, root CLI, run-bundle init/check logic, environment guidance/checks, orchestration, and existing Image2/style-master/refinement adapters, plus focused unit/integration/E2E coverage under `tests/` and `tests_e2e/`.
- `_state/state.yaml` becomes the only production-mode routing authority for each canonical `3_versions/vN`; source `production.pipeline` remains the actual renderer contract for that version, and `project-metadata.yaml` remains a repairable display mirror.
- Existing markerless and HTML-first decks receive a deterministic one-time state migration that preserves their current source and production adapter. Existing markerless syntax, provider authorization, generation provenance, journals, CAS writes, and no-replace publication constraints remain in force.
- New decks created without `--mode` intentionally change behavior to Image2-primary and therefore require common plus Image2 readiness before provider-backed work, but do not require the HTML browser/chart/font runtime. Explicit `html-only` remains the zero-provider local route; `html-then-image2` may complete HTML work before its later Image2 readiness boundary.
- No new runtime dependency is introduced. This change does not implement HTML rendering-quality improvements, an HTML style-master adapter, or cross-pipeline version publication.
