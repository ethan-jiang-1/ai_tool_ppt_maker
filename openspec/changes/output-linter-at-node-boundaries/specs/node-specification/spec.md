## ADDED Requirements

### Requirement: outputs_linted condition is in the Gate Conditions Catalog

`charter/NODE-SPEC.md` Gate Conditions Catalog SHALL include `outputs_linted` as a deterministic exit-only condition. Type: "output validation". Data source: `lintNodeProduces()` from `scripts/lib/lint_output.mjs`. Check logic: read node `produces` → map to file paths → run validator → all files `ok: true`. The condition SHALL return boolean only.

#### Scenario: Developer looks up outputs_linted

- **WHEN** a developer opens the Gate Conditions Catalog
- **THEN** `outputs_linted` is listed with type "output validation"

#### Scenario: outputs_linted is exit-only

- **WHEN** `outputs_linted` appears in a node's `entry` list
- **THEN** validation SHALL flag it as invalid

### Requirement: NODE-SPEC.md documents the PDCA lint protocol

`charter/NODE-SPEC.md` SHALL document the PDCA lint protocol for nodes with `outputs_linted`: (1) node body includes a CLI step instructing agent to run `ppt_flow lint --run-dir <runDir> --node <nodeId>`; (2) agent reads output, fixes reported errors, re-runs lint; (3) max 3 rounds; (4) when lint passes, `checkExit` runs `outputs_linted` as final gate; (5) if 3 rounds exhausted, agent hard-stops and reports to user.

#### Scenario: Agent follows PDCA protocol from NODE-SPEC.md

- **WHEN** Agent encounters a node with `outputs_linted` in exit
- **THEN** NODE-SPEC.md provides the canonical PDCA protocol for that condition
- **AND** the node body's CLI step references this protocol
