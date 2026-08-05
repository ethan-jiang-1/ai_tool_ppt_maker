## MODIFIED Requirements

### Requirement: TARGET workflow adapters publish one common final-slide manifest

For a current `page-authority-image2-v2` source receipt, the selected workflow
adapter SHALL be the only final-slide publisher. The Framed adapter SHALL
compose final PNG bytes from accepted text-free native raw evidence and its
local Text Frame; the Pure adapter SHALL publish the accepted native raw PNG
bytes unchanged as final PNG bytes. Both SHALL publish the same
`page-authority-final-slide-manifest-v2` schema, bound to the source receipt,
accepted raw evidence, ordered stable IDs/positions, final byte hashes, actual
final media dimensions, and workflow provenance.

Pure finalization SHALL retain the verified provider-native bytes, their actual
dimensions, and raw-byte digest exactly; it SHALL NOT crop, resize, transcode,
or otherwise normalize them. Framed finalization SHALL continue to own its
fixed local composition output and SHALL NOT present its local frame as a
repair of provider raw bytes. The selected adapter SHALL NOT invoke or import
its sibling adapter. A final manifest SHALL NOT be published before exact
accepted raw evidence is current, and no workflow adapter SHALL publish a
PPTX, notes receipt, or delivery review.

#### Scenario: Framed and Pure publish interchangeable delivery input

- **WHEN** valid target Framed and target Pure receipts each have current accepted raw evidence
- **THEN** their selected adapters each publish a valid v2 final-slide manifest with the same schema
- **AND** `05-delivery` can consume either manifest without an authority-specific caller contract

#### Scenario: Pure final preserves native provider bytes

- **WHEN** a Pure receipt finalizes accepted provider PNG evidence with positive native dimensions
- **THEN** each final PNG has the same bytes, dimensions, and digest as its accepted raw PNG
- **AND** the final manifest binds those unchanged final bytes in current order

#### Scenario: Non-default Pure dimensions reach delivery unchanged

- **WHEN** a Pure receipt finalizes accepted provider PNG evidence whose dimensions differ from `2048x1136`
- **THEN** its final manifest records those actual dimensions and delivery accepts the final bytes without normalization
- **AND** the resulting PPTX uses the image as a full-slide projection without changing the evidence bytes

#### Scenario: Wrong workflow finalization is rejected

- **WHEN** a Pure receipt is presented to the Framed adapter or a Framed receipt is presented to the Pure adapter
- **THEN** the adapter rejects the wrong workflow ownership before writing final output
- **AND** it does not delegate to or import the sibling adapter as a fallback
