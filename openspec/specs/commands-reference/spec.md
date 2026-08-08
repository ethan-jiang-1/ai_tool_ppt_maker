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

`ppt_maker_harness/playbook/intent-routes-v1.json` SHALL define the
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
`foundation`, `work`, or `orientation` as `kind`, and only `no-remote`,
`confirm-live-diagnostic`, or `owner-issued-authorization` as
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
`orientation-env-recovery` when the main entry is unavailable or the Harness
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

Active `COMMANDS.md` guidance SHALL describe one version-level
`page-image-workflow-v1` choice, `framed` or `pure`, and route work through the
selected owner. It SHALL route Provider Content Schema, visual-direction,
generation-profile, protected-geometry, raw-contract, and provider-context
changes to raw rebuild. A Framed local overlay refresh may be offered only when
the owner proves that compiled provider input, protected geometry, raw contract,
and local profile are unchanged; header literal changes normally require raw
rebuild. Notes-only work remains delivery-owned, and insert/delete/reorder or
workflow changes route through previewed exact-hash Structural Versioning.

Guidance SHALL explain `hybrid` only as a description of Framed composition,
not as a user-selectable workflow or slide-level choice. It SHALL remain
goal-oriented and obtain current status from Workflow Inspection before
selecting an owner mutation.

#### Scenario: A user changes a Framed header literal

- **WHEN** a user asks to change the title on a current Framed page
- **THEN** COMMANDS guidance routes to the owner-issued raw rebuild path
- **AND** it does not promise a provider-free Text Frame refresh

#### Scenario: A user requests a workflow switch

- **WHEN** a user asks to change a version from Framed to Pure
- **THEN** COMMANDS guidance routes to Structural Versioning preview and exact
  plan confirmation
- **AND** it does not describe an in-place mode mutation or reuse acceptance

### Requirement: Commands expose the replacement protocol's unsupported-input boundary

When command guidance receives a v2 Page Authority source/state/receipt or
evidence identity, it SHALL present the bounded unsupported-protocol/export
action before route selection. It SHALL not infer the selected workflow, read
historical evidence as current, offer compatibility, or create a conversion,
adoption, or fallback path.

#### Scenario: v2 input is not offered as a production route

- **WHEN** a human asks to resume or change a v2 run
- **THEN** command guidance presents the protocol hard-stop and its owner
action
- **AND** it does not offer a Page Image Workflow mutation or inspection route

### Requirement: COMMANDS presents Page Image Workflow goals without protocol mechanics

The novice-facing request table SHALL describe presentation goals, needed
clarification, expected result, meaningful human confirmation/cost boundary,
and coarse timing. It SHALL not expose raw prompt text, compiled-input digests,
provider grants, internal adapter names, v2 Page Authority terminology, or a
fixed Image2 command sequence. Detailed lifecycle and command forms remain
with current playbooks and CLI owners.

#### Scenario: A novice requests a visual change

- **WHEN** a user reads the command reference for changing a page
- **THEN** the reference explains the next human/Agent interaction in
goal-oriented terms
- **AND** it does not require the user to identify a workflow-internal record
