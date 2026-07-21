## MODIFIED Requirements

### Requirement: Multiline speaker-note blockquotes tolerate blank quote lines

Stage 5 SHALL accept the canonical multiline form `> **SPEAKER NOTE**` followed by zero-content quote
lines and subsequent quoted content, including a blank `>` line between the heading and the first note
paragraph. It SHALL preserve stable slide-ID matching, reject missing/empty final note content, and
retain the existing legacy and inline note forms.

#### Scenario: Blank quote line separates note heading and content

- **WHEN** a slide contains `> **SPEAKER NOTE**\n>\n> **Narrative flow:** ...`
- **THEN** Stage 5 extracts the note for that slide
- **AND** notes injection proceeds through the existing receipt/assembly lineage

#### Scenario: Blank-only note remains invalid

- **WHEN** a multiline blockquote contains no non-empty note content after normalization
- **THEN** Stage 5 reports the slide as missing speaker-note content
- **AND** it does not replace the PPTX or publish a receipt
