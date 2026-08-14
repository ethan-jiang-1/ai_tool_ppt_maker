## Purpose

Define Page Image Workflow PPTX assembly from the ordered current final-slide manifest.
Assembly creates one receipt-bound delivery container and never accepts a raw,
historical, partial, or unregistered final artifact as current input.
## Requirements
### Requirement: JPEG delivery media uses one conservative fixed profile

For every accepted final PNG, shared delivery SHALL create JPEG media at the
same pixel dimensions with quality `95` and 4:4:4 chroma sampling. Before
encoding, it SHALL flatten any PNG alpha against opaque white. It SHALL not
expose a quality, subsampling, resize, background, or alternate-format
override in the delivery command, state, or manifest. The conversion profile
is mechanical delivery metadata, not a review decision or a replacement
image-production profile.

#### Scenario: Delivery preserves presentation detail without resizing

- **WHEN** assembly derives JPEG media from a valid 2000x1125 final PNG
- **THEN** the JPEG has 2000x1125 pixels and its delivery-manifest entry
  declares quality `95` and 4:4:4 chroma sampling
- **AND** no delivery option can lower quality or resize the image

#### Scenario: Delivery flattens transparent PNG pixels deterministically

- **WHEN** an accepted final PNG contains transparent or partially transparent
  pixels
- **THEN** shared delivery composites those pixels against opaque white before
  JPEG encoding without changing the source PNG or its final-manifest digest
- **AND** the resulting JPEG remains subject to the same dimensions, digest,
  and delivery-manifest validation as an opaque input

### Requirement: Page Image PPTX slides project only derived current order

PPTX Assembly SHALL retain the small right-bottom ordinal footer on every
current Page Image slide. It SHALL derive the one-based minimum-two-digit
ordinal from the accepted replacement manifest order only. The footer is a
derived presentation annotation and SHALL not alter final image bytes,
`slide_id`, final manifest identity, evidence, or delivery lineage; it SHALL
not introduce a new configuration or review gate.

#### Scenario: Replacement manifest order determines the footer

- **WHEN** a current final manifest orders slides at positions 1, 10, and 100
- **THEN** the assembled PPTX displays `01`, `10`, and `100` on those slides
- **AND** it does not persist ordinals as stable slide identities

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
