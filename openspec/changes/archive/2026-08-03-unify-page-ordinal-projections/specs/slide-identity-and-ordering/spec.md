## MODIFIED Requirements

### Requirement: Slide identity is stable while position is derived
Every slide block SHALL have a non-empty `slide_id` that represents page identity independently of
order. The canonical `slide-specifications.md` physical order is the order source of truth, and the
system SHALL derive a one-based `position` plus zero-padded heading number from it. Moving a slide,
changing its title, or changing its renderer SHALL not change its `slide_id`; an intentional identity
replacement is a separately reviewed source edit, not an ordinary content or order operation.

IDs SHALL be unique across the current deck and remain reserved after deletion. Creation and insertion
shall reserve IDs and spoken keys found in version history. A pre-existing historical-format ID, such as
`s07_problem`, remains a readable/reserved formal identity when the containing source otherwise has a
supported current pipeline/state protocol. It is an identity exception only: it SHALL not select a
pipeline, Controller, renderer, source marker, or state-repair path, and structural editing SHALL not
rename it merely because its embedded page number is no longer current.

Human-facing artifact labels, per-page image filenames, and PPTX page footers
MAY project the current derived `position`, but SHALL keep the stable
`slide_id` intact and SHALL treat the ordinal as a replaceable presentation
projection. Raw contracts, provider authorization, CAS/attempt/provenance
records, receipts, and cross-version selectors SHALL NOT use an ordinal prefix
as their identity or addressing key.

#### Scenario: Reordering preserves identity
- **WHEN** the slide at position 7 with ID `IDFix` is moved after the current position 3 slide
- **THEN** its derived position and heading number change
- **AND** its formal `slide_id` remains `IDFix`

#### Scenario: Retained historical ID does not select a route
- **WHEN** a current explicit source contains retained ID `s07_problem`
- **THEN** the resolver treats it as that formal identity while position is derived separately
- **AND** it does not infer a retired mode, alternate Controller, or historical state protocol

#### Scenario: Human-facing ordinal changes without identity replacement
- **WHEN** a structural version moves `DeckGo` from position 1 to position 10
- **THEN** its derived image filename and PPTX footer project `10` while
  retaining `DeckGo` as the stable identity
- **AND** no raw contract, authorization, provenance record, receipt, or
  selector is renamed to `10_DeckGo`
