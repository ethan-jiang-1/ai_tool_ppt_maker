## MODIFIED Requirements

### Requirement: PPTX assembly consumes the Page Authority final manifest
PPTX Assembly SHALL consume only the current verified Page Authority final-slide manifest and preserve
its resolved stable-slide ordering. It SHALL reject raw underlays, historical whole-page/Header-Lock
bytes, partial manifests, and stale raw-review coverage. A published adoption target has no final
manifest, PPTX, notes, or delivery receipt until its own later Page Authority lifecycle creates them.

#### Scenario: Adoption target cannot assemble inherited output
- **WHEN** a newly published adoption target requests PPTX assembly before target raw/final evidence exists
- **THEN** assembly hard-stops at the target-owned Page Authority prerequisite
- **AND** it does not read or reuse historical final, PPTX, or notes bytes
