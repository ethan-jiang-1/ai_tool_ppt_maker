## MODIFIED Requirements

### Requirement: Shared slide-id resolution for --only

`unified_pipeline.mjs` SHALL resolve every `--only` token through the shared selector contract owned by `slide-identity-and-ordering`, also used by `ppt_flow`: exact current mnemonic ID, spoken key, explicit 1-based position, unique case-insensitive title fragment, then supported exact/prefix legacy fallback. It SHALL resolve all tokens against one current `slide_plan.json` snapshot and return formal slide IDs. Ambiguous or unknown tokens SHALL fail and list bounded available `position + slide_id + title` tuples; approximate matches SHALL NOT be selected automatically.

#### Scenario: Spoken mnemonic resolves

- **WHEN** `--only "UX gap"` is passed and the plan contains formal ID `UXGap`
- **THEN** Stage 2 processes `UXGap` only

#### Scenario: Prefix s03 resolves

- **WHEN** `--only s03` is passed, no higher-precedence selector matches, and exactly one legacy plan ID starts with `s03`
- **THEN** Stage 2 processes that formal legacy ID only

#### Scenario: Page number resolves

- **WHEN** `--only 3` is passed and the plan has at least three slides
- **THEN** Stage 2 targets the third slide's formal ID

#### Scenario: Ambiguous selector fails closed

- **WHEN** a title fragment or supported legacy prefix matches more than one plan entry
- **THEN** resolution fails with the matching position, formal ID, and title tuples
- **AND** no pipeline stage runs for an inferred selection

## ADDED Requirements

### Requirement: Structural refresh impact is computed by stable identity

After a structural edit creates a target version, orchestration SHALL compare source and target slide plans by formal `slide_id` and classify each ID as retained, inserted, deleted, reordered, or content/profile changed. Position changes alone SHALL invalidate only order-dependent cheap outputs such as slide plan projections, prompt twins, contact sheets, PPTX assembly, and notes injection. They SHALL NOT invalidate an expensive render fingerprint.

The impact report SHALL expose current position, stable ID, title, retained/materialized artifacts, missing or stale artifacts, required stages, and any human review requirement. Deleted IDs SHALL not be assembled into the target while the source version and its artifacts remain unchanged.

#### Scenario: Reorder-only impact is cheap

- **WHEN** source and target contain the same formal IDs and semantic inputs but in a different order
- **THEN** orchestration classifies all pages as retained/reordered
- **AND** schedules order-dependent outputs without marking raw renders stale

#### Scenario: Insert isolates expensive work

- **WHEN** the target adds one new formal ID and leaves every retained slide's semantic inputs unchanged
- **THEN** orchestration marks only the new ID as missing a raw render
- **AND** retained IDs remain eligible for verified materialization

### Requirement: Structural versions reuse only verified artifacts

Orchestration SHALL materialize an artifact from the source version into the target only through the shared render-artifact resolver and the owning Stage's manifest rules. A retained raw render SHALL require matching stable ID, engine, generation fingerprint/profile, and verified source-byte SHA. A retained final/header artifact SHALL additionally require matching resolved mode/header fingerprint, verified raw-input SHA, and verified final-output SHA. Successful materialization SHALL atomically copy bytes into the target and write target-owned manifest entries with source-version lineage. Any failed or missing check SHALL fall back to the normal target refresh path without guessing from filenames or reading the source version as a runtime fallback.

Header-review evidence MAY be materialized into the target's version-scoped state only when stable ID, current header fingerprint, generation profile, and reviewed raw-image SHA all match verified current inputs. The target record SHALL identify source-version lineage and SHALL satisfy the existing current-version review contract only after publication in the target. Unverified source-version evidence SHALL remain unusable.

#### Scenario: Verified retained artifacts become target-owned

- **WHEN** a retained slide passes every raw and final manifest fingerprint/hash check
- **THEN** orchestration materializes its artifacts and current manifest entries into the target version
- **AND** downstream stages resolve only the target-owned entries

#### Scenario: One retained slide has stale provenance

- **WHEN** one source artifact's bytes do not match its recorded SHA while all other retained IDs verify
- **THEN** only that ID is excluded from materialization and follows normal refresh
- **AND** verified unrelated IDs remain reusable

#### Scenario: Header evidence is re-established, not borrowed

- **WHEN** source-version review evidence and all bound fingerprints and image bytes verify for a retained target slide
- **THEN** orchestration may publish equivalent target-version evidence with source lineage
- **AND** the target does not directly treat the source-version record as current

### Requirement: Reorder and delete avoid remote rendering

For a structural transaction containing only reorder and delete operations, when every retained render artifact passes the required provenance checks, orchestration SHALL complete Stage 1, target materialization, order-dependent QA/contact-sheet work, Stage 4, and Stage 5 without invoking Image2 or any future remote renderer. For insertion, it SHALL invoke a renderer only for IDs whose selected engine artifact is absent or stale. A renderer call count greater than the computed missing/stale ID set SHALL fail structural integration tests.

#### Scenario: Reorder-only makes zero renderer calls

- **WHEN** all retained artifacts verify after a reorder-only edit
- **THEN** the target PPTX and notes are rebuilt in current order
- **AND** no Image2 or future HTML remote render request is made

#### Scenario: Delete-only makes zero renderer calls

- **WHEN** a page is deleted and every remaining ID has verified artifacts
- **THEN** the deleted ID is omitted from target assembly
- **AND** no retained slide is remotely rerendered

#### Scenario: One inserted page makes one renderer call

- **WHEN** exactly one inserted ID lacks its selected-engine artifact and all retained IDs verify
- **THEN** orchestration requests rendering only for that inserted ID

### Requirement: Order-dependent views display position and stable identity

Pipeline status, selector diagnostics, pilot/contact-sheet labels, and structural impact output SHALL present each current page as `position + formal slide_id + title` when those fields are available. Position SHALL be treated as the current snapshot projection and formal ID as the cross-version reference.

#### Scenario: Contact sheet remains easy to discuss

- **WHEN** a contact sheet is rebuilt after reordering
- **THEN** each label shows the page's new position and unchanged formal ID
- **AND** the image artifact remains associated by ID rather than label text
