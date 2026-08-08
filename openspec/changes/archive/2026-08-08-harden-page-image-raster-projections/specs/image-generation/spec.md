## ADDED Requirements

### Requirement: Page Image review projections render supported provider PNG layouts as derived evidence

Every rebuildable Page Image raw, Pilot, and Complete Page Review raster
projection SHALL render CRC-valid provider or adapter-complete PNG media with
an exact decoded pixel count and supported 8-bit or 16-bit grayscale,
grayscale-alpha, RGB, or RGBA layout. The projection SHALL normalize only its
derived canvas pixels and retain the exact input bytes, native dimensions,
hashes, compiled-input lineage, provenance, review bindings, and acceptance
authority unchanged.

An inconsistent or unsupported decoded layout SHALL fail the owning derived
review projection clearly. It SHALL not accept, replace, transcode, or
reclassify provider media, create another review decision, or publish a
projection as a selector or evidence authority.

#### Scenario: Pure review renders a non-RGBA provider page without changing it

- **WHEN** a current Pure raw provider page is CRC-valid 16-bit RGB PNG media
  with accepted exact bytes and provenance
- **THEN** Complete Page Review publishes its derived visual projection from
  normalized pixels
- **AND** the review binds the original provider bytes and does not create a
  local composite or replacement media record

#### Scenario: A malformed review layout cannot become review evidence

- **WHEN** a Page Image review projection encounters a decoded media layout
  with an inconsistent sample count
- **THEN** it reports the owning projection failure before publishing that
  projection
- **AND** it leaves current raw media and review authority unchanged

