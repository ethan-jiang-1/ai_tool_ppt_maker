## MODIFIED Requirements

### Requirement: Pilot evidence preserves selected-workflow isolation

The selected workflow adapter SHALL own the workflow-specific Pilot
contribution. Pure Pilot evidence SHALL present the exact current raw
whole-canvas bytes with identity and plan/profile bindings and SHALL not invoke,
import, or expose Framed composition, Text Frame, safe-zone, or underlay
semantics. Shared production mechanics may validate generic coverage and
labels but SHALL not decide Pilot visual quality for either workflow.

#### Scenario: Pure Pilot has no Framed semantics

- **WHEN** a current Pure Pilot projection is prepared
- **THEN** it contains exact whole-canvas raw bytes and generic identity
  evidence only
- **AND** no Framed compositor, safe-zone guide, or Text Frame contribution is
  used

#### Scenario: Sibling workflow cannot publish Pilot evidence

- **WHEN** a Framed run is passed to a Pure Pilot publisher or a Pure run is
  passed to a Framed Pilot publisher
- **THEN** the selected-workflow check hard-stops before artifact publication
- **AND** the owner does not delegate to the sibling adapter
