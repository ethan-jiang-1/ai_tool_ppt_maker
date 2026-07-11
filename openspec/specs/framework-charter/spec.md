## Purpose

Define the framework's constitutional and entry layer: the `PPTMAKER_FRAMEWORK/charter/` directory and its four governing documents (CONSTITUTION.md, WORKFLOW.md, AGENT_CONTRACT.md, NODE-SPEC.md), together with the clean top-level entry surface — exactly five root markdown files, five type-based subdirectories, and the pure-lookup appendices relocated to `reference/`. This capability guarantees that an agent or human entering the framework finds a stable, unambiguous set of entry points and a single authoritative declaration (`bundle_layout.mjs` as the SSOT for run-bundle structure), with governing documents cleanly separated from reference material. AGENT_CONTRACT includes behavioral iron laws (including interaction rhythm); BOOTSTRAP requires showing visual artifacts before related gates.

## Requirements

### Requirement: Charter directory exists with exactly four files

`PPTMAKER_FRAMEWORK/charter/` SHALL exist as a subdirectory containing exactly four files: CONSTITUTION.md, WORKFLOW.md, AGENT_CONTRACT.md, and NODE-SPEC.md. No other files SHALL be placed in this directory.

#### Scenario: Agent enters framework and reads charter

- **WHEN** Agent navigates to `PPTMAKER_FRAMEWORK/charter/`
- **THEN** it finds CONSTITUTION.md (structure constitution), WORKFLOW.md (process constitution), AGENT_CONTRACT.md (behavioral constitution), and NODE-SPEC.md (node constitution)
- **AND** no other files exist in this directory

### Requirement: CONSTITUTION.md declares bundle_layout.mjs as the single source of truth

`charter/CONSTITUTION.md` SHALL explicitly state that `PPTMAKER_FRAMEWORK/scripts/bundle_layout.mjs` is the single authoritative source for the run bundle directory structure. It SHALL contain a human-readable snapshot of the canonical tree, and SHALL state that the code authority takes precedence over any snapshot.

#### Scenario: Human reads constitution to understand directory layout

- **WHEN** a human opens `charter/CONSTITUTION.md`
- **THEN** they see a clear declaration that `bundle_layout.mjs` is the SSOT
- **AND** they see the canonical directory tree (generated from `renderTree()`)
- **AND** they see the three-tier gradient explanation (upstream/backbone/downstream)
- **AND** they see the override precedence rules

### Requirement: CONSTITUTION declares MD↔JS complementary robustness

`charter/CONSTITUTION.md` SHALL include a governing section titled approximately **MD↔JS 互补健壮性（Agentic 双轨）**, placed alongside the CLI failure-envelope rules, stating: MD Controllers / agents are smart but fuzzy producers; JS / CLI is the precise contract executor. Production-path format and schema defects (missing punctuation, wrong types, empty mappings where arrays are required, and similar template/state blemishes) SHALL be healed by the precise side when deterministic repair is possible, and/or actively fixed by the MD/agent before continuing. On write-back after heal, on-disk YAML/JSON SHALL be canonical so subsequent MD edits start from a clean template. Presenting "fix the YAML/JSON syntax" as the novice user's primary next step SHALL be forbidden. Irrecoverable failures SHALL still use the structured CLI JSON envelope; recoverable format problems SHALL be repaired first.

#### Scenario: Agent or human reads the constitution for agentic pairing

- **WHEN** a reader opens `charter/CONSTITUTION.md`
- **THEN** they find an explicit MD↔JS complementary-robustness section
- **AND** the section requires read-side tolerance, write-side canonicalization, and heal-before-asking-novices

#### Scenario: Contract points MD at heal-first behavior

- **WHEN** an agent reads `charter/AGENT_CONTRACT.md` §7 (runtime / CLI)
- **THEN** it finds a heal-first bullet for bad state/templates
- **AND** it is not directed to make the user manually fix YAML punctuation as the default path

### Requirement: WORKFLOW.md describes the complete agent process

`charter/WORKFLOW.md` SHALL document: the 5-Phase overview table (Phase name, purpose, gate, agent role), the four editing chains (A/B/C/Structural) with their stage mappings and estimated durations, the agent entry sequence, and the gate checkpoint mechanism.

#### Scenario: Agent reads workflow to understand process structure

- **WHEN** an agent reads `charter/WORKFLOW.md`
- **THEN** it understands the Phase order (00→01→02→03→04→05)
- **AND** it knows each Phase's purpose and which gate must pass

