## ADDED Requirements

### Requirement: Intent Route Catalog is a closed discovery contract

`PPTMAKER_FRAMEWORK/playbook/intent-routes-v1.json` SHALL define the
versioned, audit-first discovery catalog independently of the Controller
manifest. Its top-level object SHALL contain exactly `schema` with the literal
value `pptmaker-intent-routes-v1` and `routes` as an array. Every route SHALL
contain exactly `id`, `kind`, `required_context`, `entry`, `first_safe_step`,
`risk_boundary`, `fallback`, and `visibility`. `id`, `entry`, and
`first_safe_step` SHALL be non-empty strings; IDs SHALL be unique.
`required_context` SHALL be an array of unique kebab-case context tokens and
MAY be empty; it names information the Agent obtains or clarifies before
leaving discovery, not a prerequisite for recognizing a user goal.
`visibility` SHALL be a Boolean, where `true` makes the user goal eligible for
novice rendering without exposing its route ID. The catalog SHALL use only
`foundation`, `work`, or `orientation` as `kind`, and only
`no-remote`, `confirm-live-diagnostic`, or `owner-issued-authorization` as
`risk_boundary`.

The first public inventory SHALL contain exactly these route IDs:

```text
foundation-local-runtime
foundation-provider-readiness
foundation-channel-probe
work-new
work-resume
work-change
work-change-text
work-change-visual
work-change-notes
work-change-structure
orientation-locate-run
orientation-diagnostic
orientation-env-recovery
orientation-unrouted-intent
```

Every initial route SHALL set `visibility: true`. `fallback` SHALL name another
catalog ID or be `null` only for `orientation-unrouted-intent`; no fallback
chain may cycle. `risk_boundary` SHALL express the strongest boundary a route
can reach after its owner handoff, never authorization granted by route
selection.

`work-change` SHALL enter the existing change classifier; its four leaf routes
SHALL enter the existing text, visual, notes, and structural playbooks. The
catalog SHALL not parse natural language, contain shell command strings or
lifecycle sequences, dispatch a command, create a new controller, persist a
selected route, mint an authorization, or supersede an owner CLI/current
OpenSpec contract. A new public capability SHALL add a catalog route instead
of relying on undocumented routing prose.

#### Scenario: Catalog validates the public discovery surface

- **WHEN** the checked-in catalog is validated
- **THEN** its top-level and route records have the exact required fields and
  types, supported enum values, and a legal acyclic discovery fallback
- **AND** every initial public route appears exactly once without a CLI command
  string, hash, grant, lifecycle-node sequence, or route-granted authorization

#### Scenario: Work-change leaves reuse existing lifecycle owners

- **WHEN** a route is selected for text, visual, notes, or structural work
- **THEN** it enters the corresponding existing classifier/playbook boundary
- **AND** it does not add a parallel Controller or bypass the selected owner's
  lifecycle and authorization rules

### Requirement: Intent discovery preserves explicit requests and exact-run boundaries

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
`orientation-env-recovery` when the main entry is unavailable or the framework
is pre-install; it is not a normal foundation-provider-readiness continuation.

An unrecognized request SHALL produce the non-persistent Route Gap through
`orientation-unrouted-intent`. The Agent SHALL explain whether the smallest
extension is a route, playbook, or owner capability, but SHALL not automatically
create a backlog item, issue, OpenSpec change, state field, receipt, grant,
attempt, history record, task projection, or selected-route record.

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

### Requirement: COMMANDS.md presents user goals rather than protocol mechanics

`PPTMAKER_FRAMEWORK/COMMANDS.md` SHALL render the supported discovery surface
as a novice-facing reference. Each common-request row SHALL state what the
user can ask for, what the Agent needs to clarify or inspect, the expected
result, the meaningful confirmation/cost boundary, and coarse timing as local
short work, human decision, or provider-variable work. The main request table
SHALL not expose route IDs, state internals, hashes, grants, raw topology,
Page Authority implementation mechanics, or shell grammar; auditable
Agent-facing mappings MAY live outside that novice presentation.

New-deck guidance SHALL express the stable progression `local foundation ->
init -> user content and necessary choices -> create-deck Controller/current
owner action`. It SHALL not prescribe a fixed one-shot validation or Image2
authorization/generation/review/accept chain. Detailed lifecycle and command
forms remain owned by the current playbooks and CLI specs.

#### Scenario: A novice discovers a supported goal

- **WHEN** a user opens `COMMANDS.md` with a setup, creation, change, resume,
  or stuck request
- **THEN** the relevant row explains the next human/Agent interaction and the
  expected result in goal-oriented language
- **AND** it does not require the user to understand a command, hash, or
  workflow-internal term

#### Scenario: Main request table does not teach retired production scripts

- **WHEN** active command-reference examples are audited
- **THEN** none directs a user through a fixed one-shot Image2 sequence or
  treats a diagnostic/probe as production authorization
- **AND** current owner guidance remains reachable without duplicating its
  lifecycle state machine
