## REMOVED Requirements

### Requirement: Notes receipt binds replacement Page Image final assembly lineage

**Reason**: The accepted requirement contains a named historical-input
scenario. The replacement validates only current declared delivery lineage and
ordinary undeclared values.
**Migration**: Replace it with the current delivery-lineage requirement below.

## ADDED Requirements

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

## MODIFIED Requirements

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
