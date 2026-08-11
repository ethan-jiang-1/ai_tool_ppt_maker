## Purpose

Define the Node — the atomic unit of playbook execution — and its governing constitution at `charter/NODE-SPEC.md`: node frontmatter (entry/exit gates), the run-bundle state model (`_state/state.yaml` as the single truth source plus the append-only `_state/history.jsonl`), the five node statuses, shared nodes, the gate-conditions catalog, and the `scripts/shared/state/state.mjs` API (the CONDITIONS registry, `checkEntry`/`checkExit`, atomic writes, and the query/manipulation functions). This capability guarantees that any agent can deterministically decide whether a node may start or complete, resume an in-progress run from persisted state, and switch between playbooks without losing its position.
## Requirements
### Requirement: Stateful Controller entry follows verified Harness binding

Before a Controller or state consumer uses a run-scoped Deck as current work,
the owning CLI or locator entry SHALL verify that Bundle's v2 local Harness
binding. The MD Controller SHALL consume the resulting bounded success or
hard-stop and SHALL not infer a current execution, choose another Harness, or
seed state from a structure-only observation.

#### Scenario: A legacy Bundle is presented to a stateful command

- **WHEN** a stateful command derives a Deck root with a missing or legacy
  locator
- **THEN** it returns the binding owner's one bounded hard-stop before reading
  state or selecting a Controller node
- **AND** the Controller does not create a replacement state record

### Requirement: NODE-SPEC.md exists in charter directory

`ppt_maker_harness/charter/NODE-SPEC.md` SHALL exist as the constitutional specification for Nodes, defining their anatomy, state schema, and execution rules.

#### Scenario: Developer reads node specification

- **WHEN** a developer opens `charter/NODE-SPEC.md`
- **THEN** they understand the Node frontmatter structure, state schema, and how playbooks are organized

### Requirement: Node status has exactly five valid states

A node's status SHALL be one of: `pending` (not started), `in_progress` (currently executing), `completed` (all exit conditions met), `skipped` (explicitly bypassed by user decision), or `failed` (blocked and requiring intervention). `setNodeStatus` SHALL reject any other value. State heal SHALL normalize an invalid persisted value to `pending`, preserve a diagnostic note, and write the cleaned state. Transitioning a previously completed node to `in_progress` or `pending` SHALL remove its stale `completed` timestamp; completing a node SHALL remove fields that claim it remains failed.

#### Scenario: Invalid status write is rejected

- **WHEN** a caller invokes `setNodeStatus(state, 'authoring-slides', 'done')`
- **THEN** the API throws a validation error
- **AND** does not mutate the node record

#### Scenario: Node transitions through statuses

- **WHEN** an agent starts a pending node and later satisfies every exit condition
- **THEN** the persisted status transitions `pending` → `in_progress` → `completed`
- **AND** an explicit user-authorized bypass uses `skipped`, not an invented synonym

#### Scenario: Completed node is restarted cleanly

- **WHEN** a completed node is set to `in_progress`
- **THEN** its prior `completed` timestamp is removed
- **AND** a new `started` timestamp is recorded

#### Scenario: Invalid persisted status heals safely

- **WHEN** `state.yaml` contains an unsupported node status
- **THEN** default-heal rewrites it as `pending` with a diagnostic note
- **AND** downstream execution remains blocked until the node is deliberately resumed

#### Scenario: User explicitly skips a node

- **WHEN** the user authorizes bypassing a skippable node
- **THEN** the node is recorded as `skipped` rather than `completed`
- **AND** downstream `node_done` prerequisites may proceed without falsifying completion evidence

### Requirement: Shared nodes can be referenced by multiple playbooks

A node with `shared: true` in frontmatter SHALL be referenceable by multiple playbooks. Playbooks SHALL reference shared nodes via `includes: [<node-name>, ...]` rather than duplicating the node content.

#### Scenario: Two playbooks use the same classification node

- **WHEN** playbook `edit-text.md` and `edit-visual.md` both need change classification
- **THEN** they both reference `includes: [classify-change]` rather than each containing a copy

### Requirement: Node body distinguishes MD steps from CLI steps

Each node body SHALL contain one or more compact step declarations using exactly `**Step N — MD**`, `**Step N — CLI**`, or `**Step N — GATE**`. Step numbers SHALL start at 1 and increase monotonically within the node. MD steps SHALL reference methodology without duplicating it; CLI steps SHALL include an exact command or API operation with placeholders; GATE steps SHALL describe the user decision and persisted evidence/gate update. Mixed labels such as `CLI/State` SHALL be split into separate canonical steps.

#### Scenario: Agent reads a node with mixed step types

- **WHEN** Agent reads a node containing creative work, a script invocation, and a user review
- **THEN** the body uses distinct MD, CLI, and GATE steps in order
- **AND** the validator can associate those steps with the preceding YAML declaration

#### Scenario: Node body has no executable steps

- **WHEN** a node declaration is followed by no canonical step before the next node
- **THEN** playbook validation fails and names the node

### Requirement: ctx parameter provides run bundle paths to conditions

`checkEntry` and `checkExit` SHALL accept a `ctx` parameter providing: `deckDir` (deck root), `runDir` (current version dir), and `harnessDir` (PPT Maker Harness root). FILESYSTEM conditions SHALL resolve paths relative to these directories. The context SHALL not expose a retired root field.

#### Scenario: Condition resolves file path via ctx

- **WHEN** `checkEntry('authoring-slides', playbookDir, state, { deckDir, runDir })` is called
- **THEN** the `slide_specs_exists` condition checks `join(runDir, 'slide-specifications.md')`
- **AND** visual-language readiness checks `join(deckDir, '2_backbone/visual-style/page-authority-visual-language.yaml')`

#### Scenario: Developer looks up a condition

- **WHEN** a developer opens `charter/NODE-SPEC.md`
- **THEN** they see the complete conditions catalog with standard names

### Requirement: CONDITIONS registry is implemented in state.mjs

`scripts/shared/state/state.mjs` SHALL export a `CONDITIONS` object mapping each standard condition name to an executable check function. Parameterized conditions (e.g., `node_completed:<name>`) SHALL be supported via function factories.

#### Scenario: Condition is checked

- **WHEN** `CONDITIONS['run_bundle_exists'](state, ctx)` is called
- **THEN** it returns `true` if the deck directory exists on disk
- **AND** `false` otherwise

### Requirement: checkEntry validates entry conditions

`checkEntry(nodeName, playbookDir, state, ctx)` SHALL resolve the exact node declaration from the canonical playbook index, evaluate each `requires` dependency as `node_done:<id>` within the active `execution_id`, then evaluate explicit deterministic `entry` conditions. It SHALL return `{ pass: boolean, missing: string[], unknown: string[] }`. An absent, duplicated, invalid, or unknown-condition node SHALL NOT return `pass: true`. Current-node `evidence:`, `user_evidence:`, `decision_recorded`, and `user_decision_recorded` conditions SHALL be forbidden in entry lists; branch selection MAY use `node_evidence:<required-node>:<key>` or `node_decision:<required-node>:<value>`. Cross-node evidence and decisions SHALL additionally require the upstream node to be `completed`, not merely `skipped`.

#### Scenario: Entry gate fails with missing conditions

