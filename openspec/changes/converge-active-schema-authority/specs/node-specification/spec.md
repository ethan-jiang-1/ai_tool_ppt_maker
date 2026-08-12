## REMOVED Requirements

### Requirement: State schema is explicitly versioned and repairs only current records

**Reason**: A numeric schema-generation field creates a selectable-looking
Harness contract axis even though the Harness supports only one current state
shape.

**Migration**: Replace it with the declared-current state requirement below.
Existing owner validation, exact Work Version binding, atomicity, and
byte-preserving unsupported-input behavior remain.

## ADDED Requirements

### Requirement: State uses one declared current shape

`state.yaml` for every supported actively executing run SHALL use the one
declared current state shape while preserving whole-workflow timing, execution
identities, controller working sets, stack semantics, typed records, atomic
writes, and reserved system records. A supported state SHALL bind one exact
current source/mode pair and its exact normalized Run Bundle Work Version.
Read or execute MAY perform only lossless canonicalization of an already
supported current record when every affected field has a one-to-one meaning and
no gate, reset, or transition fence is active. It SHALL not infer a source,
mode, controller, Work Version, execution binding, or review evidence from
metadata, generated artifacts, invocation order, source preference, or
directory topology.

A malformed, undeclared, identity-invalid, or evidence-unpreservable state
protocol is unsupported. State/status observation SHALL return a diagnostic
carrying one bounded owner-issued typed next action without changing bytes, and
execution SHALL fail before Controller entry, journal, staging, target
publication, or provider work. It SHALL not map an undeclared checkpoint,
receipt, or controller record into a current execution. A valid current record
shall never be re-inferred from source or derived artifacts. Starting a new
top-level execution still requires the existing explicit replacement
authorization when a current execution is incomplete and preserves reserved
records.

#### Scenario: Current state remains durable

- **WHEN** a declared current state has an exact supported source/mode pair and
  normalized active execution Work Version
- **THEN** state retains its current execution, stack, decisions, waits, gates,
  reset/refinement evidence, and reserved records
- **AND** canonical observation does not invent a second routing authority

#### Scenario: Undeclared state protocol is encountered

- **WHEN** state/status reads a state or controller protocol outside the
  declared current shape
- **THEN** it returns one bounded owner-issued typed next action without
  rewriting the state bytes
- **AND** it does not create a mode record, execution, alternate projection,
  or transition checkpoint

#### Scenario: Unsupported state rejection is byte-preserving

- **WHEN** an unsupported state, undeclared transition execution, or topology-only
  execution binding is supplied to observe or execute
- **THEN** the state owner rejects it before `healState`, alias mapping, marker
  inference, or default-state creation
- **AND** `state.yaml`, `history.jsonl`, gate journals, and Work Version
  directories remain byte-identical

#### Scenario: Source or mode is inconsistent

- **WHEN** a declared current state has a missing, malformed, or mismatched
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
