## ADDED Requirements

### Requirement: Page Authority has one receipt-to-delivery lifecycle
Pipeline Orchestration SHALL execute Page Authority as composition receipt, raw evidence, raw review,
final manifest, final projection, PPTX assembly, notes injection, and delivery decision. A consistent
Page Authority source/state pair SHALL not invoke header-lock, HTML-first, visual-slot, or a
generated-directory heuristic.

#### Scenario: Mixed deck has one final lineage
- **WHEN** accepted Pure and Framed raw evidence is selected for a build
- **THEN** orchestration creates one final manifest, projection, PPTX receipt, and notes receipt
- **AND** no branch publishes a separate delivery result

### Requirement: Page Authority refresh follows final-pixel ownership
A Framed Text Frame-only change with exact current raw/review identity SHALL run local composition,
final projection, assembly, notes, and delivery review without a provider call. A Pure display or raw
visual-contract change SHALL invalidate its raw item and require fresh raw acceptance before finalization.

#### Scenario: Framed and Pure title edits differ
- **WHEN** a Framed title changes and then a Pure title changes
- **THEN** the Framed refresh is provider-free while the Pure refresh requires fresh raw evidence
- **AND** neither is routed to historical header lock

