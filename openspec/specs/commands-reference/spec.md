## Purpose

Define `ppt_maker_harness/COMMANDS.md`, the PPT Maker Harness novice-facing discovery reference
that maps natural-language user goals to existing ownership-aware handoffs. It
covers setup, creation, resume, changes, orientation, and the current refresh
paths without duplicating a lifecycle state machine. This capability guarantees
that a human can discover what to say and roughly how long each request takes,
while detailed controller and CLI mechanics remain with their current owners.

## Requirements

### Requirement: COMMANDS resume guidance names the inspection control input

For a known exact run, COMMANDS.md SHALL direct resume and gate guidance to
state --json.workflow_inspection.primary_action and the owner-issued
continuation. It SHALL distinguish these observation inputs from the direct
public CLI command that performs a mutation. It SHALL describe `status` and
`state --validate-state` as zero-write observations; ordinary `state` may only
report its separately owned non-authoritative collaboration projection and
shall never initialize a protocol receipt, state, metadata, or production
artifact.

#### Scenario: Human resumes an existing deck
- **WHEN** a human or Agent follows COMMANDS guidance for an existing exact run
- **THEN** it obtains the current inspection action before selecting the owner mutation route
- **AND** it does not infer a route from a compatibility summary or rendered artifact

#### Scenario: Human distinguishes observation from validation

- **WHEN** a required source receipt is missing while a human follows COMMANDS
  resume or status guidance
- **THEN** the guidance treats the reported owner action as the route to
  validate or repair the receipt
- **AND** it does not imply that status or state observation will create it

### Requirement: COMMANDS.md exists at Harness root

`ppt_maker_harness/COMMANDS.md` SHALL exist at the PPT Maker Harness root as a human-readable command reference. It SHALL map natural-language user requests to the Agent actions that fulfill them and SHALL not identify a retired source root as a command or discovery location.

#### Scenario: Human opens COMMANDS.md to learn what to say

- **WHEN** a human opens `COMMANDS.md`
- **THEN** they see a table of common requests with corresponding agent actions
- **AND** each row includes estimated duration

### Requirement: COMMANDS.md complements the target classifier
COMMANDS.md SHALL be the concise human-facing interface and SHALL link detailed current change classification only to `scripts/06-iteration/change-classifier.md`. It SHALL not link to a compatibility, v1, or archived classifier.

#### Scenario: Documentation links resolve only to current classification
- **WHEN** command-reference links are audited
- **THEN** every active classifier link resolves to the target iteration classifier
- **AND** no active link resolves to a v1 or compatibility path

### Requirement: Intent discovery preserves explicit requests and exact-run boundaries

The command guidance SHALL preserve a user's explicit Deck/run selection and
route only declared current workflow facts to their existing controller or CLI
owner. A present foreign, unreadable, incomplete, or cross-lineage production
source, state, receipt, or evidence record that cannot establish exact current
protocol identity SHALL present the owner-issued `production-protocol`
`current-protocol-invalid` hard-stop with
`repair-current-protocol-identity` of kind `repair`, without route selection,
dependent source-content inspection, export, conversion, migration, or adoption.
Guidance SHALL describe the current contract and owner-issued next action
without inventing another selectable route.

An exact Harness locator/binding failure SHALL retain its binding owner. A
declared fresh authoring draft, state-owned defect after current protocol
identity is established, exact requested/active Work Version mismatch, or
attributable current delivery drift SHALL likewise retain its existing
narrative/workflow-selection, state, execution-version, or delivery owner. Only
a one-to-one, fence-clear current state repair may write.

The Agent SHALL interpret natural-language requests through COMMANDS guidance
and the applicable current Controller. A known exact-run resume SHALL obtain
`workflow_inspection.primary_action`. An explicit change request for that run
SHALL take precedence over the current resume action and enter
`classify-change`; it SHALL not be converted into passive resume.

Resume and every work-change request SHALL require an exact run. Without one,
guidance SHALL request `RUN_BUNDLE.md` or an exact deck/run path. It SHALL not
scan `deck_*`, infer a target from a name, timestamp, current directory,
rendered artifact, or conversation memory. Normal raw-generation readiness
SHALL use an exact run through the owner-issued `ppt_flow doctor` operation. An
unbound direct `env-check` report is available only when the main entry is
unavailable or the Harness is pre-install; it is not a normal production
continuation.

