## Purpose

Define the canonical ownership, dependency, executable, and test layout for `PPTMAKER_FRAMEWORK/scripts/` after the framework script-module restructuring.

## Requirements

### Requirement: Script root exposes exact lifecycle ownership

`scripts/` SHALL contain only `README.md`, `ppt_flow.mjs`, lifecycle directories `00-setup/` through `05-iteration/`, and categorized `shared/`, `contracts/`, `fonts/`, and `fixtures/` roots. Root business scripts, `scripts/lib/`, root `internal/`, and generic dumping grounds SHALL NOT exist. `shared/` SHALL contain only `cli/`, `run-bundle/`, `state/`, and `identity/`; all other shared files are private apart from declared public CLI, run-bundle, state, and identity interfaces.

#### Scenario: Maintainer lists the scripts root

- **WHEN** architecture validation inventories `scripts/`
- **THEN** it enforces the root whitelist and rejects flat business files, `lib/`, root `internal/`, or uncategorized shared entries

### Requirement: Active Phases expose deep module interfaces

Each active Phase `00-setup`, `01-content`, `02-visual-system`, `03-html-production`, `04-image-production`, and `05-iteration` SHALL expose exactly one import-safe `index.mjs` interface. Image Production SHALL additionally expose `whole-page` and `visual-slot` public adapters. Callers and integration tests SHALL use those interfaces rather than private physical paths. Importing one SHALL not bootstrap a CLI, parse arguments, write production data, launch a browser, initialize a provider, or eagerly load operation-specific implementation. Root `ppt_flow.mjs` SHALL select interfaces by canonical mode/direct evidence. Whole-page direct executables live under its adapter; visual-slot keeps its private injectable transport. Shared modules and foreign adapters SHALL not import either adapter's private implementation.

Phase 0 owns local readiness and remains provider-free. Its direct adapter and root doctor may lazily invoke Phase 5's public provider diagnostic only after prerequisites and explicit Image2-mode selection. Phase 5 migration SHALL use Phase 3 public migration operations.

#### Scenario: Base doctor remains below production modules

- **WHEN** Phase 0 is imported for base readiness
- **THEN** neither Phase-3 renderer internals nor any Phase-4/Phase-5 provider implementation is statically loaded

### Requirement: Module imports follow the allowed direction

Architecture validation SHALL parse repository-local static, re-export, and string-literal dynamic ESM edges. Root may import active Phase interfaces and declared public shared CLI/run-bundle/state interfaces. A Phase may import its own implementation, public shared interfaces, versioned contracts, and only these foreign Phase interfaces: `00-setup -> {}`, `01-content -> {}`, `02-visual-system -> {}`, `03-html-production -> {00-setup,01-content,02-visual-system}`, `04-image-production -> {01-content,02-visual-system,03-html-production}`, and `05-iteration -> {01-content,02-visual-system,03-html-production,04-image-production}`.

Shared modules SHALL not import a Phase. Phases SHALL not import another Phase's private implementation, direct executable, or artifact-path constant. The exact cross-owner process adapters are root `ppt_flow.mjs`, `00-setup/env-check.mjs`, and Phase-3 `unified_pipeline.mjs`, `stage1_build_inputs.mjs`, and `stage4_build_pptx.mjs`; each may coordinate only through public interfaces. Contracts remain Phase-free. Canonical JSON lives in `contracts/canonical_json.mjs`, with a shared facade delegating to it; shared identity stays provider-neutral and does not discover, read, or write branch-owned manifests.

#### Scenario: Phase 5 requests a local rebuild

- **WHEN** Phase 5 needs Phase 3 behavior
- **THEN** it imports `03-html-production/index.mjs`, never a private or direct-CLI path

#### Scenario: Refinement reaches legacy private generation

- **WHEN** architecture validation finds Phase 4 importing `04-image-production/whole-page/`
- **THEN** it rejects the ownership crossover

### Requirement: Legacy and future Image2 ownership remain isolated

Whole-page Image2 generation, style-master, contact-sheet, and header-lock implementation SHALL live under `04-image-production/whole-page/`; `05-iteration` retains routing/migration/compatibility only. Visual-slot refinement remains a distinct adapter and SHALL never become an ordinary HTML renderer. HTML Phase 3/local iteration SHALL not import or initialize either provider implementation.

