## Purpose

Define the Node — the atomic unit of playbook execution — and its governing constitution at `charter/NODE-SPEC.md`: node frontmatter (entry/exit gates), the run-bundle state model (`_state/state.yaml` as the single truth source plus the append-only `_state/history.jsonl`), the five node statuses, shared nodes, the gate-conditions catalog, and the `scripts/shared/state/state.mjs` API (the CONDITIONS registry, `checkEntry`/`checkExit`, atomic writes, and the query/manipulation functions). This capability guarantees that any agent can deterministically decide whether a node may start or complete, resume an in-progress run from persisted state, and switch between playbooks without losing its position.
## Requirements

### Requirement: NODE-SPEC.md exists in charter directory

`PPTMAKER_FRAMEWORK/charter/NODE-SPEC.md` SHALL exist as the constitutional specification for Nodes, defining their anatomy, state schema, and execution rules.

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

`checkEntry` and `checkExit` SHALL accept a `ctx` parameter providing: `deckDir` (deck root), `runDir` (current version dir), and `frameworkDir` (PPTMAKER_FRAMEWORK root). FILESYSTEM conditions SHALL resolve paths relative to these directories.

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

Immediately before rename, every writer SHALL recheck journal bytes/absence, current-state SHA, reset status/ID/owner token, and current supported source/state identity. Any mismatch removes only its own temporary file and leaves durable state unchanged. Unsupported historical records are never write targets for writeState; their caller receives one non-writing owner-issued typed next action.

#### Scenario: Current writer races a gate journal
- **WHEN** an ordinary node transition lacks the exact journal token while a journal exists
- **THEN** it returns CONFLICT before creating a temp file or changing state

#### Scenario: Historical state is not atomically rewritten into current form
- **WHEN** a pre-current or retired state protocol reaches a write path
- **THEN** the path stops before temp creation and leaves original bytes untouched

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

Closed current mutation forms, including gate-journal recovery and Page Authority delivery decisions, retain their owning preconditions and exact arguments. They are mutually exclusive with observation modes and must validate current source/state identity before write. No unsupported controller identity or receipt is accepted by this command surface.

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

If a process ends non-zero without a valid final envelope, MD SHALL treat the producer as externally interrupted or crashed and SHALL NOT infer category, lineage, or recovery from partial stdout/stderr. A supported `interrupted` diagnostic means execution stopped, not that source or framework code is defective.

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
do not guess omitted lineage, and never hand-edit `_generated/`. The locator contains no consumer
protocol, current execution fact, or command menu.

Repository-maintenance discovery for MD implementation SHALL also be present in root `AGENTS.md` and short headers of `scripts/shared/state/md_controller_reader.mjs` and `state.mjs`, pointing to `node-specification` and active deltas without duplicating field schema.

#### Scenario: New run bundle receives a CLI failure

- **WHEN** its runtime Agent follows generated entry guidance
- **THEN** it locates the bundle before reading the guide's consumer contract
- **AND** it can act on a supported diagnostic without reading repository OpenSpec files
- **AND** it stops for human-owned decisions and preserves source/generated ownership

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

### Requirement: TARGET Page Authority state is bound to one version workflow

For the exact `page-authority-image2-v2` /
`image2-page-authority-v2` pair, Node Specification SHALL record the bound
source receipt identity, version workflow, source epoch, provider
authorization scope, accepted raw-evidence references, and final/delivery
references through the existing state owner. The state writer SHALL accept only
`framed` or `pure` when it matches the immutable v2 source receipt. MD
Controller and inspection consumers SHALL read the owner-issued projection and
SHALL NOT recreate receipt, CLI, or evidence schemas.

The state validator SHALL treat a missing workflow, source/state workflow
mismatch, v1/v2 identity collision, or evidence bound to a different receipt or
epoch as a non-mutating hard-stop. Its primary result SHALL identify the
earliest direct-fact failure and one owner-issued repair-and-rerun action.

