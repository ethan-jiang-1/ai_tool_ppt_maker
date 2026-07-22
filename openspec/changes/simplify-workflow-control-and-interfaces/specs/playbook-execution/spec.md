## ADDED Requirements

### Requirement: Playbook controller delegates workflow control to inspection

The MD Controller SHALL use the workflow-entry inspection result for create, resume, small
refresh, structural change, and recovery routing. It SHALL retain intent interpretation, creative
work, human communication, and playbook sequencing, but SHALL not reconstruct direct-owner
mode/gate/recovery rules. A `confirm` requires the owner-defined human reason; a hard-stop reports
the protected invariant and owner recovery without a bypass.

#### Scenario: Recovery has an owner-issued action
- **WHEN** inspection returns a hard-stop for an identity, authorization, or recovery fact
- **THEN** the controller presents the owner recovery action and invariant
- **AND** it does not offer generic state editing, force, or waive
