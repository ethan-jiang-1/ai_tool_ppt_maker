## ADDED Requirements

### Requirement: Style Master compatibility projection supports valid decoded PNG layouts

After current Style Master selection, the layout-resolved `style_master.jpg`
compatibility payload SHALL be derivable from selected CRC-valid PNG media with
an exact decoded pixel count and supported 8-bit or 16-bit grayscale,
grayscale-alpha, RGB, or RGBA layout. The payload SHALL use a derived RGBA8
pixel representation for JPEG encoding while preserving the selected candidate
bytes, dimensions, hash, provenance, review decision, and selection authority
unchanged.

A malformed, inconsistent, or unsupported decoded layout SHALL fail only the
compatibility projection with its existing owning replay/repair path. It SHALL
not reinterpret a source stride, replace selected bytes, roll back the
selection, or make Page Image raw work current.

#### Scenario: A 16-bit RGB selected Style Master has a compatibility JPEG

- **WHEN** a current selected Style Master has CRC-valid 16-bit RGB PNG bytes
  with its recorded native dimensions
- **THEN** the owner publishes a decodable same-dimension `style_master.jpg`
  compatibility payload from derived normalized pixels
- **AND** the selection continues to bind the original PNG bytes and hash

#### Scenario: An unsupported selected PNG layout does not alter selection

- **WHEN** compatibility projection encounters a decoded layout whose sample
  count or channel/depth combination cannot be represented reliably
- **THEN** the projection returns its bounded owning failure
- **AND** it does not mutate the effective selection or selected candidate

