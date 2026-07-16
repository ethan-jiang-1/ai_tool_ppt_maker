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

The Agent or MD Controller SHALL name each newly authored slide from its durable narrative role as exactly two semantic blocks: `SUBJECT` (what the page concerns) followed by `MOVE` (what the page says or does about it). The formal ID SHALL contain only ASCII letters in BlockCase and SHALL contain 5–8 letters total. Five or six letters SHALL be the authoring preference; seven or eight SHALL be used only when they preserve materially clearer speech or meaning. Each syntactic block SHALL contain 2–4 letters, and at least one block SHALL use TitleCase form so the two-block boundary remains parseable. Valid canonical examples include `UXGap`, `AIFee`, `IDFix`, `PPTGo`, `AICost`, and `WebWin`.

Deterministic validation SHALL enforce ASCII-only syntax, the 5–8 letter range, an unambiguous two-block BlockCase parse, reserved selector words, current and historical uniqueness, spoken-key uniqueness, and configured near-confusion checks. It SHALL reject digits, separators in the formal ID, one-block syntax, and conflicting IDs when they are supplied through a new-ID authoring path. The validator SHALL report near spelling or pronunciation conflicts for renaming rather than silently correcting or randomizing an ID. Semantic quality, including whether the blocks genuinely form `SUBJECT + MOVE`, whether a one-word category has merely been disguised as two blocks, and whether a compression is pronounceable, remains Agent-owned; JS SHALL NOT claim to prove those properties, invent a mnemonic, or truncate a normal word merely to reach five letters.

Newly initialized or newly authored mnemonic-native deck sources SHALL declare `identity.scheme: mnemonic-v1` in leading frontmatter. Stage 1 SHALL use that marker as an assertion that every current ID in the file satisfies the mnemonic syntax. A source without the marker SHALL remain readable as a legacy deck; nevertheless, every ID introduced through an explicit insertion or new-ID path SHALL pass mnemonic validation. A target that still contains retained legacy IDs SHALL remain markerless until a separate explicit identity migration makes the assertion true.

#### Scenario: Clear six-letter ID beats forced compression

- **WHEN** the Agent names an AI cost page and `AICost` preserves two recognizable blocks while a five-letter form would be `AICst`
- **THEN** the authoring path accepts `AICost`
- **AND** does not require or generate the unreadable compression

#### Scenario: Clear longer mnemonic remains legal

- **WHEN** a two-block mnemonic needs seven or eight ASCII letters to remain readily spoken and semantically distinct
- **THEN** deterministic syntax validation accepts it
- **AND** authoring guidance still prefers a clear five- or six-letter alternative when one exists

#### Scenario: Single category word is rejected for a new page

- **WHEN** a new insertion declares `PAIN` as its ID without a separate subject and move block
- **THEN** deterministic validation rejects the ID and asks the Agent for a two-block mnemonic

#### Scenario: Semantic naming is not delegated to JS

- **WHEN** a new slide block has no ID
- **THEN** the deterministic editor reports that an Agent-owned ID is required
- **AND** does not fill the field with a random token, page number, or title acronym

#### Scenario: Legacy source remains readable without marker

- **WHEN** a source without `identity.scheme` contains unique retained ID `s07_problem`
- **THEN** Stage 1 treats the source as legacy-compatible and accepts that existing identity
- **AND** a later inserted ID is still validated as mnemonic syntax rather than inheriting unrestricted legacy creation
- **AND** the mixed-ID target remains markerless rather than falsely declaring every ID mnemonic-native

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

All framework paths that accept a slide selector SHALL use the same resolver. Resolution SHALL attempt, in order: exact current formal ID, exact spoken key, explicit current position (`N` or `pN`), unique case-insensitive title fragment, then supported-prefix legacy fallback. An unknown or ambiguous selector SHALL fail loudly and present bounded candidates as `position + slide_id + title`; approximate matches MAY be suggestions but SHALL NOT be applied automatically. Natural-language forms such as "page 7" or their Chinese equivalent SHALL be translated by the MD Controller into an explicit position token before deterministic resolution.

The resolver SHALL return one binding for each input token in input order, including the original token, formal `slide_id`, current `position`, and `matched_by` resolution branch. It SHALL preserve duplicate tokens and SHALL NOT deduplicate IDs or decide operation conflicts. Each caller SHALL apply its own documented duplicate semantics after resolution. Every set of selectors in one requested transaction SHALL resolve against one pre-edit snapshot. Targets and anchors SHALL become formal IDs before any operation changes order, so later position selectors cannot shift because an earlier operation was applied.

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

