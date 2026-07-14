## RENAMED Requirements

- FROM: `### Requirement: Unified pipeline supports editing chains`
- TO: `### Requirement: Unified pipeline supports semantic refresh paths`

## MODIFIED Requirements

### Requirement: Unified pipeline supports semantic refresh paths

The unified pipeline entry point (`unified_pipeline.mjs`) SHALL continue to support the Stage subsets used by three English canonical refresh paths: Header Text & Style Refresh resolves source in Stage 1 and completes Stages 3,4,5 without Stage 2 when only KICKER/TITLE/SUBTITLE text or Stage-3-owned overlay styling is stale and the raw-image contract is unchanged; Generated Image Rebuild covers Stages 1,2,3,4,5 as a logical workflow with actual selected image regeneration and required review; Notes-Only Refresh uses Stage 5 only. The former Chain A/B/C labels are compatibility aliases, not CLI values or machine identifiers.

Generated Image Rebuild SHALL preserve the existing force semantics: raw `unified_pipeline --only <ids>` limits Stage 2 scope but does not imply force, so intentional rebuilding of existing selected images SHALL include `--force-images`. A public `ppt_flow refresh --kind visual` request MAY add force for its explicitly selected/all scope. For reviewed full-page title changes, Stage 2 MAY occur in a pilot command and final Stages 3,4,5 MAY reuse the reviewed image; the path SHALL NOT require one literal all-stage invocation.

#### Scenario: Header Text & Style Refresh skips image regeneration

- **WHEN** a resolved `body+header-lock` header change follows Header Text & Style Refresh
- **THEN** Stage 1 refreshes the plan and Stages 3,4,5 complete without Stage 2
- **AND** the pipeline completes in under 5 minutes for a standard deck

#### Scenario: Safe-zone change is not a header-only refresh

- **WHEN** a header safe-zone or render-mode change alters the raw-image prompt contract
- **THEN** the affected slide uses Generated Image Rebuild rather than Header Text & Style Refresh

#### Scenario: Raw selected image rebuild requires force

- **WHEN** an existing selected image must be intentionally regenerated through raw `unified_pipeline`
- **THEN** the invocation includes both `--only <ids>` and `--force-images`
- **AND** `--only` by itself remains a scope selector rather than a regeneration request

#### Scenario: Reviewed full-page title rebuild is multi-command

- **WHEN** a full-page title change requires new reviewed image evidence
- **THEN** selected Stage 2 regeneration MAY run through pilot with `--force-images`
- **AND** final assembly reuses the reviewed image without a second image generation

#### Scenario: Canonical names are not CLI values

- **WHEN** maintainers update help or guidance for refresh paths
- **THEN** they do not add `--chain`, canonical-name arguments, or a new machine-readable path enum
