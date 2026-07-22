## Purpose

Define how MD Controller playbooks under `PPTMAKER_FRAMEWORK/playbook/` drive an agent through a deck lifecycle: registered controller inventory is owned by the normative controller manifest, while playbooks provide intent routing, ownership-aware refresh paths, state initialization, gates, and shared-node reuse. Execution state lives in `_state/state.yaml` beside static project metadata.
## Requirements
### Requirement: Controller routing follows production mode before pipeline behavior

Every fresh, resume, and iteration controller SHALL obtain the exact version-scoped production policy
before selecting mode-specific nodes. The MD Controller SHALL own semantic intent, presentation of real
review artifacts, and human decisions; it SHALL delegate deterministic mode/pipeline consistency,
readiness, state mutation, and completion evaluation to JS. A missing/invalid mode or mode/source drift
SHALL stop controller entry with the producer-owned recovery action rather than choosing a controller
from source prose, metadata, generated directories, or conversation context.

For `image2-only`, the ordinary create/iterate route SHALL use the whole-page Image2 production nodes
as a first-class flow and SHALL not describe the run as an HTML refinement. For both HTML modes, normal
production remains HTML-owned. Cross-pipeline mode requests SHALL route to versioned-transition guidance
without clearing the active controller or editing current-version source/state.

The active node list SHALL come from the canonical mode-filtered playbook index. Inapplicable branch
nodes remain outside that list and SHALL not be marked skipped or deleted. Before a first-class
whole-page operation that will actually submit provider work, the Controller SHALL show exact operation,
run version, selected IDs/roles, profile, and maximum submit count and record the typed human
authorization in the active node. Reuse/no-submit paths SHALL not ask for a fictitious authorization.

#### Scenario: Fresh Image2-primary request enters whole-page flow

- **WHEN** create-deck starts with a consistent `image2-only` v1
- **THEN** the Controller proceeds through Image2 authoring, scoped provider authorization, style master, pilot/review, build, notes, and final review
- **AND** it never enters HTML production or modern refinement

#### Scenario: Resume sees mode drift

- **WHEN** durable state mode and source pipeline do not agree
- **THEN** resume stops at the typed state/transition recovery action
- **AND** it does not infer a replacement controller

### Requirement: playbook/ directory contains the registered MD controllers

`PPTMAKER_FRAMEWORK/playbook/` SHALL contain the existing eleven active ordered MD Controllers plus
shared node `classify-change.md`; this change adds mode branches, not another controller. Historical
compatibility remains available through
`legacy-image2-maintenance`; `probe-image-channels` remains Phase 0. The `create-deck` controller SHALL
declare mode-aware paths for both `html-first-v1` and `legacy-image2-first` rather than treating a new
Image2-primary run as legacy maintenance. `image2-refine` SHALL serve only a marked HTML-first run.

For `html-only`, new entry to `image2-refine` is mode-disabled; the Controller SHALL offer the atomic
switch to `html-then-image2` and retain any historical refinement records without running them. For
`html-then-image2`, create-deck SHALL perform an explicit state-bound handoff to the same controller and
return to mode-aware completion after current refinement/final review. Normal refinement entry requires
current `html-delivery-review: proceed` with complete evidence; the existing explicit offline
`image2 plan --force --reason` prerequisite waiver MAY apply when current final-slide/slot identity is
valid. No prerequisite waiver authorizes provider generation.

#### Scenario: Agent lists available controllers

- **WHEN** the playbook index is built
- **THEN** it contains the registered controllers with Image2-primary create, disabled/required modern refinement by HTML mode, and historical maintenance as distinct ownership paths

#### Scenario: Image2-primary selects legacy-only controller

- **WHEN** a new `image2-only` run attempts to enter compatibility-only maintenance instead of its create route
- **THEN** entry validation reports the first-class create/iteration owner

#### Scenario: HTML deck selects legacy controller

- **WHEN** either HTML mode attempts to enter `legacy-image2-maintenance`
- **THEN** entry validation fails with a pipeline/mode-ownership diagnostic

#### Scenario: HTML-then-Image2 reaches refinement

- **WHEN** current HTML delivery is reviewable under `html-then-image2`
- **THEN** create-deck hands off to `image2-refine` and cannot complete until the current refinement/final-review conditions pass

#### Scenario: User explicitly enters refinement before complete delivery evidence

- **WHEN** current HTML final-slide/slot inputs are identifiable and the user accepts the displayed prerequisite risk with a reason
- **THEN** the controller may create only the offline prerequisite-waived plan
- **AND** it still requires exact authorization before any provider operation

### Requirement: create-deck playbook covers complete deck creation

`create-deck.md` SHALL define a complete mode-aware workflow from init/intake through authored content,
visual direction, real-artifact gates, mode-owned production, evidence-bound final review, readiness,
and completion. `image2-only` SHALL complete through whole-page Image2 style master, pilot/content/
visual/header review, build, PPTX, notes, and final review without HTML or modern refinement.
`html-only` SHALL retain the complete local HTML workflow and finish without refinement. For
`html-then-image2`, current HTML delivery SHALL lead through the registered refinement handoff and a
new current final review before completion. Shared/intake nodes and mode-specific nodes SHALL declare
their closed `production_modes` applicability; inapplicable nodes are excluded from the active set and
are never synthetically skipped.

For `image2-only`, the Controller SHALL plan and authorize each chargeable style-master, pilot, build,
or refresh batch immediately before its submit boundary. Authorization SHALL bind the current run,
operation, selected stable IDs/roles, generation profile, and maximum submissions. A changed/expanded
scope or a new submit batch requires a new typed decision. The Controller SHALL not infer authorization
from init, doctor/live probe, a prior batch, content/visual approval, or chat. When the adapter proves
all selected work is reusable and zero-submit, the Controller continues mechanically without requesting
authorization.

Before the mode-owned final-review node records `proceed|repair|redirect`, the Controller SHALL show
the current contact sheet plus PPTX/notes result and JS SHALL bind the decision to the exact version's
current evidence. Repair/rerun SHALL return to the owning content, visual-system, refinement, or
production node. Cross-pipeline redirection SHALL not mutate the current version or infer a transition
from free text. HTML final review SHALL retain existing `state --record-delivery-review`; first-class
Image2 final review SHALL use separate `state --record-image2-delivery-review`, which derives current
whole-page lineage and offers no force continuation.

#### Scenario: User starts with the default mode

