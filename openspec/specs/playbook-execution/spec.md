## Purpose

Define how MD Controller playbooks under `ppt_maker_harness/playbook/` drive an agent through a deck lifecycle: registered controller inventory is owned by the normative controller manifest, while playbooks provide intent routing, ownership-aware refresh paths, state initialization, gates, and shared-node reuse. Execution state lives in `_state/state.yaml` beside static project metadata.
## Requirements
### Requirement: MD Controller playbooks are housed by the Harness

MD Controller playbooks and their normative controller inventory SHALL reside
under `ppt_maker_harness/playbook/`. Their move to the Harness SHALL preserve
the external Agent's ownership of intent interpretation, sequencing, creative
work, and user communication; the Harness SHALL not be represented as a
persisted Agent or a Run Bundle identity.

#### Scenario: Agent begins controller work

- **WHEN** an Agent locates an active playbook after resolving an exact run
- **THEN** it reads the playbook from the canonical Harness root
- **AND** it preserves existing state, gate, and direct-owner boundaries

### Requirement: Playbook controller delegates workflow control to inspection
After it has resolved a semantic intent and exact run, the MD Controller SHALL use the workflow-entry inspection result for resume, small refresh, structural change, and recovery observation/routing. Greenfield creation SHALL first use the direct `init` entry, then consume inspection only after the exact run exists. The Controller SHALL retain intent interpretation, creative work, human communication, and playbook sequencing, but SHALL not reconstruct direct-owner mode/gate/recovery rules or turn a resume action into a substitute for a requested mutation.

#### Scenario: Existing-run Controller delegates observation
- **WHEN** a Controller has resolved an exact run for resume, refresh, structural change, or recovery observation
- **THEN** it uses the workflow-entry inspection result for workflow control
- **AND** it retains the requested mutation with its direct owner rather than substituting a resume action

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

### Requirement: Existing-deck sessions start with whole-workflow resume ritual
For an exact run, an existing-deck session SHALL begin with state/status inspection and use its shared workflow inspection as progress truth. The Controller SHALL resolve source marker, schema, exact run version, durable mode, and Controller identity before selecting a resume node. A usable current state resumes its active current Controller/node after presenting the full workflow position. A current one-to-one canonical defect is repaired only by its owning mutation path behind existing fences; observation remains non-writing. Pre-current schema, topology-only version identity, retired Controller/node, missing/retired marker, or unrecoverable state SHALL return the one owner-issued typed next action with no state seed, alias, inferred mode, or current execution graph.

#### Scenario: Current execution resumes with durable identity
- **WHEN** a run has a current marker, mode, and in-progress current Controller state
- **THEN** the Agent presents whole-workflow position and resumes that exact Controller/node

#### Scenario: Historical execution does not become a current route
- **WHEN** observation finds pre-current state or a retired identity
- **THEN** the Agent presents the one bounded owner-issued typed next action without writing state or choosing a replacement node

#### Scenario: Identity recovery remains a hard-stop
- **WHEN** the current inspection result reports an identity, evidence, journal, or CAS hard-stop
- **THEN** the Controller names the protected invariant and the one owner-issued next action
- **AND** it does not manufacture a continuation, confirmation, or state replacement from historical fields

### Requirement: State file is created on playbook start
When a current initialized run begins a playbook execution, _state/state.yaml SHALL be created if absent or validated/updated if already present. The playbook and current_node fields SHALL be set as required by the selected current playbook. Run-bundle init SHALL seed current state so the common path has a state file before the first node. Playbook start SHALL tolerate a pre-seeded current file. It SHALL not synthesize state for a markerless, pre-current, topology-only, or retired-controller run; those records use the state owner's one bounded typed next action.

#### Scenario: Playbook start creates state for a current initialized run
- **WHEN** a current initialized run starts its first selected playbook
- **THEN** the controller creates or validates the state file with the current playbook/node identity

#### Scenario: Init-seeded state is accepted at playbook start
- **WHEN** init already seeded a valid current state file
- **THEN** playbook start validates and uses it rather than creating a competing record

#### Scenario: Historical missing state is non-routable
- **WHEN** an unsupported old run has no state file
- **THEN** the Controller returns the one owner-issued typed next action
- **AND** it does not seed state or infer execution from files on disk

