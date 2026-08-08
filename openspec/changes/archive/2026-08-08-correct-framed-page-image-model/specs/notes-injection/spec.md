## ADDED Requirements

### Requirement: Notes receipt binds replacement Page Image final assembly lineage

Notes Injection SHALL accept current input only when its ordered stable slide
IDs, `page-image-final-slide-manifest-v1` digest, final-slide fingerprints, and
current PPTX assembly receipt cross-match one replacement Page Image Workflow
lineage. It SHALL inject notes by stable slide ID and bind its receipt to that
delivery lineage. It SHALL reject a raw provider page, partial review, foreign
record, v2 receipt/manifest, or mismatched ordered ID set before modifying the
PPTX or publishing a notes receipt.

#### Scenario: Notes follow current final assembly

- **WHEN** a current Framed or Pure replacement final manifest and matching
  notes are supplied
- **THEN** notes are injected by stable slide ID and the receipt records the
  replacement assembly lineage
- **AND** no renderer-private manifest is used to infer alignment

#### Scenario: v2 notes input remains unsupported

- **WHEN** Notes Injection receives a v2 final manifest or assembly receipt
- **THEN** it returns the `unsupported-protocol/export` hard-stop before opening the
  delivery target for mutation
- **AND** it does not translate the old lineage into a current notes receipt

### Requirement: Notes completion consumes only current Page Image delivery

Notes extraction and injection SHALL consume only the replacement final
manifest and its matching assembly receipt. A v2 or foreign delivery record
SHALL not be a fallback, migration, or compatibility input.

#### Scenario: Current completion writes a current notes receipt

- **WHEN** replacement finalization and assembly have published valid current
  evidence
- **THEN** Notes Injection writes a receipt bound to that delivery lineage
- **AND** it does not use an unregistered artifact to fill a missing slide

## REMOVED Requirements

### Requirement: Notes receipt binds Page Authority final assembly lineage

**Reason**: It accepts the retired v2 Page Authority final lineage.

**Migration**: Bind notes only to replacement Page Image Workflow assembly.

### Requirement: Notes completion consumes Page Authority final delivery

**Reason**: Its input contract names v2 delivery as current.

**Migration**: Consume only `page-image-final-slide-manifest-v1` and its
matching current assembly receipt.
