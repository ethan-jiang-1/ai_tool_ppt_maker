# Node Specification Specification (delta)

## MODIFIED Requirements

### Requirement: state.mjs SAFETY — heal before blaming the user

`readState` SHALL retain tolerant YAML parsing and deterministic canonical
repair for a usable declared-current record, but SHALL classify source marker,
exact run version, durable workflow, and Controller identity before any repair
write. Its closed purpose SHALL remain `observe|execute`; `state`, `status`,
checks, and validation SHALL use `observe` and make no
state/history/metadata/generated/provider write. An owner-authorized execution
path MAY atomically canonicalize only a declared-current record whose changed
fields have one-to-one meaning, preserve the exact execution/evidence
relationship, and are not fenced by a gate journal, reset, or transition.

A schema outside the declared current shape, topology-only execution binding,
undeclared Controller/node identity, markerless/undeclared source, or impossible
source/workflow pair SHALL never be transformed into a current state, workflow,
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
  source/workflow inference, or state replacement
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
declared-current record only after its source/workflow/Controller identity and
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
source/workflow pair and its exact normalized run version. Read or execute MAY
perform only lossless canonicalization of an already supported record when every
affected field has a one-to-one meaning and no gate, reset, or transition fence
is active. It SHALL not infer a source, workflow, controller, run version,
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

- **WHEN** a declared-current state has an exact supported source/workflow pair
  and normalized active execution version
- **THEN** state retains its current execution, stack, decisions, waits, gates,
  reset/refinement evidence, and reserved records
- **AND** canonical observation does not invent a second routing authority

#### Scenario: Undeclared state protocol is encountered

- **WHEN** state/status reads a schema or controller protocol outside the
  current supported contract
- **THEN** it returns the owner-issued protocol repair action without rewriting
  state bytes
- **AND** it does not create a workflow record, execution, alternate projection,
  or transition checkpoint

#### Scenario: Unsupported state rejection is byte-preserving

- **WHEN** an undeclared state, an undeclared transition execution, or a
  topology-only execution binding is supplied to observe or execute
- **THEN** the state validator rejects it before `healState`, alias mapping,
  marker inference, or default-state creation
- **AND** `state.yaml`, `history.jsonl`, gate journals, and version directories
  remain byte-identical

#### Scenario: Source or mode is inconsistent

- **WHEN** a declared-current state has a missing, malformed, or mismatched
  source/workflow fact
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

### Requirement: Controller metadata is a closed declared grammar

Every active Controller, shared node, and fenced node declaration SHALL use
only its declared current metadata keys. Controller frontmatter SHALL contain
only `playbook`, `description`, `supported_pipelines`, and `includes`; shared-node
frontmatter SHALL additionally contain one node declaration and `shared: true`;
fenced node declarations SHALL contain only current node keys. `method_module`
is the sole lifecycle-location key. `production_modes`,
`supported_production_modes`, `phase`, `lifecycle_phase`, misspellings,
duplicate YAML keys, and undeclared metadata SHALL fail before Controller index,
draft-route, or handoff output.

#### Scenario: A stale Controller field is rejected at its source

- **WHEN** a checked-in Controller declaration contains a retired, misspelled,
  or undeclared metadata key
- **THEN** canonical parsing returns a bounded declaration error before it
  indexes the Controller or derives a route
- **AND** it does not ignore, normalize, or preserve the field as a fallback

#### Scenario: A valid declaration has one lifecycle location

- **WHEN** a checked-in Controller or node uses only its allowed metadata keys
  and one valid `method_module`
- **THEN** canonical parsing accepts its lifecycle location subject to its
  existing dependency, workflow, and manifest checks
- **AND** it does not derive a second lifecycle phase or production identity
