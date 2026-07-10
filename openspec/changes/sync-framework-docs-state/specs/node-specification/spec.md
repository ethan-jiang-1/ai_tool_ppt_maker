## MODIFIED Requirements

### Requirement: NODE-SPEC.md exists in charter directory

`PPTMAKER_FRAMEWORK/charter/NODE-SPEC.md` SHALL exist as the constitutional specification for Nodes, defining their anatomy, state schema, and execution rules. The state schema it documents SHALL match the implemented `_state/` model (`_state/state.yaml` as single source + `_state/history.jsonl` as append-only log), NOT the legacy single-file `run-bundle-state.yaml`.

#### Scenario: Developer reads node specification

- **WHEN** a developer opens `charter/NODE-SPEC.md`
- **THEN** they understand the Node frontmatter structure, state schema, and how playbooks are organized
- **AND** the documented state location is `_state/state.yaml` (+ `_state/history.jsonl`), consistent with `scripts/lib/state.mjs`
