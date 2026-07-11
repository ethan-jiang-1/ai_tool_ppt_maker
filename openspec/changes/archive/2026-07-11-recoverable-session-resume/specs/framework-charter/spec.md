## MODIFIED Requirements

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