- **WHEN** `authoring-slides` declares `requires: [seed-topics]`
- **AND** `seed-topics` is neither completed nor skipped
- **THEN** `checkEntry('authoring-slides', ...)` returns `pass: false`
- **AND** `missing` includes `node_done:seed-topics`

#### Scenario: Unknown condition returned for manual judgment

- **WHEN** a node declaration contains a condition outside the canonical catalog
- **THEN** `checkEntry` returns that token in `unknown`
- **AND** returns `pass: false` so the declaration must be corrected rather than implicitly approved

#### Scenario: Embedded declaration is actually parsed

- **WHEN** a node is declared in a fenced YAML block inside a playbook controller
- **THEN** `checkEntry` evaluates that declaration's dependencies and entry conditions
- **AND** it does not return a vacuous pass because document frontmatter lacks `entry`

#### Scenario: Current-node evidence entry condition is rejected

- **WHEN** a node declares `entry: [user_evidence:user-approved]`
- **THEN** validation fails because current-node evidence cannot exist before the node starts

#### Scenario: Upstream decision selects a branch

- **WHEN** a readiness branch declares `entry: [node_decision:checkpoint-final-review:proceed]`
- **AND** required upstream node `checkpoint-final-review` completed after recording a typed user decision with value `proceed` in the current execution
- **THEN** the branch entry condition passes

### Requirement: checkExit validates exit conditions

`checkExit(nodeName, playbookDir, state, ctx)` SHALL resolve the same canonical node declaration as `checkEntry`, parse the `exit` field, and evaluate deterministic and typed persisted evidence conditions. It SHALL NOT mark an absent, duplicated, unparsed, or unknown-condition node as passed.

#### Scenario: Exit gate passes when conditions met

- **WHEN** authoring-slides deterministic exit conditions and required typed evidence are current in state
- **THEN** `checkExit('authoring-slides', ...)` returns `{ pass: true, missing: [], unknown: [] }`

#### Scenario: Missing artifact blocks exit

- **WHEN** a production node declares `pptx_generated` and no PPTX exists
- **THEN** `checkExit` returns `pass: false`
- **AND** `missing` includes `pptx_generated`

### Requirement: node_done condition accepts completed or skipped

The catalog SHALL include a `node_done:<name>` condition that returns true when the node status is `completed` OR `skipped`. This condition SHALL be used in `requires` chains so skipped nodes do NOT block downstream nodes.

#### Scenario: Skipped node does not block downstream

- **WHEN** node `checkpoint-intake` is `skipped` and `checkEntry` for `setup` includes `node_done:checkpoint-intake`
- **THEN** the condition passes
- **AND** setup can proceed

### Requirement: Playbook stack preserves position during switching
_state/state.yaml SHALL contain a playbook_stack YAML array for deep parent-execution snapshots. Ordinary resumable entries use playbook, current_node, execution_id, execution_started_at, run_version, and controller_nodes, where every contained Controller record binds the same run version. writeState and readState SHALL round-trip that array. switchPlaybook() pushes the six-field snapshot, preserves reserved system records, clears the active Controller set, and starts nested work for the same exact version; resumePlaybook() restores that snapshot and retains latest reserved records.

Only the current cross-pipeline transaction may add the closed transition-suspended extension defined by its own requirement. Unknown keys, invalid versions/modes/pipelines/hashes, a source mode that disagrees with authoritative state, malformed embedded frames, more than one suspension, or any generic resume of a suspension SHALL fail closed. A pre-current or incomplete stack record is not normalized into a resumable execution: observation returns one bounded owner-issued typed next action with original bytes intact, and no read/heal operation fabricates a suspension.

#### Scenario: Ordinary nested work remains resumable
- **WHEN** an ordinary same-version iteration Controller finishes
- **THEN** resumePlaybook() restores the exact six-field parent snapshot
- **AND** it does not infer transition-only identity

#### Scenario: Historical stack cannot be promoted
- **WHEN** a stack entry lacks an execution snapshot or provable current run version
- **THEN** state returns bounded unsupported-protocol guidance without writing it
- **AND** resume does not attribute shared-node evidence to a guessed execution

### Requirement: State writes are atomic
writeState(deckDir, state, { journalOwnerToken, expectedStateSha } = {}) SHALL retain a unique same-directory temporary write plus atomic rename and ignore stale temporary siblings as truth. Every mutation of a supported current state SHALL use the exact expected-state SHA from which its output was derived. The writer SHALL verify that SHA before temporary creation and immediately before rename. With a transaction journal present, a missing or mismatched token returns CONFLICT before temporary creation; a matching token is valid only for its journal-bound canonical output SHA. While a state-owned transaction is active, only its closed owner operation may write its bound record.

Before temporary creation, the writer SHALL validate the complete candidate
against the current state grammar, including the allowed top-level key set,
schema, exact current source/state/run identity, and existing semantic
invariants. A failed validation SHALL reject the candidate without removing,
normalizing, or serializing its invalid field.

Immediately before rename, every writer SHALL recheck journal bytes/absence, current-state SHA, reset status/ID/owner token, and current supported source/state identity. Any mismatch removes only its own temporary file and leaves durable state unchanged. Unsupported historical records are never write targets for writeState; their caller receives one non-writing owner-issued typed next action.

#### Scenario: Current writer races a gate journal
- **WHEN** an ordinary node transition lacks the exact journal token while a journal exists
- **THEN** it returns CONFLICT before creating a temp file or changing state

#### Scenario: Candidate contains a non-state diagnostic
- **WHEN** a state mutation supplies a candidate with an undeclared top-level
  diagnostic key such as `code`
- **THEN** the writer rejects it before temporary-file creation or history
  append
- **AND** it does not silently strip the field and continue the mutation

#### Scenario: Historical state is not atomically rewritten into current form
- **WHEN** a pre-current or retired state protocol reaches a write path
- **THEN** the path stops before temp creation and leaves original bytes untouched

### Requirement: Requested execution resolution remains separate from durable state

For a supported current state, the State owner SHALL evaluate a caller's
requested run version as a separate typed execution-resolution result. A
successful result SHALL bind the caller to the exact active execution version
and current state identity. A version mismatch SHALL return the requested and
active versions in a bounded diagnostic result; it SHALL NOT be represented as
fields on, merged into, or returned as a durable state record that can enter a
state mutation. State consumers that intend to mutate Page Image lifecycle,
history, or delivery facts SHALL require a successful execution resolution
before their first derived-artifact, state/history, or provider action.

#### Scenario: Inactive Page Image request is rejected before delivery work

- **WHEN** a current state has active `run_version: v2` and a Page Image
  mutation is requested for `v1`
- **THEN** the state owner returns the bounded execution-version mismatch
  hard-stop with `v1` and `v2`
- **AND** it creates no derived artifact, state/history record, provider work,
  or source/generated mutation

#### Scenario: Durable state object remains within the current grammar

- **WHEN** a caller resolves a run version that differs from the active
  execution
- **THEN** no returned durable state record contains `code`,
  `requested_run_version`, or `active_run_version` as top-level state fields
- **AND** an otherwise valid state remains valid for subsequent read-only
  validation

### Requirement: Owner-controlled repair removes only the known execution mismatch signature

