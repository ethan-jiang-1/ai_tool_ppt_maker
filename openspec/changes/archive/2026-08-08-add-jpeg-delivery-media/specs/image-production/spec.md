## MODIFIED Requirements

### Requirement: Production final files use NN_slideID naming

The final-slide manifest SHALL name each production file `NN_slideID.png`,
where `NN` is the item's current `position` zero-padded to two digits and
`slideID` is the stable mnemonic `slide_id`. The final manifest validator SHALL
require this exact path shape. Shared delivery SHALL derive a same-order
`NN_slideID.jpg` delivery representation from each valid final PNG before
PPTX assembly; the final PNG remains the finalization artifact and SHALL NOT
be replaced by that derivative. `slide_id` remains the cross-version identity
inside both filenames; `NN` is only the current position projection and
changes with reordering.

#### Scenario: Final files carry position prefix

- **WHEN** a final manifest is created for ordered slides with positions 1..N
- **THEN** each item path is `NN_slideID.png` in position order
- **AND** delivery derives a matching `NN_slideID.jpg` representation before
  assembly without changing the final manifest item

#### Scenario: Non-prefixed final path is rejected

- **WHEN** a final manifest item path is not `NN_slideID.png` (for example
  `${slide_id}.png` only)
- **THEN** the final manifest validator reports an invalid item
- **AND** delivery does not derive JPEG media or assemble a PPTX from it
