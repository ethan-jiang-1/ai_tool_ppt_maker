## ADDED Requirements

### Requirement: Initialization seeds only the current narrative-source layout
Run Bundle initialization SHALL seed the canonical editable Story Outline and
Design Constraints sources at their current backbone paths alongside the
existing current workflow draft. Its structure validation SHALL recognize those
exact current source entries and reject a new layout that substitutes or emits
the retired `outline.md` path.

Initialization SHALL not inspect an existing production Run Bundle to fill,
convert, or migrate either narrative source. It SHALL not create provider work,
source-bound State evidence, review evidence, or a materialized page plan merely
by seeding the sources. Its ordinary Controller state remains separately owned
by the existing initialization path.

#### Scenario: Init creates a narrative-ready draft
- **WHEN** `init` creates a new Run Bundle
- **THEN** the current narrative source pair is present with the current
  Page Image workflow draft
- **AND** no page-plan, provider, or review record is created
