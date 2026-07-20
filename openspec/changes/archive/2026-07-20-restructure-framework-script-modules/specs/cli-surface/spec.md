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

Every registered standalone executable under `PPTMAKER_FRAMEWORK/scripts/` SHALL, on hard failure, exit non-zero and write exactly one machine-parseable failure envelope as the final non-empty line of its own stderr. The envelope SHALL contain `ok: false`, stable `code`, non-empty `message`, non-empty `hint`, and non-empty `where`. Human-readable diagnostics MAY precede the envelope. Library imports and successful/help paths SHALL NOT emit failure envelopes. The registry SHALL use normalized owner-relative paths, and direct-entry detection SHALL recursively scan all `.mjs` files below `scripts/`.

Every executable SHALL expose `--help`, exit zero for help, and list its supported long options so documentation checks have a stable command contract.

#### Scenario: Bundle layout usage failure is machine-readable

- **WHEN** `shared/run-bundle/bundle_layout.mjs` is invoked with `--structure-only` but without `--check`
- **THEN** it exits non-zero
- **AND** the final non-empty stderr line is a valid failure envelope with `code: USAGE`

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
- **THEN** relocated `image_api_client.mjs`, `visual_config.mjs`, and other library-only modules are excluded
- **AND** any direct-entry indicator without a path-qualified registration fails

#### Scenario: Standalone help is side-effect free

- **WHEN** any registered executable is invoked with `--help`
- **THEN** it exits zero, lists supported options, performs no production writes or network calls, and emits no failure envelope

### Requirement: CLI envelope tests cover the registered executable inventory

The test suite SHALL maintain the exact normalized-path inventory of these **fourteen** registered executable entries:

- `ppt_flow.mjs`
- `00-setup/env-check.mjs`
- `03-html-production/stage1_build_inputs.mjs`
- `03-html-production/stage2_render_html.mjs`
- `03-html-production/stage3_compose_slides.mjs`
- `03-html-production/stage4_build_pptx.mjs`
- `03-html-production/stage5_inject_notes.mjs`
- `03-html-production/unified_pipeline.mjs`
- `05-iteration/legacy-image2/generate_style_master.mjs`
- `05-iteration/legacy-image2/make_contact_sheet.mjs`
- `05-iteration/legacy-image2/stage2_generate_images.mjs`
- `05-iteration/legacy-image2/stage3_lock_headers.mjs`
- `shared/run-bundle/bundle_layout.mjs`
- `shared/run-bundle/lessons.mjs`

The path-qualified contract SHALL correct the stale pre-migration thirteen-entry prose without adding or removing a current executable. The suite SHALL compare this set with recursive direct-entry guards and probe help plus deterministic failure-envelope behavior for every entry. Libraries SHALL remain excluded; any inventory drift SHALL fail with exact paths.

#### Scenario: A moved compositor is absent from inventory

- **WHEN** `03-html-production/stage3_compose_slides.mjs` is executable but absent from the path inventory
- **THEN** the CLI contract suite fails and names that canonical path

#### Scenario: An old flat path is still registered

- **WHEN** the inventory contains `scripts/stage3_compose_slides.mjs`
- **THEN** validation fails because only the Phase 3 path is canonical

### Requirement: Direct-entry and return audits cover the observable CLI surface

`EXECUTABLE_INVENTORY` SHALL remain the explicit public direct-CLI registry, represented by normalized paths. Tests SHALL recursively scan `PPTMAKER_FRAMEWORK/scripts/**/*.mjs` for direct-entry indicators, including an executable shebang, a main guard based on `process.argv[1]`/`import.meta.url`, direct Commander parsing, standalone-envelope installation, or top-level production writes. The only exact library exceptions SHALL be `shared/cli/cli_bootstrap.mjs`, which installs the imported process transaction, and `shared/cli/cli_error.mjs`, which exposes the shared installer/producer interface; neither may have a shebang, direct main guard, or Commander parse. The detected candidate set after those two exact exclusions SHALL equal the path inventory. Contract generators outside that inventory SHALL be import-safe functions without direct-entry indicators. Directory-wide or pattern-wide exceptions SHALL be forbidden.

Every registered executable SHALL retain an audit record for each applicable return category: help, deterministic usage failure, contextual hard failure, delegated hard failure, catchable interruption, prose success, and documented JSON success. Unsupported categories SHALL have explicit not-applicable reasons. Non-zero probes SHALL verify one final v1 envelope; successful help/prose SHALL verify exit zero and no failure envelope; successful JSON SHALL verify exactly one parseable stdout value and no failure envelope. Fixtures SHALL be deterministic, temporary, network-free, and stored under the mirrored owner.

