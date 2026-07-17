## Purpose

Define `PPTMAKER_FRAMEWORK/COMMANDS.md`, the human-facing command reference that maps natural-language user requests to intent routes and ownership-aware execution. It covers the full-deck creation path (BOOTSTRAP → Phases 0–3), the three artifact-refresh paths plus the outer Structural Versioning Path, the agent's request-classification logic, and common iteration-feedback patterns. This capability guarantees that a human can discover — in under 60 seconds — what to say and roughly how long each change takes, while the detailed decision tree stays in `scripts/change-classifier.md` and is not duplicated here.
## Requirements
### Requirement: COMMANDS.md exists at framework root

`PPTMAKER_FRAMEWORK/COMMANDS.md` SHALL exist as a human-readable command reference. It SHALL map natural-language user requests to the agent actions that fulfill them.

#### Scenario: Human opens COMMANDS.md to learn what to say

- **WHEN** a human opens `COMMANDS.md`
- **THEN** they see a table of common requests with corresponding agent actions
- **AND** each row includes estimated duration

### Requirement: COMMANDS.md covers full-deck creation

COMMANDS.md SHALL document the entry path for creating a new PPT from scratch: the user says "帮我做一个PPT" and the agent follows BOOTSTRAP → Phase 0 (init) → Phase 1 (content design) → Phase 2 (visual style) → Phase 3 (production pipeline).

#### Scenario: First-time user wants to create a PPT

- **WHEN** user says "帮我做一个关于AI的PPT"
- **THEN** COMMANDS.md shows the path starts at BOOTSTRAP and walks through all phases

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

### Requirement: COMMANDS.md explains how the agent classifies requests

COMMANDS.md SHALL briefly explain the ordered decision logic: (1) does the change alter the slide set/order and therefore require Structural Versioning Path; (2) which component owns the changed content and which downstream artifact is stale; (3) how many slides are affected; (4) whether pilot/review is required. It SHALL NOT classify solely from the surface nouns text/visual/notes.

#### Scenario: Human understands the agent's reasoning

- **WHEN** a human reads the classification section of COMMANDS.md
- **THEN** they understand that the agent resolves ownership and impact before executing
- **AND** they can predict why two text-looking changes may use different refresh paths

### Requirement: COMMANDS.md covers iteration feedback patterns

COMMANDS.md SHALL document common iteration feedback beyond simple single-slide edits. Content reframe may affect backbone; case or data changes SHALL be routed by where the content is owned; vague aesthetic feedback maps to visual direction and may require style-master regeneration.

#### Scenario: User changes generated body data

- **WHEN** the user asks to update KPI values, card text, chart labels, cases, or other text burned into generated images
- **THEN** COMMANDS.md routes through Generated Image Rebuild for affected pages
- **AND** does not describe the request as Header Text & Style Refresh merely because the user changed words or numbers

#### Scenario: User changes only header text or overlay style

- **WHEN** the user changes KICKER/TITLE/SUBTITLE or Stage-3-owned header font/color/position settings on a resolved `body+header-lock` slide
- **THEN** the resolved execution path is Header Text & Style Refresh without Stage 2

#### Scenario: User changes the header safe zone

- **WHEN** the user changes header safe-zone height, render mode, or another setting that changes the raw-image contract
- **THEN** the resolved execution path is Generated Image Rebuild
- **AND** the change is not classified as Header Text & Style Refresh merely because it concerns the header

#### Scenario: User gives vague aesthetic feedback

- **WHEN** user says "整体感觉不够高端"
- **THEN** COMMANDS.md shows this maps to visual direction change
- **AND** agent will suggest 2-3 alternative visual presets before regenerating anything

### Requirement: COMMANDS.md complements but does not duplicate scripts/change-classifier.md

COMMANDS.md SHALL be the human-facing interface. `scripts/change-classifier.md` SHALL remain as the agent's detailed decision tree. COMMANDS.md SHALL be concise (no nested decision trees), use natural language examples, and be scannable in under 60 seconds.

#### Scenario: Human scans COMMANDS.md quickly

- **WHEN** a human scans COMMANDS.md for 30 seconds
- **THEN** they can identify which type of change their request falls under
- **AND** they know roughly how long it will take

### Requirement: Title-edit intents route by resolved render mode

`COMMANDS.md` and its target playbooks SHALL treat a request to change KICKER, TITLE, or SUBTITLE as an intent that requires Stage 1 resolution before selecting the refresh path. The routing table MAY initially name the `edit-text` controller, but that controller SHALL invoke `ppt_flow refresh --kind title` so centralized runtime logic inspects `layout_contract.render_mode`: resolved `body+header-lock` uses Header Text & Style Refresh; resolved `full-page` uses Generated Image Rebuild with selected regeneration and header-review obligations.

#### Scenario: Natural-language title edit targets a body-lock slide

- **WHEN** the user asks to change a title and the selected slide resolves to `body+header-lock`
- **THEN** the text-edit controller uses `ppt_flow refresh --kind title` for the selected slide
- **AND** the runtime uses Stage 1 followed by Stages 3,4,5 without regenerating the image

#### Scenario: Natural-language title edit targets a full-page slide

- **WHEN** the user asks to change a title and the selected slide resolves to `full-page`
- **THEN** the runtime reports `TITLE_REVIEW_REQUIRED` until current reviewed evidence exists
- **AND** the agent regenerates only the affected image with forced image generation
- **AND** obtains current header review evidence before completing the build

#### Scenario: Mixed title edit requires explicit scope

- **WHEN** a title-edit request affects both render modes and no slide scope is provided
- **THEN** routing fails safely with a request for affected slide selection
- **AND** does not silently apply Header Text & Style Refresh to the full-page slides

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
