## ADDED Requirements

### Requirement: Framed presentation resolves one normalized protected composition

For a valid Framed Page Class projection, Visual Config SHALL resolve one
profile-owned protected composition with a normalized canvas-relative
reserved-header region and body-safe region. The body-safe region SHALL be
valid on the declared canvas, exclude every reserved-header region, and retain
the selected profile and inherited-value provenance that bind it to the exact
page. These facts are deterministic inputs to the selected Framed adapter and
its review guide; they are not source-authored geometry, provider output,
provider-native transport parameters, an opaque local band, or a second layout
authority.

The resolver SHALL derive this composition only from the selected current
Framed profile and its canonical local-rendering geometry. It SHALL not use a
Pure projection, an unselected sibling profile, C5-derived data, or a prior raw
contract. Pure projections SHALL expose no Framed protected composition.

An invalid normalized region, overlap between a body-safe region and a reserved
header region, or a binding/provenance mismatch SHALL fail through the existing
source/configuration repair path before provider-free raw planning. The resolver
SHALL not synthesize a default region or recover a former projection.

#### Scenario: A selected Framed profile resolves an exact safe composition

- **WHEN** a valid Framed page resolves its selected Page Class profile
- **THEN** its projection provides one normalized reserved-header region and
  non-overlapping body-safe region with the profile's exact provenance
- **AND** the Framed adapter can bind those facts without accepting a per-page
  coordinate override

#### Scenario: Pure does not receive Framed composition facts

- **WHEN** a valid Pure page resolves its selected Page Class profile
- **THEN** its projection contains no reserved-header region or body-safe region
- **AND** it does not inherit a Framed profile or protected-composition digest

#### Scenario: Invalid safe geometry stops at configuration

- **WHEN** a selected Framed profile yields an out-of-canvas or overlapping
  normalized protected composition
- **THEN** Visual Config returns the existing source/configuration repair action
  before a raw contract or provider request is compiled
- **AND** it does not read an earlier generated layout or raw plan as a fallback
