## MODIFIED Requirements

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

## ADDED Requirements

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