#### Scenario: Per-token evidence survives duplicate selection

- **WHEN** one invocation supplies selectors `UXGap`, `UX gap`, and `3` and all three happen to identify the same slide
- **THEN** the resolver returns three ordered bindings with `matched_by` values for exact ID, spoken key, and position
- **AND** it leaves deduplication or duplicate-operation rejection to the caller

### Requirement: One structured slide document owns Markdown round trips

Stage 1 validation and structural editing SHALL consume one shared structured slide-document interface. It SHALL parse and retain leading frontmatter, preamble, ordered slide blocks, and epilogue. After the slide list starts, the first ordinary level-2 heading that is not a slide heading SHALL start the epilogue. A level-2 heading that begins with the reserved slide-heading prefix but is malformed SHALL be a blocking parse error rather than an epilogue boundary. Unchanged source regions and complete moved blocks SHALL preserve their original bytes except for heading-number projection, the explicit identity marker when required, and deterministic structured-reference updates.

The canonical run-directory editor SHALL operate on exactly one `slide-specifications.md`; it SHALL NOT create a second persistent order file. Stage 1's standalone multi-input mode SHALL remain supported, with local heading validation per input and global positions derived from input order followed by block order.

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

- **WHEN** Stage 1 receives two standalone source files whose slide headings each start at 1
- **THEN** each file is validated for its own continuous local numbering
- **AND** the merged plan positions increase globally in input and block order

### Requirement: Structural edits are previewed and committed as one transaction

Move, delete, insert, normalize, and multi-operation plans SHALL compile to a transaction containing a schema version, `base_spec_sha256`, the publication mode and anticipated visible target version, per-token selector bindings including `matched_by`, formal-ID operations, `before_order`, `after_order`, deterministic structured-reference changes, source-based review-warning locators, and a canonical `plan_sha256`. The plan hash SHALL be SHA-256 over this mutation payload without `plan_sha256`, encoded as recursively canonical UTF-8 JSON. Source paths SHALL be run-relative and warning collections SHALL use deterministic order. Presentation text, current render-artifact impact/status, timestamps, nonce values, staging paths, and machine-specific absolute paths SHALL be excluded. Planning SHALL validate selector resolution, caller-specific duplicate/operation conflicts, the final ID set, historical ID reservation, and continuous derived positions without writing source.

Applying SHALL require the expected `plan_sha256`, recompute both the canonical plan hash and source hash, and reject any mismatch rather than replanning, rebasing, or reinterpreting selectors. A convenience command SHALL NOT treat a bare `--apply` as permission to generate and immediately apply a fresh unreviewed transaction.

The editor SHALL update deterministic structured references such as `render.header-lock` when a referenced slide is deleted or explicitly migrated. It SHALL NOT blindly rewrite page-number prose in slide bodies, block maps, or notes; it SHALL surface those occurrences as review warnings for the Agent.

#### Scenario: Preview and apply use the same resolved transaction

- **WHEN** a valid move transaction is previewed and the source does not change before apply
- **THEN** apply produces exactly the previewed `after_order`
- **AND** selectors are not resolved again against an intermediate order

#### Scenario: Bare apply cannot bypass preview binding

- **WHEN** a mutating structure command is invoked with `--apply` but without the expected preview `plan_sha256` or a self-hash-valid persisted plan
- **THEN** apply fails without writing source or creating a visible version
- **AND** directs the caller to obtain and confirm a fresh preview

#### Scenario: Replanned transaction is rejected

- **WHEN** the same human selectors now compile to a transaction whose canonical hash differs from the confirmed preview
- **THEN** apply rejects the transaction even if the base source hash still matches
- **AND** does not substitute the newly planned operation set

#### Scenario: Render status does not destabilize the confirmed edit

- **WHEN** a raw artifact appears or disappears after preview but source bytes and the resolved structural mutation are unchanged
- **THEN** canonical `plan_sha256` remains unchanged because render impact is not part of the mutation payload
- **AND** apply recomputes and reports current `needs_render` impact separately

#### Scenario: Anticipated target version is bound

- **WHEN** preview identifies visible target `v3` but another publication reserves or creates `v3` before apply
- **THEN** apply fails with a fresh-preview path rather than silently publishing the confirmed mutation as `v4`

