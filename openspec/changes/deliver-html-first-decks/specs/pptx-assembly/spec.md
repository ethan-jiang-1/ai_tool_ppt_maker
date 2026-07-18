## MODIFIED Requirements

### Requirement: Stage 4 builds PPTX container

Stage 4 SHALL assemble 16:9 blank-layout slides from exactly one current verified PNG `final-slide` per formal slide ID in `slide_plan.json` physical order. The selected production adapter SHALL supply an explicit provider-neutral final-slide manifest; Stage 4 SHALL validate each entry's stable ID, artifact kind, composition/final fingerprint, run-dir-confined path, PNG signature/dimensions, and SHA-256. It SHALL NOT select by render engine, render mode, directory glob, filename position, or lexicographic fallback. HTML and legacy Stage-3 producers MAY use different private manifests but SHALL adapt to the same verified final-slide evidence contract.

After successful atomic PPTX publication, Stage 4 SHALL atomically write a versioned `_generated/qa/pptx_assembly.json` binding pipeline, slide-plan SHA-256, ordered formal IDs, each final-image path/SHA/fingerprint, optional HTML delivery digest when applicable, output PPTX path/SHA, and timestamp. Failure or ambiguity SHALL not publish current assembly evidence.

#### Scenario: HTML final slides assemble in plan order

- **WHEN** an HTML final manifest contains one current verified PNG for every planned ID
- **THEN** Stage 4 publishes an N-slide PPTX in exact plan order
- **AND** its receipt binds the HTML delivery digest and image hashes

#### Scenario: Legacy final slides assemble through compatibility adapter

- **WHEN** a markerless legacy run has current verified Stage-3 final-slide evidence
- **THEN** Stage 4 publishes the same full-frame PPTX contract
- **AND** does not require HTML manifests or migration

#### Scenario: Missing, stale, or ambiguous final slide fails

- **WHEN** a planned ID has no current verified entry, a SHA/dimension mismatch, or multiple candidates
- **THEN** Stage 4 names the formal ID and owning local repair stage
- **AND** does not assemble from a located/unverified file

#### Scenario: Pure reorder rebuilds only order-dependent delivery

- **WHEN** final image bytes remain current but plan order changes
- **THEN** Stage 4 publishes a PPTX and receipt in the new order
- **AND** the per-ID image hashes remain unchanged
