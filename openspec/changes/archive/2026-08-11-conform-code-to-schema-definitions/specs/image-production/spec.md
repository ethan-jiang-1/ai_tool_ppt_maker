## MODIFIED Requirements

### Requirement: Current Page Image Workflow has one selected finalization publisher

For an exact current schema-declared Page Image source/state/receipt tuple, the
selected `framed` or `pure` adapter SHALL be the sole publisher of the declared
`final-page-list` role. It SHALL retain the existing current-review and bound
fact checks before publication. A missing, mismatched, or undeclared contract
value SHALL fail through its owner and SHALL not select a historical finalization
or compatibility publisher.

#### Scenario: A current finalization is published

- **WHEN** the selected adapter has current reviewed and bound facts
- **THEN** it publishes only the declared final-page-list contract
- **AND** no alternate or historical manifest format is emitted or accepted

#### Scenario: Pure preserves current provider page bytes

- **WHEN** a current Pure page is finalized after review
- **THEN** its current final-page-list retains the reviewed provider bytes under the declared role
- **AND** it does not translate an alternate artifact format

#### Scenario: Framed finalization repeats its reviewed overlay

- **WHEN** a current Framed page is finalized after review
- **THEN** finalization retains the established reviewed overlay behavior
- **AND** it publishes only the declared current final-page-list
