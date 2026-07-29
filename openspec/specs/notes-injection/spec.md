## Purpose

Define Page Authority notes completion: extracting SPEAKER NOTE blocks from current source
and injecting them into the receipt-bound final PPTX. This capability guarantees that
every slide's presenter notes reach the final deck's Presenter View, and that a
mismatch between note count and slide count aborts rather than shipping a deck with
misaligned notes.
## Requirements

### Requirement: Multiline speaker-note blockquotes tolerate blank quote lines
Notes extraction SHALL accept the canonical multiline form SPEAKER NOTE followed by
zero-content quote lines and subsequent quoted content, including a blank quote line
between heading and first paragraph. It SHALL preserve stable slide-ID matching,
reject missing/empty final note content, and retain documented inline note forms
without using note syntax to infer a retired run protocol.

#### Scenario: Blank quote line separates note heading and content
- **WHEN** a slide contains a multiline SPEAKER NOTE with a blank quoted line before narrative content
- **THEN** current notes extraction records the note for that slide
- **AND** notes injection proceeds through current receipt/assembly lineage

#### Scenario: Blank-only note remains invalid
- **WHEN** a multiline blockquote contains no non-empty note content after normalization
- **THEN** notes injection reports the slide as missing speaker-note content
- **AND** it does not replace the PPTX or publish a receipt

### Requirement: Notes receipt binds Page Authority final assembly lineage
Notes Injection SHALL accept v2 Page Authority input only when its ordered stable IDs, current PPTX assembly receipt, final-manifest digest, and final-slide fingerprints match the resolved receipt. It SHALL bind the notes receipt to that delivery lineage and reject a raw underlay, foreign-protocol receipt, partial manifest, or mismatched ordered ID set.

#### Scenario: Notes follow a current Page Authority assembly
- **WHEN** a current v2 Framed or Pure final manifest and matching notes are supplied
- **THEN** notes are injected by stable slide ID and the receipt records the Page Authority assembly lineage
- **AND** no renderer-private manifest is used to infer alignment

### Requirement: Notes completion consumes Page Authority final delivery
Notes extraction and injection SHALL consume the v2 Page Authority final manifest and assembly receipt. They SHALL NOT accept foreign or unregistered delivery evidence.

#### Scenario: Current notes are injected
- **WHEN** v2 Page Authority finalization has published a valid final manifest
- **THEN** notes injection writes a receipt bound to that Page Authority assembly lineage
