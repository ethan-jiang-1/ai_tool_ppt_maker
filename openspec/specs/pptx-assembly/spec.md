## Purpose

Define Stage 4 of the production pipeline: assembling the finished PNG images into a 16:9 `.pptx` container with `pptxgenjs`, one full-bleed image per slide on a blank layout. This capability guarantees that the output deck's slide count and order match `slide_plan.json` exactly, with each slide rendered edge-to-edge.
## Requirements
### Requirement: Stage 4 builds PPTX container
Stage 4 SHALL assemble 16:9 blank-layout slides from exactly one current verified PNG final-slide per
formal slide ID in slide_plan.json physical order. The selected production adapter SHALL expose common
fields slide_id, final-slide artifact kind, producer, final-slide fingerprint, run-dir-confined relative
path, SHA-256, pixel width/height, and media profile. The common fingerprint SHALL hash contract
version, producer ID/version, producer-private current lineage fingerprint, byte SHA, dimensions, and
media profile. Stage 4 SHALL validate those fields, PNG signature/dimensions, uniqueness, plan freshness,
and byte receipts. It SHALL not inspect an unowned render engine/private manifest schema, directory glob,
position filename, or lexicographic fallback.

The canonical run-dir path SHALL establish a current explicit source/state pair before it selects an
adapter. HTML-first consumes the read-only current review snapshot and requires no pending reset plus
authoritative current-reset content/visual gates before final-slide resolution. whole-page-image2-v1
consumes only the current whole-page adapter's verified final-slide lineage and current whole-page review
requirements. A missing/retired marker, pre-current state, retired receipt, stale gate, journal/reset
conflict, or ambiguous image SHALL block before PPTX/receipt writes and return the owning repair or
rebuild action. It SHALL not read an older whole-page receipt as completion/history authority.

After successful atomic PPTX publication, Stage 4 SHALL atomically write the current assembly receipt
with pipeline/producer branch, slide-plan SHA-256, ordered formal IDs, common final-slide
path/SHA/fingerprint/profile records, current HTML reset/delivery values when applicable, output
PPTX path/SHA, and timestamp. Failure or ambiguity SHALL not publish current assembly evidence.

#### Scenario: HTML final slides assemble in plan order
- **WHEN** an HTML final manifest contains one current verified PNG for every planned ID
- **THEN** Stage 4 publishes an N-slide PPTX in exact plan order
- **AND** its receipt binds current HTML reset/delivery lineage and image hashes

#### Scenario: Current whole-page final slides assemble in plan order
- **WHEN** a consistent whole-page-image2-v1 run has current verified final-slide evidence
- **THEN** Stage 4 publishes the same full-frame PPTX contract
- **AND** it does not require HTML manifests or a migration reader

#### Scenario: Missing, stale, or ambiguous final slide fails
- **WHEN** a planned ID has no current verified entry, SHA/dimension mismatch, or multiple candidates
- **THEN** Stage 4 names the formal ID and owning local repair stage
- **AND** does not assemble from a located/unverified file

#### Scenario: Pure reorder rebuilds only order-dependent delivery
- **WHEN** final image bytes remain current but plan order changes
- **THEN** Stage 4 publishes a PPTX and receipt in the new order
- **AND** per-ID image hashes remain unchanged

#### Scenario: Review-only variant reaches the adapter
- **WHEN** an HTML private manifest offers a forced-fallback object as current delivery input
- **THEN** the HTML adapter or Stage 4 fails before PPTX publication
- **AND** review pixels cannot be mistaken for effective delivery

#### Scenario: Retired assembly receipt is offered
- **WHEN** a caller presents an older whole-page receipt schema or retired pipeline lineage
- **THEN** Stage 4 rejects it before it can satisfy current assembly or completion

### Requirement: Stage 4 is a standalone ESM script
stage4_build_pptx.mjs SHALL remain a registered Node ESM executable. Canonical --run-dir <vN> SHALL
derive every path, establish the current explicit pipeline pair, use the common adapter contract, and
write the current assembly receipt. HTML requires current authoritative gates and effective final slides;
whole-page requires current verified whole-page final-slide lineage. A low-level explicit image utility
may remain only for noncanonical utility output and SHALL not claim a current run/pipeline receipt,
accept a retired manifest as authority, or provide a continuation for a historical run. Both modes retain
side-effect-free help and one-envelope failures. --run-dir combined with an explicit artifact/output
option returns USAGE. Build orchestration owns journal recovery before calling Stage 4.

#### Scenario: Canonical HTML standalone build
- **WHEN** Stage 4 runs with --run-dir on a current gated HTML run
- **THEN** it resolves common effective final slides and publishes canonical PPTX/assembly paths

#### Scenario: Canonical whole-page standalone build
- **WHEN** Stage 4 runs with --run-dir on a current gated whole-page run
- **THEN** it resolves verified whole-page final slides and publishes current assembly lineage

#### Scenario: Canonical run has pending gate or invalid identity
- **WHEN** the route has missing/stale review evidence, a journal conflict, or unsupported source/state identity
- **THEN** it fails before PPTX/receipt writes and does not recover or migrate state implicitly

#### Scenario: Stage 4 modes are mixed
- **WHEN** a caller supplies --run-dir plus an explicit artifact/output flag
- **THEN** CLI returns USAGE before adapter resolution or writes

### Requirement: Whole-page assembly uses the current receipt lineage
Whole-page PPTX assembly SHALL publish and validate `whole-page-image2-v1` receipt lineage. It SHALL reject retired whole-page pipeline values and SHALL not accept an older whole-page receipt schema as completion or rerun authority.

#### Scenario: Whole-page assembly is validated
- **WHEN** an assembly receipt identifies the current whole-page pipeline
- **THEN** assembly accepts its non-HTML lineage fields
- **AND** it rejects a retired pipeline value

### Requirement: PPTX assembly consumes the Page Authority final manifest
PPTX Assembly SHALL consume only the current verified Page Authority final-slide manifest and preserve
its resolved stable-slide ordering. It SHALL reject raw underlays, historical whole-page/Header-Lock
bytes, partial manifests, and stale raw-review coverage. A published adoption target has no final
manifest, PPTX, notes, or delivery receipt until its own later Page Authority lifecycle creates them.

#### Scenario: Underlay cannot become PPTX art
- **WHEN** assembly receives a Framed raw underlay instead of the verified final-slide entry
- **THEN** it hard-stops before creating a PPTX
- **AND** it identifies the final-manifest prerequisite

#### Scenario: Adoption target cannot assemble inherited output

- **WHEN** a newly published adoption target requests PPTX assembly before target raw/final evidence exists
- **THEN** assembly hard-stops at the target-owned Page Authority prerequisite
- **AND** it does not read or reuse historical final, PPTX, or notes bytes
