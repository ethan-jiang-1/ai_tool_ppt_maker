## Purpose

Define how MD Controller playbooks under `PPTMAKER_FRAMEWORK/playbook/` drive an agent through a deck lifecycle: registered controller inventory is owned by the normative controller manifest, while playbooks provide intent routing, ownership-aware refresh paths, state initialization, gates, and shared-node reuse. Execution state lives in `_state/state.yaml` beside static project metadata.
## Requirements

### Requirement: Playbook controller delegates workflow control to inspection
After it has resolved a semantic intent and exact run, the MD Controller SHALL use the workflow-entry inspection result for resume, small refresh, structural change, and recovery observation/routing. Greenfield creation SHALL first use the direct `init` entry, then consume inspection only after the exact run exists. The Controller SHALL retain intent interpretation, creative work, human communication, and playbook sequencing, but SHALL not reconstruct direct-owner mode/gate/recovery rules or turn a resume action into a substitute for a requested mutation.

#### Scenario: Existing-run Controller delegates observation
- **WHEN** a Controller has resolved an exact run for resume, refresh, structural change, or recovery observation
- **THEN** it uses the workflow-entry inspection result for workflow control
- **AND** it retains the requested mutation with its direct owner rather than substituting a resume action

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

`probe-image-channels.md` SHALL remain the shared Phase-0 / `00-setup` Image2 environment-diagnostic controller. It SHALL orchestrate: intake -> offline Image2 presence/resolver-count inspection -> disclose expected provider submissions -> obtain human confirmation -> run `ppt_flow doctor --probe-vendors` with background/progress relay when long -> show Summary -> optional confirm-write only after separate human confirmation (`.env` plus `_lessons/image2-proven.yaml` with `via: env`, no secrets). It SHALL NOT auto-write `.env` or `_lessons`. The current credential SSOT normally resolves one canonical entry; the playbook SHALL NOT imply that this change adds a new multi-vendor configuration format.

The disclosure SHALL state that `--probe-vendors` makes exactly one submit per resolved vendor and name the total count. If another current playbook proposes `doctor --smoke`, it SHALL disclose exactly one expected first-vendor submit and obtain confirmation under the same rule. Declining SHALL make zero live calls and SHALL NOT invalidate offline base/Image2-presence evidence.

When the user wants a report without configuration changes, the Agent MAY omit confirm-write after presenting a confirmed live-probe report; report-only intent SHALL NOT bypass confirmation for the provider submits themselves. After confirm-write, the playbook SHALL verify the saved presence offline with `doctor --image2` and SHALL NOT automatically run the current optional follow-up `doctor --smoke`. A follow-up smoke is allowed only when the saved combination was not covered by the report or the human explicitly asks, after a new one-submit disclosure and confirmation. A successful probe SHALL prove channel health only. It SHALL NOT approve legacy production, create page-refinement authorization/state, or authorize a later provider attempt.

#### Scenario: Channel probe intent selects probe-image-channels

- **WHEN** the user asks which Image2 drawing channels are working
- **THEN** routing selects `probe-image-channels`
- **AND** the playbook resolves and discloses the submit count before offering the live report

#### Scenario: User confirms all-vendor probe

- **WHEN** the shared resolver supplies three ordered entries through a compatible or injected resolution seam
- **AND** the Agent discloses that the probe will make three provider submits
- **AND** the user confirms
- **THEN** the playbook runs `doctor --probe-vendors`, relays progress, and shows the report before any `.env` or `_lessons` write

#### Scenario: User declines live diagnosis

- **WHEN** the user declines after the expected provider-submit count is disclosed
- **THEN** the Agent does not invoke `--probe-vendors` or `--smoke`
- **AND** zero provider submits occur

#### Scenario: Report-only short path skips confirm-write

- **WHEN** the user confirms the disclosed live probe but wants only a report and no configuration change
- **THEN** the Agent presents the probe report
- **AND** does not write `.env` or `_lessons`