- **WHEN** COMMANDS routes a fresh request with default `image2-only`
- **THEN** execution follows the complete first-class whole-page flow
- **AND** does not require HTML source or HTML delivery

#### Scenario: User says "帮我做一个PPT"

- **WHEN** COMMANDS routes a fresh request without another mode preference to `create-deck`
- **THEN** execution begins at instantiation with default `image2-only` and its complete mode-filtered path

#### Scenario: User finishes after delivery

- **WHEN** final review accepts current `html-only` PPTX/notes
- **THEN** the create execution completes with no pending Image2 node, plan, or authorization

#### Scenario: User selects html-then-image2

- **WHEN** HTML delivery is current but required refinement/final review is not
- **THEN** create execution remains incomplete and names the current refinement owner

#### Scenario: Chargeable whole-page work is not authorized

- **WHEN** Image2-primary style-master, pilot, or build would submit work without the current scoped typed decision
- **THEN** the Controller stops before invoking the CLI submit boundary and requests the exact authorization

#### Scenario: Whole-page batch reuses current artifacts

- **WHEN** provenance proves the selected whole-page operation will make zero provider submissions
- **THEN** the Agent performs the mechanical local/reuse work without a provider-authorization prompt

#### Scenario: Delivery changes after final review

- **WHEN** mode-owned contact sheet, assembly, PPTX, notes, or required refinement evidence changes after `proceed`
- **THEN** the prior decision is stale and completion returns to current final review

### Requirement: Iteration playbooks resolve semantic paths

`edit-text`, `edit-visual`, `edit-notes`, and `restructure-slides` SHALL first resolve the exact
version-scoped production mode, verify its canonical pipeline, and then select source-owner behavior.
For either HTML mode, visible copy/body/family/fallback edits SHALL use Local Slide Rebuild;
visual-config changes SHALL use Local Deck Rebuild with representative preview; notes-only changes
SHALL use Stage 5; and structure changes SHALL use preview/hash-bound clean vNext plus target-local
rebuild. These HTML paths SHALL not use render mode, whole-page style master, provider adapters, or
remote authorization. A request for modern refinement under `html-only` SHALL route to the atomic
same-pipeline switch to `html-then-image2` before refinement entry.

For `image2-only`, compatible iteration controllers SHALL retain the ordinary whole-page Image2
refresh, render-mode, style-master, force/review, and provider-authorization semantics without
reclassifying the run as historical maintenance. Only a pre-mode historical markerless deck SHALL use
the read-only compatibility projection and `legacy-image2-maintenance` continuation. Structural
Versioning Path remains outer to all mode branches and SHALL not be presented as a fourth peer refresh.

#### Scenario: HTML title or body edit

- **WHEN** one HTML-mode slide's visible content changes
- **THEN** the controller invokes local slide rebuild and verifies current pixels/delivery

#### Scenario: HTML visual-system edit

- **WHEN** global renderer-neutral visual config changes for an HTML-mode run
- **THEN** the controller shows representative production-compositor output before local deck rebuild

#### Scenario: Notes-only edit

- **WHEN** only speaker notes change and assembly lineage is current
- **THEN** the controller runs Notes-Only Refresh without recomposition

#### Scenario: Markerless visual rebuild

- **WHEN** an `image2-only` run needs whole-page regeneration
- **THEN** the controller uses its ordinary whole-page route with existing force/review/prerequisite behavior
- **AND** reserves legacy maintenance for historical pre-mode compatibility

#### Scenario: HTML-only user requests modern refinement

- **WHEN** an `html-only` user asks to start or continue modern visual-slot refinement
- **THEN** the controller offers the atomic switch to `html-then-image2` before entering refinement

### Requirement: COMMANDS.md is a routing table

`PPTMAKER_FRAMEWORK/COMMANDS.md` SHALL remain the natural-language-to-controller routing table with
examples, target controller, entry parameters, and sections for exploration/preview, migration/import,
Image2 channel diagnosis, resume, and post-delivery iteration. Every deck-scoped route SHALL resolve
the authoritative production mode before verifying pipeline and selecting controller behavior. HTML
visual-direction/preview intent SHALL enter local renderer-neutral `iterate-style`/`quick-preview`
behavior; an explicit whole-page style-master phrase SHALL not create a style master for an HTML deck.
An `html-only` refinement request SHALL first route to the mode switch. First-class `image2-only`
visual/style intent SHALL enter the ordinary whole-page create/iteration route. Historical markerless
decks without state alone SHALL enter the compatibility projection and `legacy-image2-maintenance`.
Image-channel symptom/direct-probe examples SHALL route to `probe-image-channels` only for a selected
Image2-dependent operation and SHALL not diagnose local HTML rendering as a provider problem.

Resume examples SHALL run state/status first. Durable state resumes its active compatible
controller/current node after reporting whole-workflow position; a historical markerless deck without
state receives the read-only compatibility projection and initializes execution only after the user
continues; a complete `html-only` run is not restarted or assigned refinement debt. Migration/import
SHALL route through `migrate-import` and retain its show/hash/mode gates.

#### Scenario: Fresh HTML user asks for visual exploration

- **WHEN** an HTML-mode user asks to try several visual directions
- **THEN** COMMANDS routes to local renderer-neutral exploration/preview
- **AND** does not require a whole-page style master or provider channel

#### Scenario: Legacy user asks to iterate style master

- **WHEN** a historical pre-mode markerless deck user explicitly asks to refine its style master
- **THEN** COMMANDS routes to the legacy-compatible controller and existing review obligations

#### Scenario: HTML browser failure is not an Image2 symptom

- **WHEN** HTML composition fails locally without a provider/API diagnostic
- **THEN** COMMANDS routes to local source/runtime repair rather than `probe-image-channels`

#### Scenario: Durable execution resumes at current node

- **WHEN** state contains compatible in-progress execution
- **THEN** the Agent reports position and resumes that controller/node instead of restarting create-deck

#### Scenario: Markerless deck without state resumes compatibly

- **WHEN** an old markerless deck has no durable execution state
- **THEN** the Agent reports legacy-maintenance ownership without writing state until explicit continuation

#### Scenario: First-class Image2 visual intent stays first class

- **WHEN** an `image2-only` run asks to iterate whole-page visual direction or style master
- **THEN** COMMANDS routes to its normal whole-page controller rather than compatibility maintenance

### Requirement: Existing-deck sessions start with whole-workflow resume ritual

