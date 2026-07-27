## Purpose

Define Stage 5 of the production pipeline: extracting SPEAKER NOTE blocks from the source markdown and injecting them into the PPTX notes panel with `pptxgenjs`. This capability guarantees that every slide's presenter notes reach the final deck's Presenter View, and that a mismatch between note count and slide count aborts with an error rather than shipping a deck with misaligned notes.
## Requirements
### Requirement: Stage 5 injects speaker notes
Stage 5 SHALL parse every source SPEAKER NOTE as {slide_id, note} through the shared slide-document contract. The canonical run-dir path SHALL establish a current explicit source/state pair, require the note ID set to equal current slide_plan.json IDs exactly, order notes by the current plan, and validate the current provider-neutral Stage-4 assembly receipt before injection. That receipt SHALL bind producer branch, ordered stable IDs, common final-slide fingerprints/SHAs, current plan hash, output PPTX hash, and current HTML reset/delivery lineage when applicable. Stage 5 SHALL not inspect a renderer/private manifest or infer alignment from counts or filenames.

A notes-only rerun may use only a current notes receipt's separate rerun input-lineage validator when it proves the current PPTX is a successor of the same immutable ordered-ID current assembly lineage. The validator SHALL require current receipt schema, current PPTX hash, ordered IDs, plan/assembly lineage, confined paths, and current HTML reset ID where applicable, but does not require old notes-source hash to equal edited notes. Historical v1/v2 notes or assembly receipts, markerless records, and retired whole-page lineages SHALL not authorize completion or rerun; they return one owner-issued typed next action without state/artifact mutation.

The canonical path SHALL require exactly one non-backup target PPTX and one non-empty note for every current plan ID. It SHALL stage modified PPTX and the current notes receipt atomically. The receipt SHALL bind current source/final PPTX SHA-256 values, ordered IDs/counts, pipeline/producer, common assembly receipt path/SHA/schema, immutable root assembly lineage, current HTML reset/delivery fields when applicable, and predecessor receipt/PPTX data when applicable. A failed injection leaves the original PPTX; a receipt publication failure invalidates completion and directs re-establishing current assembly then rerunning Stage 5.

#### Scenario: Inject notes into HTML-first assembly
- **WHEN** source notes and current HTML Stage-4 assembly have the same ordered stable IDs and delivery lineage
- **THEN** notes are injected by stable ID into corresponding PPTX positions
- **AND** the receipt binds provider-neutral assembly and current HTML lineage

#### Scenario: Inject notes into current whole-page assembly
- **WHEN** a current whole-page Stage-4 adapter produces common current assembly lineage
- **THEN** Stage 5 uses the same consumer contract without requiring HTML evidence

#### Scenario: Notes-only rerun preserves assembly lineage
- **WHEN** only note text changes and a current receipt proves the PPTX descends from the same ordered-ID assembly
- **THEN** strict completion is stale but rerun input-lineage authorizes reinjection
- **AND** Stage 4 is not rebuilt merely because notes changed PPTX bytes

#### Scenario: Retired receipt is offered for notes work
- **WHEN** a caller supplies an older whole-page assembly/notes receipt or unsupported source identity
- **THEN** Stage 5 stops before PPTX replacement and publishes no current receipt

#### Scenario: Equal counts with different IDs fail
- **WHEN** source notes and assembly each contain N entries but their ID sets differ
- **THEN** Stage 5 fails with missing/unexpected IDs and preserves the original PPTX

#### Scenario: A planned slide has no note
- **WHEN** one current plan ID has no non-empty SPEAKER NOTE
- **THEN** Stage 5 fails before PPTX replacement and publishes no completion receipt

#### Scenario: Multiple target PPTX files exist
- **WHEN** generated PPTX output contains more than one non-backup PPTX
- **THEN** Stage 5 fails ambiguity and does not select by lexical order

#### Scenario: Receipt fails after PPTX replacement
- **WHEN** modified PPTX publication succeeds but current receipt publication fails
- **THEN** no receipt validates completion/rerun input for changed PPTX
- **AND** recovery directs re-establishing assembly then rerunning Stage 5

### Requirement: Multiline speaker-note blockquotes tolerate blank quote lines
Stage 5 SHALL accept the canonical multiline form SPEAKER NOTE followed by zero-content quote lines and subsequent quoted content, including a blank quote line between heading and first paragraph. It SHALL preserve stable slide-ID matching, reject missing/empty final note content, and retain documented inline note forms without using note syntax to infer a retired run protocol.

#### Scenario: Blank quote line separates note heading and content
- **WHEN** a slide contains a multiline SPEAKER NOTE with a blank quoted line before narrative content
- **THEN** Stage 5 extracts the note for that slide
- **AND** notes injection proceeds through current receipt/assembly lineage

