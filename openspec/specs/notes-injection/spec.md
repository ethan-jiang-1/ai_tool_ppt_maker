## Purpose

Define Stage 5 of the production pipeline: extracting SPEAKER NOTE blocks from the source markdown and injecting them into the PPTX notes panel with `pptxgenjs`. This capability guarantees that every slide's presenter notes reach the final deck's Presenter View, and that a mismatch between note count and slide count aborts with an error rather than shipping a deck with misaligned notes.
## Requirements
### Requirement: Stage 5 injects speaker notes

Stage 5 SHALL parse every source SPEAKER NOTE as `{slide_id, note}` through the shared slide-document contract. The canonical run-dir path SHALL require the note ID set to equal the current `slide_plan.json` ID set exactly, order notes by the current plan, and validate the current provider-neutral Stage-4 assembly receipt before the first injection. That receipt SHALL bind the producer branch, ordered stable IDs, common final-slide fingerprints/SHAs, current plan hash, output PPTX hash, and current HTML production reset ID/delivery digest when applicable. Stage 5 SHALL not inspect a renderer engine/private manifest or infer alignment from counts or filenames.

A notes-only rerun on an already annotated PPTX MAY use a prior schema-v2 or v3 notes receipt's separate rerun input-lineage validator when it proves that the current PPTX is a successor of the same immutable ordered-ID assembly lineage. The validator SHALL require the prior receipt schema, current PPTX hash, ordered IDs, plan/assembly lineage, confined paths, and exact current reset ID for HTML, but SHALL intentionally not require the old notes-source hash to equal newly edited notes. Schema v2 SHALL be eligible only for a markerless legacy run whose old assembly evidence remains fully verifiable; it SHALL never authorize HTML-first input. A successful v2-authorized rerun SHALL publish v3.

The canonical run-dir path SHALL require exactly one non-backup target PPTX and one non-empty note for every current plan ID. It SHALL not delete a prior receipt merely because edited notes make completion stale; until PPTX replacement, an eligible receipt remains available only to the separate rerun validator. Stage 5 SHALL stage the modified PPTX and receipt with exact `schema_version: 3`, publish the PPTX by same-directory temporary file and atomic rename, and only then atomically publish `_generated/qa/notes_injection.json`. V3 SHALL bind current source/final PPTX SHA-256 values, ordered IDs/counts, pipeline/producer, common assembly receipt path/SHA/schema, immutable root assembly lineage, nullable `html_production_reset_id` and HTML delivery digest (both current/required for HTML, both null for legacy), and predecessor PPTX/receipt hash/schema when applicable. If injection/PPTX replacement fails, the original PPTX remains and no receipt validates edited source; an eligible prior receipt may remain rerun-only. If PPTX replacement succeeds but receipt publication fails, the old receipt is invalidated by PPTX SHA and recovery SHALL re-establish current assembly then rerun Stage 5 rather than bless the mutated PPTX. Schema v1 remains limited to its existing historical read boundary and SHALL authorize neither v3 successor input nor HTML completion.

#### Scenario: Inject notes into HTML-first assembly

- **WHEN** source notes and current HTML Stage-4 assembly have the same ordered stable IDs and current delivery lineage
- **THEN** notes are injected by stable ID into the corresponding PPTX positions
- **AND** the v3 receipt binds the provider-neutral assembly, current HTML reset ID, and delivery digest

#### Scenario: Inject notes into legacy assembly

- **WHEN** a current legacy Stage-4 adapter produces the common assembly lineage
- **THEN** Stage 5 uses the same consumer contract without requiring HTML evidence

#### Scenario: Notes-only rerun preserves assembly lineage

- **WHEN** only note text changes and the prior eligible v2/v3 receipt proves the current PPTX descends from the same ordered-ID assembly
- **THEN** the completion check is stale but the rerun input-lineage check authorizes reinjection
- **AND** Stage 4 is not rebuilt merely because notes changed PPTX bytes and the successor receipt is v3

#### Scenario: Equal counts with different IDs fail

- **WHEN** source notes and assembly each contain N entries but their ID sets differ
- **THEN** Stage 5 fails with missing/unexpected IDs and preserves the original PPTX

