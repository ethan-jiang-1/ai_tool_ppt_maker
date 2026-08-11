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
representation published by shared delivery. Shared delivery SHALL retain the
existing JPEG derivation, dimensions, and ordering rules. Assembly SHALL reject
an undeclared contract before PPTX creation and SHALL not read or adapt a
historical manifest or media representation.

#### Scenario: Assembly receives current final media

- **WHEN** ordered current final-page and delivery-package facts validate
- **THEN** assembly produces the PPTX from their bound media
- **AND** it uses no alternate or version-suffixed artifact contract

#### Scenario: Current Page Image final slides are assembled as JPEG media

- **WHEN** current ordered final-page media validates
- **THEN** assembly retains the established JPEG media assembly behavior
- **AND** it binds only declared current delivery facts

#### Scenario: Stale JPEG delivery media is rebuilt before assembly

- **WHEN** current final-page facts are valid but derived JPEG media is stale
- **THEN** the existing delivery owner rebuilds it before assembly
- **AND** it does not use an older media contract

#### Scenario: JPEG derivation failure protects the existing delivery

- **WHEN** JPEG derivation cannot establish current bound media
- **THEN** assembly stops without replacing current delivery authority
- **AND** it does not create a fallback representation

#### Scenario: Undeclared media cannot become assembly input

- **WHEN** assembly receives media with an undeclared contract marker
- **THEN** it rejects the input before PPTX creation
- **AND** it does not transcode or adopt it
