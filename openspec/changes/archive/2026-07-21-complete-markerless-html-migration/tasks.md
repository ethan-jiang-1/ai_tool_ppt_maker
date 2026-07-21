## 1. Candidate Foundation and Synthetic Fixtures

- [x] 1.1 (`html-slide-contract`) Add the closed migration-candidate validation entry and sorted receipt projection for candidate source plus `candidate > source-version override > backbone` inputs; reject arbitrary roots, path/symlink escape, receipt drift, and public-path widening.
- [x] 1.2 (`visual-asset-management`) Extend v2 catalog resolution with the trusted sparse candidate asset overlay, private receipt provenance, confinement, and hidden-target reproduction rules while preserving the public `backbone|version` origin enum and normal run-dir behavior.
- [x] 1.3 (`html-slide-rendering`) Issue migration-preview context only from the validated candidate overlay; prove candidate palette/assets affect preview and hidden target equivalently while callers cannot forge publication paths or contexts.
- [x] 1.4 (`pipeline-orchestration`, `run-bundle-management`) Define one confined projected-candidate resolver and candidate owner allowlist; distinguish candidate-authored source/overrides from rebuildable preview output, reject symlink/path escape, and expose only a bounded readiness/checklist projection.
- [x] 1.5 (`pipeline-orchestration`) Add synthetic markerless migration fixtures with stable IDs, legacy prompts, palette/control inputs, and provider-call spies; do not read or copy `deck_*`, `dpt_*`, or existing generated production data.
- [x] 1.6 (`pipeline-orchestration`) Add explicit compatibility handling for a legacy loose scratch candidate that is reachable only through `prepare`; prove preview never adopts, moves, or overwrites it.

## 2. Isolated Preparation and Visual Scaffold

- [x] 2.1 (`visual-config`) Implement the named shipped-preset registry lookup and ordered merge from selected preset plus only referenced compatible legacy root tokens; write the complete result solely as the candidate palette override and record `legacy|preset` provenance without inferring semantic roles from prompt prose.
- [x] 2.2 (`visual-config`) Add bounded multi-field expected/actual palette diagnostics for strict JSON, closed schema, token, typography, spacing, component, image-language, and geometry mismatches; prove invalid input starts no browser/provider work.
- [x] 2.3 (`pipeline-orchestration`, `run-bundle-layout`, `run-bundle-management`) Implement the closed projected-run scaffold (`slide-specifications.md`, `overrides/`, `preparation.json`, `authoring-context.json`, `authoring-checklist.json`, `_generated/`); make support JSON non-authoritative and stage only candidate source/overrides, never metadata/state templates.
- [x] 2.4 (`html-slide-contract`, `content-parsing`) Preserve retained legacy stable IDs verbatim, add `mnemonic-v1` only when all IDs already qualify, exclude legacy `IMAGE PROMPT` from candidate structured source, and keep any prompt reference authoring-only.
- [x] 2.5 (`pipeline-orchestration`) Implement idempotent prepare for matching source/preset/effective-inherited receipts and conflict-before-overwrite behavior for an authored candidate with different source, preset, or inherited inputs.
- [x] 2.6 (`cli-surface`) Add `migrate-html <run-dir> prepare --preset <name>` delegation, closed option validation, help text, and structured success/usage/conflict results; prove all writes are below the current version's `projected-run/` and no provider credential is read.

## 3. Parser and Topology Correctness

- [x] 3.1 (`content-parsing`) Refine the shared slide-document grammar so leading preamble accepts unnumbered `## Slide ...` section prose before the first exact slide while exact numeric slide heading/ID grammar remains the sole slide boundary.
- [x] 3.2 (`content-parsing`) Add parser regressions for `Slide Specifications`/`Slide Map` preamble, malformed numeric heading before the first slide, malformed post-slide heading, heading continuity, and legacy multi-input compatibility.
- [x] 3.3 (`run-bundle-management`) Replace generic dotfile/`__pycache__` suppression only in HTML-production and migration-scratch topology walks with one exact `.DS_Store` system-entry predicate; keep journals, locks, reservations, and unknown hidden entries visible to their owners without rewriting unrelated topology owners.
- [x] 3.4 (`run-bundle-management`, `run-bundle-layout`) Update migration-scratch topology checks for the closed projected candidate layout and add focused tests for allowed `.DS_Store`, rejected `.foreign-cache`, support-file foreign entry, and observable misplaced transaction-owner files.

## 4. Preview, Receipt, and Publication Transaction

