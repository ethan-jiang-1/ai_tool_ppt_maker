## ADDED Requirements

### Requirement: Active guidance has one attributable Agent control route

Active Charter, Bootstrap, reference, workflow, command, and Agent guidance
SHALL route intent through the applicable MD Controller or direct CLI owner.
It SHALL not point to an Agent prompt cookbook, standalone route catalog, or
duplicate workflow-inspection prose as an authority. A guidance surface that
does not name its direct current owner SHALL be absent from the active Harness.

#### Scenario: An Agent starts current work from guidance

- **WHEN** an Agent follows active Harness guidance for setup, new work, resume,
  change, or recovery
- **THEN** it reaches the current owner without consulting a second routing
  registry or prompt cookbook
- **AND** it does not treat a prose summary as lifecycle or state authority

#### Scenario: Retired control prose is absent

- **WHEN** active Harness guidance is searched for retired prompt, route, or
  inspection-projection surfaces
- **THEN** no active entry or cross-reference exposes one
- **AND** archived OpenSpec and authorized Backlog records remain outside that
  active-surface assertion
