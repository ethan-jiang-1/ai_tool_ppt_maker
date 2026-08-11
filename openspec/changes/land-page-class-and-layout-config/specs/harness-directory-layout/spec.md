## ADDED Requirements

### Requirement: Schema definitions materialize the Page Class presentation flow

The Harness schema home and serialization inventory SHALL identify the current
executable producers and consumers for Page Source `page_class`, version-level
`layout-config`, and per-page `page-layout`. The definitions SHALL state their
source or derived role, scope, workflow-isolation boundary, direct inputs and
outputs, provenance requirement, and selected-profile invalidation cause; code
anchors and the inventory SHALL agree on that one ownership.

The serialization inventory SHALL group the four unversioned presentation
source contracts `pptmaker-page-image-class-catalog`,
`pptmaker-page-image-deck-defaults`, `pptmaker-pure-deck-visual-system`, and
`pptmaker-framed-header-profiles` under `layout-config`. It SHALL remove the
active `framed_header_preset` selector and the Pure record's visual-language
registry membership. No C4 source contract may retain a revision/version
marker, an undeclared value, or a second active selector.

The definition home SHALL describe the current C4 flow only. It SHALL NOT
become a Run Bundle reader, a Page Class resolver, a generated-layout
publisher, a compatibility map for `FRAME PRESET`, or a migration facility.

#### Scenario: A maintainer traces Page Class ownership

- **WHEN** a maintainer opens the Page Source, layout-config, and page-layout
  definitions
- **THEN** the current producer/consumer flow identifies source ownership,
  workflow-isolated resolution, provenance, and selected-profile invalidation
- **AND** it does not mark C4 producers as planned, group Pure presentation
  under visual language, or describe a legacy selector path
