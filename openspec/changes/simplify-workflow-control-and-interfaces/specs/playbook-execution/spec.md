## ADDED Requirements

### Requirement: Playbook controller delegates workflow control to inspection

After it has resolved a semantic intent and exact run, the MD Controller SHALL use the
workflow-entry inspection result for resume, small refresh, structural change, and recovery
observation/routing. Greenfield creation SHALL first use the direct `init` entry, then consume
inspection only after the exact run exists. The Controller SHALL retain intent interpretation,
creative work, human communication, and playbook sequencing, but SHALL not reconstruct
direct-owner mode/gate/recovery rules or turn a resume action into a substitute for a requested
mutation. A `confirm` requires the owner-defined human reason; a hard-stop reports the protected
invariant and owner recovery without a bypass.

#### Scenario: Recovery has an owner-issued action
- **WHEN** inspection returns a hard-stop for an identity, authorization, or recovery fact
- **THEN** the controller presents the owner recovery action and invariant
- **AND** it does not offer generic state editing, force, or waive

#### Scenario: Controller starts a new deck
- **WHEN** no exact run has been created for a new-deck request
- **THEN** the Controller invokes the direct initialization entry before asking for workflow inspection
- **AND** it does not invent a current node or resume action
