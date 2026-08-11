## Purpose

Define Page Image Workflow notes completion: extracting SPEAKER NOTE blocks from current source
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

### Requirement: Notes-only refresh preserves current JPEG delivery lineage

Notes-only refresh SHALL first validate the declared current delivery-package,
assembly, and final-page-list bindings as one lineage. It SHALL reject an
undeclared contract before notes mutation and SHALL not translate a historical
delivery format into current evidence.

#### Scenario: Notes refresh receives an undeclared delivery marker

- **WHEN** a delivery binding contains a value absent from the current schema
  inventory
- **THEN** refresh stops before notes output changes
- **AND** it does not invoke a compatibility reader or conversion

#### Scenario: Old derived receipt requires normal delivery rebuild

- **WHEN** a receipt is absent from the current declared delivery lineage
- **THEN** notes-only refresh returns the existing current delivery rebuild action
- **AND** it does not adopt an older derived receipt

### Requirement: Notes completion consumes only current Page Image delivery

Notes extraction and injection SHALL consume only the replacement final
manifest and its matching assembly receipt. A v2 or foreign delivery record
SHALL not be a fallback, migration, or compatibility input.

#### Scenario: Current completion writes a current notes receipt

- **WHEN** replacement finalization and assembly have published valid current
  evidence
- **THEN** Notes Injection writes a receipt bound to that delivery lineage
- **AND** it does not use an unregistered artifact to fill a missing slide

### Requirement: Notes receipt validates current Page Image final assembly lineage

Notes Injection SHALL accept current input only when ordered stable slide IDs,
the declared `final-page-list` digest, final-slide fingerprints, declared
delivery-package media binding, and current PPTX assembly receipt cross-match
one replacement Page Image lineage. It SHALL inject notes by stable slide ID
and bind its receipt to that delivery lineage without accepting an alternate or
version-suffixed manifest/media contract.

#### Scenario: Notes bind current final delivery

- **WHEN** current final-page and delivery-package facts cross-match one source
- **THEN** notes injection publishes its receipt for that declared lineage
- **AND** it does not infer or accept a historical media contract

#### Scenario: Notes follow current JPEG-backed final assembly

- **WHEN** current final media and assembly validate
- **THEN** notes inject by stable ID against their declared delivery lineage
- **AND** no alternate receipt is accepted

#### Scenario: Mismatched JPEG delivery media does not mutate notes

- **WHEN** declared final/media facts do not cross-match
- **THEN** notes injection stops before any notes mutation
- **AND** it does not repair the mismatch through another contract

#### Scenario: An undeclared notes input remains unsupported

- **WHEN** notes input carries an undeclared contract marker
- **THEN** the owner rejects it before notes processing
- **AND** it does not decode, convert, or reuse the input
