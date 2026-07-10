## ADDED Requirements

### Requirement: NODE-SPEC.md exists in charter directory

`PPTMAKER_FRAMEWORK/charter/NODE-SPEC.md` SHALL exist as the constitutional specification for Nodes, defining their anatomy, state schema, and execution rules.

#### Scenario: Developer reads node specification

- **WHEN** a developer opens `charter/NODE-SPEC.md`
- **THEN** they understand the Node frontmatter structure, state schema, and how playbooks are organized

### Requirement: Node frontmatter defines entry and exit gates

Every node SHALL have YAML frontmatter with at minimum: `node` (kebab-case name), `entry` (list of conditions that must be true before starting), and `exit` (list of conditions that must be true before marking completed).

#### Scenario: Agent checks entry gate before executing a node

- **WHEN** Agent begins executing node `wave0` in playbook `full-creation`
- **THEN** it verifies all `entry` conditions are met
- **AND** if any condition fails (e.g., `seed_topics_complete` is false), Agent reports the missing condition and does NOT proceed

#### Scenario: Agent checks exit gate before marking node complete

- **WHEN** Agent finishes the steps in node `wave0`
- **THEN** it verifies all `exit` conditions are met
- **AND** if any condition fails, Agent stays in the node until conditions are satisfied

### Requirement: State file is YAML at run bundle root

Every run bundle SHALL contain a `run-bundle-state.yaml` file at its root (`deck_<name>/run-bundle-state.yaml`). This file SHALL be readable and writable by both MD-side (Agent) and CLI-side (.mjs scripts). It SHALL track: active playbook, current node, per-node status, gate decisions, and deck metadata.

#### Scenario: Agent reads state to resume after interruption

- **WHEN** Agent opens a run bundle that was previously in progress
- **THEN** reading `run-bundle-state.yaml` reveals which playbook is active, which node is current, and which nodes are completed
- **AND** Agent can resume from the current_node without repeating completed work

#### Scenario: CLI script reads state before executing

- **WHEN** `unified_pipeline.mjs` is about to run Stage 2
- **THEN** it reads `run-bundle-state.yaml` to verify `visual_gate` is `approved` or `waived`
- **AND** if the gate is `pending`, the script refuses to run and reports the missing condition

### Requirement: Node status has exactly five valid states

A node's status SHALL be one of: `pending` (not yet started), `in_progress` (currently executing), `completed` (all exit conditions met), `skipped` (explicitly bypassed by user decision), or `failed` (blocked, requires intervention).

#### Scenario: Node transitions through statuses

- **WHEN** Agent starts a node → status changes from `pending` to `in_progress`
- **WHEN** Agent completes all steps and exit conditions → status changes to `completed`
- **WHEN** user explicitly says "skip this" → status changes to `skipped`

### Requirement: Shared nodes can be referenced by multiple playbooks

A node with `shared: true` in frontmatter SHALL be referenceable by multiple playbooks. Playbooks SHALL reference shared nodes via `includes: [<node-name>, ...]` rather than duplicating the node content.

#### Scenario: Two playbooks use the same classification node

- **WHEN** playbook `chain-a.md` and `chain-b.md` both need change classification
- **THEN** they both reference `includes: [classify-change]` rather than each containing a copy

### Requirement: Node body distinguishes MD steps from CLI steps

Each node body SHALL use `## Step N — MD` for Agent-executed instructions and `## Step N — CLI` for script invocations. MD steps SHALL reference methodology files in `workflow/` without duplicating their content. CLI steps SHALL include the exact command with parameter placeholders.

#### Scenario: Agent reads a node with mixed step types

- **WHEN** Agent reads node `wave0`
- **THEN** MD steps point to `workflow/02-content/` files for methodology
- **AND** CLI steps specify `node scripts/unified_pipeline.mjs --stage 1`
