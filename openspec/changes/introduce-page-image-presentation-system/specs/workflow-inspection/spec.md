## MODIFIED Requirements

### Requirement: Inspection observes current Page Image Workflow marker-first

Inspection SHALL remain read-only and resolve a current run from exact
`page-authority-image2-v2` source and `image2-page-authority-v2` State before
projecting workflow status. For a valid pair it reports selected `framed|pure`,
direct receipt/evidence prerequisite, selected-presentation freshness, and one
owner-issued nearest action. It SHALL not heal State, infer workflow from
artifacts, initialize a receipt, or calculate a second authority from Markdown
or a summary.

A partial, hybrid, mismatched, or non-V2 pair SHALL return identity or
`unsupported-protocol/export` before lifecycle interpretation, generated-
artifact reads, or mutation. Status and ordinary State observation use this
same checkpoint without importing a non-current receipt writer.

#### Scenario: V2 Framed raw debt has one inspection action

- **WHEN** a valid V2 Framed source/state pair lacks current accepted raw
  evidence
- **THEN** inspection reports Framed and the raw-plan/authorization prerequisite
- **AND** it does not suggest Pure or a slide-level workflow repair

#### Scenario: Current Framed status is projected from direct markers

- **WHEN** inspection reads a valid V2 Framed source/state pair
- **THEN** it reports Framed status from direct markers and owner evidence facts
- **AND** it does not infer a workflow from generated artifacts or summaries

#### Scenario: Non-V2 observation is byte-preserving

- **WHEN** status or ordinary State observation receives non-V2 identity
- **THEN** it returns the bounded hard-stop without mutation
- **AND** it does not classify the run as current work

## REMOVED Requirements

### Requirement: Inspection rejects v2 before lifecycle interpretation

**Reason**: V2 is the sole current lifecycle identity.

**Migration**: Non-V2 input is rejected marker-first before inspection projects
workflow prerequisites.
