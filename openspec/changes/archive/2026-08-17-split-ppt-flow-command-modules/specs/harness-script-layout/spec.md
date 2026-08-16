# Harness Script Layout Specification (delta)

## ADDED Requirements

### Requirement: Current direct-CLI commands form one admitted command-module seam

The Harness SHALL host the current direct-CLI command implementations at one
admitted `shared/cli/commands/` seam plus a `shared/cli/command_support.mjs`
shared glue module. Both SHALL be registered public shared interfaces admitted
by the current architecture guard, so the unified entry `ppt_flow.mjs` and other
registered shared modules MAY import them.

A command module SHALL import only the declared foundation method-module
`index.mjs` interfaces (`01-content`, `02-visual-system`) and
registered public shared interfaces. The architecture guard SHALL still reject
an undeclared local import, a missing import target, or a second command
registry. The command modules SHALL NOT be independent executable entrypoints
and SHALL NOT re-declare the command inventory or Commander registration.

#### Scenario: Entry dispatches through the admitted command seam

- **WHEN** architecture validation inspects the unified entry importing a
  current command module
- **THEN** it admits the registered command-module path as a public shared
  interface
- **AND** it rejects an undeclared command path before it becomes a production
  route

#### Scenario: Command modules use only declared foundation interfaces

- **WHEN** a command module imports a foundation method-module interface
- **THEN** only the declared `index.mjs` interface is admitted
- **AND** an undeclared private foundation path is rejected

#### Scenario: Command modules are not second entrypoints

- **WHEN** the architecture guard scans the command seam for direct-entry
  indicators
- **THEN** no command module is an independent executable entrypoint
- **AND** the executable inventory remains exactly the unified entry set
