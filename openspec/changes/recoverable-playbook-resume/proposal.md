## Why

`_state/state.yaml` already records playbook progress, but the product loop is open: docs still say “start at node 1”, BOOTSTRAP has no clear-context resume ritual, `status` hides playbook position, and `approve` does not sync `_state.gates`. After a stuck agent, cleared chat, sleep/wake, or novice session swap, users cannot reliably continue from the breakpoint — conversation memory is untrusted; only deck state + artifacts should be.

## What Changes

- **Resume ritual (agent protocol):** On any existing `deck_*`, before greenfield intake, run `ppt_flow state` (+ `status`), load the active playbook at `current_node`, confirm in plain language (“接着从 X 的 Y 做？”). Never default to node 1 when state shows in-progress work.
- **Write discipline:** Entering `in_progress` / leaving `completed|failed|skipped` MUST `writeState`; human-wait nodes record optional `waiting_for` / `note` on the current node. Progress lives on disk, not in chat.
- **Resume card (CLI glue):** Extend existing `state` (and surface from `status`) with a human-readable resume card: playbook, current_node, node status, gates, stack top, suggested next; same fields in `--json`. **No new top-level command** (still 12).
- **Dual-gate sync:** `ppt_flow approve` writes `project-metadata.yaml` **and** syncs `_state.gates` via `writeState`.
- **Docs fix:** COMMANDS routing = “有 state 则续”; BOOTSTRAP resume entry; AGENT_CONTRACT: progress SSOT is `_state`, not conversation context.

**Non-goals:** Mid-node MD Step checkpoint graphs; in-flight Image2 task ids in `_state` (keep disk skip-if-exists + traces); session DB / watch daemon; treating `_lessons/` as playbook progress; replaying `history.jsonl` for auto-recovery; **BREAKING** CLI renames.

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `playbook-execution`: Resume entry protocol; COMMANDS no longer forces first-node; route “接着做 / 做到哪了” to resume ritual.
- `node-specification`: `waiting_for` / `note` conventions; mandatory write-on-transition discipline.
- `cli-surface`: Resume card on `state` / `status`; `approve` dual-writes gates.
- `framework-charter`: Entry-order / contract: `_state` is progress SSOT across sessions; `_lessons` remains non-progress.
- `run-bundle-management`: Deck-guide / `_state` breadcrumbs point agents at resume ritual (not greenfield-only).

## Impact

- Scripts: `ppt_flow.mjs` (`state`, `status`, `approve`), possibly thin helpers in `lib/state.mjs`.
- Docs: `BOOTSTRAP.md`, `COMMANDS.md`, `charter/AGENT_CONTRACT.md`, `_state/README` / deck-guide crumbs, light playbook notes where writeState is already mentioned.
- Tests: resume-card JSON fields; approve syncs `_state.gates`; docs do not mandate first-node when state exists.
- Agents / MD Controllers: must treat clear-context as normal; first action on existing deck is state read + continue.