The State owner SHALL provide one explicit, deterministic repair operation for
the BUG-066 signature: top-level `code` with value
`execution_run_version_mismatch`, plus `requested_run_version` and
`active_run_version`. The operation SHALL be eligible only when the selected
run is the current active execution, the diagnostic versions exactly identify
that selected and active run, removing all three fields yields a fully valid
current state, and current source/state identity, journal, and CAS facts pass.
It SHALL atomically write the repaired state and append an owner-attributed
history event. The operation SHALL be idempotent after a successful repair.

All other unknown state fields, partial signatures, version disagreement,
inactive selections, failed validation, or changed CAS/journal/source facts
SHALL remain bounded non-writing hard-stops. The repair SHALL NOT infer a
replacement execution, source, workflow, receipt, evidence, or acceptance.

#### Scenario: Exact known signature repairs through the state owner

- **WHEN** the selected active run has exactly the BUG-066 top-level diagnostic
  triplet and the remaining current state passes complete validation
- **THEN** the state owner removes only that triplet through its atomic/CAS
  boundary and appends one repair history event
- **AND** a subsequent read-only validation succeeds without creating a new
  execution or derived artifact

#### Scenario: Valid state needs no second repair

- **WHEN** the selected active state is already fully valid and has no BUG-066
  triplet
- **THEN** a repeated or unnecessary repair operation reports the bounded
  no-repair-needed success without changing state or appending a history event
- **AND** it does not reinterpret the absence of the diagnostic triplet as a
  request for another repair

#### Scenario: Partial or broader state corruption is preserved

- **WHEN** an active state has the BUG-066 triplet plus another unknown field
  or a mismatched diagnostic version
- **THEN** the state owner returns its bounded non-writing hard-stop
- **AND** state bytes, history, source, generated artifacts, and provider work
  remain unchanged

### Requirement: State API provides complete query interface

`state.mjs` SHALL export query functions: `getNodeStatus(state, name)`, `getCurrentNode(state)`, `getCompletedNodes(state, nodeIds?)`, `getPendingNodes(state, nodeIds?)`, `isNodeCompleted(state, name)`, `isPlaybookComplete(state, nodeIds?)`, `getGateStatus(state, name)`, `isGateApproved(state, name)`, and `getMissingConditions(nodeName, playbookDir, state, ctx)`. Node-status queries SHALL treat a missing or execution-mismatched controller record as `pending` for active execution checks. Completed, pending, and playbook-complete queries SHALL accept an optional canonical node-ID list from the active playbook index. When provided, absent/current-execution-mismatched records SHALL be treated as `pending`; reserved system records and nodes outside the supplied controller set SHALL not affect the result. Existing callers that omit the list SHALL retain backward-compatible record-only behavior over the active working set where explicitly documented.

#### Scenario: Agent queries current position

- **WHEN** Agent calls `getCurrentNode(state)` on a state with `current_node: authoring-slides`
- **THEN** it returns `authoring-slides`

#### Scenario: Pending query sees nodes not yet written

- **WHEN** the active playbook index contains eleven nodes but state has records for only three
- **THEN** `getPendingNodes(state, activeNodeIds)` includes the other eight unless completed/skipped

#### Scenario: Unrelated playbook record does not block completion

- **WHEN** state retains an unfinished node record from a previously switched playbook
- **AND** all nodes in the active playbook's node-ID list are completed or skipped
- **THEN** `isPlaybookComplete(state, activeNodeIds)` returns true

#### Scenario: Backward-compatible query remains available

- **WHEN** a legacy caller invokes `getCompletedNodes(state)` without node IDs
- **THEN** it returns completed records using the existing record-only semantics

### Requirement: State API provides complete manipulation interface

`state.mjs` SHALL export manipulation functions: `setNodeStatus(state, name, status, extra)`, `resetNode(state, name)`, `skipNode(state, name, reason)`, `setGate(state, name, status)`, `switchPlaybook(state, newPlaybook)`, `startPlaybook(state, playbook)`, `createInitialState(deckName, deckType, style)`.

#### Scenario: Rerun resets a node

- **WHEN** Agent calls `resetNode(state, 'seed-topics')` during a rerun cycle
- **THEN** `seed-topics` status returns to `pending`
- **AND** previously stored extra fields (topic_count) are cleared

### Requirement: History log is append-only

`appendHistory(deckDir, event)` SHALL atomically append one JSON line to `_state/history.jsonl`. `readHistory(deckDir)` SHALL return all valid JSON events, skipping lines that fail to parse. The history log SHALL NOT participate in automatic recovery——it is for LLM reference only.

#### Scenario: History survives crash

- **WHEN** process crashes mid-write to `history.jsonl`
- **THEN** the last line may be truncated but preceding lines are intact
- **AND** `readHistory` skips the damaged line

### Requirement: CLI exposes state via ppt_flow state command
ppt_flow state <runDir>, --json, and --check-gates SHALL remain observation-first operations. They SHALL resolve the canonical deck/run version, classify the direct source marker and durable state, and call readState with purpose observe and heal false plus read-only validation. A repairable current record returns the owner-issued action without writes. Missing, retired, malformed, or mismatched state/source identity returns a bounded non-writing protocol diagnostic; it does not seed state, infer mode, select a Controller, or use generated artifacts as a resume substitute.

Closed current mutation forms, including gate-journal recovery and Page Image Workflow delivery decisions, retain their owning preconditions and exact arguments. They are mutually exclusive with observation modes and must validate current source/state identity before write. No unsupported controller identity or receipt is accepted by this command surface.

#### Scenario: Plain state observes a repairable current record
- **WHEN** ppt_flow state <runDir> --json sees a one-to-one repairable schema-5 defect
- **THEN** it reports the owner action without changing state, history, metadata, or generated output

#### Scenario: Plain state sees an unsupported protocol
- **WHEN** the run has a pre-current state or absent/retired marker
- **THEN** it returns a bounded diagnostic without creating a state file or active execution

### Requirement: Node transitions persist via writeState

Whenever a node status transitions to `in_progress`, `completed`, `failed`, or `skipped`, the agent SHALL persist via `setNodeStatus` (or equivalent API) and `writeState` before relying on chat memory. Leaving a human-wait SHALL clear or update `waiting_for` accordingly. Agents SHALL NOT treat an unpersisted node transition as durable across sessions. Schema heal / round-trip SHALL preserve optional `waiting_for` and `note` fields when present on node records.

#### Scenario: Entering a node writes in_progress

- **WHEN** Agent starts executing a node whose prior status was `pending`
- **THEN** `_state/state.yaml` records that node as `in_progress` and updates `current_node` before long work proceeds

#### Scenario: Completing a node writes completed

- **WHEN** Agent finishes a node and exit conditions are met
- **THEN** `writeState` records `completed` (and clears `waiting_for` when present) before the next node starts

#### Scenario: waiting_for survives heal round-trip

- **WHEN** a state file has `nodes.review-gate.waiting_for` set
- **AND** `readState` with default heal runs
- **THEN** the returned state still includes that `waiting_for` value

### Requirement: CLI ⇔ MD failure protocol uses JSON envelopes

Playbook CLI steps that invoke `ppt_flow.mjs` SHALL treat a non-zero exit as actionable only when paired with the JSON failure envelope on stderr (last non-empty line), as defined by `cli-surface` and `charter/CONSTITUTION.md`. MD Controllers SHALL branch on `code` and surface `message`/`hint` to the user or attempt repair — they SHALL NOT depend solely on matching prose such as `Fatal error:`.

