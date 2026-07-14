## Purpose

Define how MD Controller playbooks under `PPTMAKER_FRAMEWORK/playbook/` drive an agent through a deck's lifecycle: the registered playbook files (nine MD Controllers plus the shared `classify-change.md` node, including explore playbooks `iterate-style` / `quick-preview`, the off-path `migrate-import` playbook, and channel-health `probe-image-channels`), the 11-node `create-deck` creation flow and shortened iteration workflows, intent routing via `COMMANDS.md`, ownership-aware refresh-path resolution, state initialization on playbook start, gate enforcement at node boundaries (including show-before-approve for visual reviews), and shared-node reuse via `includes:`. This capability guarantees that user intent maps to exactly one playbook, that human-judgment gates (content and visual) block progression until explicitly approved or waived, and that execution state lives in `_state/state.yaml` alongside the static `project-metadata.yaml`.
## Requirements
### Requirement: playbook/ directory contains the registered MD controllers

`PPTMAKER_FRAMEWORK/playbook/` SHALL contain **ten** files: nine MD Controllers (`create-deck.md`, `edit-text.md`, `edit-visual.md`, `edit-notes.md`, `restructure-slides.md`, `iterate-style.md`, `quick-preview.md`, `migrate-import.md`, `probe-image-channels.md`) plus one shared node file `classify-change.md`. Each MD Controller SHALL be self-contained and define an ordered sequence of nodes; `classify-change.md` is a shared node (`shared: true`) referenced by the chain playbooks via `includes:`.

#### Scenario: Agent lists available playbooks

- **WHEN** Agent lists `PPTMAKER_FRAMEWORK/playbook/`
- **THEN** it sees nine MD Controllers plus the shared node `classify-change.md`
- **AND** those controllers include `probe-image-channels.md`

### Requirement: create-deck playbook covers complete deck creation

`create-deck.md` SHALL define the complete workflow for creating a new PPT from scratch. It SHALL use 11 nodes: instantiation, checkpoint-intake, setup, seed-topics, authoring-slides, composing-prompts, producing-deck, checkpoint-final-review, readiness, rerun, final. Node order SHALL be: instantiation → checkpoint-intake → setup → seed-topics → authoring-slides → composing-prompts → producing-deck → checkpoint-final-review → (rerun → seed-topics | readiness → final).

#### Scenario: User says "帮我做一个PPT"

- **WHEN** user requests a new PPT
- **THEN** COMMANDS.md routes to playbook `create-deck`
- **AND** Agent starts executing from node `instantiation`

### Requirement: Iteration playbooks resolve semantic paths

`edit-text.md`, `edit-visual.md`, `edit-notes.md`, and `restructure-slides.md` SHALL each define a shortened workflow for iterative changes. Each SHALL begin with change classification and end with an intent-specific, globally unique verification node. Playbook names SHALL describe user intent; resolved render mode, content ownership, stale artifacts, and structural scope SHALL determine execution.

The text-edit controller SHALL be limited to structured KICKER/TITLE/SUBTITLE intent and use the public `ppt_flow refresh --kind title` path. Resolved `body+header-lock` SHALL use Header Text & Style Refresh without Stage 2. Resolved `full-page` SHALL use Generated Image Rebuild with selected forced image regeneration, pilot/header review evidence, and reviewed-image reuse for final assembly. Generated body labels, KPI/card/chart text, cases, and other image-owned content SHALL NOT be routed through header text editing.

Header Text & Style Refresh MAY also cover Stage-3-owned font, color, position, line-height, spacing, and text-width changes when the existing raw-image safe-zone contract remains valid. Header safe-zone height, render-mode switches, and any other raw-image contract change SHALL use Generated Image Rebuild.

`restructure-slides.md` SHALL enter Structural Versioning Path for add/delete/reorder: create a clean downstream version first, update structure/source there, then rebuild affected slides through the applicable refresh path(s). Structural Versioning Path SHALL NOT be presented as a fourth peer artifact-refresh path.

#### Scenario: User requests a title change

- **WHEN** user says "第5页标题改一下"
- **AND** Stage 1 resolves slide 5 as `body+header-lock`
- **THEN** COMMANDS.md routes through change classification to the text-edit controller
- **AND** the controller invokes `ppt_flow refresh --kind title` for the selected slide
- **AND** Agent completes Header Text & Style Refresh and verifies the output

#### Scenario: User requests a full-page title change

- **WHEN** user says "第5页标题改一下"
- **AND** Stage 1 resolves slide 5 as `full-page`
- **THEN** `ppt_flow refresh --kind title` reports the current full-page review requirement instead of silently using Header Text & Style Refresh
- **AND** Agent performs Generated Image Rebuild for the selected image, reviews/approves current header evidence, then completes refresh/build without a second image generation

#### Scenario: User requests a generated body-text change

- **WHEN** user changes a KPI, card label, chart label, case, or other content burned into the generated image
- **THEN** change classification selects the generated-image/visual controller and Generated Image Rebuild
- **AND** it does not send unsupported body fields to `edit-text`

#### Scenario: User changes header overlay styling only