#### Scenario: Source changed after preview

- **WHEN** the canonical source bytes change after a transaction is planned
- **THEN** apply rejects the transaction because `base_spec_sha256` is stale
- **AND** neither source version is partially rewritten

#### Scenario: Natural-language page reference needs review

- **WHEN** a moved or deleted slide leaves prose containing a phrase such as "see page 7"
- **THEN** the transaction emits a review warning with a source locator
- **AND** does not replace the prose by numeric string substitution

### Requirement: Structural apply preserves source versions and publishes an edit receipt

Applying move, delete, insert, or a structural multi-operation plan SHALL create a clean next run-bundle version through the run-bundle-management publication authority. It SHALL construct and fully validate the complete target source/control tree in a hidden sibling staging directory under `3_versions/`, then publish it with one same-parent final rename to the reserved visible vNext name. The visible target name SHALL not exist before that final rename. The source version SHALL remain unchanged. A failed commit SHALL remove only the hidden staging directory created by that attempt and SHALL NOT leave an empty or half-written visible version. `normalize --apply` SHALL be the only current-version exception and SHALL change only heading numbers through the same atomic-write discipline.

The success receipt SHALL identify the source and created version, confirmed `plan_sha256`, base and resulting source hashes, resolved operations by formal ID, before and after order, heading normalization, structured-reference changes, review warnings, and deterministic refresh impact including any `needs_render` IDs. Structural apply SHALL NOT call a remote renderer; render authorization belongs to a later explicit refresh. A persisted plan or receipt MAY live under `_scratch/`, but SHALL NOT become an order source of truth.

#### Scenario: Move apply creates vNext

- **WHEN** a user applies a valid move to canonical version `v2`
- **THEN** `v2` remains byte-identical
- **AND** a validated `v3` source contains the previewed order and normalized headings
- **AND** the receipt names both versions and the moved formal ID

#### Scenario: Normalize is identity-neutral

- **WHEN** only heading numbers disagree with physical order and `normalize --apply` runs
- **THEN** the current canonical source is atomically updated to continuous numbers
- **AND** block order, IDs, body bytes, and deck version remain unchanged

#### Scenario: Failed publication exposes no vNext

- **WHEN** validation or writing fails after hidden staging begins but before final rename
- **THEN** the source version remains unchanged and the visible vNext path does not exist
- **AND** only that attempt's hidden staging is eligible for cleanup

#### Scenario: Missing reusable render does not trigger generation

- **WHEN** structural apply cannot prove a retained or inserted slide's required raw render
- **THEN** apply still publishes the valid source vNext and reports that formal ID under `needs_render`
- **AND** makes no Image2 or future remote-render request

### Requirement: Render artifact identity excludes current position

The logical identity for a rendered artifact SHALL be `(slide_id, render_engine, artifact_kind, fingerprint)`. Current position, heading number, human-readable prompt filename, and deck ordering SHALL NOT be part of that identity or generation fingerprint. Stage-owned manifests SHALL remain provenance authorities while a shared resolver exposes artifacts by stable ID, engine, kind, and proof status. A fully provenance- and byte-verified artifact SHALL return `verified`; a compatibility adapter that can only locate a legacy file SHALL return `legacy-located`, which SHALL NOT be treated as current or reusable without further proof. Multiple kinds and engine variants for one slide MAY coexist without changing or overwriting the slide identity.

#### Scenario: Reorder does not change render identity

- **WHEN** a retained slide moves from position 8 to position 2 without content or render-profile changes
- **THEN** its logical render key and generation fingerprint remain unchanged

#### Scenario: Engine variant coexists

- **WHEN** one slide has both `image2` and future `html` artifacts
- **THEN** both artifacts resolve under the same formal slide ID with distinct engine keys
- **AND** switching the selected engine does not rename the slide

#### Scenario: Raw and final artifacts do not collide

- **WHEN** one Image2 slide has both a raw render and a header-locked final image with related fingerprints
- **THEN** the two entries have distinct `artifact_kind` keys
- **AND** resolving one kind cannot accidentally return the other

#### Scenario: Located legacy bytes are not verified provenance

- **WHEN** a compatibility adapter finds a position-prefixed PNG but cannot prove the current fingerprint and byte hash
- **THEN** it returns `legacy-located` rather than `verified`
- **AND** callers do not materialize or assemble it as current solely from its filename