#### Scenario: MD Controller reads a ppt_flow failure

- **WHEN** a playbook CLI step runs `ppt_flow.mjs` and it exits non-zero
- **THEN** the controller parses the last non-empty stderr line as JSON
- **AND** uses `code` + `hint` to decide the next repair action

### Requirement: state.yaml carries a discoverability header on every write

`writeState(deckDir, state)` SHALL write `state.yaml` as a UTF-8 file whose leading lines are `#` comments that identify the file as playbook execution state and point readers to `charter/NODE-SPEC.md` and `scripts/shared/state/state.mjs` (and MAY mention `ppt_flow state`). The header text SHALL be defined once in `state.mjs` and SHALL be re-emitted on every successful write so it is not lost when the YAML body is regenerated from the in-memory object. The YAML parse path used by `readState` SHALL ignore `#` comment lines (library parse and/or strip-before-parse).

#### Scenario: Header survives rewrite

- **WHEN** `writeState` is called twice on the same deck with updated state
- **THEN** the resulting `state.yaml` still begins with a `#` comment header
- **AND** `readState` still returns the expected playbook fields

### Requirement: state.mjs SAFETY — heal before blaming the user
`readState` SHALL retain tolerant YAML parsing and deterministic canonical repair for a usable current schema-5 record, but SHALL classify source marker, schema, exact run version, durable mode, and Controller identity before any repair write. Its closed purpose SHALL remain `observe|execute`; `state`, `status`, checks, and validation SHALL use `observe` and make no state/history/metadata/generated/provider write. An owner-authorized execution path MAY atomically canonicalize only a current-v5 record whose changed fields have one-to-one meaning, preserve the exact execution/evidence relationship, and are not fenced by a gate journal, reset, or transition.

A pre-current schema, topology-only execution binding, retired Controller/node identity, markerless/retired source, or impossible source/mode pair SHALL never be transformed into a current state, mode, Controller, or transition checkpoint. It SHALL return one bounded owner-issued typed next action with the raw state/history bytes intact. A current explicit run whose bytes cannot preserve its current execution/evidence SHALL similarly return the state owner's one bounded typed next action; the Controller SHALL carry that action without asking a person to hand-edit YAML or inventing a continuation from generated artifacts, metadata, history, or source preference.

#### Scenario: Current state repairs through its owner
- **WHEN** an owner-authorized execution reads a consistent schema-5 state with a one-to-one malformed status or formatting defect
- **THEN** it preserves the execution/evidence bindings and writes the canonical repaired state
- **AND** it reports the repair without treating it as human approval or a new route

#### Scenario: Plain observation does not heal
- **WHEN** `state`, `status`, or validation observes a current state that its owning execution could safely repair
- **THEN** it returns the bounded owner-issued repair action without writing state, history, metadata, or generated artifacts

#### Scenario: Historical state is not compatibility-migrated
- **WHEN** a pre-current state, topology-only binding, or retired transition/old-node identity is supplied
- **THEN** observation and execution reject it without alias migration, source/mode inference, or state replacement
- **AND** the returned recreation action does not require the user to edit raw YAML

#### Scenario: Current state cannot preserve evidence
- **WHEN** a current explicit run has state bytes that cannot establish a preserveable current execution/evidence object
- **THEN** state returns its one bounded owner-issued typed next action and preserves the original bytes during observation
- **AND** it does not create a default execution, reuse generated evidence, or silently resume work

### Requirement: State YAML parse/stringify uses a maintained YAML library
scripts/shared/state/state.mjs SHALL use the npm yaml package for _state/state.yaml I/O. Read uses tolerant parseDocument options needed to classify syntactic defects; write emits only canonical stringify output plus the existing # header. A successful parse does not authorize a write. Observation remains byte-preserving. An owner-authorized execute path may stringify a usable current schema-5 record only after its source/mode/Controller identity and one-to-one repair are verified and all fences permit the write. Pre-current, ambiguous, or evidence-unpreservable input returns one bounded owner-issued typed next action without writeback.

#### Scenario: Current canonicalization uses the YAML library
- **WHEN** an owner-authorized current schema-5 record has a one-to-one formatting defect
- **THEN** the repaired output uses library stringify and retains its execution/evidence bindings

#### Scenario: Tolerant parse does not migrate old state
- **WHEN** a historical state parses but lacks current identity
- **THEN** observation preserves bytes and returns the bounded unsupported-protocol action

### Requirement: writeState ensures _state README exists
state.mjs SHALL export the canonical _state/README.md body used by bundle scaffolding and SHALL not import bundle_layout.mjs. When an authorized write to a supported current state occurs, writeState SHALL ensure _state/README.md exists using that body. Observation, structure checking, and an unsupported historical state SHALL not create the README as an incidental repair or compatibility upgrade.

#### Scenario: Current state write creates its missing README
- **WHEN** an authorized current state write finds no _state/README.md
- **THEN** it writes the canonical discoverability README together with the allowed state operation

#### Scenario: Historical observation does not scaffold README
- **WHEN** an unsupported bundle is inspected without a state README
- **THEN** no README is created and the diagnostic remains non-writing

### Requirement: Node completion and branch decisions use typed records
Evidence-backed conditions SHALL use records shaped as `{met:true, kind:"user"|"agent"|"cli", at:<ISO-8601>, note?:<string>}` under the controller node's current execution. Decisions SHALL use `{value:<non-empty string>, kind:"user"|"agent"|"cli", at:<ISO-8601>, note?:<string>}`. `evidence:<key>` SHALL accept any valid kind on the current node exit. `user_evidence:<key>` SHALL require `kind: user`. `decision_recorded` and `user_decision_recorded` SHALL validate the corresponding current-node decision. `node_evidence:<node>:<key>` and `node_decision:<node>:<value>` SHALL read only a declared required upstream node that is completed in the same execution; a skipped predecessor SHALL not supply branch evidence. The state API SHALL expose validating `setNodeEvidence` and `setNodeDecision` helpers; `setNodeDecision` SHALL resolve the exact declaration from the supplied canonical playbook index and reject values outside that node's `decisions` enum. Durable persistence remains governed by `writeState`. Free-form prose conditions SHALL NOT silently pass.

An owner-authorized canonicalization MAY convert a scalar decision only in a current schema-5 record with a direct current execution/node binding, one-to-one value meaning, and no gate/reset/transition fence. It SHALL record `kind: agent`, report the repair, and never satisfy a user-only branch. A pre-current schema, retired Controller/node, topology-only binding, or unpreservable decision record SHALL hard-stop before scalar conversion, aliasing, or write.

#### Scenario: Unrecorded user review blocks exit
- **WHEN** a visual review node declares `user_evidence:user-reviewed-artifact`
- **AND** no matching evidence is persisted under that node
- **THEN** `checkExit` returns that condition in `missing`

#### Scenario: Persisted user review satisfies exit
- **WHEN** the agent opens the artifact, receives the user decision, and records evidence with `met: true`, `kind: user`, and `at`
- **THEN** the matching user-evidence condition passes on a fresh state read

#### Scenario: CLI completion evidence satisfies exit
- **WHEN** a probe node records `probe-finished` with `kind: cli` after exit zero
- **THEN** `evidence:probe-finished` passes
- **AND** `user_evidence:probe-finished` would not pass

