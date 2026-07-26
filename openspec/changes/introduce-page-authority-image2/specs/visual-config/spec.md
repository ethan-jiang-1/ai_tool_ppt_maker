## ADDED Requirements

### Requirement: Page Authority visual language is a closed registry selection
Visual Config SHALL own the sole registry at
`2_backbone/visual-style/page-authority-visual-language.yaml`. It SHALL validate registered recipes,
compositions, motifs, compatibility, and authority eligibility, then compile only selected canonical
clauses. Version overrides, asset-manifest routing, CLI paths, generated copies, unregistered IDs, and
free provider prose SHALL be rejected.

#### Scenario: Selected registry facts have local invalidation
- **WHEN** a registry change affects only an unselected record
- **THEN** the unchanged slide's selected-language digest remains unchanged
- **AND** its raw image contract is not invalidated for that reason

### Requirement: Visual language and roles pass a deterministic no-text guard
Every provider clause and selected Agent role clause SHALL pass `page-authority-text-guard-v1`: printable
ASCII, lowercase, the fixed character grammar, and fixed forbidden token/pair lists. The guard digest
SHALL enter the selected-language projection. A Framed request SHALL require `no-readable-text` and
`no-labels`, and preflight SHALL reject a Text Frame literal in any provider field.

#### Scenario: Text-bearing registry instruction is rejected
- **WHEN** a clause includes a forbidden token, forbidden pair, quote, escape, or non-ASCII character
- **THEN** validation hard-stops before receipt compilation
- **AND** it reports the violated guard rule

### Requirement: Framed Text Frame has one deterministic preset
Visual Config SHALL resolve `standard-v1` to fixed canvas, capture dimensions, rectangles, theme/fonts,
opacity, and callout variants. It SHALL prove fit before provider authorization and reject slide-owned
CSS, geometry, fonts, or colors.

#### Scenario: Text overflow stops raw work
- **WHEN** resolved Frame text cannot fit `standard-v1`
- **THEN** preflight returns the frame repair action before provider authorization
- **AND** no underlay request is submitted

