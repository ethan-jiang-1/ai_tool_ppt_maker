## MODIFIED Requirements

### Requirement: probe-image-channels playbook runs doctor channel体检

`probe-image-channels.md` SHALL remain the shared Phase-0 / `00-setup` Image2
environment-diagnostic controller. It SHALL orchestrate intake, offline
presence/resolver-count inspection, disclosure of expected provider
submissions, human confirmation, `ppt_flow doctor --probe-vendors` with
background/progress relay when long, and a bounded Summary. Optional
configuration writing requires a separate human confirmation and SHALL not
write secrets automatically. The current credential source normally resolves
one canonical entry; the playbook SHALL NOT imply an alternate multi-vendor
configuration format.

The disclosure SHALL state that `--probe-vendors` makes exactly one submission
per resolved channel and name the total count. If another current playbook
proposes `doctor --smoke`, it SHALL disclose exactly one expected first-channel
submission and obtain confirmation under the same rule. Declining SHALL make
zero live calls and SHALL NOT invalidate offline foundation evidence.

After an optional configuration write, the playbook SHALL report the saved
decision without automatically invoking a second readiness command. A later
verification request enters the normal foundation route, or the documented
direct recovery entry only when the normal entry is unavailable. A successful
probe proves channel health only; it SHALL not approve production, create page
authorization/state, or authorize a later provider attempt.

#### Scenario: Channel probe intent selects probe-image-channels

- **WHEN** the user asks which Image2 drawing channels are working
- **THEN** routing selects `probe-image-channels`
- **AND** the playbook resolves and discloses the submission count before
  offering the live report

#### Scenario: User confirms all-vendor probe

- **WHEN** the shared resolver supplies three ordered entries
- **AND** the Agent discloses that the probe will make three provider submits
- **AND** the user confirms
- **THEN** the playbook runs `doctor --probe-vendors`, relays progress, and
  shows the report before any optional configuration write

#### Scenario: User declines live diagnosis

- **WHEN** the user declines after the expected provider-submit count is
  disclosed
- **THEN** the Agent does not invoke `--probe-vendors` or `--smoke`
- **AND** zero provider submits occur

#### Scenario: Report-only short path skips configuration write

- **WHEN** the user confirms the disclosed live probe but wants only a report
- **THEN** the Agent presents the probe report
- **AND** it does not write configuration or a lesson

#### Scenario: Channel health does not authorize page work

- **WHEN** a confirmed live probe succeeds
- **THEN** no production authorization or page-refinement state is created
- **AND** any later provider-generating action remains subject to its owner
  gate and exact authorization contract

#### Scenario: Confirm-write does not trigger a hidden recheck

- **WHEN** a confirmed probe report is followed by a separately confirmed
  configuration write
- **THEN** the playbook reports that write without invoking another doctor or
  provider probe
- **AND** a later check requires an explicit route and any new live work needs
  a new disclosure and confirmation

### Requirement: Progressive Controller task projection is a rebuildable collaboration card

For an exact active progressive Page Authority `create-deck` Controller route,
the Controller SHALL publish the run-scoped
`_state/page-production-task-projection.md` card from owner-issued inspection
and normal typed Controller handoffs. The card SHALL contain only current plan,
batch, and evidence references, bounded derived progress, the owner-issued
next action, and the corresponding typed human decision plus its optional
persisted note. It SHALL be regenerated on Controller route entry/resume and
after a Controller decision changes its referenced collaboration context.

The Controller SHALL treat this card as a collaboration view only. It SHALL
not use a checked line, prose, generated filename, feedback text, or stale
reference in the card to authorize a cost, resume generation, prove
materialization, infer a decision, or choose a node; every such action SHALL
re-read workflow inspection and owning direct records. A route without the
exact active progressive Controller identity is not eligible to write the card.

#### Scenario: Missing card is rebuilt without production work

- **WHEN** an exact active progressive Controller route resumes and its task
  projection is absent or stale
- **THEN** the Controller rebuilds the card from current inspection and typed
  handoffs
- **AND** it does not initialize a provider, recreate a grant or attempt, or
  infer raw progress from the former card

#### Scenario: Card edits cannot advance a progressive checkpoint

- **WHEN** a task projection contains a changed checkbox, prose feedback, or
  an obsolete batch reference
- **THEN** the Controller refreshes its owner-issued route before selecting a
  checkpoint
- **AND** it does not treat the card change as authorization, a persisted
  decision, or materialization evidence

#### Scenario: Ineligible observation does not write a card

- **WHEN** an observation resolves a non-progressive controller, mismatched
  Controller identity, or unsupported workflow
- **THEN** it reports the owner-issued observation/action without a card write
- **AND** it does not create a replacement state, projection, or recovery route

## ADDED Requirements

### Requirement: Intent Route Catalog enters existing Controller boundaries only

The MD Controller SHALL use the Intent Route Catalog only before lifecycle
entry. `work-new` SHALL reach the existing direct initialization and
create-deck Controller boundary after its applicable foundation work.
`work-resume` SHALL require an exact run and consume workflow inspection.
`work-change` SHALL require an exact run and enter `classify-change` before
the existing text, visual, notes, or structural playbook. The catalog SHALL not
select a node, mutate execution state, or replace a current Controller route.

#### Scenario: New-deck discovery does not preselect a lifecycle node

- **WHEN** a user begins a new-deck request
- **THEN** the Agent performs applicable foundation and initialization work
  before handing off to the existing create-deck Controller
- **AND** it does not write a route selection, workflow choice, authorization,
  or raw plan during discovery

#### Scenario: Change discovery preserves classifier ownership

- **WHEN** a user with an exact run asks for a work change
- **THEN** the Agent enters `classify-change` and the existing selected leaf
  playbook
- **AND** it does not use the resume card or catalog to infer a direct owner
  mutation
