## ADDED Requirements

### Requirement: Schema definitions name C3's materialized upstream producers
After C3 lands, the schema definition home SHALL name `story-outline` and
`design-constraints` as human-authored current source stages and SHALL name the
story-to-page-source transformation as a materialized current owner. Their
stage definitions, `flow.yaml`, recovery route, serialization inventory where a
durable value is introduced, and code anchors SHALL agree on that one ownership.

The definition home remains descriptive authority. It SHALL NOT become a
runtime controller, a Run Bundle reader, a page-plan state store, or a
historical-source migration facility.

#### Scenario: A maintainer traces the upstream flow
- **WHEN** a maintainer opens the Story Outline, Design Constraints, and
  page-source definitions
- **THEN** the flow identifies their current owner, direct inputs, output, and
  invalidation causes
- **AND** it does not describe C3's producer as merely planned or imply a
  compatibility path for an old source layout

