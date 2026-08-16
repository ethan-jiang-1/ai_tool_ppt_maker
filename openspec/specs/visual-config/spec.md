## Purpose

Define the Page Image Workflow visual-language registry and fixed Framed Header Rendering Policy
inputs. The registry is the current source of visual selection and frame data.

## Requirements

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

### Requirement: Page Image presentation is a closed version-resolved package

Visual Config SHALL resolve the version's Page Image presentation only from the
normal override-first/backbone-default source locations for these four files
under `visual-style/page-image-presentation/`: `page-class-catalog.yaml`,
`deck-defaults.yaml`, `pure-deck-visual-system.yaml`, and
`framed-header-profiles.yaml`. The four files form one closed package: the
catalog owns only the closed class set, default `standard`, and class-to-profile
identifiers; deck defaults own only workflow-neutral typography, colour roles,
and density; the other two files own only their respective workflow facts.

Each document SHALL declare one current unversioned source contract:
`pptmaker-page-image-class-catalog`, `pptmaker-page-image-deck-defaults`,
`pptmaker-pure-deck-visual-system`, or `pptmaker-framed-header-profiles`.
Those contracts belong to `layout-config`, not the visual-language registry;
they SHALL not use a revision/version marker or an undeclared schema value.

The resolver SHALL validate the full package before publishing a projection. It
SHALL require every catalog class to bind exactly one selected profile for each
current workflow and SHALL reject a missing, malformed, unknown,
cross-file-inconsistent, or cross-workflow fact before raw planning. It SHALL
not synthesize a profile, borrow a generated projection, use a previous plan,
or turn the Pure visual-system file into a shared registry.

#### Scenario: A complete package resolves both workflow bindings

- **WHEN** all four version-resolved source files have matching closed class and
  profile identifiers
- **THEN** Visual Config validates one complete package before dependent planning
- **AND** it retains separate Pure and Framed bindings for each class

#### Scenario: A package document has no current contract marker

- **WHEN** a selected package document omits, changes, or versions its declared schema contract
- **THEN** Visual Config reports the bounded source/configuration repair action
- **AND** it does not adopt a previous source shape or publish a projection

#### Scenario: A cross-file binding error stops at direct source

- **WHEN** a catalog class names a profile absent from its workflow-specific file
- **THEN** Visual Config reports the bounded source/configuration repair action
- **AND** it does not publish a projection, use an older generated value, or create lifecycle evidence

### Requirement: Page Class resolution publishes one isolated projection with provenance

For every normalized Page Source class and selected version workflow, Visual
Config SHALL resolve exactly one workflow-specific presentation projection. The
projection SHALL identify the normalized class, selected profile identifier,
and the deck-default or selected-profile origin of every inherited value. It
SHALL not merge a second class, accept a per-page geometry override, or expose
Pure zones or provider-facing facts to Framed callers; it SHALL not expose
Framed header geometry, local typography, or protected regions to Pure callers.

The resolved projection is the deterministic input to the current owners. At
the exact provider-free `image2 plan` publication checkpoint, it SHALL be
serializable once as that page's derived `page-layout`, preserving the selected
workflow, binding digest, and value-level provenance. The published layout is
not an input to resolution or adapter compilation, and SHALL not become a
source replacement, provider result, review decision, approval, or parallel
state record. A missing or invalid projection prevents the dependent plan
publication; it SHALL not be replaced with a prior generated layout.

#### Scenario: A special class resolves one Framed treatment

- **WHEN** a Framed page with `PAGE CLASS: opening` reaches Visual Config
- **THEN** it receives exactly the catalog-bound Framed profile and provenance
  for its inherited values
- **AND** it does not receive a Pure profile or an undeclared one-off treatment

#### Scenario: A Pure projection cannot inherit Framed facts

- **WHEN** a Pure page resolves a valid class
- **THEN** its projection contains only the catalog binding, workflow-neutral
  defaults, and selected Pure facts
- **AND** a Framed header region or local-header setting is rejected rather than copied into it

#### Scenario: Publication preserves a Framed projection without making it authority

- **WHEN** a Framed page's valid selected projection is published at `image2 plan`
- **THEN** its `page-layout` identifies only that page's selected profile,
  workflow-isolated facts, binding digest, and value provenance
- **AND** later compilation continues from the resolver rather than reading the
  published file

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
- **AND** neither a slide nor a prior derived publication can substitute either
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

### Requirement: Pure deck visual system is a closed version-resolved source contract

For a current Pure Page Image Workflow run, Visual Config SHALL resolve
`pure-deck-visual-system.yaml` only from the version-resolved Page Image
presentation package using the canonical `runDir` supplied by the target
runtime. The record SHALL remain Pure-only and have a closed canonical shape
for class-addressable provider-facing typography hierarchy,
Style-Master-derived colour use, normalized page zones, whitespace rule, and
allowed layout families. It SHALL be content-neutral: it SHALL not carry slide
literals, claims, credentials, Framed-header facts, provider prompts, provider
output, review decision, or lifecycle state.

Visual Config SHALL expose only the validated immutable selected class
projection and its canonical binding to Pure callers. Framed SHALL not read,
inherit, or treat the Pure visual-system record or digest as a local-header
profile, protected composition, or provider constraint.

#### Scenario: A current Pure source resolves one deck system

- **WHEN** a current Pure source page reaches planning with a valid
  version-resolved presentation package
- **THEN** Visual Config returns the one catalog-bound Pure projection for that page
- **AND** it does not use an unselected class profile as input

#### Scenario: Framed remains independent of the Pure system

- **WHEN** a current Framed source is prepared beside a valid Pure visual-system record
- **THEN** Framed retains its visual-language and resolved Header Rendering
  Policy inputs without the Pure record or digest
