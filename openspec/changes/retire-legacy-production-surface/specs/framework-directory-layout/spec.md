## ADDED Requirements

### Requirement: Framework layout has no retired production owner
The framework directory map and executable inventory SHALL expose the Page Authority adapter and its
retained runtime seams, but SHALL NOT expose HTML deck, whole-page, Header-Lock, or visual-slot
production owners.

#### Scenario: Script inventory is audited
- **WHEN** framework executable ownership is validated
- **THEN** every registered production executable belongs to the current Page Authority path or a retained protocol-neutral runtime

