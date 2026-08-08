## ADDED Requirements

### Requirement: State records only JPEG-bound current delivery lineage

When State records a current Page Image delivery handoff, it SHALL require a
delivery receipt whose exact source epoch and final-manifest digest match the
target record and whose JPEG delivery-media manifest digest has the required
digest shape. State SHALL preserve that receipt as an opaque delivery-owned
record and SHALL NOT derive, repair, or infer its JPEG entries. A receipt that
omits the JPEG delivery-media binding is stale derived delivery state and SHALL
not establish `delivery_receipt_sha256`.

#### Scenario: Current JPEG-bound delivery can complete a state handoff

- **WHEN** a delivery-owned receipt matches the target source epoch and final
  manifest digest and contains a syntactically valid JPEG delivery-media
  manifest digest
- **THEN** State records its receipt digest as the target delivery handoff
- **AND** it does not copy JPEG media, final PNG bytes, or delivery metadata
  into State

#### Scenario: Pre-JPEG receipt cannot establish delivery completion

- **WHEN** a caller presents a legacy delivery receipt that lacks the JPEG
  delivery-media manifest digest
- **THEN** State rejects the handoff before mutating the target record
- **AND** its existing delivery rebuild route remains the only way to publish
  current completion