An unrecognized request SHALL produce a non-persistent Route Gap. The Agent
SHALL explain whether the smallest extension is a Controller or owner
capability, but SHALL not automatically create a backlog item, issue, OpenSpec
change, state field, receipt, grant, attempt, history record, task projection,
or selected-route record.

#### Scenario: An explicit run has an undeclared contract

- **WHEN** command guidance receives an explicit run whose owner reports a
  source/state/receipt/evidence identity outside the declared current contract
- **THEN** it preserves the selected target and presents the owner-issued
  `production-protocol` repair action
- **AND** it does not substitute another run or offer another route

#### Scenario: Harness binding failure remains binding-owned

- **WHEN** command guidance receives an exact run whose local Harness locator or
  binding cannot be established
- **THEN** it presents the existing Harness-binding owner action
- **AND** it does not recategorize the binding failure as production protocol
  repair

#### Scenario: Explicit change wins over resume

- **WHEN** an exact run has a current `primary_action` and the user explicitly
  asks to change text, visual content, notes, or structure
- **THEN** guidance enters `classify-change` and the applicable Controller path
- **AND** it does not substitute the current resume action for the requested
  mutation

#### Scenario: Missing exact run uses the locator

- **WHEN** a user asks to resume or change a deck without an exact run
- **THEN** the Agent requests the supported card or exact path
- **AND** it does not inspect production deck directories to guess a target

#### Scenario: Normal raw readiness does not bypass the exact-run boundary

- **WHEN** the installed normal entry is available and a user requests
  raw-generation readiness without an exact run
- **THEN** guidance establishes applicable local foundation and requests the
  exact run before the normal raw-readiness operation
- **AND** it does not present direct `env-check` recovery as an unbound normal
  provider-readiness route

#### Scenario: Route Gap has no durable side effect

- **WHEN** a request does not match a supported current owner path
- **THEN** the Agent explains the smallest missing extension and preserves the
  current workflow authority unchanged
- **AND** it does not create maintenance work unless the user separately
  confirms that extension

### Requirement: COMMANDS presents a bounded diagnostic outcome without protocol leakage

`ppt_maker_harness/COMMANDS.md` SHALL present the orientation request for a
user who is stuck or has a failure as a bounded result: the user receives what
happened, what it affects, what the Agent can mechanically do, and the one
human action or confirmation required. The novice-facing presentation SHALL
not expose JSON envelope names, diagnostic fields, raw stderr, command grammar,
retry mechanics, or a competing recovery menu.

Its Agent-facing routing reference SHALL point to the canonical Agent Contract
diagnostic-recovery handoff rather than restating a divergent routing sequence.
It SHALL preserve the existing distinction between a current producer action,
known-exact-run inspection, supported run location, and recovery-only direct
environment checking.

#### Scenario: A novice asks for help after a failure

- **WHEN** a novice reads COMMANDS guidance for "I am stuck" or "this failed"
- **THEN** they can expect a concise explanation of impact, the Agent's bounded
  mechanical work, and at most one real decision or confirmation
- **AND** they are not asked to choose a CLI command, diagnose raw output, or
  learn protocol mechanics

#### Scenario: Agent routing remains anchored to one handoff

- **WHEN** the command reference's Agent-facing diagnostic routing is audited
- **THEN** it directs the Agent to the canonical handoff for precedence and
  producer-action preservation
- **AND** it does not create a second locator, env-check, or diagnostic
  fallback policy

### Requirement: Commands route current Page Image changes by compiled-input ownership

Active `COMMANDS.md` guidance SHALL describe one schema-declared current
version-level Page Image workflow choice, `framed` or `pure`, and route work to
the selected owner. It SHALL not teach historical pipeline values, a migration,
or a compatibility route.

#### Scenario: A current workflow change is routed

- **WHEN** a Deck Author asks for a current Page Image change
- **THEN** command guidance selects the owner using the current declared
workflow contract
- **AND** it does not offer a retired marker as an alternative path

#### Scenario: A user changes a Framed header literal

- **WHEN** a Deck Author changes a current Framed header literal
- **THEN** guidance routes to the established owner-selected refresh path
- **AND** it does not select a historical workflow

#### Scenario: A user requests a workflow switch

- **WHEN** a Deck Author requests a current Framed/Pure switch
- **THEN** guidance routes it through the existing structural-versioning path
- **AND** it does not create a conversion route

### Requirement: Commands expose the declared-current unsupported-input boundary

