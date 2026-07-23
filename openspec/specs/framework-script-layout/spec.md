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

Vitest SHALL recursively discover unit/integration suites matching `tests/**/test_*.mjs` and `tests/**/test-*.mjs` for an explicit broad `sweep` command. Helper, fixture, benchmark, and evidence modules without those suite names SHALL remain importable or explicitly invoked without being misclassified as standalone suites. Test migration SHALL replace superseded private-wiring tests with tests at the owning Phase interface; it SHALL NOT layer new interface tests over redundant tests of the same behavior. Stable versioned pure contracts, goldens, and true external-adapter tests MAY remain direct in their owning directories.

`npm test` SHALL not invoke that recursive all-suite discovery. It SHALL invoke only `tests/contracts/run_development_verification.mjs`, a framework-script-layout-owned repository-verification tool that is not a production CLI or a Vitest test entry. The tool SHALL read only `tests/contracts/development-verification-core-v1.json` as the versioned core inventory. Its exact object keys SHALL be `schema`, `budget_ms`, and `entries`; `schema` SHALL equal `pptmaker-development-verification-core-v1`, `budget_ms` SHALL equal `60000`, and `entries` SHALL be a nonempty lexically sorted array of at most 16 unique exact repository-relative test entry paths confined beneath `tests/`. Every audited file SHALL be at most 1 MiB, and the combined admitted local closure SHALL contain at most 256 files and 8 MiB of source; exceeding any of these input limits SHALL return `invalid_inventory` before Vitest starts. That inventory SHALL be the sole membership authority for the core tier. A core entry must be pure Node and dependency-admitted before Vitest starts; the static architecture check may be core-eligible, but browser/renderer/provider load-closure probes are not.

The verifier SHALL validate inventory shape, existence, uniqueness, confinement, and supported entry naming; inspect each entry's repository-local `.mjs` closure with a dependency-free conservative ESM lexer; and invoke only the already-installed local Vitest entry. The lexer SHALL tokenize comments, strings, and template literals sufficiently to ignore their import-like prose while scanning `${...}` template expressions as code. It SHALL recognize side-effect imports, binding imports, `export { ... } from`, `export * from`, `export * as name from`, and local/declaration exports with no source edge; it SHALL reject every dynamic `import()`, import attribute/assertion, `require`, `createRequire`, `node:module`, or import/export syntax it cannot classify. Its only supported non-local specifiers SHALL be exact `vitest` and non-prohibited `node:` built-ins; every other bare/package specifier SHALL be invalid. A local specifier SHALL be a relative `.mjs` path resolving without package resolution to a regular repository file beneath `tests/contracts/`, `PPTMAKER_FRAMEWORK/scripts/contracts/`, or `PPTMAKER_FRAMEWORK/scripts/shared/cli/`; absolute paths, `file:` URLs, extension probing, and all other local roots SHALL be invalid for core. It SHALL reject closures that directly or transitively load Canvas, Chromium/Playwright, PPTX, ECharts, HTML compositor/runtime, provider transport/client, `node:child_process`, or network primitives including `fetch`, `WebSocket`, and Node HTTP/DNS/socket modules. This prevents an admitted core test from starting an unowned descendant outside the verifier's bounded shutdown. This fixed grammar/root boundary SHALL not be weakened by a per-inventory exception, directory exclusion, partial fallback inventory, or runtime-load probe, and no parser package may admit a rejected closure.

Admission SHALL evaluate one fixed prerequisite order and stop at its first failure: exact inventory shape and declared limits; entry path/name/existence; local file/closure input limits; lexical import resolution and dependency prohibition; then installed-local-Vitest resolution and owned-child startup. It SHALL report only that earliest failed prerequisite and its one nearest repair action. It SHALL NOT resolve Vitest, start a child, or report dependent symptoms after an inventory/admission failure.

