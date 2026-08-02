## ADDED Requirements

### Requirement: Page Authority PPTX slides project their current ordinal

PPTX Assembly SHALL place a small right-bottom footer on every assembled Page
Authority slide. The footer SHALL display the slide's current one-based
ordinal with the same minimum-two-digit decimal format used by human-facing
image projections. Target-v2 delivery SHALL use the final manifest item's
position; bounded CURRENT assembly SHALL derive the ordinal from the accepted
manifest order.

The full-page final image SHALL remain the slide's image content. The footer
is a derived presentation annotation only: it SHALL not alter final image
bytes, `slide_id`, final manifest identity, raw evidence, or delivery lineage.
Assembly SHALL not introduce an opt-out configuration or a new review/gate
path for the footer.

#### Scenario: Target delivery writes matching page footers

- **WHEN** target-v2 final manifest entries have current positions 1, 10, and
  100
- **THEN** the assembled PPTX contains a right-bottom footer with `01`, `10`,
  and `100` on the corresponding slides
- **AND** each slide still contains its matching full-page final image

#### Scenario: Bounded CURRENT assembly derives order locally

- **WHEN** a bounded CURRENT manifest contains ordered entries without a
  separately persisted position field
- **THEN** assembly writes one footer per entry from its manifest order
- **AND** it does not add page ordinals to the manifest's stable identities or
  receipt bindings
