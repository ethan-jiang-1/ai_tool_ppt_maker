## MODIFIED Requirements

### Requirement: Inspection observes current Page Image Workflow marker-first

Workflow Inspection SHALL remain read-only and resolve a current Page Image
Workflow from its exact schema-declared `page-image-workflow` source,
`image2-page-workflow` state, selected version-level policy, and direct current
lineage records. It SHALL report the selected `framed` or `pure` workflow and
one owner-issued nearest action without inferring policy from prose, artifact
names, or conversation context. It SHALL not initialize a receipt, mutate
state, submit a provider request, or construct a compatibility projection.

#### Scenario: Current Framed status is projected from direct markers

- **WHEN** inspection reads a valid current Framed source/state pair
- **THEN** it reports Framed and the direct prerequisite from its owning
  lifecycle
- **AND** it does not select Pure or construct a per-slide authority view

## REMOVED Requirements

### Requirement: Inspection rejects v2 before lifecycle interpretation
**Reason**: Inspecting a named historical format before rejecting it is a
legacy-recognition behavior that the clean cutover removes.
**Migration**: Inspection accepts only exact current declarations and rejects
every undeclared marker before lifecycle interpretation.
