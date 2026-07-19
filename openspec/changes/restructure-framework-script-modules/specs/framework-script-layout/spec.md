## ADDED Requirements

### Requirement: Script root exposes exact lifecycle ownership

`PPTMAKER_FRAMEWORK/scripts/` SHALL contain root files `README.md` and `ppt_flow.mjs`; exact ownership directories `00-setup/`, `01-content/`, `02-visual-system/`, `03-html-production/`, `04-image2-refinement/`, `05-iteration/`, `shared/`, `contracts/`, `fonts/`, and `fixtures/`; and no other root entry. Root business scripts, `scripts/lib/`, a root `scripts/internal/`, and generic replacement dumping grounds SHALL NOT exist.

`shared/` SHALL contain only the categorized roots `cli/`, `run-bundle/`, `state/`, and `identity/`. The six numbered names SHALL use the same lifecycle/method-module vocabulary as `workflow/` and `playbook/`.

#### Scenario: Maintainer lists the scripts root

- **WHEN** the architecture checker inventories `PPTMAKER_FRAMEWORK/scripts/`
- **THEN** the entries exactly match the root whitelist
- **AND** no flat business `.mjs`, `lib/`, generic root `internal/`, or uncategorized shared entry exists

#### Scenario: Numeric ownership paths load under Node ESM

- **WHEN** a Phase interface is imported through a relative path containing `00-setup` through `05-iteration`
- **THEN** Node ESM loads it without renaming the directory or adding a non-numeric alias

### Requirement: Active Phases expose deep module interfaces

Each active Phase `00-setup`, `01-content`, `02-visual-system`, `03-html-production`, and `05-iteration` SHALL expose exactly one `index.mjs` interface. Callers and primary integration tests SHALL use that interface rather than private implementation paths. An interface SHALL expose cohesive Phase operations while hiding physical artifact paths, receipt/runtime/transaction mechanics, and private helper composition; it SHALL NOT blanket re-export every private function.

`04-image2-refinement/` SHALL contain only an unavailable `README.md` during this change and SHALL contain no `index.mjs`, executable, provider adapter, or imported implementation.

#### Scenario: Caller enters HTML production

- **WHEN** a caller needs complete local Stage 1-5 production behavior
- **THEN** it imports the Phase 3 `index.mjs` interface
- **AND** does not import the renderer, object-store, review-evidence, or receipt implementation directly

#### Scenario: Phase 4 remains reserved

- **WHEN** architecture validation scans `04-image2-refinement/`
- **THEN** it finds only the unavailable README
- **AND** reports any executable, interface, or adapter as a failure

### Requirement: Static imports follow the allowed direction

The architecture checker SHALL parse static Node ESM imports and enforce this graph: root `ppt_flow.mjs` imports only active Phase interfaces and `shared/cli`; an active Phase imports only its own implementation, allowed categorized shared modules, versioned contracts, and another Phase's public interface where the lifecycle dependency requires it; `shared/` imports only categorized shared modules and contracts; contract data files have no imports; and contract generator tools may import only their owning public Phase interface plus shared identity helpers.

`shared/` SHALL NOT import a numbered Phase. A Phase SHALL NOT import another Phase's `internal/`, direct executable, or physical artifact-path constant. Phase 3 SHALL consume Phase 1/2 behavior only through their interfaces. Phase 5 SHALL initiate work owned by another Phase only through that Phase interface. Production Phases SHALL NOT import a contract generator tool.

#### Scenario: Shared state imports Phase 3 internals

- **WHEN** a module under `shared/state/` statically imports a file under `03-html-production/`
- **THEN** architecture validation fails with importer, imported path, and violated rule

#### Scenario: Phase 5 requests a local rebuild

- **WHEN** Phase 5 needs Phase 3 production behavior
- **THEN** its import resolves to `03-html-production/index.mjs`
- **AND** no Phase 3 private or direct-CLI path is imported

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

The registered direct executable inventory SHALL use normalized repository-relative paths and SHALL include exactly the canonical root front controller, Phase 0 environment checker, Phase 3 local Stage 1-5/orchestration CLIs, Phase 5 legacy Image2 CLIs, and categorized shared run-bundle CLIs defined by `cli-surface`. Basename-only registration SHALL be forbidden.

Old root direct paths SHALL be removed after every active delegation, documentation reference, diagnostic invocation, test, and audit moves to the canonical owner path. Compatibility shim files at old paths SHALL NOT remain.

#### Scenario: Two owners contain the same executable basename

- **WHEN** executable discovery finds duplicate basenames under different owners
- **THEN** path-qualified inventory still distinguishes them
- **AND** any unregistered direct-entry path fails validation

#### Scenario: Old env-check shim remains

