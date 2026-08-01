## MODIFIED Requirements

### Requirement: Page Authority has one receipt-to-delivery lifecycle

Pipeline Orchestration SHALL execute a current Page Authority version as validated selected-workflow source,
Style Master candidate plan/authorization/materialization/review/promotion, source receipt/state when absent, selected-workflow raw plan,
page raw authorization, raw evidence, raw review, selected-workflow final manifest, final projection,
PPTX assembly, notes injection, and delivery decision. The version SHALL follow its one bound `framed` or
`pure` workflow for all pages. A consistent Page Authority source/state pair SHALL not invoke a retired
adapter, sibling workflow, alternate renderer, per-slide workflow dispatch, or a generated-directory
heuristic.

The orchestration SHALL not enter page raw planning or any page raw provider submission until the selected
workflow has a current accepted effective-style selection. Candidate provider work is Style Master work,
not page raw production; this change SHALL not route Pilot/Expansion or any page-level batch lifecycle.

For fresh creation, orchestration SHALL enter the Style Master loop from the active fresh-v2 authoring draft
and validate the selected-workflow source through its existing read-only candidate resolver before the selected workflow materializes its first page source
receipt/state/raw plan. Style Master promotion MAY write only its optional schema-v5 acceptance record and
SHALL not create production mode, target evidence, source epoch, or page raw lineage. For an existing run,
orchestration SHALL require the exact current source/state workflow pair. An existing run whose old raw plan
lacks the new accepted-style binding SHALL remain inspectable but SHALL route through local-candidate review
and Generated Image Rebuild rather than rebind old raw evidence.

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
- **AND** it makes zero page raw provider submissions, Pilot projections, raw-review decisions, or final artifacts

#### Scenario: Fresh Style Master does not preempt source materialization owner

- **WHEN** an active fresh-v2 authoring draft has a valid selected-workflow source and no target source receipt/state record
- **THEN** orchestration may complete the selected-workflow Style Master loop against that exact draft
- **AND** only the later selected-workflow raw-plan operation may materialize the first page source receipt, production mode, target evidence, raw plan, and source epoch

#### Scenario: Legacy raw lineage is not silently upgraded

- **WHEN** an existing exact v2 run has raw evidence generated from a bare style file but no accepted effective-style binding
- **THEN** orchestration preserves the old bytes for inspection and routes current production through Style Master adoption plus Generated Image Rebuild
- **AND** it does not add a selection digest to the old plan, retain old raw acceptance as current, or scan another run

#### Scenario: Structural target does not inherit source style readiness

- **WHEN** structural publication creates vNext from a source version with an accepted Style Master
- **THEN** orchestration keeps the source selection scoped to its version and routes the target to its own Style Master loop
- **AND** neither a same-workflow source record nor the layout-resolved compatibility payload allows target page raw planning before target promotion