#### Scenario: Typed user decision selects a branch
- **WHEN** a review node records `{value: "proceed", kind: "user", at: <ISO-8601>}` and completes in the active execution
- **THEN** its `user_decision_recorded` exit condition passes
- **AND** a required downstream `node_decision:<review-node>:proceed` entry condition passes

#### Scenario: Runtime decision value is misspelled
- **WHEN** `setNodeDecision` receives `proceeed` for a node declaring `decisions: [proceed, repair]`
- **THEN** it throws without mutating the node record
- **AND** the node cannot complete through `decision_recorded`

#### Scenario: Current scalar decision retains non-user provenance
- **WHEN** an owner-authorized execution canonicalizes a current-v5 scalar decision with a one-to-one declared value
- **THEN** it records `kind: agent` under the same current execution
- **AND** it does not satisfy a user-authorized downstream branch

#### Scenario: Historical scalar decision is not normalized
- **WHEN** a pre-current, retired, topology-only, or evidence-unpreservable record contains a scalar decision
- **THEN** state hard-stops before conversion and preserves the original bytes during observation

### Requirement: State schema is explicitly versioned and repairs only current records
`state.yaml` for every supported actively executing run SHALL use schema version 5 while preserving whole-workflow timing, execution identities, controller working sets, stack semantics, typed records, atomic writes, and reserved system records. A supported state SHALL bind one exact current source/mode pair and its exact normalized run version. Read or execute MAY perform only lossless canonicalization of an already supported schema-5 record when every affected field has a one-to-one meaning and no gate, reset, or transition fence is active. It SHALL not infer a source, mode, controller, run version, execution binding, or review evidence from metadata, generated artifacts, invocation order, source preference, or directory topology.

A pre-current, retired, identity-invalid, or evidence-unpreservable schema/state protocol is unsupported. State/status observation SHALL return a diagnostic carrying one bounded owner-issued typed next action without changing bytes, and execution SHALL fail before Controller entry, journal, staging, target publication, or provider work. It SHALL not map a historical checkpoint, receipt, or controller record into a current execution. A valid current v5 record shall never be re-inferred from source or derived artifacts. Starting a new top-level execution still requires the existing explicit replacement authorization when a current execution is incomplete and preserves reserved records.

#### Scenario: Current state remains durable
- **WHEN** a schema-5 state has an exact supported source/mode pair and normalized active execution version
- **THEN** state retains its current execution, stack, decisions, waits, gates, reset/refinement evidence, and reserved records
- **AND** canonical observation does not invent a second routing authority

#### Scenario: Prior state protocol is encountered
- **WHEN** state/status reads a schema or controller protocol outside the current supported contract
- **THEN** it returns one bounded owner-issued typed next action without rewriting the state bytes
- **AND** it does not create a mode record, execution, compatibility projection, or transition checkpoint

#### Scenario: Historical state rejection is byte-preserving
- **WHEN** a schema-4-or-earlier state, a retired transition execution, or a topology-only execution binding is supplied to observe or execute
- **THEN** the state owner rejects it before `healState`, alias mapping, marker inference, or default-state creation
- **AND** `state.yaml`, `history.jsonl`, gate journals, and version directories remain byte-identical

#### Scenario: Source or mode is inconsistent
- **WHEN** a schema-5 state has a missing, malformed, or mismatched source/mode fact
- **THEN** observation and execution fail before Controller, journal, staging, or target mutation
- **AND** no metadata or generated artifact is used to repair the relationship

#### Scenario: Incomplete current execution is protected
- **WHEN** a supported current execution is incomplete and no explicit replacement authorization exists
- **THEN** starting another top-level Controller fails without clearing or repurposing the execution

#### Scenario: Canonicalization would cross a protected fence
- **WHEN** a requested canonicalization encounters a gate, reset, or transition write fence
- **THEN** state leaves the original bytes unchanged and returns the owning recovery action

### Requirement: Gate status writes and heals enforce the catalog
Content and visual gate status SHALL be exactly pending, approved, or waived; setGate rejects all other values. An owner-authorized current schema-5 repair may normalize a one-to-one invalid gate scalar to pending while preserving a diagnostic note and all current execution/evidence bindings. Observation never performs that repair. A pre-current or ambiguous gate record cannot be normalized into current authority and returns one bounded owner-issued typed next action.

#### Scenario: Invalid current gate blocks production
- **WHEN** a current schema-5 record contains visual: yes with otherwise provable one-to-one meaning
- **THEN** the authorized owner may normalize it to pending
- **AND** production remains blocked until a current explicit decision

#### Scenario: Old gate shape is not promoted
- **WHEN** an unsupported historical state contains a scalar gate value
- **THEN** observation and execution do not rewrite it into current approval or pending evidence

### Requirement: MD consumes CLI diagnostics without guessing or shell interpretation

The CLI-to-MD consumer protocol SHALL reference producer fields and emission rules owned by capability `cli-surface`; it SHALL NOT redefine them. MD SHALL treat every non-zero CLI return as process status plus the final stderr envelope, use required top-level fields as legacy summary, and use diagnostic data for structured action only when its version is supported and the complete nested object validates against that version.

If a process ends non-zero without a valid final envelope, MD SHALL treat the producer as externally interrupted or crashed and SHALL NOT infer category, lineage, or recovery from partial stdout/stderr. A supported `interrupted` diagnostic means execution stopped, not that source or Harness code is defective.

MD SHALL NOT invent omitted paths, ids, lines, causes, invocations, approvals, or issue results. It SHALL interpret `diagnostic.next`: automatic actions may proceed only within MD authority, while `requires_human:true` SHALL stop for a genuine human decision. If `next.invocation` is followed programmatically, MD SHALL pass `program` and `args` directly without a shell; it SHALL NOT concatenate them into executable shell text.

#### Scenario: MD follows an automatic invocation safely

- **WHEN** v1 evidence has `next.requires_human:false` and a structured invocation
- **THEN** MD uses supplied causal evidence without expanding affected scope
- **AND** executes program/args with argument boundaries preserved and shell disabled

#### Scenario: MD receives a human decision gate

- **WHEN** v1 evidence has `next.requires_human:true`
- **THEN** MD presents the named decision/evidence to the human
- **AND** does not treat default or invocation as fabricated approval

#### Scenario: Process returns no valid envelope

- **WHEN** process status is non-zero but no valid final envelope exists
- **THEN** MD reports an external interruption/crash boundary
- **AND** does not promote partial output into causal evidence

### Requirement: MD follows source ownership, aggregation, and delegation semantics

MD SHALL interpret lineage as ordered evidence from editable origin toward the observed artifact. A derived artifact is not thereby an edit target; MD SHALL prefer diagnostic source and `next.inspect`, treat inspect locators as read targets rather than edit permission, and SHALL NOT hand-edit run-bundle `_generated/`. Each retained issue is a separate fact; `omitted_count` or `truncated` means evidence is incomplete. For parent-wrapped failures, parent code/where/next are control authority while preserved child subject/source/reason/lineage/issues are causal evidence; MD SHALL NOT search for a second child envelope or follow a discarded child recovery action.

#### Scenario: Failure is observed in a generated artifact

- **WHEN** lineage names a missing, stale, ambiguous, or invalid `_generated/` artifact
- **THEN** MD follows the supplied source, prerequisite owner, or rerun action
- **AND** does not patch the generated file

