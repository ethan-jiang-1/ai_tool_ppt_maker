# slide-identity-and-ordering Specification

## Purpose
Define current slide identity, selectors, ordering projections, and exact
structural publication for Page Image source without treating a position or
filename projection as a second identity or workflow route.
## Requirements
### Requirement: Slide identity is stable while position is derived
Every slide block SHALL have a non-empty `slide_id` that represents page identity independently of
order. The canonical `slide-specifications.md` physical order is the order source of truth, and the
system SHALL derive a one-based `position` plus zero-padded heading number from it. Moving a slide,
changing its title, or changing its renderer SHALL not change its `slide_id`; an intentional identity
replacement is a separately reviewed source edit, not an ordinary content or order operation.

IDs SHALL be unique across the current deck and remain reserved after deletion. Creation and insertion
shall reserve IDs and spoken keys found in version history. A pre-existing historical-format ID, such as
`s07_problem`, remains a readable/reserved formal identity when the containing source otherwise has a
supported current pipeline/state protocol. It is an identity exception only: it SHALL not select a
pipeline, Controller, renderer, source marker, or state-repair path, and structural editing SHALL not
rename it merely because its embedded page number is no longer current.

Human-facing artifact labels, per-page image filenames, and PPTX page footers
MAY project the current derived `position`, but SHALL keep the stable
`slide_id` intact and SHALL treat the ordinal as a replaceable presentation
projection. Raw contracts, provider authorization, CAS/attempt/provenance
records, receipts, and cross-version selectors SHALL NOT use an ordinal prefix
as their identity or addressing key.

#### Scenario: Reordering preserves identity
- **WHEN** the slide at position 7 with ID `IDFix` is moved after the current position 3 slide
- **THEN** its derived position and heading number change
- **AND** its formal `slide_id` remains `IDFix`

#### Scenario: Retained historical ID does not select a route
- **WHEN** a current explicit source contains retained ID `s07_problem`
- **THEN** the resolver treats it as that formal identity while position is derived separately
- **AND** it does not infer a retired mode, alternate Controller, or historical state protocol

#### Scenario: Human-facing ordinal changes without identity replacement
- **WHEN** a structural version moves `DeckGo` from position 1 to position 10
- **THEN** its derived image filename and PPTX footer project `10` while
  retaining `DeckGo` as the stable identity
- **AND** no raw contract, authorization, provenance record, receipt, or
  selector is renamed to `10_DeckGo`

### Requirement: Spoken keys resolve voice-friendly ID variants

The system SHALL derive a `spoken_key` by removing a leading `@`, spaces, and hyphens from an ID-shaped selector and lowercasing the result. Formal IDs SHALL remain unchanged in Markdown, plans, manifests, receipts, and logs. Formal and legacy identities across deck history SHALL reserve their normalized spoken keys, and two slides SHALL NOT differ only by case, spaces, hyphens, or the optional `@` input marker.

#### Scenario: Voice and typed variants select the same page

- **WHEN** selectors `UX gap`, `UXGap`, `uxgap`, `ux-gap`, and `@UXGap` are resolved in a deck containing formal ID `UXGap`
- **THEN** every selector resolves to the formal ID `UXGap`

#### Scenario: Spoken-key collision fails

- **WHEN** a new ID normalizes to a spoken key already reserved by a current or historical slide
- **THEN** creation fails with both conflicting formal IDs identified
- **AND** the system does not choose one by case or current position

### Requirement: Slide selectors have one shared deterministic resolution contract
All Harness paths that accept a slide selector SHALL use the same resolver. Resolution SHALL attempt,
in order: exact current formal ID, exact spoken key, explicit current position (`N` or `pN`), unique
case-insensitive title fragment, then a retained-historical-ID prefix only when it uniquely resolves an
existing formal ID. An unknown or ambiguous selector SHALL fail loudly with bounded
`position + slide_id + title` candidates. Natural-language page references SHALL be translated by the
MD Controller into an explicit position token before deterministic resolution.

The resolver SHALL return an ordered binding per input token with original token, formal `slide_id`,
current `position`, and `matched_by`. It SHALL preserve duplicate tokens and resolve every set against
one pre-edit snapshot. Historical-ID resolution is identity-only; it SHALL not infer a source marker,
mode, Controller, artifact provenance, or migration authority.

#### Scenario: Retained historical prefix is identity-only
- **WHEN** selector `s03` uniquely identifies an existing formal ID and no higher-precedence selector matches
- **THEN** the resolver returns that formal ID with the retained-ID branch
- **AND** it does not select a production pipeline or resume path

#### Scenario: Ambiguous selector stops
- **WHEN** a selector matches more than one current formal/spoken/title candidate
- **THEN** resolution fails with bounded candidates
- **AND** no edit, route selection, or approximate auto-selection occurs