The verifier SHALL capture bounded child output without forwarding raw Vitest progress, enforce the fixed budget independently of Vitest's test timeout, and for every terminal outcome it controls write exactly one JSON line to its own stdout. That summary's exact keys SHALL be `schema`, `tier`, `result`, `duration_ms`, `next_action`, and optional `failure_tail`; `schema` SHALL be `development-verification-v1`, `tier` SHALL be `core`, `result` SHALL be one of `passed`, `failed`, `timed_out`, `invalid_inventory`, or `unavailable`, `duration_ms` SHALL be an integer from `0` through `60000` measured from runner process entry, `next_action` SHALL be one nonempty string, and the serialized UTF-8 `failure_tail` value SHALL be JSON-escaped and at most 8192 bytes. NPM's script banner is outside this verifier-stdout contract. `unavailable` SHALL cover failure to resolve the installed local Vitest entry or to start the verifier's owned child. External termination of the verifier itself is outside this process-owned guarantee. The fixed 60,000-ms budget SHALL begin at runner process entry and include inventory/admission/local-Vitest preflight, child execution, owned graceful/forced shutdown, final summary, and exit: preflight has a 5,000-ms deadline, child execution has at most 50,000 ms, and the remaining 5,000 ms is the complete owned shutdown window, not an additional grace period. The fixed admission input limits and a linear lexer SHALL prevent preflight from becoming an unbounded scan; an input-limit breach is `invalid_inventory`, and a completed preflight exceeding its deadline SHALL return `timed_out` without starting a child. It SHALL exit zero only when the admitted core suite completes successfully within budget. Invalid inventory/dependency admission, unavailable local runner, failed core assertions, and budget expiry are non-waivable hard stops for claiming the core result; they protect deterministic, attributable short feedback and shall not retry, increase workers, detach a child, or start another tier.

The package surface SHALL be exact: `npm test` runs core; `npm run test:sweep` runs the recursive unit/integration sweep; `npm run test:focused -- <tests/.../test_*.mjs>` and `npm run test:render -- <tests/.../test_*.mjs>` each dispatch one selected unit/integration path; and `npm run test:e2e -- <tests_e2e/.../test_mock_*.mjs>` replaces the former broad E2E behavior with one selected mocked journey. The existing broad `test:watch` package script SHALL be removed. The documented npm invocation SHALL use `--` to pass its one path. The three selected-path scripts SHALL invoke `tests/contracts/run_selected_verification.mjs` with a fixed tier; that dispatcher SHALL accept exactly one path argument and no additional Vitest selector or flag. It SHALL invoke the already-installed local Vitest entry with `vitest.config.mjs` for `focused`/`render` and `vitest.e2e.config.mjs` for `journey`, while passing only the admitted exact path so neither config expands discovery. Missing, multiple, escaping, unsupported-name, or incompatible scope SHALL fail before a test child starts. `focused` and `render` SHALL select only a suite under `tests/`; a visual-engine closure SHALL mean a closure reaching Canvas, Chromium/Playwright, PPTX, ECharts, or HTML compositor/runtime, which render SHALL require and focused SHALL reject. `test:e2e` SHALL accept only a single repository-confined `tests_e2e/**/test_mock_*.mjs` journey. The recursive `sweep` command SHALL cover only unit/integration tests beneath `tests/`. No broad E2E package-script sweep SHALL be added or retained by this change; the selected journey's mock boundaries prevent browser/HTML compositor/Canvas/PPTX/ECharts initialization and provider/network calls. That journey verifies one public control route and SHALL not claim pixel or third-party runtime evidence. The Agent SHALL run core plus the minimum number of individually selected affected seams (`focused` and/or `render`) and, when cross-boundary evidence is needed, at most one selected mocked journey. A selected load-closure diagnostic SHALL use only command help and forbidden-module sentinels, never a browser, compositor, Canvas/PPTX/ECharts, or real provider. Render, load-closure, journey, and sweep work are explicit diagnostics or deliberate sampling, not default development completion gates.

#### Scenario: Nested Phase suite runs by default

- **WHEN** the explicit sweep command includes a suite under `tests/03-html-production/`
- **THEN** Vitest recursively discovers and executes it without a per-file include
- **AND** that suite is not thereby admitted to `npm test`

#### Scenario: Default core tier completes
- **WHEN** a developer runs `npm test` with a valid admitted inventory and all selected assertions pass
- **THEN** only the listed core entries execute
- **AND** the verifier exits zero within 60,000 ms
- **AND** the verifier stdout contains no raw Vitest progress and exactly one JSON line with keys `schema`, `tier`, `result`, `duration_ms`, and `next_action`
- **AND** that line has `schema: "development-verification-v1"`, `tier: "core"`, `result: "passed"`, a `duration_ms` integer no greater than `60000`, and one nonempty `next_action`

