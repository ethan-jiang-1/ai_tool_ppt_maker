## Purpose

Delivery covers final projection, PPTX assembly, speaker-note injection, and delivery review for the current Page Image Workflow. It is the sole delivery owner for `05-delivery/`.

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

### Requirement: Notes completion consumes only current Page Image delivery

Notes extraction and injection SHALL consume only the declared current final
manifest and its matching assembly receipt. A present foreign, unreadable,
incomplete, or cross-lineage delivery record that cannot establish exact
declared-current production identity SHALL emit the typed
`current_protocol_invalid` cause and project the owner-issued
`production-protocol` `current-protocol-invalid` hard-stop with
`repair-current-protocol-identity` of kind `repair` before notes mutation. It
SHALL preserve that input's bytes, SHALL not define a duplicate action schema,
and SHALL not treat the record as a fallback, migration, conversion, export, or
compatibility input.

An otherwise attributable current delivery lineage that merely lacks a derived
receipt field or required current output, or whose derived delivery media has
drifted, retains its existing delivery-owner rebuild action. This requirement
does not translate that current recovery into protocol repair.

#### Scenario: Current completion writes a current notes receipt

- **WHEN** replacement finalization and assembly have published valid current
  evidence
- **THEN** Notes Injection writes a receipt bound to that delivery lineage
- **AND** it does not use an unregistered artifact to fill a missing slide

#### Scenario: Invalid delivery identity cannot mutate notes

- **WHEN** Notes Injection receives a foreign or cross-lineage delivery record
  that cannot establish declared-current production identity
- **THEN** it returns the shared `production-protocol` repair action before
  reading or writing notes delivery artifacts
- **AND** the input bytes remain unchanged and no compatibility reader,
  conversion, or provider work occurs

#### Scenario: Attributable current delivery drift remains rebuild work

- **WHEN** current final-manifest and receipt facts attribute one current lineage
  but required derived JPEG media is missing, corrupt, or drifted
- **THEN** Notes Injection returns the existing delivery-owner rebuild action
- **AND** it does not recategorize the current lineage as invalid protocol

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

### Requirement: JPEG delivery media uses one conservative fixed profile

For every accepted final PNG, shared delivery SHALL create JPEG media at the
same pixel dimensions with quality `95` and 4:4:4 chroma sampling. Before
encoding, it SHALL flatten any PNG alpha against opaque white. It SHALL not
expose a quality, subsampling, resize, background, or alternate-format
override in the delivery command, state, or manifest. The conversion profile
is mechanical delivery metadata, not a review decision or a replacement
image-generation profile.

This final delivery conversion is the Harness's only current JPEG production
boundary: it SHALL run only after current final PNG media and its manifest
validate, and its newly derived JPEG bytes SHALL be used only by the declared
delivery package and PPTX assembly. Style Master candidates/selections, raw
page media, Pilot, Complete Page Review, final-PNG review, and human navigation
SHALL retain PNG bytes and SHALL NOT create or use JPEG as current authority.
Pre-existing immutable JPEG Style Master records remain attribution-only
history outside this delivery path and SHALL not become current selection or
raw authority. The Harness has no PDF assembly route, and this requirement
does not define a future PDF export boundary.

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

#### Scenario: Pre-delivery work remains PNG-only

- **WHEN** Style Master selection, Page Image planning, Pilot, review, or
  navigation runs before final delivery
- **THEN** it relies on its existing PNG source or immutable PNG evidence
- **AND** it does not create or require a new JPEG derivative before that final
  delivery boundary

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
