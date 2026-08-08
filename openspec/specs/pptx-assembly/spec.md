## Purpose

Define Page Image Workflow PPTX assembly from the ordered current final-slide manifest.
Assembly creates one receipt-bound delivery container and never accepts a raw,
historical, partial, or unregistered final artifact as current input.
## Requirements
### Requirement: PPTX assembly consumes the replacement final-slide manifest

PPTX Assembly SHALL accept only an ordered
`page-image-final-slide-manifest-v1` and its receipt-bound current final-media
files. It SHALL reject a raw provider page, partial review, foreign artifact,
v2 manifest, or mismatched workflow/source lineage before creating a delivery
container. Assembly SHALL place each verified final page image as the slide's
content without altering its final bytes, stable identity, manifest identity,
or delivery lineage. It consumes the shared manifest shape and SHALL not
reinterpret Framed's already-reviewed header composite or Pure's accepted
provider page.

#### Scenario: Current Page Image final slides are assembled

- **WHEN** a valid replacement final-slide manifest has ordered receipt-bound
  final media
- **THEN** assembly produces a PPTX receipt bound to that ordered final
  evidence and embeds the verified final image bytes
- **AND** it does not crop, resize, transcode, or substitute the source media

#### Scenario: v2 media cannot become assembly input

- **WHEN** assembly receives a v2 final manifest or v2 evidence reference
- **THEN** it returns the `unsupported-protocol/export` hard-stop before reading image
  bytes or creating a delivery container
- **AND** it does not convert or adopt the media

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