#### Scenario: Target state records its source workflow once

- **WHEN** a valid v2 Pure source receipt initializes a fresh target version
- **THEN** state records mode `image2-page-authority-v2`, workflow `pure`, and source epoch `1`
- **AND** every later target node reads that one workflow rather than a per-slide authority field

#### Scenario: Source and state cannot claim different target workflows

- **WHEN** a v2 source receipt says `framed` and the state record says `pure`
- **THEN** validation returns the source/state identity repair hard-stop without writing state
- **AND** no controller, inspection, or generation path guesses which workflow to use

### Requirement: TARGET structural versions begin with fresh workflow evidence
An exact-plan structural transaction that publishes a v2 target SHALL bind the chosen workflow into the preview and confirmed plan hash. Apply SHALL initialize target state at source epoch `1` with target-owned unreviewed provenance or `needs_raw_generation` debt only. It SHALL NOT carry provider authorization, raw review, final projection, PPTX, notes, delivery decision, or active execution from its source version.

#### Scenario: Workflow switch creates a clean vNext state
- **WHEN** a confirmed structural transaction switches a version from target Framed to target Pure
- **THEN** the published vNext state binds workflow `pure` and starts with fresh target evidence state
- **AND** apply makes no provider call or inherits the source final/delivery acceptance

### Requirement: Style Master readiness consumes one canonical effective selection

Node Specification SHALL provide one current Page Authority condition, `style_master_accepted`, for a
Controller to determine whether its selected workflow may enter page raw planning. The condition SHALL
consult the Style Master owner's current effective-selection/acceptance evidence for the exact run,
workflow, scope, and style bytes; a candidate file, `style_master.jpg` path, Markdown task checkbox, or
generic node status alone SHALL NOT satisfy it.

The condition is a read-only projection. Candidate plans, grants, attempts, progress, human decisions,
and the candidate lifecycle head remain owned by the Style Master lifecycle. The only Style Master durable
fact in generic state is the capability-owned effective-selection/acceptance record described below; ordinary
Controller node records remain handoff projections rather than candidate truth. An absent record or a
structurally valid but stale selection SHALL make the Boolean condition false without state heal or mutation.
A present record with an invalid map key, field schema, run-version binding, or workflow binding SHALL also
never pass the condition, but state validation SHALL report that malformed current record as a non-writing
hard-stop rather than treating it as ordinary absence. The Controller SHALL obtain
the owner-issued repair path from the separate Style Master inspection/diagnostic interface, not from the
Boolean condition or file presence.

#### Scenario: File presence does not pass the Style Master gate

- **WHEN** a deck has `style_master.jpg` but lacks an exact current effective-style acceptance receipt
- **THEN** `style_master_accepted` is false for page raw Controller entry
- **AND** the Controller remains at the Style Master checkpoint rather than inferring readiness

#### Scenario: Current accepted selection passes for its workflow

- **WHEN** the Style Master owner exposes a current accepted selection whose bytes, scope, and workflow match the selected version
- **THEN** `style_master_accepted` passes the corresponding Controller handoff
- **AND** the condition does not duplicate or rewrite candidate lifecycle records

#### Scenario: Stale selection is read-only failure

- **WHEN** a style-intent, canonical style-context, candidate, profile, scope, or effective-selection identity no longer matches current facts
- **THEN** the condition reports unavailable readiness and the Controller separately consumes the one Style Master recovery action
- **AND** it does not heal state, advance source epoch, or create page raw work

### Requirement: Schema-v5 state carries optional Style Master acceptance evidence

Node Specification SHALL admit one optional
`page_authority_style_master.by_version["3_versions/vN"]` map in schema-v5 state. The state module SHALL own
its structural validation and atomic/CAS persistence while `style-master-generation` remains authoritative for
the record fields, currentness evaluator, promotion semantics, and diagnostic actions. No generic state setter,
second acceptance receipt, metadata mirror, or Controller-owned candidate record SHALL be introduced.

