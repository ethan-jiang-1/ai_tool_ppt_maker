## MODIFIED Requirements

### Requirement: Page Image visual configuration separates visual direction from source content

Visual Config SHALL continue to resolve a closed visual-language selection for
both current Page Image Workflow policies. It SHALL compile only registered
visual direction, relationship, identity, and negative visual constraints; it
SHALL not become a second source of provider-rendered literals, a generic free
provider-prompt ingress, or a source copy rewriter.

The separately owned optional Page Design System source is a distinct prose
ingress outside the closed visual-language registry. Visual Config SHALL resolve
it as an opaque, confined, validated binding and SHALL not parse its Markdown,
front matter, variables, template expressions, or semantic content. It does not
change visual-language selection authority, add a registry record type, replace
canonical Page Source content, make `pure-deck-visual-system.yaml` a shared
registry, or grant a slide a free scene/composition prose slot.

The registry SHALL retain deterministic selected-record invalidation: recipes,
compositions, motifs, optional registered relationships, and their compatible
visual clauses are selected only by their registered IDs. An unselected registry
record SHALL not invalidate a page. The registry SHALL never use a workflow,
header policy, source literal, or Page Design System as a visual-selection
authority.

The visual-language registry SHALL NOT require `no-readable-text` or
`no-labels` as a Framed page constraint. A visual clause that attempts to
forbid all readable page text, transfer content authority to the provider, or
override the Provider Content Schema SHALL be rejected before raw planning.

#### Scenario: Current visual source resolves without a revision marker

- **WHEN** a current Visual Language source is selected
- **THEN** the resolver accepts its declared current fields without a numeric
  revision or format marker
- **AND** it does not infer another visual source shape

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

#### Scenario: Invalid visual source stays owner-rejected

- **WHEN** a selected Visual Language source carries an undeclared field or
  numeric generation marker
- **THEN** the visual owner returns its existing bounded source repair action
- **AND** it does not use a prior source, generate a replacement, or begin raw
  work

## ADDED Requirements

### Requirement: Page Design System source resolves as one confined optional binding

Visual Config SHALL inspect
`3_versions/vN/overrides/visual-style/page-design-system.md` with a
component-by-component `lstat` walk. It SHALL resolve the backbone
`2_backbone/visual-style/page-design-system.md` only when the override leaf is
genuinely absent behind ordinary non-symlink directories, including an absent
optional override branch. An existing symlink, non-directory, unreadable
component, or inspection error anywhere in the override branch is an invalid
selected override and SHALL hard-stop rather than look absent or select the
backbone. The selected source is opaque UTF-8 prose. A genuinely missing
override branch or leaf followed by a genuinely missing backbone leaf behind
the valid required backbone directory chain, a zero-byte selected regular file,
or a selected regular file containing only whitespace SHALL produce the
immutable binding `{ schema: "page-image-design-system-binding", text: null,
sha256: null }`.
Every selected regular file with nonzero raw bytes SHALL be at most 8,192 raw
bytes; this cap is enforced before UTF-8 decoding and therefore also rejects an
over-limit whitespace-only file. When the selected file has non-whitespace
content, the binding SHALL retain its exact UTF-8 text, including a leading
UTF-8 BOM when present, and lowercase SHA-256. The resolver binding schema is
local-only but SHALL be registered in a dedicated `layout-config` wire-schema
group with role `version-design-system-binding`, separate from the existing
`version-presentation-source` group; it is neither a shared durable contract
nor a derived publication. An adapter raw contract projects exactly
`{ text, sha256 }` from it and SHALL NOT copy the resolver schema into that
contract or a provider input.

An existing override is authoritative even when blank: a blank override SHALL
bind null and SHALL not inherit the backbone text. The resolver SHALL validate
the selected path and its existing ancestor chain before it reads or publishes
a binding. A missing required backbone ancestor is a hard-stop, while an absent
optional backbone leaf remains the null-compatible case above. Any selected
leaf or existing required ancestor that is a symlink (including a dangling
one), directory where a regular file is required, non-directory where a
directory is required, unreadable or otherwise uninspectable, escaping its
owner root, invalid UTF-8, or over the raw-byte limit is likewise a
non-bypassable source/configuration `hard-stop`. It SHALL not fall back to
backbone, a prior binding, a generated projection, or a default; it SHALL stop
before raw-plan publication, authorization, provider initialization, or
lifecycle mutation and return the direct source repair-and-rerun action.

