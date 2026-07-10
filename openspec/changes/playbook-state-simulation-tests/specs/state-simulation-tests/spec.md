## ADDED Requirements

### Requirement: tests_e2e/ directory exists at repo root

`tests_e2e/` SHALL exist at repo root, separate from `tests/`. It SHALL contain state machine simulation tests for playbook execution.

#### Scenario: Human lists repo root

- **WHEN** a human runs `ls`
- **THEN** they see both `tests/` (unit) and `tests_e2e/` (simulation)

### Requirement: Happy path test covers all 11 nodes

`test-state-machine.mjs` SHALL simulate the complete create-deck playbook: instantiation → hitl1 → setup → seed-topics → wave0 → wave1 → wave2 → hitl2 → readiness → final. Each node transition SHALL verify state is updated correctly.

#### Scenario: Full playbook executes without error

- **WHEN** the happy path test runs
- **THEN** all 11 node statuses transition through pending → in_progress → completed
- **AND** `current_node` updates at each step
- **AND** final state has all nodes completed

### Requirement: Entry gate prevents premature execution

When a node's `requires` predecessor is not `completed`, the test SHALL verify that the node cannot be started.

#### Scenario: Agent tries to execute wave0 before seed-topics

- **WHEN** seed-topics is `pending` and Agent tries to start wave0
- **THEN** the simulation detects entry condition failure
- **AND** wave0 status remains `pending`

### Requirement: Exit gate prevents premature completion

When a node's `exit` conditions are not met, the test SHALL verify the node cannot transition to `completed`.

#### Scenario: Node exit conditions fail

- **WHEN** Agent finishes node steps but exit conditions are not satisfied
- **THEN** the simulation detects exit condition failure
- **AND** node status remains `in_progress`

### Requirement: Rerun branch routes correctly

When hitl2 produces `decision: repair`, the simulation SHALL route to `rerun` node, then back to `seed-topics`.

#### Scenario: User requests repair at hitl2

- **WHEN** user decision is `repair`
- **THEN** next node is `rerun` (not `readiness`)
- **AND** after rerun completes, flow returns to `seed-topics`

### Requirement: State survives restart

State written via `writeState()` SHALL be recoverable via `readState()`. The simulation SHALL write state, clear in-memory state, read it back, and resume from `current_node`.

#### Scenario: Agent resumes after session ends

- **WHEN** state is written with `current_node: wave1` and then reloaded
- **THEN** `readState()` returns the same current_node and node statuses
- **AND** Agent can continue from wave1

### Requirement: Shared nodes are referenceable

`classify-change.md` SHALL be referenced correctly by both `edit-text` and `edit-visual` playbooks via `includes`.

#### Scenario: Two playbooks include the same shared node

- **WHEN** `edit-text` and `edit-visual` both declare `includes: [classify-change]`
- **THEN** both can execute classify-change without duplicating its content
