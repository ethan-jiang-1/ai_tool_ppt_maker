## ADDED Requirements

### Requirement: Pilot review gates content full-page header quality before full build

When a deck contains content `full-page` slides, a pilot used to approve full build SHALL review at least one such slide, and at least two when the deck contains two or more, so cross-page consistency is observable. Automatic selection is governed by `pipeline-orchestration`; when explicit `--only` selection does not provide the required coverage, the Agent SHALL run an additional pilot subset before approval rather than silently treating the gate as satisfied. During contact-sheet review, the Agent SHALL explicitly inspect header text accuracy/completeness, readability, position, size, fixed left alignment, cross-page consistency, and body overlap. If a defect is visible, the Agent SHALL identify the affected slide and recommend adding that slide to `render.header-lock`; it SHALL NOT modify policy without user confirmation. After confirmation, the affected image SHALL be regenerated through Chain B with forced image regeneration and reviewed again. The visual review SHALL NOT be treated as passed, and full build SHALL NOT proceed, until the defect is resolved or the user explicitly accepts the documented risk.

If the user explicitly accepts an unresolved header risk, the Agent SHALL persist the affected slide ids and accepted symptoms in the version Change Log or playbook state extra. Header-lock SHALL be proposed for a slide that deviates from the configured target; a request to change the target geometry across the deck SHALL instead be classified as a visual-config change with the corresponding broader rerun.

After each reviewed pilot batch, the Agent SHALL run `ppt_flow approve <run-dir> header`. The command persists/merges `reviewed_content_full_page_ids`, `reviewed_changed_full_page_ids`, per-slide image hashes and `full_page_header_snapshot`, a deterministic `header_review_fingerprint`, and accepted-risk ids/symptoms under the current version's `nodes.header-review.by_version` record. The fingerprint SHALL cover all current full-page slides and shared content header geometry. If coverage remains incomplete, the Agent SHALL follow the CLI's remaining-coverage output and run another pilot batch; it SHALL not treat an `in_progress` record as approval. Before full build it SHALL require the current version record to be completed and current even when the ordinary visual gate is already `approved`. For accepted risk the Agent SHALL use `approve header --waive --only <ids> --reason <text>`. It SHALL NOT instruct the user to hand-edit `_state`.

#### Scenario: Manual pilot selection cannot bypass coverage
- **WHEN** a deck has at least two content full-page slides but explicit `--only` pilot selection contains fewer than two
- **THEN** the Agent runs an additional content full-page pilot subset before treating visual review as passed

#### Scenario: Header drift blocks silent progression
- **WHEN** pilot review shows an inaccurate, blurry, displaced, inconsistently sized, misaligned, or body-overlapping content header
- **THEN** the Agent shows and names the issue and proposes header-lock for the affected slide
- **AND** does not silently approve the visual review or start full build

#### Scenario: Confirmed remedy uses Chain B
- **WHEN** the user approves upgrading an affected full-page slide to header-lock
- **THEN** the Agent updates the policy, regenerates that slide image with `--force-images`, and repeats visual review

#### Scenario: Existing visual approval does not bypass stale header evidence
- **WHEN** the visual gate is already approved but content full-page header evidence is absent or its fingerprint no longer matches
- **THEN** the playbook does not start full build until the required pages are regenerated and reviewed

#### Scenario: Notes change preserves header evidence
- **WHEN** only speaker notes change after a valid header review
- **THEN** the existing header-review fingerprint remains usable
