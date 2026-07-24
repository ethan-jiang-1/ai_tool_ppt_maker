## MODIFIED Requirements

### Requirement: Active Phases expose deep module interfaces
Each active Phase `00-setup`, `01-content`, `02-visual-system`, `03-html-production`, `04-image-production`, and `05-iteration` SHALL expose exactly one import-safe `index.mjs` interface. Image Production SHALL additionally expose `whole-page` and `visual-slot` public adapters. Callers and integration tests SHALL use those interfaces rather than private physical paths. Importing one SHALL not bootstrap a CLI, parse arguments, write production data, launch a browser, initialize a provider, or eagerly load operation-specific implementation. Root `ppt_flow.mjs` SHALL select interfaces by canonical mode/direct evidence. Whole-page direct executables live under its adapter; visual-slot keeps its private injectable transport. Shared modules and foreign adapters SHALL not import either adapter's private implementation.

`00-setup` owns local readiness and remains provider-free. Its direct adapter and root doctor may lazily invoke `04-image-production/whole-page`'s public provider diagnostic only after prerequisites and explicit Image2-mode selection. `05-iteration` SHALL use public current interfaces for iteration and SHALL not own a migration adapter or compatibility route.

#### Scenario: Base doctor remains below production modules
- **WHEN** `00-setup` is imported for base readiness
- **THEN** neither HTML renderer internals nor whole-page provider implementation is statically loaded

### Requirement: Module imports follow the allowed direction
Architecture validation SHALL parse repository-local static, re-export, and string-literal dynamic ESM edges. Root may import active Phase interfaces and declared public shared CLI/run-bundle/state interfaces. A Phase may import its own implementation, public shared interfaces, versioned contracts, and only these foreign Phase interfaces: `00-setup -> {}`, `01-content -> {}`, `02-visual-system -> {}`, `03-html-production -> {00-setup,01-content,02-visual-system}`, `04-image-production -> {01-content,02-visual-system,03-html-production}`, and `05-iteration -> {01-content,02-visual-system,03-html-production,04-image-production}`.

Shared modules SHALL not import a Phase. Phases SHALL not import another Phase's private implementation, direct executable, or artifact-path constant. The exact cross-owner process adapters are root `ppt_flow.mjs`, `00-setup/env-check.mjs`, and Phase-3 `unified_pipeline.mjs`, `stage1_build_inputs.mjs`, and `stage4_build_pptx.mjs`; each may coordinate only through public interfaces. Contracts remain Phase-free. Canonical JSON lives in `contracts/canonical_json.mjs`, with a shared facade delegating to it; shared identity stays provider-neutral and does not discover, read, or write branch-owned manifests.

#### Scenario: Iteration requests a local rebuild
- **WHEN** `05-iteration` needs Phase-3 behavior
- **THEN** it imports `03-html-production/index.mjs`, never a private or direct-CLI path

#### Scenario: Foreign adapter reaches private whole-page generation
- **WHEN** architecture validation finds a non-owning adapter importing `04-image-production/whole-page/` private implementation
- **THEN** it rejects the ownership crossover

### Requirement: Unit and E2E trees mirror source ownership
`tests/` and `tests_e2e/` SHALL retain their numbered Phase/shared/contracts ownership roots. `04-image-production` SHALL contain its owned whole-page and visual-slot unit and E2E suites; helpers remain non-business input/fake constructors. HTML delivery journeys remain `03-html-production`. Root business test files are forbidden.

#### Scenario: Fresh HTML flow is classified
- **WHEN** the public init-to-PPTX HTML journey is located
- **THEN** it is owned by `tests_e2e/03-html-production/`
- **AND** it has no duplicate whole-page ownership copy

#### Scenario: Current whole-page journey is classified
- **WHEN** a public authorized whole-page or refinement journey is located
- **THEN** it belongs under `tests_e2e/04-image-production/`
- **AND** it is not duplicated under an iteration-only owner

## REMOVED Requirements

### Requirement: Directory migration preserves observable behavior
**Reason**: The historical directory-migration contract preserves retired state and whole-page behavior that this change intentionally removes.

**Migration**: Preserve the current public surface and current explicit pipeline contracts only; do not retain an old path, state, receipt, or Controller as a relocation compatibility promise.

### Requirement: Legacy and future Image2 ownership remain isolated
**Reason**: The old requirement retains a compatibility/migration owner for current whole-page work.

**Migration**: Use the current `04-image-production/whole-page` adapter for whole-page generation and `04-image-production/visual-slot` for refinement.

## ADDED Requirements

### Requirement: Current Image2 adapters have literal ownership
Whole-page Image2 generation, style-master, contact-sheet, and header-lock implementation SHALL live under `04-image-production/whole-page/`. Visual-slot refinement SHALL remain a distinct `04-image-production/visual-slot` adapter and SHALL never become an ordinary HTML renderer. HTML production and local iteration SHALL not import or initialize either provider implementation.

#### Scenario: HTML production crosses into a provider adapter
- **WHEN** architecture validation finds a Phase-3 import into a private Image2 transport
- **THEN** validation fails and identifies the ownership crossover

#### Scenario: Retired whole-page bridge is absent
- **WHEN** root doctor, a public Phase interface, or an integration test resolves whole-page Image2 behavior
- **THEN** it reaches the public `04-image-production/whole-page` adapter through a current interface
- **AND** it does not import, probe, or re-export a Phase-5 `legacy*` or `migration/` bridge

### Requirement: Current directory layout preserves observable behavior
Framework script-layout changes SHALL preserve current `ppt_flow` commands/options/exits, stdout/stderr envelopes and diagnostics, artifact bytes/fingerprints, state/gate/reset semantics, receipts, and the explicit `html-first-v1|whole-page-image2-v1` source contract. Canonical repository-relative direct executable paths are the sole intentional relocation boundary; no retired Controller, scratch owner, receipt reader, or source marker is preserved as a compatibility route.

#### Scenario: Public regressions run after current layout changes
- **WHEN** framework script ownership moves within the current layout
- **THEN** regression verification proves the current public surface and explicit pipeline contracts
- **AND** it does not use a retired compatibility path as evidence
