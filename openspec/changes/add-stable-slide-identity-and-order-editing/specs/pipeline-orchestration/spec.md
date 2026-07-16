## MODIFIED Requirements

### Requirement: Shared slide-id resolution for --only

`unified_pipeline.mjs` SHALL resolve every `--only` token through the shared selector contract owned by `slide-identity-and-ordering`, also used by `ppt_flow`: exact current formal ID, spoken key, explicit 1-based position, unique case-insensitive title fragment, then supported legacy-prefix fallback. It SHALL resolve all tokens against one current `slide_plan.json` snapshot and preserve per-token bindings with `matched_by`; after that, this caller MAY deduplicate repeated formal IDs for stage execution. Ambiguous or unknown tokens SHALL fail and list bounded available `position + slide_id + title` tuples; approximate matches SHALL NOT be selected automatically.

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

After a structural edit creates a target version, orchestration SHALL compare source and target slide plans by formal `slide_id` and classify each ID as retained, inserted, deleted, reordered, or content/profile changed. Position changes alone SHALL invalidate only cheap local outputs such as slide plan projections, prompt twins, Stage 3 final/header-lock output, contact sheets, PPTX assembly, and notes injection. They SHALL NOT invalidate an expensive raw-render fingerprint.

The impact report SHALL expose current position, stable ID, title, retained/materialized raw artifacts, missing or stale artifacts, `verified` versus `legacy-located` status, required local stages, `needs_render`, and any human review requirement. Deleted IDs SHALL not be assembled into the target while the source version and its artifacts remain unchanged.

#### Scenario: Reorder-only impact is cheap

- **WHEN** source and target contain the same formal IDs and semantic inputs but in a different order
- **THEN** orchestration classifies all pages as retained/reordered
- **AND** schedules order-dependent outputs without marking raw renders stale

#### Scenario: Insert isolates expensive work

- **WHEN** the target adds one new formal ID and leaves every retained slide's semantic inputs unchanged
- **THEN** orchestration marks only the new ID as missing a raw render
- **AND** retained IDs remain eligible for verified materialization

### Requirement: Structural versions materialize only verified expensive raw renders

Orchestration SHALL materialize an artifact from the source version into the target only through the shared render-artifact resolver and the owning Stage's manifest rules. Cross-version materialization in this change SHALL be limited to expensive `raw-render` artifacts. A retained raw render SHALL require matching stable ID, engine, artifact kind, generation fingerprint/profile, and verified source-byte SHA. A `legacy-located` file without complete proof SHALL NOT qualify. Successful materialization SHALL atomically copy bytes into the target and write target-owned manifest entries with source-version lineage. Stage 3 final/header-lock output, contact sheet/QA, PPTX, and notes SHALL be rebuilt locally in the target rather than copied across versions. Any failed or missing raw check SHALL report the ID under `needs_render` without guessing from filenames or reading the source version as a runtime fallback.

Header-review evidence MAY be re-established in the target's version-scoped state only when it is a verified per-slide approval and stable ID, generation profile, and reviewed raw-image SHA all match verified current inputs. The target record SHALL identify source-version lineage and SHALL satisfy the existing current-version review contract only after publication in the target. Waivers, `legacy-located` evidence, and unverified source-version evidence SHALL remain unusable.

#### Scenario: Verified retained raw render becomes target-owned

- **WHEN** a retained slide passes every raw-render kind, engine, fingerprint/profile, and byte-hash check
- **THEN** orchestration materializes its raw bytes and current manifest entry into the target version
- **AND** Stage 3 and all later cheap stages rebuild from that target-owned raw entry

#### Scenario: One retained slide has stale provenance

- **WHEN** one source raw artifact's bytes do not match its recorded SHA while all other retained IDs verify
- **THEN** only that ID is excluded from materialization and appears under `needs_render`
- **AND** verified unrelated IDs remain reusable

#### Scenario: Legacy-located file does not prove reuse

- **WHEN** a compatibility adapter locates a retained PNG but cannot prove its current raw-render fingerprint and bytes
- **THEN** orchestration does not materialize it as current
- **AND** reports the retained ID under `needs_render` without making a remote call

#### Scenario: Cheap final artifact is rebuilt locally

- **WHEN** a retained raw render is materialized into a reordered target
- **THEN** target Stage 3 reruns and publishes a target-owned final manifest
- **AND** no prior-version Stage 3 final file is copied as the current target output

#### Scenario: Header evidence is re-established, not borrowed

- **WHEN** source-version review evidence and all bound fingerprints and image bytes verify for a retained target slide
- **THEN** orchestration may publish equivalent target-version evidence with source lineage
- **AND** the target does not directly treat the source-version record as current

#### Scenario: Waiver is not carried forward

- **WHEN** the source version proceeded through a waiver rather than a verified per-slide approval
- **THEN** orchestration does not establish target review evidence from that waiver
- **AND** the target remains subject to its normal review contract

### Requirement: Structural materialization never silently invokes remote rendering

Structural apply, structural impact analysis, and cross-version materialization SHALL never invoke Image2 or any future remote renderer. They SHALL materialize verified raw renders, rebuild cheap local stages where prerequisites exist, and return every missing/stale selected-engine raw artifact as `needs_render`. The Agent SHALL invoke Generated Image Rebuild only through an explicit subsequent refresh after the relevant cost/scope is authorized. A structural or materialization code path with any remote renderer call SHALL fail integration tests.

For reorder/delete-only work whose retained raw renders all verify, the explicit local production path SHALL complete Stage 1, raw materialization, Stage 3, order-dependent QA/contact-sheet work, Stage 4, and Stage 5 with zero remote calls. If any retained raw render cannot be proven, the source vNext remains valid but production stops with `needs_render` rather than quietly spending quota.

#### Scenario: Reorder-only makes zero renderer calls

- **WHEN** all retained artifacts verify after a reorder-only edit
- **THEN** Stage 3, target PPTX, and notes are rebuilt locally in current order
- **AND** no Image2 or future HTML remote render request is made

#### Scenario: Delete-only makes zero renderer calls

- **WHEN** a page is deleted and every remaining ID has verified artifacts
- **THEN** the deleted ID is omitted from target assembly
- **AND** no retained slide is remotely rerendered

#### Scenario: Insert reports missing render before any renderer call

- **WHEN** exactly one inserted ID lacks its selected-engine artifact and all retained IDs verify
- **THEN** structural apply/materialization reports exactly that ID under `needs_render`
- **AND** makes zero remote calls until an explicit Generated Image Rebuild is invoked

#### Scenario: Explicit rebuild scopes the remote call

- **WHEN** the Agent subsequently invokes an authorized Generated Image Rebuild for the one `needs_render` ID
- **THEN** the selected renderer is called only for that ID
- **AND** retained verified raw renders remain untouched

### Requirement: Order-dependent views display position and stable identity

Pipeline status, selector diagnostics, pilot/contact-sheet labels, and structural impact output SHALL present each current page as `position + formal slide_id + title` when those fields are available. Position SHALL be treated as the current snapshot projection and formal ID as the cross-version reference.

#### Scenario: Contact sheet remains easy to discuss

- **WHEN** a contact sheet is rebuilt after reordering
- **THEN** each label shows the page's new position and unchanged formal ID
- **AND** the image artifact remains associated by ID rather than label text
