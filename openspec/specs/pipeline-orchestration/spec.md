## Purpose

Define how the five production stages are orchestrated: the whole pipeline runs on the Node.js 18+ runtime as directly-runnable ESM (`.mjs`, no build step), and the `unified_pipeline.mjs` entry point supports the three editing chains (Chain A: stages 1,3,4,5; Chain B: all stages; Chain C: stage 5 only), loads credentials from `.env`, and offers `--dry-run`, `--force-images`, and `--only <id>` while running Stage 2 via in-framework `stage2_generate_images.mjs` (no external skills). This capability guarantees that full builds and targeted edits share one orchestrator, so an iteration re-runs only the stages it actually needs.
## Requirements
### Requirement: Pipeline runs on Node.js runtime

整个生产管线 SHALL 在 Node.js 18+ 运行时上执行. 所有脚本 SHALL 以 ESM (`.mjs`) 编写, `node script.mjs` 直接运行, 无需编译.

#### Scenario: Agent runs pipeline on Windows

- **WHEN** Agent runs `node scripts/ppt_flow.mjs build <run_dir>` on Windows 11 with Node.js 20
- **THEN** all 5 stages complete successfully, producing a .pptx file

### Requirement: Unified pipeline supports editing chains

The unified pipeline entry point (`unified_pipeline.mjs`) SHALL support three editing chains: Chain A (stages 1,3,4,5), Chain B (all stages), Chain C (stage 5 only).

#### Scenario: Chain A skips image regeneration

- **WHEN** `--stage 1,3,4,5` is passed
- **THEN** Stage 2 (image generation) is skipped entirely
- **AND** pipeline completes in under 5 minutes for a standard deck

### Requirement: Unified pipeline orchestrates stages

`unified_pipeline.mjs` SHALL delegate to individual stage scripts, load credentials from `.env`, and support `--dry-run`, `--force-images`, `--only <id>`, and Stage 2 via in-framework `stage2_generate_images.mjs` + `make_contact_sheet.mjs`.

#### Scenario: Dry run reports stages without executing them

- **WHEN** `node unified_pipeline.mjs --stage all --dry-run` is run
- **THEN** the orchestrator reports the stage scripts it would invoke and the credentials it would load from `.env`
- **AND** no stage is actually executed

### Requirement: Shared slide-id resolution for --only

`unified_pipeline.mjs` SHALL resolve `--only` tokens via a shared helper also used by `ppt_flow`: exact id, then `sNN`/zero-padded prefix, then 1-based page index into `slide_plan.json`, then unique case-insensitive substring. Ambiguous or unknown tokens SHALL fail and list available ids.

#### Scenario: Prefix s03 resolves

- **WHEN** `--only s03` is passed and exactly one plan id starts with `s03`
- **THEN** Stage 2 processes that slide only

#### Scenario: Page number resolves

- **WHEN** `--only 3` is passed and the plan has at least three slides
- **THEN** Stage 2 targets the third slide's id

### Requirement: --preview uses preview readiness for Stage 2

When Stage 2 is included, `unified_pipeline.mjs` SHALL validate with **pipeline** readiness by default, and with **preview** readiness when `--preview` is set (style master required; metadata gates not required). `--preview` SHALL NOT mutate gate fields.

#### Scenario: Stage 2 with --preview while gates pending

- **WHEN** metadata gates are `pending`
- **AND** style master exists
- **AND** `unified_pipeline … --stage 2 --preview` runs
- **THEN** validation passes the gate check
- **AND** Stage 2 may proceed

#### Scenario: Stage 2 without --preview still needs gates

- **WHEN** metadata gates are `pending`
- **AND** `unified_pipeline … --stage 2` runs without `--preview`
- **THEN** validation fails with a gate-related error

### Requirement: Stage 2 regenerates only when --force-images is set

Stage 2 SHALL skip existing image files unless `--force-images` is set. Presence of `--only` SHALL NOT by itself force regeneration.

#### Scenario: --only without force skips existing files

- **WHEN** `--only <id>` is set, the image file exists, and `--force-images` is absent
- **THEN** Stage 2 skips that file and does not call the image API for it

#### Scenario: --force-images regenerates selection

- **WHEN** `--force-images` is set with or without `--only`
- **THEN** selected existing images are regenerated

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