Existing-deck sessions SHALL still run `ppt_flow state` and `ppt_flow status`, inspect mode/pipeline,
pointer/wait/artifact/gate evidence, explain whole-workflow position, load the resolved controller/current
node, check entry, and confirm continuation before replacing incomplete work. State heal SHALL run the
bounded schema migration and known controller/node/module migration, then resolve authoritative mode
before verifying source-pipeline ownership. A durable first-class `image2-only` execution SHALL resume
its normal whole-page controller; only a historical pre-mode markerless execution SHALL map to declared
compatibility maintenance. Conversation context and generated artifacts SHALL not override state. If a
mapping is ambiguous, the resume card SHALL require the existing human-owned replacement/restart choice
and preserve original state until that decision is recorded.

#### Scenario: Old markerless execution resumes after directory migration

- **WHEN** a historical state points to an old whole-page create/production node
- **THEN** heal records its version mode and maps execution to declared compatibility maintenance with preserved evidence/wait
- **AND** the Agent does not restart a fresh create flow

#### Scenario: HTML-marked execution resumes locally

- **WHEN** an HTML-first deck has an old but unambiguous controller pointer
- **THEN** heal records `html-only`, maps the pointer to the corresponding final Phase/module node, and continues locally

#### Scenario: In-progress replacement remains human-owned

- **WHEN** the old topology has no one-to-one semantic mapping
- **THEN** no state or mode is cleared or guessed
- **AND** the user must confirm a replacement/restart action

### Requirement: State file is created on playbook start

When a playbook begins execution, `_state/state.yaml` SHALL be created (if it does not exist) or validated/updated (if it already exists). The `playbook` and `current_node` fields SHALL be set as required by the playbook. Run-bundle init (`initBundle` via `bundle_layout --init` or `ppt_flow init`) SHALL seed `_state/` when absent, so the common path already has a state file before the first playbook node; playbook start MUST tolerate a pre-seeded file and MUST still create one if a legacy deck is missing it.

#### Scenario: Playbook start creates state when missing

- **WHEN** Agent executes node `instantiation` for the first time
- **AND** `_state/state.yaml` does not yet exist
- **THEN** `deck_<name>/_state/state.yaml` is created with `playbook: create-deck` and `current_node` reflecting instantiation

#### Scenario: Init-seeded state is accepted at playbook start

- **WHEN** a deck was initialized and `_state/state.yaml` already exists
- **AND** Agent begins playbook execution
- **THEN** Agent validates or updates the existing state
- **AND** does not fail merely because the file pre-exists

### Requirement: Gates are enforced at node boundaries

At a gate boundary, the MD Controller SHALL show missing/stale evidence, the recommended repair command,
and any declared reversible-risk continuation. It SHALL consume producer-owned diagnostics rather than
parse prose or edit state. Continuations SHALL persist bounded reasons and remain visibly `waived`, with
evidence completeness independent; hard-stop conditions SHALL explain the protected invariant and safe
owner recovery. No node completes before its exit conditions pass, and successful rendering never
implies approval.

For both HTML modes, preview MAY run while gates are pending; the Controller SHALL show exact ordered
content and production-equivalent representative/affected-page artifacts. JS SHALL require current
version-scoped HTML content/visual approval or declared waiver before Stage 4; metadata mirrors alone
never satisfy it. For first-class `image2-only` and historical markerless compatibility, existing
whole-page style-master/pilot/header artifact presentation, scalar readiness, and preview-versus-build
semantics remain. A first-class provider authorization is separate from quality gates, and neither
branch's evidence satisfies the other.

#### Scenario: HTML preview is available before approval

- **WHEN** HTML gates are pending but source/runtime checks pass
- **THEN** the Controller may show current preview artifacts
- **AND** cannot complete delivery or infer approval from successful rendering alone

#### Scenario: HTML content changes after review

- **WHEN** the ordered reviewed content fingerprint changes
- **THEN** approval or waiver freshness becomes stale and the owning node cannot complete without a current decision

#### Scenario: Legacy preview remains compatible

- **WHEN** a historical markerless deck has a style master and pending gates
- **THEN** pilot preview may run without waiving gates

#### Scenario: Content evidence is stale

- **WHEN** a build observes stale content or visual evidence with valid source and version identity
- **THEN** the Controller presents the recommended preview/approve route and any declared reasoned continuation
- **AND** it does not silently choose either path for the user

#### Scenario: User chooses the recommended repair

- **WHEN** the user follows the displayed preview and approval action
- **THEN** the Controller rechecks the exact current plan and continues when approved
- **AND** no conversation-only decision is treated as state evidence

#### Scenario: User chooses explicit continuation

- **WHEN** the user supplies the declared waiver/force reason
- **THEN** the Controller invokes the owning public CLI operation
- **AND** status reports the waived decision and evidence completeness separately from approved readiness

#### Scenario: Hard-stop transaction conflict

- **WHEN** an active journal, reset fence, mismatched plan identity, corrupted state, or missing provider authority is reported
- **THEN** the Controller explains the protected invariant and recovery action
- **AND** does not offer a force path that could overwrite or guess ownership

#### Scenario: Image2-primary quality approval does not authorize submit

- **WHEN** whole-page content/visual/header quality evidence is current but the next `image2-only` batch will submit
- **THEN** the Controller still obtains the exact current provider authorization at that boundary

### Requirement: Explore playbooks cover pre-commitment style and pilot preview

Pre-commitment exploration SHALL remain conversation-only and write-free until the user authorizes a
deck/change path. After mode selection, HTML-mode quick preview SHALL route to structured content plus
local production-equivalent HTML evidence with no whole-page style-master/provider requirement.
`image2-only` exploration SHALL route to first-class whole-page style/pilot semantics and SHALL disclose
readiness, exact chargeable scope, and authorization before any provider submit; it SHALL not be labeled
historical maintenance or modern visual-slot refinement. Historical markerless compatibility retains
its existing exploration through the compatibility branch. Explore controllers SHALL advertise modern
visual-slot refinement only for `html-then-image2` at its declared post-delivery lifecycle.

#### Scenario: Fresh user requests a quick visual sample

- **WHEN** a fresh user requests a quick sample after accepting the default `image2-only` mode
- **THEN** quick preview follows first-class whole-page style/pilot routing
- **AND** it makes no provider submit until exact scope and authorization are current

#### Scenario: HTML user requests a quick visual sample

- **WHEN** a fresh user explicitly selects either HTML mode
- **THEN** quick preview produces local HTML compositor evidence without a whole-page style master

### Requirement: Migrate-import playbook guards off-path UX

