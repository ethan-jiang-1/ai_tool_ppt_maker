## ADDED Requirements

### Requirement: Page Authority Controller uses progressive selected-workflow checkpoints

After Style Master promotion and full raw-plan materialization, each selected
Page Authority Controller SHALL use a straight, workflow-specific progressive
route: inspect full-plan debt; present the Agent's representative Pilot
recommendation; obtain exact Pilot scope/cost authorization when needed;
advance owner-issued per-item progress; present current Pilot evidence only for
a partial Pilot; obtain a separate exact Expansion authorization only after
partial Pilot proceed and nonzero remaining debt; present complete raw review;
then use the existing selected-workflow finalization and shared delivery route.
The Controller SHALL obtain every status and next action from workflow
inspection or the owning raw interface and SHALL not derive them from
Markdown, a task projection, file presence, or conversation memory.

Agent/MD owns representative-risk reasoning, evidence presentation, and
human-facing semantic feedback. The human owns sample changes, explicit
provider cost, Pilot quality, complete raw quality, and delivery quality. JS
owns scope resolution, currentness, authorization, attempt/provenance, and
evidence validation. Framed and Pure SHALL have separate nodes and show only
their own workflow evidence; shared Controller text shall not require users to
compare the sibling workflow.

#### Scenario: Framed Pilot presents its own evidence only

- **WHEN** a current Framed full plan reaches a partial Pilot review
- **THEN** the Controller presents the Framed underlay and production-equivalent composite evidence with the owner-issued decision action
- **AND** it does not expose Pure full-page or sibling-workflow controls

#### Scenario: Pure Pilot presents its own evidence only

- **WHEN** a current Pure full plan reaches a partial Pilot review
- **THEN** the Controller presents the Pure exact full-page bytes with the owner-issued decision action
- **AND** it does not expose Framed Text Frame, safe-zone, or compositor controls

#### Scenario: Partial proceed has one next checkpoint

- **WHEN** the human records proceed for current partial Pilot evidence
- **THEN** the Controller refreshes inspection and presents the raw owner's exact remaining-scope Expansion authorization checkpoint
- **AND** it does not call a provider, infer cost approval, or represent Pilot proceed as raw acceptance

#### Scenario: Partial repair or redirect cannot create Expansion

- **WHEN** the human records repair or redirect for current partial Pilot evidence
- **THEN** the Controller persists only that typed Pilot decision and returns the raw owner's next repair/replan action
- **AND** it does not mint a successor batch, reuse a grant, or expose Expansion, finalization, or delivery

### Requirement: Progressive Controller task projection is a rebuildable collaboration card

For each progressive Page Authority route, the Controller SHALL publish the
run-scoped `_state/page-production-task-projection.md` card from owner-issued
inspection and normal typed Controller handoffs. The card SHALL contain only
current plan, batch, and evidence references, bounded derived progress, the
owner-issued next action, and the corresponding typed human decision plus its
optional persisted note. It SHALL be regenerated on route entry or resume and after a
Controller decision changes its referenced collaboration context.

The Controller SHALL treat this card as a collaboration view only. It SHALL
not use a checked line, prose, generated filename, feedback text, or stale
reference in the card to authorize a cost, resume generation, prove
materialization, infer a decision, or choose a node; every such action SHALL
re-read workflow inspection and the owning direct records.

#### Scenario: Missing card is rebuilt without production work

- **WHEN** a progressive route resumes and its task projection is absent or stale
- **THEN** the Controller rebuilds the card from current inspection and typed handoffs
- **AND** it does not initialize a provider, recreate a grant or attempt, or infer raw progress from the former card

#### Scenario: Card edits cannot advance a progressive checkpoint

- **WHEN** a task projection contains a changed checkbox, prose feedback, or an obsolete batch reference
- **THEN** the Controller refreshes its owner-issued route before selecting a checkpoint
- **AND** it does not treat the card change as authorization, a persisted decision, or materialization evidence

### Requirement: Controller omits duplicate Pilot gates for complete or provider-free debt

When current paid-generation debt is one through five items, the Controller
SHALL use the entire debt set as the paid Pilot materialization scope and,
after it completes, move directly to complete raw review. It SHALL not ask for
a partial Pilot quality decision or Expansion authorization. When debt is zero,
the Controller SHALL skip Pilot scope authorization/materialization/evidence
and route to the raw owner's complete-review action. Provider-free Framed
Text Frame-only local rebind and notes-only refresh paths SHALL retain their
existing owners and SHALL not enter a synthetic Pilot route. A current Framed
local rebind accepted by its existing validator SHALL retain its complete
raw-review reference and proceed without a new complete-review decision; any
failed retention condition returns the raw owner's normal progressive path.

#### Scenario: Small deck receives one raw-quality decision

- **WHEN** a current run has three paid-debt items and current reusable tuples for every other full-plan item
- **THEN** the Controller obtains one exact cost authorization, reports materialization progress, and presents complete raw review
- **AND** it does not create a Pilot proceed record or an Expansion node

#### Scenario: Resume consumes runtime truth

- **WHEN** a progressive Controller resumes after interruption
- **THEN** it resolves the exact run/controller identity and refreshes owner-issued inspection before choosing its node
- **AND** it does not use previously checked task lines or generated filenames to infer submit, success, or authorization
