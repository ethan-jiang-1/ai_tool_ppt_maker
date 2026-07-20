## MODIFIED Requirements

### Requirement: Active Phases expose deep module interfaces

Each Phase `00-setup`, `01-content`, `02-visual-system`, `03-html-production`, `04-image2-refinement`, and `05-iteration` SHALL expose exactly one import-safe `index.mjs` interface. Callers and integration tests SHALL use that interface rather than private physical paths. Importing one SHALL not bootstrap a CLI, parse arguments, write production data, launch a browser, initialize a provider, or eagerly load operation-specific implementation. Root `ppt_flow.mjs` SHALL select interfaces by command/marker.

Phase 4 SHALL own only the modern authorized visual-slot capability and its private injectable transport; it adds no standalone executable. Phase 0 remains provider-free. The Phase-4 interface SHALL not be imported by shared modules, Phase-3 ordinary HTML delivery, or Phase-5 legacy implementation.

#### Scenario: Base doctor remains below production modules
- **WHEN** Phase 0 is imported for base readiness
- **THEN** neither Phase-3 renderer internals nor any Phase-4/Phase-5 provider implementation is statically loaded

#### Scenario: Caller enters authorized refinement
- **WHEN** `ppt_flow image2` dispatches an eligible authorized operation
- **THEN** it imports the Phase-4 interface without importing its private transport on help, plan, or unrelated HTML commands

### Requirement: Module imports follow the allowed direction

Architecture validation SHALL parse repository-local static, re-export, and string-literal dynamic ESM edges. Root may import active Phase interfaces and declared public shared CLI/run-bundle/state interfaces. Foreign Phase adjacency SHALL be exactly `00-setup -> {}`, `01-content -> {}`, `02-visual-system -> {}`, `03-html-production -> {00-setup,01-content,02-visual-system}`, `04-image2-refinement -> {02-visual-system,03-html-production}`, and `05-iteration -> {01-content,02-visual-system,03-html-production}`. Shared modules SHALL not import a Phase; no Phase may import another Phase private implementation or direct executable.

#### Scenario: Refinement reaches legacy private generation
- **WHEN** architecture validation finds Phase 4 importing `05-iteration/legacy-image2/`
- **THEN** it rejects the ownership crossover

### Requirement: Legacy and future Image2 ownership remain isolated

Markerless whole-page Image2 generation, style-master, contact-sheet, and header-lock maintenance SHALL remain under `05-iteration/legacy-image2/`. Modern Phase 4 SHALL own only authorized no-text visual-slot refinement and SHALL never become an ordinary HTML renderer or whole-page generator. HTML Phase 3/local iteration SHALL not import or initialize either provider implementation.

#### Scenario: HTML production imports modern transport
- **WHEN** architecture validation finds a Phase-3 import into Phase-4 private transport
- **THEN** validation fails and identifies the Image2 ownership crossover

### Requirement: Unit and E2E trees mirror source ownership

`tests/` and `tests_e2e/` SHALL retain their numbered Phase/shared/contracts ownership roots. Phase 4 SHALL contain its owned unit and E2E refinement suites; helpers remain non-business input/fake constructors. HTML delivery journeys remain Phase 3 and legacy whole-page journeys remain Phase 5.

#### Scenario: Modern refinement journey is classified
- **WHEN** a public authorized refinement journey is located
- **THEN** it belongs under `tests_e2e/04-image2-refinement/` and is not duplicated under Phase 5
