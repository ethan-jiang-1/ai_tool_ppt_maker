## Why

Change 3 made HTML-first delivery complete, but its implementation left `PPTMAKER_FRAMEWORK/scripts/` with 17 root `.mjs` files and 31 flat `lib/*.mjs` modules, while `tests/` remains similarly flat. The workflow and playbook trees now express Phase 0-5 ownership clearly, but the code and verification trees still require filename memory; adding modern Image2 refinement on top of that shape would make HTML, legacy Image2, paid refinement, state, and CLI ownership progressively harder for maintainers and Agents to distinguish.

Before paid refinement is introduced, the repository needs one behavior-preserving architecture change that makes physical paths, module interfaces, import direction, and source-to-test ownership describe the same lifecycle. This change is framework repository maintenance only; it follows the planning checkpoint recorded in `_backlog/plans/html-first-progressive-rendering*` and does not change run-bundle production semantics.

## What Changes

- Add an exact, machine-validated script architecture: one canonical root `ppt_flow.mjs` front controller; Phase-owned `00-setup/` through `05-iteration/` modules; categorized `shared/`; and versioned `contracts/`, `fonts/`, and `fixtures/` resources.
- Require each active Phase module to expose one small `index.mjs` interface while keeping its implementation private; reject `shared -> phase`, cross-Phase private imports, physical artifact-path leakage, and a replacement generic `lib/`/`internal/` dumping ground.
- Physically isolate legacy whole-page Image2 maintenance under Phase 5 and reserve Phase 4 as README-only/non-executable until the later visual-slot refinement change.
- Mirror the same ownership vocabulary in `tests/` and `tests_e2e/`; make unit/integration tests exercise Phase/shared interfaces, assign E2E journeys to their final numbered-Phase or categorized-shared owner, and keep helpers free of production business rules.
- Add a machine-readable source-to-test ownership manifest plus root-whitelist, Phase-interface, executable-inventory, import-direction, recursive-test-discovery, and old-path audits.
- **BREAKING:** move standalone/direct executable files to their owning Phase paths and atomically update `ppt_flow` delegation, diagnostics, documentation, controller references, executable audits, and tests. `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs ...` remains the single stable user-facing entrypoint; old direct paths are removed rather than retained as a shim collection.
- Preserve all existing HTML-first, structural, migration, reset/review, notes, PPTX, doctor, and markerless legacy behavior. Do not add a modern Image2 command, controller, adapter, authorization record, or provider call.

## Capabilities

### New Capabilities

- `framework-script-layout`: Owns the exact `scripts/`, `tests/`, and `tests_e2e/` ownership trees; Phase module interfaces; allowed import graph; direct executable and source-to-test manifests; path migration rules; and architecture self-checks.

### Modified Capabilities

- `framework-directory-layout`: Distinguishes the existing five-directory framework soft bundle from the new delegated script/test subtree authority and requires all active cross-references to use the migrated paths.
- `cli-surface`: Keeps `ppt_flow.mjs` stable while changing registered direct executable paths, delegation targets, diagnostic invocations, recursive executable audits, and old-path rejection.
- `commands-reference`: Updates canonical command examples and routing references to the Phase-owned script paths without changing user intent classification.
- `bootstrap-env-guidance`: Updates environment repair and direct diagnostic invocations to the Phase 0 script interface while preserving beginner-facing readiness behavior.
- `framework-charter`: Makes code/test ownership navigation and Phase-interface discipline part of active framework guidance without changing MD Controller ownership.
- `playbook-execution`: Requires registered controllers and their machine validation to reference the migrated executable/interface paths and forbids Phase 4 execution during this architecture-only change.
- `environment-check`: Moves the zero-dependency checker to the Phase 0 owner path while preserving every readiness mode, check, exit, and offline-startup guarantee.
- `lessons-management`: Moves the direct lessons CLI under categorized shared run-bundle ownership and keeps its bundle-layout dependency on the canonical public interface.
- `node-specification`: Moves state, controller-reader, and HTML review-evidence interfaces out of generic `scripts/lib/` into categorized shared state ownership without changing the consumer protocol.
- `run-bundle-layout`: Updates the physical location of the existing `bundle_layout.mjs` machine authority without changing any run-bundle directory or path constant.
- `run-bundle-management`: Updates the direct layout/scaffold CLI and shared state interface paths while preserving init/check/new-version/self-check behavior.
- `pipeline-orchestration`: Places the existing multi-branch `unified_pipeline.mjs` adapter under Phase 3 while preserving its marker-first delegation to the public HTML and legacy Phase interfaces.

## Impact

- **Domain/control owner:** Framework repository maintenance. MD Controllers continue to own workflow; JS/CLI behavior remains deterministic and unchanged; no `deck_*` or `dpt_*` data is read or used as a fixture.
- **Code:** Most files under `PPTMAKER_FRAMEWORK/scripts/` move; imports and direct-entry detection change; `scripts/lib/` is removed; a new architecture manifest/checker is introduced.
- **Specs:** Every capability that normatively names a moved path receives a delta; non-requirement purpose/path summaries are refreshed during the implementation cutover so pre-archive main-spec coherence contains no competing old location.
- **Tests:** Existing unit/integration/E2E files move into mirrored ownership directories; Vitest unit discovery becomes recursive; interface-level tests replace shallow path-coupled tests where appropriate.
- **Compatibility:** The canonical `ppt_flow.mjs` command and all observable command names, envelopes, exit behavior, artifacts, receipts, state, and generated bytes remain stable. Direct internal script paths are intentionally breaking and updated atomically across all active framework references.
- **Dependencies/runtime:** No new runtime dependency, provider access, Python/shell production path, run-bundle path, or Phase 4 feature is introduced.
- **Verification:** Requires architecture/import/source-test audits plus the complete Change-3 unit, E2E, doctor, benchmark, bundle, CLI, docs, strict OpenSpec, and scope regression suite.