### Requirement: AGENT_CONTRACT.md is in charter directory

`AGENT_CONTRACT.md` SHALL be located at `PPTMAKER_FRAMEWORK/charter/AGENT_CONTRACT.md`. It SHALL include iron-law **§11 交互节律** (interaction rhythm) as a single section whose executable bullets require: recognition over recall (concrete candidates + recommendation), show-don't-tell for visual artifacts (`open` / render — description MUST NOT substitute for seeing when the file exists), default-and-reversible choices, progressive disclosure of capabilities when relevant, visible checkpoints on long tasks (no silent long runs), confidence-calibrated step size (small early, longer after alignment), checkpoints framed as "are we still pointed correctly", and an early visible win on first interaction. The document title/count SHALL reflect eleven iron laws. Other iron laws (§1–10) MAY be retained. The contract MUST NOT claim its body is frozen against behavioral improvements.

§1 入口顺序 (or equivalent entry iron law) SHALL require that for an existing `deck_*`, **progress lives on disk**: `_state/state.yaml` is the execution-pointer SSOT, and whole-workflow where-am-I MAY also use `ppt_flow status` / artifacts — conversation context SHALL NOT be treated as progress truth. Agents SHALL run the session resume ritual (`ppt_flow state` and `status` as needed, report plain-language position, continue at `current_node`) before greenfield intake, and SHALL persist node transitions with `writeState`. Cleared chat or a new session SHALL NOT be treated as lost progress when `_state` exists.

#### Scenario: Agent reads interaction rhythm

- **WHEN** Agent follows the BOOTSTRAP entry flow and reads AGENT_CONTRACT.md
- **THEN** the link resolves to `charter/AGENT_CONTRACT.md`
- **AND** the contract contains §11 interaction-rhythm covering show-don't-tell and long-task checkpoints

#### Scenario: Contract may gain behavioral iron laws

- **WHEN** the framework adds or refines agent behavioral rules such as interaction rhythm
- **THEN** AGENT_CONTRACT.md MAY be updated accordingly
- **AND** the charter directory still contains exactly the four governing files

#### Scenario: Entry order requires state-first resume

- **WHEN** Agent starts a session on an existing in-progress deck after context was cleared
- **THEN** AGENT_CONTRACT directs the agent to treat disk (`_state` plus artifacts as needed) as progress truth
- **AND** to resume from `current_node` rather than trusting chat memory alone

### Requirement: BOOTSTRAP requires showing artifacts before visual gates

`PPTMAKER_FRAMEWORK/BOOTSTRAP.md` SHALL instruct agents that before asking the user to approve a visual or pilot gate, the agent MUST open or otherwise present the real artifact to the user (at minimum `style_master.jpg` and pilot contact sheets when those gates apply). Text-only description of appearance SHALL NOT satisfy this requirement when the image file exists. When no API key / image is available yet, BOOTSTRAP MAY allow a degraded show (preset thumbnails, master prompt text) and SHALL require upgrading to real images once generation is possible. BOOTSTRAP (and sibling entry docs that cite the iron-law count) SHALL state eleven iron laws when referring to AGENT_CONTRACT length.

BOOTSTRAP SHALL also instruct: when the user points at an existing `deck_*` (or returns after disconnect / cleared session), agents MUST run `ppt_flow state` (and `status` as needed), report **whole-workflow** position in plain language (execution point + artifact/gate situation), and continue the active playbook at `current_node` before re-asking greenfield intake questions. BOOTSTRAP SHALL point to COMMANDS **续跑 / 做到哪了** phrasing for “接着做 / 断线了做到哪了”.

#### Scenario: Style master gate requires open

- **WHEN** Agent reaches review of `style_master.jpg` for visual lock
- **THEN** BOOTSTRAP directs the agent to present/open the image to the user before seeking approval

#### Scenario: Pilot gate requires open

- **WHEN** Agent reaches review of a pilot contact sheet
- **THEN** BOOTSTRAP directs the agent to present/open the contact sheet before seeking proceed/retry

#### Scenario: Entry docs cite eleven iron laws

- **WHEN** BOOTSTRAP or CLAUDE entry text refers to how many AGENT_CONTRACT iron laws exist
- **THEN** the cited count is eleven (not ten)

#### Scenario: BOOTSTRAP directs resume before greenfield intake

- **WHEN** Agent opens an existing in-progress deck in a new session
- **THEN** BOOTSTRAP directs a state/status resume ritual before 5-question intake

