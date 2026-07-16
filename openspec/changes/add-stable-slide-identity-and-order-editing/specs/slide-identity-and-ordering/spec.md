## ADDED Requirements

### Requirement: Slide identity is stable while position is derived

Every slide block SHALL have a non-empty `slide_id` that represents page identity independently of order. The slide block's physical order in the canonical `slide-specifications.md` SHALL be the order source of truth, and the system SHALL derive a 1-based `position` plus a zero-padded heading number from that order. Moving a slide, changing its title, or changing its render engine SHALL NOT change its `slide_id`. Renaming an ID SHALL be treated as an explicit identity migration rather than an ordinary content or order edit.

IDs SHALL be unique across the current deck and SHALL NOT be reassigned after deletion. Creation and insertion paths SHALL reserve every ID and spoken key found in the deck's version history. Existing unique legacy IDs, including IDs that contain an old page number, SHALL remain valid stable identities until an explicit migration; ordinary normalization, move, delete, or insert operations SHALL NOT silently rename them.

#### Scenario: Reordering preserves identity

- **WHEN** the slide at position 7 with ID `IDFix` is moved after the current position 3 slide
- **THEN** its derived position and heading number change
- **AND** its formal `slide_id` remains `IDFix`

#### Scenario: Deleted identity remains reserved

- **WHEN** a slide ID existed in an earlier deck version and the slide has since been deleted
- **THEN** a later insertion cannot reuse either that formal ID or its spoken key

#### Scenario: Legacy identity survives ordinary editing

- **WHEN** a legacy slide with ID `s07_problem` is moved to current position 11
- **THEN** the system displays position 11 separately from the legacy ID
- **AND** does not rename the ID to reflect the new position

### Requirement: New slide IDs are short spoken mnemonic pairs

The Agent or MD Controller SHALL name each newly authored slide from its durable narrative role as exactly two semantic blocks: `SUBJECT` (what the page concerns) followed by `MOVE` (what the page says or does about it). The formal ID SHALL contain only ASCII letters in BlockCase, target five letters, and permit six letters when preserving a recognizable word requires it. Each syntactic block SHALL contain 2–4 letters, and at least one block SHALL be word-like rather than an all-uppercase abbreviation. Valid canonical examples include `UXGap`, `AIFee`, `IDFix`, `PPTGo`, `AICost`, and `WebWin`.

Deterministic validation SHALL enforce the 5–6 letter budget, an unambiguous two-block parse, reserved selector words, current and historical uniqueness, spoken-key uniqueness, and configured near-confusion checks. It SHALL reject one-block category names, page-number/random suffixes, and unreadable compression when they are supplied through a new-ID authoring path. The validator SHALL report near spelling or pronunciation conflicts for renaming rather than silently correcting or randomizing an ID. Semantic word choice remains Agent-owned; JS SHALL NOT invent a mnemonic or truncate a normal word merely to reach five letters.

#### Scenario: Clear six-letter ID beats forced compression

- **WHEN** the Agent names an AI cost page and `AICost` preserves two recognizable blocks while a five-letter form would be `AICst`
- **THEN** the authoring path accepts `AICost`
- **AND** does not require or generate the unreadable compression

#### Scenario: Single category word is rejected for a new page

- **WHEN** a new insertion declares `PAIN` as its ID without a separate subject and move block
- **THEN** deterministic validation rejects the ID and asks the Agent for a two-block mnemonic

#### Scenario: Semantic naming is not delegated to JS

- **WHEN** a new slide block has no ID
- **THEN** the deterministic editor reports that an Agent-owned ID is required
- **AND** does not fill the field with a random token, page number, or title acronym

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

All framework paths that accept a slide selector SHALL use the same resolver. Resolution SHALL attempt, in order: exact current mnemonic ID, exact spoken key, explicit current position (`N` or `pN`), unique case-insensitive title fragment, then exact or supported-prefix legacy fallback. An unknown or ambiguous selector SHALL fail loudly and present bounded candidates as `position + slide_id + title`; approximate matches MAY be suggestions but SHALL NOT be applied automatically. Natural-language forms such as "page 7" or their Chinese equivalent SHALL be translated by the MD Controller into an explicit position token before deterministic resolution.

Every set of selectors in one requested transaction SHALL resolve against one pre-edit snapshot. Targets and anchors SHALL become formal IDs before any operation changes order, so later position selectors cannot shift because an earlier operation was applied.

#### Scenario: Position is resolved from the current snapshot

- **WHEN** position 3 is `UXGap`, position 7 is `AICost`, and one transaction requests deletion of positions 3 and 7
- **THEN** the planner resolves both IDs before deleting either slide
- **AND** deletes `UXGap` and `AICost`

#### Scenario: Ambiguous title fragment stops

- **WHEN** a title selector matches more than one slide
- **THEN** resolution fails and lists the matching position, ID, and title tuples
- **AND** no edit or approximate auto-selection occurs

#### Scenario: Legacy prefix remains a fallback

- **WHEN** selector `s03` uniquely identifies an existing legacy ID and no higher-precedence selector matches
- **THEN** the resolver returns that legacy formal ID