`migrate-import` SHALL distinguish import normalization, ordinary structural versioning, and explicit legacy-to-HTML migration before writes. For explicit HTML migration, the Controller SHALL first obtain the selected migration route and preset, invoke the closed preparation operation, and show the returned projected candidate/checklist. The Agent then authors the complete structured candidate from the legacy material; the Controller SHALL not infer structured bodies from prompts or ask the human to reproduce deterministic source/control/asset scaffolding. An unprepared or incomplete preview result is a `guide`: the Controller follows its exact prepare or bounded authoring action and does not present it as comparison evidence or a decision gate.

HTML migration SHALL require a complete Agent-authored structured candidate, a complete proposed HTML deck/contact sheet, exact plan hash/old-side mode, and human confirmation before publication. After the human accepts, the Controller SHALL invoke the state owner's exact confirmation operation; it must succeed in atomically advancing `confirm-html-migration` to the bounded `apply-html-migration` record before normal apply. The Controller SHALL not direct the human to modify state or recreate this binding from prose. The old side SHALL use only current verified legacy evidence in `verified-current`; missing/stale evidence SHALL deterministically use `degraded-missing|degraded-stale` with diagnosis/placeholder, no old pixels/provider call/parity claim, and an optional separately authorized legacy-maintenance next action. The controller SHALL not mutate the legacy version, carry authorization, or treat ordinary structural publication as a migration renderer. Candidate identity/confinement conflicts, confirmation receipt drift, an exact hash/mode mismatch, and active/uncertain apply ownership remain hard stops because they protect authored work, target identity, and recovery. If apply reports a cross-host/uncertain migration journal, the Controller SHALL explain the exact target/staging risk, obtain confirmation that no migration apply is active, retain the opaque token internally, and invoke only `apply --recover-journal <token>` after the 300000-ms floor; a decline makes zero writes. Same-host proven-active ownership is never overridden.

#### Scenario: Agent receives a preparation-to-authoring handoff

- **WHEN** a markerless user selects explicit HTML migration and preparation succeeds
- **THEN** the Controller presents the candidate checklist and returns semantic slide-body authoring to the Agent
- **AND** it does not claim IMAGE PROMPT text was converted automatically

#### Scenario: Incomplete candidate is guided rather than silently prepared

- **WHEN** preview reports a preparation or authoring guide
- **THEN** the Controller follows the report's nearest legal action and reruns the same preview check
- **AND** it does not create a vNext, state decision, or provider request

#### Scenario: Legacy comparison evidence is stale

- **WHEN** migration preview has no current verified old-side pixels
- **THEN** the Controller presents the exact degraded mode with no old pixels and may offer separately authorized legacy maintenance
- **AND** does not silently regenerate old images

#### Scenario: User declines uncertain migration recovery

- **WHEN** apply-journal ownership cannot be proven stopped and the human declines confirmation
- **THEN** the controller leaves journal/reservation/staging/visible versions unchanged

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

When Image2 path symptoms appear — doctor image checks failing, `doctor --smoke` failing, style-master/Stage2/pilot failing with API/502/all-vendors-failed, or the user complaining that image generation does not work — and a channel probe has not already been run in the session, the agent SHALL proactively offer channel体检 as a **concrete candidate** in plain language (recognition over recall; consistent with AGENT_CONTRACT §11), e.g. recommend running the channel probe / `probe-image-channels` / `doctor --probe-vendors`, with a one-line why. The agent SHALL NOT respond only with "check your API" without an actionable next step the user can accept.

#### Scenario: First image API failure offers channel probe

- **WHEN** Stage 2 or style-master fails with a relay/API error and no probe has run this session
- **THEN** the agent offers a concrete channel-probe next step the user can accept or decline

### Requirement: Long image-generation nodes stay observable to the user

Every long-running production/diagnostic node SHALL use registered CLI progress as the visible wait
contract. HTML render/composition/build nodes retain bounded phase plus slide `i/N` progress without
exposing source/HTML/paths. First-class and historical whole-page style-master/pilot/Stage-2 nodes retain
submit/poll heartbeat, `i/N`, and attempt-summary behavior; `probe-image-channels` retains
`probing i/N`. When duration exceeds foreground budget, the Controller SHALL use background/equivalent
execution, periodically read progress, and relay meaningful updates. Prolonged silence is diagnostic;
non-zero exit surfaces the normalized envelope. No path invents a daemon or durable in-flight task state.

#### Scenario: HTML deck composition is observable

- **WHEN** a multi-slide local composition exceeds the foreground budget
- **THEN** the Controller relays bounded render/compose slide progress until completion or failure
- **AND** does not route the delay to provider/channel diagnosis

#### Scenario: Legacy pilot remains observable

- **WHEN** historical markerless pilot generation takes minutes
- **THEN** the Controller relays existing provider heartbeats and slide progress through background/equivalent execution

#### Scenario: Failure is not covered by a wait message

- **WHEN** either adapter exits non-zero
- **THEN** the Controller surfaces the producer-owned final diagnostic and owning repair path

#### Scenario: Image2-primary pilot remains observable

- **WHEN** a first-class whole-page batch takes longer than the foreground budget
- **THEN** the same existing progress/heartbeat contract is relayed without relabeling it compatibility work

### Requirement: Shared nodes are referenced via includes

A playbook SHALL be able to reference a shared node via `includes: [<node-name>]` in its frontmatter. The referenced node SHALL be defined in a standalone `.md` file with `shared: true` in its frontmatter. Multiple playbooks SHALL be able to include the same shared node.

#### Scenario: classify-change shared by edit-text and edit-visual

- **WHEN** `edit-text.md` and `edit-visual.md` both need change classification
- **THEN** both declare `includes: [classify-change]` in their frontmatter
- **AND** `classify-change.md` exists as a standalone shared node with `shared: true`

### Requirement: State file coexists with project-metadata.yaml

`_state/state.yaml` SHALL own playbook executions, nodes, decisions, waits, gates, the HTML production
reset, version-scoped production mode, and mode transition/registration authority.
`project-metadata.yaml` SHALL retain durable non-routing project configuration/status plus a human-
readable mirror of only the last presented production mode/version. That mirror SHALL never select an
adapter, heal a missing mode, or authorize delivery. Whole-page Image2, whether first-class or
historical compatibility, retains existing `content_gate|visual_gate` and
`_state.gates.content|visual` mirror/readiness semantics. Both HTML modes retain version-scoped
authoritative review records plus disjoint `html_*` status mirrors. No branch publication overwrites
another branch's gate mirrors.

