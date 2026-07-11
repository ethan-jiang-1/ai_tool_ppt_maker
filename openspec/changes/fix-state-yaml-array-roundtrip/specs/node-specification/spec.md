## MODIFIED Requirements

### Requirement: Playbook stack preserves position during switching

`_state/state.yaml` SHALL include a `playbook_stack` field that is a **YAML array** of `{playbook, current_node}` objects. `writeState` / `readState` SHALL round-trip this field without changing its type: an empty stack SHALL remain an empty array (not an object), and a non-empty stack SHALL preserve each entry's `playbook` and `current_node` strings. `switchPlaybook()` SHALL push the current position onto the stack. `resumePlaybook()` SHALL pop and restore position. If a legacy file has a non-array `playbook_stack` (for example `{}`), the read/heal path and/or the switch/resume helpers SHALL normalize it to an empty array before use so `.push` / `.pop` do not throw.

#### Scenario: Agent switches playbooks and returns

- **WHEN** Agent is at `hitl2` in `create-deck`, switches to `edit-text`, finishes, and resumes
- **THEN** `resumePlaybook()` restores `playbook: create-deck`, `current_node: hitl2`
- **AND** `playbook_stack` is empty after resume

#### Scenario: Empty playbook_stack survives write/read

- **WHEN** a state with `playbook_stack: []` is written with `writeState` and read back with `readState`
- **THEN** `playbook_stack` is an array of length 0
- **AND** `switchPlaybook` can push without throwing

#### Scenario: Non-empty playbook_stack survives write/read

- **WHEN** a state whose stack contains `{playbook: "create-deck", current_node: "setup"}` is written and read back
- **THEN** `playbook_stack` is an array of length 1
- **AND** the entry's `playbook` and `current_node` match what was written

#### Scenario: Legacy non-array stack is normalized

- **WHEN** `state.yaml` has a non-array `playbook_stack` (for example an empty mapping)
- **THEN** after `readState` (default heal) the in-memory `playbook_stack` is an array
- **AND** `switchPlaybook` does not throw `push is not a function`

### Requirement: CLI exposes state via ppt_flow state command

`scripts/ppt_flow.mjs` SHALL support a `state` subcommand registered inside `main()` on the same `Command` instance used by `parseAsync`, before parsing: `state <runDir>` (human-readable summary), `state <runDir> --json` (JSON state dump on success), `state <runDir> --check-gates` (gate validation). On success, `--check-gates` exits `0`. On pending gates (any required gate not in `approved`/`waived` per `isGateApproved`), exit `1` **and** emit the CLI failure JSON envelope (`code` `GATE_BLOCKED`) as the last non-empty line of stderr per `cli-surface`. The `state` command SHALL call `readState` with **default heal** so recoverable format/schema defects do not surface as corruption. Exit `2` with envelope `code` `STATE_CORRUPTED` SHALL occur only when state remains unusable after the configured read path (for example explicit `heal: false` diagnostic reads that return `{corrupted:true}`, or an implementation failure to seed a usable state) — not when heal successfully rewrote or normalized the file.

#### Scenario: Agent checks state before Stage 2 — gates OK

- **WHEN** Agent runs `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs state <runDir> --check-gates`
- **AND** content and visual gates are approved or waived
- **THEN** it exits `0`

#### Scenario: Agent checks state before Stage 2 — gates blocked

- **WHEN** Agent runs `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs state <runDir> --check-gates`
- **AND** any required gate is still pending
- **THEN** it exits `1`
- **AND** the last non-empty line of stderr is JSON with `ok: false` and `code` `GATE_BLOCKED`
- **AND** `hint` names which gate(s) are pending

#### Scenario: Healable dirty state is not STATE_CORRUPTED

- **WHEN** `state.yaml` has a healable defect (for example `playbook_stack` as `{}`)
- **AND** Agent runs `ppt_flow state <runDir>` (default heal)
- **THEN** the command does not exit `2` with `STATE_CORRUPTED`
- **AND** a usable state summary or JSON is produced

#### Scenario: Corrupted state file only when unusable