#### Scenario: Channel health does not authorize page work

- **WHEN** a confirmed live probe succeeds
- **THEN** no legacy build approval or modern page-refinement authorization is created
- **AND** any later provider-generating action remains subject to its own gate or future authorization contract

#### Scenario: Confirm-write does not silently submit again

- **WHEN** a confirmed `--probe-vendors` report is followed by a confirmed configuration write
- **THEN** the playbook runs offline `doctor --image2` to verify saved presence
- **AND** it does not invoke `doctor --smoke` unless a new one-submit disclosure and confirmation occur for an uncovered or explicitly requested probe

### Requirement: Agent offers channel probe on image-path symptoms

When Page Authority raw-generation symptoms appear — doctor image checks failing,
`doctor --smoke` failing, style-reference/raw-generation/review work failing with
API/502/all-vendors-failed, or the user reporting that image generation does not
work — and a channel probe has not already been run in the session, the agent SHALL
proactively offer channel体检 as a **concrete candidate** in plain language
(recognition over recall; consistent with AGENT_CONTRACT §11), e.g. recommend
running the channel probe / `probe-image-channels` / `doctor --probe-vendors`, with
a one-line why. The agent SHALL NOT respond only with "check your API" without an
actionable next step the user can accept.

#### Scenario: First image API failure offers channel probe

- **WHEN** Page Authority raw generation or style-reference work fails with a relay/API error and no probe has run this session
- **THEN** the agent offers a concrete channel-probe next step the user can accept or decline

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

Every active controller/shared node SHALL pass the canonical node-specification validator. A checked-in
normative manifest SHALL bind the expected controller/shared-node inventory, globally unique IDs, exact order,
pipeline ownership, lifecycle/module values, includes/requires, conditions, decisions, selected-workflow
`draft_route_nodes`, and existing Phase-4 ownership rules. A node MAY declare `draft_route: true` only when the
manifest places it in the exact create-deck workflow's unbound source-to-first-raw route. Validation SHALL reject
missing, extra, duplicated, sibling-workflow, post-raw, or non-create-deck draft-route entries and SHALL not rely
on a stale hard-coded count alone. The optional key SHALL be either absent or the literal Boolean `true`;
explicit `false`, strings, numbers, null, and duplicate YAML keys SHALL be rejected rather than normalized into
a second representation of non-routability.

#### Scenario: Draft-route projection matches playbooks

- **WHEN** the framework indexes the updated create-deck playbook and controller manifest
- **THEN** each workflow's ordered `draft_route_nodes` begins with the shared workflow-selection node and exactly matches its applicable content, visual-system, selected Style Master, and first-raw nodes declared `draft_route: true`
- **AND** unknown, sibling, post-raw, and non-create-deck nodes cannot become draft-routable through manifest drift

#### Scenario: Draft-route declaration has one canonical form

- **WHEN** a node declares `draft_route` as false, a string, number, null, or duplicate key
- **THEN** canonical node parsing fails before Controller indexing or draft routing
- **AND** absence remains the only representation of a node that is not draft-routable

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

### Requirement: Controller resume guidance consumes workflow inspection
For fresh, resume, and iteration observation, the MD Controller SHALL obtain workflow readiness and the nearest legal action from workflow_inspection only after resolving a current exact run/controller identity. Playbooks retain semantic routing, artifact presentation, and human interaction; they SHALL not recreate a mode, gate, authorization, transaction, or recovery evaluator from Markdown, metadata, generated artifacts, or conversation context. For an unsupported historical record, inspection returns one owner-issued typed next action rather than a Controller selection.

#### Scenario: Resume presents the shared primary action
- **WHEN** a current durable execution resumes with a blocking prerequisite
- **THEN** the Controller presents workflow inspection's primary action and owner context before later candidates
- **AND** it does not infer an alternate controller or recovery command