### Requirement: probe-image-channels playbook runs doctor channel体检

`probe-image-channels.md` SHALL remain the shared `00-setup` Image2
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
- **AND** the playbook resolves and discloses the submit count before offering the live report

#### Scenario: User confirms all-vendor probe

- **WHEN** the shared resolver supplies three ordered entries
- **AND** the Agent discloses that the probe will make three provider submits
- **AND** the user confirms
- **THEN** the playbook runs `doctor --probe-vendors`, relays progress, and shows the report before any `.env` or `_lessons` write

#### Scenario: User declines live diagnosis

- **WHEN** the user declines after the expected provider-submit count is disclosed
- **THEN** the Agent does not invoke `--probe-vendors` or `--smoke`
- **AND** zero provider submits occur

#### Scenario: Report-only short path skips confirm-write

- **WHEN** the user confirms the disclosed live probe but wants only a report
- **THEN** the Agent presents the probe report
- **AND** it does not write configuration or a lesson

#### Scenario: Channel health does not authorize page work

- **WHEN** a confirmed live probe succeeds
- **THEN** no production authorization or page-refinement state is created
- **AND** any later provider-generating action remains subject to its owner
  gate and exact authorization contract

#### Scenario: Confirm-write does not trigger a hidden recheck

- **WHEN** a confirmed `--probe-vendors` report is followed by a confirmed configuration write
- **THEN** the playbook reports that write without invoking another doctor or
  provider probe
- **AND** a later check requires an explicit route and any new live work needs
  a new disclosure and confirmation

### Requirement: Shared nodes are referenced via includes

A playbook SHALL be able to reference a shared node via `includes: [<node-name>]` in its frontmatter. The referenced node SHALL be defined in a standalone `.md` file with `shared: true` in its frontmatter. Multiple playbooks SHALL be able to include the same shared node.

#### Scenario: classify-change shared by edit-text and edit-visual

- **WHEN** `edit-text.md` and `edit-visual.md` both need change classification
- **THEN** both declare `includes: [classify-change]` in their frontmatter
- **AND** `classify-change.md` exists as a standalone shared node with `shared: true`

### Requirement: Version-scoped backups go under _scratch

When an agent (or playbook step) creates a disposable backup or draft of version sources such as `slide-specifications.md`, it SHALL place that file under `3_versions/v{n}/_scratch/` for the active version. Agents SHALL NOT place such backups at the deck root, under `2_backbone/`, under `_generated/`, or in ad-hoc dirs named `_tmp`, `backup`, or `_bak`. Style-master iteration history remains under `1_upstream_raw_material/style-master-iterations/`; lessons under `_lessons/`; progress under `_state/`.

#### Scenario: slidespec bak lands in version scratch

- **WHEN** Agent renumbers or rewrites slides and keeps a pre-edit copy
- **THEN** the copy is written under `3_versions/v{n}/_scratch/`
- **AND** not as a loose file at the deck root

#### Scenario: Agent does not invent _tmp at deck root

- **WHEN** Agent needs a temporary workspace for a version edit
- **THEN** it uses `_scratch/` (or an existing canonical path from the routing table)
- **AND** does not create `deck_*/_tmp/` or `deck_*/backup/`

### Requirement: Registered playbooks pass machine validation

Every active controller/shared node SHALL pass the canonical node-specification
validator. The validator SHALL bind the expected controller/shared-node
inventory, globally unique IDs, exact order, pipeline ownership, valid
`method_module` values, includes/requires, conditions, decisions,
selected-workflow `draft_route_nodes`, and existing target-module ownership
rules. Its checked-in normative manifest SHALL bind the controller/shared-node
inventory, exact controller-node order, supported-pipeline declarations, and
selected-workflow `draft_route_nodes`. A node MAY declare `draft_route: true`
only when the manifest places it in the exact create-deck workflow's unbound
source-to-first-raw route. Validation SHALL reject missing, extra, duplicated,
sibling-workflow, post-raw, or non-create-deck draft-route entries and SHALL
not rely on a stale hard-coded count alone. The optional key SHALL be either
absent or the literal Boolean `true`; explicit `false`, strings, numbers, null,
and duplicate YAML keys SHALL be rejected rather than normalized into a second
representation of non-routability.

