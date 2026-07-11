## Purpose

Define how MD Controller playbooks under `PPTMAKER_FRAMEWORK/playbook/` drive an agent through a deck's lifecycle: the registered playbook files (nine MD Controllers plus the shared `classify-change.md` node, including explore playbooks `iterate-style` / `quick-preview`, the off-path `migrate-import` playbook, and channel-health `probe-image-channels`), the 11-node `create-deck` creation flow and the shortened edit chains, intent routing via `COMMANDS.md`, state initialization on playbook start, gate enforcement at node boundaries (including show-before-approve for visual reviews), and shared-node reuse via `includes:`. This capability guarantees that user intent maps to exactly one playbook, that human-judgment gates (content and visual) block progression until explicitly approved or waived, and that execution state lives in `_state/state.yaml` alongside the static `project-metadata.yaml`.

## Requirements

### Requirement: playbook/ directory contains the registered MD controllers

`PPTMAKER_FRAMEWORK/playbook/` SHALL contain **ten** files: nine MD Controllers (`create-deck.md`, `edit-text.md`, `edit-visual.md`, `edit-notes.md`, `restructure-slides.md`, `iterate-style.md`, `quick-preview.md`, `migrate-import.md`, `probe-image-channels.md`) plus one shared node file `classify-change.md`. Each MD Controller SHALL be self-contained and define an ordered sequence of nodes; `classify-change.md` is a shared node (`shared: true`) referenced by the chain playbooks via `includes:`.

#### Scenario: Agent lists available playbooks

- **WHEN** Agent lists `PPTMAKER_FRAMEWORK/playbook/`
- **THEN** it sees nine MD Controllers plus the shared node `classify-change.md`
- **AND** those controllers include `probe-image-channels.md`

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

COMMANDS.md SHALL also include an **环境 / 画画通道** section, placed between the **旁路 / 迁移** and **迭代打磨** sections, that routes channel-health intents to `probe-image-channels`. That section SHALL list **multiple** example phrasings spanning direct asks and **symptom language** (so users need not know the playbook or `doctor --probe-vendors` flag names), including at least: which drawing/image channel works; try image API vendors; image gen 502 / relay down; cannot generate images; switch drawing provider; which vendor is faster.

COMMANDS.md SHALL also include a **续跑 / 做到哪了** section (or equivalent rows in Agent 路由逻辑) that routes continue / where-am-I / disconnected-session intents to the **session resume ritual** (read `_state` + artifacts via `ppt_flow state`/`status`, explain whole-workflow position in plain language, load the **active** playbook at `current_node`) — NOT to restart `create-deck` from its first node, and NOT to answer with playbook filename alone. Example phrasings SHALL include at least: continue / pick up where we left off; where did we leave off; cleared the chat, continue; disconnected / came back, what was I doing. The Agent 路由逻辑 SHALL state: when `_state/state.yaml` shows in-progress work for an existing `deck_*`, continue from `current_node` after reporting workflow position; only a confirmed greenfield request starts a playbook at its first node.

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

#### Scenario: Agent routes symptom language to channel probe

- **WHEN** user says "出图老是 502" or "画画通道是不是挂了"
- **THEN** Agent reads COMMANDS.md, classifies as `probe-image-channels`, and loads that playbook

#### Scenario: Agent routes direct channel-health ask

- **WHEN** user says "哪个画画通道是通的"
- **THEN** Agent loads `probe-image-channels`

#### Scenario: Agent routes continue intent to resume ritual

- **WHEN** user says "接着做" or "上次做到哪了" or "清了聊天继续" or "断线了，我做到哪了"
- **AND** an existing `deck_*` has in-progress `_state`
- **THEN** Agent follows the session resume ritual, reports whole-workflow position, and continues the active playbook at `current_node`
- **AND** does not restart `create-deck` from its first node

### Requirement: Existing-deck sessions start with whole-workflow resume ritual

When the user points at an existing `deck_*`, asks where they left off, or returns after disconnect/clear-context, the agent SHALL run the **session resume ritual** **before** greenfield intake or restarting a playbook from its first node: (1) `ppt_flow state` and `ppt_flow status` (pointer + artifacts/gates), (2) read playbook pointer plus optional `waiting_for`, (3) explain **whole-workflow position** in plain language — prefer the resume card’s `workflow_summary` / `suggested_next` (execution point + artifact/gate situation — not playbook filename alone), (4) load `playbook/<name>.md` and continue at `current_node` after `checkEntry`, (5) confirm continuation. This ritual is **not** a new playbook. Conversation context alone SHALL NOT be treated as progress truth. Explicit user confirmation is required before discarding in-progress state to restart from scratch.

