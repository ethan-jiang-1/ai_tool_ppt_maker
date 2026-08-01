## Purpose

Define marker-first orchestration through the public Page Authority lifecycle on the checked-in supported Node runtime. It owns source receipt, raw planning, authorization, generation, review, finalization, assembly, notes, delivery review, and structural routing.
## Requirements

### Requirement: Page Authority scoped selectors preserve stable-ID evidence

`ppt_flow` SHALL resolve every scoped Page Authority selector through the shared
contract owned by `slide-identity-and-ordering`: exact current formal ID, spoken key,
explicit 1-based position, unique case-insensitive title fragment, then supported
legacy-prefix fallback. It SHALL resolve all tokens against one current source
snapshot and preserve per-token bindings with `matched_by`; after that, the operation
MAY deduplicate repeated formal IDs. Ambiguous or unknown tokens SHALL fail and list
bounded available `position + slide_id + title` tuples; approximate matches SHALL NOT
be selected automatically.

#### Scenario: Spoken mnemonic resolves

- **WHEN** `--only "UX gap"` is passed and the plan contains formal ID `UXGap`
- **THEN** the scoped Page Authority operation selects `UXGap` only

#### Scenario: Prefix s03 resolves

- **WHEN** `--only s03` is passed, no higher-precedence selector matches, and exactly one legacy plan ID starts with `s03`
- **THEN** the scoped Page Authority operation selects that formal legacy ID only

#### Scenario: Page number resolves

- **WHEN** `--only 3` is passed and the plan has at least three slides
- **THEN** the scoped Page Authority operation targets the third slide's formal ID

#### Scenario: Ambiguous selector fails closed

- **WHEN** a title fragment or supported legacy prefix matches more than one plan entry
- **THEN** resolution fails with the matching position, formal ID, and title tuples
- **AND** no Page Authority operation runs for an inferred selection

### Requirement: Order-dependent views display position and stable identity

Status, selector diagnostics, raw-review labels, and structural impact output SHALL
present each current page as `position + formal slide_id + title` when those fields
are available. Position SHALL be treated as the current snapshot projection and
formal ID as the cross-version reference.

#### Scenario: Raw review remains easy to discuss

- **WHEN** a raw-review projection is rebuilt after reordering
- **THEN** each label shows the page's new position and unchanged formal ID
- **AND** the image artifact remains associated by ID rather than label text

### Requirement: Page Authority has one receipt-to-delivery lifecycle

Pipeline Orchestration SHALL execute a current Page Authority version as
validated selected-workflow source, Style Master candidate
plan/authorization/materialization/review/promotion, source receipt/state when
absent, selected-workflow full raw plan, exact Pilot production, conditional
Expansion production, complete raw review, selected-workflow final manifest,
final projection, PPTX assembly, notes injection, and delivery decision. The
version SHALL follow its one bound framed or pure workflow for all pages. A
consistent Page Authority source/state pair SHALL not invoke a retired adapter,
sibling workflow, alternate renderer, per-slide workflow dispatch, or a
generated-directory heuristic.

The orchestration SHALL not enter page raw planning or any page raw provider
submission until the selected workflow has a current accepted effective-style
selection. Candidate provider work is Style Master work, not page raw
production. After the full raw plan is current, orchestration SHALL use the
raw owner's exact Pilot/Expansion lifecycle; it SHALL not retain the previous
full-plan authorization/generation shortcut or synthesize a batch from a
selector, file list, or task projection.

For fresh creation, orchestration SHALL enter the Style Master loop from the
active fresh-v2 authoring draft and validate the selected-workflow source
through its existing read-only candidate resolver before the selected workflow
materializes its first page source receipt/state/raw plan. Style Master
promotion MAY write only its optional schema-v5 acceptance record and SHALL
not create production mode, target evidence, source epoch, or page raw
lineage. For an existing run, orchestration SHALL require the exact current
source/state workflow pair. An existing run whose old raw plan lacks the
progressive full-plan/provenance binding SHALL remain inspectable but SHALL
route through the owner migration/rebuild action rather than rebind old raw
evidence.

If the current progressive raw head has an unresolved submitted attempt,
orchestration SHALL route to that exact reconciliation/terminalization action
before it may publish a successor raw plan, batch, grant, final manifest, or
delivery artifact. Source/profile drift does not erase that paid-work fact;
after reconciliation, its historical outcome still requires ordinary current
tuple validation before any reuse.