`method_module` SHALL be the only bound lifecycle-location declaration. The
validator SHALL NOT require, normalize, derive a lifecycle decision from, or
emit a lifecycle-specific diagnostic for numeric `lifecycle_phase` or legacy
`phase` metadata. This requirement does not determine the reader's general
handling of otherwise unconsumed node-frontmatter keys.

#### Scenario: Draft-route projection matches playbooks

- **WHEN** the Harness indexes the updated create-deck playbook and controller manifest
- **THEN** each workflow's ordered `draft_route_nodes` begins with the shared workflow-selection node and exactly matches its applicable content, visual-system, selected Style Master, and first-raw nodes declared `draft_route: true`
- **AND** unknown, sibling, post-raw, and non-create-deck nodes cannot become draft-routable through manifest drift

#### Scenario: Draft-route declaration has one canonical form

- **WHEN** a node declares `draft_route` as false, a string, number, null, or duplicate key
- **THEN** canonical node parsing fails before Controller indexing or draft routing
- **AND** absence remains the only representation of a node that is not draft-routable

#### Scenario: Method module is the only lifecycle binding

- **WHEN** a registered node declares a valid `method_module` and omits
  `lifecycle_phase`
- **THEN** the canonical validator accepts its lifecycle location subject to the
  existing module, adapter, and workflow ownership checks
- **AND** it produces no numeric lifecycle-derived field or phase-specific
  diagnostic

### Requirement: Structural verification is identity-aware

The restructure controller's final verification SHALL inspect the target PPTX and evidence for exact current order, expected ID membership, current heading projections, ID-aligned notes, and unchanged retained-page identity. It SHALL present the result using current position, formal ID, and title and SHALL retain the existing user-evidence gate before completion.

#### Scenario: Deleted middle page does not shift notes

- **WHEN** a confirmed transaction deletes a middle slide and target production completes
- **THEN** final verification checks that every retained formal ID has its own note at the new plan position
- **AND** asks for user confirmation against the actual target PPTX

#### Scenario: Retained page moved but kept identity

- **WHEN** an unchanged page appears at a new target position
- **THEN** verification reports its new position and unchanged formal ID
- **AND** does not treat the heading-number change as an ID migration

### Requirement: Controllers create and resume only the current Page Image Workflow

The `create-deck` Controller SHALL obtain one human semantic choice, `framed`
or `pure`, for a new version before provider-facing work. It SHALL author the
schema-declared `page-image-workflow` source selection, configure common visual
semantics, and route to the selected Style Master lifecycle and Page Image
adapter. It SHALL not ask for per-slide authority or author a historical,
version-suffixed, migration, or compatibility selection.

#### Scenario: Controller authors a current workflow selection

- **WHEN** a Deck Author starts a new production version
- **THEN** the Controller records one declared current pipeline and selected
  workflow
- **AND** it does not create an alternative historical route

#### Scenario: A Framed deck has one straight selected route

- **WHEN** a Deck Author selects Framed for a current version
- **THEN** the Controller follows the existing selected Framed owner route
- **AND** it does not route through Pure or a historical branch

#### Scenario: A current resume preserves owner evaluation

- **WHEN** the Controller resumes a valid current production run
- **THEN** it obtains lifecycle facts from the existing owning evaluator
- **AND** it does not recreate them through compatibility logic

### Requirement: Page Image Workflow gates have one direct recovery and review path

Controller nodes SHALL treat source/state/receipt identity mismatch, closed
content-schema failure, invalid Style Master selection, stale compiled input,
invalid provider scope, stale/invalid Page Image Task Mandate, stale/invalid
page evidence, and final/delivery lineage mismatch as non-waivable hard-stops.
Each gate SHALL reuse the owning evaluator and present its one nearest legal
action. An active Task Mandate covers routine provider-free Pilot scope
selection, exact batch grant creation, and ordinary in-scope provider cost, so
those actions are Agent-run guides rather than repeated human confirmations.
Partial Pilot and Complete Page Review remain their own bounded human visual
decisions; neither is a substitute for an identity, mandate, grant, or
lifecycle fact. The stable Framed/Pure authorize nodes SHALL be completed only
by matching state-owned `cli` evidence from an exact grant; a direct grant at
another current node SHALL not complete a sibling node.