#### Scenario: New direct-entry script is not registered

- **WHEN** a new `.mjs` gains a shebang, direct-entry main guard, direct CLI parser, standalone envelope, or top-level production write
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

The documentation consistency suite SHALL extract active Node CLI examples from `bash`/`sh`/`shell`/`console` fenced blocks and inline code whose first executable token, after an optional prompt marker and environment assignments, is `node`. It SHALL join backslash continuations, ignore comment/output lines, require one analyzable Node invocation per logical command, identify the script and optional `ppt_flow` subcommand, resolve the script against the canonical Phase/shared tree, and verify that every documented long option is present in the corresponding side-effect-free `--help` output. Active examples SHALL not reference old flat script paths or `scripts/lib/`. Intentionally non-executable pseudocode SHALL use `<!-- coherence:pseudocode reason="..." -->` immediately before that one example; the marker SHALL NOT exempt a whole file or directory.

#### Scenario: Stage script is documented at its owner path

- **WHEN** an active guide shows `03-html-production/stage3_compose_slides.mjs` or another canonical executable with supported flags
- **THEN** documentation validation resolves the owner path and confirms the flags

#### Scenario: Legacy Stage script is documented with unsupported run-dir flag

- **WHEN** an active guide shows `05-iteration/legacy-image2/stage3_lock_headers.mjs --run-dir ...` but the script help does not expose `--run-dir`
- **THEN** documentation validation fails with the source file, line, script, and unsupported flag

#### Scenario: Current ppt_flow command example is valid

- **WHEN** an active guide shows `ppt_flow.mjs build <run-dir> --resolution 2k --reuse-images`
- **THEN** validation resolves the `build` help surface
- **AND** confirms both long flags are supported

#### Scenario: Flat path remains in a guide

- **WHEN** an active guide shows `scripts/stage3_compose_slides.mjs`
- **THEN** documentation validation fails with source file, line, and stale path

#### Scenario: Broad pseudocode exemption is rejected

- **WHEN** a marker lacks a reason, is not adjacent to an example, or attempts to exempt multiple examples
- **THEN** documentation validation fails with source file and line

### Requirement: HTML renderer and compositor CLIs are registered envelope-compliant executables

Direct `03-html-production/stage2_render_html.mjs` and `03-html-production/stage3_compose_slides.mjs` SHALL be Node ESM registered executables whose production interface accepts exactly required `--run-dir <vN>`, optional shared `--only <selectors>`, exact `--variant effective|forced-fallback`, and `--dry-run` in addition to side-effect-free `--help`. `effective` SHALL be the explicit default only when the flag is absent; review orchestration SHALL pass `forced-fallback` explicitly. The CLIs SHALL derive canonical plan/control/object/manifest paths internally from the validated run and SHALL accept no arbitrary input/output/manifest path, provider/base-url/model/style-master, browser channel/executable, or package-root override. They SHALL provide deterministic stdout and the existing one-final-JSON failure envelope. Diagnostics SHALL identify bounded slide/field/box/artifact/runtime phases without absolute paths, raw HTML, source prose, browser stack, or asset bytes. Their only intentional contract change is the canonical Phase 3 path.

#### Scenario: Renderer help is audited at the migrated path

- **WHEN** executable inventory runs `node PPTMAKER_FRAMEWORK/scripts/03-html-production/stage2_render_html.mjs --help`
- **THEN** it exits zero without writes or browser launch

#### Scenario: Compositor rejects arbitrary output paths

- **WHEN** the Phase 3 compositor receives an unsupported output or manifest path override
- **THEN** it returns `USAGE` before writes, as before migration

#### Scenario: Pixel overflow fails

- **WHEN** direct composition detects overflow
- **THEN** stderr ends with one `FAILED` envelope carrying slide/field/measurement evidence and a local source/layout repair action

#### Scenario: Direct forced fallback is review-only

- **WHEN** a direct renderer/compositor invocation uses `--variant forced-fallback`
- **THEN** it may publish verified immutable review objects and deterministic receipts
- **AND** it does not replace HTML-page/final-slide delivery manifests or claim a current preview plan

#### Scenario: Direct dry-run writes nothing

- **WHEN** either direct CLI uses `--dry-run`
- **THEN** it publishes no object, manifest, plan, lock residue, or generated directory
