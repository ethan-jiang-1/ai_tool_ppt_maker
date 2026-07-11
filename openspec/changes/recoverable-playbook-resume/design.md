## Context

`state.mjs` + `_state/state.yaml` already persist `playbook`, `current_node`, `nodes.*`, `gates`, `playbook_stack`. Specs claim “Agent reads state to resume.” Product reality: COMMANDS says start at first node; BOOTSTRAP has no clear-context ritual; `status` shows artifacts not playbook position; `approve` writes metadata only so `_state.gates` drifts. Clear chat / intermittent work / novice session swaps are common — conversation context must not be the progress source of truth.

Constraints: Node ESM; keep **12** `ppt_flow` commands; no watch daemon; `_lessons/` stays non-progress; pipeline Stage 2 resume remains file skip-if-exists (no in-flight API ids in `_state`).

## Goals / Non-Goals

**Goals:**

- Any agent opening an existing `deck_*` can recover position from disk and continue at `current_node`.
- Progress write discipline at node boundaries (+ optional `waiting_for`).
- Human/agent-readable resume card without a 13th command.
- `approve` dual-writes metadata and `_state.gates`.
- Docs/contract match the resume story.

**Non-Goals:**

- Mid-node MD Step 1/2/3 checkpoint graphs.
- In-flight Image2 / poll task state in `_state`.
- Auto-replay of `history.jsonl`.
- Session database or background watcher.
- Using `_lessons/` as playbook progress.

## Decisions

### D1 — Resume ritual (agent protocol, not a new playbook file)

**Decision:** For any session that targets an existing `deck_*` (path known or discoverable), **before** greenfield intake / “帮我做一个PPT” from scratch:

1. Run `ppt_flow state <deckRootOrVersion>` (prefer deck root; version dir OK if CLI already resolves).
2. Run `ppt_flow status` on the active version when useful for artifacts/gates.
3. Read `playbook` + `current_node` + node status + gates + `playbook_stack`.
4. Load `playbook/<name>.md` and continue **at `current_node`** (respect `checkEntry`).
5. Plain-language confirm: 「从 `<playbook>` 的 `<current_node>` 接着做？」

If state shows only seeded `instantiation` completed and user explicitly wants a new deck flow, greenfield is allowed. If user says restart from scratch, ask confirmation then reset/overwrite state deliberately — never silent.

**Why not a new playbook:** Resume is an entry ritual for *every* playbook, not a parallel intent. COMMANDS maps “接着做 / 做到哪了” → ritual, then the *active* playbook.

### D2 — Write discipline + `waiting_for`

**Decision:** On every node status transition to `in_progress` / `completed` / `failed` / `skipped`, agent MUST call `setNodeStatus` (or equivalent) + `writeState`. When blocked on a human, set optional string field `nodes.<current>.waiting_for` (e.g. `user:approve-visual`, `user:review-style-master`) and optional `note`; clear `waiting_for` when leaving the wait. Do not invent mid-node step IDs.

**Why not step graphs:** Too heavy for MD Controllers; node + waiting_for is enough for “卡在等人” recovery. Artifacts on disk cover partial pipeline work.

### D3 — Resume card on existing `state` (and mirrored in `status`)

**Decision:** Enhance `ppt_flow state` text + `--json` with a stable resume card:

- `playbook`, `current_node`, current node `status`, optional `waiting_for` / `note`
- `gates` (content/visual from `_state`)
- `playbook_stack` top (or empty)
- `suggested_next` — short actionable string derived from position (e.g. “continue node setup in iterate-style” / “waiting for visual approve”)

`ppt_flow status` SHALL include a compact **Playbook** section (or JSON field) pointing at the same position so one glance does not miss the breakpoint. Still **12** commands.

**Why not `resume` command:** Avoid CLI sprawl; ritual is agent+docs; card is the instrument.

### D4 — `approve` dual-gate sync

**Decision:** `ppt_flow approve <runDir> <gate>` continues to write `project-metadata.yaml` `content_gate`/`visual_gate`, **and** updates `_state.gates.<gate>` + `writeState` on the deck root. One command, both truths. If `_state` missing, heal/seed via existing `readState` then write.

**Why:** Eliminates the #1 resume drift after human approve.

### D5 — Docs / contract

**Decision:**

- `COMMANDS.md`: replace “从第一个 node 开始” with “有 in-progress `_state` → resume ritual；仅绿场才从 playbook 首 node”.
- Add rows: 「接着做」「上次做到哪了」「清了聊天继续」→ resume ritual (active playbook).
- `BOOTSTRAP.md`: early step for existing deck → state/status then continue.
- `AGENT_CONTRACT.md`: progress SSOT = `_state/state.yaml`; do not trust chat after clear/new session; writeState on transitions.
- `_state/README` / deck-guide: one-line “清上下文后先 `ppt_flow state`”.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Agent ignores ritual | CONTRACT iron rule + COMMANDS + BOOTSTRAP triple; resume card makes position obvious |
| Stale `current_node` after manual file edits | Ritual compares artifacts via `status`; agent may heal node status with user confirm |
| `suggested_next` too clever / wrong | Keep heuristic short; never auto-mutate state from suggestion alone |
| Dual-write approve surprises scripts that only read metadata | Metadata remains pipeline SSOT for Stage 2; `_state.gates` becomes matching mirror |
| Users want mid-node resume | Explicit non-goal; `waiting_for` + open artifacts cover common waits |

## Migration Plan

1. CLI: resume card + approve dual-write + tests.
2. Docs/contract/COMMANDS/BOOTSTRAP/`_state` README.
3. Light playbook notes where writeState already mentioned.
4. Rollback: revert change; legacy decks keep working (`waiting_for` optional).

## Open Questions

无。
