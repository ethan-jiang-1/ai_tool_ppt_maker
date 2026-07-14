## RENAMED Requirements

- FROM: `### Requirement: Chain playbooks cover iteration workflows`
- TO: `### Requirement: Iteration playbooks resolve semantic paths`

## MODIFIED Requirements

### Requirement: Iteration playbooks resolve semantic paths

`edit-text.md`, `edit-visual.md`, `edit-notes.md`, and `restructure-slides.md` SHALL each define a shortened workflow for iterative changes. Each SHALL begin with change classification and end with an intent-specific, globally unique verification node. Playbook names SHALL describe user intent; resolved render mode, content ownership, stale artifacts, and structural scope SHALL determine execution.

The text-edit controller SHALL be limited to structured KICKER/TITLE/SUBTITLE intent and use the public `ppt_flow refresh --kind title` path. Resolved `body+header-lock` SHALL use Header Text & Style Refresh without Stage 2. Resolved `full-page` SHALL use Generated Image Rebuild with selected forced image regeneration, pilot/header review evidence, and reviewed-image reuse for final assembly. Generated body labels, KPI/card/chart text, cases, and other image-owned content SHALL NOT be routed through header text editing.

Header Text & Style Refresh MAY also cover Stage-3-owned font, color, position, line-height, spacing, and text-width changes when the existing raw-image safe-zone contract remains valid. Header safe-zone height, render-mode switches, and any other raw-image contract change SHALL use Generated Image Rebuild.

`restructure-slides.md` SHALL enter Structural Versioning Path for add/delete/reorder: create a clean downstream version first, update structure/source there, then rebuild affected slides through the applicable refresh path(s). Structural Versioning Path SHALL NOT be presented as a fourth peer artifact-refresh path.

#### Scenario: User requests a body-lock title change

- **WHEN** user says "第5页标题改一下"
- **AND** Stage 1 resolves slide 5 as `body+header-lock`
- **THEN** COMMANDS.md routes through change classification to the text-edit controller
- **AND** the controller invokes `ppt_flow refresh --kind title` for the selected slide
- **AND** Agent completes Header Text & Style Refresh and verifies the output

#### Scenario: User requests a full-page title change

- **WHEN** user says "第5页标题改一下"
- **AND** Stage 1 resolves slide 5 as `full-page`
- **THEN** `ppt_flow refresh --kind title` reports the current full-page review requirement instead of silently using Header Text & Style Refresh
- **AND** Agent performs Generated Image Rebuild for the selected image, reviews/approves current header evidence, then completes refresh/build without a second image generation

#### Scenario: User requests a generated body-text change

- **WHEN** user changes a KPI, card label, chart label, case, or other content burned into the generated image
- **THEN** change classification selects the generated-image/visual controller and Generated Image Rebuild
- **AND** it does not send unsupported body fields to `edit-text`

#### Scenario: User changes header overlay styling only

- **WHEN** header font, color, position, spacing, or line-height changes without changing the raw-image contract
- **THEN** the affected `body+header-lock` slides use Header Text & Style Refresh without Stage 2

#### Scenario: User changes header safe-zone geometry

- **WHEN** a safe-zone or render-mode change alters the Stage 2 prompt/image contract
- **THEN** the affected slides use Generated Image Rebuild with required force and review

#### Scenario: User requests a visual redesign

- **WHEN** user says "换个配色"
- **THEN** COMMANDS.md routes to playbook `edit-visual`
- **AND** Agent runs the existing three-slide representative pilot before full regeneration

#### Scenario: User requests a structural addition

- **WHEN** user asks to add a slide
- **THEN** `restructure-slides` creates a clean new version before editing the slide set
- **AND** the new/affected slides subsequently use their resolved refresh paths

#### Scenario: User requests notes only

- **WHEN** only speaker notes change
- **THEN** `edit-notes` uses Notes-Only Refresh through Stage 5
- **AND** existing image/header evidence remains unchanged

### Requirement: Pilot review gates content full-page header quality before full build

When a deck contains content `full-page` slides, a pilot used to approve full build SHALL review at least one such slide, and at least two when the deck contains two or more, so cross-page consistency is observable. Automatic selection is governed by `pipeline-orchestration`; when explicit `--only` selection does not provide the required coverage, the Agent SHALL run an additional pilot subset before approval rather than silently treating the gate as satisfied. During contact-sheet review, the Agent SHALL explicitly inspect header text accuracy/completeness, readability, position, size, fixed left alignment, cross-page consistency, and body overlap. If a defect is visible, the Agent SHALL identify the affected slide and recommend adding that slide to `render.header-lock`; it SHALL NOT modify policy without user confirmation. After confirmation, the affected image SHALL be regenerated through Generated Image Rebuild with forced image regeneration and reviewed again. The visual review SHALL NOT be treated as passed, and full build SHALL NOT proceed, until the defect is resolved or the user explicitly accepts the documented risk.

If the user explicitly accepts an unresolved header risk, the Agent SHALL persist the affected slide ids and accepted symptoms in the version Change Log or playbook state extra. Header-lock SHALL be proposed for a slide that deviates from the configured target; a request to change the target geometry across the deck SHALL instead be classified as a visual-config change with the corresponding broader rerun.

After each reviewed pilot batch, the Agent SHALL run `ppt_flow approve <run-dir> header`. The command persists/merges `reviewed_content_full_page_ids`, `reviewed_changed_full_page_ids`, per-slide image hashes and `full_page_header_snapshot`, a deterministic `header_review_fingerprint`, and accepted-risk ids/symptoms under the current version's `nodes.header-review.by_version` record. The fingerprint SHALL cover all current full-page slides and shared content header geometry. If coverage remains incomplete, the Agent SHALL follow the CLI's remaining-coverage output and run another pilot batch; it SHALL not treat an `in_progress` record as approval. Before full build it SHALL require the current version record to be completed and current even when the ordinary visual gate is already `approved`. For accepted risk the Agent SHALL use `approve header --waive --only <ids> --reason <text>`. It SHALL NOT instruct the user to hand-edit `_state`.

#### Scenario: Manual pilot selection cannot bypass coverage
- **WHEN** a deck has at least two content full-page slides but explicit `--only` pilot selection contains fewer than two
- **THEN** the Agent runs an additional content full-page pilot subset before treating visual review as passed

#### Scenario: Header drift blocks silent progression
- **WHEN** pilot review shows an inaccurate, blurry, displaced, inconsistently sized, misaligned, or body-overlapping content header
- **THEN** the Agent shows and names the issue and proposes header-lock for the affected slide
- **AND** does not silently approve the visual review or start full build

#### Scenario: Confirmed remedy uses Generated Image Rebuild
- **WHEN** the user approves upgrading an affected full-page slide to header-lock
- **THEN** the Agent updates the policy, regenerates that slide image with `--force-images`, and repeats visual review

#### Scenario: Existing visual approval does not bypass stale header evidence
- **WHEN** the visual gate is already approved but content full-page header evidence is absent or its fingerprint no longer matches
- **THEN** the playbook does not start full build until the required pages are regenerated and reviewed

#### Scenario: Notes change preserves header evidence
- **WHEN** only speaker notes change after a valid header review
- **THEN** the existing header-review fingerprint remains usable
