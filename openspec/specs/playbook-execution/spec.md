## Purpose

Define how MD Controller playbooks under `PPTMAKER_FRAMEWORK/playbook/` drive an agent through a deck's lifecycle: the registered playbook files (eight MD Controllers plus the shared `classify-change.md` node, including explore playbooks `iterate-style` / `quick-preview` and the off-path `migrate-import` playbook), the 11-node `create-deck` creation flow and the shortened edit chains, intent routing via `COMMANDS.md`, state initialization on playbook start, gate enforcement at node boundaries (including show-before-approve for visual reviews), and shared-node reuse via `includes:`. This capability guarantees that user intent maps to exactly one playbook, that human-judgment gates (content and visual) block progression until explicitly approved or waived, and that execution state lives in `_state/state.yaml` alongside the static `project-metadata.yaml`.

## Requirements

### Requirement: playbook/ directory contains the registered MD controllers

`PPTMAKER_FRAMEWORK/playbook/` SHALL contain **nine** files: eight MD Controllers (`create-deck.md`, `edit-text.md`, `edit-visual.md`, `edit-notes.md`, `restructure-slides.md`, `iterate-style.md`, `quick-preview.md`, `migrate-import.md`) plus one shared node file `classify-change.md`. Each MD Controller SHALL be self-contained and define an ordered sequence of nodes; `classify-change.md` is a shared node (`shared: true`) referenced by the chain playbooks via `includes:`.

#### Scenario: Agent lists available playbooks

- **WHEN** Agent lists `PPTMAKER_FRAMEWORK/playbook/`
- **THEN** it sees eight MD Controllers plus the shared node `classify-change.md`

### Requirement: create-deck playbook covers complete deck creation

`create-deck.md` SHALL define the complete workflow for creating a new PPT from scratch. It SHALL use 11 nodes: instantiation, hitl1, setup, seed-topics, wave0, wave1, wave2, hitl2, readiness, rerun, final. Node order SHALL be: instantiation → hitl1 → setup → seed-topics → wave0 → wave1 → wave2 → hitl2 → (rerun → seed-topics | readiness → final).

#### Scenario: User says "帮我做一个PPT"

- **WHEN** user requests a new PPT
- **THEN** COMMANDS.md routes to playbook `create-deck`
- **AND** Agent starts executing from node `instantiation`

### Requirement: Chain playbooks cover iteration workflows

`edit-text.md`, `edit-visual.md`, `edit-notes.md`, and `restructure-slides.md` SHALL each define a shortened workflow for iterative changes. Each SHALL begin with change classification and end with exit verification.

#### Scenario: User requests a title change

- **WHEN** user says "第5页标题改一下"
- **THEN** COMMANDS.md routes to playbook `edit-text`
- **AND** Agent classifies the change, runs stages 1,3,4,5 targeting slide 5, and verifies the output

#### Scenario: User requests a visual redesign

- **WHEN** user says "换个配色"
- **THEN** COMMANDS.md routes to playbook `edit-visual`
- **AND** Agent runs a 3-slide pilot before full regeneration

### Requirement: COMMANDS.md is a routing table

`PPTMAKER_FRAMEWORK/COMMANDS.md` SHALL map natural-language user intents to playbook names. Each row SHALL include: example user input, target playbook, and any entry parameters. Agent SHALL read COMMANDS.md to classify user intent, then read the target playbook to execute. COMMANDS.md SHALL include an **探索 & 预览** section (pre-commitment style/pilot) and a **旁路 / 迁移** section—placed between explore and post-PPTX iteration—that routes migrate/import-existing-deck intents to `migrate-import`. Explore intents route to `iterate-style` / `quick-preview` and SHALL NOT route to post-PPTX `edit-visual`. Migrate/import intents SHALL NOT be handled by silently improvising outside a playbook, and SHALL NOT skip interaction-rhythm obligations (show, checkpoints, gates).

#### Scenario: Agent routes user request to correct playbook

- **WHEN** user says "第8页的图重新生成"
- **THEN** Agent reads COMMANDS.md, classifies as `edit-visual`, and loads `playbook/edit-visual.md`

#### Scenario: Agent routes style iteration explore intent

- **WHEN** user says "先定视觉方向，反复打磨 style master"
- **THEN** Agent reads COMMANDS.md, classifies as `iterate-style`, and loads `playbook/iterate-style.md`

#### Scenario: Agent routes quick preview intent

- **WHEN** user says "内容有了，先出 3 页典型页看看效果"
- **THEN** Agent reads COMMANDS.md, classifies as `quick-preview`, and loads `playbook/quick-preview.md`

