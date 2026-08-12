## MODIFIED Requirements

### Requirement: Framed Header Rendering Policy owns one transparent protected overlay

For workflow `framed`, Visual Config SHALL resolve the catalog-bound Framed
header profile for the page's normalized Page Class. The profile SHALL govern
only the permitted `kicker`, `title`, and `subtitle` set, deterministic local
typography, one CSS-pixel `header_region`, browser/capture profile, and a
transparent-first local overlay. `header_region` SHALL contain exactly `x`,
`y`, `width`, and `height`, lie in the declared canvas, contain every field
rectangle named by the profile's permitted-header-field set, and leave positive
canvas height below its bottom edge. The profile SHALL NOT retain
`protected_geometry` or an alternate protected-region shape. It MAY supply
profile-bound minimal contrast treatment but SHALL NOT turn the header region
into an opaque card, a blank strip, a crop, or a general local body renderer.

The resolver SHALL derive one `protected_composition` only from that selected
`header_region` and its declared canvas. Its exact shape is
`coordinate_space: normalized-canvas`, a `reserved_header` formed by
normalizing the CSS-pixel header region, and a `body_safe` rectangle with
`x: 0`, `y: reserved_header.y + reserved_header.height`, `width: 1`, and
`height: 1 - reserved_header.y - reserved_header.height`. Both normalized rectangles SHALL lie in `0..1`, have
positive width and height, and not overlap. This composition is a Framed
provider-facing avoidance instruction and review guide for readable
provider-rendered body content and key subjects while preserving a full-canvas
continuous provider page; it is not proof that a provider obeyed the
constraint. Pure SHALL not receive a Framed header profile, `header_region`, or
protected composition.

Before compilation, the resolver SHALL compare the source receipt's non-null
Framed header literals with the selected profile's permitted field set. A
literal that the profile does not permit SHALL fail with the direct Page Source
repair action. The resolver SHALL NOT drop, rewrite, move to provider-visible
content, infer a different Page Class for that literal, accept a per-page
geometry override, synthesize a composition default, or read a former derived
projection.

#### Scenario: Framed frame fits only the local header

- **WHEN** a Framed source header is evaluated against its resolved Page Class profile
- **THEN** deterministic fit validates only the profile-permitted kicker, title,
  and subtitle literals under that canonical local profile
- **AND** provider-rendered body, labels, metrics, and callouts do not enter the
  local frame fit contract

#### Scenario: The selected header region derives one exact safe composition

- **WHEN** a valid Framed profile resolves one in-canvas header region that
  contains every permitted local field and leaves room below it
- **THEN** its projection emits the exact normalized reserved-header and
  full-width body-safe rectangles from the declared formula and selected-profile
  provenance
- **AND** neither a slide nor a prior C5 publication can substitute either
  rectangle

#### Scenario: Protected geometry does not create a blank page band

- **WHEN** a Framed provider input is compiled from its resolved profile
- **THEN** it includes the profile-derived protected composition as an avoidance
  instruction and review guide
- **AND** it does not instruct the provider to crop the canvas, leave a blank
  strip, or prohibit all page text

#### Scenario: A malformed or former geometry shape stops before planning

- **WHEN** a selected Framed profile has multiple protected regions, an
  out-of-canvas header region, a field outside its header region, no positive
  body-safe height, or a `protected_geometry` field
- **THEN** resolution returns the direct source/configuration repair action
  before raw planning
- **AND** it does not convert the former shape, use a prior projection, or
  expose a mixed Framed/Pure fact

#### Scenario: A title-only class cannot silently lose a source subtitle

- **WHEN** a Framed `opening` profile permits only title and its source receipt
  contains a non-null subtitle
- **THEN** resolution stops with the field-level Page Source repair action before raw planning
- **AND** it does not omit the subtitle, pass it to the provider, or substitute another class

### Requirement: Framed local profile and provider-input invalidation remain distinct

The Framed render profile SHALL be derived from the selected Page Class header
profile, local layout compiler, checked-in font inventory, font-selection
algorithm, pinned browser runtime, capture profile, and `header_region`. It
SHALL exclude header literals, protected-composition provider semantics, and
provider page bytes. A change to any pixel-relevant local profile fact
invalidates dependent raw and final evidence.

The resolver-derived protected-composition digest and Framed source-restriction
binding SHALL be bound separately into the Framed compiled provider input and
raw contract. A header literal, composition, or restriction change SHALL change
the provider-input digest and require raw rebuild even when the local render
profile is unchanged. A provider-free local overlay refresh is permitted only
when the compiled provider input, protected-composition binding, raw contract,
and local profile are all unchanged.

#### Scenario: Header literal change requires raw rebuild

- **WHEN** a Framed title literal changes while its selected local profile
  remains the same
- **THEN** the render-profile digest may remain unchanged but the provider-input
  digest changes
- **AND** the owning classifier marks the page for raw rebuild

#### Scenario: Composition drift requires raw rebuild

- **WHEN** a selected Framed profile's header region produces a different
  protected-composition digest
- **THEN** the owning classifier marks the page for raw rebuild before provider
  submission or review reuse
- **AND** it does not use a local-overlay refresh or retain former raw evidence

#### Scenario: Local style-only change may preserve raw evidence

- **WHEN** a Framed local presentation change leaves the compiled provider
  input, protected composition, raw contract, and local profile unchanged
- **THEN** the Framed owner may perform its provider-free local overlay refresh
- **AND** it does not create a provider authorization or submit a request
