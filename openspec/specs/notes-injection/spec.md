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

### Requirement: Notes receipt binds replacement Page Image final assembly lineage

Notes Injection SHALL accept current input only when its ordered stable slide
IDs, `page-image-final-slide-manifest-v1` digest, final-slide fingerprints,
current `page-image-delivery-media-v1` digest and entries, and current PPTX
assembly receipt cross-match one replacement Page Image Workflow lineage. It
SHALL inject notes by stable slide ID and bind its receipt to that delivery
lineage. It SHALL reject a raw provider page, partial review, foreign record,
v2 receipt/manifest, mismatched ordered ID set, or mismatched JPEG delivery
media before modifying the PPTX or publishing a notes receipt.

#### Scenario: Notes follow current JPEG-backed final assembly

- **WHEN** a current Framed or Pure replacement final manifest and matching
  JPEG delivery media, and matching notes are supplied
- **THEN** notes are injected by stable slide ID and the receipt records the
  replacement assembly and JPEG delivery lineage
- **AND** no renderer-private manifest is used to infer alignment

#### Scenario: Mismatched JPEG delivery media does not mutate notes

- **WHEN** the assembly receipt's JPEG delivery-media digest or an ordered
  JPEG entry differs from the current replacement lineage
- **THEN** notes injection rejects the delivery as stale before opening the
  PPTX for mutation
- **AND** it does not publish a notes receipt

#### Scenario: v2 notes input remains unsupported

- **WHEN** Notes Injection receives a v2 final manifest or assembly receipt
- **THEN** it returns the `unsupported-protocol/export` hard-stop before opening the
  delivery target for mutation
- **AND** it does not translate the old lineage into a current notes receipt

### Requirement: Notes-only refresh preserves current JPEG delivery lineage

Notes-only refresh SHALL first validate the current delivery receipt, assembly
receipt, final-slide manifest, and `page-image-delivery-media-v1` binding as
one current lineage. It SHALL accept no receipt that predates or omits the
required JPEG delivery-media binding, even when its final-manifest digest and
PPTX path still match. It SHALL route such derived-only staleness to normal
delivery rebuild rather than hand migration, a fallback PNG assembly path, or
PPTX mutation.

#### Scenario: Old derived receipt requires normal delivery rebuild

- **WHEN** a notes-only refresh finds an otherwise matching delivery or
  assembly receipt without the current JPEG delivery-media binding
- **THEN** it reports the existing delivery rebuild route before opening the
  PPTX for mutation
- **AND** it does not write a notes receipt or a replacement delivery record

### Requirement: Notes completion consumes only current Page Image delivery

Notes extraction and injection SHALL consume only the replacement final
manifest and its matching assembly receipt. A v2 or foreign delivery record
SHALL not be a fallback, migration, or compatibility input.

#### Scenario: Current completion writes a current notes receipt

- **WHEN** replacement finalization and assembly have published valid current
  evidence
- **THEN** Notes Injection writes a receipt bound to that delivery lineage
- **AND** it does not use an unregistered artifact to fill a missing slide
