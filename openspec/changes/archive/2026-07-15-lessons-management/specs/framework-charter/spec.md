## MODIFIED Requirements

### Requirement: BOOTSTRAP requires showing artifacts before visual gates

`PPTMAKER_FRAMEWORK/BOOTSTRAP.md` SHALL instruct agents that before asking the user to approve a visual or pilot gate, the agent MUST open or otherwise present the real artifact to the user (at minimum `style_master.jpg` and pilot contact sheets when those gates apply). Text-only description of appearance SHALL NOT satisfy this requirement when the image file exists. When no API key / image is available yet, BOOTSTRAP MAY allow a degraded show (preset thumbnails, master prompt text) and SHALL require upgrading to real images once generation is possible. BOOTSTRAP (and sibling entry docs that cite the iron-law count) SHALL state eleven iron laws when referring to AGENT_CONTRACT length.

BOOTSTRAP SHALL also instruct: when the user points at an existing `deck_*` (or returns after disconnect / cleared session), agents MUST run `ppt_flow state` (and `status` as needed), report **whole-workflow** position in plain language (execution point + artifact/gate situation), **and scan `_lessons/`** (list all lesson files and summarize their key findings) before proceeding. BOOTSTRAP SHALL point to COMMANDS **续跑 / 做到哪了** phrasing for "接着做 / 断线了做到哪了".

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

#### Scenario: BOOTSTRAP directs scanning _lessons_ on deck entry

- **WHEN** Agent opens an existing deck (new session or resumed)
- **THEN** BOOTSTRAP directs the agent to list all files in `_lessons/` and summarize key findings before proceeding
- **AND** the instruction appears alongside the `_state`/status resume ritual

## ADDED Requirements

### Requirement: BOOTSTRAP documents user-triggered lesson capture

`PPTMAKER_FRAMEWORK/BOOTSTRAP.md` SHALL document that when a user says phrases like "记住这个" / "下回别忘了" / "不容易总算调出来了" / "记下来", the agent SHALL immediately capture the relevant lesson to `_lessons/` using the 4-question format (遇到什么？/ 怎么试的？/ 结论是什么？/ 下次先看哪？). BOOTSTRAP SHALL instruct the agent to use `lessons.mjs add <runDir> --title <slug>` or write the file directly.

#### Scenario: BOOTSTRAP documents user-triggered lesson capture

- **WHEN** the user says phrases like "记住这个" or "下回别忘了" or "不容易总算调出来了"
- **THEN** BOOTSTRAP instructs the agent to immediately write the relevant lesson to `_lessons/` using the 4-question format

### Requirement: AGENT_CONTRACT includes lesson capture obligation at phase gates

`PPTMAKER_FRAMEWORK/charter/AGENT_CONTRACT.md` §4 (Phase gates) SHALL instruct the agent to, after resolving any error that took more than one attempt, offer to capture a lesson to `_lessons/`. At each phase gate approval, the agent SHALL confirm whether any uncaptured lessons remain. The instruction SHALL reference `_lessons/README.md` for the writing rules and `lessons.mjs add` as the preferred capture tool.

#### Scenario: Agent offers to capture after multi-attempt fix

- **WHEN** the agent resolves an error after 2+ attempts (any operational issue that required repeated trial-and-error to overcome)
- **THEN** AGENT_CONTRACT instructs the agent to ask "Worth writing a lesson to `_lessons/`?"

#### Scenario: Agent checks for uncaptured lessons at phase gate

- **WHEN** the agent is about to mark a phase gate as approved
- **THEN** AGENT_CONTRACT instructs the agent to confirm no valuable lessons remain uncaptured

### Requirement: AGENTS workflow includes lesson check and capture steps

`PPTMAKER_FRAMEWORK/AGENTS.md` SHALL include explicit lesson-awareness steps at key workflow transitions:
- At the start of each Phase: "Check `_lessons/` for relevant experience before beginning this phase"
- Before Phase 2 (image generation): explicitly flag to check for vendor/endpoint lessons
- After error resolution: "Lesson worth capturing? Use `lessons.mjs add`"
- At phase gate approval: "Confirm no uncaptured lessons"

These steps SHALL reference `lessons.mjs check` and `lessons.mjs list` as the preferred tools for lesson retrieval.

#### Scenario: Phase start includes lesson check

- **WHEN** Agent begins a new Phase in AGENTS.md workflow
- **THEN** the Phase instructions include "Check `_lessons/` for relevant experience"

#### Scenario: Pre-Phase-2 vendor check

- **WHEN** Agent is about to begin Phase 2 (image generation)
- **THEN** AGENTS.md explicitly flags checking for vendor/endpoint-related lessons
