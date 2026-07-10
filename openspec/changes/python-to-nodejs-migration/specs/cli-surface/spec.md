## ADDED Requirements

### Requirement: CLI surface preserves command names

The `ppt_flow` CLI SHALL expose 11 commands: `doctor`, `init`, `status`, `approve`, `style-master`, `validate`, `pilot`, `build`, `refresh`, `new-version`, `test`. Arguments and flags SHALL remain compatible.

#### Scenario: Agent runs ppt_flow init

- **WHEN** Agent runs `node 06_reference_scripts/ppt_flow.mjs init deck_demo --deck-type keynote --style dark-executive`
- **THEN** a run bundle is created at `deck_demo/` with the three-tier structure, preset templates seeded, metadata initialized

### Requirement: ppt_flow delegates to capability scripts

`ppt_flow.mjs` SHALL delegate to `bundle_layout.mjs`, `unified_pipeline.mjs`, `generate_style_master.mjs`, and `00-env-check.mjs` as appropriate for each command.

### Requirement: Uses commander for CLI

`ppt_flow.mjs` SHALL use the `commander` npm package for argument parsing and subcommand routing.
