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
- **AND** it does not infer a whole-page mode, alternate Controller, or historical state protocol

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
Applying move/delete/insert or a structural multi-operation SHALL create a fully validated clean vNext
source/control tree through hidden same-parent staging and one final visible-directory rename. The
source version remains unchanged, a failed publication exposes no partial vNext, and normalize remains
the atomic current-source heading-only exception. Structural source apply SHALL invoke neither a
renderer nor provider work and SHALL not materialize generated bytes.

The success receipt SHALL bind source/target versions, confirmed plan/base/result hashes, formal-ID
operations, before/after order, heading/reference changes, review warnings, and pipeline-specific
deterministic impact. HTML-first receipts SHALL report `needs_local_materialization` and target-version
review/delivery work without copying source reset, approvals, mirrors, delivery review, or node
decisions. Current whole-page Image2 receipts SHALL report manifest-proven raw reuse and
`needs_render` IDs requiring separately authorized Generated Image Rebuild; stable IDs never grant
cross-version approval, provider authorization, or provenance. A persisted plan or receipt may live in
`_scratch/` but never becomes order authority. Unsupported historical source/state protocols fail
before staging or receipt creation.

#### Scenario: Whole-page insert lacks a verified raw render
- **WHEN** a current `whole-page-image2-v1` target inserts an ID with no manifest-proven raw render
- **THEN** source vNext publishes with that ID under `needs_render`
- **AND** no provider call occurs until a separately authorized rebuild

#### Scenario: Historical protocol cannot publish structural vNext
- **WHEN** source/state identity is absent, retired, or inconsistent
- **THEN** structural apply fails before staging and returns one bounded owner-issued typed next action
- **AND** it does not infer a mode from retained IDs or raw files

### Requirement: Render artifact identity excludes current position
The logical private identity for rendered artifacts SHALL be
`(slide_id, producer, artifact_kind, producer_fingerprint)`. `producer` SHALL be a stable
adapter/contract identifier, not a directory or filename; current whole-page producer lineage includes
its render engine/profile and HTML includes its composition variant. Position, heading number, human
filename, and deck order SHALL not enter private identity. Stage-owned manifests remain provenance
authorities; only fully provenance/byte-verified entries are reusable or assemblable.

A position-prefixed file without current manifest proof is `unverified-located`, not a compatibility
artifact. Callers SHALL not reuse, materialize, assemble, or promote it as current evidence. The
provider-neutral Stage-4 adapter projects only current HTML effective entries and never inspects a
producer-private lineage.

#### Scenario: Position-prefixed bytes lack proof
- **WHEN** a matching-looking position-prefixed PNG has no current manifest entry for its fingerprint and bytes
- **THEN** the resolver reports `unverified-located`
- **AND** no current materialization or assembly reuses it

### Requirement: Structured contract preserves stable identity and derived order

The HTML-first structured plan SHALL reuse the existing stable slide ID, spoken-key, and current physical position contract. Reordering SHALL update derived positions and heading projections while preserving IDs, spoken keys, notes bindings, per-slide semantic/visual fingerprints, and the deck style-reference fingerprint; the complete ordered plan digest SHALL change. The contract SHALL not introduce a second order source.

#### Scenario: Reordered structured slides keep identity

- **WHEN** a structured slide moves from position 7 to position 3 without content changes
- **THEN** its plan record reports position 3 with the same stable ID and spoken key
- **AND** its semantic and visual contract fingerprints remain unchanged
- **AND** the ordered plan digest changes with the physical sequence

#### Scenario: Deleted identity is not reused

- **WHEN** a structured slide is deleted from a version
- **THEN** its formal ID and spoken key remain reserved by existing history rules
- **AND** a later structured insertion cannot reuse them silently

### Requirement: Round-trip edits do not shift notes or unrelated blocks
Structured contract serialization SHALL use the shared slide-document interface and preserve
speaker-note ownership, epilogue boundaries, unrelated blocks, raw owned fences, stable IDs, spoken
keys, and source-order semantics. HTML structural publication and later target-local materialization
retain their existing current-source, reset, receipt, and review rules; neither step may import
unproven prompt/raw-image artifacts, copy approvals or generated evidence across versions, or create
Image2 refinement state.

