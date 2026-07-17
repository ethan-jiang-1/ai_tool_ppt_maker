## MODIFIED Requirements

### Requirement: Structural command guidance is preview-first and identity-aware

COMMANDS.md and `scripts/change-classifier.md` SHALL explain the structural UX using the same concepts: current `position` is convenient but snapshot-scoped; formal `slide_id` remains stable across reordering; the combined display is `position + slide_id + title`; all position selectors in one request resolve before any edit; and a mutating structure operation requires preview followed by explicit apply bound to the preview's canonical plan hash. The Agent SHALL carry that hash; user-facing guidance SHALL not ask the user to type or pronounce it. Guidance SHALL route deterministic list, resolution, normalization, move, delete, insert, and multi-operation work through `ppt_flow slides` rather than instructing the Agent to split/reorder Markdown with ad hoc edits.

The reference SHALL explain that reorder/delete-only normally materialize verified expensive raw renders and rebuild Stage 3 and later cheap outputs locally, while inserted or unproven IDs are reported as `needs_render` and follow an explicit Generated Image Rebuild only after authorization. Structural apply/materialization SHALL be documented as renderer-free. It SHALL retain the rule that `_generated/` is never hand-edited or manually copied between versions.

The reference SHALL document the escape ladder: heading-only current-version repair; same-deck clean vNext; explicit missing-render rebuild in vNext; and a new-deck recommendation when audience, objective, or narrative materially changes. Git MAY be recommended separately as a user-owned source/control audit and comparison aid, but SHALL not replace run-bundle versions, become a PPT creation prerequisite, become a second ordering source, or be presented as a framework-provided in-place rollback command. This change SHALL not add a Git-history reader, source-content comparison, `git checkout`/`git restore` fallback, framework-owned source-file replacement, recovery receipt, or new source-recovery playbook. If a user asks to undo an accidental source edit with Git, guidance may explain that Git history belongs to the user-owned repository and that an Agent needs separate explicit authorization for any named Git operation and scope; it SHALL not choose or prescribe a generic recovery command as the default. After such independent authorization, the general Agent authorization rule applies, but this change still supplies no framework recovery protocol.

#### Scenario: User deletes two page numbers

- **WHEN** the user says "删掉第3页和第7页"
- **THEN** guidance says both positions are resolved from the same pre-edit snapshot and previewed together
- **AND** does not describe two sequential deletions whose second position can shift

#### Scenario: User asks why page number and ID both appear

- **WHEN** a human reads the structural editing section
- **THEN** they learn that position supports current conversational order while ID preserves page identity across versions
- **AND** they are not told that a compound value such as `07_UXGap` is the primary key

#### Scenario: Reorder-only scope is explained accurately

- **WHEN** guidance describes moving unchanged pages
- **THEN** it says verified expensive raw renders are retained while Stage 3/contact sheet/PPTX/notes are rebuilt locally
- **AND** it does not prescribe remote regeneration for every shifted page

#### Scenario: User confirms structure but not render cost

- **WHEN** an insertion preview is authorized and the resulting receipt reports `needs_render`
- **THEN** guidance treats the source vNext as successfully published but production as incomplete
- **AND** requests separate authorization before remote Generated Image Rebuild

#### Scenario: Major reframing is not forced into vNext

- **WHEN** the requested work materially changes audience, objective, or narrative
- **THEN** guidance recommends considering a new deck instead of presenting vNext as the only route

#### Scenario: Deck-version request preserves visible versions

- **WHEN** a user asks to revisit a prior deck version such as `v2`
- **THEN** guidance preserves all visible version directories and evaluates the current source/version context through the existing escape ladder
- **AND** it does not prescribe deleting `vN`, copying `vN` over another visible version, or treating a Git checkout as a deck-version replacement

#### Scenario: Source-history request is not overpromised

- **WHEN** a user asks to undo an accidental source edit using Git history
- **THEN** guidance keeps the request distinct from a visible deck-version change and states that this change adds no automated history reader, framework source replacement, or default recovery command
- **AND** it does not autonomously choose or prescribe a generic `git restore`, `git checkout`, reset, clean, or source-file mutation before the user separately authorizes the named operation and scope

#### Scenario: Git absence does not block normal correction

- **WHEN** a user has no Git executable, no worktree, or no first commit
- **THEN** guidance keeps normal source correction, Structural Versioning Path, and the repair/vNext/new-deck escape ladder available
- **AND** it does not characterize Git as a required workflow gate
