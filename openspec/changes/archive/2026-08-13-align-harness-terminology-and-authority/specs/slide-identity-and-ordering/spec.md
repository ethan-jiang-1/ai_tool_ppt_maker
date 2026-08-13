## ADDED Requirements

### Requirement: Identity guidance distinguishes formal fields from filename projections

Active identity guidance SHALL distinguish the stable formal `slide_id` field
from its position-prefixed `NN_slideID` filename projection. The projection
preserves the exact formal identity literal while `NN` reflects only current
position; casing in the filename label SHALL not be described as a second
identity field, selector, or schema conversion.

#### Scenario: A maintainer reads page artifact naming guidance

- **WHEN** a maintainer compares source identity with a final page filename
- **THEN** it can identify `slide_id` as the stable cross-version identity and
  `NN_slideID` as its current-position filename projection
- **AND** it does not infer a rename, identity migration, or alternate selector
  contract
