## ADDED Requirements

### Requirement: Automatic pilot selection covers content full-page header risk

`ppt_flow pilot` automatic selection SHALL classify a full-page slide as hero or content using the same shared VISUAL TYPE canonicalization helper as Stage 1, not merely its `render_mode`. When at least one content full-page slide exists and `count >= 1`, the selected ids SHALL include at least one. When at least two content full-page slides exist and `count >= 2`, the selected ids SHALL include at least two so cross-page header consistency can be reviewed. Remaining capacity SHALL cover opener/closer and other render modes using deterministic, deduplicated selection. Explicit `--only` SHALL remain authoritative and SHALL NOT have slides silently added by the CLI.

#### Scenario: Default pilot samples two content full-page pages
- **WHEN** a deck has at least two content full-page slides and automatic pilot runs with the default count of three
- **THEN** two selected ids are content full-page slides
- **AND** the remaining id is selected deterministically from the other representative classes

#### Scenario: Count one prioritizes the changed risk
- **WHEN** a deck has a content full-page slide and automatic pilot runs with `--count 1`
- **THEN** that one selected slide is content full-page

#### Scenario: Explicit only remains exact
- **WHEN** the caller supplies valid `--only` ids
- **THEN** the CLI uses exactly those ids and does not append content full-page slides

### Requirement: Production readiness enforces current header-review evidence

For `ppt_flow build`, non-preview Stage 2, and Stage 4 final assembly, production readiness SHALL compute header-review inputs from the current source specifications and current visual config, or SHALL first refresh Stage 1; it SHALL NOT trust a possibly stale `slide_plan.json`. It SHALL load only the current version's completed record from `_state/state.yaml` `nodes.header-review.by_version`. When the current source resolves content full-page slides, evidence SHALL satisfy the one-page/two-page content coverage. The deterministic fingerprint SHALL cover all current full-page slides' resolved mode, normalized VISUAL TYPE, present structured header text, plus shared content header geometry. Evidence SHALL retain a per-slide `full_page_header_snapshot`; compared with the prior accepted snapshot for that version, every added/changed full-page id SHALL be reviewed or have a named accepted risk before a new fingerprint is accepted. Evidence MAY record user-accepted risks, but each accepted risk SHALL name affected slide ids and symptoms and be bound to the current fingerprint. Preview/pilot SHALL remain allowed without current evidence. When no content full-page slides and no changed full-page header ids exist, this gate SHALL not apply.

Production validation SHALL also compare requested generation profile with approved full-page image provenance. A build/non-preview Stage 2 that would force-regenerate a reviewed/accepted full-page id SHALL fail before generation. To continue without another review, the caller SHALL use matching-profile cached images (for `ppt_flow build`, `--reuse-images`); changing profile or image bytes requires target-profile pilot regeneration and header approval before Stage 4.

#### Scenario: Production blocks absent evidence
- **WHEN** a production build contains content full-page slides but no current header-review evidence exists
- **THEN** production validation fails with the standard JSON envelope
- **AND** the hint directs the Agent to run and review pilot rather than edit state manually

#### Scenario: Changed header inputs stale the evidence
- **WHEN** reviewed header text, render policy/mode, content-full-page membership, or shared geometry changes
- **THEN** the recomputed fingerprint differs and production remains blocked until regeneration and review

#### Scenario: Changed hero title also stales evidence
- **WHEN** a hero full-page slide's structured header text changes after the accepted snapshot
- **THEN** that slide appears in the changed full-page ids and must be regenerated and reviewed or explicitly accepted

#### Scenario: Stale generated plan cannot preserve approval
- **WHEN** source markdown changed but the existing `slide_plan.json` still reflects older header inputs
- **THEN** production readiness uses/refreshed current source parsing and rejects stale evidence

#### Scenario: Valid accepted risk permits production
- **WHEN** the user explicitly accepted named header symptoms for named slides and that decision is persisted against the current fingerprint
- **THEN** production readiness accepts the evidence

#### Scenario: No content full-page needs no evidence
- **WHEN** the current plan has no content full-page slides and there are no changed full-page ids relative to accepted evidence
- **THEN** production readiness does not require a header-review fingerprint

#### Scenario: Partial chain cannot assemble stale full-page images
- **WHEN** a caller runs a Stage 1/3/4 partial chain after changing a full-page header without current evidence
- **THEN** Stage 4 refuses to assemble the PPTX

#### Scenario: Production profile must match approved images
- **WHEN** production requests a different resolution/model/style profile than reviewed full-page images
- **THEN** production refuses to treat the old review as current
