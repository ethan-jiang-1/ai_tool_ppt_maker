## MODIFIED Requirements

### Requirement: COMMANDS.md exists at framework root

`ppt_maker_harness/COMMANDS.md` SHALL exist as a human-readable command
reference at the PPT Maker Harness root. It SHALL map natural-language user
requests to the Agent actions that fulfill them and SHALL not identify the
retired Framework root as a command or discovery location.

#### Scenario: Human opens COMMANDS.md to learn what to say

- **WHEN** a human opens `ppt_maker_harness/COMMANDS.md`
- **THEN** they can find the supported natural-language request routes
- **AND** the document names the PPT Maker Harness as their reusable tool
  environment

## ADDED Requirements

### Requirement: Intent Route Catalog is housed by the Harness

The versioned Intent Route Catalog SHALL reside at
`ppt_maker_harness/playbook/intent-routes-v1.json` and remain independent of
the Controller manifest. Moving it to the Harness SHALL not make it a runtime
command parser or change its discovery-only authority.

#### Scenario: Agent discovers an intent route

- **WHEN** an Agent reads the active Intent Route Catalog
- **THEN** it finds it beneath the canonical Harness playbook root
- **AND** the catalog does not select a node, mutate state, or authorize work
