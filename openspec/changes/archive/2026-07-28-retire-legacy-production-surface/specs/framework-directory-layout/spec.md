## ADDED Requirements

### Requirement: Framework layout has no retired production owner
The framework directory map and executable inventory SHALL expose the Page Authority adapter and its
retained runtime seams, but SHALL NOT expose HTML deck, whole-page, Header-Lock, or visual-slot
production owners.

#### Scenario: Script inventory is audited
- **WHEN** framework executable ownership is validated
- **THEN** every registered production executable belongs to the current Page Authority path or a retained protocol-neutral runtime


## REMOVED Requirements

### Requirement: Phase directories are under workflow/
**Reason**: The legacy contract is replaced by the current owner framework layout.
**Migration**: Use the current contract owned by framework layout.

### Requirement: scripts/README.md exists
**Reason**: The legacy contract is replaced by the current owner framework layout.
**Migration**: Use the current contract owned by framework layout.

### Requirement: All cross-references resolve correctly
**Reason**: The legacy contract is replaced by the current owner framework coherence.
**Migration**: Use the current contract owned by framework coherence.

### Requirement: Current whole-page work has direct framework ownership
**Reason**: The legacy contract is replaced by the current owner framework layout + playbook.
**Migration**: Use the current contract owned by framework layout + playbook.
