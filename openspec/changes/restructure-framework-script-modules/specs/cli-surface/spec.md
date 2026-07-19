## MODIFIED Requirements

### Requirement: ppt_flow delegates to capability scripts

`ppt_flow.mjs` SHALL remain the stable root front controller and SHALL delegate bundle management, environment checks, state, slide transactions, HTML migration, and the selected production branch to the owning Phase interfaces or categorized shared CLI adapters. It SHALL route HTML Stage 1-5 through the Phase 3 interface and markerless production/maintenance through the Phase 5 legacy adapter. It SHALL keep orchestration/renderer logic out of the command router, SHALL probe the canonical marker before branch-specific readiness or option handling, and SHALL not import any Phase `internal/` path or direct executable.

#### Scenario: HTML build routes through Phase 3

- **WHEN** a marked run invokes `ppt_flow build`
- **THEN** `ppt_flow` delegates through the Phase 3 interface to HTML Stage 1-5 capability scripts
- **AND** does not delegate to legacy style-master or whole-page Image2 generation

#### Scenario: Legacy style command retains Phase 5 ownership

- **WHEN** a markerless run invokes `ppt_flow style-master`
- **THEN** `ppt_flow` delegates through the Phase 5 legacy interface to `05-iteration/legacy-image2/generate_style_master.mjs`
- **AND** does not implement style-master behavior inline

### Requirement: Supported standalone CLIs obey the failure envelope constitution

Every registered standalone executable under `PPTMAKER_FRAMEWORK/scripts/` SHALL, on hard failure, exit non-zero and write exactly one machine-parseable failure envelope as the final non-empty line of its own stderr. The envelope contract, help behavior, and library-import behavior SHALL remain unchanged after path migration. The registry SHALL use normalized owner-relative paths, and direct-entry detection SHALL recursively scan all `.mjs` files below `scripts/`.

#### Scenario: Moved Stage usage failure is machine-readable

- **WHEN** `03-html-production/stage1_build_inputs.mjs` is invoked without required arguments
- **THEN** it exits non-zero
- **AND** its final non-empty stderr line is the same valid failure envelope as before migration

#### Scenario: Imported Phase implementation does not terminate the process

- **WHEN** a Phase module is imported through an interface by a test or orchestrator
- **THEN** no direct-entry CLI bootstrap runs
- **AND** the module remains usable as a library

#### Scenario: Library-only files remain unregistered

- **WHEN** executable inventory is compared with recursive direct-entry detection
- **THEN** library-only modules under Phase `internal/` and `shared/` are excluded
- **AND** any direct-entry indicator without a path-qualified registration fails

### Requirement: CLI envelope tests cover the registered executable inventory

The test suite SHALL maintain an exact normalized-path inventory of every registered executable, including the stable root controller, Phase 0 environment checker, Phase 3 HTML production/orchestration CLIs, Phase 5 legacy Image2 CLIs, and categorized shared run-bundle CLIs. It SHALL compare this set with recursive direct-entry guards and probe help plus deterministic failure-envelope behavior for every entry. Libraries SHALL remain excluded; any inventory drift SHALL fail with exact paths.

#### Scenario: A moved compositor is absent from inventory

- **WHEN** `03-html-production/stage3_compose_slides.mjs` is executable but absent from the path inventory
- **THEN** the CLI contract suite fails and names that canonical path

#### Scenario: An old flat path is still registered

- **WHEN** the inventory contains `scripts/stage3_compose_slides.mjs`
- **THEN** validation fails because only the Phase 3 path is canonical

### Requirement: Direct-entry and return audits cover the observable CLI surface

`EXECUTABLE_INVENTORY` SHALL remain the explicit public direct-CLI registry, represented by normalized paths. Tests SHALL recursively scan `PPTMAKER_FRAMEWORK/scripts/**/*.mjs` for direct-entry indicators, including a main guard based on `process.argv[1]`/`import.meta.url`, direct Commander parsing, or standalone-envelope installation. The detected candidate set SHALL exactly equal the path inventory.

Every registered executable SHALL retain an audit record for each applicable return category: help, deterministic usage failure, contextual hard failure, delegated hard failure, catchable interruption, prose success, and documented JSON success. Unsupported categories SHALL have explicit not-applicable reasons. Non-zero probes SHALL verify one final v1 envelope; successful help/prose SHALL verify exit zero and no failure envelope; successful JSON SHALL verify exactly one parseable stdout value and no failure envelope. Fixtures SHALL be deterministic, temporary, network-free, and stored under the mirrored owner.

#### Scenario: New direct-entry script is not registered

- **WHEN** a new `.mjs` gains a direct-entry main guard or direct CLI parser
- **AND** it is absent from the path inventory
- **THEN** the audit fails and names the candidate path

#### Scenario: Registered JSON-mode failure keeps both channels valid

- **WHEN** a documented JSON command explicitly emits its schema-valid report before exiting non-zero
- **THEN** stdout remains parseable according to that report contract
- **AND** stderr ends with exactly one v1 failure envelope

### Requirement: The CLI producer contract is discoverable during repository maintenance

Repository-root `AGENTS.md` SHALL route any Coding Agent that adds or changes a direct CLI, command, exit path, stdout JSON path, stderr diagnostic, delegated process boundary, or CLI error helper to `openspec/specs/cli-surface/spec.md`, active `cli-surface` deltas, and the shared helper at `PPTMAKER_FRAMEWORK/scripts/shared/cli/`. `PPTMAKER_FRAMEWORK/scripts/README.md` and the relocated CLI error module header SHALL contain short pointers to the canonical capability without duplicating schema details.

#### Scenario: Coding Agent begins a CLI-sensitive change

- **WHEN** the Agent follows repository-root maintenance instructions
- **THEN** it is routed to the main `cli-surface` capability and active deltas before editing
- **AND** the canonical helper path is the categorized shared CLI path

### Requirement: Active documented CLI examples use real flags

The documentation consistency suite SHALL extract active Node CLI examples and resolve the script path against the canonical Phase/shared tree. It SHALL join backslash continuations, identify the script and optional `ppt_flow` subcommand, and verify every documented long option against side-effect-free `--help` output. Active examples SHALL not reference old flat script paths or `scripts/lib/`; intentionally non-executable pseudocode SHALL use the existing adjacent marker rule.

#### Scenario: Stage script is documented at its owner path

- **WHEN** an active guide shows `03-html-production/stage3_compose_slides.mjs` or another canonical executable with supported flags
- **THEN** documentation validation resolves the owner path and confirms the flags

#### Scenario: Flat path remains in a guide

- **WHEN** an active guide shows `scripts/stage3_compose_slides.mjs`
- **THEN** documentation validation fails with source file, line, and stale path

### Requirement: HTML renderer and compositor CLIs are registered envelope-compliant executables

Direct `03-html-production/stage2_render_html.mjs` and `03-html-production/stage3_compose_slides.mjs` SHALL retain the existing Node ESM production interface, side-effect-free help, canonical-run path derivation, deterministic stdout, and one-final-JSON failure envelope. They SHALL be registered at their Phase 3 paths and SHALL accept no arbitrary path, provider, browser, or package-root override.

#### Scenario: Renderer help is audited at the migrated path

- **WHEN** executable inventory runs `node PPTMAKER_FRAMEWORK/scripts/03-html-production/stage2_render_html.mjs --help`
- **THEN** it exits zero without writes or browser launch

#### Scenario: Compositor rejects arbitrary output paths

- **WHEN** the Phase 3 compositor receives an unsupported output or manifest path override
- **THEN** it returns `USAGE` before writes, as before migration