- **WHEN** `PPTMAKER_FRAMEWORK/scripts/env-check.mjs` exists after migration
- **THEN** old-path validation fails rather than treating it as a compatibility alias

### Requirement: Unit and E2E trees mirror source ownership

`tests/` SHALL contain exactly the ownership roots `00-setup/`, `01-content/`, `02-visual-system/`, `03-html-production/`, `04-image2-refinement/`, `05-iteration/`, `shared/`, `contracts/`, and `helpers/`. `tests_e2e/` SHALL contain exactly `00-setup/`, `01-content/`, `02-visual-system/`, `03-html-production/`, `04-image2-refinement/`, `05-iteration/`, and `helpers/`.

Fresh HTML delivery journeys SHALL belong to `tests_e2e/03-html-production/`; structural, migration, and markerless legacy journeys SHALL belong to `tests_e2e/05-iteration/`; future paid refinement journeys SHALL belong to `tests_e2e/04-image2-refinement/`. Test helpers SHALL construct inputs, temporary directories, and adapters only and SHALL NOT copy production parser, state, fingerprint, or path rules.

#### Scenario: Root business test remains flat

- **WHEN** `tests/test_*.mjs` or `tests_e2e/test-*.mjs` contains a business suite after migration
- **THEN** ownership validation fails and names the required owner classification

#### Scenario: Fresh HTML flow is classified

- **WHEN** the public init-to-PPTX HTML journey is located
- **THEN** it is under `tests_e2e/03-html-production/`
- **AND** no duplicate Phase-5 copy is retained

### Requirement: Source-to-test ownership is machine-readable

A checked-in machine-readable manifest under `tests/contracts/` SHALL map every active Phase interface, shared interface, and registered direct executable to exactly one unit/integration owner and zero or more owning E2E journeys. Paths SHALL be normalized and repository-relative. Every referenced source and test SHALL exist under its declared ownership root; missing ownership, multiple owners, an ownership-directory mismatch, and old flat paths SHALL fail closed.

The manifest SHALL record ownership only and SHALL NOT duplicate CLI diagnostic schemas, state schemas, run-bundle paths, or production behavior.

#### Scenario: Phase interface lacks a test owner

- **WHEN** an active `index.mjs` has no unit/integration mapping
- **THEN** manifest validation fails and names the unmapped interface

#### Scenario: One suite claims two Phase owners

- **WHEN** the same test path is assigned to two different Phase owners
- **THEN** manifest validation fails with both conflicting entries

### Requirement: Test discovery is recursive and replacement-oriented

Vitest SHALL recursively discover unit/integration suites below `tests/`. Test migration SHALL replace superseded private-wiring tests with tests at the owning Phase interface; it SHALL NOT layer new interface tests over redundant tests of the same behavior. Stable versioned pure contracts, golden fixtures, and true external-adapter tests MAY remain direct in their owning directories.

#### Scenario: Nested Phase suite runs in the default command

- **WHEN** `npm test` runs with a suite under `tests/03-html-production/`
- **THEN** Vitest discovers and executes it without an explicit per-file include

#### Scenario: Interface test covers old private behavior

- **WHEN** a migrated Phase interface test verifies the same observable behavior as an old helper-wiring test
- **THEN** the old redundant test is removed rather than retained as another layer

### Requirement: Architecture validation is part of repository verification

One deterministic network-free architecture check SHALL enforce the script root whitelist, active Phase interface inventory, Phase-4 absence contract, allowed import graph, legacy/modern Image2 isolation, path-qualified executable inventory, recursive test discovery, source-to-test ownership manifest, and absence of old direct paths and `scripts/lib/`.

Failures SHALL identify the offending path and rule. The check SHALL use only framework source roots and test fixtures; it SHALL NOT read `deck_*` or `dpt_*` data.

#### Scenario: Architecture drifts after a new script is added

- **WHEN** a maintainer adds a root business file, cross-Phase private import, or unowned direct executable
- **THEN** the default repository verification fails with the exact path and violated architecture rule

### Requirement: Directory migration preserves observable behavior

The migration SHALL preserve the canonical `ppt_flow` command names, options, exit behavior, stdout formats, stderr envelopes, diagnostics, artifact bytes and fingerprints, state/gate/reset/migration semantics, receipts, and markerless legacy behavior. It SHALL introduce no run-bundle path or state/schema change. Changes to canonical repository-relative direct executable paths are the only intentional compatibility break.

#### Scenario: Public HTML and legacy regressions run after migration

- **WHEN** the complete unit, E2E, doctor, benchmark, bundle, CLI, and documentation suites run against the migrated tree
- **THEN** observable behavior matches the pre-migration contracts
- **AND** no provider call is introduced on HTML/local-only paths
