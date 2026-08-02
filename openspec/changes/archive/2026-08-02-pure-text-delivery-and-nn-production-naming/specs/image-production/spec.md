## ADDED Requirements

### Requirement: Production final files use NN_slideID naming

The final-slide manifest SHALL name each production file `NN_slideID.png`,
where `NN` is the item's current `position` zero-padded to two digits and
`slideID` is the stable mnemonic `slide_id`. The final manifest validator SHALL
require this exact path shape, and PPTX assembly SHALL consume it. `slide_id`
remains the cross-version identity inside the filename; `NN` is only the current
position projection and changes with reordering.

#### Scenario: Final files carry position prefix

- **WHEN** a final manifest is created for ordered slides with positions 1..N
- **THEN** each item path is `NN_slideID.png` in position order
- **AND** the validator accepts those exact paths

#### Scenario: Non-prefixed final path is rejected

- **WHEN** a final manifest item path is not `NN_slideID.png` (for example
  `${slide_id}.png` only)
- **THEN** the final manifest validator reports an invalid item
- **AND** assembly does not accept the manifest
