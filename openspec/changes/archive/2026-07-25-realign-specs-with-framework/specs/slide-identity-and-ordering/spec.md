## MODIFIED Requirements

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
- **AND** it does not infer a whole-page mode, compatibility Controller, or historical state protocol

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

## REMOVED Requirements

### Requirement: Migration comparison preserves legacy identity without guessing content
**Reason**: The historical source-to-HTML comparison path and its prompt-to-structured candidate workflow are removed.

**Migration**: Supported cross-pipeline work uses the production-mode transition and explicitly authored target source. Existing unsupported runs are recreated rather than compared or converted.
