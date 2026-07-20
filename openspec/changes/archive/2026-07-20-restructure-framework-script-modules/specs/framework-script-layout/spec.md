## ADDED Requirements

### Requirement: Script root exposes exact lifecycle ownership

`PPTMAKER_FRAMEWORK/scripts/` SHALL contain root files `README.md` and `ppt_flow.mjs`; exact ownership directories `00-setup/`, `01-content/`, `02-visual-system/`, `03-html-production/`, `04-image2-refinement/`, `05-iteration/`, `shared/`, `contracts/`, `fonts/`, and `fixtures/`; and no other root entry. Root business scripts, `scripts/lib/`, a root `scripts/internal/`, and generic replacement dumping grounds SHALL NOT exist.

`shared/` SHALL contain only the categorized roots `cli/`, `run-bundle/`, `state/`, and `identity/`. The six numbered names SHALL use the same lifecycle/method-module vocabulary as `workflow/` and `playbook/`.

The architecture policy SHALL declare the public shared interface set explicitly: `shared/cli/cli_bootstrap.mjs`, `shared/cli/cli_error.mjs`, `shared/run-bundle/bundle_layout.mjs`, `shared/run-bundle/production_marker.mjs`, `shared/state/state.mjs`, `shared/state/md_controller_reader.mjs`, `shared/state/html_review_evidence.mjs`, `shared/identity/canonical_json.mjs`, `shared/identity/byte_hash.mjs`, `shared/identity/notes_receipt.mjs`, and `shared/identity/render_artifacts.mjs`. Other shared files SHALL be private. The only exact internal collaboration exception SHALL allow `shared/run-bundle/bundle_layout.mjs` and `shared/state/html_review_evidence.mjs` to import `shared/state/internal/html_review_evidence_core.mjs`; no other importer or directory/pattern exception is allowed, and the core SHALL NOT become a public interface. Legacy `image_provenance.mjs` SHALL live under `05-iteration/legacy-image2/internal/` and SHALL NOT be a public shared interface. `shared/run-bundle/lessons.mjs` SHALL remain a registered direct CLI adapter rather than a cross-owner library interface.

#### Scenario: Maintainer lists the scripts root

- **WHEN** the architecture checker inventories `PPTMAKER_FRAMEWORK/scripts/`
- **THEN** the entries exactly match the root whitelist
- **AND** no flat business `.mjs`, `lib/`, generic root `internal/`, or uncategorized shared entry exists

#### Scenario: Numeric ownership paths load under Node ESM

- **WHEN** a Phase interface is imported through a relative path containing `00-setup` through `05-iteration`
- **THEN** Node ESM loads it without renaming the directory or adding a non-numeric alias

### Requirement: Active Phases expose deep module interfaces

Each active Phase `00-setup`, `01-content`, `02-visual-system`, `03-html-production`, and `05-iteration` SHALL expose exactly one `index.mjs` interface. Callers and primary integration tests SHALL use that interface rather than private implementation paths. An interface SHALL expose cohesive Phase operations while hiding physical artifact paths, receipt/runtime/transaction mechanics, and private helper composition; it SHALL NOT blanket re-export every private function.

Every Phase interface SHALL be import-safe: importing `index.mjs` SHALL install no CLI bootstrap, parse no arguments, exit no process, perform no production filesystem write, launch no browser, initialize no provider, and eagerly load no operation-specific heavy/private implementation. Where command-selective loading is required, the interface SHALL use a string-literal dynamic import at the operation boundary so the architecture checker can still resolve the edge. Root `ppt_flow.mjs` SHALL load Phase interfaces by selected command/marker instead of eagerly loading every Phase at startup.

`04-image2-refinement/` SHALL contain only an unavailable `README.md` during this change and SHALL contain no `index.mjs`, executable, provider adapter, or imported implementation.

