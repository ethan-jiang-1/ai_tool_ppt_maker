# slide-identity-and-ordering Specification

## Purpose
TBD - created by archiving change add-stable-slide-identity-and-order-editing. Update Purpose after archive.
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

### Requirement: Structural plans bind one replacement Page Image Workflow without acceptance inheritance

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
the file has mnemonic syntax. The identity scheme is never a production-mode,
migration, or Controller-routing signal.

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
