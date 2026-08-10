## REMOVED Requirements

### Requirement: Pure deck visual system is a closed version-resolved source contract

**Reason**: The Pure-only file cannot own the V2 shared Page Class catalog or
workflow-isolated Framed projection.

**Migration**: V2 Page Image work uses the four-file Page Image Presentation
System package; no code or generated-artifact fallback remains.

### Requirement: Framed Header Rendering Policy owns one transparent protected overlay

**Reason**: A code-only preset is replaced by a selected V2 Header Profile.

**Migration**: V2 Framed source resolves its Header Profile through the
Presentation System; provider avoidance remains separately requested and
human-reviewed.

## ADDED Requirements

### Requirement: Visual Config resolves only the selected V2 presentation projection

Visual Config SHALL obtain the validated Page Image Presentation result for
each V2 slide and expose only that slide's selected workflow projection and
selected-presentation digest to the selected adapter. It SHALL not expose the
whole package, sibling projection, or a profile selected directly by source.

The Pure projection SHALL compile inherited Deck Baseline and selected Pure
Profile into content-neutral full-page presentation facts. The Framed projection
SHALL compile its Header Profile into fixed local header layout facts, including
Reserved Header Region. Neither may contain slide literals, provider prompt
prose, generated output, review State, or credentials.

#### Scenario: Pure cannot receive Framed geometry

- **WHEN** a V2 Pure page resolves a package with valid Framed Header Profiles
- **THEN** its adapter receives only selected Pure projection and digest
- **AND** it receives no Reserved Header Region, overlay field, or Framed CSS
  fact

#### Scenario: Framed cannot retain a code-preset fallback

- **WHEN** a V2 Framed page has no valid selected Header Profile
- **THEN** Visual Config reports owning presentation-source repair before raw
  planning
- **AND** it does not fall back to a code preset, Pure record, or generated
  evidence

### Requirement: Selected Framed Header Profile remains transparent and local-only

For Framed, Visual Config SHALL compile the selected Header Profile for only
its permitted header fields. The local overlay SHALL remain transparent and
full-canvas; it shall not become an opaque panel, blank strip, crop, or local
body renderer. Reserved Header Region remains distinct from any provider-facing
avoidance instruction and does not prove provider compliance.

#### Scenario: A profile cannot grant local body ownership

- **WHEN** a Framed Header Profile contains body, callout, label, metric, or
  provider-instruction fields
- **THEN** Visual Config rejects it before it reaches an adapter
- **AND** no local body renderer or provider request is created
