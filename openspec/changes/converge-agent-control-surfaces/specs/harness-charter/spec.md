## MODIFIED Requirements

### Requirement: Harness guidance names the current Page Image Workflow protocol

Active Charter, BOOTSTRAP, workflow, reference, command, and Agent guidance
SHALL name the schema-declared `page-image-workflow` source pipeline and the
matching state-owned `production_identity` record as the sole current Page
Image protocol. The source owns one version-level workflow choice, `framed` or
`pure`; State records that workflow and its `source_epoch` only after accepting
the exact source. `hybrid` describes Framed composition only and is never a
third workflow or per-slide choice. Active guidance SHALL not name, explain, or
route a historical marker, prompt cookbook, standalone route catalog, duplicate
workflow-inspection prose, converter, compatibility path, adoption path, or
automatic migration. A guidance surface that does not name its direct current
owner SHALL be absent from the active Harness.

#### Scenario: An Agent reads current production guidance

- **WHEN** an Agent opens active production guidance
- **THEN** it finds one declared source pipeline, selected workflow, and
  matching production-identity boundary
- **AND** it cannot select a historical protocol from that guidance

#### Scenario: An Agent reads active page-production guidance

- **WHEN** an Agent opens active production guidance
- **THEN** it finds one declared source pipeline, selected workflow, and
  matching production-identity boundary
- **AND** it finds no compatibility or migration instruction

#### Scenario: An Agent starts current work from guidance

- **WHEN** an Agent follows active Harness guidance for setup, new work, resume,
  change, or recovery
- **THEN** it reaches the applicable MD Controller or direct CLI owner without
  consulting a second routing registry or prompt cookbook
- **AND** it does not treat a prose summary as lifecycle or state authority

#### Scenario: Retired control prose is absent

- **WHEN** active Harness guidance is searched for retired prompt, route, or
  inspection-projection surfaces
- **THEN** no active entry or cross-reference exposes one
- **AND** archived OpenSpec and authorized Backlog records remain outside that
  active-surface assertion