#### Scenario: HTML production imports modern transport

- **WHEN** architecture validation finds a Phase-3 import into Phase-4 private transport
- **THEN** validation fails and identifies the Image2 ownership crossover

### Requirement: Direct executables have path-qualified ownership

The canonical `contracts/executable_inventory.mjs` registry SHALL contain the fifteen normalized owner-relative executable paths specified by `cli-surface`; basename-only registration is forbidden. Bootstrap/error helpers and the registry use only Node built-ins and checked-in data so direct Phase-0 env-check works before installation. Old direct paths and compatibility shims SHALL not remain after callers, documentation, diagnostics, and audits move to canonical ownership.

#### Scenario: Duplicate executable basenames are found

- **WHEN** discovery finds a direct entry missing from the path-qualified registry
- **THEN** architecture verification fails with that canonical owner path

### Requirement: Unit and E2E trees mirror source ownership

`tests/` and `tests_e2e/` SHALL retain their numbered Phase/shared/contracts ownership roots. Phase 4 SHALL contain its owned unit and E2E refinement suites; helpers remain non-business input/fake constructors. HTML delivery journeys remain Phase 3 and legacy whole-page journeys remain Phase 5. Root business test files are forbidden.

#### Scenario: Fresh HTML flow is classified

- **WHEN** the public init-to-PPTX HTML journey is located
- **THEN** it is owned by `tests_e2e/03-html-production/` without a duplicate Phase-5 copy

#### Scenario: Modern refinement journey is classified

- **WHEN** a public authorized refinement journey is located
- **THEN** it belongs under `tests_e2e/04-image-production/` and is not duplicated under Phase 5

### Requirement: Source-to-test ownership is machine-readable

`tests/contracts/source-test-ownership-v1.json` SHALL use schema `pptmaker-source-test-ownership-v1` with sorted ownership entries. It SHALL map every active Phase interface, public shared interface, declared contract interface, and registered executable to exactly one unit/integration owner and zero or more owning E2E journeys. Missing, duplicate, mismatched, stale-flat-path, or registry-divergent entries fail closed.

#### Scenario: Phase interface lacks a test owner

- **WHEN** an active `index.mjs` lacks its unit/integration mapping
- **THEN** manifest validation fails and names the interface

### Requirement: Test discovery is recursive and replacement-oriented

Vitest SHALL recursively discover `tests/**/test_*.mjs` and `tests/**/test-*.mjs`. Helpers, fixtures, benchmarks, and evidence modules remain importable or explicitly invoked without becoming default suites. Interface tests replace redundant private-wiring tests; stable pure contracts, goldens, and real adapter seams may remain direct.

#### Scenario: Nested Phase suite runs by default

- **WHEN** `npm test` includes a suite under `tests/03-html-production/`
- **THEN** Vitest discovers and executes it without a per-file include

### Requirement: Architecture validation is part of repository verification

The deterministic network-free `contracts/framework_architecture.mjs` check SHALL enforce the root whitelist, interfaces, Phase-4 ownership/isolation, import graph, Image2 isolation, executable registry, recursive tests, ownership manifest, canonical path-token ownership, and absence of old paths/`scripts/lib/`. It is tested through repository tests, not registered as a CLI, uses only framework/test roots, and never reads `deck_*` or `dpt_*`. Default verification also includes temporary/synthetic load-closure probes for base doctor, an HTML-local command, and markerless provider selection. No transition bypass is permitted.

#### Scenario: Architecture drifts after a script is added

- **WHEN** a maintainer adds an unowned root script or cross-Phase private import
- **THEN** default verification fails with the offending path and rule

### Requirement: Directory migration preserves observable behavior

The migration SHALL preserve `ppt_flow` commands/options/exits, stdout/stderr envelopes and diagnostics, artifact bytes/fingerprints, state/gate/reset/migration semantics, receipts, and markerless legacy behavior. Canonical repository-relative direct executable paths are the sole intentional compatibility break.

#### Scenario: Public regressions run after migration

- **WHEN** complete unit, E2E, doctor, benchmark, bundle, CLI, and documentation suites run
- **THEN** observable behavior remains compatible and HTML-local paths perform no provider call
