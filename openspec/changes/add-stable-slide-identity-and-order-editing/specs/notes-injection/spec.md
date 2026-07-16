## MODIFIED Requirements

### Requirement: Stage 5 injects speaker notes

Stage 5 SHALL parse every source SPEAKER NOTE as `{slide_id, note}` through the shared slide-document contract. The canonical run-dir path SHALL require the note ID set to equal the current `slide_plan.json` ID set exactly, then order notes by the current plan before injecting them into PPTX positions. Equal counts without equal IDs SHALL fail.

Before the first injection into a newly assembled PPTX, Stage 5 SHALL validate `_generated/qa/pptx_assembly.json`, including the current plan hash, ordered IDs, PPTX hash, and per-ID final-image evidence. A notes-only rerun on an already annotated PPTX MAY instead use the prior schema-v2 notes receipt's **rerun input-lineage validator** to prove the current PPTX bytes are a successor of that same ordered-ID assembly. This validator SHALL require the prior receipt schema, current PPTX hash, ordered IDs, plan/assembly lineage, and contained paths, but SHALL intentionally not require the prior notes-source hash to equal the newly edited source. Stage 5 SHALL NOT infer alignment from PPTX slide count alone.

The canonical run-dir path used by `unified_pipeline`/`ppt_flow` SHALL require exactly one non-backup target PPTX and validate its assembly or rerun lineage before mutation. It SHALL NOT delete the prior receipt merely because edited note source makes that receipt stale for completion: until PPTX replacement, the receipt remains useful as rerun lineage. Stage 5 SHALL stage the modified PPTX and schema-v2 receipt, write the PPTX through a same-directory temporary file and atomic rename, and only then atomically publish `_generated/qa/notes_injection.json`. Once PPTX bytes change, the prior receipt automatically ceases to validate by PPTX hash even if its file remains until replacement. In addition to normalized contained paths, current notes source/final PPTX SHA-256 values, counts, and ISO timestamp, the new receipt SHALL bind the current plan hash, ordered formal slide IDs, immutable root assembly lineage, and the predecessor PPTX/receipt hash when the input was a prior notes successor. Schema v1 receipts SHALL remain readable only for their original completion check where compatible; they SHALL NOT authorize a schema-v2 notes-only successor without re-establishing assembly lineage.

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

- **WHEN** only note text changes after a successful injection and the prior schema-v2 receipt proves the current PPTX descends from the same ordered-ID assembly
- **THEN** the completion validator correctly reports the old receipt stale against the edited notes source
- **AND** the separate rerun input-lineage validator still accepts the current PPTX, so Stage 5 reinjects notes and publishes a successor receipt
- **AND** does not require rebuilding Stage 4 merely because notes changed the PPTX bytes

#### Scenario: Failed injection does not publish receipt

- **WHEN** note IDs, ordered assembly evidence, or PPTX slide count do not match, or PPTX writing fails
- **THEN** Stage 5 exits with failure
- **AND** no receipt passes the completion validator for the edited source
- **AND** the original PPTX remains complete if atomic replacement did not finish
- **AND** when PPTX replacement did not occur, a prior schema-v2 receipt may remain available solely as valid rerun input lineage

#### Scenario: Receipt publication fails after PPTX replacement

- **WHEN** the modified PPTX is atomically published but the successor receipt cannot be published
- **THEN** Stage 5 fails and no receipt validates the new PPTX as completed or as an authorized notes successor
- **AND** the diagnostic directs deterministic recovery from current source/assembly rather than treating the prior receipt as current

#### Scenario: A slide has no speaker note block

- **WHEN** the source contains a planned slide without a non-empty SPEAKER NOTE block
- **THEN** Stage 5 fails instead of reporting partial success
- **AND** does not publish a receipt whose injected-note count is lower than slide count

#### Scenario: Run directory contains multiple target PPTX files

- **WHEN** `_generated/ppt/` contains more than one non-backup PPTX
- **THEN** the run-dir Stage-5 path fails with an ambiguity diagnostic
- **AND** does not select the lexicographically first file or publish a receipt

### Requirement: Notes completion is proven by a current receipt

The node gate condition `speaker_notes_injected` SHALL use the schema-v2 **completion validator** for `_generated/qa/notes_injection.json`. It SHALL pass only when the receipt schema is valid; `input_path` and `pptx_path` are normalized relative paths whose lexical paths and resolved realpaths remain inside the current run directory; the referenced current slide specification, plan, immutable assembly lineage, and PPTX exist; current source, plan, and final PPTX SHA-256 values match; receipt ordered IDs equal the current plan order; and `notes_injected` equals `slide_count` and the ordered-ID length. It SHALL NOT use the more permissive rerun input-lineage validator as completion proof and SHALL NOT use completion of the containing playbook node as a proxy.

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

#### Scenario: Rerun lineage is not completion proof

- **WHEN** the current PPTX matches a prior notes successor but the notes source has since changed
- **THEN** the rerun input-lineage validator may authorize Stage 5 to consume the PPTX
- **AND** `speaker_notes_injected` remains false until a new schema-v2 completion receipt binds the edited source and resulting PPTX
