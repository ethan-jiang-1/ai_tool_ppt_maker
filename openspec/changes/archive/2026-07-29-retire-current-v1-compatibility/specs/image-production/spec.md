## REMOVED Requirements

### Requirement: Image production exposes one Page Authority adapter
**Reason**: The requirement retains the v1 adapter and compatibility mutation surface as an active interface.
**Migration**: Current production resolves only the selected v2 workflow. Historical conversion is not an Image Production runtime and requires separately authorized deck-scoped work if ever needed.

## MODIFIED Requirements

### Requirement: Page Authority has one finalization Interface
For the exact TARGET `page-authority-image2-v2` / `image2-page-authority-v2` pair, the selected workflow adapter SHALL be the only final-slide publisher. It SHALL publish the common v2 final-slide manifest and shall not route a receipt through another protocol adapter or alternate compositor. A marker/state mismatch or stale raw evidence SHALL stop before final-slide publication.

#### Scenario: Raw acceptance is required before publication
- **WHEN** a reviewable target raw projection has no decision
- **THEN** finalization returns the raw-review `confirm` action without publication
- **AND** invalid or stale raw evidence hard-stops final-slide publication

#### Scenario: TARGET finalization selects one workflow publisher
- **WHEN** a valid TARGET source/state pair has workflow `framed` or `pure`
- **THEN** only its matching workflow adapter may publish the v2 final-slide manifest
- **AND** it does not invoke another-protocol or sibling workflow adapter

## ADDED Requirements

### Requirement: Image production resolves only selected v2 workflow owners
Image Production SHALL resolve an exact v2 source/state pair marker-first to the selected `03-framed-image` or `04-pure-image` adapter followed by shared `05-delivery`. A non-v2, partial, hybrid, or mismatched pair SHALL not resolve an adapter, writer, receipt initializer, or finalization path; it receives the owning unsupported-protocol or identity hard-stop.

#### Scenario: Production adapter inventory is inspected
- **WHEN** a production caller presents a v2 source/state pair
- **THEN** it resolves only the declared selected workflow owner
- **AND** no non-v2 adapter is exported, registered, or imported
