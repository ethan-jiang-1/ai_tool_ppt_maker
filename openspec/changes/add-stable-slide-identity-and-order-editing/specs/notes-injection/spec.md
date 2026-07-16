## MODIFIED Requirements

### Requirement: Stage 5 injects speaker notes

Stage 5 SHALL parse every source SPEAKER NOTE as `{slide_id, note}` through the shared slide-document contract. The canonical run-dir path SHALL require the note ID set to equal the current `slide_plan.json` ID set exactly, then order notes by the current plan before injecting them into PPTX positions. Equal counts without equal IDs SHALL fail.

Before the first injection into a newly assembled PPTX, Stage 5 SHALL validate `_generated/qa/pptx_assembly.json`, including the current plan hash, ordered IDs, PPTX hash, and per-ID final-image evidence. A notes-only rerun on an already annotated PPTX MAY instead validate the prior current notes receipt as the lineage successor of that same ordered-ID assembly. It SHALL NOT infer alignment from PPTX slide count alone.

The canonical run-dir path used by `unified_pipeline`/`ppt_flow` SHALL require exactly one non-backup target PPTX, invalidate any prior success receipt before attempting a rerun, write the modified PPTX through a same-directory temporary file and atomic rename, and only then atomically write receipt schema version 1 under `_generated/qa/notes_injection.json`. In addition to the existing normalized paths, source/final PPTX SHA-256 values, counts, and ISO timestamp, the receipt SHALL bind the current plan hash, ordered formal slide IDs, and verified assembly lineage.

#### Scenario: Inject notes into PPTX

- **WHEN** source markdown and current plan have the same N formal slide IDs and the target PPTX has current ordered-ID assembly evidence
- **THEN** output `.pptx` has each ID's speaker note in the Presenter View position assigned by the current plan
- **AND** notes count and ID set match the N planned slides, or the system aborts
- **AND** the run-dir production path writes a current receipt with N ordered IDs and N injected notes

#### Scenario: Equal counts with different IDs fail

- **WHEN** the source notes and current plan both contain N entries but their formal ID sets differ
- **THEN** Stage 5 fails with the missing and unexpected IDs
- **AND** does not inject notes by coincidental array position

#### Scenario: Notes-only rerun preserves assembly lineage

- **WHEN** only note text changes after a successful injection and the prior notes receipt proves the current PPTX descends from the same ordered-ID assembly
- **THEN** Stage 5 accepts that receipt as input lineage, reinjects notes, and publishes a successor receipt
- **AND** does not require rebuilding Stage 4 merely because notes changed the PPTX bytes

#### Scenario: Failed injection does not publish receipt

- **WHEN** note IDs, ordered assembly evidence, or PPTX slide count do not match, or PPTX writing fails
- **THEN** Stage 5 exits with failure
- **AND** no successful receipt remains current, including a receipt from before the failed rerun attempt
- **AND** the original PPTX remains complete if atomic replacement did not finish

#### Scenario: A slide has no speaker note block

- **WHEN** the source contains a planned slide without a non-empty SPEAKER NOTE block
- **THEN** Stage 5 fails instead of reporting partial success
- **AND** does not publish a receipt whose injected-note count is lower than slide count

#### Scenario: Run directory contains multiple target PPTX files

- **WHEN** `_generated/ppt/` contains more than one non-backup PPTX
- **THEN** the run-dir Stage-5 path fails with an ambiguity diagnostic
- **AND** does not select the lexicographically first file or publish a receipt

### Requirement: Notes completion is proven by a current receipt

The node gate condition `speaker_notes_injected` SHALL validate `_generated/qa/notes_injection.json`. It SHALL pass only when the receipt schema is valid; `input_path` and `pptx_path` are normalized relative paths whose lexical paths and resolved realpaths remain inside the current run directory; the referenced current slide specification, plan, assembly lineage, and PPTX exist; source, plan, and PPTX SHA-256 values match; receipt ordered IDs equal the current plan order; the receipt's assembly lineage is valid; and `notes_injected` equals `slide_count` and the ordered-ID length. It SHALL NOT use completion of the containing playbook node as a proxy.

#### Scenario: Circular producing-deck proxy is forbidden

- **WHEN** `producing-deck` exit includes `speaker_notes_injected`
- **THEN** the condition inspects the Stage-5 receipt
- **AND** does not check whether `producing-deck` is already completed

#### Scenario: PPTX changed after notes injection

- **WHEN** the PPTX bytes change after the receipt was written
- **THEN** `speaker_notes_injected` returns false with a stale-receipt reason
- **AND** the repair hint directs rerunning Stage 5

#### Scenario: Slide specs changed after notes injection

- **WHEN** slide order, IDs, or SPEAKER NOTE source changes after the receipt was written
- **THEN** the source or plan hash and ordered-ID evidence no longer match
- **AND** the gate remains blocked until Stage 5 is rerun against current assembly lineage

#### Scenario: Receipt path escapes the run directory

- **WHEN** a receipt contains an absolute path, `..` traversal, or contained-looking symlink that resolves outside the current run directory
- **THEN** receipt validation fails closed
- **AND** no external file is hashed as completion evidence