### Requirement: One structured slide document owns Markdown round trips

Stage 1 validation and structural editing SHALL consume one shared structured slide-document interface. It SHALL parse and retain leading frontmatter, preamble, ordered slide blocks, and epilogue. After the slide list starts, the first level-2 heading that is not a valid slide heading SHALL start the epilogue. Unchanged source regions and complete moved blocks SHALL preserve their original bytes except for heading-number projection and deterministic structured-reference updates.

The canonical run-directory editor SHALL operate on exactly one `slide-specifications.md`; it SHALL NOT create a second persistent order file. Stage 1's standalone multi-input mode SHALL remain supported, with local heading validation per input and global positions derived from input order followed by block order.

#### Scenario: Epilogue is not absorbed into the last slide

- **WHEN** a slide list is followed by `## Change Log` and its body
- **THEN** the document parser records that heading and body as epilogue
- **AND** moving the final slide does not move or rewrite the epilogue

#### Scenario: No-op round trip preserves bytes

- **WHEN** a parsed document is serialized without an edit
- **THEN** frontmatter, preamble, slide bodies, whitespace, and epilogue are byte-identical to the source

#### Scenario: Multiple standalone inputs keep local numbering

- **WHEN** Stage 1 receives two standalone source files whose slide headings each start at 1
- **THEN** each file is validated for its own continuous local numbering
- **AND** the merged plan positions increase globally in input and block order

### Requirement: Structural edits are previewed and committed as one transaction

Move, delete, insert, normalize, and multi-operation plans SHALL compile to a transaction containing a schema version, `base_spec_sha256`, formal-ID operations, `before_order`, `after_order`, and warnings. Planning SHALL validate selector resolution, operation conflicts, the final ID set, historical ID reservation, and continuous derived positions without writing source. Applying SHALL recompute the source hash and reject a stale base rather than rebasing or reinterpreting selectors.

The editor SHALL update deterministic structured references such as `render.header-lock` when a referenced slide is deleted or explicitly migrated. It SHALL NOT blindly rewrite page-number prose in slide bodies, block maps, or notes; it SHALL surface those occurrences as review warnings for the Agent.

#### Scenario: Preview and apply use the same resolved transaction

- **WHEN** a valid move transaction is previewed and the source does not change before apply
- **THEN** apply produces exactly the previewed `after_order`
- **AND** selectors are not resolved again against an intermediate order

#### Scenario: Source changed after preview

- **WHEN** the canonical source bytes change after a transaction is planned
- **THEN** apply rejects the transaction because `base_spec_sha256` is stale
- **AND** neither source version is partially rewritten

#### Scenario: Natural-language page reference needs review

- **WHEN** a moved or deleted slide leaves prose containing a phrase such as "see page 7"
- **THEN** the transaction emits a review warning with a source locator
- **AND** does not replace the prose by numeric string substitution

### Requirement: Structural apply preserves source versions and publishes an edit receipt

Applying move, delete, insert, or a structural multi-operation plan SHALL create a clean next run-bundle version through the existing version-creation authority, write and fully validate the transformed canonical source there, then publish it using a same-directory temporary file and atomic rename. The source version SHALL remain unchanged. A failed commit SHALL remove only an unpublished target created by that attempt and SHALL NOT leave a half-written source. `normalize --apply` SHALL be the only current-version exception and SHALL change only heading numbers through the same atomic-write discipline.

The success receipt SHALL identify the source and created version, base and resulting source hashes, resolved operations by formal ID, before and after order, heading normalization, structured-reference changes, review warnings, and the deterministic refresh impact. A persisted plan or receipt MAY live under `_scratch/`, but SHALL NOT become an order source of truth.

#### Scenario: Move apply creates vNext

- **WHEN** a user applies a valid move to canonical version `v2`
- **THEN** `v2` remains byte-identical
- **AND** a validated `v3` source contains the previewed order and normalized headings
- **AND** the receipt names both versions and the moved formal ID

#### Scenario: Normalize is identity-neutral

- **WHEN** only heading numbers disagree with physical order and `normalize --apply` runs
- **THEN** the current canonical source is atomically updated to continuous numbers
- **AND** block order, IDs, body bytes, and deck version remain unchanged

### Requirement: Render artifact identity excludes current position

The logical identity for an expensive rendered page SHALL be `(slide_id, render_engine, generation_fingerprint)`. Current position, heading number, human-readable prompt filename, and deck ordering SHALL NOT be part of that identity or generation fingerprint. Stage-owned manifests SHALL remain provenance authorities while a shared resolver exposes artifacts by stable ID, engine, and kind. Multiple engine variants for one slide MAY coexist without changing or overwriting the slide identity.

#### Scenario: Reorder does not change render identity

- **WHEN** a retained slide moves from position 8 to position 2 without content or render-profile changes
- **THEN** its logical render key and generation fingerprint remain unchanged

#### Scenario: Engine variant coexists

- **WHEN** one slide has both `image2` and future `html` artifacts
- **THEN** both artifacts resolve under the same formal slide ID with distinct engine keys
- **AND** switching the selected engine does not rename the slide
