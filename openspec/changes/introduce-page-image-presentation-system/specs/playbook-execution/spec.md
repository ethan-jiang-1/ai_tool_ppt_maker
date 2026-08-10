## MODIFIED Requirements

### Requirement: Controllers create and resume only the current Page Image Workflow

Registered Controllers SHALL create and resume only a V2 Page Image run. For a
fresh version they obtain one human semantic choice, `framed` or `pure`, before
provider work; JS records and validates the V2 source/state/evidence route.
The controller then exposes only selected workflow prerequisites, gate, and
nearest action. It shall not ask for slide-level workflow choice or infer it
from deck type, content, or generated artifacts.

Non-V2 source/state input is not a Controller route. The Controller presents
the producer-issued `unsupported-protocol/export` hard-stop and does not
register, select, rewrite, resume, or migrate it.

#### Scenario: Framed V2 selection creates one straight route

- **WHEN** a human selects `framed` for a valid fresh V2 source
- **THEN** the Controller enters Framed and later shared delivery without
  presenting Pure as slide-level choice
- **AND** provider work remains governed by its existing scoped authorization

#### Scenario: A Framed deck has one straight selected route

- **WHEN** a human selects `framed` for valid fresh V2 source
- **THEN** the Controller presents only Framed Style Master and Page Image
  handoffs before shared delivery
- **AND** it does not expose Pure or slide-level policy choice

#### Scenario: A current resume preserves owner evaluation

- **WHEN** a V2 Controller resumes blocked work
- **THEN** it presents Workflow Inspection's owner-issued primary action
- **AND** it does not infer another route or evidence from a task card

## REMOVED Requirements

### Requirement: Active Controller guidance rejects v2 Page Authority routes

**Reason**: V2 is the only Controller route.

**Migration**: Non-V2 input has one protocol hard-stop outside the playbook
graph.
