## MODIFIED Requirements

### Requirement: Harness guidance names the current Page Image Workflow protocol

Active Harness guidance SHALL name `page-authority-image2-v2` with matching
`image2-page-authority-v2` State as the sole Page Image protocol. It SHALL
describe one version-level `framed|pure` selection, V2 receipt/evidence
lineage, selected-presentation invalidation, and the workflow graph
`03-framed-image XOR 04-pure-image -> 05-delivery -> 06-iteration`. It SHALL
not describe a second protocol, compatibility route, historical conversion, or
protocol fallback as active work.

A non-V2 pair is byte-preserved and receives one owner-issued
`unsupported-protocol/export` hard-stop before workflow evaluation. The stop
protects identity, provenance, and recovery; it has no waiver or implicit
rewrite.

#### Scenario: Active guidance is read for a V2 run

- **WHEN** an Agent reads Charter, BOOTSTRAP, or workflow guidance
- **THEN** it receives one V2 workflow choice and its ownership-aware refresh
  path
- **AND** it does not receive another protocol as a production option

#### Scenario: An Agent reads active page-production guidance

- **WHEN** an Agent opens Charter or workflow documentation for a current V2
  version
- **THEN** it receives V2 workflow identity and one selected policy
- **AND** it does not receive another protocol as a production option

## ADDED Requirements

### Requirement: Harness guidance names V2 Page Presentation ownership

Guidance SHALL identify the V2 Page Presentation System as canonical
version-resolved source, Page Class as source-authored workflow-neutral intent,
and the Pre-Production Data View as rebuildable inspection data. It SHALL state
that selected presentation binds raw work, Framed Header Profiles own only
permitted local header treatment, and derived views never replace source,
State, evidence, or Human Navigation.

#### Scenario: Guidance separates direct source from derived view

- **WHEN** an Agent inspects V2 presentation facts before planning
- **THEN** guidance directs it to canonical source/package and the selected
  resolver result
- **AND** it does not treat a generated Data View as editable configuration or
  authorization
