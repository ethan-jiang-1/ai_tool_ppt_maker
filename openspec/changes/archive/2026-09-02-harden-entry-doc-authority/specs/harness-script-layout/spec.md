## ADDED Requirements

### Requirement: Unified entry names command authorities instead of re-declaring the inventory

The unified entry `ppt_maker_harness/scripts/ppt_flow.mjs` SHALL NOT enumerate
the command inventory in prose, including its header comment, module docblock,
or any comment that presents a current command list. Its header SHALL direct
readers to the owning authorities: the entry's own `program.command(...)`
registrations, `--help` output as runtime truth, and
`ppt_maker_harness/COMMANDS.md` as the human-facing command map. The command
surface contract guard SHALL report a prose command-inventory declaration in
the unified entry instead of passing silently. Runtime help examples and
per-command contract blocks remain governed by their existing requirements and
are not command inventories.

#### Scenario: A maintainer opens the entry file

- **WHEN** a maintainer or Agent reads the top of `ppt_flow.mjs`
- **THEN** the header names where the command inventory lives and how to obtain
  runtime truth
- **AND** it does not list command names as a current inventory

#### Scenario: A prose command inventory is re-introduced

- **WHEN** the command surface contract guard inspects the unified entry and
  finds a comment enumerating commands as the current inventory
- **THEN** the guard reports the offending lines as a command-inventory
  re-declaration
- **AND** the check fails until the enumeration is removed

#### Scenario: A new command is registered

- **WHEN** a maintainer adds a command through the entry's existing
  registrations
- **THEN** the entry header requires no edit to remain truthful
- **AND** any human-facing command documentation update happens through the
  commands-reference owner, not through the entry header