When an in-scope source refinement or owner-issued successor creates a later
current exact grant at the same stable Framed/Pure authorize node, its typed
`cli` evidence SHALL supersede only an earlier typed CLI grant projection at
that node. The immutable raw lineage remains historical evidence; a user
decision, malformed node record, unmatched node, or failed current grant fact
SHALL NOT be reset or superseded.

Complete Page Review SHALL use one `proceed` or `repair` decision. A Framed
node presents the exact raw provider page beside the production-equivalent
local-header composite; a Pure node presents its complete provider page. It
SHALL not add a second composite approval gate, let Pilot approval stand in for
complete-page acceptance, or expose sibling adapter controls.

#### Scenario: Framed review does not split its decision

- **WHEN** all current Framed page evidence is ready
- **THEN** the Controller presents raw and composite evidence under one
  Complete Page Review decision
- **AND** it does not require a later local-overlay approval

#### Scenario: Routine exact grant remains Agent-run

- **WHEN** Workflow Inspection exposes a current mandate-covered Pilot or
  Expansion batch
- **THEN** the Controller carries the owner-issued exact scope through the
  registered grant and one-item generation operations without asking the human
  to re-authorize ordinary cost
- **AND** it records only owner/CLI evidence for that mechanical step

#### Scenario: A changed goal or explicit limit asks one real question

- **WHEN** the requested work targets a different Deck or goal, exceeds an
  explicit human limit, or needs a genuinely new consequential content or
  design direction
- **THEN** the Controller pauses normal mandate continuation and presents the
  smallest precise human decision before a replacement scope is established
- **AND** it does not use a prior Task Mandate to submit the changed work

#### Scenario: Stale provider input returns to its owner

- **WHEN** a selected workflow reaches finalization with a stale compiled
  provider-input binding
- **THEN** the Controller routes to the owning rebuild action
- **AND** it does not publish a final slide, PPTX, notes, or delivery receipt

### Requirement: Current Controller refresh and Pilot paths preserve the Page Image model

Pilot remains a provider-free sample stage. Its `pilot` command creates only an
exact batch projection; an Agent acting under the active Task Mandate selects
the owner-allowed risk-representative formal IDs, then the same exact batch
receives its mandate-bound grant before `generate` is invoked. A partial Pilot
may present the same policy-specific page representation that Complete Page
Review will use, but it does not publish acceptance or add a duplicate review
gate. `pilot-review` and `pilot-accept` apply only to partial Pilot evidence;
complete current coverage goes directly to Complete Page Review. The Controller
SHALL use direct owner facts to determine any remaining paid work, not task-card
state or file presence.

A Framed provider-free local overlay refresh is permitted only when its owner
proves the compiled provider input, protected geometry, raw contract, and local
profile are unchanged. A changed header literal normally changes provider
context and routes to raw rebuild. Notes-only work remains delivery-owned;
structural or whole-workflow changes use previewed exact-hash versioning.

#### Scenario: A Framed title change avoids false local refresh

- **WHEN** a Framed title literal changes
- **THEN** the Controller presents the owner-issued raw rebuild path
- **AND** it does not place the change on a provider-free Pilot or local
  overlay path

#### Scenario: Pilot remains non-accepting

- **WHEN** a mandate-bound Framed Pilot sample is available
- **THEN** the Controller presents its raw and composite sample representation
- **AND** it does not record final-page acceptance or open a second review
  gate

### Requirement: Agent retains bounded current Image2 channel-probe guidance

When current Style Master or Page Image provider-path symptoms occur -- such as
failed image checks, an Image2 API/relay failure, or a report that image
generation is unavailable -- and no channel probe has run in the session, the
Agent SHALL offer the existing current channel probe as one concrete action,
for example `probe-image-channels` or `doctor --probe-vendors`, with a short
reason. It SHALL not respond only with an unbounded instruction to check an
API, run an undisclosed live probe, or treat a successful probe as page-cost
authorization, review acceptance, or progress evidence.

