## ADDED Requirements

### Requirement: Direct CLI is exposed from the canonical Harness root

Every documented direct production CLI entrypoint SHALL be invoked from
`ppt_maker_harness/` and SHALL identify that location as the PPT Maker Harness.
The retired `PPTMAKER_FRAMEWORK/` command path SHALL not remain documented,
accepted as an alias, or resolved as a fallback. Existing `ppt_flow`,
`PPTMAKER_*`, and `pptmaker-*` namespaces SHALL remain unchanged.

#### Scenario: An Agent receives a direct CLI command

- **WHEN** active guidance or a CLI diagnostic names the production entrypoint
- **THEN** it uses `node ppt_maker_harness/scripts/ppt_flow.mjs <command>`
- **AND** it does not direct the Agent to the retired Framework-root path

### Requirement: Legacy binding diagnostics remain bounded

When a direct CLI receives a legacy Run Bundle locator, it SHALL emit one
owner-issued unsupported-binding hard-stop before any state mutation, provider
initialization, generated-artifact read, or production work. The diagnostic
SHALL name the identity boundary and one reconstruction action; it SHALL not
emit a compatibility command, fallback Harness selection, waiver, or force
path.

#### Scenario: CLI receives a Framework-named locator

- **WHEN** a direct CLI command is given a locator with Framework-named v1
  fields
- **THEN** its final bounded diagnostic identifies the unsupported local binding
- **AND** no source, state, or generated artifact is changed
