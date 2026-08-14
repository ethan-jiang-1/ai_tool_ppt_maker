## MODIFIED Requirements

### Requirement: PPTX assembly consumes the current final-slide manifest

PPTX Assembly SHALL accept only the declared current `final-page-list`, its
receipt-bound final PNG media, and the declared `delivery-package` media
representation published by shared delivery. A present foreign, unreadable,
incomplete, or cross-lineage final-manifest or delivery-media record that cannot
establish exact declared-current production identity SHALL
emit the typed `current_protocol_invalid` cause and project the owner-issued
`production-protocol` `current-protocol-invalid` hard-stop with
`repair-current-protocol-identity` of kind `repair` before PPTX creation. The
assembly consumer SHALL not define a duplicate action schema or read, transcode,
adapt, or adopt an undeclared representation.

When valid current final-manifest and receipt facts attribute one current
lineage but required derived JPEG media is missing, corrupt, or drifted, the
existing delivery owner SHALL retain `delivery_media_rebuild_required`. This
current derived-output repair SHALL not be recategorized as invalid protocol.

#### Scenario: Assembly receives current final media

- **WHEN** ordered current final-page and delivery-package facts validate
- **THEN** assembly produces the PPTX from their bound media
- **AND** it uses no alternate or version-suffixed artifact contract

#### Scenario: Current Page Image final slides are assembled as JPEG media

- **WHEN** current ordered final-page media validates
- **THEN** assembly retains the established JPEG media assembly behavior
- **AND** it binds only declared current delivery facts

#### Scenario: Stale JPEG delivery media is rebuilt before assembly

- **WHEN** current final-manifest and receipt facts attribute one current lineage
  but derived JPEG media is missing, corrupt, or drifted
- **THEN** the existing delivery owner returns
  `delivery_media_rebuild_required` before assembly
- **AND** it does not replace that current rebuild action with protocol repair

#### Scenario: JPEG derivation failure protects the existing delivery

- **WHEN** JPEG derivation cannot establish current bound media
- **THEN** assembly stops without replacing current delivery authority
- **AND** it does not create a fallback representation

#### Scenario: Undeclared media cannot become assembly input

- **WHEN** assembly receives media whose present identity record cannot establish
  the declared current contract
- **THEN** it returns the shared `production-protocol` repair action before PPTX
  creation
- **AND** it does not transcode or adopt the media

#### Scenario: Foreign final manifest cannot become assembly input

- **WHEN** a final manifest is foreign or cross-lineage and cannot establish
  declared-current production identity
- **THEN** assembly returns the shared `production-protocol` repair action before
  PPTX creation
- **AND** it does not read delivery media, write assembly evidence, or invoke a
  compatibility reader
