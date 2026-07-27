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
Pipeline Orchestration SHALL execute Page Authority as composition receipt, raw evidence, raw review,
final manifest, final projection, PPTX assembly, notes injection, and delivery decision. A consistent
Page Authority source/state pair SHALL not invoke a retired adapter, alternate renderer, or a
generated-directory heuristic.

#### Scenario: Mixed deck has one final lineage
- **WHEN** accepted Pure and Framed raw evidence is selected for a build
- **THEN** orchestration creates one final manifest, projection, PPTX receipt, and notes receipt
- **AND** no branch publishes a separate delivery result

### Requirement: Page Authority refresh follows final-pixel ownership
A Framed Text Frame-only change with exact current raw/review identity SHALL run local composition,
final projection, assembly, notes, and delivery review without a provider call. A Pure display or raw
visual-contract change SHALL invalidate its raw item and require fresh raw acceptance before finalization.

#### Scenario: Framed and Pure title edits differ
- **WHEN** a Framed title changes and then a Pure title changes
- **THEN** the Framed refresh is provider-free while the Pure refresh requires fresh raw evidence
- **AND** neither is routed to a retired composition route

### Requirement: Orchestration resolves one current Page Authority lifecycle
Current orchestration SHALL execute Page Authority source receipt, raw plan/authorization/generation,
raw review, finalization, projection, assembly, notes, and delivery evidence. It SHALL treat a legacy
pair as adoption/repair-only and SHALL NOT dispatch any retired production stage.

#### Scenario: Normal production is resolved
- **WHEN** a valid current run is selected for a production operation
- **THEN** the resolver returns the Page Authority lifecycle and no alternative adapter