- [x] 4.1 (`pipeline-orchestration`) Make migration preview resolve candidate readiness before renderer setup; return non-writing `preparation_required` and `authoring_required` guides with exact next actions, available presets, and bounded slide/field requirements.
- [x] 4.2 (`pipeline-orchestration`) Route only a complete projected candidate through the existing local migration-preview renderer; rebuild only derived preview owners, preserve authored candidate files, and keep old-side `verified-current|degraded-*` behavior and zero-provider guarantees.
- [x] 4.3 (`pipeline-orchestration`, `html-slide-contract`, `visual-asset-management`) Bind plan hashes and apply preconditions to candidate source/override plus inherited source-version/backbone receipts, construct the hidden target from those inputs, stage only revalidated candidate source/overrides, and rerender without copying the legacy source tree, scratch generated objects, metadata, approvals, or state.
- [x] 4.4 (`pipeline-orchestration`, `run-bundle-management`) Preserve exact mode/hash, journal, no-replace, target-collision, and recovery semantics after the candidate-layout transition; prove conflict/drift paths publish no target and recovery never creates review approval.
- [x] 4.5 (`node-specification`, `pipeline-orchestration`) Add the state-owned receipt-aware confirmation transition: verify the current preview, re-resolved candidate/inherited receipts, and unchanged old-side evidence/mode before one CAS write from `confirm-html-migration` to the exact `apply-html-migration` record; bind hash/mode/normalized source version, reject arbitrary node/root fields, and preserve exact retry idempotency.

## 5. CLI Diagnostics and Return Audit

- [x] 5.1 (`cli-surface`) Make bare markerless preview return the guide result rather than a generic candidate-missing failure, while malformed source identity, unsafe candidate ownership, active journal, and exact apply mismatch retain one bounded producer-owned hard-stop envelope.
- [x] 5.2 (`cli-surface`) Enforce operation-specific flag isolation for prepare, preview, normal apply, and recovery before writes; retain the 15-command top-level inventory and reject provider/legacy-generation/path override flags.
- [x] 5.3 (`cli-surface`) Extend the command-return registry and audit fixtures for prepare success/idempotency/usage/conflict, preview guide/complete/degraded paths, apply drift/recovery paths, and zero-provider behavior.
- [x] 5.4 (`cli-surface`) Add direct CLI integration coverage that asserts stdout success reports and stderr's single secret-safe failure envelope for guide, usage, conflict, and hard-stop cases.
- [x] 5.5 (`cli-surface`, `node-specification`) Register `state --confirm-migration-apply` as a controller-only closed operation with markerless/run/node/flag isolation, bounded confirmation output, state-journal/reset CAS diagnostics, and return-audit cases that prove failures leave state/target unchanged.

## 6. Controller and Command Guidance

- [x] 6.1 (`playbook-execution`) Add the explicit `migrate-import` preparation-to-Agent-authoring handoff before preview, reuse the CLI guide/checkpoint, and keep human semantic choice and exact hash/mode confirmation separate from routine mechanical preparation.
- [x] 6.2 (`commands-reference`) Update `COMMANDS.md`, `BOOTSTRAP.md`, migration workflow guidance, and legacy-maintenance reference to show prepare, Agent-authored structured bodies, guide recovery, complete preview, Controller-owned confirmation binding, degraded old-side explanation, and exact apply; do not document automatic prompt conversion or manual edits to `_generated/`, state, journals, or locks.
- [x] 6.3 (`playbook-execution`, `commands-reference`) Add or update controller/document coherence tests so every documented migration action maps to the registered CLI/state owner, retains the zero-provider/no-source-replacement boundary, and keeps every migration entry point in the same prepare-to-confirmation-to-apply order.
- [x] 6.4 (`playbook-execution`, `node-specification`) Make the playbook enter `confirm-html-migration` only after current preview evidence and use the confirmation transition before apply; cover `apply`, `revise`, and `decline` so only `apply` receives a receipt-bound active apply record.

## 7. Focused Verification and Completion

- [x] 7.1 Add unit coverage for candidate overlay receipt/confined resolution, candidate asset origin, preview-context forgery, palette seeding/diff output, legacy-ID preservation, slide preamble grammar, and exact `.DS_Store` topology handling.
- [x] 7.2 Add migration integration coverage from a synthetic bare markerless fixture through prepare, Agent-completed candidate, complete preview, receipt-bound confirmation, candidate/inherited and old-side evidence drift, exact apply, source/target drift, journal conflict/recovery, no scratch-byte promotion, and no legacy source-tree/generated-byte copy into the target.
- [x] 7.3 Add an end-to-end CLI fixture proving a real-shaped markerless migration reaches a clean HTML vNext with no provider call, while failed confirmation/prepare/preview/apply paths leave the source, state, and visible target set unchanged.
- [x] 7.4 Run targeted tests, `npm test`, and `npm run test:e2e`; record any baseline failure with its exact independent cause rather than a generic pre-existing label.
- [x] 7.5 Run `openspec validate complete-markerless-html-migration --strict`, review the command-return audit and changed-path diff, and update this checklist only after the corresponding verification passes.
