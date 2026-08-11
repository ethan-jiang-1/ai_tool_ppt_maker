## MODIFIED Requirements

### Requirement: Harness guidance names the current Page Image Workflow protocol

Active Charter, BOOTSTRAP, workflow, reference, and Agent guidance SHALL name
the schema-declared `page-image-workflow` pipeline with matching
`image2-page-workflow` state as the sole current Page Image protocol. They
SHALL require one version-level workflow choice, `framed` or `pure`; `hybrid`
describes Framed composition only and is never a third workflow or per-slide
choice. Active guidance SHALL not name, explain, or route a historical marker,
converter, compatibility path, adoption path, or automatic migration.

#### Scenario: An Agent reads current production guidance

- **WHEN** an Agent follows active Harness guidance for Page Image production
- **THEN** it receives one current source/state contract and one selected
workflow policy
- **AND** it cannot select a historical protocol from that guidance

#### Scenario: An Agent reads active page-production guidance

- **WHEN** an Agent opens active production guidance
- **THEN** it finds one declared current pipeline/mode pair and workflow choice
- **AND** it finds no compatibility or migration instruction
