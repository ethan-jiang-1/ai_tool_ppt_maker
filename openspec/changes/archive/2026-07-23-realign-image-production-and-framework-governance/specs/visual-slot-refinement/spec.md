## ADDED Requirements

### Requirement: Visual-slot behavior survives Image Production relocation
Visual-slot authorization, attempt reconciliation, candidate review, promotion, and recovery SHALL
retain their current direct owners and fail-closed behavior after relocation. The existing refinement
plan/attempt/review payload schemas and provenance/journal semantics remain unchanged; only their
durable outer reserved record migrates to the `image-production` visual-slot adapter contract owned by
`node-specification`. A pre-existing `pptmaker-image2-refinement-state-v1|v2` outer record remains
read-compatible but is not rewritten by observation. No whole-page authorization, provenance, final
review, or provider-attempt fact may be stored in that visual-slot record.

#### Scenario: Unknown submit survives relocation
- **WHEN** a visual-slot attempt is uncertain
- **THEN** reconciliation remains required before another submit

#### Scenario: Whole-page flow does not create visual-slot state
- **WHEN** an `image2-only` whole-page operation is observed or executed
- **THEN** it neither reads as authorization nor creates `nodes.image-production` visual-slot state
- **AND** whole-page direct owners retain their existing records and recovery
