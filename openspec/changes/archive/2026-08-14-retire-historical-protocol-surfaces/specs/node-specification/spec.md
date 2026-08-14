## MODIFIED Requirements

### Requirement: Stateful Controller entry follows verified Harness binding

Before a Controller or state consumer uses a run-scoped Deck as current work,
the owning CLI or locator entry SHALL verify the Bundle's exact declared current
local Harness binding. The MD Controller SHALL consume the resulting bounded
success or hard-stop and SHALL not infer a current execution, choose another
Harness, or seed state from a structure-only observation.

#### Scenario: A legacy Bundle is presented to a stateful command

- **WHEN** a stateful command derives a Deck root with a missing or undeclared
  locator binding
- **THEN** it returns the binding owner's one bounded hard-stop before reading
  state or selecting a Controller node
- **AND** the Controller does not create a replacement state record

### Requirement: Playbook stack preserves position during switching

`_state/state.yaml` SHALL contain a `playbook_stack` YAML array for deep
parent-execution snapshots. Ordinary resumable entries use `playbook`,
`current_node`, `execution_id`, `execution_started_at`, `run_version`, and
`controller_nodes`, where every contained Controller record binds the same run
version. `writeState` and `readState` SHALL round-trip that array.
`switchPlaybook()` pushes the six-field snapshot, preserves reserved system
records, clears the active Controller set, and starts nested work for the same
exact version; `resumePlaybook()` restores that snapshot and retains latest
reserved records.

Only the current cross-pipeline transaction may add the closed
transition-suspended extension defined by its own requirement. Unknown keys,
invalid versions/modes/pipelines/hashes, a source mode that disagrees with
authoritative state, malformed embedded frames, more than one suspension, or
any generic resume of a suspension SHALL fail closed. A stack record outside
the declared current shape or with incomplete identity is not normalized into a
resumable execution:
observation returns one bounded owner-issued typed next action with original
bytes intact, and no read/heal operation fabricates a suspension.

#### Scenario: Ordinary nested work remains resumable

- **WHEN** an ordinary same-version iteration Controller finishes
- **THEN** `resumePlaybook()` restores the exact six-field parent snapshot
- **AND** it does not infer transition-only identity

#### Scenario: Historical stack cannot be promoted

- **WHEN** a stack entry lacks an execution snapshot or provable current run
  version
- **THEN** state returns the bounded `production-protocol`
  `repair-current-protocol-identity` action without writing it
- **AND** resume does not attribute shared-node evidence to a guessed execution

### Requirement: state.mjs SAFETY — heal before blaming the user

`readState` SHALL retain tolerant YAML parsing and deterministic canonical
repair for a usable declared-current record, but SHALL classify source marker,
exact run version, durable mode, and Controller identity before any repair
write. Its closed purpose SHALL remain `observe|execute`; `state`, `status`,
checks, and validation SHALL use `observe` and make no
state/history/metadata/generated/provider write. An owner-authorized execution
path MAY atomically canonicalize only a declared-current record whose changed
fields have one-to-one meaning, preserve the exact execution/evidence
relationship, and are not fenced by a gate journal, reset, or transition.

A schema outside the declared current shape, topology-only execution binding,
undeclared Controller/node identity, markerless/undeclared source, or impossible
source/mode pair SHALL never be transformed into a current state, mode,
Controller, or transition checkpoint.
When the direct source/state/evidence protocol cannot establish the declared
current contract, it SHALL return the `production-protocol`
`current-protocol-invalid` hard-stop with
`repair-current-protocol-identity` of kind `repair`, and preserve raw
state/history bytes. A current explicit run whose bytes cannot preserve its
current execution/evidence SHALL return its existing state-owner action; the
Controller SHALL carry that action without asking a person to hand-edit YAML or
inventing a continuation from generated artifacts, metadata, history, or source
preference.

#### Scenario: Current state repairs through its owner

- **WHEN** an owner-authorized execution reads a consistent declared-current
  state with a one-to-one malformed status or formatting defect
- **THEN** it preserves the execution/evidence bindings and writes the
  canonical repaired state
- **AND** it reports the repair without treating it as human approval or a new
  route

#### Scenario: Plain observation does not heal

- **WHEN** `state`, `status`, or validation observes a current state that its
  owning execution could safely repair
- **THEN** it returns the bounded owner-issued repair action without writing
  state, history, metadata, or generated artifacts

#### Scenario: Historical state is not compatibility-migrated

- **WHEN** a state outside the declared current shape, topology-only binding, or
  undeclared transition/node identity is supplied
- **THEN** observation and execution reject it without alias migration,
  source/mode inference, or state replacement
- **AND** the returned repair action does not require the user to edit raw YAML

#### Scenario: Current state cannot preserve evidence

- **WHEN** a current explicit run has state bytes that cannot establish a
  preserveable current execution/evidence object
- **THEN** state returns its one bounded owner-issued typed next action and
  preserves the original bytes during observation
- **AND** it does not create a default execution, reuse generated evidence, or
  silently resume work

### Requirement: State YAML parse/stringify uses a maintained YAML library

`scripts/shared/state/state.mjs` SHALL use the npm `yaml` package for
`_state/state.yaml` I/O. Read uses tolerant `parseDocument` options needed to
classify syntactic defects; write emits only canonical stringify output plus the
existing `#` header. A successful parse does not authorize a write. Observation
remains byte-preserving. An owner-authorized execute path may stringify a usable
declared-current record only after its source/mode/Controller identity and
one-to-one repair are verified and all fences permit the write. Undeclared,
ambiguous, or evidence-unpreservable input returns one bounded owner-issued
typed next action without writeback. Failure to establish current protocol
identity uses `production-protocol`; a defect after that identity is established
retains the state owner.