A current v3 Framed Text Frame-only change that passes the existing
local-rebind validator SHALL retain the accepted complete raw-review reference
through its provider-free local-compose path, rebind current v3 plan/evidence
without advancing source epoch, and continue through finalization/delivery. It
SHALL not enter Pilot, Expansion, cost authorization, or a new complete raw
review. A failed local-rebind condition SHALL use the normal progressive
full-plan/debt path.

A structurally published vNext SHALL enter this lifecycle as a distinct Style Master scope. Orchestration SHALL
not treat the source version's accepted selection or the layout-resolved compatibility payload as target readiness, even
when both versions select the same workflow. It SHALL preserve source-version authority and any target-owned
selection on exact structural replay, while routing a newly published target without its own selection through
the normal target Style Master loop before page raw planning. That replay is a no-publish target revalidation:
it SHALL neither recreate vNext nor reset an active target Controller execution, and target tuple drift SHALL
fail before source, state, compatibility payload, or provider work changes.

#### Scenario: Selected workflow has one final lineage

- **WHEN** a current version with one selected workflow has complete accepted raw evidence
- **THEN** only that workflow publishes one final manifest followed by one projection, PPTX receipt, and notes receipt
- **AND** no page is dispatched through the sibling workflow or a separate delivery result

#### Scenario: Mixed workflow evidence is rejected

- **WHEN** a build presents Framed and Pure evidence as if both belonged to one current version
- **THEN** orchestration hard-stops at workflow identity before final publication
- **AND** it does not infer per-slide ownership or merge the evidence

#### Scenario: Style Master feedback precedes page raw work

- **WHEN** a valid Framed or Pure version has style intent but lacks a current accepted effective-style selection
- **THEN** orchestration routes it to that workflow's Style Master loop before page raw planning
- **AND** it makes zero page raw provider submissions, Pilot/Expansion projections, raw-review decisions, or final artifacts

#### Scenario: Fresh Style Master does not preempt source materialization owner

- **WHEN** an active fresh-v2 authoring draft has a valid selected-workflow source and no target source receipt/state record
- **THEN** orchestration may complete the selected-workflow Style Master loop against that exact draft
- **AND** only the later selected-workflow raw-plan operation may materialize the first page source receipt, production mode, target evidence, raw plan, and source epoch

#### Scenario: Legacy raw lineage is not silently upgraded

- **WHEN** an existing exact v2 run has raw evidence without the current progressive full-plan and per-item provenance binding
- **THEN** orchestration preserves the old bytes for inspection and routes current production through the raw owner migration/rebuild action
- **AND** it does not add batch, selection, or provenance bindings to the old plan or retain old raw acceptance as current

#### Scenario: Drift cannot skip unresolved progressive provider work

- **WHEN** source or generation-profile drift is detected after a progressive item reached `submitted`
- **THEN** orchestration exposes only that item's reconciliation action before replan or authorization
- **AND** it does not create a successor head, grant, final manifest, or delivery result until a terminal outcome exists

#### Scenario: Framed local rebind skips progressive paid checkpoints

- **WHEN** a current v3 Framed Text Frame-only change passes the existing local-rebind validator
- **THEN** orchestration retains the accepted complete raw-review reference and runs provider-free local composition through delivery
- **AND** it does not create a Pilot, Expansion, grant, provider submit, or another complete raw-quality decision

#### Scenario: Structural target does not inherit source style readiness

- **WHEN** structural publication creates vNext from a source version with an accepted Style Master
- **THEN** orchestration keeps the source selection scoped to its version and routes the target to its own Style Master loop
- **AND** neither a same-workflow source record nor the layout-resolved compatibility payload allows target page raw planning before target promotion

#### Scenario: Partial Pilot waits for a second cost gate

- **WHEN** a current partial Pilot receives proceed and current paid debt remains
- **THEN** orchestration routes only to the exact Expansion planning/authorization checkpoint
- **AND** it does not generate remaining pages, finalize, or publish accepted raw evidence

#### Scenario: Full-debt Pilot enters complete review

- **WHEN** the Pilot paid scope exhausted all current paid debt
- **THEN** orchestration bypasses partial Pilot acceptance and Expansion and routes to complete raw review
- **AND** it does not ask the human the same quality question twice

### Requirement: Page Authority refresh follows final-pixel ownership
A Framed Text Frame-only change with exact current raw/review identity SHALL run local composition,
final projection, assembly, notes, and delivery review without a provider call. A Pure display or raw
visual-contract change SHALL invalidate its raw item and require fresh raw acceptance before finalization.

