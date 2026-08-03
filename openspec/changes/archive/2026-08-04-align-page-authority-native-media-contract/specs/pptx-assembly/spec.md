## MODIFIED Requirements

### Requirement: PPTX assembly consumes the Page Authority final manifest

PPTX assembly SHALL accept only the ordered v2 Page Authority final-slide
manifest and its receipt-bound files. It SHALL reject foreign or unregistered
final artifacts as current assembly input. For a Pure Page Authority manifest,
the accepted native final PNG is an exact `2048x1136` image; assembly SHALL
place that verified image as the full-slide image without changing its source
bytes, stable identity, final manifest identity, or delivery lineage. Framed
final media remains owned by the Framed local compositor and SHALL not be
reinterpreted as a provider-media normalization by assembly.

#### Scenario: Current native final slides are assembled

- **WHEN** a valid Pure v2 Page Authority final manifest has receipt-bound
  `2048x1136` final PNG files
- **THEN** assembly produces a PPTX receipt bound to the ordered Page Authority
  final evidence and embeds the verified final image bytes
- **AND** it does not crop, resize, transcode, or replace the source PNG files

#### Scenario: Foreign or wrong media cannot become assembly input

- **WHEN** a final artifact is foreign, unregistered, hash-drifted, malformed,
  or does not meet the selected workflow's final media contract
- **THEN** assembly rejects it before creating a current delivery container
- **AND** it does not substitute another image or bypass the current manifest
