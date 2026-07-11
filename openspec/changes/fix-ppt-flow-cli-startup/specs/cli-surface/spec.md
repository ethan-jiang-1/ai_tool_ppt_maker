## ADDED Requirements

### Requirement: CLI hard failures emit a JSON envelope

On any hard failure (uncaught exception, invalid usage that exits non-zero, gate rejection that aborts the process), `ppt_flow.mjs` SHALL exit non-zero **and** emit a single machine-parseable JSON object that includes at least: `ok` (false), `code` (stable string), `message`, `hint`, and `where`. Emitting only a prose line such as `Fatal error: …` without JSON is forbidden.

#### Scenario: Uncaught exception during startup

- **WHEN** `ppt_flow.mjs` throws before or during command dispatch
- **THEN** the process exits non-zero
- **AND** stderr or stdout contains JSON with `ok: false` and a non-empty `code` and `message`
- **AND** an MD Controller can `JSON.parse` that envelope without scraping prose

#### Scenario: Invalid style preset on init

- **WHEN** Agent runs `init` with an unknown `--style`
- **THEN** exit is non-zero and the JSON envelope `code` identifies a usage/validation failure
- **AND** `hint` lists allowed presets (derived without mutating frozen `STYLE_PRESETS`)

### Requirement: Frozen preset arrays are never mutated in place

`ppt_flow.mjs` SHALL NOT call in-place mutators (`.sort`, `.reverse`, `.splice`) on imported `Object.freeze` arrays such as `STYLE_PRESETS`. Display/sort SHALL use a shallow copy (e.g. `[...STYLE_PRESETS].sort()`).

#### Scenario: doctor starts successfully

- **WHEN** Agent runs `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs doctor`
- **THEN** the process does not throw `Cannot assign to read only property`
- **AND** env-check runs (exit code may still be non-zero if credentials missing, but startup itself succeeds)

### Requirement: state is a first-class ppt_flow subcommand

`ppt_flow.mjs` SHALL register `state` inside `main()` on the same `Command` instance used by `parseAsync`, before parsing. The `state` command SHALL support summary output, `--json`, and `--check-gates` as specified by `node-specification`.

#### Scenario: state appears in help and runs

- **WHEN** Agent runs `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs state --help`
- **THEN** help text for `state` is shown and the process does not throw `program is not defined`

## MODIFIED Requirements

### Requirement: CLI surface preserves command names

The `ppt_flow` CLI SHALL expose these commands: `doctor`, `init`, `status`, `approve`, `style-master`, `validate`, `pilot`, `build`, `refresh`, `new-version`, `test`, and `state`. Arguments and flags SHALL remain compatible for the pre-existing eleven commands.

#### Scenario: Agent runs ppt_flow init

- **WHEN** Agent runs `node scripts/ppt_flow.mjs init deck_demo --deck-type keynote --style dark-executive`
- **THEN** a run bundle is created at `deck_demo/` with the three-tier structure, preset templates seeded, metadata initialized