#### Scenario: Current canonicalization uses the YAML library

- **WHEN** an owner-authorized declared-current record has a one-to-one
  formatting defect
- **THEN** the repaired output uses library stringify and retains its
  execution/evidence bindings

#### Scenario: Tolerant parse does not migrate old state

- **WHEN** a state parses but lacks declared current identity
- **THEN** observation preserves bytes and returns the bounded
  `production-protocol` repair action

### Requirement: State uses one declared current shape

`state.yaml` for every supported actively executing run SHALL use one declared
current shape while preserving whole-workflow timing, execution identities,
controller working sets, stack semantics, typed records, atomic writes, and
reserved system records. A supported state SHALL bind one exact current
source/mode pair and its exact normalized run version. Read or execute MAY
perform only lossless canonicalization of an already supported record when every
affected field has a one-to-one meaning and no gate, reset, or transition fence
is active. It SHALL not infer a source, mode, controller, run version,
execution binding, or review evidence from metadata, generated artifacts,
invocation order, source preference, or directory topology.

An undeclared or identity-invalid state protocol is unsupported. State/status
observation SHALL return the owner-issued `production-protocol`
`current-protocol-invalid` hard-stop with
`repair-current-protocol-identity` of kind `repair` without changing bytes, and
execution SHALL fail before Controller entry, journal, staging, target
publication, or provider work. It SHALL not map an undeclared checkpoint,
receipt, or controller record into a current execution.

When a record establishes declared-current protocol identity but a state defect
cannot preserve its current execution/evidence, it SHALL retain the existing
state-owner action and remain byte-preserving during observation. Only a
one-to-one, fence-clear repair may write. A valid current record shall never be
re-inferred from source or derived artifacts. Starting a new top-level execution
still requires the existing explicit replacement authorization when a current
execution is incomplete and preserves reserved records.

#### Scenario: Current state remains durable

- **WHEN** a declared-current state has an exact supported source/mode pair and
  normalized active execution version
- **THEN** state retains its current execution, stack, decisions, waits, gates,
  reset/refinement evidence, and reserved records
- **AND** canonical observation does not invent a second routing authority

#### Scenario: Undeclared state protocol is encountered

- **WHEN** state/status reads a schema or controller protocol outside the
  current supported contract
- **THEN** it returns the owner-issued protocol repair action without rewriting
  state bytes
- **AND** it does not create a mode record, execution, alternate projection, or
  transition checkpoint

#### Scenario: Unsupported state rejection is byte-preserving

- **WHEN** an undeclared state, an undeclared transition execution, or a
  topology-only execution binding is supplied to observe or execute
- **THEN** the state validator rejects it before `healState`, alias mapping, marker
  inference, or default-state creation
- **AND** `state.yaml`, `history.jsonl`, gate journals, and version directories
  remain byte-identical

#### Scenario: Source or mode is inconsistent

- **WHEN** a declared-current state has a missing, malformed, or mismatched
  source/mode fact
- **THEN** observation and execution fail before Controller, journal, staging,
  or target mutation
- **AND** no metadata or generated artifact is used to repair the relationship

#### Scenario: Incomplete current execution is protected

- **WHEN** a supported current execution is incomplete and no explicit
  replacement authorization exists
- **THEN** starting another top-level Controller fails without clearing or
  repurposing the execution

#### Scenario: Canonicalization would cross a protected fence

- **WHEN** a requested canonicalization encounters a gate, reset, or transition
  write fence
- **THEN** state leaves the original bytes unchanged and returns the owning
  recovery action

The production schema inventory SHALL declare the top-level current state
contract and its owner. State readers and writers SHALL use that one declared
shape and SHALL NOT emit, inspect, branch on, or repair a numeric
`schema_version` marker. Existing state ownership, atomic compare-and-swap,
direct-fact validation, typed evidence, and exact Work Version binding remain
the runtime authority; the schema declaration is descriptive and does not load
YAML during production startup.

#### Scenario: A current state is written

- **WHEN** the state owner serializes a supported current execution
- **THEN** the output has the declared current top-level shape with no numeric
  schema-generation field
- **AND** atomic ownership and existing direct-fact validation still apply

#### Scenario: An undeclared state shape reaches an owner

- **WHEN** observation or execution receives a state outside the declared
  current shape
- **THEN** the owning validator hard-stops before any state, history, source,
  generated-artifact, or provider mutation
- **AND** it does not identify, convert, or resume the input as a declared
  current state

## REMOVED Requirements

### Requirement: Style Master readiness is declared-workflow scoped

**Reason**: Its active wording and scenario use a retired production-protocol
identifier as a current readiness category.  Exact declared-current Style
Master evidence remains required, but the old requirement cannot remain as an
active terminology surface.

**Migration**: Use the replacement requirement below.  It preserves the same
exact-version/workflow/source/visual/bytes readiness boundary and the existing
Style Master owner action without a compatibility reader or acceptance-record
conversion.

## ADDED Requirements

### Requirement: Style Master readiness accepts only exact current evidence

The `style_master_accepted` Controller prerequisite SHALL consult only the
current Style Master acceptance for the exact Page Image Workflow version,
workflow, source/visual scope, and selected bytes. File presence, task cards,
undeclared or mismatched acceptance evidence, or a sibling workflow selection
SHALL not satisfy the condition. The Boolean remains read-only; the Style Master
owner supplies its detailed repair action.

#### Scenario: Foreign style evidence does not pass current readiness

- **WHEN** an otherwise current Framed version has only an undeclared Style
  Master selection or `style_master.jpg` file
- **THEN** `style_master_accepted` is false and inspection points to the
  current Style Master owner
- **AND** state does not seed a replacement acceptance record
