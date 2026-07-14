## MODIFIED Requirements

### Requirement: Notes completion is proven by a current receipt

The node gate condition `speaker_notes_injected` SHALL validate `_generated/qa/notes_injection.json`. It SHALL pass only when the receipt schema is valid; `input_path` and `pptx_path` are normalized relative paths whose lexical paths and resolved realpaths remain inside the current run directory; the referenced current slide specification and PPTX exist; both SHA-256 values match; and `notes_injected` equals `slide_count`. It SHALL NOT use completion of the containing playbook node as a proxy.

#### Scenario: Circular producing-deck proxy is forbidden

- **WHEN** `producing-deck` exit includes `speaker_notes_injected`
- **THEN** the condition inspects the Stage-5 receipt
- **AND** does not check whether `producing-deck` is already completed

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
