## ADDED Requirements

### Requirement: outputs_linted is a deterministic exit condition

The `DETERMINISTIC_CONDITIONS` registry SHALL include `"outputs_linted"`. The implementation in `state.mjs` `CONDITIONS` SHALL call `lintNodeProduces(ctx.runDir, ctx.nodeId, ctx.playbookDir)` and return `true` only when ALL results have `ok: true`. The condition SHALL be exit-only.

#### Scenario: All produces pass

- **WHEN** condition is evaluated for node `wave0` whose produces are valid
- **THEN** the condition returns `true`

#### Scenario: One produce fails

- **WHEN** condition is evaluated and `slide-specifications.md` has errors
- **THEN** the condition returns `false`

### Requirement: checkExit and checkEntry inject nodeId and playbookDir into ctx

`checkExit(nodeName, playbookDir, state, ctx)` SHALL merge `{ nodeId: nodeName, playbookDir }` into ctx before passing to conditions. `checkEntry` SHALL do the same.

#### Scenario: nodeId and playbookDir reach condition

- **WHEN** `checkExit("wave0", playbookDir, state, { runDir })` is called
- **THEN** conditions receive `ctx.nodeId === "wave0"` and `ctx.playbookDir === playbookDir`

### Requirement: create-deck nodes with file produces include outputs_linted in exit

Nodes in `create-deck.md` whose produces include agent-authored MD files (`instantiation` → `deck-guide`, `seed-topics` → `core-metaphor`/`core-formula`, `wave0` → `slide-specifications-l1-l2-l4`, `wave1` → `validated-slide-specifications`) SHALL include `outputs_linted` in their `exit` lists. Existing exit conditions SHALL remain unchanged.

#### Scenario: seed-topics exit validates core-metaphor and core-formula

- **WHEN** Agent completes `seed-topics` and runs `checkExit`
- **THEN** `outputs_linted` verifies `core-metaphor.md` and `core-formula.md` have valid frontmatter
- **AND** `block-map` (no file) is skipped with `ok: true`

#### Scenario: wave0 exit allows L3 placeholders

- **WHEN** Agent completes `wave0` and `slide-specifications.md` has L3 placeholders
- **THEN** `outputs_linted` returns true (placeholders are allowed at wave0 via `allowPlaceholders: true`)
- **AND** node can complete

#### Scenario: wave1 exit rejects L3 placeholders

- **WHEN** Agent completes `wave1` and `slide-specifications.md` still has placeholder residue
- **THEN** `outputs_linted` returns false (placeholders forbidden at wave1 via `allowPlaceholders: false`)
- **AND** node cannot complete until all L3 prompts are filled

### Requirement: create-deck nodes with file produces have a lint CLI step

Nodes in `create-deck.md` that include `outputs_linted` in exit SHALL have a **Step N — CLI** that instructs the agent to run `ppt_flow lint --run-dir <runDir> --node <nodeId>` after producing files. The step SHALL instruct the agent to: read the lint output, fix reported errors, re-run lint, repeat until clean (max 3 rounds). If 3 rounds still fail, hard-stop and report to user with the lint output.

#### Scenario: wave0 step includes lint CLI instruction

- **WHEN** Agent reads `wave0` node body
- **THEN** after content creation steps, a CLI step instructs running `ppt_flow lint --run-dir <runDir> --node wave0`
- **AND** the step describes the PDCA pattern: lint → fix → re-lint, max 3 rounds

#### Scenario: Agent follows lint step, fixes, re-runs

- **WHEN** Agent runs `ppt_flow lint` per the step and sees errors
- **THEN** the agent fixes the reported files and re-runs lint
- **AND** continues until lint passes or 3 rounds exhausted
