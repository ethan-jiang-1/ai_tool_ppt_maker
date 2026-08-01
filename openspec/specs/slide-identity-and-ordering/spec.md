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

#### Scenario: Reordering preserves identity
- **WHEN** the slide at position 7 with ID `IDFix` is moved after the current position 3 slide
- **THEN** its derived position and heading number change
- **AND** its formal `slide_id` remains `IDFix`

#### Scenario: Retained historical ID does not select a route
- **WHEN** a current explicit source contains retained ID `s07_problem`
- **THEN** the resolver treats it as that formal identity while position is derived separately
- **AND** it does not infer a retired mode, alternate Controller, or historical state protocol

### Requirement: New slide IDs are short spoken mnemonic pairs
The Agent or MD Controller SHALL name each newly authored slide from its durable narrative role as
exactly two semantic blocks: `SUBJECT` followed by `MOVE`. The formal ID SHALL contain only ASCII
letters in BlockCase and contain 5–8 letters total; five or six are preferred, while seven or eight are
allowed when materially clearer. Each block SHALL contain 2–4 letters and at least one SHALL use
TitleCase so the boundary remains parseable. JS SHALL validate syntax, uniqueness, spoken-key
uniqueness, reserved words, and configured near-confusion checks, but semantic naming remains
Agent-owned.

Newly initialized sources SHALL declare `identity.scheme: mnemonic-v1`; that assertion means every
current ID in the file has mnemonic syntax. A source that contains retained historical-format IDs may
omit that assertion while it remains otherwise current and explicitly marked for its production
pipeline. Every newly inserted ID still SHALL satisfy mnemonic validation. The absence or presence of
`identity.scheme` is never a production-mode, migration, or Controller-routing signal.

#### Scenario: New ID is mnemonic and Agent-owned
- **WHEN** a new insertion has no ID or supplies a non-mnemonic ID
- **THEN** deterministic validation asks the Agent for a valid two-block mnemonic
- **AND** it does not generate, truncate, or infer one from a page number or title

#### Scenario: Retained historical ID does not taint a current source
- **WHEN** a current explicitly marked source retains `s07_problem` and inserts `UXGap`
- **THEN** `UXGap` must pass mnemonic validation while `s07_problem` remains reserved/readable
- **AND** the source does not enter a historical pipeline or state route

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
All framework paths that accept a slide selector SHALL use the same resolver. Resolution SHALL attempt,
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

Page Authority source validation and structural editing SHALL consume one shared
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

### Requirement: TARGET structural plans bind one workflow without inheriting acceptance

For a target structural preview, the canonical plan SHALL bind the target v2
workflow, source receipt identity, stable slide IDs, order, and exact plan hash.
Every target slide SHALL inherit the one bound workflow; insert, delete, and
reorder operations SHALL NOT add a per-slide workflow override. A whole-version
workflow change SHALL publish only through a confirmed Structural Versioning
Path to vNext.

When the target version is absent, apply SHALL revalidate the selected workflow
and every declared source tuple before publication, make zero provider calls,
and publish only target-owned unreviewed provenance or `needs_raw_generation`
debt. It SHALL NOT copy raw review, final PNGs, final manifests, PPTX, notes,
delivery decisions, provider authorization, or a Style Master acceptance into
the target.

When the exact plan's target is already visible, the existing structural
preview/apply and persisted `slides apply-plan` recovery path SHALL allow only
an exact no-publish replay. Before returning that replay, the owner SHALL
revalidate the unchanged source-side plan precondition, exact target source
bytes, parsed target receipt, bound target workflow/source-epoch evidence
identity, and any present Style Master map through its state owner. It SHALL
recognize that replay before the normal target-absent / next-version and
source-active-execution checks. Later target-owned evidence MAY be nonempty,
but it SHALL remain structurally valid and bound to that same target tuple.
Replay SHALL NOT stage,
rename, recreate, or overwrite the target version; write its source,
overrides, generated artifacts, compatibility payload, or selection; invoke a
provider; or reset an active target Controller execution. A target source,
receipt, workflow/mode/evidence, selection-map, or plan mismatch SHALL be a
non-writing hard-stop requiring a fresh preview rather than a target overwrite.

#### Scenario: Target reorder preserves workflow and stable identity

- **WHEN** a confirmed target Pure structural plan reorders a retained slide
- **THEN** the target preserves that slide's stable ID and binds it to workflow `pure` at its new position
- **AND** the target has no inherited final or delivery acceptance

#### Scenario: Per-slide target workflow override fails preview

- **WHEN** a target structural candidate declares a slide-level Framed or Pure workflow different from the version workflow
- **THEN** preview rejects the candidate before an exact plan hash is issued
- **AND** it does not materialize source evidence or call a provider

#### Scenario: Persisted exact target plan replays without resetting target work

- **WHEN** a persisted confirmed structural plan is reapplied after its target has started `create-deck` and acquired a valid target-owned Style Master selection
- **THEN** the structural owner exact-matches the existing target and returns a no-publish replay
- **AND** it leaves the target source, selection record, active Controller execution, compatibility payload, and version tree unchanged while making zero provider calls

#### Scenario: Existing target drift cannot be overwritten by replay

- **WHEN** a persisted structural plan names a visible target whose source bytes, receipt, workflow/source-epoch evidence identity, or Style Master map no longer matches its exact bound facts
- **THEN** replay hard-stops before source or state mutation and requests a fresh structural preview
- **AND** it does not reset target execution, replace the target, or infer selection from the compatibility payload