Phase 0 SHALL own base/package/browser/font/runtime readiness and expose its import-safe inspection interface to Phase 3; it SHALL NOT import Phase 5. The `00-setup/env-check.mjs` process adapter and root doctor SHALL coordinate optional legacy Image2 channel checks by running Phase 0 prerequisites first and lazily calling a Phase 5 public diagnostic operation only after explicit mode selection. Base checker loading SHALL not statically initialize Phase 5 or provider code. Phase 5 migration SHALL consume Phase 3 public migration-preview/materialization operations rather than renderer, object-store, or unified-pipeline private files.

#### Scenario: Caller enters HTML production

- **WHEN** a caller needs complete local Stage 1-5 production behavior
- **THEN** it imports the Phase 3 `index.mjs` interface
- **AND** does not import the renderer, object-store, review-evidence, or receipt implementation directly

#### Scenario: Phase 4 remains reserved

- **WHEN** architecture validation scans `04-image2-refinement/`
- **THEN** it finds only the unavailable README
- **AND** reports any executable, interface, or adapter as a failure

#### Scenario: Base doctor remains below production modules

- **WHEN** the Phase 0 interface is imported for base readiness
- **THEN** no Phase 3 renderer or Phase 5 provider private implementation is statically loaded
- **AND** Phase 3 consumes Phase 0 runtime readiness through its public interface

#### Scenario: HTML-local command has a bounded load closure

- **WHEN** a marked HTML run invokes a local validate/build command
- **THEN** no Phase 5 provider client, credential loader, legacy generator, or legacy contact-sheet implementation is loaded
- **AND** only the selected Phase operations and their declared shared/contracts dependencies initialize

### Requirement: Module imports follow the allowed direction

The architecture checker SHALL parse repo-local static Node ESM imports, `export ... from`, and string-literal dynamic `import()` edges and enforce this graph: root `ppt_flow.mjs` imports only active Phase interfaces and declared public shared interfaces under `shared/cli`, `shared/run-bundle`, and `shared/state`; an active Phase interface imports only its own implementation, declared public shared modules, versioned contracts, and the exact foreign Phase interfaces allowed below; an ordinary direct Phase CLI adapter imports only its own Phase `index.mjs` plus declared public shared modules; the exactly allowlisted cross-owner process adapters `ppt_flow.mjs`, `00-setup/env-check.mjs`, `03-html-production/unified_pipeline.mjs`, `03-html-production/stage1_build_inputs.mjs`, and `03-html-production/stage4_build_pptx.mjs` import only public Phase/shared interfaces; `shared/` imports only declared public shared modules and contracts; pure contract data/projection/generator modules import only contract-owned modules plus exact declared parser-package leaves required by their versioned format. Repository verification tools under `contracts/` MAY additionally use Node filesystem/child-process built-ins and declared public registry interfaces, but SHALL import no Phase/private production implementation or perform production writes. Node built-ins and dependencies declared by `package.json` SHALL remain allowed external leaves and SHALL not be classified as repository-owner edges. Broad bare-package permission inside contracts SHALL be forbidden; the architecture policy SHALL allowlist the exact parser package per pure contract module.

The exact foreign-Phase adjacency SHALL be `00-setup -> {}`, `01-content -> {}`, `02-visual-system -> {}`, `03-html-production -> {00-setup, 01-content, 02-visual-system}`, and `05-iteration -> {01-content, 02-visual-system, 03-html-production}`. Phase 4 SHALL have no graph node. Any other Phase edge SHALL fail even when it targets an `index.mjs`.

`shared/` SHALL NOT import a numbered Phase. Cross-category shared imports SHALL target declared public shared interfaces except for the exact two-importer review-core collaboration seam above. A Phase SHALL NOT import another Phase's `internal/`, direct executable, or physical artifact-path constant. Phase 3 SHALL consume Phase 0/1/2 behavior only through their interfaces. Phase 5 SHALL consume Phase 1/2 and initiate Phase 3 work only through those Phase interfaces. No lower Phase SHALL import Phase 5. Production Phases SHALL NOT import a contract generator tool. A Phase interface SHALL NOT import its direct CLI adapter, and importing an interface SHALL NOT install CLI bootstrap or execute process behavior.

