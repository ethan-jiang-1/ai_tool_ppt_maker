## Purpose

Define `PPTMAKER_FRAMEWORK/COMMANDS.md`, the human-facing command reference that maps natural-language user requests to the agent actions that fulfill them. It covers the full-deck creation path (BOOTSTRAP → Phases 0–3), the four editing chains (text / visual / notes / structural), the agent's request-classification logic, and common iteration-feedback patterns. This capability guarantees that a human can discover — in under 60 seconds — what to say and roughly how long each change takes, while the detailed decision tree stays in `scripts/change-classifier.md` and is not duplicated here.
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

### Requirement: COMMANDS.md covers all four editing chains

COMMANDS.md SHALL document the four change types with concrete Chinese-language examples:

| User says (example) | Chain | Stages | Est. time |
|---------------------|-------|--------|-----------|
| "第5页标题不够有力" | A (text) | 1,3,4,5 | ~5 min |
| "换个配色试试" | B (visual) | 1,2,3,4,5 | ~5 min/page |
| "备注改一下" | C (notes) | 5 | ~30 sec |
| "加一页案例" | Structural | new-version | per slides |

#### Scenario: User asks to change a slide's visual style

- **WHEN** user says "第8页的图重新生成一张"
- **THEN** COMMANDS.md shows this is Chain B, stages all, targeting slide 8, ~5 min

#### Scenario: User asks for a full color palette change

- **WHEN** user says "全部换成蓝色系"
- **THEN** COMMANDS.md shows this requires `--force-images` for all slides, suggests pilot of 3 slides first

### Requirement: COMMANDS.md explains how the agent classifies requests

COMMANDS.md SHALL include a brief explanation of the agent's decision logic: (1) what changed? (text/visual/notes/structure), (2) how many slides affected? (1/few/all), (3) pilot recommended?

#### Scenario: Human understands the agent's reasoning

- **WHEN** a human reads the classification section of COMMANDS.md
- **THEN** they understand that the agent classifies changes before executing
- **AND** they can predict what the agent will do for a given request

### Requirement: COMMANDS.md covers iteration feedback patterns

COMMANDS.md SHALL document common iteration feedback patterns beyond simple single-slide edits: "这段论证逻辑有问题" (content reframe, may affect backbone), "每页的数据都更新一下" (bulk text change, Chain A all slides), "整体感觉不够高端" (visual direction change, requires style master regeneration).

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

`COMMANDS.md` and its target playbooks SHALL treat a request to change KICKER, TITLE, or SUBTITLE as an intent that requires Stage 1 resolution before selecting the execution chain. The routing table MAY initially name the `edit-text` controller, but that controller SHALL invoke `ppt_flow refresh --kind title` so centralized runtime logic inspects `layout_contract.render_mode` and routes `body+header-lock` slides to Chain A and `full-page` slides to Chain B with image/header review obligations.

#### Scenario: Natural-language title edit targets a body-lock slide

- **WHEN** the user asks to change a title and the selected slide resolves to `body+header-lock`
- **THEN** the text-edit controller uses `ppt_flow refresh --kind title` for the selected slide
- **AND** the runtime uses stages 1,3,4,5 without regenerating the image

#### Scenario: Natural-language title edit targets a full-page slide

- **WHEN** the user asks to change a title and the selected slide resolves to `full-page`
- **THEN** the runtime reports `TITLE_REVIEW_REQUIRED` until current reviewed evidence exists
- **AND** the agent regenerates only the affected image with forced image generation
- **AND** obtains current header review evidence before completing the build

#### Scenario: Mixed title edit requires explicit scope

- **WHEN** a title-edit request affects both render modes and no slide scope is provided
- **THEN** routing fails safely with a request for affected slide selection
- **AND** does not silently apply Chain A to the full-page slides
