## Purpose

Define the command-line surface of the framework's single entry-point script, `ppt_flow.mjs`: the fixed set of 12 subcommands it exposes, the capability scripts it delegates to, and its use of `commander` for argument parsing and subcommand routing. This capability guarantees that the CLI contract stays stable — command names and flags remain backward-compatible — that each command routes to the correct underlying capability script rather than reimplementing it, and that hard failures emit a machine-parseable JSON envelope on stderr for MD Controllers.

## Requirements

### Requirement: CLI surface preserves command names

The `ppt_flow` CLI SHALL expose **12** commands: `doctor`, `init`, `status`, `approve`, `style-master`, `validate`, `pilot`, `build`, `refresh`, `new-version`, `test`, and `state`. Arguments and flags for the original eleven commands SHALL remain compatible.

#### Scenario: Agent runs ppt_flow init

- **WHEN** Agent runs `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs init deck_demo --deck-type keynote --style dark-executive`
- **THEN** a run bundle is created at `deck_demo/` with the three-tier structure, preset templates seeded, metadata initialized

#### Scenario: help lists state

- **WHEN** Agent runs `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs --help`
- **THEN** the help output includes the `state` command

### Requirement: ppt_flow delegates to capability scripts

`ppt_flow.mjs` SHALL delegate to `bundle_layout.mjs`, `unified_pipeline.mjs`, `generate_style_master.mjs`, and `env-check.mjs` as appropriate for each command.

#### Scenario: Command routes to its capability script

- **WHEN** Agent runs `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs style-master <run_dir>`
- **THEN** `ppt_flow.mjs` delegates the work to `generate_style_master.mjs` rather than implementing style-master generation inline

### Requirement: Uses commander for CLI

`ppt_flow.mjs` SHALL use the `commander` npm package for argument parsing and subcommand routing. Hard failures originating from commander (unknown command, missing required options/arguments) SHALL be routed through the JSON failure envelope with `code` `USAGE` (see Requirement: Commander errors are mapped through the envelope), not through commander's default prose-only exit.

#### Scenario: CLI parses a subcommand and its flags

- **WHEN** `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs init deck_demo --deck-type keynote --style dark-executive` is run
- **THEN** commander parses `init` as the subcommand and the options, routing to the init handler

### Requirement: CLI hard failures emit a JSON envelope on stderr

On any hard failure that causes `ppt_flow.mjs` to exit non-zero, the process SHALL write exactly one failure envelope as the **last non-empty line of stderr**, formatted as a single-line JSON object. Required fields: `ok` (boolean `false`), `code` (non-empty string), `message` (non-empty string), `hint` (non-empty string), `where` (non-empty string). Allowed `code` values for this capability SHALL be exactly: `UNCAUGHT`, `USAGE`, `GATE_BLOCKED`, `STATE_CORRUPTED`, `FAILED`. Emitting only prose without this JSON line is forbidden. Emitting more than one failure envelope for a single process exit is forbidden. An MD Controller SHALL recover the envelope by taking the last non-empty stderr line and calling `JSON.parse`.

Successful paths (including `--help` and successful command completion) SHALL NOT emit a failure envelope.

#### Scenario: Uncaught exception during startup or dispatch

- **WHEN** `ppt_flow.mjs` throws before or during command dispatch
- **THEN** the process exits non-zero with `code` `UNCAUGHT`
- **AND** the last non-empty line of stderr is JSON with `ok: false` and non-empty `message`, `hint`, and `where`

#### Scenario: Unknown subcommand

- **WHEN** Agent runs `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs nosuch`
- **THEN** exit is non-zero with `code` `USAGE`
- **AND** the last non-empty line of stderr is parseable JSON with `ok: false`

#### Scenario: Invalid style preset on init

- **WHEN** Agent runs `init` with an unknown `--style`
- **THEN** exit is non-zero with `code` `USAGE`
- **AND** `hint` lists allowed presets derived without mutating frozen `STYLE_PRESETS` (for example via `[...STYLE_PRESETS].sort()`)
- **AND** stderr contains exactly one JSON object with `ok: false`

#### Scenario: Subprocess failure is wrapped as FAILED

- **WHEN** a `ppt_flow` command that delegates via `runNode` receives a non-zero child exit status
- **THEN** `ppt_flow` exits with that status (or documented default)
- **AND** the last non-empty line of stderr is JSON with `code` `FAILED`
- **AND** that JSON line is written after the child process has finished

#### Scenario: Help does not emit failure envelope

- **WHEN** Agent runs `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs --help`
- **THEN** exit is `0`
- **AND** stderr does not end with a non-empty line that is JSON whose `ok` field is `false`