#### Scenario: First current provider-path failure offers a bounded probe

- **WHEN** current Page Image or Style Master work fails with a provider-path
  symptom and no session probe has run
- **THEN** the Agent offers one concrete channel-probe action that the human may
  accept or decline
- **AND** it does not create a page plan, grant, provider attempt, or review
  decision from the offer or its result

### Requirement: Active Controller guidance rejects undeclared workflow contracts

Registered active playbooks, Controller manifests, resume cards, and task
projection sources SHALL describe only declared current Page Image Workflow
facts. When they encounter a present foreign, unreadable, incomplete, or
cross-lineage source/state/evidence record that cannot establish exact current
protocol identity, they SHALL present the owner-issued `production-protocol`
`current-protocol-invalid` hard-stop with
`repair-current-protocol-identity` of kind `repair`, with no human decision
required. They SHALL preserve bytes and SHALL not register, select, rewrite,
resume, adopt, migrate, export, convert, or route the undeclared workflow.

They SHALL preserve the existing Harness-binding, narrative/workflow-selection,
state, execution-version, and delivery owner when direct facts establish one of
those current outcomes. Controller guidance SHALL not replace a declared fresh
draft, state-owned defect after current protocol identity is established, exact
Work Version mismatch, or attributable current delivery rebuild with protocol
repair. Only a one-to-one, fence-clear current state repair may write.

#### Scenario: An undeclared run cannot enter an active controller

- **WHEN** a controller attempts to resolve an undeclared source/state pair
- **THEN** it presents the owner-issued repair action before selecting nodes
- **AND** it does not create a compatibility controller or task projection

#### Scenario: Current owner action is not recategorized

- **WHEN** a Controller handoff carries a binding, fresh-draft, current-state,
  execution-version, or attributable-current-delivery owner action
- **THEN** active guidance presents that owner-issued action unchanged
- **AND** it does not replace the action with invalid-protocol recovery

### Requirement: Page Image task projections declare their current report contract

For an exact active current Page Image Workflow Controller route, the optional
`_state/page-production-task-projection.md` SHALL be rebuilt only from
owner-issued inspection and typed handoffs. It may show bounded plan, evidence,
review, manifest, delivery, and current-action references, but it SHALL not
become a selector, source of authority, authorization, acceptance record, or
provider progress evaluator. The projection SHALL use its declared current
shared report contract, and an undeclared record is ineligible to create or
refresh the view.

#### Scenario: A task projection is rebuilt

- **WHEN** an eligible current Controller route rebuilds its task projection
- **THEN** the projection carries its declared current report contract and only
  owner-issued facts
- **AND** it does not add a versioned route marker or advance workflow state

#### Scenario: Card edits cannot advance a current page checkpoint

- **WHEN** a task projection contains changed prose, checkboxes, or stale
  references
- **THEN** the Controller re-reads current owner facts before choosing work
- **AND** it does not treat the card as authorization or acceptance evidence

### Requirement: Create-deck authoring starts with narrative source before page source
The create-deck Controller SHALL guide a Deck Author through Story Outline and
Design Constraints before it asks the Agent to materialize canonical
`slide-specifications.md`. It SHALL obtain the selected workflow and current
Visual Language registry through their existing owners, then present the
provenance-carrying page plan before the page source is published.

The Controller SHALL keep content meaning and conversational explanation with
the Deck Author and Agent. It SHALL delegate parsing, plan identity, source
publication, state, and diagnostic facts to their current runtime owners, and
it SHALL NOT add a second controller node state, page-plan ledger, or provider
authorization path.

#### Scenario: A new deck reaches page authoring
- **WHEN** a new-deck request has passed intake and has current narrative
  sources, a selected workflow, and current Visual Language registry
- **THEN** the Controller presents the resulting page plan before canonical
  page source is materialized
- **AND** it does not skip from topical intake directly to provider-facing work

#### Scenario: The author changes the story during creation
- **WHEN** the Deck Author revises the argument or constraints before accepting
  the page plan
- **THEN** the Controller returns to the narrative planner and presents one
  updated plan
- **AND** it does not write a page source, create provider work, or ask for a
  redundant authorization
