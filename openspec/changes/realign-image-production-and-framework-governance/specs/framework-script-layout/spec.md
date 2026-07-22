## MODIFIED Requirements

### Requirement: Active Phases expose deep module interfaces
Each active Phase `00-setup`, `01-content`, `02-visual-system`, `03-html-production`,
`04-image-production`, and `05-iteration` SHALL expose exactly one import-safe `index.mjs` interface.
Callers and integration tests SHALL use that interface rather than private physical paths. Importing one
SHALL not bootstrap a CLI, parse arguments, write production data, launch a browser, initialize a
provider, or eagerly load operation-specific implementation. Root `ppt_flow.mjs` SHALL select interfaces
by canonical command/mode evidence. Phase 4 owns public whole-page and visual-slot Image Production
interfaces; Phase 5 owns iteration and compatibility routing only. Shared modules and Phase-3 ordinary
HTML delivery SHALL not import a private Image Production implementation.

Phase 0 owns local readiness and remains provider-free. Its direct adapter and root doctor may lazily
invoke the Image Production public provider diagnostic only after prerequisites and explicit
Image2-mode selection. Phase 5 migration SHALL use Phase 3 public migration operations.

#### Scenario: Base doctor remains below production modules
- **WHEN** Phase 0 is imported for base readiness
- **THEN** neither Phase-3 renderer internals nor any Image Production provider implementation is statically loaded

#### Scenario: Public adapter is used
- **WHEN** a caller needs an Image Production operation
- **THEN** it imports the selected public `04-image-production` interface
- **AND** it does not import a retired executable or private implementation path

### Requirement: Module imports follow the allowed direction
Architecture validation SHALL parse repository-local static, re-export, and string-literal dynamic ESM
edges. Root may import active Phase interfaces and declared public shared CLI/run-bundle/state
interfaces. A Phase may import its own implementation, public shared interfaces, versioned contracts,
and only these foreign Phase interfaces: `00-setup -> {}`, `01-content -> {}`,
`02-visual-system -> {}`, `03-html-production -> {00-setup,01-content,02-visual-system}`,
`04-image-production -> {02-visual-system,03-html-production}`, and
`05-iteration -> {01-content,02-visual-system,03-html-production,04-image-production}`.

Shared modules SHALL not import a Phase. Phases SHALL not import another Phase's private
implementation, direct executable, or artifact-path constant. The exact cross-owner process adapters
are root `ppt_flow.mjs`, `00-setup/env-check.mjs`, and Phase-3 `unified_pipeline.mjs`,
`stage1_build_inputs.mjs`, and `stage4_build_pptx.mjs`; each may coordinate only through public
interfaces. Contracts remain Phase-free. Canonical JSON lives in `contracts/canonical_json.mjs`, with a
shared facade delegating to it; shared identity stays provider-neutral and does not discover, read, or
write branch-owned manifests.

#### Scenario: Iteration requests Image Production behavior
- **WHEN** Phase 5 compatibility routing needs Image Production behavior
- **THEN** it imports `04-image-production/index.mjs`, never a private or direct-CLI path

#### Scenario: HTML production imports private Image Production transport
- **WHEN** architecture validation finds a Phase-3 import into a private Image Production transport
- **THEN** validation fails and identifies the ownership crossover

### Requirement: Image Production adapters remain isolated from HTML production
Whole-page Image2 generation, style-master, contact-sheet, and header-lock implementation SHALL live
under the Image Production whole-page adapter. Authorized no-text visual-slot refinement SHALL live
under the Image Production visual-slot adapter. HTML Phase 3/local iteration SHALL not import or
initialize either provider implementation. Whole-page and visual-slot state, authorization, provenance,
and final-review facts SHALL remain with their existing direct owners and SHALL not be merged merely
because both adapters share a family root.

#### Scenario: HTML production imports Image Production transport
- **WHEN** architecture validation finds a Phase-3 import into either private Image Production transport
- **THEN** validation fails and identifies the Image Production ownership crossover

### Requirement: Unit and E2E trees mirror source ownership
`tests/` and `tests_e2e/` SHALL retain their numbered Phase/shared/contracts ownership roots. Image
Production SHALL contain the owned whole-page and visual-slot unit and E2E suites; helpers remain
non-business input/fake constructors. HTML delivery journeys remain Phase 3 and mode-aware
iteration/compatibility journeys remain Phase 5. Root business test files are forbidden.

#### Scenario: Fresh HTML flow is classified
- **WHEN** the public init-to-PPTX HTML journey is located
- **THEN** it is owned by `tests_e2e/03-html-production/` without an Image Production duplicate

#### Scenario: Visual-slot refinement journey is classified
- **WHEN** a public authorized visual-slot refinement journey is located
- **THEN** it belongs under `tests_e2e/04-image-production/` and is not duplicated under Phase 5

### Requirement: Architecture validation is part of repository verification
The deterministic network-free `contracts/framework_architecture.mjs` check SHALL enforce the root
whitelist, interfaces, Image Production ownership/isolation, import graph, executable registry,
recursive tests, ownership manifest, canonical path-token ownership, the exact legacy-token exception
inventory, and absence of retired active paths/`scripts/lib/`. It is tested through repository tests,
not registered as a CLI, uses only framework/test roots, and never reads `deck_*` or `dpt_*`. Default
verification also includes temporary/synthetic load-closure probes for base doctor, an HTML-local
command, and whole-page provider selection. No transition bypass is permitted.

#### Scenario: Architecture drifts after a script is added
- **WHEN** a maintainer adds an unowned root script or cross-Phase private import
- **THEN** default verification fails with the offending path and rule

## ADDED Requirements

### Requirement: Image Production adapters expose public interfaces
Whole-page and visual-slot adapters SHALL be imported only through their public Image Production
interfaces. Old direct executable paths SHALL be removed after parity tests; no permanent import shim
is permitted.

#### Scenario: Public CLI routes production
- **WHEN** `ppt_flow` invokes an Image Production operation
- **THEN** it reaches the selected adapter through its public interface
- **AND** it imports no retired direct path