### Requirement: One structured slide document owns Markdown round trips

Page Image Workflow source validation and structural editing SHALL consume one shared
structured slide-document interface. It SHALL parse and retain leading frontmatter,
preamble, ordered slide blocks, and epilogue. After the slide list starts, the first
ordinary level-2 heading that is not a slide heading SHALL start the epilogue. A
level-2 heading that begins with the reserved slide-heading prefix but is malformed
SHALL be a blocking parse error rather than an epilogue boundary. Unchanged source
regions and complete moved blocks SHALL preserve their original bytes except for
heading-number projection, the explicit identity marker when required, and
deterministic structured-reference updates.

The canonical run-directory editor SHALL operate on exactly one
`slide-specifications.md`; it SHALL NOT create a second persistent order file. The
shared source parser's standalone multi-input mode SHALL remain supported, with local
heading validation per input and global positions derived from input order followed by
block order.

#### Scenario: Epilogue is not absorbed into the last slide

- **WHEN** a slide list is followed by `## Change Log` and its body
- **THEN** the document parser records that heading and body as epilogue
- **AND** moving the final slide does not move or rewrite the epilogue

#### Scenario: Malformed slide-like heading fails

- **WHEN** a slide list contains a level-2 heading such as `## Slide seven UXGap` that begins like a slide but does not match canonical grammar
- **THEN** parsing fails with the heading location and expected grammar
- **AND** the malformed heading is not silently treated as epilogue

#### Scenario: No-op round trip preserves bytes

- **WHEN** a parsed document is serialized without an edit
- **THEN** frontmatter, preamble, slide bodies, whitespace, and epilogue are byte-identical to the source

#### Scenario: Multiple standalone inputs keep local numbering

- **WHEN** the shared source parser receives two standalone source files whose slide headings each start at 1
- **THEN** each file is validated for its own continuous local numbering
- **AND** the merged plan positions increase globally in input and block order

#### Scenario: A structural transaction is inspected

- **WHEN** a maintainer inspects a current structural plan or result
- **THEN** its schema and field names use declared current shapes without a
  numeric document revision
- **AND** the result does not imply a reader, writer, or workflow path for a
  prior document generation

### Requirement: Structural plans bind one declared current Page Image Workflow without acceptance inheritance

Structural preview and exact-plan apply SHALL bind the target version to one
explicit `framed` or `pure` `page-image-workflow` selection. A workflow change,
mixed policy, `hybrid` value, or per-slide authority override remains structural
work and SHALL not mutate an existing version in place. Apply retains the
existing clean-target/no-acceptance-inheritance behavior without emitting or
accepting an alternate historical pipeline marker.

#### Scenario: A structural plan selects one current workflow

- **WHEN** an exact structural plan creates a target version
- **THEN** it binds one declared current `framed` or `pure` workflow
- **AND** it does not reuse source, state, raw, or review evidence from another
  contract

#### Scenario: A workflow switch creates a clean target

- **WHEN** a structural plan changes a current version between Framed and Pure
- **THEN** it creates the existing clean target with fresh current evidence
- **AND** it does not inherit old source or review acceptance

#### Scenario: Per-slide workflow policy is rejected before apply

- **WHEN** a structural plan contains a slide-specific workflow override
- **THEN** preview retains the existing source/structural repair result
- **AND** apply creates no target or provider work

### Requirement: New slide IDs use the current spoken mnemonic identity

The Agent or MD Controller SHALL name each newly authored slide from its
durable narrative role as exactly two semantic BlockCase blocks under the
existing mnemonic syntax, uniqueness, spoken-key, reserved-word, and
near-confusion rules. Newly initialized sources SHALL declare the current
unversioned `identity.scheme: mnemonic`; its presence means every current ID in
the file has mnemonic syntax. The identity scheme is never a production
workflow, migration, or Controller-routing signal.

#### Scenario: A new source has current mnemonic identity

- **WHEN** a new source is initialized with mnemonic slide IDs
- **THEN** it declares `identity.scheme: mnemonic` and validates the existing
  two-block rules
- **AND** it does not write a version-suffixed identity marker

#### Scenario: New ID is mnemonic and Agent-owned

- **WHEN** an insertion has no valid mnemonic ID
- **THEN** deterministic validation retains the existing request for one Agent-owned mnemonic
- **AND** it does not synthesize a historical identity form

#### Scenario: An undeclared ID is rejected before receipt creation

- **WHEN** a current source contains an ID outside the mnemonic syntax
- **THEN** source validation rejects it before creating a receipt
- **AND** it does not retain, rewrite, or route the ID through another identity scheme