Gate dual-write SHALL retain the recoverable journal protocol; full HTML reset SHALL retain its state-
first `deletion_pending|complete` transaction. Plain state/status SHALL report interrupted journal,
reset, and production-mode mirror state without repair writes. Existing owning operations retain their
bounded automatic/explicit recovery rules. Production-mode mirror drift uses its separate state-owned
repair and no observation or mirror creates approval or routing authority.

#### Scenario: Metadata and HTML state disagree

- **WHEN** metadata says approved but current-version `_state` evidence is absent or stale
- **THEN** status reports the inconsistency and HTML delivery remains blocked

#### Scenario: Plain state sees recoverable mirror interruption

- **WHEN** authoritative review or production-mode state is new and its metadata mirror remains old
- **THEN** state reports the owning recovery status without writing metadata, changing routing, or removing a journal

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

### Requirement: Unsure placement triggers GREP of Where Map before inventing paths

When file placement is uncertain, the Controller SHALL search canonical tokens and consult the
run-bundle Where Map before creating a path. It SHALL respect pipeline ownership: HTML contact-sheet/
review evidence resolves under `_generated/html_production/preview/`; whole-page Image2 pilot/contact
sheet resolves under `_generated/preview/`; `style_master.jpg` is owned by the whole-page Image2 adapter
for both first-class `image2-only` and historical compatibility; version temp belongs under
`_scratch/`; progress under `_state/`; and lessons under `_lessons/`. It SHALL not create deck-root
`_tmp`/backup directories or place generated evidence under the other pipeline's owner. `checkBundle`
remains enforcement authority.

#### Scenario: HTML preview placement is resolved

- **WHEN** Agent searches `contact_sheet` or `pilot` for an HTML-mode run
- **THEN** the Where Map routes to `_generated/html_production/preview/`

#### Scenario: Legacy preview placement is preserved

- **WHEN** the same search is for a whole-page Image2 run or historical markerless compatibility deck
- **THEN** it routes to `_generated/preview/`

#### Scenario: Temporary source backup is placed narrowly

- **WHEN** Agent needs a version-scoped backup
- **THEN** it uses `3_versions/vN/_scratch/` rather than inventing a deck-root directory

### Requirement: Pilot review gates content full-page header quality before full build

Pilot review SHALL resolve production mode and verify pipeline before selecting evidence. For
first-class `image2-only` and historical whole-page compatibility, it SHALL retain content,
full-page/header quality, selected pilot IDs, provenance, and force-image review behavior. The typed
provider authorization required before an actual submit is a separate decision and SHALL not be
inferred from pilot selection, pilot success, or content/visual approval. For either HTML mode, pilot
review SHALL show the exact content projection and production-equivalent effective preview plus
forced-fallback pages when required, bind decisions to current review-plan hashes, and require neither
whole-page style-master nor header-lock review. Successful preview SHALL not itself authorize full
build; current authoritative content and visual evidence SHALL.

#### Scenario: HTML preview succeeds but is not approved

- **WHEN** compositor output is current but the user has not approved or waived both gates
- **THEN** full build remains blocked

#### Scenario: Whole-page pilot success does not authorize build submissions

- **WHEN** an `image2-only` pilot is approved and a later build batch will submit provider work
- **THEN** the controller requires a new exact build authorization at that submit boundary

### Requirement: Registered playbooks pass machine validation

Every active controller/shared node SHALL pass the canonical node-specification validator. A checked-in normative manifest SHALL bind the expected controller/shared-node inventory, globally unique IDs, exact order, pipeline ownership, lifecycle/module values, includes/requires, conditions, decisions, and Phase-4 ownership only by `image2-refine`. Validation SHALL not rely on a stale hard-coded count alone.

#### Scenario: Final controller set validates

- **WHEN** the framework indexes all active playbooks
- **THEN** the normalized graph matches the checked-in manifest with no duplicates, missing references, cycles, unknown conditions, impossible gates, or ownership conflicts

### Requirement: Playbook lifecycle and methodology metadata are explicit

Every registered node SHALL declare lifecycle Phase `0|1|2|3|4|5` and one exact final method module
`00-setup|01-content|02-visual-system|03-html-production|04-image2-refinement|05-iteration`. Phase 3
owns complete HTML delivery; Phase 4 owns only `image2-refine`, disabled for `html-only` and required by
the `html-then-image2` completion policy; Phase 5 retains whole-page Image2 implementation/maintenance
nodes and MAY be entered by the first-class `image2-only` create/iteration controller. Provider channel
probing remains Phase 0. No other controller/node may declare Phase 4 or import its private transport.

#### Scenario: HTML production node is unambiguous

- **WHEN** Agent inspects an HTML create-deck production node
- **THEN** it declares lifecycle Phase 3 and method module `03-html-production`

#### Scenario: Optional refinement node is unambiguous

- **WHEN** the controller index inspects `image2-refine`
- **THEN** it declares lifecycle 4/module `04-image2-refinement`, requires `html-then-image2`, and preserves disabled html-only work without executing it

#### Scenario: Legacy route keeps its owner

- **WHEN** the graph resolves historical markerless maintenance or first-class `image2-only` production
- **THEN** whole-page implementation nodes retain Phase 5 ownership without entering modern refinement

### Requirement: Legacy duplicate node state remains resumable

When a known duplicate node ID is renamed to a unique intent-specific ID, the state read/heal path SHALL migrate an in-progress legacy `current_node` using the active playbook as context and SHALL preserve the node's existing status and extra fields in the active execution working set. If both legacy and canonical keys exist, the canonical record wins and only missing fields are merged from the legacy record.

#### Scenario: Legacy edit-text verify-output resumes

- **WHEN** an existing state has `playbook: edit-text` and `current_node: verify-output`
- **THEN** read/heal maps it to the new text-specific verification node
- **AND** preserves its node record, active execution identity, and playbook stack

### Requirement: Resume cards use the active playbook model

When durable execution state exists, human and JSON resume cards SHALL use the canonical
mode-and-pipeline-compatible active playbook index to calculate pending nodes and eligible successors.
`waiting_for` remains highest priority; exactly one eligible successor is suggested; multiple eligible
branches remain explicit candidates. Artifact/review freshness SHALL be evaluated through the shared
mode policy before suggesting production/completion. A current complete `html-only` delivery SHALL not
gain a refinement successor; a current `html-then-image2` delivery SHALL expose required refinement;
an `image2-only` run SHALL expose only whole-page completion work. Historical markerless decks without
durable mode/state SHALL use the one-time migration/compatibility projection and SHALL not fabricate an
execution during observation.