#### Scenario: Controller presents an allowed confirmation
- **WHEN** workflow inspection reports a confirm posture with an owner-provided continuation
- **THEN** the Controller presents the required human reason and the action after each allowed choice
- **AND** it does not treat the continuation as approval or evidence completion

#### Scenario: Controller respects a hard-stop
- **WHEN** workflow inspection reports a hard-stop
- **THEN** the Controller explains the protected invariant and routes through the owner recovery action
- **AND** it does not offer force, waive, source-marker replacement, or state editing

### Requirement: New decks enter the Page Authority production controller

For a fresh TARGET version, the registered create-deck controller SHALL obtain one human semantic choice,
`framed` or `pure`, before it enters provider-facing work. It SHALL author the canonical v2 selected-workflow
source, configure the selected visual system, and then enter the Style Master owner, which validates the source
through the selected workflow's read-only candidate-source interface. The Controller SHALL not invoke the
materializing source-validation action before this Style Master handoff. Only after current Style Master
promotion may the selected-workflow raw-plan owner materialize the first source receipt/state pair and expose
that workflow's page-raw prerequisites, gate, and nearest action. The controller SHALL NOT ask for a per-slide
authority choice or infer a workflow from deck type, content, or a generated artifact.

The existing draft router SHALL consume the node-declared, registered-controller-manifest-validated ordered
`draft_route: true` projection for the active selected workflow, so the exact unbound draft remains routable
at the workflow-selection node and after it advances through content, visual-system, Style Master, and first
raw-plan handoff. The playbook and router SHALL NOT infer this from node names, lifecycle phase, array position, or
independent node lists; another controller, sibling-workflow node, unknown node, post-raw node, or bound
production mode SHALL fail closed rather than regain draft status.

The human owns workflow/content/visual decisions. JS owns parsing, readiness, state, evidence, and recovery. A
missing or invalid workflow/source is an owner hard-stop; Style Master cost authorization, Style Master visual
review, page provider authorization, and raw visual review remain distinct bounded human confirms recorded by
their owning runtime interfaces.

#### Scenario: Framed selection creates a straight controller route

- **WHEN** a human selects `framed` for a fresh target version and its canonical source candidate is valid
- **THEN** the controller enters the Framed Style Master path before source receipt/raw planning and later shared delivery without presenting Pure as a slide-level option
- **AND** Style Master and page provider work each wait for their own owner-issued scoped authorization

#### Scenario: Non-v2 source is not a controller route

- **WHEN** an existing source/state pair is non-v2
- **THEN** the Controller presents the owner-issued unsupported-protocol hard-stop
- **AND** it does not register, select, rewrite, or resume a compatibility controller

### Requirement: Page Authority gates have one direct recovery path
Page Authority nodes SHALL classify source/state corruption, invalid frame/registry/reference,
missing/partial/stale/mismatched raw coverage, invalid provider scope, and unknown or attempted
unauthorized submission as non-waivable hard-stops. A complete current raw/final projection awaiting a
human `proceed|repair|redirect` decision, or a complete disclosed raw-submit scope awaiting authorization,
is a `confirm` gate. A node SHALL present the owner-issued nearest action and shall not synthesize
approval, a fallback path, or a state edit.

#### Scenario: Invalid or stale raw evidence blocks progress
- **WHEN** the finalization node detects a missing raw tuple, partial coverage, or stale acceptance
- **THEN** it returns to the raw evidence/review owner
- **AND** it does not create final, PPTX, or notes output

#### Scenario: Current raw review waits for a human decision
- **WHEN** every selected raw tuple and raw-review projection is current but no raw decision exists
- **THEN** the node exposes exactly the raw-review `confirm` action with the current evidence identity
- **AND** it does not publish a final slide or classify the missing human choice as a repairable integrity fault

### Requirement: Active controllers route only Page Authority work
Registered active playbooks SHALL describe v2 Page Authority creation and Pure/Framed/notes/structural refreshes. They SHALL NOT register another-protocol, compatibility, adoption, or migration nodes.