#### Scenario: Core admission rejects a prohibited or unauditable edge
- **WHEN** a listed core closure reaches a prohibited renderer/provider/network dependency or contains a dynamic/unclassifiable import
- **THEN** the verifier exits nonzero before launching Vitest
- **AND** its final summary has `result: "invalid_inventory"`, a bounded dependency path, and one repair action
- **AND** no browser, renderer, provider, network operation, or test child starts

#### Scenario: Admission reports the earliest prerequisite only
- **WHEN** an inventory is both malformed and contains a prohibited dependency fixture
- **THEN** the verifier reports only the malformed inventory root cause and its one repair action
- **AND** it does not read the fixture closure, resolve Vitest, or start a child

#### Scenario: Core admission permits only its fixed runtime boundary
- **WHEN** an otherwise admitted core suite imports exact `vitest` and non-prohibited `node:` built-ins
- **THEN** the lexer treats those as fixed runtime boundaries without traversing installed packages
- **AND** a different bare/package specifier or a local module outside the contract-safe roots produces `invalid_inventory` before Vitest starts

#### Scenario: Core admission rejects descendant-process creation
- **WHEN** a listed core closure imports `node:child_process`
- **THEN** the verifier returns `invalid_inventory` before Vitest starts
- **AND** the timeout path remains responsible only for its one owned Vitest child

#### Scenario: Comment prose is not an import edge
- **WHEN** a core fixture contains import-like text only in a comment or string and one supported literal static import
- **THEN** the lexer admits the literal edge and ignores the prose
- **AND** a real dynamic import in that fixture remains an `invalid_inventory` hard stop

#### Scenario: Only supported static ESM forms are admitted
- **WHEN** a mock-named core fixture contains each supported import/re-export form and local declaration exports
- **THEN** the lexer follows only the literal source edges and accepts the declaration-only exports
- **AND** a dynamic import inside a template expression, or a fixture using import attributes, `require`, `createRequire`, `node:module`, an absolute/file URL, or extensionless local resolution returns `invalid_inventory` before Vitest starts

#### Scenario: Core timeout has a definitive result
- **WHEN** an admitted core child exceeds its 50,000-ms execution window after successful preflight
- **THEN** the verifier terminates only its own child through the remaining 5,000-ms bounded owned shutdown window
- **AND** it emits one final `timed_out` summary and exits nonzero
- **AND** the total preflight, child execution, shutdown, summary, and exit budget remains 60,000 ms from runner process entry
- **AND** it neither scans/kills unrelated processes nor launches a retry or another tier

#### Scenario: Core preflight is bounded
- **WHEN** inventory validation, dependency admission, or local-Vitest resolution exceeds its 5,000-ms preflight window
- **THEN** the verifier emits one `timed_out` final summary and exits nonzero before starting a child
- **AND** its duration includes the preflight time and remains within the total 60,000-ms budget

#### Scenario: Core admission rejects oversized input
- **WHEN** the inventory has more than 16 entries, a local module exceeds 1 MiB, or the local closure exceeds 256 files or 8 MiB
- **THEN** the verifier emits `invalid_inventory` before starting a child
- **AND** it reports the first exceeded limit and its one repair action

#### Scenario: Local runner is unavailable
- **WHEN** the verifier cannot resolve installed local Vitest or cannot start its owned child
- **THEN** it emits exactly one nonzero `unavailable` final summary with the nearest local repair action
- **AND** it does not use `npx`, install a package, retry, or start another tier

#### Scenario: Opt-in scope is omitted or widened
- **WHEN** a developer invokes focused, render, or journey verification with no exact path or with multiple paths
- **THEN** the command fails before starting a test child
- **AND** it gives one bounded action to supply exactly one tier-appropriate path

#### Scenario: Opt-in command grammar is exact
- **WHEN** a developer supplies a second selector or Vitest flag after the selected path
- **THEN** `run_selected_verification.mjs` rejects the invocation before a child starts
- **AND** `test:focused` accepts only a non-visual suite under `tests/`, while `test:render` accepts only a visual-engine suite there