#### Scenario: A planned slide has no note

- **WHEN** one current plan ID has no non-empty SPEAKER NOTE
- **THEN** Stage 5 fails before PPTX replacement and publishes no completion receipt

#### Scenario: Multiple target PPTX files exist

- **WHEN** `_generated/ppt/` contains more than one non-backup PPTX
- **THEN** Stage 5 fails ambiguity and does not select by lexical order

#### Scenario: Receipt fails after PPTX replacement

- **WHEN** modified PPTX publication succeeds but v3 receipt publication fails
- **THEN** no old or new receipt validates completion/rerun input for the changed PPTX
- **AND** recovery directs re-establishing assembly then rerunning Stage 5

#### Scenario: Private producer data is supplied instead of common lineage

- **WHEN** the assembly receipt exposes only engine-specific paths without the common final-slide evidence
- **THEN** Stage 5 fails closed and does not infer a producer contract

### Requirement: Stage 5 is a standalone ESM script

The Stage 5 script SHALL be `stage5_inject_notes.mjs`, using the directly declared `jszip` dependency to access the notes panel. Its low-level standalone interface SHALL accept the documented `--pptx` and `--input` flags. Run-dir production SHALL be documented through `unified_pipeline --run-dir ... --stage 5` or the corresponding `ppt_flow` workflow rather than claiming the low-level script accepts an unsupported `--run-dir` flag.

#### Scenario: Stage 5 runs standalone

- **WHEN** `node stage5_inject_notes.mjs --pptx <file> --input <spec>` is run directly
- **THEN** it injects the extracted speaker notes using `jszip` without requiring the orchestrator

#### Scenario: Stage 5 help matches active docs

- **WHEN** active documentation shows a direct Stage-5 invocation
- **THEN** every documented flag appears in `stage5_inject_notes.mjs --help`

### Requirement: Notes completion is proven by a current receipt

The node gate `speaker_notes_injected` SHALL use the strict completion validator, never the rerun input-lineage validator or node status. A v3 receipt SHALL pass only when its schema/pipeline/producer/common-assembly fields are valid; confined source/plan/assembly/PPTX paths and realpaths exist; current source, plan, assembly receipt, and final PPTX SHAs match; ordered IDs equal current plan order; counts match; and HTML-first additionally has exact current reset ID plus current HTML delivery digest. A schema-v2 receipt MAY remain completion proof only for an existing markerless legacy run when every original v2 source/plan/assembly/PPTX lineage check passes. V1 and v2 SHALL never satisfy HTML-first completion. Any reset/source notes/order/PPTX/assembly drift SHALL make completion stale while an eligible v2/v3 receipt MAY still separately authorize notes-only input only when its pipeline/reset lineage remains eligible under the requirement above.

#### Scenario: Current HTML v3 receipt validates

- **WHEN** v3 source/plan/common assembly/HTML delivery/PPTX lineage all match
- **THEN** `speaker_notes_injected` is true

#### Scenario: HTML run contains v2 receipt

- **WHEN** a marked HTML-first run has a schema-v2 notes receipt
- **THEN** completion and rerun authorization both fail without inferring legacy lineage

#### Scenario: Existing legacy v2 remains complete

- **WHEN** a markerless old deck's v2 receipt and all original lineage remain current
- **THEN** the completion gate remains true until source/plan/assembly/PPTX drift

#### Scenario: Notes source changes after v3 injection

- **WHEN** only note text changes
- **THEN** strict completion is false while the separate v3 rerun validator may authorize reinjection

#### Scenario: Completion receipt path escapes the run directory

- **WHEN** v3 contains an absolute, traversal, or contained-looking symlink path outside the run
- **THEN** completion fails closed and hashes no external file

### Requirement: jszip is a direct runtime dependency

Because `stage5_inject_notes.mjs` imports `jszip` directly, `package.json` SHALL declare a compatible `jszip` runtime dependency and the lockfile SHALL resolve it directly rather than relying on transitive hoisting through another package.

#### Scenario: Dependency tree changes upstream

- **WHEN** `pptxgenjs` changes its transitive dependency layout
- **THEN** Stage 5 can still resolve the explicitly declared `jszip` package