#### Scenario: Controller manifest is validated
- **WHEN** the controller manifest and playbooks are loaded
- **THEN** no active node, gate, or resume card names another-protocol or compatibility route

### Requirement: TARGET controller gates reuse direct workflow evidence

TARGET controller nodes SHALL classify source/state/receipt identity mismatch,
wrong workflow owner, invalid or stale raw evidence, invalid provider scope,
and final/delivery lineage mismatch as non-waivable hard-stops. They SHALL
reuse the owning parser, state, evidence, or delivery evaluator and return its
one nearest legal action. Complete workflow evidence awaiting workflow choice,
provider authorization, raw review, or visual review SHALL remain a `confirm`
gate with a bounded human reason where the owning contract requires one.

#### Scenario: Target raw evidence failure returns to its owner

- **WHEN** a selected target workflow reaches final publication with missing or stale accepted raw evidence
- **THEN** the controller returns the shared raw evidence/review action for that exact receipt
- **AND** it does not create a final, PPTX, notes, or delivery result

### Requirement: Style Master Controller handoff stays selected-workflow specific

The Page Authority Controller SHALL insert Style Master plan, cost-authorization, candidate-progress,
real-byte review, and promotion handoffs after visual-system configuration and before page raw planning.
Framed and Pure SHALL expose separate selected-workflow entries and present only their own visual questions;
shared Controller wording or mechanics SHALL not make a user compare the sibling workflow.

For fresh creation, the handoff SHALL consume the active fresh-v2 authoring draft and validate its
selected-workflow source through the existing read-only candidate-source interface without requiring or creating
page source receipt/state/raw-plan lineage or invoking the materializing source-validation action. For an
existing run it SHALL require the exact current source/state pair. The Controller SHALL consume the Style
Master owner's inspection result for current plan identity, progress, and nearest action; it SHALL NOT select
candidate history by filesystem order or reconstruct attempt/grant state.

The Style Master cost authorization and visual-direction decision are distinct typed human gates. A
cost-authorization gate SHALL appear only when the exact plan contains generated slots; a zero-generated
local-existing plan SHALL proceed directly to exact-hash real-byte review without credentials or a grant. A
`proceed` decision may advance only to owner promotion after current evidence checks; it SHALL NOT satisfy
page raw authorization, Pilot/Expansion approval, raw acceptance, or a structural workflow switch. A
`repair` or `redirect` decision returns the owner-issued Style Master checkpoint. Task checklists are
read-only collaboration projections and SHALL not become Controller evidence or a resume authority.

#### Scenario: Framed path does not expose Pure questions

- **WHEN** the selected current workflow is `framed` and Style Master review is ready
- **THEN** the Controller presents the Framed Style Master entry and current candidate evidence only
- **AND** it does not expose Pure display semantics or a sibling-workflow route

#### Scenario: Pure path does not expose Framed questions

- **WHEN** the selected current workflow is `pure` and Style Master review is ready
- **THEN** the Controller presents the Pure Style Master entry and current candidate evidence only
- **AND** it does not expose Framed Text Frame or safe-zone semantics

#### Scenario: Promotion is required before raw planning

- **WHEN** a human has reviewed a candidate but promotion has not produced a current effective selection
- **THEN** the next Controller action remains Style Master promotion/recovery
- **AND** the page raw authorization node cannot start

#### Scenario: Local-existing review has no cost authorization node

- **WHEN** the exact selected-workflow plan contains one local-existing candidate and zero generated slots
- **THEN** the Controller presents the current real-byte review action directly
- **AND** it does not ask for provider authorization, resolve credentials, or mark a cost gate skipped as approval

#### Scenario: Unknown candidate returns to exact owner recovery

- **WHEN** Style Master inspection reports an unknown submitted attempt for the current plan
- **THEN** the Controller presents the owner-issued exact-plan abandonment decision and required human reason
- **AND** it does not offer retry, edit state, infer failure, or start a successor authorization
