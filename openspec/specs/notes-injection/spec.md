## Purpose

Define Stage 5 of the production pipeline: extracting SPEAKER NOTE blocks from the source markdown and injecting them into the PPTX notes panel with `pptxgenjs`. This capability guarantees that every slide's presenter notes reach the final deck's Presenter View, and that a mismatch between note count and slide count aborts with an error rather than shipping a deck with misaligned notes.

## Requirements

### Requirement: Stage 5 injects speaker notes

Stage 5 SHALL extract SPEAKER NOTE blocks from source markdown and inject them into the PPTX notes panel.

#### Scenario: Inject notes into PPTX

- **WHEN** source markdown has N slides each with a SPEAKER NOTE section
- **THEN** output .pptx has speaker notes in Presenter View for each slide
- **AND** notes count matches slide count, or system aborts with error

### Requirement: Stage 5 is a standalone ESM script

The Stage 5 script SHALL be `stage5_inject_notes.mjs`, using `pptxgenjs` to access the notes panel.

#### Scenario: Stage 5 runs standalone

- **WHEN** `node stage5_inject_notes.mjs <run_dir>` is run directly
- **THEN** it injects the extracted speaker notes into the PPTX notes panel using `pptxgenjs`, without requiring the orchestrator
