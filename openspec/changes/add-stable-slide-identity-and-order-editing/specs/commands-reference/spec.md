## MODIFIED Requirements

### Requirement: COMMANDS.md covers refresh and structural paths

COMMANDS.md SHALL document user intents with concrete Chinese-language examples and descriptive playbook routes. It SHALL NOT require the user to choose an editing-chain letter or know a slide ID before speaking. Agent-facing explanation SHALL distinguish the three English canonical refresh paths from the outer Structural Versioning Path and SHALL show that pages can be referenced by current position or a stable, voice-friendly mnemonic:

| User says (example) | Intent route | Resolved execution explanation | Est. time |
|---------------------|-------------|--------------------------------|-----------|
| "第5页标题不够有力" | `edit-text` | Stage 1 resolves Header Text & Style Refresh or Generated Image Rebuild by render mode | ~5 min or ~5 min/page |
| "把 UX gap 那页标题收紧" | `edit-text` | Resolve the mnemonic to its formal ID, then choose refresh by render mode | ~5 min or ~5 min/page |
| "第8页的图重新生成一张" | `edit-visual` | Generated Image Rebuild for the selected page | ~5 min/page |
| "备注改一下" | `edit-notes` | Notes-Only Refresh | ~30 sec |
| "删掉第5页和第11页" | `restructure-slides` | Snapshot-resolved preview, confirmation, Structural Versioning Path, then minimal affected refresh | per affected slides |
| "把 ID fix 放到 AI cost 后面" | `restructure-slides` | Spoken mnemonic resolution, preview/apply, then order-dependent rebuild | usually no remote render |
| "加一页案例" | `restructure-slides` | Agent proposes a stable mnemonic; preview/confirm Structural Versioning Path, then render the inserted page | per inserted/changed slides |

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
- **AND** explains that the Agent proposes a short stable mnemonic and only the inserted/changed IDs need expensive work
- **AND** does not classify the addition as a peer Generated Image Rebuild-only change

#### Scenario: User reorders by spoken mnemonic

- **WHEN** user says "把 ID fix 放到 AI cost 后面"
- **THEN** COMMANDS.md routes to `restructure-slides`, resolves both mnemonic selectors, and shows a before/after preview
- **AND** does not require `@`, exact capitalization, or a random-code spelling

## ADDED Requirements

### Requirement: Structural command guidance is preview-first and identity-aware

COMMANDS.md and `scripts/change-classifier.md` SHALL explain the structural UX using the same concepts: current `position` is convenient but snapshot-scoped; formal `slide_id` remains stable across reordering; the combined display is `position + slide_id + title`; all position selectors in one request resolve before any edit; and a mutating structure operation requires preview followed by explicit apply. Guidance SHALL route deterministic list, resolution, normalization, move, delete, insert, and multi-operation work through `ppt_flow slides` rather than instructing the Agent to split/reorder Markdown with ad hoc edits.

The reference SHALL explain that reorder/delete-only normally reuse verified render artifacts and rebuild order-dependent outputs, while inserted or content-changed IDs follow their owning refresh path. It SHALL retain the rule that `_generated/` is never hand-edited or manually copied between versions.

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
- **THEN** it says verified expensive artifacts are retained while plan/contact sheet/PPTX/notes order is rebuilt
- **AND** it does not prescribe remote regeneration for every shifted page
