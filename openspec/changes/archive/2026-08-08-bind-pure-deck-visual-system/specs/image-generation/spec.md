## ADDED Requirements

### Requirement: Pure raw work binds one selected deck visual system

Every current Pure Page Image Core slide, raw contract, compiled provider input, provider-input
inspection projection, and raw-plan item binding SHALL carry the exact digest of the same
validated Pure deck visual-system projection. The closed provider-input binding field SHALL be
named `deck_visual_system_sha256`; it is required for Pure and exactly `null` for Framed. The
ordinary and progressive raw-plan validators SHALL enforce the same shape. The compiled input
SHALL describe the deterministic typography hierarchy, Style-Master-derived colour use, zones,
whitespace, and allowed layout families without adding content literals or a local compositor.
The Pure raw contract and compiled input SHALL each expose the identical content-neutral
`deck_visual_system` object containing that `sha256` and the validated token projection.

The visual-system projection SHALL remain a source input, not a lifecycle selector, acceptance
record, provider authorization, or pixel-quality proof. Pure's provider page remains the complete
page evidence; Framed bindings retain their existing null/not-applicable Pure visual-system value.

#### Scenario: Every Pure page receives the same visual-system binding

- **WHEN** a current Pure full plan contains multiple slides
- **THEN** each compiled provider input and plan item binding contains the same selected
  visual-system digest and deterministic projection
- **AND** per-slide content and visual-language facts remain independently bound

#### Scenario: Pure has no local typography renderer

- **WHEN** a current Pure provider input is compiled with its deck visual system
- **THEN** it instructs the provider to render the entire page, including provider-visible text
- **AND** it does not create a Framed Text Frame, local overlay, protected geometry, or second
  review/acceptance surface

### Requirement: Pure visual-system drift invalidates exact raw evidence

When the selected Pure visual-system source projection changes, current planning and invalidation
SHALL classify the resulting binding drift as a Pure raw rebuild. They SHALL preserve existing
accepted raw bytes, provenance, review, final, and delivery facts as historical evidence; they
SHALL not perform provider work, reuse the old evidence as current, or modify State until the
existing exact authorization path is used.

#### Scenario: A typography or zone token changes after Pure acceptance

- **WHEN** a current accepted Pure scope is replanned after its selected visual-system digest
  changes while its slide literals and Style Master selection are unchanged
- **THEN** the raw-plan bindings differ and the owner returns the existing Pure raw-rebuild action
- **AND** it does not expose a provider-free final refresh or treat the old provider page as current

#### Scenario: Inspection is deterministic but not pixel acceptance

- **WHEN** an Agent inspects a current Pure provider-input projection for multiple pages
- **THEN** it can verify that the same visual-system digest and token projection were submitted
- **AND** it does not infer that the provider pixels obeyed the system or bypass Complete Page Review
