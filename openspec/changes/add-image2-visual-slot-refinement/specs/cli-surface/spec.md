## ADDED Requirements

### Requirement: Image2 refinement commands are closed cost boundaries

`ppt_flow image2` SHALL expose only documented plan, authorize, generate, review-decision, and cleanup operations for marked HTML-first runs. Each mutating operation SHALL validate pipeline, current version, exact plan or candidate identity, and human-owned prerequisites before writes or provider access; non-zero returns SHALL use the established secret-safe envelope.

#### Scenario: Legacy deck invokes modern command
- **WHEN** a markerless run invokes `ppt_flow image2`
- **THEN** it fails before provider loading with an ownership diagnostic