#### Scenario: Framed and Pure title edits differ
- **WHEN** a Framed title changes and then a Pure title changes
- **THEN** the Framed refresh is provider-free while the Pure refresh requires fresh raw evidence
- **AND** neither is routed to a retired composition route

### Requirement: Orchestration resolves one current Page Authority lifecycle
Current orchestration SHALL execute only v2 Page Authority source receipt, raw plan/authorization/generation, raw review, selected-workflow finalization, projection, assembly, notes, and delivery evidence. A non-v2 source/state pair SHALL not dispatch a production stage and shall return the owner-issued unsupported-protocol hard-stop.

#### Scenario: Normal production is resolved
- **WHEN** a valid v2 run is selected for a production operation
- **THEN** the resolver returns the selected Page Authority lifecycle and no alternative adapter

#### Scenario: Non-v2 input is not a lifecycle
- **WHEN** a non-v2 source/state pair is selected
- **THEN** orchestration returns its bounded unsupported-protocol action without provider work
- **AND** it does not create a source receipt or execution state

### Requirement: TARGET Page Authority orchestration is an exclusive workflow trajectory
For a valid `page-authority-image2-v2` source/state pair, orchestration SHALL resolve the version workflow once and execute exactly one of `03-framed-image` or `04-pure-image`, followed by shared `05-delivery` and workflow-aware `06-iteration`. It SHALL NOT expose per-slide authority dispatch or route Framed work through the Pure workflow, or vice versa.

A missing, mismatched, hybrid, or non-v2 pair SHALL fail at marker-first resolution with the owning hard-stop before derived work.

#### Scenario: Target Framed route skips Pure ownership
- **WHEN** marker-first resolution recognizes a target receipt with workflow `framed`
- **THEN** orchestration enters `03-framed-image`, then the common delivery interface and `06-iteration`
- **AND** it does not invoke `04-pure-image` or ask for a per-slide authority choice

#### Scenario: Non-v2 pair stops before lifecycle selection
- **WHEN** a source/state pair is not an exact v2 pair
- **THEN** orchestration returns the identity or unsupported-protocol hard-stop
- **AND** it does not fall back to another lifecycle

### Requirement: TARGET refresh follows version workflow ownership

TARGET refresh routing SHALL use the bound version workflow and direct artifact
freshness facts. A Framed Text Frame-only edit with exact accepted raw evidence SHALL retain its accepted raw-review reference
only when its source epoch, workflow, ordered stable IDs, raw contract, safe zones, provider profile,
accepted underlay bytes, render profile, typed review-contribution digest, and projection/capture profile remain
exact. It SHALL use provider-free local composition, repeat current layout proof before publication,
and rebind the accepted raw tuple without advancing the source epoch or rebuilding the raw-review
projection. Before retaining the reference, its owner SHALL validate the stored review record's actual
projection PNG bytes/hash and exact coverage bindings. A retained title label is historical presentation,
not current-source authority or coverage identity. A Framed preset, render-profile, safe-zone, underlay,
provider-profile, or other coverage-bound change and every Pure display/visual change SHALL invalidate raw work and require the
existing Generated Image Rebuild, authorization, and review path. Notes-only work SHALL remain
browser-free and use shared delivery. A structural or workflow change SHALL use the exact
preview/hash-bound Structural Versioning Path.

#### Scenario: Target workflow switch is structural

- **WHEN** a user changes a target version from `framed` to `pure` or from `pure` to `framed`
- **THEN** orchestration requires a structural vNext preview and exact plan confirmation
- **AND** it does not mutate the active version workflow or inherit final/delivery acceptance

#### Scenario: Framed text-only refresh remains local

- **WHEN** only Framed Text Frame literals change while accepted underlay, raw contract, safe zones, provider profile, and render profile remain current
- **THEN** orchestration performs current local composition without a provider submission
- **AND** it retains the accepted raw-review reference with the same source epoch while a historical projection label remains presentation-only
- **AND** a layout failure stops final publication with the source-repair action

#### Scenario: Render-profile drift requires raw rebuild

- **WHEN** a Framed render-profile input changes even if the previous underlay bytes and safe-zone rectangles appear reusable
- **THEN** orchestration classifies the affected evidence as Generated Image Rebuild debt
- **AND** it does not silently rebind accepted underlay bytes or offer a local force path

#### Scenario: Notes-only refresh remains browser-free

- **WHEN** only speaker notes change and current pixel-owning facts remain valid
- **THEN** orchestration uses the Notes-Only Refresh path without browser or provider work
