## ADDED Requirements

### Requirement: Page Image visual configuration separates visual direction from source content

Visual Config SHALL continue to resolve a closed visual-language selection for
both current Page Image Workflow policies. It SHALL compile only registered
visual direction, relationship, identity, and negative visual constraints;
it SHALL not become a second source of provider-rendered literals, a free
provider prompt ingress, or a source copy rewriter.

The registry SHALL retain deterministic selected-record invalidation: recipes,
compositions, motifs, optional registered relationships, and their compatible
visual clauses are selected only by their registered IDs. An unselected registry
record SHALL not invalidate a page. The registry SHALL never use a workflow,
header policy, or source literal as a visual-selection authority.

The visual-language registry SHALL NOT require `no-readable-text` or
`no-labels` as a Framed page constraint. A visual clause that attempts to
forbid all readable page text, transfer content authority to the provider, or
override the Provider Content Schema SHALL be rejected before raw planning.

#### Scenario: Framed visual selection allows integrated page text

- **WHEN** a valid Framed Page Image Workflow slide resolves a registered
  visual selection and Provider Content Schema
- **THEN** Visual Config emits the selected visual direction without a
  whole-page no-text requirement
- **AND** the source literals remain owned by the receipt rather than the
  visual registry

#### Scenario: Registry cannot replace canonical content

- **WHEN** a registry clause attempts to prescribe provider copy or declare a
  text-free Framed page
- **THEN** Visual Config rejects that clause before raw planning
- **AND** it does not emit a provider request or substitute source content

### Requirement: Framed Header Rendering Policy owns one transparent protected overlay

For workflow `framed`, Visual Config SHALL resolve one closed header preset for
only `kicker`, `title`, and `subtitle`. The preset SHALL supply deterministic
typography, geometry, browser/capture profile, and a transparent-first local
overlay. It MAY supply preset-bound minimal contrast treatment but SHALL NOT
turn the protected area into an opaque card, a blank strip, a crop, or a
general local body renderer.

The same preset SHALL emit protected geometry as a provider-facing composition
constraint and as a review guide. The protected geometry SHALL require
avoidance of provider-rendered text and key subjects while preserving a
full-canvas continuous provider page; it is not proof that the provider has
obeyed the constraint. Pure SHALL not receive a Framed header preset or
protected geometry.

#### Scenario: Framed frame fits only the local header

- **WHEN** a Framed source header is evaluated against its selected preset
- **THEN** deterministic fit validates only kicker, title, and subtitle under
  the canonical local profile
- **AND** provider-rendered body, labels, metrics, and callouts do not enter
  the local frame fit contract

#### Scenario: Protected geometry does not create a blank page band

- **WHEN** a Framed provider input is compiled from the preset
- **THEN** it includes the protected geometry as an avoidance constraint and
  review guide
- **AND** it does not instruct the provider to crop the canvas, leave a blank
  strip, or prohibit all page text

### Requirement: Framed local profile and provider-input invalidation remain distinct

The Framed render profile SHALL be derived from the normalized header preset,
local layout compiler, checked-in font inventory, font-selection algorithm,
pinned browser runtime, capture profile, and protected geometry. It SHALL
exclude header literals and provider page bytes. A change to any
pixel-relevant profile fact invalidates dependent raw and final evidence.

Header literals SHALL be bound separately into the Framed compiled provider
input as context not to render. Therefore a literal change SHALL change the
provider-input digest and require raw rebuild even when the local render profile
is unchanged. A provider-free local overlay refresh is permitted only when the
compiled provider input, protected geometry, raw contract, and local profile
are all unchanged.

#### Scenario: Header literal change requires raw rebuild

- **WHEN** a Framed title literal changes while its local preset remains the
  same
- **THEN** the render-profile digest may remain unchanged but the provider-input
  digest changes
- **AND** the owning classifier marks the page for raw rebuild

#### Scenario: Local style-only change may preserve raw evidence

- **WHEN** a Framed local presentation change leaves the compiled provider
  input, protected geometry, raw contract, and local profile unchanged
- **THEN** the Framed owner may perform its provider-free local overlay refresh
- **AND** it does not create a provider authorization or submit a request

## REMOVED Requirements

### Requirement: Visual language and roles pass a deterministic no-text guard

**Reason**: The v2 no-text guard forbids the provider-rendered page content
that the correct model requires.

**Migration**: Current validation separates trusted visual direction from the
closed Provider Content Schema; no legacy no-text clause is interpreted.

### Requirement: Page Authority visual language is a closed registry selection

**Reason**: Its Page Authority eligibility and text-guard assumptions make the
visual registry part of the retired content model.

**Migration**: Resolve only registered Page Image visual direction separately
from the closed Provider Content Schema and Header Rendering Policy.

### Requirement: Framed Text Frame has one deterministic preset

**Reason**: The old preset owns callout/body-adjacent text and a text-free
underlay contract.

**Migration**: Use the replacement transparent header preset with a closed
three-field header set.

### Requirement: Framed render profile has one canonical identity

**Reason**: The old profile's provider-free text-literal behavior conflicts
with header context bound into provider input.

**Migration**: Current profile and provider-input fingerprints are distinct and
both participate in invalidation.

### Requirement: Visual configuration owns current Page Authority tokens

**Reason**: Its current-token vocabulary belongs to the retired Page Authority
protocol.

**Migration**: Retain only Page Image visual selection and Framed header-overlay
facts that are consumed by their current owners.

### Requirement: TARGET Framed visual semantics have one Framed workflow owner

**Reason**: Its text-free raw and local-body ownership are incorrect.

**Migration**: The replacement Framed policy owns only local header rendering
and protected geometry over the common Page Image Core.
