## MODIFIED Requirements

### Requirement: COMMANDS.md covers refresh and structural paths

COMMANDS.md SHALL document user intents with concrete Chinese-language examples and descriptive playbook routes. It SHALL NOT require the user to choose an editing-chain letter or know a slide ID before speaking. Agent-facing explanation SHALL distinguish the three English canonical refresh paths from the outer Structural Versioning Path and SHALL show that pages can be referenced by current position or a stable, voice-friendly mnemonic:

| User says (example) | Intent route | Resolved execution explanation | Est. time |
|---------------------|-------------|--------------------------------|-----------|
| "第5页标题不够有力" | `edit-text` | Stage 1 resolves Header Text & Style Refresh or Generated Image Rebuild by render mode | ~5 min or ~5 min/page |
| "把 UX gap 那页标题收紧" | `edit-text` | Resolve the mnemonic to its formal ID, then choose refresh by render mode | ~5 min or ~5 min/page |
| "第8页的图重新生成一张" | `edit-visual` | Generated Image Rebuild for the selected page | ~5 min/page |
| "备注改一下" | `edit-notes` | Notes-Only Refresh | ~30 sec |
| "删掉第5页和第11页" | `restructure-slides` | Snapshot-resolved preview, hash-bound confirmation, Structural Versioning Path, then local rebuild from verified raw renders | usually no remote render |
| "把 ID fix 放到 AI cost 后面" | `restructure-slides` | Spoken mnemonic resolution, preview/hash-bound apply, then local order-dependent rebuild | usually no remote render |
| "加一页案例" | `restructure-slides` | Agent proposes a stable mnemonic; preview/confirm Structural Versioning Path; report `needs_render`, then explicitly rebuild the inserted page | per inserted/changed slides |

#### Scenario: User asks to change a slide's visual style

- **WHEN** user says "第8页的图重新生成一张"
- **THEN** COMMANDS.md routes to `edit-visual`
- **AND** agent-facing guidance identifies Generated Image Rebuild, selected forced regeneration, and required review

#### Scenario: User asks for a full color palette change

- **WHEN** user says "全部换成蓝色系"
- **THEN** COMMANDS.md shows this requires `--force-images` for all slides, suggests pilot of 3 slides first

#### Scenario: User asks to add a slide

- **WHEN** user says "加一页案例"
- **THEN** COMMANDS.md routes to `restructure-slides` and a preview-first Structural Versioning Path before generated-image rebuilding
- **AND** explains that the Agent proposes a short stable mnemonic, structure apply makes no remote call, and only reported `needs_render` IDs need explicit expensive work
- **AND** does not classify the addition as a peer Generated Image Rebuild-only change

#### Scenario: User reorders by spoken mnemonic

- **WHEN** user says "把 ID fix 放到 AI cost 后面"
- **THEN** COMMANDS.md routes to `restructure-slides`, resolves both mnemonic selectors, and shows a before/after preview
- **AND** does not require `@`, exact capitalization, or a random-code spelling

## ADDED Requirements

### Requirement: Structural command guidance is preview-first and identity-aware

COMMANDS.md and `scripts/change-classifier.md` SHALL explain the structural UX using the same concepts: current `position` is convenient but snapshot-scoped; formal `slide_id` remains stable across reordering; the combined display is `position + slide_id + title`; all position selectors in one request resolve before any edit; and a mutating structure operation requires preview followed by explicit apply bound to the preview's canonical plan hash. The Agent SHALL carry that hash; user-facing guidance SHALL not ask the user to type or pronounce it. Guidance SHALL route deterministic list, resolution, normalization, move, delete, insert, and multi-operation work through `ppt_flow slides` rather than instructing the Agent to split/reorder Markdown with ad hoc edits.

The reference SHALL explain that reorder/delete-only normally materialize verified expensive raw renders and rebuild Stage 3 and later cheap outputs locally, while inserted or unproven IDs are reported as `needs_render` and follow an explicit Generated Image Rebuild only after authorization. Structural apply/materialization SHALL be documented as renderer-free. It SHALL retain the rule that `_generated/` is never hand-edited or manually copied between versions.

The reference SHALL document the escape ladder: heading-only current-version repair; same-deck clean vNext; explicit missing-render rebuild in vNext; and a new-deck recommendation when audience, objective, or narrative materially changes. Git MAY be recommended separately as source/control rollback and audit, but SHALL not replace run-bundle versions or become a PPT creation prerequisite.

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