- **AND** it does not derive a local profile, Reserved Header Region, or input
  digest from that record

### Requirement: Invalid Pure visual-system source stops before dependent work

Visual Config SHALL reject a missing, malformed, escaping, or unsupported Pure visual-system
source record before it publishes dependent Pure raw facts, authorizes provider work, or treats a
profile as current. The failure SHALL preserve source and existing evidence, identify the
source/configuration repair-and-rerun action, and SHALL not synthesize a default profile, read a
prior generated artifact, or create State, grant, review, or waiver data.

#### Scenario: A legacy Pure run lacks the required source record

- **WHEN** a current Pure run has no valid version-resolved visual-system source record
- **THEN** planning stops at the source/configuration failure before raw-plan or provider work
- **AND** it does not silently adopt a default, Style Master image, Framed profile, or historical
  generated evidence

#### Scenario: An unselected source change does not affect the Pure contract

- **WHEN** a visual-style file outside the selected Pure visual-system source changes
- **THEN** Visual Config retains the current Pure visual-system projection and digest
- **AND** it does not claim profile drift from that unselected file

### Requirement: Framed guidance distinguishes local header space from provider avoidance

Active Framed guidance SHALL call the local-header-renderer-owned spatial area
the Reserved Header Region and call the provider-facing derived composition
instruction the Provider Avoidance Constraint. It SHALL state that the latter
does not prove provider compliance or create a blank band. Serialized and
implementation identifiers such as `header_region`, `protected_composition`,
`reserved_header`, and `body_safe` remain their existing exact contracts and
are not renamed by terminology guidance.

#### Scenario: An Agent explains Framed composition

- **WHEN** an Agent reads active Framed composition guidance
- **THEN** it can distinguish local header ownership from the provider-facing
  avoidance instruction and the existing review boundary
- **AND** it does not infer an alternate serialized geometry shape or a second
  local renderer

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

### Requirement: Visual Language failures carry owner-issued bounded facts

A Visual Language source failure SHALL emit its facts through the
problem-fact contract owned by `diagnostic-facts`: the registered reason
code, the Visual Language owner, the physical source locator when known, the
logical registry path of the offending record/field, and bounded
`actual`/`expected` values that never include a complete visual clause.
Registry-level structural validity — YAML parseability, declared contract,
record shape, and schema conformance — SHALL remain a whole-source property:
a structurally invalid record anywhere in the selected registry is a
registry-level source defect naming the exact record, and the registry SHALL
not be trusted as a closed source until it repairs.

The registered sentence "an unselected registry record SHALL not invalidate
a page" SHALL govern record content semantics: clause content-authority and
forbidden-token evaluation apply only to records selected by a page. An
unselected record whose clause violates content-authority rules SHALL NOT
block the page; a selected record with such a violation SHALL fail as the
selection-isolated defect of that record and its selecting pages. This
paragraph is the normative adjudication of selected-record invalidation; the
resolver SHALL NOT keep whole-registry semantic validation as the de facto
rule.

#### Scenario: An unselected invalid clause does not block the page

- **WHEN** a registry contains an unselected recipe whose provider clause
  contains a forbidden token while the selected recipe is valid
- **THEN** the page resolves with its selected recipe
- **AND** no registry-level diagnostic is emitted for the unselected record

#### Scenario: A selected invalid clause fails as a selection defect

- **WHEN** the page selects a recipe whose provider clause contains a
  forbidden token
- **THEN** resolution fails with the Visual Language owner, the exact record
  logical path, and a bounded reason
- **AND** it does not blame the page source field or the operation owner

#### Scenario: A structurally invalid record is a registry-level defect

- **WHEN** any record in the selected registry is schema-invalid or
  unparseable
- **THEN** resolution fails as a registry-level source defect naming that
  record
- **AND** it does not treat the record as selection-isolated or infer a
  replacement

### Requirement: Presentation package failures name the exact broken source

The four-file presentation package remains one closed package whose
full-package validation precedes projection, including rejection of a
malformed Pure sibling for a Framed run. A package-load failure SHALL name
the exact broken package file (physical source) and a bounded reason, and
SHALL NOT be relocated to `slide-specifications.md` or the operation owner.
A per-slide presentation projection failure SHALL retain its presentation
reason code and SHALL locate the repair owner: a header-field conflict names
the Page Source header/class field, while a source/package defect names the
presentation package file.

#### Scenario: A missing workflow file names the package source

- **WHEN** `pure-deck-visual-system.yaml` is missing from the selected
  presentation package
- **THEN** the failure names that exact package source with a bounded reason
- **AND** it does not point at `slide-specifications.md` or `VISUAL BRIEF`

#### Scenario: A forbidden header field names the source field

- **WHEN** a Framed opening profile rejects a non-null `SUBTITLE`
- **THEN** the failure names the Page Source `SUBTITLE`/`PAGE CLASS` repair
- **AND** it does not relocate the defect to `VISUAL BRIEF`

### Requirement: Source diagnostic precedence is deterministic

When more than one source failure is present, the diagnostic SHALL prefer
the earliest independent failure under this fixed order: (1) whole-source
structural validation of the selected Visual Language registry and the
selected presentation package, (2) Page Source field-level parse failures in
source order, (3) per-slide selection failures in the resolution order
identity reference, visual-language selection, presentation projection. The
precedence SHALL NOT change the root owner/reason/locator of the selected
failure, and secondary independent failures MAY be reported as bounded
issues.

#### Scenario: Registry and page field failures coexist

- **WHEN** a structurally invalid registry and a Page Source field error are
  both present
- **THEN** the diagnostic names the registry-level root cause first
- **AND** the Page Source field fact may appear as a bounded secondary issue
