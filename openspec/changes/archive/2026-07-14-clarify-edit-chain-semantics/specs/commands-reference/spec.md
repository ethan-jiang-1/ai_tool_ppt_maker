## RENAMED Requirements

- FROM: `### Requirement: COMMANDS.md covers all four editing chains`
- TO: `### Requirement: COMMANDS.md covers refresh and structural paths`

## MODIFIED Requirements

### Requirement: COMMANDS.md covers refresh and structural paths

COMMANDS.md SHALL document user intents with concrete Chinese-language examples and descriptive playbook routes. It SHALL NOT require the user to choose an editing-chain letter. Agent-facing explanation SHALL distinguish the three English canonical refresh paths from the outer Structural Versioning Path:

| User says (example) | Intent route | Resolved execution explanation | Est. time |
|---------------------|-------------|--------------------------------|-----------|
| "第5页标题不够有力" | `edit-text` | Stage 1 resolves Header Text & Style Refresh or Generated Image Rebuild by render mode | ~5 min or ~5 min/page |
| "第8页的图重新生成一张" | `edit-visual` | Generated Image Rebuild for the selected page | ~5 min/page |
| "备注改一下" | `edit-notes` | Notes-Only Refresh | ~30 sec |
| "加一页案例" | `restructure-slides` | Structural Versioning Path, then affected-slide refresh | per affected slides |

#### Scenario: User asks to change a slide's visual style

- **WHEN** user says "第8页的图重新生成一张"
- **THEN** COMMANDS.md routes to `edit-visual`
- **AND** agent-facing guidance identifies Generated Image Rebuild, selected forced regeneration, and required review

#### Scenario: User asks for a full color palette change

- **WHEN** user says "全部换成蓝色系"
- **THEN** COMMANDS.md shows this requires style-master alignment and `--force-images` for all affected slides
- **AND** suggests a representative three-slide pilot first

#### Scenario: User asks to add a slide

- **WHEN** user says "加一页案例"
- **THEN** COMMANDS.md routes to `restructure-slides` and Structural Versioning Path before any generated-image rebuilding
- **AND** does not classify the addition as a peer Generated Image Rebuild-only change

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
