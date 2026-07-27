## ADDED Requirements

### Requirement: Inspection projects one legacy adoption action before legacy workflow evaluation
`inspectWorkflow` SHALL call the direct legacy protocol observer before selecting HTML, whole-page, or Page Authority workflow prerequisites. For `recognized-legacy`, inspection SHALL return a non-mutating `guide` whose only primary action is the provider-free adoption prepare or preview checkpoint, and it SHALL include the observer's bounded source/state/identity/summary digest facts in its stable checkpoint. It SHALL not select a legacy review, build, refresh, provider, generated-artifact, or Page Authority evidence action.

For `current`, inspection SHALL continue through the ordinary Page Authority projection. For `current-pair-corrupt`, it SHALL return the Page Authority repair-owner hard-stop. For `unsupported-or-corrupt`, it SHALL return the repair/export hard-stop. The observer result must be re-read by the mutation owner; an inspection result never authorizes prepare, confirmation, publication, recovery, provider work, or a source/state repair.

#### Scenario: Recognized legacy run gets one adoption guide
- **WHEN** workflow inspection observes an exact HTML-first or whole-page legacy source/state pair
- **THEN** it returns one provider-free adoption primary action and the direct observation digest
- **AND** it does not project legacy delivery evidence or Page Authority raw evidence as a continuation

#### Scenario: Partial Page Authority pair remains a repair hard-stop
- **WHEN** either source or state claims Page Authority but the exact pair is invalid
- **THEN** inspection returns the Page Authority repair-owner hard-stop
- **AND** it does not offer adoption, generated-artifact inference, or legacy execution
