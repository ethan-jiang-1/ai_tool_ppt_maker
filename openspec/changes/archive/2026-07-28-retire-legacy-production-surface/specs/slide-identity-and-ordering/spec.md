## ADDED Requirements

### Requirement: Structural identity remains independent of retired output modes
Structural previews and applications SHALL preserve stable slide identity while calculating Page
Authority raw-materialization and Framed-local-finalization impact. They SHALL NOT use legacy
whole-page, Header-Lock, or HTML final-output assumptions.

#### Scenario: A structural Page Authority version is previewed
- **WHEN** slides are reordered or their authority changes
- **THEN** the preview reports stable-ID Page Authority impact without selecting a legacy output owner


## REMOVED Requirements

### Requirement: Structural edits are previewed and committed as one transaction
**Reason**: The legacy contract is replaced by the current owner structural versioning.
**Migration**: Use the current contract owned by structural versioning.

### Requirement: Structural apply preserves source versions and publishes an edit receipt
**Reason**: The legacy contract is replaced by the current owner structural versioning.
**Migration**: Use the current contract owned by structural versioning.

### Requirement: Render artifact identity excludes current position
**Reason**: The legacy contract is replaced by the current owner Page Authority artifacts.
**Migration**: Use the current contract owned by Page Authority artifacts.

### Requirement: Structured contract preserves stable identity and derived order
**Reason**: The legacy contract is replaced by the current owner Page Authority source.
**Migration**: Use the current contract owned by Page Authority source.

### Requirement: Round-trip edits do not shift notes or unrelated blocks
**Reason**: The legacy contract is replaced by the current owner Page Authority source.
**Migration**: Use the current contract owned by Page Authority source.

### Requirement: Composition artifact identity excludes physical position
**Reason**: The legacy contract is replaced by the current owner Framed compositor.
**Migration**: Use the current contract owned by Framed compositor.