#### Scenario: Blank-only note remains invalid
- **WHEN** a multiline blockquote contains no non-empty note content after normalization
- **THEN** Stage 5 reports the slide as missing speaker-note content
- **AND** it does not replace the PPTX or publish a receipt

### Requirement: Stage 5 is a standalone ESM script

The Stage 5 script SHALL be `stage5_inject_notes.mjs`, using the directly declared `jszip` dependency to access the notes panel. Its low-level standalone interface SHALL accept the documented `--pptx` and `--input` flags. Run-dir production SHALL be documented through `unified_pipeline --run-dir ... --stage 5` or the corresponding `ppt_flow` workflow rather than claiming the low-level script accepts an unsupported `--run-dir` flag.

#### Scenario: Stage 5 runs standalone

- **WHEN** `node stage5_inject_notes.mjs --pptx <file> --input <spec>` is run directly
- **THEN** it injects the extracted speaker notes using `jszip` without requiring the orchestrator

#### Scenario: Stage 5 help matches active docs

- **WHEN** active documentation shows a direct Stage-5 invocation
- **THEN** every documented flag appears in `stage5_inject_notes.mjs --help`

### Requirement: Notes completion is proven by a current receipt
The speaker_notes_injected gate SHALL use the strict completion validator, never a rerun input-lineage validator or node status. A current notes receipt passes only when its schema/pipeline/producer/common assembly fields are valid; confined source/plan/assembly/PPTX paths and realpaths exist; current source, plan, assembly receipt, and final PPTX SHAs match; ordered IDs equal current plan order; counts match; and HTML-first additionally has exact current reset ID and delivery digest. A historical v1/v2 receipt or retired whole-page lineage SHALL never satisfy current completion or rerun authorization. Any reset/source notes/order/PPTX/assembly drift makes completion stale, while an eligible current receipt may separately authorize notes-only input only when current pipeline/reset lineage remains valid.

#### Scenario: Current HTML receipt validates
- **WHEN** current source/plan/common assembly/HTML delivery/PPTX lineage all match
- **THEN** speaker_notes_injected is true

#### Scenario: Current whole-page receipt validates
- **WHEN** a current whole-page source and its current assembly/notes lineage all match
- **THEN** speaker_notes_injected is true without HTML reset fields

#### Scenario: Retired receipt is rejected
- **WHEN** a current run contains an older notes receipt schema or retired pipeline lineage
- **THEN** completion and rerun authorization both fail without inferring historical lineage

#### Scenario: Notes source changes after current injection
- **WHEN** only note text changes
- **THEN** strict completion is false while separate current rerun validation may authorize reinjection

#### Scenario: Completion receipt path escapes the run directory
- **WHEN** a receipt contains an absolute, traversal, or contained-looking symlink path outside the run
- **THEN** completion fails closed and hashes no external file

### Requirement: jszip is a direct runtime dependency

Because `stage5_inject_notes.mjs` imports `jszip` directly, `package.json` SHALL declare a compatible `jszip` runtime dependency and the lockfile SHALL resolve it directly rather than relying on transitive hoisting through another package.

#### Scenario: Dependency tree changes upstream

- **WHEN** `pptxgenjs` changes its transitive dependency layout
- **THEN** Stage 5 can still resolve the explicitly declared `jszip` package

### Requirement: Whole-page notes retain current assembly lineage
Notes injection SHALL accept a whole-page root assembly only when it declares `whole-page-image2-v1` through the current assembly schema, and SHALL publish the same pipeline in its notes receipt. It SHALL not accept an older whole-page assembly or notes receipt as completion or rerun authority.

#### Scenario: Whole-page notes are injected
- **WHEN** notes are injected from a current whole-page assembly receipt
- **THEN** the notes receipt carries `whole-page-image2-v1`
- **AND** retired lineage values are rejected

### Requirement: Notes receipt binds Page Authority final assembly lineage
Notes Injection SHALL accept Page Authority input only when its ordered stable IDs, current PPTX assembly
receipt, final-manifest digest, and final-slide fingerprints match the resolved receipt. It SHALL bind
the notes receipt to that delivery lineage and reject a raw underlay, legacy branch receipt, partial
manifest, or mismatched ordered ID set.

#### Scenario: Notes follow a mixed Page Authority assembly
- **WHEN** a current mixed Pure/Framed final manifest and matching notes are supplied
- **THEN** notes are injected by stable slide ID and the receipt records the Page Authority assembly lineage
- **AND** no renderer-private manifest is used to infer alignment
