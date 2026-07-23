## MODIFIED Requirements

### Requirement: Inspection provides the sole run-scoped observation workflow entry
After Change-1 ledger evidence identifies an exact run, Controller resume/iteration routing and CLI observation (`status` and non-mutating `state`) SHALL obtain their ordered workflow entry from `workflow_inspection.primary_action`. They SHALL not rederive mode, gate, recovery, completion, hash, authorization, or next-action policy from generic node state. Greenfield `init` and every mutating CLI command remain direct-owner entries and SHALL not use this projection to select or replace the requested operation.

#### Scenario: Controller resumes an existing run
- **WHEN** a Controller has resolved an exact existing run for resume or iteration
- **THEN** it consumes `workflow_inspection.primary_action` as its ordered observation input
- **AND** it does not rebuild mode or recovery policy from generic state fields

### Requirement: Inspection composes one action from the retained execution cursor
After protected layout, state-integrity, mode, journal, authorization, and recovery prerequisites have selected no earlier action, inspection SHALL read the direct state-owned execution cursor. A current `waiting_for` SHALL produce exactly state-owned `wait-for-human` with `kind: continue`, `requires_human: true`, and no mutation invocation. An in-progress node SHALL produce exactly playbook-controller-owned `resume-current-node` with `kind: continue`; an otherwise eligible controller state SHALL produce exactly playbook-controller-owned `select-controller-route` with `kind: continue`. The latter two actions SHALL carry bounded route data so callers do not reconstruct it from cursor fields, and neither SHALL create an action menu.

#### Scenario: Inspection observes an in-progress node
- **WHEN** no earlier protected prerequisite blocks an exact run and its current node is in progress
- **THEN** inspection returns the single playbook-controller-owned `resume-current-node` action
- **AND** it does not create a competing action menu
