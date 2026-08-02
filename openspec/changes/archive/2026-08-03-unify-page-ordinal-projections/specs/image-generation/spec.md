## ADDED Requirements

### Requirement: Human-facing Page Authority image projections use current ordinal names

Image Generation SHALL name every generated per-page Page Authority image that
is intended for human browsing as `NN_slideID.png`, where `NN` is that slide's
one-based current plan position padded to at least two decimal digits and
`slideID` is the stable formal `slide_id`. This applies to rebuildable raw
image projections and Pure/Framed Pilot per-page image outputs. A Pilot subset
SHALL use positions from its complete current raw plan, rather than renumbering
the subset.

Raw work plans/contracts, provider requests, authorization, CAS records,
attempts, provenance, accepted evidence, and receipt bindings SHALL continue
to use stable `slide_id` and digest facts. A stable evidence path or raw
contract SHALL NOT be treated as the human-facing projected filename.

#### Scenario: Raw and Pilot images use the full-plan ordinal

- **WHEN** a current raw plan has `DeckGo` at position 1 and `DataMap` at
  position 10, and a Pilot contains only `DataMap`
- **THEN** its raw projections are named `01_DeckGo.png` and
  `10_DataMap.png`
- **AND** the Pilot image for `DataMap` is named `10_DataMap.png`, not
  `01_DataMap.png`

#### Scenario: Ordinal width grows naturally

- **WHEN** a current Page Authority plan contains a slide at position 100
- **THEN** its human-facing image projection is named `100_slideID.png`
- **AND** no three-digit position is truncated or wrapped to two digits

#### Scenario: Reordering changes only the display projection

- **WHEN** a structural version reorders unchanged slides with stable IDs and
  unchanged raw-contract tuples
- **THEN** regenerated human-facing image filenames reflect the new positions
- **AND** the stable IDs and immutable raw authorization/provenance records are
  not renamed or replaced by the ordinal prefix