- **WHEN** header font, color, position, spacing, or line-height changes without changing the raw-image contract
- **THEN** the affected `body+header-lock` slides use Header Text & Style Refresh without Stage 2

#### Scenario: User changes header safe-zone geometry

- **WHEN** a safe-zone or render-mode change alters the Stage 2 prompt/image contract
- **THEN** the affected slides use Generated Image Rebuild with required force and review

#### Scenario: User requests a visual redesign

- **WHEN** user says "换个配色"
- **THEN** COMMANDS.md routes to playbook `edit-visual`
- **AND** Agent runs the existing three-slide representative pilot before full regeneration

#### Scenario: User requests a structural addition

- **WHEN** user asks to add a slide
- **THEN** `restructure-slides` creates a clean new version before editing the slide set
- **AND** the new/affected slides subsequently use their resolved refresh paths

#### Scenario: User requests notes only

- **WHEN** only speaker notes change
- **THEN** `edit-notes` uses Notes-Only Refresh through Stage 5
- **AND** existing image/header evidence remains unchanged

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

`probe-image-channels.md` SHALL orchestrate Image2 channel health checks: intake → run `ppt_flow doctor --probe-vendors` (background + progress relay when long) → show Summary to the human → confirm-write only after human confirmation (`.env` + `_lessons/image2-proven.yaml` with `via: env`, no secrets). It SHALL NOT auto-write `.env` without confirmation.

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

### Requirement: Version-scoped backups go under _scratch

When an agent (or playbook step) creates a disposable backup or draft of version sources such as `slide-specifications.md`, it SHALL place that file under `3_versions/v{n}/_scratch/` for the active version. Agents SHALL NOT place such backups at the deck root, under `2_backbone/`, under `_generated/`, or in ad-hoc dirs named `_tmp`, `backup`, or `_bak`. Style-master iteration history remains under `1_upstream_raw_material/style-master-iterations/`; lessons under `_lessons/`; progress under `_state/`.

#### Scenario: slidespec bak lands in version scratch

- **WHEN** Agent renumbers or rewrites slides and keeps a pre-edit copy
- **THEN** the copy is written under `3_versions/v{n}/_scratch/`
- **AND** not as a loose file at the deck root

#### Scenario: Agent does not invent _tmp at deck root

- **WHEN** Agent needs a temporary workspace for a version edit
- **THEN** it uses `_scratch/` (or an existing canonical path from the routing table)
- **AND** does not create `deck_*/_tmp/` or `deck_*/backup/`

### Requirement: Unsure placement triggers GREP of Where Map before inventing paths

When an agent does not know where a file belongs, it SHALL search the soft bundle for canonical placement tokens and consult `PPTMAKER_FRAMEWORK/reference/glossary.md` Where Map (owned by `run-bundle-layout`) **before** creating a new directory name or writing to the deck root. Agents SHALL prefer Where Map paths over improvised names. `checkBundle` enforcement (`run-bundle-management`) remains; GREP does not replace the check.

#### Scenario: Agent greps before inventing temp dir

- **WHEN** Agent needs a place for a version-scoped `.bak` and is unsure of policy
- **THEN** Agent searches for `_scratch` (or opens glossary Where Map)
- **AND** writes under `3_versions/v{n}/_scratch/` rather than inventing `deck_*/_tmp/`

#### Scenario: Agent routes pilot preview via known token

- **WHEN** Agent looks for where pilot / 小样 / contact sheet lives
- **THEN** Agent can resolve via `contact_sheet` or `pilot` to `_generated/preview/`
- **AND** does not treat deck-root litter as the preview home

### Requirement: Pilot review gates content full-page header quality before full build

When a deck contains content `full-page` slides, a pilot used to approve full build SHALL review at least one such slide, and at least two when the deck contains two or more, so cross-page consistency is observable. Automatic selection is governed by `pipeline-orchestration`; when explicit `--only` selection does not provide the required coverage, the Agent SHALL run an additional pilot subset before approval rather than silently treating the gate as satisfied. During contact-sheet review, the Agent SHALL explicitly inspect header text accuracy/completeness, readability, position, size, fixed left alignment, cross-page consistency, and body overlap. If a defect is visible, the Agent SHALL identify the affected slide and recommend adding that slide to `render.header-lock`; it SHALL NOT modify policy without user confirmation. After confirmation, the affected image SHALL be regenerated through Generated Image Rebuild with forced image regeneration and reviewed again. The visual review SHALL NOT be treated as passed, and full build SHALL NOT proceed, until the defect is resolved or the user explicitly accepts the documented risk.

If the user explicitly accepts an unresolved header risk, the Agent SHALL persist the affected slide ids and accepted symptoms in the version Change Log or playbook state extra. Header-lock SHALL be proposed for a slide that deviates from the configured target; a request to change the target geometry across the deck SHALL instead be classified as a visual-config change with the corresponding broader rerun.

