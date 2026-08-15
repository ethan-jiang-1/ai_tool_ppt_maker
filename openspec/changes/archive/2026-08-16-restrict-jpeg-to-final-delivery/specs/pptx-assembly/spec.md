## MODIFIED Requirements

### Requirement: JPEG delivery media uses one conservative fixed profile

For every accepted final PNG, shared delivery SHALL create JPEG media at the
same pixel dimensions with quality `95` and 4:4:4 chroma sampling. Before
encoding, it SHALL flatten any PNG alpha against opaque white. It SHALL not
expose a quality, subsampling, resize, background, or alternate-format
override in the delivery command, state, or manifest. The conversion profile
is mechanical delivery metadata, not a review decision or a replacement
image-production profile.

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
