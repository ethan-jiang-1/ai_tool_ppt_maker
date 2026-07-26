## ADDED Requirements

### Requirement: Page Authority identity references are registered clean derivatives
Visual Asset Management SHALL resolve identity references only from registered, single-pose, label-free
derivatives under `2_backbone/visual-style/assets/reference`, each with an expected SHA-256, subject
class, and guarded role clause. The Amber model sheet SHALL be promoted as doctrine from the verified v1
source SHA-256 `f71a7ed8ec8f69e10ffbe2997e81f123d46515b5608de61afc155d6b3ed6c756` to
`assets/reference/amber-agent/model-sheet.png`. The multi-pose sheet SHALL never be accepted as a
provider reference or asset-manifest substitute.

#### Scenario: Model sheet and checksum drift are rejected
- **WHEN** a source selects the model sheet directly or a selected role derivative differs from its SHA-256
- **THEN** raw-contract compilation hard-stops before authorization
- **AND** no provider payload or cached reuse is accepted

#### Scenario: Doctrine promotion preserves verified bytes
- **WHEN** the v1 model sheet is promoted into the deck backbone doctrine location
- **THEN** its SHA-256 equals `f71a7ed8ec8f69e10ffbe2997e81f123d46515b5608de61afc155d6b3ed6c756`
- **AND** it is not registered as a selectable provider reference