Structural validation SHALL require each present map key to be a canonical version key, each record's
`run_version` to match that key, and each record to satisfy the Style Master-owned exact field schema. When a
source/state workflow exists for that version, the record workflow SHALL match it; for an active unbound fresh
draft, currentness SHALL instead match the validated selected-workflow source. A malformed present record is
invalid state, not equivalent to an absent optional record, and observation SHALL not delete or normalize it.

An absent map or absent version record in an otherwise exact current schema-v5 bundle SHALL be valid state and
mean `style_master_accepted = false`. The Style Master writer MAY add the exact selected-workflow record to an
active fresh-v2 `create-deck` draft after validating its canonical source marker and run identity without
creating a production-mode, target-evidence, source-receipt, raw-plan, or source-epoch record. It MAY also CAS
replace the record for an exact current v2 source/state pair. Later selected-workflow source materialization
SHALL preserve and revalidate the Style Master record. Observation, invalid records, and CAS conflicts SHALL
remain non-writing.

On first exact-plan structural publication of vNext, the state writer SHALL retain source-version Style Master
records but SHALL NOT copy, rename, infer, or rebind one under the target version key, regardless of whether the
workflow stays the same or changes. The target SHALL begin with no accepted Style Master and its own readiness
condition false. An exact idempotent replay of that already-published structural plan SHALL instead revalidate
and preserve any target-owned Style Master record created after publication. The state-side replay path SHALL
be reached only after the structural owner has exact-matched the original source/target plan tuple; it SHALL
not treat the target's now-active Controller execution as a source-version execution mismatch or reset its
`playbook`, `run_version`, `current_node`, node records, or continuation pointer. It SHALL NOT erase later
target work, manufacture inheritance, create or restage a version, call a provider, or rewrite the
layout-resolved compatibility payload.

#### Scenario: Existing v2 state without Style Master remains supported

- **WHEN** schema-v5 state has an exact v2 source/state pair but no Style Master map or record
- **THEN** structural state validation passes and `style_master_accepted` is false
- **AND** observation does not seed the map, infer acceptance from `style_master.jpg`, or classify the state as historical

#### Scenario: Malformed present selection is not disguised as absence

- **WHEN** a schema-v5 state contains a Style Master record whose key, field set, run version, or bound workflow is invalid
- **THEN** state validation returns a non-writing malformed-record hard-stop and readiness does not pass
- **AND** it does not delete, normalize, or reinterpret the record as an ordinary missing selection

#### Scenario: Fresh draft promotion does not create page lineage

- **WHEN** an active fresh-v2 `create-deck` draft has a validated selected-workflow source and promotes a reviewed Style Master candidate
- **THEN** the state owner CAS-writes only the capability-owned Style Master acceptance record plus ordinary audit history
- **AND** production mode, target evidence, source receipt, raw plan, and source epoch remain absent until their existing owner materializes them

#### Scenario: Raw-plan materialization preserves accepted style

- **WHEN** selected-workflow raw planning later materializes the draft's first source receipt and target state
- **THEN** the state writer revalidates and preserves the exact current Style Master record
- **AND** it neither recreates the acceptance nor treats it as page raw authorization

#### Scenario: Structural vNext does not inherit source acceptance

- **WHEN** first structural publication creates a same-workflow or workflow-switch target from a source version with an accepted Style Master
- **THEN** the state writer preserves the source-version record and creates no target-version Style Master record
- **AND** target readiness remains false until that exact target scope completes its own promotion

#### Scenario: Structural replay preserves later target acceptance

- **WHEN** the exact structural plan is replayed after its target version acquired a valid target-owned Style Master record
- **THEN** the state writer revalidates and preserves that target record byte-for-byte
- **AND** it neither restores source acceptance under the target key nor changes either selection, active target Controller execution, or the layout-resolved payload
