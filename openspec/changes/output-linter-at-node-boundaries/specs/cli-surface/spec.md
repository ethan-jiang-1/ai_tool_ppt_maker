## MODIFIED Requirements

### Requirement: CLI surface preserves command names

The `ppt_flow` CLI SHALL expose **13** commands: `doctor`, `init`, `status`, `approve`, `style-master`, `validate`, `pilot`, `build`, `refresh`, `new-version`, `test`, `state`, and `lint`. Arguments and flags for the original twelve commands SHALL remain compatible.

#### Scenario: Agent runs ppt_flow init

- **WHEN** Agent runs `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs init deck_demo --deck-type keynote --style dark-executive`
- **THEN** a run bundle is created at `deck_demo/` with the three-tier structure

#### Scenario: help lists lint

- **WHEN** Agent runs `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs --help`
- **THEN** the help output includes the `lint` command

## ADDED Requirements

### Requirement: lint command is the agent's PDCA tool

`ppt_flow lint` SHALL support:
- `--file <path>`: lint a single file, auto-detecting type
- `--run-dir <path> --node <id>`: lint all lintable produces of a playbook node
- `--tolerant`: downgrade schema-level errors to warnings
- `--json`: output structured results on stdout

The command SHALL NOT lint JS pipeline outputs. Pure evidence produces SHALL be skipped with a note. The `--json` output SHALL be parseable by the agent for PDCA repair decisions.

#### Scenario: Lint a valid MD file

- **WHEN** Agent runs `ppt_flow lint --file deck_xxx/3_versions/v1/slide-specifications.md --json`
- **AND** the file is well-formed
- **THEN** stdout contains JSON with `ok: true` and exit is `0`

#### Scenario: Lint a file with broken frontmatter

- **WHEN** Agent runs `ppt_flow lint --file deck_xxx/broken.md --json`
- **AND** the file has unclosed YAML frontmatter
- **THEN** exit is non-zero with `code` `FAILED` and stdout has `ok: false` with error details

#### Scenario: Lint node produces (agent PDCA)

- **WHEN** Agent runs `ppt_flow lint --run-dir deck_xxx/3_versions/v1 --node wave0 --json`
- **THEN** the command resolves produces, maps to files, lints each
- **AND** stdout JSON has per-file `{ file, ok, errors, warnings }` for agent to act on

#### Scenario: Tolerant mode downgrades schema issues

- **WHEN** Agent runs `ppt_flow lint --file deck_xxx/core-metaphor.md --tolerant --json`
- **AND** the file has optional sections missing
- **THEN** exit is `0` with `ok: true` and warnings

### Requirement: lint command delegates to lint_output.mjs

`ppt_flow lint` SHALL delegate all validation to `scripts/lib/lint_output.mjs`. The CLI layer SHALL only handle argument parsing, file path resolution, and output formatting.

#### Scenario: Lint delegates to library

- **WHEN** Agent runs any `ppt_flow lint` variant
- **THEN** `ppt_flow.mjs` calls the corresponding function in `lint_output.mjs`

### Requirement: lint command obeys CLI failure envelope contract

On hard failure (missing arguments, file not found), `ppt_flow lint` SHALL exit non-zero with one v1 failure envelope. Lint finding issues in `--json` mode SHALL exit non-zero with `code` `FAILED`.

#### Scenario: Missing arguments

- **WHEN** Agent runs `ppt_flow lint` without `--file` or `--run-dir`
- **THEN** exit is non-zero with `code` `USAGE`

#### Scenario: File not found

- **WHEN** Agent runs `ppt_flow lint --file nonexistent.md`
- **THEN** exit is non-zero with `code` `FAILED`

### Requirement: The complete ppt_flow command surface has return-audit coverage

The command-return registry SHALL cover exactly the **13** commands. `lint` SHALL register: help, usage failure, contextual failure (file not found), and JSON success categories.

#### Scenario: lint command is audited

- **WHEN** the audit compares registered commands against the audit registry
- **THEN** `lint` is present and has coverage for all applicable return categories
