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
Pipeline Orchestration SHALL execute a current Page Authority version as source receipt, selected
workflow raw plan, authorization, raw evidence, raw review, selected-workflow final manifest, final
projection, PPTX assembly, notes injection, and delivery decision. The version SHALL follow its one
bound `framed` or `pure` workflow for all pages. A consistent Page Authority source/state pair SHALL
not invoke a retired adapter, sibling workflow, alternate renderer, per-slide workflow dispatch, or a
generated-directory heuristic.

#### Scenario: Selected workflow has one final lineage

- **WHEN** a current version with one selected workflow has complete accepted raw evidence
- **THEN** only that workflow publishes one final manifest followed by one projection, PPTX receipt, and notes receipt
- **AND** no page is dispatched through the sibling workflow or a separate delivery result

#### Scenario: Mixed workflow evidence is rejected

- **WHEN** a build presents Framed and Pure evidence as if both belonged to one current version
- **THEN** orchestration hard-stops at workflow identity before final publication
- **AND** it does not infer per-slide ownership or merge the evidence

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