The canonical JSON implementation SHALL live under `contracts/canonical_json.mjs`; the declared public `shared/identity/canonical_json.mjs` facade SHALL delegate to it without a second implementation, and contracts SHALL NOT import that shared facade. The provider-neutral shared identity interface SHALL own cross-branch final-slide record schemas/fingerprints and pure verification of caller-supplied confined bytes/records. It SHALL discover no branch owner path, open or write no branch manifest, scan no legacy directory, and import neither Phase 3/5 implementation nor `fast-png`/`@napi-rs/canvas`. Phase 3 SHALL own HTML object paths, current-manifest reads/writes, PNG decoding/dimension checks, locks, and commits. Phase 5 SHALL own legacy generation/raw-render manifests, file discovery, profile matching, provenance repair/materialization, image decoding, and legacy final-slide adaptation. Generic `sha256Bytes`/`sha256File` SHALL come from `shared/identity/byte_hash.mjs`; a `stableJson` alias SHALL NOT be retained.

#### Scenario: Shared state imports Phase 3 internals

- **WHEN** a module under `shared/state/` statically imports a file under `03-html-production/`
- **THEN** architecture validation fails with importer, imported path, and violated rule

#### Scenario: Phase 5 requests a local rebuild

- **WHEN** Phase 5 needs Phase 3 production behavior
- **THEN** its import resolves to `03-html-production/index.mjs`
- **AND** no Phase 3 private or direct-CLI path is imported

#### Scenario: Front controller uses cross-cutting state

- **WHEN** `ppt_flow.mjs` handles `state` or `status`
- **THEN** it may import the declared public shared state interface
- **AND** it does not route through an unrelated Phase wrapper or import shared private implementation

#### Scenario: Contract generator reaches into Phase 2

- **WHEN** a generator under `contracts/` imports `02-visual-system/index.mjs` or its private implementation
- **THEN** architecture validation fails the contracts-to-Phase edge

#### Scenario: Unified pipeline preserves both branches without private imports

- **WHEN** the migrated `03-html-production/unified_pipeline.mjs` is scanned
- **THEN** it may import the Phase 3 and Phase 5 public interfaces after marker-first routing
- **AND** it imports no private branch implementation

#### Scenario: Migration renders through Phase 3 interface

- **WHEN** Phase 5 creates or applies an HTML migration preview
- **THEN** it calls the Phase 3 public migration operation
- **AND** imports no Phase 3 renderer, object-store, or unified-pipeline private file

#### Scenario: Shared artifact resolver stays phase-neutral

- **WHEN** shared identity resolves a verified current final slide
- **THEN** it uses shared schemas/read helpers without importing Phase 3 publication/locking implementation

### Requirement: Legacy and future Image2 ownership remain isolated

Markerless whole-page Image2 generation, style-master, contact-sheet, and header-lock maintenance SHALL live under `05-iteration/legacy-image2/`. No ordinary HTML Phase 3 or local iteration path SHALL import or initialize that implementation. Change 4 SHALL add no modern Image2 implementation.

The future modern provider transport port SHALL be reserved as a private Phase 4 seam to be introduced only with both a production adapter and test fake by its owning later change. Change 4 SHALL NOT add a placeholder port, pass-through adapter, or shared legacy/modern business implementation.

#### Scenario: HTML production imports legacy transport

- **WHEN** architecture validation finds a Phase 3 import into `05-iteration/legacy-image2/`
- **THEN** validation fails and identifies an Image2 ownership crossover

#### Scenario: Change 4 tries to prebuild the future port

- **WHEN** Phase 4 contains transport code or a provider adapter before the refinement change
- **THEN** architecture validation fails the Phase-4 absence contract

### Requirement: Direct executables have path-qualified ownership

The registered direct executable inventory SHALL use normalized repository-relative paths and SHALL include exactly the fourteen paths defined by the `cli-surface` delta. The canonical registry SHALL live in `scripts/contracts/executable_inventory.mjs`; `shared/cli/cli_error.mjs` MAY consume/re-export it, and architecture/CLI tests SHALL compare against it. Basename-only registration SHALL be forbidden.