A known truth-aligned example for manual verification is `deck_ai_sdlc_keynote` (playbook `iterate-style`, node `review-gate`, `waiting_for: user:review-style-master`) — agents SHALL treat such a deck as session resume, not greenfield intake; after ritual the next human step is typically open style master → LOCK / RETRY / BACK.

#### Scenario: Cleared chat resumes from current_node

- **WHEN** a new agent session is given only a path to an in-progress `deck_*`
- **THEN** the agent runs `ppt_flow state` (or equivalent `readState`) and continues at `current_node`
- **AND** does not re-run greenfield intake as the default

#### Scenario: Novice asks where they left off

- **WHEN** user asks "我原来做到哪儿了" after a disconnect
- **AND** the deck has in-progress `_state`
- **THEN** the agent reports a plain-language whole-workflow position (pointer + waiting/artifacts as relevant)
- **AND** offers to continue from that point

#### Scenario: Restart from scratch requires confirmation

- **WHEN** `_state` shows in-progress work
- **AND** the user asks to start the deck over
- **THEN** the agent confirms before overwriting or resetting playbook progress

#### Scenario: Truth-aligned keynote deck resumes at review-gate

- **WHEN** Agent opens `deck_ai_sdlc_keynote` after a cleared session and `_state` points at `iterate-style` / `review-gate`
- **THEN** the agent continues that playbook/node (e.g. open style master / LOCK path)
- **AND** does not restart `migrate-import` or `create-deck` from the first node

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

No node SHALL transition to `completed` until its exit gate conditions are met. Gates that require human judgment (the `content` and `visual` gates, tracked under `gates` in `_state/state.yaml`, with pipeline readiness also reflected in `project-metadata.yaml` `content_gate`/`visual_gate`) SHALL remain `pending` until the human explicitly approves or waives them (via Agent conversation or `scripts/ppt_flow.mjs approve`).

For **production** image generation (full `build`, or `unified_pipeline` Stage 2 **without** `--preview`), CLI validation SHALL require metadata gates `approved` or `waived` (pipeline readiness via `checkBundle`). For **preview** generation (`ppt_flow pilot` and Stage 2 **with** `--preview`), CLI validation SHALL require style master but SHALL NOT require gates approved/waived, and SHALL NOT write `waived` to unlock preview.

For playbook nodes that review visual artifacts (style master, pilot contact sheet, and equivalent)—including `create-deck` setup, `iterate-style` review-gate, `quick-preview` review-preview, and `edit-visual` pilot review—the agent SHALL present/open the artifact to the user before treating the human judgment as satisfied. Description alone SHALL NOT complete the gate when the file exists.

#### Scenario: Production Stage 2 blocked by pending visual gate

- **WHEN** Agent attempts full `build` or non-preview Stage 2 while a required metadata gate is `pending`
- **THEN** the CLI refuses with a gate-related failure

#### Scenario: Preview Stage 2 allowed while gates pending

- **WHEN** Agent runs `ppt_flow pilot` (or Stage 2 with `--preview`) while metadata gates are `pending`
- **AND** style master exists
- **THEN** the CLI allows generation for the preview subset
- **AND** does not mutate gate fields to `waived`

#### Scenario: Visual review gate requires show

- **WHEN** a playbook review node is evaluating `style_master.jpg` or a pilot contact sheet that exists on disk
- **THEN** the agent opens or presents that artifact to the user before recording approval
- **AND** does not mark the gate approved based only on a textual description of the image

### Requirement: Explore playbooks cover pre-commitment style and pilot preview

`iterate-style.md` SHALL define a loop for iterating the style master before full production lock: read/tweak prompt → generate via existing `ppt_flow.mjs style-master` at 1k while iterating → human review with open image → RETRY, BACK, or LOCK. On LOCK it SHALL approve the visual gate via existing approve flow and MAY regenerate at 2k; if entered via playbook stack from `create-deck`, it SHALL resume the prior playbook afterward. It SHALL record iteration `round` in node status extra when available and SHOULD advise a direction change or accept when round ≥ 5.

`quick-preview.md` SHALL define validate → `ppt_flow.mjs pilot` → human review of the contact sheet (open required) with PROCEED / RETRY / BACK exits. It SHALL allow pilot while content/visual gates are still `pending` (preview ≠ approved). It SHALL NOT instruct the agent to `--waive` gates merely to unlock pilot. It SHALL note that full `build` / non-preview Stage 2 remain blocked until gates are `approved` or explicitly `waived`. Neither explore playbook SHALL require new CLI commands beyond existing `ppt_flow` flags (`pilot --force-images`, `doctor --smoke` as optional). Recommended ordering: lock visual (optionally via `iterate-style`) before committing to full `build`; `quick-preview` MAY run earlier for look-and-feel sampling when style master exists.