### Requirement: Page-plan publication reuses exact structural source protections
When a confirmed narrative page plan creates, inserts, deletes, or reorders
canonical page source, its publication SHALL use the existing structural
preview and exact-plan path. The plan SHALL bind its Agent-authored
page-grouping candidate bytes and confined scratch-relative locator, Story
Outline, Design Constraints, Visual Language registry, source-byte, target-workflow,
target-version, and ordered slide identity facts before publication.

Publication SHALL revalidate those bindings and the current source grammar
before it creates a target source. Any stale input, changed source, invalid
mnemonic identity, target conflict, or plan-hash mismatch SHALL hard-stop before
source, state, derived-artifact, or provider mutation. A successful publication
creates no provider call and records `needs_render` only through the existing
render-debt path.

After source publication, it SHALL invoke the existing Page Image source-state
owner with the plan's validated source receipt. That owner records the current
source-bound evidence; publication reports existing render debt for every target
slide. Source publication SHALL not introduce another State shape, receipt store, or evidence
record. If the initial in-place source write completed but that State binding
did not, retrying the same exact plan MAY finish only that binding when the
current source exactly matches the plan's target bytes and no target-evidence
record exists. Any other source or State combination SHALL hard-stop before
mutation.

The initialized `v1` page-source draft MAY be materialized in place only when
its canonical bytes still match the exact current deck-type initial seed and no
source receipt, source-bound Page Image target-evidence record, derived
artifact, provider record, review, final, or delivery fact exists. The generic
Controller State and a selected pre-source workflow do not satisfy or defeat
this source-evidence absence test. Every other version SHALL use the existing
clean vNext structural publication path. The initial-draft exception uses the
same source-byte and exact-plan checks; it is not a general in-place structural
edit path.

An owner-issued unproduced-v1 reset that restored that exact seed and cleared
rebuildable local v1 evidence SHALL make the same initial-draft exception
available again. It SHALL NOT create a general in-place edit path for non-seed
source, SHALL NOT apply when irreversible provider or delivery records exist,
and SHALL NOT replace the confirmed paginate exact-plan publication that
follows the reset.

#### Scenario: Confirmed page plan creates a clean source target
- **WHEN** an exact confirmed narrative page plan has current matching inputs and target
  bindings
- **THEN** publication creates the canonical target `slide-specifications.md`
  with valid current mnemonic identities and ordered source blocks
- **AND** it retains existing clean-target behavior with no raw, review, final,
  or delivery acceptance inheritance

#### Scenario: An untouched initial draft receives its first page source
- **WHEN** the exact plan binds the exact current `v1` deck-type seed and the
  initial draft has no source receipt, source-bound target-evidence record,
  derived artifact, provider, review, final, or delivery fact
- **THEN** publication may materialize the first canonical page source in that
  draft with the same exact-plan checks, current source-State binding, and zero
  provider calls
- **AND** a later structural publication cannot use this initial-draft path
  unless an owner-issued unproduced-v1 reset has restored that seed and cleared
  rebuildable local v1 evidence

#### Scenario: Owner reset restores the initial-draft publication path
- **WHEN** unique v1 has already received its first page source and source-bound
  evidence, has no irreversible provider or delivery record, and the owner reset
  has restored the exact current deck-type seed
- **THEN** a later confirmed page plan MAY materialize in that same v1 with the
  same exact-plan checks and zero provider calls
- **AND** the same command SHALL refuse and keep every byte when any
  irreversible record exists, leaving publication on the existing vNext path

#### Scenario: Initial State binding is interrupted after source publication
- **WHEN** an initial exact apply has already written its exact target source
  but has not created its source-bound target-evidence record
- **THEN** retrying that same exact plan may finish only the existing State
  binding and return its ordinary render debt with zero provider calls
- **AND** any different source bytes, target evidence, or plan hard-stops rather
  than treating the current version as a fresh draft

#### Scenario: A page-plan input drifts before apply
- **WHEN** a Story Outline, Design Constraints, Visual Language registry, page-grouping
  candidate locator or bytes, source byte, target version, or plan hash differs
  from the previewed binding
- **THEN** publication stops before creating or mutating a target
- **AND** it returns the nearest action to regenerate and confirm the current
  plan rather than falling back to a prior source or plan

### Requirement: Identity guidance distinguishes formal fields from filename projections

Active identity guidance SHALL distinguish the stable formal `slide_id` field
from its position-prefixed `NN_slideID` filename projection. The projection
preserves the exact formal identity literal while `NN` reflects only current
position; casing in the filename label SHALL not be described as a second
identity field, selector, or schema conversion.

#### Scenario: A maintainer reads page artifact naming guidance

- **WHEN** a maintainer compares source identity with a final page filename
- **THEN** it can identify `slide_id` as the stable cross-version identity and
  `NN_slideID` as its current-position filename projection
- **AND** it does not infer a rename, identity migration, or alternate selector
  contract