`shared/cli/cli_bootstrap.mjs`, `shared/cli/cli_error.mjs`, and `contracts/executable_inventory.mjs` SHALL use only Node built-ins and pure checked-in data so the direct Phase-0 env checker remains usable before `npm install`. They SHALL NOT import Commander, YAML, a numbered Phase, or any other npm package. Phase/runtime/provider code SHALL be reached from env-check only by string-literal dynamic import after its prerequisite/mode gate.

Old root direct paths SHALL be removed after every active delegation, documentation reference, diagnostic invocation, test, and audit moves to the canonical owner path. Compatibility shim files at old paths SHALL NOT remain.

#### Scenario: Two owners contain the same executable basename

- **WHEN** executable discovery finds duplicate basenames under different owners
- **THEN** path-qualified inventory still distinguishes them
- **AND** any unregistered direct-entry path fails validation

#### Scenario: Old env-check shim remains

- **WHEN** `PPTMAKER_FRAMEWORK/scripts/00-setup/env-check.mjs` exists after migration
- **THEN** old-path validation fails rather than treating it as a compatibility alias

### Requirement: Unit and E2E trees mirror source ownership

`tests/` SHALL contain exactly the ownership roots `00-setup/`, `01-content/`, `02-visual-system/`, `03-html-production/`, `04-image2-refinement/`, `05-iteration/`, `shared/`, `contracts/`, and `helpers/`. `tests_e2e/` SHALL contain exactly `00-setup/`, `01-content/`, `02-visual-system/`, `03-html-production/`, `04-image2-refinement/`, `05-iteration/`, and `helpers/`. Neither test root SHALL contain a business `.mjs` file directly, including a non-`test_*` CI/evidence script.

Fresh HTML delivery journeys SHALL belong to `tests_e2e/03-html-production/`; structural, migration, and markerless legacy journeys SHALL belong to `tests_e2e/05-iteration/`; shared state-machine and lessons journeys SHALL belong to `tests_e2e/shared/state/` and `tests_e2e/shared/run-bundle/`; future paid refinement journeys SHALL belong to `tests_e2e/04-image2-refinement/`. Test helpers SHALL construct inputs, temporary directories, and adapters only and SHALL NOT copy production parser, state, fingerprint, or path rules.

An ownership directory with no current suite SHALL contain a short non-executable `README.md` so the physical owner remains present in Git. Phase 4 test/E2E READMEs SHALL state that modern refinement is unavailable in Change 4 and SHALL NOT claim executable coverage.

#### Scenario: Root business test remains flat

- **WHEN** `tests/test_*.mjs` or `tests_e2e/test-*.mjs` contains a business suite after migration
- **THEN** ownership validation fails and names the required owner classification

#### Scenario: Fresh HTML flow is classified

- **WHEN** the public init-to-PPTX HTML journey is located
- **THEN** it is under `tests_e2e/03-html-production/`
- **AND** no duplicate Phase-5 copy is retained

#### Scenario: Shared state journey keeps its owner

- **WHEN** the state-machine E2E journey is assigned in the ownership manifest
- **THEN** it resides under `tests_e2e/shared/state/`
- **AND** it is not relabeled as Phase 5 merely because iteration consumes state

### Requirement: Source-to-test ownership is machine-readable

A checked-in `tests/contracts/source-test-ownership-v1.json` manifest SHALL use schema `pptmaker-source-test-ownership-v1` and sorted `owners[]` entries with normalized repository-relative `interfaces`, `executables`, `unit_integration`, and `e2e` arrays. It SHALL map every active Phase interface, declared public shared interface, declared executable/architecture/canonical/source-AST/review-projection contract interface, and registered direct executable to exactly one unit/integration owner and zero or more owning E2E journeys. Every referenced source and test SHALL exist under its declared Phase or categorized shared ownership root; missing ownership, multiple owners, an ownership-directory mismatch, a manifest executable union that differs from the canonical registry, and old flat paths SHALL fail closed. Shared state/run-bundle E2E SHALL live under `tests_e2e/shared/{state,run-bundle}` rather than a numbered Phase.