#### Scenario: Unique current successor is suggested

- **WHEN** durable current-mode state has one eligible downstream node and no wait/freshness block
- **THEN** suggested-next names that node and later absent nodes remain pending

#### Scenario: Branch requires a decision

- **WHEN** two downstream branch nodes are eligible
- **THEN** both remain candidates and neither is auto-selected

#### Scenario: HTML evidence blocks structural eligibility

- **WHEN** HTML graph conditions appear complete but mode-owned review/delivery evidence is stale
- **THEN** suggested-next names the owning review/repair action before downstream completion

#### Scenario: Required refinement is suggested

- **WHEN** current HTML delivery belongs to `html-then-image2` and refinement is missing
- **THEN** suggested-next names the owning refinement step before completion

#### Scenario: Markerless compatibility card has no active graph

- **WHEN** a historical markerless deck lacks durable state
- **THEN** its observation identifies migration/whole-page ownership without pending-node invention or disk write

### Requirement: Restructure controller executes one previewed slide transaction

`restructure-slides.md` SHALL translate add/delete/reorder/normalize/multi-operation intent into one
shared `ppt_flow slides` transaction. Before mutation it SHALL show resolved formal IDs, snapshot-bound
`position + slide_id + title` before/after order, anticipated target version, mode/pipeline-specific
deterministic impact, and semantic-reference warnings; retain the canonical plan hash internally; wait
for explicit authorization; and apply only the same base/hash-bound plan. It SHALL not manually rewrite
canonical Markdown. Heading-only normalization remains the atomic current-version exception; stale
base/hash or selector ambiguity returns to preview.

Structural apply SHALL publish only validated source/control vNext and make no renderer/provider/
generated publication. For either HTML mode, `needs_local_materialization` leads to the explicit target-
local materializer and current target review/delivery. For `image2-only` or historical whole-page
compatibility, verified raw inputs may materialize locally while `needs_render` remains incomplete remote
work requiring separate cost/provider authorization. After visibility, same-pipeline target mode
registration SHALL complete before either materializer runs. All branches repair semantic references and
verify actual target PPTX/order/IDs/notes with the user.

#### Scenario: HTML structure apply remains source-only

- **WHEN** an authorized HTML-mode insert/reorder/delete transaction applies
- **THEN** visible vNext contains validated source/control, inherits registered mode, and reports `needs_local_materialization`
- **AND** no HTML manifest, browser, or provider is invoked during source publication

#### Scenario: HTML materialization is separately local

- **WHEN** the Agent explicitly materializes the published registered HTML target
- **THEN** verified reusable bytes become target-owned and missing/stale IDs compose locally
- **AND** the controller completes required review/delivery without remote authorization

#### Scenario: Legacy unproven render pauses before cost

- **WHEN** a historical markerless source apply reports `needs_render`
- **THEN** the source version remains published but remote material work waits for separate authorization

#### Scenario: Plan drift returns to preview

- **WHEN** base or plan hash differs at apply time
- **THEN** the controller shows a new preview and does not reinterpret original positions

#### Scenario: Image2-primary target waits for rendering authority

- **WHEN** a registered `image2-only` vNext reports unproven `needs_render`
- **THEN** source/version success remains distinct from a later exactly authorized whole-page rebuild

### Requirement: Restructure controller uses the version and deck escape ladder

`restructure-slides.md` SHALL guide the narrowest truthful scope: heading-only projection repair in the
current version; same-deck clean vNext for membership/order changes; mode/pipeline-specific explicit
materialization after target registration; and a new-deck recommendation when audience/objective/
narrative materially changes. HTML materialization is local and uses `needs_local_materialization`;
whole-page unproven raw work uses `needs_render` and separate remote-cost authorization. The Controller
SHALL not ask the user to choose technical commit/materialization strategy, but SHALL ask before remote
cost, discarding/materially changing content, or changing deck identity.

#### Scenario: Same narrative stays in vNext

- **WHEN** pages change while audience and narrative remain continuous
- **THEN** the Controller uses the same deck's Structural Versioning Path without delegating technical strategy to the user

#### Scenario: HTML vNext needs local bytes

- **WHEN** an HTML receipt reports `needs_local_materialization`
- **THEN** the Controller runs the explicit local target materializer after mode registration without provider authorization

#### Scenario: Legacy vNext needs remote bytes

- **WHEN** a historical markerless receipt reports `needs_render`
- **THEN** the Controller separates published source success from later remote-cost authorization

#### Scenario: New audience warrants a new deck

- **WHEN** the revision would make the prior deck identity misleading
- **THEN** the Controller explains and asks the product decision before creating a new deck

#### Scenario: Image2-primary vNext needs remote bytes

- **WHEN** a first-class whole-page receipt reports `needs_render`
- **THEN** the Controller keeps source publication, mode registration, and chargeable rendering as separate checkpoints

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

### Requirement: HTML recovery overrides are explicitly human-confirmed and narrowly scoped

When plain state/status reports a cross-host/uncertain gate journal, the Controller SHALL explain that another process or machine may still own the transaction, retain the opaque owner token internally, and ask the human to confirm that no other deck process is active before invoking `state --recover-gate-journal <token>`. The human SHALL not need to type/read the token. Decline or uncertainty SHALL make zero writes. Successful recovery SHALL be described only as transaction repair, never new content/visual approval.

When a canonical HTML publication lock cannot be automatically reclaimed, the Controller SHALL first ensure the gate journal is absent/resolved, identify the exact target run and consequence that all canonical HTML generated review/delivery evidence will be rebuilt, and obtain explicit confirmation that no canonical writer/reader must be preserved. It SHALL then invoke only `ppt_flow refresh <run-dir> --kind reset-html-production --confirm-run-version <vN>` and consume its producer-owned `started|resumed|already-complete` result; it SHALL not delete generated paths, edit reset state/mirrors, or invent a reset ID itself. After successful reset it SHALL run a clean local canonical rebuild, show new reset-bound content/visual plans and delivery artifacts, and obtain new decisions even when all raw bytes/fingerprints are identical. When the conflict is confined to a migration-preview owner, it SHALL first resolve/clear any migration apply journal through its own matrix, then explain that the whole current migration scratch transaction/candidate/comparison/plan will be discarded, obtain confirmation that no migration writer/reader must be preserved, and delete only that source run's `_scratch/html-migration/` before starting a new preview. It SHALL not delete a single lock, cherry-pick objects, mix the two recovery scopes, touch canonical source/control/legacy generated owners, hand-edit state, or imply prior canonical gate/final-review evidence remains current after canonical reset.