After each reviewed pilot batch, the Agent SHALL run `ppt_flow approve <run-dir> header`. The command persists/merges `reviewed_content_full_page_ids`, `reviewed_changed_full_page_ids`, per-slide image hashes and `full_page_header_snapshot`, a deterministic `header_review_fingerprint`, and accepted-risk ids/symptoms under the current version's `nodes.header-review.by_version` record. The fingerprint SHALL cover all current full-page slides and shared content header geometry. If coverage remains incomplete, the Agent SHALL follow the CLI's remaining-coverage output and run another pilot batch; it SHALL not treat an `in_progress` record as approval. Before full build it SHALL require the current version record to be completed and current even when the ordinary visual gate is already `approved`. For accepted risk the Agent SHALL use `approve header --waive --only <ids> --reason <text>`. It SHALL NOT instruct the user to hand-edit `_state`.

#### Scenario: Manual pilot selection cannot bypass coverage
- **WHEN** a deck has at least two content full-page slides but explicit `--only` pilot selection contains fewer than two
- **THEN** the Agent runs an additional content full-page pilot subset before treating visual review as passed

#### Scenario: Header drift blocks silent progression
- **WHEN** pilot review shows an inaccurate, blurry, displaced, inconsistently sized, misaligned, or body-overlapping content header
- **THEN** the Agent shows and names the issue and proposes header-lock for the affected slide
- **AND** does not silently approve the visual review or start full build

#### Scenario: Confirmed remedy uses Generated Image Rebuild
- **WHEN** the user approves upgrading an affected full-page slide to header-lock
- **THEN** the Agent updates the policy, regenerates that slide image with `--force-images`, and repeats visual review

#### Scenario: Existing visual approval does not bypass stale header evidence
- **WHEN** the visual gate is already approved but content full-page header evidence is absent or its fingerprint no longer matches
- **THEN** the playbook does not start full build until the required pages are regenerated and reviewed

#### Scenario: Notes change preserves header evidence
- **WHEN** only speaker notes change after a valid header review
- **THEN** the existing header-review fingerprint remains usable

### Requirement: Registered playbooks pass machine validation

Every registered MD Controller and shared node SHALL pass the canonical node-specification validator before the framework test suite succeeds. The normalized registry SHALL contain nine ordered controllers, one shared node, and forty globally unique nodes, including a new terminal `verify-restructure-output` node. Validation SHALL cover node parsing, global uniqueness, ordered requirements, includes, condition catalog coverage, declared decision values, and impossible self-entry gates.

#### Scenario: Current controller set validates

- **WHEN** the framework playbook validation test indexes `PPTMAKER_FRAMEWORK/playbook/`
- **THEN** all registered controllers and the shared node parse successfully
- **AND** no duplicate node IDs, missing requirements, unknown conditions, or impossible gates are reported
- **AND** their node order, metadata, dependencies, decisions, and conditions match the normative design manifest

#### Scenario: Restructure workflow ends in verification

- **WHEN** `restructure-slides` completes affected regeneration
- **THEN** it proceeds to globally unique node `verify-restructure-output`
- **AND** requires current user evidence that the structure change is correct before the playbook completes

### Requirement: Playbook lifecycle and methodology metadata are explicit

Every playbook node SHALL declare both its end-to-end lifecycle position and its methodology module using the canonical fields from `node-specification`. Controllers SHALL NOT use a single numeric `phase` field to mean a workflow directory.

#### Scenario: Production node is unambiguous

- **WHEN** Agent inspects the create-deck production node
- **THEN** it declares `lifecycle_phase: 3` and `method_module: 04-production`
- **AND** no reader must infer the meaning of `phase: 04`

### Requirement: Legacy duplicate node state remains resumable

When a known duplicate node ID is renamed to a unique intent-specific ID, the state read/heal path SHALL migrate an in-progress legacy `current_node` using the active playbook as context and SHALL preserve the node's existing status and extra fields in the active execution working set. If both legacy and canonical keys exist, the canonical record wins and only missing fields are merged from the legacy record.

#### Scenario: Legacy edit-text verify-output resumes

- **WHEN** an existing state has `playbook: edit-text` and `current_node: verify-output`
- **THEN** read/heal maps it to the new text-specific verification node
- **AND** preserves its node record, active execution identity, and playbook stack

### Requirement: Resume cards use the active playbook model

Human and JSON output from `ppt_flow state` SHALL use the canonical active playbook index to calculate complete pending-node lists and eligible next nodes. A unique eligible next node SHALL produce a specific suggestion. Multiple eligible branch nodes SHALL be reported as candidates without automatic selection. Existing `waiting_for` remains the highest-priority next action.

#### Scenario: Unique next node is suggested

- **WHEN** the current node is completed and exactly one downstream node has all requirements satisfied
- **THEN** `suggested_next` names that node
- **AND** Pending includes later nodes that do not yet have state records

#### Scenario: Branch requires a decision

- **WHEN** two downstream branch nodes are eligible after a review node
- **THEN** the resume card lists both candidates
- **AND** does not silently choose one

#### Scenario: Waiting state remains authoritative

- **WHEN** the current node has `waiting_for`
- **THEN** `suggested_next` remains the waiting action even if another node appears structurally eligible