- **WHEN** the state read path returns `{corrupted:true}` (strict/diagnostic or unrecovered failure)
- **AND** that result is used by the `state` command
- **THEN** exit is `2`
- **AND** the last non-empty line of stderr is JSON with `code` `STATE_CORRUPTED`

### Requirement: state.yaml carries a discoverability header on every write

`writeState(deckDir, state)` SHALL write `state.yaml` as a UTF-8 file whose leading lines are `#` comments that identify the file as playbook execution state and point readers to `charter/NODE-SPEC.md` and `scripts/lib/state.mjs` (and MAY mention `ppt_flow state`). The header text SHALL be defined once in `state.mjs` and SHALL be re-emitted on every successful write so it is not lost when the YAML body is regenerated from the in-memory object. The YAML parse path used by `readState` SHALL ignore `#` comment lines (library parse and/or strip-before-parse).

#### Scenario: Header survives rewrite

- **WHEN** `writeState` is called twice on the same deck with updated state
- **THEN** the resulting `state.yaml` still begins with a `#` comment header
- **AND** `readState` still returns the expected playbook fields

## ADDED Requirements

### Requirement: state.mjs SAFETY — heal before blaming the user

Production state I/O SHALL treat MD/Agent as the fuzzy producer and `state.mjs` as the precise repair layer. `readState(deckDir)` SHALL default to `heal: true` and return a **usable** state object. After tolerant YAML parse, the implementation SHALL run schema healing (at minimum: ensure `nodes` and `gates` are objects, ensure `playbook_stack` is an array of plain objects with string `playbook` / `current_node`). When healing changes semantics, or when parse recovered despite document errors, `readState` SHALL atomically rewrite canonical `state.yaml` via library stringify (and MAY append a `history.jsonl` event such as `state_healed`). Pure whitespace/key-order drift against stringify without semantic change SHOULD NOT force a rewrite on every read. When YAML cannot yield a usable object, `readState` SHALL rename the broken file aside (`state.yaml.broken.<timestamp>`), seed a default usable state (preserving `deck.name` when recoverable), write it, and return that state. Returning `{corrupted:true}` SHALL NOT be the default novice-facing path; `heal: false` MAY expose corruption for diagnostics. MD Controllers SHALL treat state format problems as **agent-owned repairs**: heal/rewrite first, optionally one short sentence to the user, and SHALL NOT present raw YAML parse errors as the user's next action.

#### Scenario: Malformed YAML is backed up and replaced

- **WHEN** `_state/state.yaml` contains unparseable YAML
- **AND** `readState` is called with default heal behavior
- **THEN** a broken-file backup exists beside the state path
- **AND** a usable state object is returned (not `{corrupted:true}` as the primary result)
- **AND** a fresh `state.yaml` has been written

#### Scenario: Agent does not dump YAML errors on a novice

- **WHEN** an MD Controller discovers invalid or healed state during playbook execution
- **THEN** it continues after heal/rewrite (or invokes the heal path)
- **AND** it does not instruct the user to manually edit YAML syntax as the primary next step

### Requirement: State YAML parse/stringify uses a maintained YAML library

`scripts/lib/state.mjs` SHALL use the npm `yaml` package for production `_state/state.yaml` I/O. **Read** SHALL use tolerant `parseDocument` options (at minimum `strict: false`, and duplicate keys not fatal) then schema healing — analogous in intent to JSON `jsonrepair`. **Write** SHALL emit only `stringify` output plus the existing `#` header. Hand-written mini-YAML SHALL NOT remain the authority for production state I/O.

#### Scenario: Round-trip encoding matches stack semantics

- **WHEN** `writeState` serializes a non-empty `playbook_stack` and `readState` parses the file
- **THEN** the parsed value is an array of objects with `playbook` and `current_node`
- **AND** no entry is the string `"[object Object]"`

#### Scenario: Dirty read is written back clean

- **WHEN** `state.yaml` parses but needs schema healing (for example `playbook_stack` as `{}`)
- **AND** `readState` runs with default heal
- **THEN** the returned state is usable
- **AND** the on-disk `state.yaml` body is rewritten as canonical YAML from library stringify
