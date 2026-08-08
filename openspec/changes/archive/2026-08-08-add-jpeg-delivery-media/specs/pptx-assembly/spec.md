## MODIFIED Requirements

### Requirement: PPTX assembly consumes the replacement final-slide manifest

PPTX Assembly SHALL accept only an ordered
`page-image-final-slide-manifest-v1`, its current receipt-bound final PNG
media, and a `page-image-delivery-media-v1` representation published by shared
delivery. Shared delivery SHALL derive or rebuild one JPEG for every ordered
final PNG before assembly. Each JPEG SHALL preserve its source dimensions and
bind its digest, filename, fixed high-quality profile, and source final-PNG
digest to the exact current final-slide manifest.

Assembly SHALL embed only the validated JPEG delivery media and record its
manifest digest and ordered entries in its receipt. The source PNG remains the
reviewed finalization evidence: assembly SHALL NOT alter, replace, or make it
secondary authority. It SHALL reject a raw provider page, partial review,
foreign artifact, v2 manifest, mismatched workflow/source lineage, or invalid
delivery media before creating or replacing a delivery container. It SHALL not
crop, resize, transcode, or substitute a validated JPEG after delivery-media
validation, and it SHALL not reinterpret Framed's already-reviewed header
composite or Pure's accepted provider page.

#### Scenario: Current Page Image final slides are assembled as JPEG media

- **WHEN** a valid replacement final-slide manifest has ordered receipt-bound
  final PNG media
- **THEN** shared delivery creates matching JPEG delivery media and assembly
  validates it before writing the PPTX
- **AND** its receipt binds the ordered final evidence and the exact JPEG
  delivery entries embedded in the PPTX

#### Scenario: Stale JPEG delivery media is rebuilt before assembly

- **WHEN** an existing JPEG file or delivery-media manifest does not bind the
  current final PNG digest, manifest digest, ordering, dimensions, or fixed
  profile declaration
- **THEN** assembly does not embed that stale JPEG
- **AND** shared delivery rebuilds and assembly validates current delivery
  media before writing a new PPTX receipt

#### Scenario: JPEG derivation failure protects the existing delivery

- **WHEN** a current final PNG cannot be converted or the derived JPEG fails
  dimension, profile, or digest validation
- **THEN** assembly hard-stops before replacing the PPTX or publishing an
  assembly receipt
- **AND** the prior PPTX and assembly, notes, and delivery receipts remain
  unmodified

#### Scenario: v2 media cannot become assembly input

- **WHEN** assembly receives a v2 final manifest or v2 evidence reference
- **THEN** it returns the `unsupported-protocol/export` hard-stop before reading image
  bytes or creating a delivery container
- **AND** it does not convert or adopt the media

## ADDED Requirements

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