The manifest SHALL record ownership only and SHALL NOT duplicate CLI diagnostic schemas, state schemas, run-bundle paths, or production behavior.

#### Scenario: Phase interface lacks a test owner

- **WHEN** an active `index.mjs` has no unit/integration mapping
- **THEN** manifest validation fails and names the unmapped interface

#### Scenario: One suite claims two Phase owners

- **WHEN** the same test path is assigned to two different Phase owners
- **THEN** manifest validation fails with both conflicting entries

### Requirement: Test discovery is recursive and replacement-oriented

Vitest SHALL recursively discover unit/integration suites matching `tests/**/test_*.mjs` and `tests/**/test-*.mjs`. Helper, fixture, benchmark, and CI evidence modules without those suite names SHALL remain importable or explicitly invoked without being misclassified as default Vitest suites. Test migration SHALL replace superseded private-wiring tests with tests at the owning Phase interface; it SHALL NOT layer new interface tests over redundant tests of the same behavior. Stable versioned pure contracts, golden fixtures, and true external-adapter tests MAY remain direct in their owning directories.

#### Scenario: Nested Phase suite runs in the default command

- **WHEN** `npm test` runs with a suite under `tests/03-html-production/`
- **THEN** Vitest discovers and executes it without an explicit per-file include

#### Scenario: Interface test covers old private behavior

- **WHEN** a migrated Phase interface test verifies the same observable behavior as an old helper-wiring test
- **THEN** the old redundant test is removed rather than retained as another layer

### Requirement: Architecture validation is part of repository verification

One deterministic network-free architecture check at `scripts/contracts/framework_architecture.mjs` SHALL enforce the script root whitelist, active Phase interface inventory, Phase-4 absence contract, static and literal-dynamic import graph, legacy/modern Image2 isolation, path-qualified executable inventory, recursive test discovery, source-to-test ownership manifest, canonical run-bundle path-token ownership, and absence of old direct paths and `scripts/lib/`. It SHALL be imported by tests rather than registered as a direct CLI.

Before physical cutover, its rules MAY be tested only against explicit synthetic target-tree fixtures and inventories. It SHALL join default repository verification only when the real tree has atomically moved. The checked-in final implementation SHALL expose no transition mode, bypass environment variable, or broad exception that permits the old and new architectures simultaneously.

Failures SHALL identify the offending path and rule. The check SHALL use only framework source roots and test fixtures; it SHALL NOT read `deck_*` or `dpt_*` data.

Repository verification SHALL also run deterministic subprocess load-closure probes for base doctor, one HTML-local command, and one markerless provider command. The probes SHALL use temporary/synthetic inputs and forbidden-module sentinels to prove that unselected Phase heavy/provider implementations are not initialized. Static graph legality alone SHALL NOT satisfy this requirement.

#### Scenario: Architecture drifts after a new script is added

- **WHEN** a maintainer adds a root business file, cross-Phase private import, literal dynamic private import, duplicated run-bundle path constant, or unowned direct executable
- **THEN** the default repository verification fails with the exact path and violated architecture rule

#### Scenario: Checker is developed before cutover

- **WHEN** the repository still contains the old flat tree while checker logic is under development
- **THEN** focused checker tests use synthetic target-tree fixtures rather than weakening the final rules
- **AND** default final-architecture enforcement is enabled only with the atomic real-tree cutover

### Requirement: Directory migration preserves observable behavior

The migration SHALL preserve the canonical `ppt_flow` command names, options, exit behavior, stdout formats, stderr envelopes, diagnostics, artifact bytes and fingerprints, state/gate/reset/migration semantics, receipts, and markerless legacy behavior. It SHALL introduce no run-bundle path or state/schema change. Changes to canonical repository-relative direct executable paths are the only intentional compatibility break.

#### Scenario: Public HTML and legacy regressions run after migration

- **WHEN** the complete unit, E2E, doctor, benchmark, bundle, CLI, and documentation suites run against the migrated tree
- **THEN** observable behavior matches the pre-migration contracts
- **AND** no provider call is introduced on HTML/local-only paths
