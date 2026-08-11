## MODIFIED Requirements

### Requirement: Init emits only a v2 Harness-bound locator

Fresh Run Bundle initialization SHALL verify its creating local Harness root
and write only the unversioned `run-bundle-locator` contract with exactly
`schema`, `deck_root`, `harness_root`, and `harness_relation`. It SHALL not
write retired root fields, a version suffix, a compatibility marker, or a
second locator format.

#### Scenario: Init creates a current locator

- **WHEN** a new Run Bundle is initialized
- **THEN** it contains one schema-declared unversioned locator and its required
  binding fields
- **AND** no historical locator format is emitted

#### Scenario: A fresh Bundle is initialized from the Harness

- **WHEN** initialization uses a current local Harness root
- **THEN** it writes the one declared locator in the new Bundle
- **AND** it does not create a second root-format branch

### Requirement: Init and validation seed only the current Page Image Workflow topology

Before provider-facing work, a version SHALL explicitly select exactly one
`production.workflow`, `framed` or `pure`, under
`production.pipeline: page-image-workflow`; its matching state SHALL declare
`image2-page-workflow`. `hybrid`, a per-slide policy, an omitted workflow, or
an undeclared source/state pair SHALL produce the existing owner-issued failure
before state, receipt, raw, or provider work. The locator remains a
Harness-binding schema, not a production protocol.

#### Scenario: Init seeds one current topology

- **WHEN** initialization creates a production-ready source and state draft
- **THEN** they declare one current pipeline/mode pair and one selected workflow
- **AND** they do not include a version-suffixed or historical marker

#### Scenario: Fresh authoring waits for an explicit workflow choice

- **WHEN** a new Bundle has no selected production workflow
- **THEN** init retains the existing draft state awaiting explicit Framed/Pure choice
- **AND** it does not infer a marker from history or directory contents

#### Scenario: A selected current source becomes a valid workflow pair

- **WHEN** source and state declare the exact current pipeline/mode pair
- **THEN** validation accepts their one selected workflow under existing rules
- **AND** it does not accept an alternate contract pair

## REMOVED Requirements

### Requirement: Retired Page Authority bundles hard-stop without migration
**Reason**: Special recognition of named retired bundles retains a legacy
compatibility path.
**Migration**: Normal initialization and validation reject all undeclared
contract values before lifecycle work without decoding their historical format.