If state/status already reports `html-production-reset: deletion-pending`, the Controller SHALL first resolve any concurrently surviving gate journal through its own matrix, then follow the reset's bounded ownership classification rather than start a second deletion: `active` waits for the live owner, `waiting` reports the remaining age floor, `recoverable` may rerun the exact-version command for automatic same-host takeover, `uncertain` requires the 300000-ms floor plus explicit confirmation that no reset process/machine remains active before rerun, and `invalid` fails closed to state repair. It SHALL never ask the human to transcribe reset/owner IDs, never override a proven-live owner, and never claim that a pending reset has rebuilt artifacts.

#### Scenario: User declines journal recovery

- **WHEN** the Controller cannot prove a cross-host owner stopped and the user declines confirmation
- **THEN** it leaves journal/state/metadata unchanged and remains blocked

#### Scenario: Agent carries owner token

- **WHEN** the user confirms no other deck process is active
- **THEN** the Agent supplies the exact status token to the closed recovery flag without asking the user to transcribe it

#### Scenario: Full generated reset is confirmed

- **WHEN** an uncertain publication lock persists, no gate journal exists, and the user accepts full HTML evidence rebuild
- **THEN** the Controller calls the closed reset command with the exact run version before a clean local rebuild
- **AND** the state-owned reset epoch makes prior HTML gates/delivery review stale until new evidence is reviewed

#### Scenario: Full generated reset stops after invalidation

- **WHEN** the reset command reports a retained `deletion_pending` fence after deletion failure
- **THEN** the Controller reports the exact retry action and does not start rendering, approval, delivery review, or manual cleanup

#### Scenario: Another reset owner is still live

- **WHEN** status classifies a pending canonical reset owner as `active`
- **THEN** the Controller waits/reports ownership and does not invoke another reset or delete generated paths

#### Scenario: Cross-host reset takeover is confirmed

- **WHEN** a valid pending reset is `uncertain`, at least 300000 ms old, and the human confirms no reset process remains active
- **THEN** the Controller invokes the same exact-version reset command and lets the module claim/resume the existing reset ID

#### Scenario: Migration scratch reset is confirmed

- **WHEN** an uncertain migration-preview lock persists and the user accepts abandoning that transaction
- **THEN** only the owning `_scratch/html-migration/` transaction is deleted before candidate/preview reconstruction
- **AND** canonical production/state/reviews are not changed

### Requirement: HTML content and visual review are human gates over exact evidence

The MD Controller SHALL show the exact ordered content projection before content approval and hash-bound representative or affected-page preview artifacts before visual approval. It SHALL force fallback composition for a page-local fallback review even when a selected asset is current, report which family/geometry/assets were reviewed, and never infer approval from successful rendering. JS SHALL reject stale reset IDs, content fingerprints, plan hashes, or bytes; after full canonical reset the Controller SHALL show the rebuilt reset-bound plan rather than reuse a remembered pre-reset hash.

#### Scenario: Preview changed before approval

- **WHEN** source/config/renderer/asset evidence changes after the user viewed a preview
- **THEN** approval fails as stale and the Controller shows a new current preview

### Requirement: HTML final review is bound to current delivery evidence

Every HTML controller that can publish a new contact sheet/PPTX/notes SHALL finish through current
`html-delivery-review`. The Controller SHALL show current delivery artifacts, record exact typed
decision `proceed|repair|redirect`, require and persist a concise reason for repair/redirect or forced
proceed, and route the decision before completion. JS SHALL bind/validate the decision against current
nullable HTML-production reset ID, HTML delivery digest, every reviewable artifact actually present,
and every lineage receipt required by the selected decision mode. Conversation memory, a pre-reset
decision, or a prior execution's node completion SHALL not substitute for current evidence. Markerless
legacy final-review behavior remains under its existing controller/state semantics.

After obtaining the decision, the Controller SHALL invoke `ppt_flow state <run-dir>
--record-delivery-review <decision>`. It SHALL add `--reason <text>` only for repair/redirect, except
that an explicit evidence-risk continuation uses `proceed --force --reason <text>`. Normal proceed
and `repair|redirect` require complete current delivery evidence. Forced proceed requires current reviewable target-version
PPTX/contact-sheet bytes and records missing/stale lineage as an evidence waiver; absent reviewable
artifacts or unsafe identity remains a hard stop. The one public call SHALL atomically record system
evidence and the current final-review node decision. The Controller SHALL not call `setNodeDecision`
again, hand-edit state, call the JS module through ad hoc code, or pass digest/SHA/path arguments.

Repair reason SHALL enter shared pipeline-first classification and its owning repair node. Create-deck
redirect SHALL reset to `checkpoint-intake` and downstream current-execution records; iteration redirect
SHALL ask for exact target
`edit-text|edit-visual|edit-notes|restructure-slides|create-deck|stop` before switching. `stop` persists
`waiting_for: user:resume-or-replace`; HTML redirect SHALL reject legacy maintenance. A conflict/stale
result SHALL return to current status/artifact presentation rather than record the conversation alone.

#### Scenario: Local notes refresh completes technically

- **WHEN** Stage 5 publishes current notes after an HTML notes edit
- **THEN** the edit controller still shows the current result and records a new evidence-bound delivery decision before completion

#### Scenario: Prior execution said proceed

- **WHEN** a new HTML delivery digest differs from the prior reviewed digest
- **THEN** the prior decision cannot complete the current controller

#### Scenario: Controller persists proceed through public state route

- **WHEN** the user accepts the current shown delivery
- **THEN** the Controller calls the closed state evidence operation with normal or explicitly forced `proceed`
- **AND** completion relies on the resulting evidence-referenced node decision, not chat memory or a second write

#### Scenario: Forced proceed lacks reviewable artifacts

- **WHEN** the user requests forced proceed but current target PPTX/contact-sheet bytes cannot be shown
- **THEN** the Controller explains the protected review-identity invariant and recommends rebuilding artifacts
- **AND** it does not offer state editing as a continuation

#### Scenario: Redirect does not guess a controller

- **WHEN** the user rejects current delivery and asks to take a different direction
- **THEN** the Controller records redirect plus reason, remains incomplete, and follows create-deck re-intake or the exact iteration target prompt
- **AND** it does not infer or switch controller solely from prose

