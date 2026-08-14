## MODIFIED Requirements

### Requirement: Inspection observes current Page Image Workflow marker-first

Workflow Inspection SHALL remain read-only and resolve a current Page Image
Workflow from its exact schema-declared `page-image-workflow` source, the
state-owned `production_identity` record for that exact version, and direct
current lineage records. The source owns the pipeline and selected workflow;
the identity record must agree on that workflow and supplies the current
`source_epoch` fence. Inspection SHALL report the selected `framed` or `pure`
workflow and one owner-issued nearest action without inferring policy from
prose, artifact names, conversation context, or a fixed mode. It SHALL not
initialize a receipt, mutate state, submit a provider request, or construct an
alternate projection.

#### Scenario: Current Framed status is projected from direct markers

- **WHEN** inspection reads a valid current Framed source/state identity pair
- **THEN** it reports Framed and the direct prerequisite from its owning
  lifecycle
- **AND** it does not select Pure or construct a per-slide authority view

#### Scenario: Mode residue cannot establish inspection identity

- **WHEN** inspection finds `production_mode` instead of a valid current
  production-identity record
- **THEN** it returns the existing owner-issued identity failure before selected
  workflow routing
- **AND** it does not read, convert, or adopt the retired record