The binding is a local deterministic source fact, not a provider-facing
representation. Only its exact text may later appear in an adapter-owned
provider input; physical path and selection origin remain local diagnostics and
SHALL NOT appear in provider input, authorization scope, provider transport,
or visual-language selection. Resolution neither makes a Style Master decision
nor proves provider pixel compliance.

The Node-default resolver is the only Page Design System resolver exposed by
the `02-visual-system` public entry. A narrow read-only filesystem factory MAY
be exported only from the resolver's internal module for focused negative
tests; neither that factory nor an injected filesystem dependency SHALL be
re-exported from the public entry, persisted, or reach adapter, runtime, or
provider code. A focused public-entry negative control SHALL prove that the
Page Design System public surface contains only its declared schema, byte-limit,
error, and Node-default resolver names.

#### Scenario: Backbone text binds exact opaque prose

- **WHEN** the override is absent and the backbone Page Design System contains
  valid non-whitespace UTF-8 text within 8,192 raw bytes
- **THEN** Visual Config returns that exact text and its lowercase SHA-256
  binding without interpreting Markdown syntax or stripping a leading UTF-8 BOM
- **AND** it does not treat the text as a visual-language registry clause,
  source literal, Style Master decision, or provider call

#### Scenario: An absent override branch still uses the valid backbone

- **WHEN** the current version has no `overrides/` branch at all and the
  canonical backbone Page Design System contains valid non-whitespace text
- **THEN** Visual Config resolves the exact backbone binding
- **AND** it does not require an empty override directory or create one

#### Scenario: A blank override suppresses backbone inheritance

- **WHEN** a valid regular override file exists but is zero-byte or contains
  only whitespace while the backbone source contains text
- **THEN** Visual Config returns the null binding from the override selection
- **AND** it does not read or inherit the backbone text

#### Scenario: The byte cap precedes blank canonicalization

- **WHEN** a selected Page Design System regular file contains 8,193 raw
  whitespace bytes
- **THEN** Visual Config hard-stops before it decodes or canonicalizes that
  file as null
- **AND** it does not use backbone, a prior binding, or a generated fallback

#### Scenario: A bad override never falls back

- **WHEN** an override leaf exists but is a symlink, directory, unreadable,
  escaping, invalid UTF-8, or larger than 8,192 raw bytes
- **THEN** Visual Config hard-stops with the direct source/configuration repair
  action before provider-free plan publication or provider work
- **AND** it does not read the backbone source, a historical binding, or a
  generated artifact as fallback

#### Scenario: A malformed override ancestor never looks absent

- **WHEN** `overrides` or `overrides/visual-style` exists as a symlink,
  dangling symlink, non-directory, unreadable directory, or escaping ancestor
  while the backbone source is valid
- **THEN** Visual Config hard-stops with the direct source/configuration repair
  action before provider-free plan publication or provider work
- **AND** it does not treat the missing leaf lookup as an absent override or
  read the valid backbone source as fallback

#### Scenario: A malformed selected backbone cannot look null

- **WHEN** the override leaf is genuinely absent but required `2_backbone` or
  its required `visual-style` ancestor is absent, a symlink, dangling symlink,
  non-directory, unreadable directory, or escaping ancestor
- **THEN** Visual Config hard-stops with the direct source/configuration repair
  action before provider-free plan publication or provider work
- **AND** it does not return a null binding, use prior/generated data, or create
  a replacement source

#### Scenario: Missing optional source leaves stay null-compatible

- **WHEN** neither canonical Page Design System leaf exists, the optional
  override branch is absent or ordinary, and the required backbone directory
  chain is present and ordinary
- **THEN** Visual Config returns the null binding
- **AND** it does not synthesize deck-specific example prose, create state, or
  treat a missing optional source as a provider-work failure
