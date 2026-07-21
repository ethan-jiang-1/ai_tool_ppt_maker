## Why

The current new-deck flow always enters HTML-first production even though its present visual quality is not ready to be the mandatory release path. Whole-page Image2 production is already usable, but it is exposed only as markerless legacy maintenance, while modern Image2 is limited to optional post-HTML visual-slot refinement; users therefore must pass through HTML before reaching the production path that is currently fit to ship.

This framework-maintenance change makes a user's production intent explicit per run version, promotes whole-page Image2 to a first-class new-deck path, and keeps both HTML modes available for later quality work. The MD Controller continues to own workflow and human decisions, JS owns canonical state, deterministic policy/routing, evidence, and diagnostics, and the protocol between them prevents either side from guessing mode from derived artifacts.

## What Changes

- Add authoritative, mutable, version-scoped `production_mode.by_version` state with exactly `html-only`, `html-then-image2`, and `image2-only`; `project-metadata.yaml` becomes a human-readable mirror only.
- Add one-time migration of missing mode records from canonical source markers: markerless/`legacy-image2-first` becomes `image2-only`, and `html-first-v1` becomes `html-only`. Existing optional refinement history never implies `html-then-image2`; after migration, missing, invalid, or drifting state fails closed instead of falling back to metadata or generated artifacts.
- Centralize the mode vocabulary and policy mapping so public commands inspect the exact requested run version and dispatch to one existing HTML or whole-page Image2 adapter. A mode/pipeline mismatch returns typed transition/state-drift guidance rather than choosing an authority implicitly.
- **BREAKING**: Add `ppt_flow init --mode <mode>` and change the omitted-mode default from HTML-first to `image2-only`. Init, help, and structured results report the selected mode, derived pipeline, and next action.
- Promote whole-page Image2 from compatibility-only maintenance to a first-class `create-deck` route that can complete init, intake/authoring, style master, pilot/review, build, PPTX, notes, and final review without HTML production or modern visual-slot refinement.
- Route validate, doctor, pilot, approvals, style-master, build, refresh, state, and status by the canonical mode policy. `image2-only` uses whole-page Image2 through normal pilot/build; it does not enter the modern `ppt_flow image2` refinement lifecycle.
- Keep `html-only` locally complete with no refinement debt. Make refinement a completion requirement only for `html-then-image2`, while preserving its separate exact authorization, provider, candidate-review, promotion, and final-review boundaries.
- Allow the state owner to switch `html-only <-> html-then-image2` atomically for the same run version, append audit history, and retain all refinement plans, candidates, accepted source assets, and evidence. Cross-pipeline `html-* <-> image2-only` switching is deferred to `add-versioned-production-mode-transitions` and cannot be achieved by mutating the current version in place.
- Preserve the `style-master` command seam for future HTML visual-system work. Image2 mode keeps the current implementation; HTML modes may currently return typed `capability_not_available` guidance but are not specified as permanently unsupported.
- Apply `openspec/policies/human-centered-gates.md`: readiness advice is `guide`; content, visual, header, candidate, and final-quality acceptance remains `confirm` with the owning evidence; unknown mode/pipeline identity, state integrity/CAS conflicts, and missing provider authorization are non-waivable `hard-stop` outcomes protecting exact identity, attributable state, single-writer integrity, and explicit provider authority.
- Apply `openspec/policies/agent-assistance-and-control.md`: state is the direct mode authority, one shared evaluator supplies routing/status/gates, the Agent performs authorized mechanical routing and repair, and only semantic mode selection, quality acceptance, and existing chargeable-provider authorization remain human decisions. No mirror, history log, source marker, or diagnostic becomes a competing runtime authority.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `node-specification`: Define version-scoped production-mode state, migration, state-owned same-pipeline transitions, drift handling, and mode-aware completion/status truth.
- `playbook-execution`: Make `create-deck` mode-aware, add the complete Image2-primary controller route, and express mode-specific gates and completion without conflating whole-page Image2 with Phase-4 refinement.
- `cli-surface`: Add the mode-selection/inspection surface and typed mode-aware routing, results, diagnostics, and return-audit coverage across public commands.
- `run-bundle-management`: Seed all three mode/pipeline shapes, default new init to `image2-only`, and keep metadata a non-authoritative mode mirror.
- `pipeline-orchestration`: Dispatch normal production operations through one canonical mode policy to the existing isolated HTML or whole-page Image2 adapters.
- `image-generation`: Promote whole-page Image2 generation to the normal Image2-primary production adapter while preserving provider authorization, provenance, and modern-refinement isolation.
- `commands-reference`: Route new-deck, resume, and iteration intent by production mode and describe Image2-primary as a normal production path rather than legacy-only maintenance.
- `bootstrap-env-guidance`: Align first-run setup and remediation with the selected/default production mode instead of assuming all fresh decks are local HTML-first.
- `environment-check`: Select base/HTML and Image2 readiness guidance from production mode while retaining explicit offline/live probe boundaries.
- `style-master-generation`: Make the current Image2 style-master implementation mode-aware and retain a typed extension seam for a future HTML adapter.
- `visual-slot-refinement`: Keep modern slot refinement isolated to HTML-first source, optional for `html-only`, and required for `html-then-image2` completion without weakening its authorization and promotion controls.

## Impact

- Framework maintenance touches `PPTMAKER_FRAMEWORK/` controllers, charter/state APIs, root CLI, run-bundle init/check logic, environment guidance/checks, orchestration, and existing Image2/style-master/refinement adapters, plus focused unit/integration/E2E coverage under `tests/` and `tests_e2e/`.
- `_state/state.yaml` becomes the only production-mode routing authority for each canonical `3_versions/vN`; source `production.pipeline` remains the actual renderer contract for that version, and `project-metadata.yaml` remains a repairable display mirror.
- Existing markerless and HTML-first decks receive a deterministic one-time state migration that preserves their current production behavior. Existing source markers, provider authorization, generation provenance, journals, CAS writes, and no-replace publication constraints remain in force.
- New decks created without `--mode` intentionally change behavior to Image2-primary and therefore require Image2 readiness before provider-backed pilot/build. Explicit `html-only` remains the zero-provider local route.
- No new runtime dependency is introduced. This change does not implement HTML rendering-quality improvements, an HTML style-master adapter, or cross-pipeline version publication.
