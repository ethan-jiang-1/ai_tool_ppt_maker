## 1. Candidate Foundation and Synthetic Fixtures

- [ ] 1.1 (`pipeline-orchestration`, `run-bundle-management`) Define one confined projected-candidate resolver and candidate owner allowlist; distinguish candidate-authored inputs from rebuildable preview output, reject symlink/path escape, and expose only a bounded readiness/checklist projection.
- [ ] 1.2 (`pipeline-orchestration`) Add synthetic markerless migration fixtures with stable IDs, legacy prompts, palette/control inputs, and provider-call spies; do not read or copy `deck_*`, `dpt_*`, or existing generated production data.
- [ ] 1.3 (`pipeline-orchestration`) Add explicit compatibility handling for a legacy loose scratch candidate that is reachable only through `prepare`; prove preview never adopts, moves, or overwrites it.

## 2. Isolated Preparation and Visual Scaffold

- [ ] 2.1 (`visual-config`) Implement the named shipped-preset registry lookup and deterministic legacy-token mapping used by migration preparation; preserve legacy loader compatibility and record fallback provenance without inferring semantic roles from prompt prose.
- [ ] 2.2 (`visual-config`) Add bounded multi-field expected/actual palette diagnostics for strict JSON, closed schema, token, typography, spacing, component, image-language, and geometry mismatches; prove invalid input starts no browser/provider work.
- [ ] 2.3 (`pipeline-orchestration`, `run-bundle-management`) Implement projected-run scaffold creation for candidate source/control/assets, target handoff templates, and the per-slide authoring checklist while keeping actual state/metadata truth with their existing owners.
- [ ] 2.4 (`pipeline-orchestration`) Implement idempotent prepare for matching source/preset receipts and conflict-before-overwrite behavior for an authored candidate with different source or preset inputs.
- [ ] 2.5 (`cli-surface`) Add `migrate-html <run-dir> prepare --preset <name>` delegation, closed option validation, help text, and structured success/usage/conflict results; prove all writes are below the current version's `projected-run/` and no provider credential is read.

## 3. Parser and Topology Correctness

- [ ] 3.1 (`content-parsing`) Refine the shared slide-document grammar so leading preamble accepts unnumbered `## Slide ...` section prose before the first exact slide while exact numeric slide heading/ID grammar remains the sole slide boundary.
- [ ] 3.2 (`content-parsing`) Add parser regressions for `Slide Specifications`/`Slide Map` preamble, malformed numeric heading before the first slide, malformed post-slide heading, heading continuity, and legacy multi-input compatibility.
- [ ] 3.3 (`run-bundle-management`) Replace generic dotfile/`__pycache__` suppression in every relevant topology walk with one exact `.DS_Store` system-entry predicate; keep journals, locks, reservations, and unknown hidden entries visible to their owners.
- [ ] 3.4 (`run-bundle-management`) Update migration-scratch topology checks for the projected candidate layout and add focused tests for allowed `.DS_Store`, rejected `.foreign-cache`, and observable misplaced transaction-owner files.

## 4. Preview, Receipt, and Publication Transaction

- [ ] 4.1 (`pipeline-orchestration`) Make migration preview resolve candidate readiness before renderer setup; return non-writing `preparation_required` and `authoring_required` guides with exact next actions, available presets, and bounded slide/field requirements.
- [ ] 4.2 (`pipeline-orchestration`) Route only a complete projected candidate through the existing local migration-preview renderer; rebuild only derived preview owners, preserve authored candidate files, and keep old-side `verified-current|degraded-*` behavior and zero-provider guarantees.
- [ ] 4.3 (`pipeline-orchestration`) Bind plan hashes and apply preconditions to the resolver's candidate source/control/asset receipts, then stage only revalidated candidate inputs and rerender the hidden canonical target without copying scratch generated objects, approvals, or state.
- [ ] 4.4 (`pipeline-orchestration`, `run-bundle-management`) Preserve exact mode/hash, journal, no-replace, target-collision, and recovery semantics after the candidate-layout transition; prove conflict/drift paths publish no target and recovery never creates review approval.

## 5. CLI Diagnostics and Return Audit

- [ ] 5.1 (`cli-surface`) Make bare markerless preview return the guide result rather than a generic candidate-missing failure, while malformed source identity, unsafe candidate ownership, active journal, and exact apply mismatch retain one bounded producer-owned hard-stop envelope.
- [ ] 5.2 (`cli-surface`) Enforce operation-specific flag isolation for prepare, preview, normal apply, and recovery before writes; retain the 15-command top-level inventory and reject provider/legacy-generation/path override flags.
- [ ] 5.3 (`cli-surface`) Extend the command-return registry and audit fixtures for prepare success/idempotency/usage/conflict, preview guide/complete/degraded paths, apply drift/recovery paths, and zero-provider behavior.
- [ ] 5.4 (`cli-surface`) Add direct CLI integration coverage that asserts stdout success reports and stderr's single secret-safe failure envelope for guide, usage, conflict, and hard-stop cases.

## 6. Controller and Command Guidance

- [ ] 6.1 (`playbook-execution`) Add the explicit `migrate-import` preparation-to-Agent-authoring handoff before preview, reuse the CLI guide/checkpoint, and keep human semantic choice and exact hash/mode confirmation separate from routine mechanical preparation.
- [ ] 6.2 (`commands-reference`) Update COMMANDS migration routing to show prepare, Agent-authored structured bodies, guide recovery, complete preview, degraded old-side explanation, and exact apply; do not document automatic prompt conversion or manual edits to `_generated/`, state, journals, or locks.
- [ ] 6.3 (`playbook-execution`, `commands-reference`) Add or update controller/document coherence tests so every documented migration action maps to the registered CLI owner and retains the zero-provider/no-source-replacement boundary.

## 7. Focused Verification and Completion

- [ ] 7.1 Add unit coverage for candidate resolver confinement/idempotency, palette seeding/diff output, slide preamble grammar, and exact `.DS_Store` topology handling.
- [ ] 7.2 Add migration integration coverage from a synthetic bare markerless fixture through prepare, Agent-completed candidate, complete preview, exact apply, source/target drift, journal conflict/recovery, and no scratch-byte promotion.
- [ ] 7.3 Add an end-to-end CLI fixture proving a real-shaped markerless migration reaches a clean HTML vNext with no provider call, while failed prepare/preview/apply paths leave the source and visible target set unchanged.
- [ ] 7.4 Run targeted tests, `npm test`, and `npm run test:e2e`; record any baseline failure with its exact independent cause rather than a generic pre-existing label.
- [ ] 7.5 Run `openspec validate complete-markerless-html-migration --strict`, review the command-return audit and changed-path diff, and update this checklist only after the corresponding verification passes.
