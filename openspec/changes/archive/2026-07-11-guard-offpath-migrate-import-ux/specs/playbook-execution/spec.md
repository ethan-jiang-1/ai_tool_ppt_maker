## MODIFIED Requirements

### Requirement: playbook/ directory contains the registered MD controllers

`PPTMAKER_FRAMEWORK/playbook/` SHALL contain **nine** files: eight MD Controllers (`create-deck.md`, `edit-text.md`, `edit-visual.md`, `edit-notes.md`, `restructure-slides.md`, `iterate-style.md`, `quick-preview.md`, `migrate-import.md`) plus one shared node file `classify-change.md`. Each MD Controller SHALL be self-contained and define an ordered sequence of nodes; `classify-change.md` is a shared node (`shared: true`) referenced by the chain playbooks via `includes:`.

#### Scenario: Agent lists available playbooks

- **WHEN** Agent lists `PPTMAKER_FRAMEWORK/playbook/`
- **THEN** it sees eight MD Controllers plus the shared node `classify-change.md`

### Requirement: COMMANDS.md is a routing table

`PPTMAKER_FRAMEWORK/COMMANDS.md` SHALL map natural-language user intents to playbook names. Each row SHALL include: example user input, target playbook, and any entry parameters. Agent SHALL read COMMANDS.md to classify user intent, then read the target playbook to execute. COMMANDS.md SHALL include an **探索 & 预览** section (pre-commitment style/pilot) and a **旁路 / 迁移** section—placed between explore and post-PPTX iteration—that routes migrate/import-existing-deck intents to `migrate-import`. Migrate/import intents SHALL NOT be handled by silently improvising outside a playbook, and SHALL NOT skip interaction-rhythm obligations (show, checkpoints, gates).

#### Scenario: Agent routes migrate intent

- **WHEN** user says "把已有的 deck 迁到新框架"
- **THEN** Agent reads COMMANDS.md, classifies as `migrate-import`, and loads `playbook/migrate-import.md`

#### Scenario: Agent routes style iteration explore intent

- **WHEN** user says "先定视觉方向，反复打磨 style master"
- **THEN** Agent reads COMMANDS.md, classifies as `iterate-style`, and loads `playbook/iterate-style.md`

#### Scenario: Migrate must not skip playbook

- **WHEN** user asks to import or upgrade an existing deck into the framework tree
- **THEN** Agent loads `migrate-import` rather than improvising a silent file move with no show/gates

## ADDED Requirements

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