#### Scenario: Aggregate evidence is truncated

- **WHEN** a diagnostic has retained issues plus omitted/truncated metadata
- **THEN** MD handles listed issues
- **AND** does not assume unlisted issues passed

#### Scenario: Parent action and child evidence differ

- **WHEN** child evidence identifies a raw-generation slide but parent next action requires review
- **THEN** MD uses child evidence to understand cause
- **AND** follows parent control action rather than rerunning the child directly

### Requirement: Runtime Agents discover the consumer contract from generated run-bundle controls

An Agent entering a newly initialized run bundle SHALL encounter generated root
`AGENTS.md`/`CLAUDE.md` directions to read `RUN_BUNDLE.md` first for local location and then
`deck-guide.md` for operating rules. The guide SHALL explain the consumer essentials without
referencing repo-only OpenSpec paths: parse the final failure envelope, use supported structured
`diagnostic.next`, preserve invocation argument boundaries, stop when `requires_human` is true,
do not guess omitted lineage, and never hand-edit `_generated/`. Before asking a person to inspect
current Page Image artifacts, the guide SHALL direct the Agent to rebuild the explicit Human
Navigation Path tree and cite only its short physical locators as read targets rather than control
or edit authority. The locator contains no consumer protocol, current execution fact, command
menu, or full SHA-256 storage path.

Repository-maintenance discovery for MD implementation SHALL also be present in root `AGENTS.md` and short headers of `scripts/shared/state/md_controller_reader.mjs` and `state.mjs`, pointing to `node-specification` and active deltas without duplicating field schema.

#### Scenario: New run bundle receives a CLI failure

- **WHEN** its runtime Agent follows generated entry guidance
- **THEN** it locates the bundle before reading the guide's consumer contract
- **AND** it can act on a supported diagnostic without reading repository OpenSpec files
- **AND** it stops for human-owned decisions and preserves source/generated ownership

#### Scenario: Agent asks a person to inspect Page Image artifacts

- **WHEN** the generated guidance leads an Agent to request Style Master, page-review, final, or delivery inspection
- **THEN** the Agent rebuilds the current explicit Human Navigation Path tree and cites the
  relevant short physical locators
- **AND** it does not treat a locator, display reference, or edited navigation copy as a selector,
  approval, or generated-artifact edit permission

#### Scenario: Coding Agent changes MD consumption

- **WHEN** a repository-maintenance Agent edits MD-controller/state consumption behavior
- **THEN** root and code-adjacent instructions route it to `node-specification` plus active deltas

### Requirement: State owns inactive continuation target version

The durable state owner SHALL retain `run_version` exclusively as active-execution identity. It
SHALL retain normalized `continuation_target_version` as the non-execution exact-run selector
after a verified `RUN_BUNDLE.md` locator has identified a deck. The selector SHALL name one
existing canonical `3_versions/vN` target and SHALL be written only by init, exact
version-publication, and terminal-handoff owners through their atomic/CAS boundary. Plain
observation SHALL neither initialize, heal, replace, nor choose this selector. No generic state
setter or new CLI is introduced.

#### Scenario: Active execution takes precedence
- **WHEN** state has a normalized active `run_version` and a different continuation target
- **THEN** entry selects the active run
- **AND** the inactive selector cannot override execution identity

#### Scenario: Terminal bundle retains an exact target
- **WHEN** execution clears after visible vN becomes terminal
- **THEN** durable state retains `continuation_target_version: vN`
- **AND** verified locator entry can inspect that exact run without a latest-version guess

#### Scenario: Invalid target is a non-writing guide
- **WHEN** the target is missing, malformed, or no longer visible
- **THEN** entry requests an explicit run path after root verification
- **AND** state/status observation does not repair or choose another version

### Requirement: MD Controller separates current position from stable slide identity

When discussing or selecting pages, the MD Controller SHALL present `position + formal slide_id + title` when available. It SHALL describe position as the current version's mutable order and formal ID as the stable cross-version identity. Natural-language page numbers SHALL be converted to explicit position selectors for the current snapshot; voice or typed mnemonic variants SHALL be passed to the shared resolver. The controller SHALL NOT rewrite a formal ID merely because the page moved or its title changed.

For newly authored or inserted pages, the Agent SHALL propose a 5–6-letter-preferred, 7–8-letter-only-when-clearer `SUBJECT + MOVE` BlockCase mnemonic based on durable narrative role. It SHALL avoid a one-word page category, position suffix, random token, or unreadable compression, and SHALL present the proposed ID with title and insertion location in the structural preview. Deterministic JS validation remains authoritative for ASCII/BlockCase syntax, 5–8 length, and conflicts; the Controller SHALL NOT claim that JS made or proved the semantic choice.

#### Scenario: User refers to a current page number

- **WHEN** the user says "把第 7 页放到第 3 页后面"
- **THEN** MD converts both page references to current position selectors and requests one preview transaction
- **AND** displays the resolved formal IDs before mutation

#### Scenario: User speaks a mnemonic

- **WHEN** the user says "把 ID fix 放到 AI cost 后面"
- **THEN** MD passes voice-friendly mnemonic selectors to deterministic resolution
- **AND** does not require the user to pronounce `@`, preserve case, or spell a random code

#### Scenario: Agent names an inserted page

- **WHEN** the user requests a new page whose durable role is an AI cost argument
- **THEN** the Agent may propose `AICost` with the page title and location
- **AND** does not compress it to `AICst` merely to force five letters

### Requirement: MD Controller consumes structural previews and receipts

For add, delete, move, normalization, or multi-operation structure intent, MD SHALL invoke the `ppt_flow slides` preview path before structural mutation. It SHALL present the per-token resolution evidence when useful, resolved before/after order, formal-ID operations, target version or in-place normalization boundary, render/refresh impact, and review warnings in concise human terms. The user SHALL NOT be required to read or dictate the transaction hash. Mutation SHALL proceed only from the same base-source- and `plan_sha256`-bound transaction after explicit user authorization; MD SHALL pass the confirmed hash verbatim and SHALL NOT recreate the edit manually in Markdown, issue a bare `--apply`, or reinterpret position selectors after preview.

After apply, MD SHALL consume the edit receipt, verify the confirmed plan hash, report the created version and actual operations, and continue only with the receipt's affected refresh scope. Structural apply/materialization SHALL not be treated as remote-render authorization. Any `needs_render` IDs SHALL be reported separately and sent through an explicit Generated Image Rebuild only after the applicable cost/scope authorization. A stale-base or plan-hash failure SHALL trigger a fresh read and preview, not an automatic rebase. Natural-language page-reference warnings SHALL be treated as Agent-owned semantic review; MD SHALL inspect and repair source meaning before claiming the structure edit complete.

#### Scenario: Preview awaits confirmation

- **WHEN** a structural preview succeeds and changes slide order or membership
- **THEN** MD shows the before/after facts and waits for explicit authorization before `--apply`
- **AND** retains the preview `plan_sha256` internally without asking the user to pronounce or transcribe it
- **AND** does not treat preview success itself as permission to mutate

#### Scenario: Apply receipt drives follow-up work

- **WHEN** structural apply creates a new version and reports one inserted ID plus verified retained artifacts
- **THEN** MD continues production in the reported target version
- **AND** reports `needs_render` separately and requests expensive rendering only for those IDs through an explicit refresh authorization

