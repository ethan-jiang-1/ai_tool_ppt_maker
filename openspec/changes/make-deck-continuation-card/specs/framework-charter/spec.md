## MODIFIED Requirements

### Requirement: AGENT_CONTRACT.md is in charter directory

`AGENT_CONTRACT.md` SHALL be located at `PPTMAKER_FRAMEWORK/charter/AGENT_CONTRACT.md`. It SHALL include iron-law **§11 交互节律** (interaction rhythm) as a single section whose executable bullets require: recognition over recall (concrete candidates + recommendation), show-don't-tell for visual artifacts (`open` / render — description MUST NOT substitute for seeing when the file exists), default-and-reversible choices, progressive disclosure of capabilities when relevant, visible checkpoints on long tasks (no silent long runs), confidence-calibrated step size (small early, longer after alignment), checkpoints framed as "are we still pointed correctly", and an early visible win on first interaction. The document title/count SHALL reflect eleven iron laws. Other iron laws (§1–10) MAY be retained. The contract MUST NOT claim its body is frozen against behavioral improvements.

§1 入口顺序 (or equivalent entry iron law) SHALL require that for an existing `deck_*`, **progress lives on disk**: `_state/state.yaml` is the execution-pointer SSOT, and whole-workflow where-am-I MAY also use `ppt_flow status` / artifacts — conversation context SHALL NOT be treated as progress truth. Agents SHALL run the session resume ritual (`ppt_flow state` and `status` as needed, report plain-language position, continue at `current_node`) before greenfield intake, and SHALL persist node transitions with `writeState`. Cleared chat or a new session SHALL NOT be treated as lost progress when `_state` exists.

§1 入口顺序 SHALL also define the **continuation-card attachment entry**. When a user attaches a deck's `deck-guide.md` continuation card to a fresh session together with a plain-language request (continue, revise, rebuild, make a version, or start a new deck), the Agent SHALL follow a bounded, zero-write read path: treat the attachment's parent directory as the claimed deck root; verify the attached object is a real regular file named `deck-guide.md` whose parent is a marker-bearing deck root; resolve the fixed `../PPTMAKER_FRAMEWORK` relation to the project's real direct-child soft bundle; run the existing read-only `bundle_layout --check --structure-only`; then load `deck-guide.md` and read `_state/state.yaml` plus `ppt_flow state`/`status` before responding in ordinary language. The Agent SHALL perform no write during this resolution, and the card SHALL NOT select a route, alter state, grant approval, or replace a human decision. If the chat environment supplies only copied card bytes without the original local path, the Agent SHALL report that the exact deck cannot be safely resolved and request the original attachment or an explicit deck path; it SHALL NOT select a deck by name, recency, or filesystem search. A continuation card for a terminal deck SHALL resolve read-only and route the user to the existing rerun, new-version, or new-deck path; it SHALL NOT reopen the closed bundle or treat a chat request as delivery approval.

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

#### Scenario: User attaches the continuation card to a fresh session

- **WHEN** a user attaches a deck's `deck-guide.md` to a new session with a plain-language continuation request
- **THEN** AGENT_CONTRACT directs the Agent to resolve the attachment's parent as the deck root, verify the fixed `../PPTMAKER_FRAMEWORK` relation, run the read-only structure check, then read `deck-guide.md` and `_state`/`ppt_flow status`
- **AND** the Agent performs no write and responds in ordinary language without requiring the user to supply a deck or framework path

#### Scenario: Copied card bytes have no source path

- **WHEN** the chat environment supplies copied `deck-guide.md` bytes without the original local path
- **THEN** AGENT_CONTRACT directs the Agent to report that the exact deck cannot be safely resolved
- **AND** to request the original attachment or an explicit deck path rather than guessing by name, recency, or filesystem search

#### Scenario: Terminal deck card receives a new request

- **WHEN** a valid continuation card resolves to a deck whose authoritative state is terminal and the user asks for more work
- **THEN** AGENT_CONTRACT directs the Agent to read state/status, explain the completed result, and route to the existing rerun, new-version, or new-deck path
- **AND** it does not reopen the closed bundle or treat the chat request as delivery approval
