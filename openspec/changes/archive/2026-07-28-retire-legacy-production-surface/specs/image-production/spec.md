## ADDED Requirements

### Requirement: Image production exposes one Page Authority adapter
The image-production public surface SHALL expose only the Page Authority adapter and its Pure/Framed
branches. Whole-page and visual-slot adapters SHALL not be exported, registered, or imported by an
active production caller.

#### Scenario: Production adapter inventory is inspected
- **WHEN** a current production caller imports image production
- **THEN** it can resolve Page Authority only


## REMOVED Requirements

### Requirement: Image Production has explicit whole-page and visual-slot adapters
**Reason**: The legacy contract is replaced by the current owner Page Authority adapter.
**Migration**: Use the current contract owned by Page Authority adapter.