When command guidance receives a present foreign, unreadable, incomplete, or
cross-lineage source/state/receipt/evidence record that cannot establish exact
current production identity, it SHALL present the bounded
`production-protocol` `current-protocol-invalid` hard-stop with the
`repair-current-protocol-identity` action of kind `repair` before route
selection. It SHALL not infer the selected workflow, read undeclared evidence
as current, offer compatibility, or create an export, conversion, adoption, or
fallback path. It SHALL preserve the binding, fresh-draft, state,
execution-version, and attributable-current-delivery owners defined by the
direct facts above.

#### Scenario: Undeclared input is not offered as a production route

- **WHEN** a human asks to resume or change an exact run with an undeclared
  production identity
- **THEN** command guidance presents the protocol hard-stop and its owner
  repair action
- **AND** it does not offer a Page Image Workflow mutation or inspection route

### Requirement: COMMANDS presents Page Image Workflow goals without protocol mechanics

The novice-facing request table SHALL describe presentation goals, needed
clarification, expected result, meaningful human confirmation/cost boundary,
and coarse timing. It SHALL not expose raw prompt text, compiled-input digests,
provider grants, internal adapter names, undeclared-contract implementation terminology, or a
fixed Image2 command sequence. Detailed lifecycle and command forms remain
with current playbooks and CLI owners.

#### Scenario: A novice requests a visual change

- **WHEN** a user reads the command reference for changing a page
- **THEN** the reference explains the next human/Agent interaction in
goal-oriented terms
- **AND** it does not require the user to identify a workflow-internal record

### Requirement: Verb-collision decisions are registered and audited

The command reference SHALL register a verb-collision decision table that names
each shared verb (such as `plan`, `authorize`, `generate`, `review`, `accept`)
across the command families that use it (`image2`, `style-master`, and any
future command), and SHALL state which command owner and effect class each
occurrence belongs to. The document-command audit SHALL fail when a documented
verb collision is not present in the registered table, preventing the reference
from drifting away from the CLI's declared ownership.

#### Scenario: A shared verb has one registered owner per command family

- **WHEN** a verb appears in more than one command family
- **THEN** the decision table names each occurrence's owning command and effect
  class
- **AND** the document-command audit rejects an undocumented collision

#### Scenario: The reference cannot drift from the declared ownership

- **WHEN** documentation names a verb collision that the registered table does
  not contain
- **THEN** the document-command audit fails
- **AND** the reference is corrected to match the declared table rather than
  inferring ownership from prose

### Requirement: COMMANDS maps two Image2 live questions to distinct owners

COMMANDS.md SHALL map three presentation goals without exposing Call Shape
field tables or grant internals:

- whether the confirmed Image2 Call Shape can still retrieve a PNG → the
  novice-facing Common Requests section SHALL name this connectivity-check
  route in Deck-Author vocabulary only; the exact
  `probe-image-channels` / `ppt_flow probe <run-dir>` commands SHALL be
  declared in the same document's Agent-facing Agent Routing Reference section
- which candidate Call Shape can retrieve a PNG → Image2 Lab playbook / Lab CLI
- official page image production → existing `image2 generate` path, which does
  not read `_lab/`

The novice-facing Common Requests section SHALL NOT contain CLI program names,
flag spellings, `JSON`/`stderr` failure-envelope vocabulary, or
`diagnostic.`-prefixed field notation; exact command names and flags belong to
the Agent-facing sections. It SHALL NOT document `--smoke` or `--probe-vendors`
as current live work. It SHALL state that an empty `_lab/` does not block
drawing when a confirmed or named-default Call Shape exists.

#### Scenario: Novice asks if drawing still works

- **WHEN** a user asks whether the already confirmed Image2 setup can still
  get a PNG
- **THEN** the Common Requests row names the connectivity-check route in
  Deck-Author vocabulary, not Lab and not env-check live flags
- **AND** it does not present probe success as generate authorization, and the
  exact probe command names remain only in the Agent Routing Reference section

#### Scenario: Novice asks how to call this vendor

- **WHEN** a user asks to discover a working Image2 Call Shape
- **THEN** COMMANDS names the Lab playbook and CLI
- **AND** it does not send that work into create-deck

#### Scenario: The novice section stays free of implementation vocabulary

- **WHEN** the document-command audit and the diagnostic recovery handoff
  checkpoint scan the Common Requests section
- **THEN** they find no CLI program name, flag spelling, `JSON`/`stderr`
  envelope vocabulary, or `diagnostic.` field notation in that section
- **AND** the Agent Routing Reference section still declares the exact probe
  commands for Agent use