### Requirement: Legacy migration is a separate human-confirmed controller path

`migrate-import` or its explicit migration branch SHALL require Agent-authored structured candidate controls, render the complete proposed HTML deck, present source implications/proposed contact sheet/exact old-side mode, and obtain exact-plan/mode confirmation before publish. It SHALL show old pixels only from verified current legacy evidence; missing/stale evidence SHALL use the exact degraded mode with diagnosis/placeholder and no parity claim while optionally offering separate maintenance. Decline SHALL leave the legacy version/controller usable. Apply crash recovery SHALL never bless partial staging: it either cleans exact owned hidden paths and fully rerenders or verifies an already published exact target and completes idempotently. After exact apply/recovery success, the Controller SHALL consume the in-target success receipt and use one normal atomic state transition to complete the source migration execution and start target HTML node `migration-target-review`; that node obtains target-version content/visual gates before Stage 4/5/final review. If target publication succeeded but the state transition did not, resume SHALL follow non-writing `migration_handoff_pending` and perform the same handoff, not restart migration or copy approval. Migration, recovery, and handoff make zero provider calls.

#### Scenario: User declines migrated comparison

- **WHEN** the user is not satisfied with the proposed HTML deck
- **THEN** no new version becomes visible
- **AND** legacy maintenance remains available

#### Scenario: Target published but handoff write crashed

- **WHEN** resume sees the exact target receipt and source migration execution without handoff
- **THEN** it records the one atomic source-complete/target-continuation transition
- **AND** target reviews remain pending

### Requirement: Migrate-import owns cross-pipeline production-mode handoff

`migrate-import` SHALL own the mode-transition branch for both Image2-to-HTML and HTML-to-Image2
requests.  It SHALL inspect exact source mode/pipeline, invoke the closed prepare/preview operations,
show the source/target/version impact and exact plan hash, obtain the human mode confirmation, and invoke
apply only for that same checkpoint.  It SHALL not ask the user to reconstruct deterministic scaffolding,
infer target source, or treat a conversation decision as confirmation evidence.

The controller SHALL declare a distinct `apply-production-mode-transition` node for the state-owned
post-confirmation branch. Its declaration SHALL have no legacy `requires` edge and shall be enterable only
through a new closed `transition_apply_current` entry condition: the active execution must be the exact
source-run-bound transition execution with a valid state-owned transition plan/confirmation record. Its
exit SHALL be only `transition_publish_or_recovery_recorded`, the corresponding closed catalog condition.
That exit is a transition state-owner finalization guard, not a generic node-completion signal: only an
atomic completed target registration/baseline handoff or a no-target source restoration is terminal. It
SHALL not reuse `apply-html-migration` or any legacy migration field, and the legacy branch cannot satisfy
this entry or exit. The node's CLI step invokes only the exact closed state
apply/recovery-confirmation/recover forms; its recovery disclosure follows the producer's
same-host/cross-host ownership and age result, obtaining an explicit no-active-apply human confirmation
only for an old-enough uncertain journal through the closed confirmation form. A visible target receipt
routes directly to the state-owned registration/handoff recovery and never asks for journal takeover or
source reconstruction. A recoverable hard-stop, incomplete publication, or registration-pending receipt
keeps this node `in_progress`; generic controller advancement cannot complete it.

The retained `intake-migration` through `migration-target-review` legacy-to-HTML nodes remain a bounded
compatibility path, not a second production-mode-transition branch.  Once mode state is durable, they may
finish only an exact active legacy confirmation/apply/recovery/receipt-handoff checkpoint; they SHALL not
start or refresh legacy preparation/preview.  Controller guidance for any other cross-pipeline request
names the general transition node and retains the legacy checkpoint's source/version/hash/execution
bindings rather than repurposing them as transition authority.

On decline before confirmation, stale plan, or conflict, the source controller/current node remains
intact and the Controller follows the producer's nearest recovery action.  Confirmation alone captures
the source execution into the state-owned non-resumable transition suspension; a failed apply retains that
bounded checkpoint until recovery either restores the exact source (no visible target) or completes the
verified target handoff.  On verified target registration, state starts a new `create-deck` execution at
the first normal target node for the target mode: `preview-content` for HTML, or
`authorize-image2-style-master` for Image2. Before that entry it records only fresh target-owned,
receipt-bound baseline execution facts after each original prerequisite exit has revalidated: target
run-bundle/guide for instantiation; an explicit plan-hashed target intake and its newly persisted user
`proceed`/`intake-confirmed` record; then target source and visual-control validation for the selected
author/configuration nodes. It never invokes `init`, copies a source node record, marks a source node
skipped or complete, or copies source review/authorization. The baseline is limited to target
source/control acceptance and does not create target review, delivery, authorization, or completion
authority. HTML target progress uses the existing HTML workflow without a new visual-quality decision;
Image2 target progress uses the normal first-class Image2 review and authorization workflow.

#### Scenario: User changes from Image2 to HTML

- **WHEN** the user selects `html-only` or `html-then-image2` for a current Image2 version
- **THEN** the controller shows the exact clean-vNext transition plan and selected target mode before confirmation
- **AND** it does not route the source through an in-place state edit

#### Scenario: User changes from HTML to Image2

- **WHEN** the user selects `image2-only` for a current HTML version
- **THEN** the controller obtains explicit whole-page target authoring and later enters normal Image2 production after publication
- **AND** it does not require or infer an HTML-quality verdict during the transition

#### Scenario: Source execution is incomplete

- **WHEN** a source controller has incomplete work when a cross-pipeline request begins
- **THEN** transition preparation preserves that execution and applies no replacement until the declared target handoff succeeds

#### Scenario: Registered target starts clean controller work

- **WHEN** a transition target has a verified marker, receipt, and mode registration
- **THEN** Controller starts the target at `create-deck/preview-content` for HTML or `create-deck/authorize-image2-style-master` for Image2 without rerunning init
- **AND** its prerequisite baseline is newly bound to target source/control and receipt facts
- **AND** its completed intake node contains the target's new intake-confirmed user evidence rather than source evidence
- **AND** review, delivery, provider authorization, and final-completion nodes remain pending

#### Scenario: Legacy migration remains completion-only after mode upgrade

- **WHEN** an upgraded markerless source has an exact active legacy migration confirmation or apply checkpoint
- **THEN** the Controller presents only its matching confirmation, apply/recovery, or receipt-bound handoff action
- **AND** it routes a new candidate/preview request to the general versioned transition branch
