## MODIFIED Requirements

### Requirement: playbook/ directory contains the registered MD controllers

`PPTMAKER_FRAMEWORK/playbook/` SHALL contain **ten** files: nine MD Controllers (`create-deck.md`, `edit-text.md`, `edit-visual.md`, `edit-notes.md`, `restructure-slides.md`, `iterate-style.md`, `quick-preview.md`, `migrate-import.md`, `probe-image-channels.md`) plus one shared node file `classify-change.md`. Each MD Controller SHALL be self-contained and define an ordered sequence of nodes; `classify-change.md` is a shared node (`shared: true`) referenced by the chain playbooks via `includes:`.

#### Scenario: Agent lists available playbooks

- **WHEN** Agent lists `PPTMAKER_FRAMEWORK/playbook/`
- **THEN** it sees nine MD Controllers plus the shared node `classify-change.md`
- **AND** those controllers include `probe-image-channels.md`

### Requirement: COMMANDS.md is a routing table

`PPTMAKER_FRAMEWORK/COMMANDS.md` SHALL map natural-language user intents to playbook names. Each row SHALL include: example user input, target playbook, and any entry parameters. Agent SHALL read COMMANDS.md to classify user intent, then read the target playbook to execute. COMMANDS.md SHALL include an **探索 & 预览** section (pre-commitment style/pilot) and a **旁路 / 迁移** section—placed between explore and post-PPTX iteration—that routes migrate/import-existing-deck intents to `migrate-import`. Explore intents route to `iterate-style` / `quick-preview` and SHALL NOT route to post-PPTX `edit-visual`. Migrate/import intents SHALL NOT be handled by silently improvising outside a playbook, and SHALL NOT skip interaction-rhythm obligations (show, checkpoints, gates).

COMMANDS.md SHALL also include an **环境 / 画画通道** section, placed between the **旁路 / 迁移** and **迭代打磨** sections, that routes channel-health intents to `probe-image-channels`. That section SHALL list **multiple** example phrasings spanning direct asks and **symptom language** (so users need not know the playbook or `doctor --probe-vendors` flag names), including at least: which drawing/image channel works; try image API vendors; image gen 502 / relay down; cannot generate images; switch drawing provider; which vendor is faster.

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

## ADDED Requirements

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
