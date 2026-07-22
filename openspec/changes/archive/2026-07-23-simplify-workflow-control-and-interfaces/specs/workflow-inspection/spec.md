## ADDED Requirements

### Requirement: Inspection provides the sole run-scoped observation workflow entry

After Change-1 ledger evidence identifies an exact run, Controller resume/iteration routing and
CLI observation (`status` and non-mutating `state`) SHALL obtain their ordered workflow entry from
`workflow_inspection.primary_action`. They SHALL not rederive mode, gate, recovery, completion,
hash, authorization, or next-action policy from generic node state. Greenfield `init` and every
mutating CLI command remain direct-owner entries and SHALL not use this projection to select or
replace the requested operation. The entry SHALL expose only required identity/order/error facts
and owner-issued action; it SHALL not write, cache, call a provider, or replace mutation-time
direct revalidation.

#### Scenario: Controller resumes a valid run
- **WHEN** a controller resumes an exact run
- **THEN** it resolves the semantic intent, then consumes one inspection primary action before
  selecting a resume/iteration route
- **AND** it does not synthesize a competing generic-node action

#### Scenario: Direct fact changes after entry
- **WHEN** a source, receipt, authorization, or CAS value changes after entry returns
- **THEN** the direct mutation owner rechecks it before writing
- **AND** the prior projection cannot authorize mutation

#### Scenario: Greenfield initialization has no inspection entry
- **WHEN** a caller has not yet created or resolved an exact run
- **THEN** it uses the direct `init` entry rather than requesting workflow inspection
- **AND** inspection does not fabricate a run, controller, or mutation authority

### Requirement: Inspection composes one action from the retained execution cursor

After protected layout, state-integrity, mode, journal, authorization, and recovery prerequisites
have selected no earlier action, inspection SHALL read the direct state-owned execution cursor. A
current `waiting_for` SHALL produce exactly state-owned `wait-for-human` with `kind: continue`,
`requires_human: true`, and no mutation invocation. An in-progress node SHALL produce exactly
playbook-controller-owned `resume-current-node` with `kind: continue`; an otherwise eligible
controller state SHALL produce exactly playbook-controller-owned `select-controller-route` with
`kind: continue`. The latter two actions SHALL carry bounded route data so callers do not
reconstruct it from cursor fields, and neither SHALL create an action menu. The projection SHALL
retain the cursor only as contextual direct facts and SHALL not write, advance, clear, or synthesize
it from display fields. Any later mutation SHALL rerun inspection and retain direct-owner
revalidation.

#### Scenario: Waiting execution precedes optional candidates
- **WHEN** a valid exact run has current-node `waiting_for` and multiple eligible candidates
- **THEN** inspection returns the one wait action as `primary_action`
- **AND** it does not expose a candidate action as a continuation or execute a mutation

#### Scenario: In-progress execution resumes through one action
- **WHEN** a valid exact run has an in-progress current node and no earlier protected prerequisite
- **THEN** inspection returns one bounded resume action for that cursor
- **AND** it does not ask callers to reconstruct a command from `playbook`/`current_node`
