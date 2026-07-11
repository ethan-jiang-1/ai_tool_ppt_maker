## RENAMED Requirements

- FROM: `### Requirement: playbook/ directory contains five MD controllers`
- TO: `### Requirement: playbook/ directory contains the registered MD controllers`

## MODIFIED Requirements

### Requirement: playbook/ directory contains the registered MD controllers

`PPTMAKER_FRAMEWORK/playbook/` SHALL contain **eight** files: seven MD Controllers (`create-deck.md`, `edit-text.md`, `edit-visual.md`, `edit-notes.md`, `restructure-slides.md`, `iterate-style.md`, `quick-preview.md`) plus one shared node file `classify-change.md`. Each MD Controller SHALL be self-contained and define an ordered sequence of nodes; `classify-change.md` is a shared node (`shared: true`) referenced by the chain playbooks via `includes:`.

#### Scenario: Agent lists available playbooks

- **WHEN** Agent lists `PPTMAKER_FRAMEWORK/playbook/`
- **THEN** it sees seven MD Controllers plus the shared node `classify-change.md`

### Requirement: COMMANDS.md is a routing table

`PPTMAKER_FRAMEWORK/COMMANDS.md` SHALL map natural-language user intents to playbook names. Each row SHALL include: example user input, target playbook, and any entry parameters. Agent SHALL read COMMANDS.md to classify user intent, then read the target playbook to execute. COMMANDS.md SHALL include an **探索 & 预览** (explore & preview) section—placed between full-create and post-PPTX iteration sections—that routes pre-commitment visual iteration and three-slide pilot preview intents to `iterate-style` and `quick-preview` respectively. Those intents SHALL NOT route to post-PPTX `edit-visual`.

#### Scenario: Agent routes user request to correct playbook

- **WHEN** user says "第8页的图重新生成"
- **THEN** Agent reads COMMANDS.md, classifies as `edit-visual`, and loads `playbook/edit-visual.md`

#### Scenario: Agent routes style iteration explore intent

- **WHEN** user says "先定视觉方向，反复打磨 style master"
- **THEN** Agent reads COMMANDS.md, classifies as `iterate-style`, and loads `playbook/iterate-style.md`

#### Scenario: Agent routes quick preview intent

- **WHEN** user says "内容有了，先出 3 页典型页看看效果"
- **THEN** Agent reads COMMANDS.md, classifies as `quick-preview`, and loads `playbook/quick-preview.md`

### Requirement: Gates are enforced at node boundaries

No node SHALL transition to `completed` until its exit gate conditions are met. Gates that require human judgment (the `content` and `visual` gates, tracked under `gates` in `_state/state.yaml`) SHALL remain `pending` until the human explicitly approves or waives them (via Agent conversation or `scripts/ppt_flow.mjs approve`). CLI scripts SHALL read `_state/state.yaml` to verify gate status before executing. For playbook nodes that review visual artifacts (style master, pilot contact sheet, and equivalent)—including `create-deck` setup, `iterate-style` review-gate, `quick-preview` review-preview, and `edit-visual` pilot review—the agent SHALL present/open the artifact to the user before treating the human judgment as satisfied. Description alone SHALL NOT complete the gate when the file exists.

#### Scenario: Production node blocked by pending visual gate

- **WHEN** Stage 2 (image generation) is about to start
- **THEN** the CLI script reads `_state/state.yaml` and finds `gates.visual` is `pending`
- **AND** the script refuses to run and reports that the visual gate must be approved or waived

#### Scenario: Visual review gate requires show

- **WHEN** a playbook review node is evaluating `style_master.jpg` or a pilot contact sheet that exists on disk
- **THEN** the agent opens or presents that file to the user before recording approval
- **AND** does not mark the gate approved based only on a textual description of the image

## ADDED Requirements

### Requirement: Explore playbooks cover pre-commitment style and pilot preview

`iterate-style.md` SHALL define a loop for iterating the style master before full production lock: read/tweak prompt → generate via existing `ppt_flow.mjs style-master` at 1k while iterating → human review with open image → RETRY, BACK, or LOCK. On LOCK it SHALL approve the visual gate via existing approve flow and MAY regenerate at 2k; if entered via playbook stack from `create-deck`, it SHALL resume the prior playbook afterward. It SHALL record iteration `round` in node status extra when available and SHOULD advise a direction change or accept when round ≥ 5. `quick-preview.md` SHALL require content and visual gates already approved or waived, then define validate → `ppt_flow.mjs pilot` → human review of the contact sheet (open required) with PROCEED / RETRY / BACK exits. Neither playbook SHALL require new CLI commands. Recommended ordering: lock visual (optionally via `iterate-style`) before `quick-preview` before full `build`.

#### Scenario: User iterates style master

- **WHEN** user wants to refine visual direction before locking
- **THEN** Agent loads `iterate-style` and runs generate/review until LOCK or BACK
- **AND** uses existing `style-master` / `approve` CLI rather than ad-hoc scripts

#### Scenario: User requests three-slide preview

- **WHEN** content and visual gates are approved or waived and user wants a quick look before full build
- **THEN** Agent loads `quick-preview`, runs validate and pilot, and presents the contact sheet
- **AND** does not claim to produce a partial PPTX

#### Scenario: Quick preview blocked without gates

- **WHEN** visual or content gate is still pending
- **THEN** `quick-preview` validate/pilot path fails or refuses in line with existing `pilot` gate checks
- **AND** Agent directs the user to finish content/visual lock (e.g. `iterate-style` or `create-deck` setup) first