Move/delete/heading normalization SHALL retain raw YAML fence bytes. Insert SHALL require one complete
locally valid HTML-first slide block and referenced assets. Reorder/delete SHALL preserve notes and
per-slide semantic/visual/composition fingerprints for unchanged slides; only positions and ordered
delivery evidence change. Obsolete prompt controls are invalid mixed-source input, not conversion
material.

#### Scenario: Obsolete prompt controls cannot create a mixed branch
- **WHEN** an HTML structural insert contains a retired prompt control, missing structured body, or unresolved local asset
- **THEN** preview fails before a version transaction is created
- **AND** it does not parse the prompt or raw image as target content

### Requirement: Composition artifact identity excludes physical position

HTML page and final-slide artifact identity SHALL use stable slide ID plus renderer contract/composition fingerprint and SHALL not include current position or filename prefixes. Order-dependent manifests/contact sheets/PPTX/notes SHALL derive order only from the current structured plan.

#### Scenario: Position changes without content change

- **WHEN** a slide moves from position 7 to 3
- **THEN** its page/final-slide artifact remains reusable
- **AND** no directory-glob or prefixed filename becomes order authority

### Requirement: Page Authority structural targets preserve provenance without inheriting acceptance
The existing structural preview/apply transaction SHALL recognize the exact
`page-authority-image2-v1` / `image2-page-authority` pair as a current protocol. Its canonical plan
SHALL bind each retained stable slide ID to either a byte-verifiable raw tuple plus source lineage for
target materialization or `needs_raw_generation`. Apply SHALL revalidate every declared source tuple
before the target is visible, atomically publish only target-owned `unreviewed` raw provenance and raw
debt, and preserve the source version. It SHALL not materialize a final slide, copy raw/delivery review,
provider authorization, or active execution, and SHALL make zero provider calls.

#### Scenario: Mixed target has materialized and missing raw evidence
- **WHEN** a confirmed Page Authority structural plan retains one exact raw tuple and adds one new slide
- **THEN** the clean target records target-owned unreviewed provenance for the retained slide and
  `needs_raw_generation` for the new slide
- **AND** no target final manifest or provider submission is created by structural apply

#### Scenario: Source tuple drift aborts publication
- **WHEN** a source raw byte, tuple, or target resolved raw contract drifts after preview
- **THEN** apply rejects the stale plan before exposing the target version
- **AND** it does not downgrade the materialization to an unverified filename copy or submit a provider request

### Requirement: Legacy adoption uses an explicit per-slide identity matrix
An adoption candidate SHALL carry one exact `pptmaker-page-authority-legacy-adoption-matrix-v1` matrix.
It SHALL account for every legacy stable slide ID exactly once as `retained` or `removed`, and every
Page Authority candidate slide exactly once as `retained` or `addition`. A retained row SHALL preserve
the same stable ID on both sides; additions and removals SHALL be explicit rather than inferred from
position, title, prompt, pixel, or generated file. Each target-bearing row SHALL bind the target slide
ID, Page Authority `pure-image2` or `framed-image2` selection, Text Frame disposition,
visual-brief/reference disposition, and speaker-note disposition to the authored Page Authority source.

Preview SHALL validate the matrix against the source version's formal identity/order ledger and parsed
candidate Page Authority receipt, bind every canonical row into the plan hash, and show the per-slide
disposition. Apply SHALL revalidate it before publication. The matrix may preserve identity only; it
SHALL not provide a route to copy a legacy prompt, image, raw tuple, review, authorization, final
artifact, or delivery decision into the target.

#### Scenario: Retained stable identity is explicit
- **WHEN** an adoption candidate retains a source slide with stable ID `HeroGo`
- **THEN** its matrix contains one `retained` row with source and target ID `HeroGo` and the authored Page Authority authority/dispositions
- **AND** the target source cannot retain it merely because a title or position looks similar

#### Scenario: Addition and removal are not inferred
- **WHEN** a candidate removes one old slide and adds one new Page Authority slide
- **THEN** the matrix has one `removed` row and one `addition` row before preview succeeds
- **AND** no source-generated material is associated with either row