#### Scenario: User iterates style master

- **WHEN** user wants to refine visual direction before locking
- **THEN** Agent loads `iterate-style` and runs generate/review until LOCK or BACK
- **AND** uses existing `style-master` / `approve` CLI rather than ad-hoc scripts

#### Scenario: Quick preview without waiving gates

- **WHEN** content or visual gate is still pending and user wants a 3-page look
- **AND** style master exists
- **THEN** Agent loads `quick-preview`, runs validate and pilot without writing `waived`
- **AND** presents the contact sheet
- **AND** does not treat the preview as content/visual approval for full build

#### Scenario: Full build still needs gates after preview

- **WHEN** gates remain pending after a successful quick-preview
- **THEN** Agent MUST NOT run full `build` until approve or explicit waive

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

### Requirement: probe-image-channels playbook runs doctor channel体检

`probe-image-channels.md` SHALL orchestrate Image2 channel health checks: intake → run `ppt_flow doctor --probe-vendors` (background + progress relay when long) → show Summary and suggested `IMAGE2_VENDORS` to the human → confirm-write only after human confirmation (`.env` routing + `_lessons/image2-proven.yaml` with `via: vendors`, no secrets). It SHALL NOT auto-write `.env` without confirmation.

When the user only wants a report and explicitly does not want config changes, the agent MAY run `doctor --probe-vendors` and present the report without entering confirm-write; any write to `.env` or `_lessons` still requires confirmation.

#### Scenario: Channel probe intent selects probe-image-channels

- **WHEN** the user asks which Image2 drawing channels are working
- **THEN** routing selects `probe-image-channels`
- **AND** the playbook runs `doctor --probe-vendors` and shows the report before any `.env` write

#### Scenario: Report-only short path skips confirm-write

- **WHEN** the user only asks who is up and declines changing `.env`
- **THEN** the agent presents the probe report
- **AND** does not write `.env` or `_lessons`

### Requirement: Agent offers channel probe on image-path symptoms

When Image2 path symptoms appear — doctor image checks failing, `doctor --smoke` failing, style-master/Stage2/pilot failing with API/502/all-vendors-failed, or the user complaining that image generation does not work — and a channel probe has not already been run in the session, the agent SHALL proactively offer channel体检 as a **concrete candidate** in plain language (recognition over recall; consistent with AGENT_CONTRACT §11), e.g. recommend running the channel probe / `probe-image-channels` / `doctor --probe-vendors`, with a one-line why. The agent SHALL NOT respond only with "check your API" without an actionable next step the user can accept.

#### Scenario: First image API failure offers channel probe

- **WHEN** Stage 2 or style-master fails with a relay/API error and no probe has run this session
- **THEN** the agent offers a concrete channel-probe next step the user can accept or decline

### Requirement: Long image-generation nodes stay observable to the user

Playbooks that invoke long image generation — at minimum style-master / pilot / Stage 2 nodes in `iterate-style.md`, `quick-preview.md`, and `create-deck.md` (and `build` paths that run Stage 2), plus the probe run in `probe-image-channels.md` — SHALL treat CLI stdout progress as the user-visible wait contract. The agent SHALL:

1. When a job is expected to exceed the foreground tool-timeout budget, run it in the **background** (or equivalent) and periodically tail/read progress.
2. Relay CLI heartbeats / `i/N` / `probing i/N` to the user. Prolonged silence SHALL be treated as a problem signal (AGENT_CONTRACT §11).
3. On non-zero exit, surface the CLI JSON envelope and any vendor **attempts summary** without "just wait" cover-ups.

Playbooks SHALL NOT invent a live status daemon or new `_state` fields for in-flight API tasks.

#### Scenario: Pilot generation is not a silent foreground wait

- **WHEN** the agent runs a multi-slide pilot image generation expected to take minutes
- **THEN** the playbook/agent procedure requires background (or equivalent non-silent) execution with periodic progress relay to the user

#### Scenario: Image failure exposes attempts not a vague wait message

- **WHEN** Stage 2 or style-master exits non-zero after vendor failover exhaustion
- **THEN** the agent presents the structured failure (envelope and/or attempts summary) to the user
- **AND** does not only say to keep waiting without diagnosis

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
