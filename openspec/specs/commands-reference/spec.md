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

### Requirement: Intent Route Catalog is a closed discovery contract

The intent-route catalog SHALL use the unversioned shared-contract name
declared in the serialization inventory and retain its existing closed route
shape. It SHALL contain exactly the declared contract marker and `routes`; each
route SHALL retain the required routing fields and deterministic validation.
No active route catalog, template, or command reference SHALL carry a
version-suffixed contract marker.

#### Scenario: An Agent loads the current route catalog

- **WHEN** command routing loads the checked-in catalog
- **THEN** its contract marker resolves in the serialization inventory and its
  routes validate under the existing closed rules
- **AND** no alternate or historical catalog format is considered

#### Scenario: Catalog validates the public discovery surface

- **WHEN** the checked-in current catalog is validated
- **THEN** its contract declaration and every required route field validate
- **AND** no code-only or version-suffixed route schema is accepted

#### Scenario: Work-change leaves reuse existing lifecycle owners

- **WHEN** a route resolves a production change
- **THEN** it delegates to the existing current lifecycle owner
- **AND** it does not create a compatibility controller

### Requirement: Intent discovery preserves explicit requests and exact-run boundaries

The command guidance SHALL preserve a user's explicit Deck/run selection and
route only declared current workflow facts to their existing controller or CLI
owner. An undeclared source, state, receipt, or locator contract SHALL produce
the owner-issued `unsupported-protocol/export` boundary without route
selection, source inspection, conversion, migration, or adoption. Guidance
SHALL describe the current contract and owner-issued next action without
inventing another selectable route.

The Agent SHALL interpret natural-language requests, then use the catalog only
to validate the first safe discovery step. `work-resume` for a known exact run
SHALL obtain `workflow_inspection.primary_action`. An explicit change request
for that run SHALL take precedence over the current resume action and enter
`classify-change`; it SHALL not be converted into passive resume.

`work-resume` and every work-change route SHALL require an exact run. Without
one, discovery SHALL enter `orientation-locate-run` and request `RUN_BUNDLE.md`
or an exact deck/run path. It SHALL not scan `deck_*`, infer a target from a
name, timestamp, current directory, rendered artifact, or conversation memory.
Foundation routes do not require a run except an owner-defined run-bound
readiness operation. In particular, normal raw-generation readiness SHALL use
an exact run through the owner-issued `ppt_flow doctor` operation. An unbound
direct `env-check` operation-scoped report is available only through
`orientation-env-recovery` when the main entry is unavailable or the Harness
is pre-install; it is not a normal foundation-provider-readiness continuation.

An unrecognized request SHALL produce the non-persistent Route Gap through
`orientation-unrouted-intent`. The Agent SHALL explain whether the smallest
extension is a route, playbook, or owner capability, but SHALL not automatically
create a backlog item, issue, OpenSpec change, state field, receipt, grant,
attempt, history record, task projection, or selected-route record.

#### Scenario: An explicit run has an undeclared contract

- **WHEN** command guidance receives an explicit run whose owner reports an
  undeclared source/state/receipt/locator contract
- **THEN** it preserves the selected target and presents the owner-issued
  unsupported-contract action
- **AND** it does not substitute another run or offer another route

#### Scenario: Explicit change wins over resume

- **WHEN** an exact run has a current `primary_action` and the user explicitly
  asks to change text, visual content, notes, or structure
- **THEN** discovery enters `classify-change` and the applicable leaf route
- **AND** it does not substitute the current resume action for the requested
  mutation

#### Scenario: Missing exact run uses the locator

- **WHEN** a user asks to resume or change a deck without an exact run
- **THEN** the Agent requests the supported card or exact path through
  `orientation-locate-run`
- **AND** it does not inspect production deck directories to guess a target

#### Scenario: Normal raw readiness does not bypass the exact-run boundary

- **WHEN** the installed normal entry is available and a user requests
  raw-generation readiness without an exact run
- **THEN** discovery establishes applicable local foundation and requests the
  exact run before the normal raw-readiness operation
- **AND** it does not present direct `env-check` recovery as an unbound normal
  provider-readiness route

#### Scenario: Route Gap has no durable side effect

- **WHEN** a request does not match a supported route
- **THEN** the Agent returns a Route Gap and preserves the current workflow
  authority unchanged
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

When command guidance receives an undeclared source/state/receipt or evidence
identity, it SHALL present the bounded unsupported-protocol/export
action before route selection. It SHALL not infer the selected workflow, read
historical evidence as current, offer compatibility, or create a conversion,
adoption, or fallback path.

#### Scenario: Undeclared input is not offered as a production route

- **WHEN** a human asks to resume or change a v2 run
- **THEN** command guidance presents the protocol hard-stop and its owner
action
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

### Requirement: Discovery guidance distinguishes the catalog from MD Controllers

Active discovery guidance SHALL call `intent-routes.json` the Intent Route
Catalog and SHALL describe it as a closed first-safe-handoff catalog. It SHALL
describe `playbook/` as the home of MD Controllers and their normative
controller manifest. The catalog SHALL not be described as a Controller,
parser, dispatcher, authorization record, or workflow state machine, and the
playbook home SHALL not be reduced to an intent-routing appendix.

#### Scenario: An Agent routes a natural-language request

- **WHEN** an Agent follows active discovery guidance for a user request
- **THEN** it uses the Intent Route Catalog only for the first safe handoff and
  reaches the existing MD Controller boundary where applicable
- **AND** it does not mistake either source for a second lifecycle controller
