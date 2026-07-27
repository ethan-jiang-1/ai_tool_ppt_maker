## ADDED Requirements

### Requirement: Page Authority visual language is a closed registry selection
Visual Config SHALL own the sole registry at
`2_backbone/visual-style/page-authority-visual-language.yaml`. It SHALL validate registered recipes,
compositions, motifs, compatibility, and authority eligibility, then compile only selected canonical
clauses. Version overrides, asset-manifest routing, CLI paths, generated copies, unregistered IDs, and
free provider prose SHALL be rejected.

The raw image contract's selected-language projection SHALL contain the schema, text-guard digest,
selected semantic digest, selected recipe/composition IDs and clause SHA-256 values, ordered selected
motif IDs and clause SHA-256 values, and selected identity subject class. Its selected semantic digest
SHALL cover only those selected clauses and their applicable compatibility/identity edges. A whole-file
digest and monotonic registry revision are audit facts only: whitespace, comments, mapping order,
revision-only changes, and unselected records SHALL not invalidate an unchanged slide's raw contract.

#### Scenario: Selected registry facts have local invalidation
- **WHEN** a registry change affects only an unselected record
- **THEN** the unchanged slide's selected-language digest remains unchanged
- **AND** its raw image contract is not invalidated for that reason

### Requirement: Visual language and roles pass a deterministic no-text guard
Every provider clause and selected Agent role clause SHALL pass `page-authority-text-guard-v1`. It SHALL
decode a nonempty printable-ASCII scalar (`U+0020` through `U+007E`), lowercase it with ASCII rules,
reject leading/trailing or repeated spaces, and accept only `[a-z0-9 ,;:()./-]`. It SHALL tokenize maximal
`[a-z0-9]+` runs and reject these exact tokens: `annotation`, `annotations`, `banner`, `banners`,
`callout`, `callouts`, `caption`, `captions`, `chart`, `charts`, `headline`, `headlines`, `label`,
`labels`, `legend`, `legends`, `letter`, `letters`, `logo`, `logos`, `placard`, `placards`, `poster`,
`posters`, `quote`, `quotes`, `readable`, `sign`, `signs`, `subtitle`, `subtitles`, `table`, `tables`,
`text`, `title`, `titles`, `typography`, `watermark`, `watermarks`, `word`, `words`, `write`, `writing`,
and `written`. It SHALL reject these adjacent token pairs: `speech bubble`, `thought bubble`,
`page number`, `source note`, `hand written`, `hand lettering`, `text label`, `diagram label`, and
`axis label`. The canonical guard identifier, normalization, character grammar, token list, and pair
list SHALL form the text-guard digest in the selected-language projection. A Framed request SHALL require
`no-readable-text` and `no-labels`, and preflight SHALL reject a Text Frame literal in any provider field.
Those two compiler-owned Framed constraints are closed protocol flags, not registry or role scalar
clauses and not an alternate free-prose ingress to the text guard.

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
