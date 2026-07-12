## Purpose

Define Stage 5 of the production pipeline: extracting SPEAKER NOTE blocks from the source markdown and injecting them into the PPTX notes panel with `pptxgenjs`. This capability guarantees that every slide's presenter notes reach the final deck's Presenter View, and that a mismatch between note count and slide count aborts with an error rather than shipping a deck with misaligned notes.
## Requirements
### Requirement: Stage 5 injects speaker notes

Stage 5 SHALL extract SPEAKER NOTE blocks from source markdown and inject them into the PPTX notes panel. The canonical run-dir path used by `unified_pipeline`/`ppt_flow` SHALL require exactly one non-backup target PPTX, invalidate any prior success receipt before attempting a rerun, write the modified PPTX through a same-directory temporary file and atomic rename, and only then atomically write receipt schema version 1 under `_generated/qa/notes_injection.json`. The receipt SHALL bind the current slide specification and final PPTX by SHA-256 and record normalized run-dir-relative paths, slide count, injected-note count, and an ISO timestamp.

#### Scenario: Inject notes into PPTX

- **WHEN** source markdown has N slides each with a SPEAKER NOTE section
- **THEN** output `.pptx` has speaker notes in Presenter View for each slide
- **AND** notes count matches slide count, or the system aborts with an error
- **AND** the run-dir production path writes a current receipt with N slides and N injected notes

#### Scenario: Failed injection does not publish receipt

- **WHEN** note count and PPTX slide count differ or PPTX writing fails
- **THEN** Stage 5 exits with failure
- **AND** no successful receipt remains current, including a receipt from before the failed rerun attempt
- **AND** the original PPTX remains complete if atomic replacement did not finish

#### Scenario: A slide has no speaker note block

- **WHEN** the source contains a slide without a non-empty SPEAKER NOTE block
- **THEN** Stage 5 fails instead of reporting partial success
- **AND** does not publish a receipt whose injected-note count is lower than slide count

#### Scenario: Run directory contains multiple target PPTX files

- **WHEN** `_generated/ppt/` contains more than one non-backup PPTX
- **THEN** the run-dir Stage-5 path fails with an ambiguity diagnostic
- **AND** does not select the lexicographically first file or publish a receipt

### Requirement: Stage 5 is a standalone ESM script

The Stage 5 script SHALL be `stage5_inject_notes.mjs`, using the directly declared `jszip` dependency to access the notes panel. Its low-level standalone interface SHALL accept the documented `--pptx` and `--input` flags. Run-dir production SHALL be documented through `unified_pipeline --run-dir ... --stage 5` or the corresponding `ppt_flow` workflow rather than claiming the low-level script accepts an unsupported `--run-dir` flag.

#### Scenario: Stage 5 runs standalone

- **WHEN** `node stage5_inject_notes.mjs --pptx <file> --input <spec>` is run directly
- **THEN** it injects the extracted speaker notes using `jszip` without requiring the orchestrator

#### Scenario: Stage 5 help matches active docs

- **WHEN** active documentation shows a direct Stage-5 invocation
- **THEN** every documented flag appears in `stage5_inject_notes.mjs --help`

### Requirement: Notes completion is proven by a current receipt

The node gate condition `speaker_notes_injected` SHALL validate `_generated/qa/notes_injection.json`. It SHALL pass only when the receipt schema is valid; `input_path` and `pptx_path` are normalized relative paths whose lexical paths and resolved realpaths remain inside the current run directory; the referenced current slide specification and PPTX exist; both SHA-256 values match; and `notes_injected` equals `slide_count`. It SHALL NOT use completion of the containing playbook node as a proxy.

#### Scenario: Circular wave2 proxy is forbidden

- **WHEN** `wave2` exit includes `speaker_notes_injected`
- **THEN** the condition inspects the Stage-5 receipt
- **AND** does not check whether `wave2` is already completed

#### Scenario: PPTX changed after notes injection

- **WHEN** the PPTX bytes change after the receipt was written
- **THEN** `speaker_notes_injected` returns false with a stale-receipt reason
- **AND** the repair hint directs rerunning Stage 5

#### Scenario: Slide specs changed after notes injection

- **WHEN** SPEAKER NOTE source changes after the receipt was written
- **THEN** the source hash no longer matches
- **AND** the gate remains blocked until Stage 5 is rerun

#### Scenario: Receipt path escapes the run directory

- **WHEN** a receipt contains an absolute path, `..` traversal, or contained-looking symlink that resolves outside the current run directory
- **THEN** receipt validation fails closed
- **AND** no external file is hashed as completion evidence

### Requirement: jszip is a direct runtime dependency

Because `stage5_inject_notes.mjs` imports `jszip` directly, `package.json` SHALL declare a compatible `jszip` runtime dependency and the lockfile SHALL resolve it directly rather than relying on transitive hoisting through another package.

#### Scenario: Dependency tree changes upstream

- **WHEN** `pptxgenjs` changes its transitive dependency layout
- **THEN** Stage 5 can still resolve the explicitly declared `jszip` package