#### Scenario: Source changed between preview and apply

- **WHEN** apply reports a base source hash mismatch
- **THEN** MD rereads current source and obtains a new preview
- **AND** does not edit the transaction hash or silently rebase operations

#### Scenario: Confirmed plan hash no longer matches

- **WHEN** apply reports that canonical `plan_sha256` differs from the preview the user authorized
- **THEN** MD obtains and shows a fresh preview
- **AND** does not submit a bare apply or silently accept the replanned transaction

#### Scenario: Structure succeeds but rendering is still needed

- **WHEN** the edit receipt publishes vNext with one or more `needs_render` IDs
- **THEN** MD reports that source structure succeeded and production remains incomplete
- **AND** does not invoke a remote renderer until Generated Image Rebuild scope/cost is explicitly authorized

### Requirement: MD Controller fails closed on selector and reference ambiguity

MD SHALL use semantic context to translate natural language into candidate selectors, but deterministic resolver output SHALL establish the targeted formal IDs. If selector resolution is ambiguous, a mnemonic is near-confusable, a new ID conflicts with deck history, or the structural preview/diagnostic declares `requires_human:true`, MD SHALL present bounded `position + slide_id + title` choices and stop for a genuine user decision. It SHALL NOT infer a target from current proximity or apply approximate correction.

Producer preview, receipt, and failure schemas SHALL remain owned by `slide-identity-and-ordering` and `cli-surface`. `node-specification` SHALL define consumption and state behavior by reference and SHALL NOT copy a competing wire schema into MD guidance.

MD SHALL use the structural escape ladder without getting trapped in one version: heading-only drift MAY be fixed in place; membership/order change SHALL create same-deck vNext; unproven reuse SHALL become an explicit rebuild in that vNext; and a materially different audience, objective, or narrative SHALL prompt a recommendation for a new deck. Technical failures and deterministic refresh classification remain Agent-owned. The Controller SHALL ask the user only for material remote cost, content discard/change, UX/product choices, or whether to fork a genuinely new deck.

#### Scenario: Two titles match spoken intent

- **WHEN** the user's phrase could identify two current pages and the resolver returns ambiguity
- **THEN** MD presents both current positions, formal IDs, and titles
- **AND** waits for the user to select one

#### Scenario: Deterministic warning requires semantic repair

- **WHEN** an edit receipt identifies prose that still says "page 7" after reordering
- **THEN** MD treats the locator as evidence to inspect, not permission for blind replacement
- **AND** does not mark verification complete until the reference is semantically resolved

#### Scenario: Consumer does not redefine producer fields

- **WHEN** maintainers update a structural preview or diagnostic producer schema
- **THEN** MD guidance points to the owning capability and supported version
- **AND** does not preserve a divergent copied field list

#### Scenario: Materially different narrative triggers a deck decision

- **WHEN** requested changes alter audience, objective, or narrative enough that version continuity is misleading
- **THEN** MD recommends creating a new deck and explains the reason
- **AND** waits for the user before forking rather than forcing the work into vNext

### Requirement: State validation is non-mutating by default

The public state interface SHALL provide a read-only validation mode that checks canonical state shape,
reserved version keys, SHA/path references, exact delivery keys, and waiver/approval field invariants.
Validation SHALL return bounded field-level diagnostics and SHALL not heal, rewrite, or seed state unless
a separate explicit repair operation is invoked.

#### Scenario: Validation finds extra delivery fields

- **WHEN** a delivery record contains an undeclared key
- **THEN** validation identifies the extra field and expected key set
- **AND** it leaves the original state bytes unchanged

### Requirement: State mutation revalidates direct facts after observation
State-owned transition, gate, journal, reset, and recovery mutations SHALL continue to perform their existing direct-fact and CAS checks at write time. A workflow inspection result SHALL be consumed only as observation; it SHALL not satisfy an identity, receipt, provenance, authorization, journal, or CAS precondition.

#### Scenario: Journal changes after inspection
- **WHEN** a journal owner or state byte changes after a workflow inspection is produced
- **THEN** the subsequent state mutation revalidates the current journal and CAS facts
- **AND** it fails or follows the existing owner recovery path when they no longer match

### Requirement: MD diagnostic consumption renders the canonical four-part handoff

MD Controllers and runtime Agent guidance SHALL consume a valid final CLI
failure envelope through the canonical diagnostic-recovery handoff. They SHALL
preserve the producer's bounded category, causal facts, and exact supported
`next` as the control authority; this consumer contract SHALL not copy or
extend the `cli-surface` schema.

For user-facing diagnosis, the consumer SHALL render exactly the four canonical
parts in order: what happened, what it affects, what the Agent can mechanically
do, and the one real human action or confirmation required. The consumer SHALL
state that no human action is needed when the producer permits an entirely
mechanical action. It SHALL stop for an owner-required human action, preserve
the current checkpoint, and not expose raw producer output or invent a retry,
fallback, shell invocation, authorization, or diagnostic classification.

For a non-zero process without a valid final envelope, the consumer SHALL retain
the existing external-interruption boundary and SHALL not promote partial output
into causal evidence. It may proceed only through the canonical next applicable
read-only discovery branch, preserving the fixed recovery precedence owned by
the Agent Contract.

#### Scenario: Human-required diagnostic is not automated

- **WHEN** a valid final failure envelope has `requires_human: true`
- **THEN** the MD consumer presents the four canonical parts and stops at the
  one producer-owned human action
- **AND** it does not run the next invocation, fabricate approval, or replace
  the action with a generic retry

#### Scenario: Invalid failure output remains non-causal

- **WHEN** a non-zero invocation has no valid final failure envelope
- **THEN** the MD consumer reports the external/interrupted boundary without
  parsing incidental stderr as a recovery policy
- **AND** any subsequent inspection, locator, or direct environment recovery
  follows the canonical Agent Contract precedence

### Requirement: Generated run-bundle guidance preserves the located diagnostic boundary

The generated `deck-guide.md` consumer guidance for a located run bundle SHALL
state the same four-part diagnostic outcome and producer-action boundary without
claiming to locate a run or start pre-install recovery. It SHALL direct a
runtime Agent to consume only the final valid envelope, retain argument
boundaries, stop for a human-required action, and avoid hand-editing state or
generated output.

#### Scenario: A new bundle receives an owner failure

- **WHEN** a runtime Agent reads the generated guide after a CLI failure in a
  located bundle
- **THEN** it can explain the failure in the four canonical parts and preserve
  the producer's exact next action
- **AND** it does not infer a route, state edit, authorization, or raw-output
  repair from the guide

### Requirement: Controller state binds one current Page Image Workflow lineage

For production work, Node and State SHALL bind one exact schema-declared
`page-image-workflow` source and `image2-page-workflow` state pair, one
version-level `framed` or `pure` workflow, and the declared
`page-source-receipt` role when materialized. The Controller may project
lifecycle facts but SHALL not duplicate provider input, review authority, or
final acceptance as a second evaluator. An undeclared selector fails through
the current owner before state repair, provider work, or a lifecycle transition;
the Controller SHALL not classify it as a retained historical lineage.

#### Scenario: Controller observes one current lineage

- **WHEN** a current source/state pair and receipt are bound for production
- **THEN** Node/State records one declared workflow lineage and its owner facts
- **AND** no version-suffixed or historical selector can route the Controller