### Requirement: Framework root contains exactly five markdown files

The `PPTMAKER_FRAMEWORK/` root directory SHALL contain exactly five `.md` files: README.md, CLAUDE.md, BOOTSTRAP.md, AGENTS.md, and COMMANDS.md. No other `.md` files SHALL exist at this level.

#### Scenario: Human opens framework and sees clean entry

- **WHEN** a human lists `PPTMAKER_FRAMEWORK/` contents
- **THEN** they see only five markdown files, all of which are entry points
- **AND** reference documents (`quick-start.md`, `glossary.md`, `anti-patterns.md`, `version-log.md`) are NOT in the root

### Requirement: Reference documents are in reference/ directory

`quick-start.md`, `glossary.md`, `anti-patterns.md`, and `version-log.md` SHALL be located in `PPTMAKER_FRAMEWORK/reference/`. These are pure lookup appendices, not entry points.

#### Scenario: Human looks for reference material

- **WHEN** a human navigates to `reference/`
- **THEN** they find `quick-start.md` (onboarding), `glossary.md` (terminology), `anti-patterns.md` (common mistakes), and `version-log.md` (changelog)

### Requirement: Root README references charter directory

The file `PPTMAKER_FRAMEWORK/README.md` SHALL mention the `charter/` directory and describe its purpose: housing the three constitutional documents. The README's directory tree diagram SHALL include `charter/` and `COMMANDS.md`.

#### Scenario: Human discovers charter from root README

- **WHEN** a human reads `PPTMAKER_FRAMEWORK/README.md`
- **THEN** they see `charter/` in the directory tree
- **AND** they understand it contains the framework's governing documents

### Requirement: Framework root subdirectories follow type-based organization

The `PPTMAKER_FRAMEWORK/` root SHALL contain exactly five subdirectories: `workflow/` (methodology), `scripts/` (executable code), `charter/` (constitution), `reference/` (appendices), and `playbook/` (workflow controllers). Phase-numbered directories (00_*, 01_*, etc.) SHALL NOT exist at root level.

#### Scenario: Human lists root subdirectories

- **WHEN** a human runs `ls PPTMAKER_FRAMEWORK/`
- **THEN** they see exactly `workflow/`, `scripts/`, `charter/`, `reference/`, `playbook/`
- **AND** no directory names contain Phase numbers at root level

### Requirement: CONSTITUTION declares run-bundle learning surface with an explicit purpose

`charter/CONSTITUTION.md` SHALL declare a run-bundle **self-retained lessons** surface at `deck_*/_lessons/` and SHALL give it a **dedicated governing section** (not only a tree-line annotation). That section SHALL state, in plain language, the **agentic loop**: the agent workflow is expected to **probe, overcome difficulties on its own, and retain non-secret lessons** under `_lessons/` so the next session reads before guessing—rather than amnesiacally restarting from chat. The framework SHALL define only the convention (path, purpose, writing rules, prohibitions); **each run bundle accumulates its own** lessons via the agent. The surface is **not** playbook progress, **not** secrets, **not** materials or generated artifacts. Domain-specific receipts (for example an Image2 smoke file) MAY be cited as **examples**, but SHALL NOT be the sole purpose of `_lessons/`. Secrets SHALL NOT be stored under `_lessons/`. Playbook progress SHALL remain under `_state/`. A bare directory name without purpose text SHALL be treated as insufficient. The constitution and tree snapshot SHALL use `_lessons/` (not `_learning/`) as the canonical path.

#### Scenario: Charter section states the agentic retain loop

- **WHEN** a reader opens `charter/CONSTITUTION.md`
- **THEN** they find a dedicated section for the `_lessons/` surface
- **AND** that section states probe / overcome / retain / read-before-guess in plain language
- **AND** it distinguishes `_lessons/` from `_state/` and from `.env` secrets

#### Scenario: Tree snapshot annotates _lessons without a single-file monopoly

- **WHEN** a reader views the canonical tree snapshot in `CONSTITUTION.md`
- **THEN** the `_lessons/` line includes a short purpose annotation (not only the folder name)
- **AND** the snapshot does not imply the directory exists only for one named receipt file

#### Scenario: Framework does not own per-deck lesson content

- **WHEN** the constitution describes `_lessons/`
- **THEN** it states that lesson content is owned by the run bundle (written during work)
- **AND** it does not require the framework tree to ship per-project endpoint lessons