### Requirement: Commander errors are mapped through the envelope

`ppt_flow.mjs` SHALL enable commander `exitOverride` (or equivalent) so that unknown commands and missing required arguments do not bypass the JSON envelope path. Such failures SHALL use `code` `USAGE`.

#### Scenario: Missing required init flags surface as USAGE

- **WHEN** Agent runs `init` without required `--deck-type` / `--style` such that commander rejects the invocation
- **THEN** exit is non-zero with `code` `USAGE`
- **AND** the last non-empty line of stderr is parseable failure JSON

### Requirement: Frozen preset arrays are never mutated in place

`ppt_flow.mjs` SHALL NOT call in-place mutators (`.sort`, `.reverse`, `.splice`) on imported `Object.freeze` arrays such as `STYLE_PRESETS`. Display/sort SHALL use a shallow copy (for example `[...STYLE_PRESETS].sort()`).

#### Scenario: doctor starts without freeze TypeError

- **WHEN** Agent runs `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs doctor`
- **THEN** stderr does not contain `Cannot assign to read only property`
- **AND** env-check is invoked (overall exit may still be non-zero if credentials are missing)

### Requirement: state is registered inside main before parse

`ppt_flow.mjs` SHALL register the `state` subcommand inside `main()` on the same `Command` instance passed to `parseAsync`, and SHALL register it before `parseAsync` runs. Module-top-level registration that references `main`'s local `program` is forbidden.

#### Scenario: state appears in help

- **WHEN** Agent runs `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs state --help`
- **THEN** help text for `state` is shown
- **AND** the process does not throw `ReferenceError: program is not defined`
- **AND** exit is `0` without a failure envelope

### Requirement: Pilot uses preview readiness and does not waive gates

`ppt_flow.mjs pilot` SHALL treat readiness as **preview** (structure + style master): it SHALL NOT require metadata `content_gate`/`visual_gate` to be `approved`/`waived`, and SHALL NOT write `waived` or otherwise mutate gate fields. When invoking Stage 2, pilot SHALL pass `unified_pipeline --preview` so the child process uses the same readiness. Full `build` and non-preview Stage 2 SHALL continue to use pipeline readiness (gates required).

#### Scenario: Pilot runs while gates are pending

- **WHEN** metadata gates are `pending`
- **AND** style master exists and structure is valid
- **AND** Agent runs `ppt_flow.mjs pilot <run_dir>`
- **THEN** pilot proceeds (including Stage 2 under `--preview`)
- **AND** metadata gate fields remain `pending`

#### Scenario: Build / non-preview Stage 2 still blocked

- **WHEN** gates are `pending`
- **AND** Agent runs `ppt_flow.mjs build` or `unified_pipeline --stage 2` without `--preview`
- **THEN** the command fails for gate readiness
- **AND** prior pilot success is not treated as approval

### Requirement: Pilot accepts --force-images and skips by default

`ppt_flow.mjs pilot` SHALL expose `--force-images`. Without it, pilot SHALL NOT pass force into Stage 2 (existing pilot images are skipped). With it, selected pilot images regenerate.

#### Scenario: Default pilot skips existing images

- **WHEN** pilot target images already exist
- **AND** pilot runs without `--force-images`
- **THEN** Stage 2 skips those files

#### Scenario: Pilot --force-images regenerates

- **WHEN** `pilot … --force-images` runs
- **THEN** Stage 2 regenerates the pilot selection

### Requirement: --only accepts friendly slide selectors

`ppt_flow` paths that accept `--only` (including `pilot`) SHALL use the same `resolveSlideIds` rules as `pipeline-orchestration`. Unknown/ambiguous selectors SHALL fail with a JSON envelope whose `hint` lists available slide ids (truncated if long).

#### Scenario: Page number selects a slide

- **WHEN** `--only 3` is passed and the third plan entry has id `s03_one_tool_two_modes`
- **THEN** pilot / Stage 2 targets that slide id

#### Scenario: Unknown selector lists ids

- **WHEN** `--only slide_03` matches nothing
- **THEN** the command exits non-zero with an envelope
- **AND** `hint` includes real ids from `slide_plan.json`

### Requirement: doctor forwards optional --smoke

`ppt_flow.mjs doctor` SHALL accept `--smoke` and forward it to `env-check.mjs`. Without `--smoke`, doctor remains presence-only (no Image2 network).

#### Scenario: doctor --smoke flag is accepted

- **WHEN** Agent runs `ppt_flow.mjs doctor --smoke`
- **THEN** the flag is passed through to env-check
- **AND** help text documents `--smoke`