#### Scenario: State does not invent a per-slide policy

- **WHEN** Controller state observes a current version-level workflow
- **THEN** it preserves the selected policy as version-level owner fact
- **AND** it does not derive a per-slide or alternate protocol policy

### Requirement: State owns one current Page Image Task Mandate reference

For each current Page Image version, State SHALL be the durable owner of an
optional, versioned Task Mandate record. A valid record SHALL bind only the
current run version, selected workflow, active execution identity and start
time, issuance time, the fixed `normal-page-image-production` scope, and a
stable digest/reference used by the raw-plan lineage. It SHALL NOT persist raw
Work Request prose, prompt text, credentials, provider responses, or an
unbounded human-cost questionnaire.

The MD Agent interprets a clear current Work Request; the selected Page Image
planning path SHALL establish the record once when that provider-free planning
is invoked under that request, or reuse it only when those direct bindings
still match. Source edits inside the same version/workflow/execution may reuse
the mandate while producing a new exact raw plan and grant. A new version,
execution, workflow, identity failure, or explicit out-of-scope request SHALL
not reuse the old reference for new provider work. State observation SHALL stay
byte-preserving and SHALL not infer Work Request semantics, repair, or activate
a mandate.

The Controller may record successful mandate-covered planning and exact-grant
evidence as `agent` or `cli`; it SHALL NOT record it as a human visual or cost
decision. Existing user-only Pilot, Complete Page Review, and delivery-review
decisions retain their typed `user` provenance.

#### Scenario: Current planning records one bounded mandate

- **WHEN** a selected Framed or Pure current execution reaches provider-free
  progressive raw planning with no matching Task Mandate
- **THEN** the owning state mutation records one current non-secret mandate
  reference with its exact version, workflow, and execution binding
- **AND** a retry of the same current planning scope reuses that reference
  rather than creating another human decision record

#### Scenario: Observation never manufactures Work Request authority

- **WHEN** state/status inspection finds no current Task Mandate or a stale
  mandate reference
- **THEN** it reports the bounded owner-issued next action without writing
  State, history, task projections, generated artifacts, or provider work
- **AND** it does not infer authority from chat text, a prior grant, or a
  navigation artifact

#### Scenario: A direct grant cannot complete an unrelated Controller node

- **WHEN** an exact `image2 authorize` operation records or replays a valid
  mandate-bound grant while the active Controller node is not the matching
  Framed/Pure Pilot or Expansion authorize node
- **THEN** the direct raw-owner grant remains its own valid evidence while the
  state-owned handoff leaves Controller node status and evidence unchanged
- **AND** it does not fabricate a user decision or complete a sibling node

#### Scenario: A current refinement supersedes only prior CLI grant evidence

- **WHEN** a same-execution source refinement or successor establishes a later
  current mandate-bound exact grant at its matching stable authorize node
- **AND** that node's prior completion contains only typed CLI grant evidence
- **THEN** State records the later exact CLI evidence as the current Controller
  projection and retains each prior raw plan, batch, grant, attempt, and
  provenance record unchanged
- **AND** human, malformed, unmatched-node, or failed current-fact evidence is
  not reset or superseded

### Requirement: Fresh target versions do not inherit Page Image Workflow acceptance

On first structural publication or `new-version` target activation, State SHALL
retain source-version records but create a fresh selected-workflow draft with
no replacement receipt, Style Master acceptance, raw authorization/evidence,
Complete Page Review, final manifest, assembly, notes, or delivery receipt.
Target readiness SHALL be evaluated only from target-owned current facts. An
exact replay may preserve later target-owned facts after revalidation, but it
SHALL never copy or rebind source-version acceptance.

#### Scenario: A same-policy target still starts unaccepted

- **WHEN** a current Pure source version produces a new Pure target version
- **THEN** the target begins with no Style Master or page-production acceptance
- **AND** state does not inherit source raw or delivery evidence

### Requirement: State atomically activates a clean current target authoring draft

After an exact `new-version` or structural publication creates a clean target
with an explicit current `framed` or `pure` source selection, the State owner
SHALL atomically create one `create-deck` execution bound to that exact target
version and its controller-manifest-validated selected-workflow draft-route
node. Its continuation target, when recorded, SHALL identify that same target.
An explicit completed or inactive source is eligible when its current source
selection and durable facts agree; the caller-supplied source version remains
the only source identity.

Activation may retain the target's copied canonical source selection, but it
SHALL NOT materialize a target source receipt or production-mode record, or
create Style Master acceptance, raw plan/authorization/evidence, Complete Page
Review, final manifest, assembly, notes, delivery, provider grant, or provider
attempt. It SHALL preserve source-version records as source facts and shall not
infer a continuation, receipt, or acceptance from them. A malformed current
selection, target conflict, or active execution for another version SHALL
hard-stop before State mutation or provider work.

#### Scenario: A clean target receives its own current draft execution

- **WHEN** an exact current Framed source is copied into a clean target
- **THEN** the target receives a `create-deck` execution for its Framed draft
  route and no materialized page-production lineage
- **AND** the source execution and its receipt/evidence remain unchanged

#### Scenario: Target activation fails before a competing continuation is written

- **WHEN** target cleanliness or an active execution binding is inconsistent
- **THEN** State returns the owning repair action before writing a target
  execution or continuation pointer
- **AND** it does not reinterpret source evidence as target evidence or invoke
  a provider

### Requirement: Style Master readiness is replacement-protocol scoped

The `style_master_accepted` Controller prerequisite SHALL consult only the
current Style Master acceptance for the exact Page Image Workflow version,
workflow, source/visual scope, and selected bytes. File presence, task cards,
v2 candidates, a v2 acceptance record, or a sibling workflow selection SHALL
not satisfy the condition. The Boolean remains read-only; the Style Master
owner supplies its detailed repair action.

#### Scenario: A v2 style asset does not pass current readiness

- **WHEN** an otherwise current Framed version has only a v2 Style Master
  selection or `style_master.jpg` file
- **THEN** `style_master_accepted` is false and inspection points to the
  current Style Master owner
- **AND** state does not seed a replacement acceptance record

### Requirement: State records only JPEG-bound current delivery lineage

When State records a current Page Image delivery handoff, it SHALL require a
delivery receipt whose exact source epoch and final-manifest digest match the
target record and whose JPEG delivery-media manifest digest has the required
digest shape. State SHALL preserve that receipt as an opaque delivery-owned
record and SHALL NOT derive, repair, or infer its JPEG entries. A receipt that
omits the JPEG delivery-media binding is stale derived delivery state and SHALL
not establish `delivery_receipt_sha256`.

#### Scenario: Current JPEG-bound delivery can complete a state handoff

- **WHEN** a delivery-owned receipt matches the target source epoch and final
  manifest digest and contains a syntactically valid JPEG delivery-media
  manifest digest
- **THEN** State records its receipt digest as the target delivery handoff
- **AND** it does not copy JPEG media, final PNG bytes, or delivery metadata
  into State

#### Scenario: Pre-JPEG receipt cannot establish delivery completion

- **WHEN** a caller presents a legacy delivery receipt that lacks the JPEG
  delivery-media manifest digest
- **THEN** State rejects the handoff before mutating the target record
- **AND** its existing delivery rebuild route remains the only way to publish
  current completion