#### Scenario: Selected tier uses its owning Vitest configuration
- **WHEN** the dispatcher receives one admitted focused, render, or journey path
- **THEN** it runs only that path with `vitest.config.mjs` for focused/render or `vitest.e2e.config.mjs` for journey
- **AND** neither configuration's include pattern is allowed to add a second path

#### Scenario: E2E route is selected without a broad sweep
- **WHEN** a framework change needs cross-boundary evidence
- **THEN** the journey command accepts exactly one selected mocked path under `tests_e2e/`
- **AND** no package command expands that request into all E2E files
- **AND** the selected journey initializes no browser, compositor, Canvas/PPTX/ECharts, provider, or network client

### Requirement: Architecture validation is part of repository verification

The deterministic network-free `contracts/framework_architecture.mjs` check SHALL enforce the root whitelist, interfaces, Phase-4 ownership/isolation, import graph, Image2 isolation, executable registry, recursive tests, ownership manifest, canonical path-token ownership, and absence of old paths/`scripts/lib/`. It is tested through repository tests, not registered as a CLI, uses only framework/test roots, and never reads `deck_*` or `dpt_*`. The legacy-token registry and validator it consumes SHALL reside in a static-only contract module with no `node:child_process` dependency; subprocess documentation-command auditing SHALL remain in a separate opt-in module. Its static repository check SHALL be an eligible core entry only when it satisfies the core admission rule.

Temporary/synthetic subprocess load-closure probes for base doctor, an HTML-local command, and explicit whole-page provider selection SHALL be split from `tests/contracts/test_framework_architecture.mjs` into one explicit focused-only diagnostic entry. They SHALL use exact selected test paths, temporary/synthetic inputs, and forbidden-module sentinels; they prove command-selective closure but SHALL not be loaded by `npm test`. No transition bypass is permitted.

#### Scenario: Architecture drifts after a script is added

- **WHEN** a maintainer adds an unowned root script or cross-Phase private import
- **THEN** the static architecture check fails with the offending path and rule
- **AND** a core invocation reports the bounded failed-core result without starting a load-closure probe

#### Scenario: Static architecture closure remains core-admissible
- **WHEN** the core inventory selects `tests/contracts/test_framework_architecture.mjs`
- **THEN** its local closure reaches only the static coherence contract, not subprocess documentation auditing or load-closure probes
- **AND** core admission finds no `node:child_process` edge before Vitest starts

#### Scenario: Load-closure diagnostic is explicitly selected
- **WHEN** a maintainer explicitly selects the HTML-local or explicit whole-page-provider load-closure diagnostic
- **THEN** only that one probe runs with its forbidden-module sentinels
- **AND** it does not expand to browser, provider, all-E2E, or sweep verification

### Requirement: Mock verification artifacts are named explicitly

Every new test entry, fixture, or harness introduced by framework-script-layout verification whose primary evidence simulates a child process, dependency, renderer, provider, network boundary, or journey SHALL have `mock` as a standalone lowercase token in its basename, matching `(?:^|[_.-])mock(?:[_.-]|$)`, for example `test_mock_core_timeout.mjs` or `mock_prohibited_import.mjs`. The consuming test SHALL keep that mock path explicit. This token rule SHALL preserve compatibility with recursive `test_*.mjs` / `test-*.mjs` discovery when the mock is itself a test entry. Real-path core tests SHALL not be named as mocks merely because they use ordinary temporary files.

#### Scenario: Mock timeout evidence is visible in filenames
- **WHEN** the verifier timeout branch uses a simulated child process and its test entry
- **THEN** the mock fixture and mock test-entry paths contain a standalone `mock` token
- **AND** source review can distinguish them from a real Vitest or renderer process

### Requirement: Directory migration preserves observable behavior

The migration SHALL preserve `ppt_flow` commands/options/exits, stdout/stderr envelopes and diagnostics, artifact bytes/fingerprints, state/gate/reset/migration semantics, receipts, and explicit whole-page legacy behavior. Canonical repository-relative direct executable paths are the sole intentional compatibility break.

#### Scenario: Public regressions run after migration

- **WHEN** complete unit, E2E, doctor, benchmark, bundle, CLI, and documentation suites run
- **THEN** observable behavior remains compatible and HTML-local paths perform no provider call
