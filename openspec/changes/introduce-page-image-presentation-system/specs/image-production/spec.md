## MODIFIED Requirements

### Requirement: Current Page Image Workflow has one selected finalization publisher

For the exact `page-authority-image2-v2` /
`image2-page-authority-v2` pair, the selected Framed or Pure adapter SHALL be
the only final-slide publisher. It SHALL publish the common V2 final-slide
manifest only from current accepted V2 raw evidence and its matching selected
presentation binding. A marker/state mismatch, stale raw evidence, or stale
selected-presentation digest stops before final-slide publication.

#### Scenario: V2 finalization selects one workflow publisher

- **WHEN** a valid V2 source/state pair has workflow `framed` or `pure`
- **THEN** only its matching adapter may publish V2 final-slide output
- **AND** it does not invoke a sibling or other-protocol publisher

#### Scenario: Pure preserves current provider page bytes

- **WHEN** a proceeded V2 Pure Complete Page Review reaches finalization
- **THEN** its final manifest binds accepted provider page bytes and verified
  dimensions unchanged
- **AND** finalization does not crop, resize, transcode, or invoke a Framed
  local renderer

#### Scenario: Framed finalization repeats its reviewed overlay

- **WHEN** a proceeded V2 Framed Complete Page Review reaches finalization
- **THEN** it uses the same selected Header Profile and header input as the
  reviewed production-equivalent composite
- **AND** it publishes no final manifest if profile, header input, selected
  presentation, or raw provider page has drifted

## REMOVED Requirements

### Requirement: v2 finalization and evidence are unsupported

**Reason**: V2 is the sole current finalization and evidence lineage.

**Migration**: Non-V2 input is rejected before publication by the shared
protocol evaluator.
