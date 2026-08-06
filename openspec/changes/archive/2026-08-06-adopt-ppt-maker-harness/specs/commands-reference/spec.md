## RENAMED Requirements

- FROM: `### Requirement: COMMANDS.md exists at framework root`
- TO: `### Requirement: COMMANDS.md exists at Harness root`

## MODIFIED Requirements

### Requirement: COMMANDS.md exists at Harness root

`ppt_maker_harness/COMMANDS.md` SHALL exist as a human-readable command
reference at the PPT Maker Harness root. It SHALL map natural-language user
requests to the Agent actions that fulfill them and SHALL not identify the
retired Framework root as a command or discovery location.

#### Scenario: Human opens COMMANDS.md to learn what to say

- **WHEN** a human opens `ppt_maker_harness/COMMANDS.md`
- **THEN** they see a table of common requests with corresponding Agent actions
- **AND** each row includes estimated duration and identifies the PPT Maker
  Harness as the reusable tool environment

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

### Requirement: COMMANDS.md presents user goals rather than protocol mechanics

`ppt_maker_harness/COMMANDS.md` SHALL render the supported discovery surface
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
