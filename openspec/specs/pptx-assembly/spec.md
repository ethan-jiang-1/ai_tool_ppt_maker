## Purpose

Define Page Authority PPTX assembly from the ordered current final-slide manifest.
Assembly creates one receipt-bound delivery container and never accepts a raw,
historical, partial, or unregistered final artifact as current input.

## Requirements

### Requirement: PPTX assembly consumes the Page Authority final manifest
PPTX assembly SHALL accept only the ordered v2 Page Authority final-slide
manifest and its receipt-bound files. It SHALL reject foreign or unregistered
final artifacts as current assembly input. For a Pure Page Authority manifest,
the accepted native final PNG is an exact `2048x1136` image; assembly SHALL
place that verified image as the complete slide image without changing its source
bytes, stable identity, final manifest identity, or delivery lineage. Framed
final media remains owned by the Framed local compositor and SHALL not be
reinterpreted as a provider-media normalization by assembly.

#### Scenario: Current native final slides are assembled
- **WHEN** a valid Pure v2 Page Authority final manifest has receipt-bound
  `2048x1136` final PNG files
- **THEN** assembly produces a PPTX receipt bound to the ordered Page Authority
  final evidence and embeds the verified final image bytes
- **AND** it does not crop, resize, transcode, or replace the source PNG files

#### Scenario: Foreign or wrong media cannot become assembly input
- **WHEN** a final artifact is foreign, unregistered, hash-drifted, malformed,
  or does not meet the selected workflow's final media contract
- **THEN** assembly rejects it before creating a current delivery container
- **AND** it does not substitute another image or bypass the current manifest

### Requirement: Page Authority PPTX slides project their current ordinal

PPTX Assembly SHALL place a small right-bottom footer on every assembled Page
Authority slide. The footer SHALL display the slide's current one-based
ordinal with the same minimum-two-digit decimal format used by human-facing
image projections. Target-v2 delivery SHALL use the final manifest item's
position; bounded CURRENT assembly SHALL derive the ordinal from the accepted
manifest order.

The final image SHALL remain the slide's image content. The footer
is a derived presentation annotation only: it SHALL not alter final image
bytes, `slide_id`, final manifest identity, raw evidence, or delivery lineage.
Assembly SHALL not introduce an opt-out configuration or a new review/gate
path for the footer.

#### Scenario: Target delivery writes matching page footers

- **WHEN** target-v2 final manifest entries have current positions 1, 10, and
  100
- **THEN** the assembled PPTX contains a right-bottom footer with `01`, `10`,
  and `100` on the corresponding slides
- **AND** each slide still contains its matching final image

#### Scenario: Bounded CURRENT assembly derives order locally

- **WHEN** a bounded CURRENT manifest contains ordered entries without a
  separately persisted position field
- **THEN** assembly writes one footer per entry from its manifest order
- **AND** it does not add page ordinals to the manifest's stable identities or
  receipt bindings
