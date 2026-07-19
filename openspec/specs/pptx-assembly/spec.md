## Purpose

Define Stage 4 of the production pipeline: assembling the finished PNG images into a 16:9 `.pptx` container with `pptxgenjs`, one full-bleed image per slide on a blank layout. This capability guarantees that the output deck's slide count and order match `slide_plan.json` exactly, with each slide rendered edge-to-edge.
## Requirements
### Requirement: Stage 4 builds PPTX container

Stage 4 SHALL assemble 16:9 blank-layout slides from exactly one current verified PNG `final-slide` per formal slide ID in `slide_plan.json` physical order. The selected production adapter SHALL expose entries with exact common fields `slide_id`, `artifact_kind: final-slide`, `producer`, `final_slide_fingerprint`, run-dir-confined relative `path`, `sha256`, pixel `width`/`height`, and `media_profile`. `final_slide_fingerprint_v1` SHALL hash the common contract version, producer ID/version, producer-private current lineage fingerprint, byte SHA, dimensions, and media profile. Stage 4 SHALL validate those fields, PNG signature/dimensions, uniqueness, plan freshness, and byte receipts. It SHALL NOT inspect a render engine, render mode, composition variant, private manifest schema, directory glob, filename position, or lexicographic fallback. The HTML adapter SHALL expose only current `effective` entries; `forced-fallback` review objects SHALL be ineligible. HTML and legacy Stage-3 producers MAY use different private manifests but SHALL adapt to this exact common contract.

The canonical run-dir Stage-4 path SHALL classify the source and select the adapter internally. For HTML-first it SHALL consume the read-only current review snapshot and require reset status not pending plus authoritative current-reset content/visual gates before resolving final slides; a journal/reset conflict or stale gate SHALL block before PPTX/receipt writes. It SHALL require the HTML adapter/current manifest reset ID to equal the snapshot reset ID, derive plan/output/receipt paths from the run, and accept no arbitrary HTML output or private-manifest override. For markerless it SHALL retain existing legacy readiness/adapter semantics. A low-level explicit legacy artifact mode SHALL never issue an HTML pipeline receipt.

After successful atomic PPTX publication, Stage 4 SHALL atomically write `_generated/qa/pptx_assembly.json` with exact `schema_version: 2`, pipeline/producer branch, slide-plan SHA-256, ordered formal IDs, each common final-slide path/SHA/fingerprint/profile, nullable `html_production_reset_id` and HTML delivery digest (both required/current for HTML, both null for legacy), output PPTX path/SHA, and timestamp. Failure or ambiguity SHALL not publish current assembly evidence. New Stage 4 writes SHALL always use v2. Existing schema-v1 receipts MAY remain readable as markerless legacy completion/history only when their original plan/image/PPTX evidence verifies; they SHALL not satisfy HTML delivery, common-lineage first injection, or be rewritten incidentally.

#### Scenario: HTML final slides assemble in plan order

- **WHEN** an HTML final manifest contains one current verified PNG for every planned ID
- **THEN** Stage 4 publishes an N-slide PPTX in exact plan order
- **AND** its receipt binds the current HTML reset ID, delivery digest, and image hashes

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

#### Scenario: Review-only variant reaches the adapter

- **WHEN** an HTML private manifest offers a forced-fallback object as current delivery input
- **THEN** the HTML adapter or Stage 4 fails before PPTX publication
- **AND** the review pixels cannot be mistaken for effective delivery

#### Scenario: Existing legacy v1 assembly remains inspectable

- **WHEN** a markerless deck has a current schema-v1 assembly receipt from before the change
- **THEN** status may retain its original completion meaning
- **AND** HTML or new common-lineage production cannot consume it as schema v2

### Requirement: Stage 4 is a standalone ESM script

`stage4_build_pptx.mjs` SHALL remain a registered Node ESM executable with two mutually exclusive modes. Canonical `--run-dir <vN>` SHALL derive every path, classify the pipeline, use the common adapter contract, and write schema-v2 receipt; HTML shall require current authoritative gates and use only effective final slides. Legacy compatibility mode SHALL retain existing `--images <dir> --slide-plan <path> --out <path> [--title <text>]`, but SHALL derive/validate any canonical owning run and reject before writes when those inputs belong to `html-first-v1`; it MAY produce schema-v2 only for a proven markerless legacy run. Non-canonical standalone utility output SHALL not claim a current run/pipeline receipt.

Both modes SHALL retain side-effect-free help and one-envelope failures. `--run-dir` combined with any explicit artifact/output option SHALL return `USAGE`. HTML direct invocation SHALL not accept provider/render/private-manifest/output overrides and SHALL not recover a gate journal implicitly; build orchestration owns recovery before calling Stage 4.

#### Scenario: Canonical HTML standalone build

- **WHEN** Stage 4 runs with `--run-dir` on a current gated HTML run
- **THEN** it resolves common effective final slides and publishes canonical PPTX/assembly-v2 paths

#### Scenario: Canonical HTML standalone has pending gate

- **WHEN** the same route has missing/stale review evidence or a journal conflict
- **THEN** it fails before PPTX/receipt writes and does not recover the journal implicitly

#### Scenario: Legacy explicit flags target HTML run

- **WHEN** `--images/--slide-plan/--out` resolve to an HTML-first run
- **THEN** direct Stage 4 rejects the compatibility mode and points to canonical `--run-dir`

#### Scenario: Stage 4 modes are mixed

- **WHEN** caller supplies `--run-dir` plus any explicit artifact/output flag
- **THEN** CLI returns `USAGE` before adapter resolution or writes
