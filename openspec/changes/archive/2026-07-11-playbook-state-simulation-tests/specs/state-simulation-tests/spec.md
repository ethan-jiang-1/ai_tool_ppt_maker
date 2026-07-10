## ADDED Requirements

### Requirement: tests_e2e/ directory exists at repo root

`tests_e2e/` SHALL exist at repo root, separate from `tests/`. It SHALL contain state machine simulation tests.

#### Scenario: Human lists repo root

- **WHEN** a human runs `ls`
- **THEN** they see both `tests/` and `tests_e2e/`

### Requirement: Happy path covers all create-deck nodes

The happy path test SHALL simulate 10 nodes: instantiation → hitl1 → setup → seed-topics → wave0 → wave1 → wave2 → hitl2 → readiness → final. Each SHALL transition pending→in_progress→completed with current_node updated.

### Requirement: Entry gate prevents premature execution

When a `requires` predecessor is not `completed`, the simulation SHALL detect that the downstream node cannot start.

### Requirement: Exit gate prevents premature completion

When exit conditions are not met, the simulation SHALL keep the node `in_progress`.

### Requirement: Rerun branch routes correctly

`hitl2` with `decision: repair` SHALL route to `rerun` → `seed-topics`. `decision: proceed` SHALL route to `readiness` → `final`.

### Requirement: Gate states persist correctly

`approved` and `waived` SHALL both survive `writeState`→`readState` round-trip. `pending` SHALL prevent Stage 2.

### Requirement: State survives restart

`writeState`→`readState` SHALL restore `current_node` and all node statuses. The simulation SHALL resume from current_node.

### Requirement: Shared nodes are referenceable

`classify-change` SHALL be referenced by both `edit-text` and `edit-visual` via `includes` without duplication.

### Requirement: node_done accepts skipped

`isNodeDone` SHALL return `true` for `skipped` nodes. `isNodeCompleted` SHALL return `false`.

### Requirement: Playbook stack preserves position

`switchPlaybook` SHALL push `{playbook, current_node}`. `resumePlaybook` SHALL pop and restore.

### Requirement: Atomic write produces valid state

`writeState` SHALL produce a file that `readState` can read back correctly.

### Requirement: Corrupted state is detected

Invalid YAML SHALL return `{corrupted: true, errors: [...]}`. Missing file SHALL return default state.

### Requirement: validateState detects illegal transitions

`completed`→`in_progress` SHALL be detected as illegal by `validateState`.
