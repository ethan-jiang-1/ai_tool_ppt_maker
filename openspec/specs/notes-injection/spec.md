## ADDED Requirements

### Requirement: Stage 5 injects speaker notes

Stage 5 SHALL extract SPEAKER NOTE blocks from source markdown and inject them into the PPTX notes panel.

#### Scenario: Inject notes into PPTX

- **WHEN** source markdown has N slides each with a SPEAKER NOTE section
- **THEN** output .pptx has speaker notes in Presenter View for each slide
- **AND** notes count matches slide count, or system aborts with error

### Requirement: Stage 5 is a standalone ESM script

The Stage 5 script SHALL be `stage5_inject_notes.mjs`, using `pptxgenjs` to access the notes panel.
