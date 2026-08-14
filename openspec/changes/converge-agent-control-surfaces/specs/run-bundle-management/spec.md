## MODIFIED Requirements

### Requirement: Init and validation seed only the current Page Image Workflow topology

Before provider-facing work, a version SHALL explicitly select exactly one
`production.workflow`, `framed` or `pure`, under
`production.pipeline: page-image-workflow`. After the State owner accepts that
exact source, its matching state SHALL declare
`production_identity.by_version[exact-version]` with the same workflow and a
positive `source_epoch`. `hybrid`, a per-slide policy, an omitted workflow, a
missing/malformed identity record, or an undeclared source/state pair SHALL
produce the existing owner-issued failure before state, receipt, raw, or
provider work. The locator remains a Harness-binding schema, not a production
protocol.

#### Scenario: Init seeds one current topology

- **WHEN** initialization creates a production-ready source and state draft
- **THEN** the source declares one current pipeline and selected workflow and
  State records the corresponding current identity only through its owner
- **AND** neither surface includes a version-suffixed, historical, or fixed
  mode marker

#### Scenario: Fresh authoring waits for an explicit workflow choice

- **WHEN** a new Bundle has no selected production workflow
- **THEN** init retains the existing draft state awaiting explicit Framed/Pure
  choice
- **AND** it does not infer an identity record from history or directory
  contents

#### Scenario: A selected current source becomes a valid workflow pair

- **WHEN** source and State declare the exact current pipeline, workflow, and
  matching identity record
- **THEN** validation accepts their one selected workflow under existing rules
- **AND** it does not accept an alternate mode or contract pair
