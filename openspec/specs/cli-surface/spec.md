## Purpose

Define the command-line surface of the framework's single entry-point script, `ppt_flow.mjs`: the fixed set of 11 subcommands it exposes, the capability scripts it delegates to, and its use of `commander` for argument parsing and subcommand routing. This capability guarantees that the CLI contract stays stable — command names and flags remain backward-compatible — and that each command routes to the correct underlying capability script rather than reimplementing it.

## Requirements

### Requirement: CLI surface preserves command names

The `ppt_flow` CLI SHALL expose 11 commands: `doctor`, `init`, `status`, `approve`, `style-master`, `validate`, `pilot`, `build`, `refresh`, `new-version`, `test`. Arguments and flags SHALL remain compatible.

#### Scenario: Agent runs ppt_flow init

- **WHEN** Agent runs `node scripts/ppt_flow.mjs init deck_demo --deck-type keynote --style dark-executive`
- **THEN** a run bundle is created at `deck_demo/` with the three-tier structure, preset templates seeded, metadata initialized

### Requirement: ppt_flow delegates to capability scripts

`ppt_flow.mjs` SHALL delegate to `bundle_layout.mjs`, `unified_pipeline.mjs`, `generate_style_master.mjs`, and `env-check.mjs` as appropriate for each command.

#### Scenario: Command routes to its capability script

- **WHEN** Agent runs `node scripts/ppt_flow.mjs style-master <run_dir>`
- **THEN** `ppt_flow.mjs` delegates the work to `generate_style_master.mjs` rather than implementing style-master generation inline

### Requirement: Uses commander for CLI

`ppt_flow.mjs` SHALL use the `commander` npm package for argument parsing and subcommand routing.

#### Scenario: CLI parses a subcommand and its flags

- **WHEN** `node scripts/ppt_flow.mjs init deck_demo --deck-type keynote` is run
- **THEN** commander parses `init` as the subcommand and `--deck-type keynote` as an option, routing to the init handler