#### Scenario: Agent routes migrate intent

- **WHEN** user says "把已有的 deck 迁到新框架"
- **THEN** Agent reads COMMANDS.md, classifies as `migrate-import`, and loads `playbook/migrate-import.md`

#### Scenario: Migrate must not skip playbook

- **WHEN** user asks to import or upgrade an existing deck into the framework tree
- **THEN** Agent loads `migrate-import` rather than improvising a silent file move with no show/gates

### Requirement: State file is created on playbook start

When a playbook begins execution, `_state/state.yaml` SHALL be created (if it does not exist) or validated/updated (if it already exists). The `playbook` and `current_node` fields SHALL be set as required by the playbook. Run-bundle init (`initBundle` via `bundle_layout --init` or `ppt_flow init`) SHALL seed `_state/` when absent, so the common path already has a state file before the first playbook node; playbook start MUST tolerate a pre-seeded file and MUST still create one if a legacy deck is missing it.

#### Scenario: Playbook start creates state when missing

- **WHEN** Agent executes node `instantiation` for the first time
- **AND** `_state/state.yaml` does not yet exist
- **THEN** `deck_<name>/_state/state.yaml` is created with `playbook: create-deck` and `current_node` reflecting instantiation

#### Scenario: Init-seeded state is accepted at playbook start

- **WHEN** a deck was initialized and `_state/state.yaml` already exists
- **AND** Agent begins playbook execution
- **THEN** Agent validates or updates the existing state
- **AND** does not fail merely because the file pre-exists

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

### Requirement: Migrate-import playbook guards off-path UX

`migrate-import.md` SHALL define an ordered workflow for bringing an existing deck or assets into a constitutional run bundle with nodes: `intake-source` (offer concrete migration strategies A/B/C for user recognition), `align-bundle`, `inventory-map` (mapping table confirmed before moves; visible checkpoints), `early-show` (open an existing visual when available, else degraded show), `reaffirm-gates` (show content outline/specs and visual artifacts before approve; dual-write metadata and `_state` gates; may `switchPlaybook` to `iterate-style`), and `handoff` (to `quick-preview` or `build` without silent long Stage-2). It SHALL NOT require new CLI commands. Supporting methodology SHALL live at `workflow/00-setup/05-migrate-import-existing-deck.md`. BOOTSTRAP SHALL point migrate/import intents at this playbook.

#### Scenario: Early show required during migrate

- **WHEN** Agent executes the early-show node and a `style_master.jpg` or equivalent visual exists
- **THEN** the agent opens or presents that file to the user before continuing
- **AND** does not mark the node complete based only on a textual description

#### Scenario: Gates reaffirmed after migrate map

- **WHEN** inventory mapping is complete and gates need approval or re-lock
- **THEN** the agent opens content specs/outline and visual artifacts before approve
- **AND** updates gates via existing `approve` plus `_state` setGate
- **AND** may switch to `iterate-style` if the visual direction is unsatisfactory

#### Scenario: Intake offers A/B/C strategies

- **WHEN** Agent starts `intake-source`
- **THEN** the user is offered strategies A (new init + copy in), B (in-place upgrade to three-tier), and C (loose assets into new bundle), with a recommendation

### Requirement: Shared nodes are referenced via includes

A playbook SHALL be able to reference a shared node via `includes: [<node-name>]` in its frontmatter. The referenced node SHALL be defined in a standalone `.md` file with `shared: true` in its frontmatter. Multiple playbooks SHALL be able to include the same shared node.

#### Scenario: classify-change shared by edit-text and edit-visual

- **WHEN** `edit-text.md` and `edit-visual.md` both need change classification
- **THEN** both declare `includes: [classify-change]` in their frontmatter
- **AND** `classify-change.md` exists as a standalone shared node with `shared: true`

### Requirement: State file coexists with project-metadata.yaml

`_state/state.yaml` SHALL coexist with the existing `project-metadata.yaml` in the run bundle root. The state file SHALL track execution progress (playbook, current_node, per-node status, playbook gates). The metadata file SHALL continue to track static configuration (deck_name, topic, audience, and pipeline gate fields). Scaffolded `_state/README.md` and the metadata template comment SHALL briefly document this coexistence so agents do not treat the two files as duplicates or merge them casually.

#### Scenario: Both files exist after init

- **WHEN** a run bundle is initialized
- **THEN** `deck_<name>/` contains both `project-metadata.yaml` (static config) and `_state/state.yaml` (execution state)
