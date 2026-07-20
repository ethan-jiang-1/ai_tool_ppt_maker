## Purpose

Define how MD Controller playbooks under `PPTMAKER_FRAMEWORK/playbook/` drive an agent through a deck lifecycle: registered controller inventory is owned by the normative controller manifest, while playbooks provide intent routing, ownership-aware refresh paths, state initialization, gates, and shared-node reuse. Execution state lives in `_state/state.yaml` beside static project metadata.
## Requirements
### Requirement: playbook/ directory contains the registered MD controllers

`PPTMAKER_FRAMEWORK/playbook/` SHALL contain ten active ordered MD Controllers—`create-deck.md`, `edit-text.md`, `edit-visual.md`, `edit-notes.md`, `restructure-slides.md`, `iterate-style.md`, `quick-preview.md`, `migrate-import.md`, `probe-image-channels.md`, and `legacy-image2-maintenance.md`—plus shared node `classify-change.md`. `legacy-image2-maintenance` SHALL serve only markerless decks and SHALL use lifecycle Phase 5/module `05-iteration`; `probe-image-channels` remains an off-path Phase-0 diagnostic switch. Change 3 SHALL NOT register `image2-refine` or any modern Phase-4 controller/node.

#### Scenario: Agent lists available controllers

- **WHEN** the playbook index is built
- **THEN** it contains the ten ordered controllers and one shared classifier
- **AND** includes legacy maintenance and provider probing but no modern refinement controller

#### Scenario: HTML deck selects legacy controller

- **WHEN** an HTML-first run attempts to enter `legacy-image2-maintenance`
- **THEN** entry validation fails with a pipeline-ownership diagnostic

### Requirement: create-deck playbook covers complete deck creation

`create-deck.md` SHALL define a complete HTML-first workflow from init/intake through structured content, local visual-system preview, content/visual human gates, production, evidence-bound final review, readiness, and completion. Its production node SHALL publish current HTML pages/final slides/contact sheet/PPTX/notes without Image2 prerequisites. Before `checkpoint-final-review` records `proceed|repair|redirect`, the Controller SHALL show current contact sheet plus PPTX/notes result and JS SHALL bind the decision to current version-scoped `html-delivery-review` evidence. The playbook SHALL complete only on current `proceed` and SHALL not leave an optional/unavailable Phase-4 node pending. Repair/rerun decisions SHALL return to the owning content, visual-system, or production node rather than a prompt/style-master stage.

#### Scenario: User says "帮我做一个PPT"

- **WHEN** COMMANDS routes a fresh request to `create-deck`
- **THEN** execution begins at instantiation and follows the HTML-complete path
- **AND** can reach completed with no provider credentials or style master

#### Scenario: User finishes after delivery

- **WHEN** final review accepts current PPTX/notes
- **THEN** the create execution completes with no pending Image2 node, plan, or authorization

#### Scenario: Delivery changes after final review

- **WHEN** contact sheet, assembly, PPTX, or notes evidence changes after `proceed`
- **THEN** the prior decision is stale and completion returns to current final review

### Requirement: Iteration playbooks resolve semantic paths

`edit-text`, `edit-visual`, `edit-notes`, and `restructure-slides` SHALL begin with shared pipeline-first classification and end with intent-specific verification. For HTML-first runs, visible copy/body/family/fallback edits SHALL use Local Slide Rebuild; visual-config changes SHALL use Local Deck Rebuild with representative preview; notes-only changes SHALL use Stage 5; structure changes SHALL use preview/hash-bound clean vNext and target-local rebuild. These paths SHALL not use render mode, style master, provider adapters, or remote authorization.

For markerless runs, compatible controllers SHALL switch to `legacy-image2-maintenance` or retain existing legacy refresh semantics. Structural Versioning Path remains outer to both branches and SHALL not be presented as a fourth peer refresh.

#### Scenario: HTML title or body edit

- **WHEN** one HTML-first slide's visible content changes
- **THEN** the controller invokes local slide rebuild and verifies current pixels/delivery

#### Scenario: HTML visual-system edit

- **WHEN** global renderer-neutral visual config changes
- **THEN** the controller shows representative production-compositor output before local deck rebuild

#### Scenario: Notes-only edit

- **WHEN** only speaker notes change and assembly lineage is current
- **THEN** the controller runs Notes-Only Refresh without recomposition

#### Scenario: Markerless visual rebuild

- **WHEN** a legacy deck needs whole-page regeneration
- **THEN** the controller switches to legacy maintenance with existing force/review/prerequisite behavior

### Requirement: COMMANDS.md is a routing table

`PPTMAKER_FRAMEWORK/COMMANDS.md` SHALL remain the natural-language-to-controller routing table with examples, target controller, entry parameters, and sections for exploration/preview, migration/import, optional Image2 channel diagnosis, resume, and post-delivery iteration. Every deck-scoped route SHALL classify the canonical pipeline before controller branch semantics. HTML visual-direction/preview intent SHALL enter the local renderer-neutral `iterate-style`/`quick-preview` behavior; an explicit legacy style-master phrase SHALL not create a style master for an HTML deck. Markerless visual/style intent may enter legacy maintenance. Image-channel symptom/direct-probe examples SHALL route to `probe-image-channels` only for an Image2-dependent legacy action and SHALL not diagnose local HTML rendering as a provider problem.

Resume examples SHALL run state/status first. Durable state resumes its active compatible controller/current node after reporting whole-workflow position; a historical markerless deck without state receives the read-only legacy-maintenance projection and initializes execution only after the user continues; a complete HTML run is not restarted or assigned Phase-4 debt. Migration/import SHALL route through `migrate-import` and retain its show/hash/mode gates.

#### Scenario: Fresh HTML user asks for visual exploration

- **WHEN** an HTML-first user asks to try several visual directions
- **THEN** COMMANDS routes to local renderer-neutral exploration/preview
- **AND** does not require a style master or provider channel

#### Scenario: Legacy user asks to iterate style master

- **WHEN** a markerless deck user explicitly asks to refine its style master
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

### Requirement: Existing-deck sessions start with whole-workflow resume ritual

Existing-deck sessions SHALL still run `ppt_flow state` and `ppt_flow status`, inspect pointer/wait/artifact/gate evidence, explain whole-workflow position, load the resolved controller/current node, check entry, and confirm continuation before replacing incomplete work. State heal SHALL first classify the source pipeline and migrate known old controller/node/module references to the new HTML or legacy ownership. Conversation context SHALL not override state. If mapping is ambiguous, the resume card SHALL require a human choice of replacement/restart and SHALL preserve the original state until that choice is recorded.

#### Scenario: Old markerless execution resumes after directory migration

- **WHEN** a legacy state points to an old create/production node
- **THEN** heal maps it to the declared legacy-maintenance continuation with preserved evidence/wait
- **AND** the Agent does not restart greenfield HTML intake

#### Scenario: HTML-marked execution resumes locally

- **WHEN** an HTML-first deck has an old but unambiguous controller pointer
- **THEN** heal maps it to the corresponding final Phase/module node and continues locally

#### Scenario: In-progress replacement remains human-owned

- **WHEN** the old topology has no one-to-one semantic mapping
- **THEN** no state is cleared or guessed
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

No node SHALL transition to completed until its exit conditions are met. Human content/visual decisions SHALL remain pending until explicit approval or waiver; waiver SHALL include a reason. For HTML-first runs, the Controller SHALL present the exact ordered content projection before content approval and production-equivalent representative/affected-page artifacts before visual approval. JS SHALL require current version-scoped `html-content-review` and `html-visual-review` evidence for Stage 4; metadata mirrors alone SHALL not satisfy the gates. HTML preview composition MAY run while gates are pending and SHALL not waive them. For markerless legacy, existing style-master/pilot/header artifact presentation, metadata readiness, and preview-versus-production semantics SHALL remain compatible. No branch's evidence SHALL satisfy the other branch.

#### Scenario: HTML preview is available before approval

- **WHEN** HTML gates are pending but source/runtime checks pass
- **THEN** the Controller may show current preview artifacts
- **AND** cannot complete delivery or infer approval from successful rendering

#### Scenario: HTML content changes after review

- **WHEN** the ordered reviewed content fingerprint changes
- **THEN** the content gate becomes stale and its owning node cannot complete

#### Scenario: Legacy preview remains compatible

- **WHEN** a markerless deck has a style master and pending gates
- **THEN** pilot preview may run without waiving gates

### Requirement: Explore playbooks cover pre-commitment style and pilot preview

Pre-commitment exploration SHALL remain conversation-only and write-free until the user authorizes a deck/change path. For HTML-first creation, quick preview SHALL route to structured content plus local production-equivalent HTML preview, require no style master/provider credentials, and show content/visual artifacts before the matching human decisions. For markerless legacy maintenance, existing style exploration and pilot preview semantics SHALL remain available only through the legacy branch. Explore controllers SHALL not advertise executable modern Image2 refinement during Change 3.

#### Scenario: Fresh user requests a quick visual sample

- **WHEN** the new deck uses the HTML-first default
- **THEN** quick preview produces local HTML compositor evidence
- **AND** does not create style-master or Image2 authority

### Requirement: Migrate-import playbook guards off-path UX

`migrate-import` SHALL distinguish import normalization, ordinary structural versioning, and explicit legacy-to-HTML migration before writes. HTML migration SHALL require a complete Agent-authored structured candidate, a complete proposed HTML deck/contact sheet, exact plan hash/old-side mode, and human confirmation. The old side SHALL use only current verified legacy evidence in `verified-current`; missing/stale evidence SHALL deterministically use `degraded-missing|degraded-stale` with diagnosis/placeholder, no old pixels/provider call/parity claim, and an optional separately authorized legacy-maintenance next action. The controller SHALL not infer structured bodies from prompts, mutate the legacy version, carry authorization, or treat ordinary structural publication as a migration renderer. If apply reports a cross-host/uncertain migration journal, the Controller SHALL explain the exact target/staging risk, obtain confirmation that no migration apply is active, retain the opaque token internally, and invoke only `apply --recover-journal <token>` after the 300000-ms floor; a decline makes zero writes. Same-host proven-active ownership is never overridden.

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

Every long-running production/diagnostic node SHALL use registered CLI progress as the user-visible wait contract. HTML render/composition/build nodes SHALL report bounded phase plus slide `i/N` progress without exposing source prose/HTML/paths; markerless style-master/pilot/Stage-2 nodes SHALL retain submit/poll heartbeat, `i/N`, and attempts-summary behavior; `probe-image-channels` SHALL retain `probing i/N`. When expected duration exceeds the foreground tool budget, the Controller SHALL use background/equivalent execution, periodically read progress, and relay meaningful updates. Prolonged silence is a diagnostic signal. On non-zero exit the Controller SHALL surface the final normalized envelope, not say only to keep waiting. No path SHALL invent a daemon or durable in-flight task state.

#### Scenario: HTML deck composition is observable

- **WHEN** a multi-slide local composition exceeds the foreground budget
- **THEN** the Controller relays bounded render/compose slide progress until completion or failure
- **AND** does not route the delay to provider/channel diagnosis

#### Scenario: Legacy pilot remains observable

- **WHEN** markerless pilot generation takes minutes
- **THEN** the Controller relays existing provider heartbeats and slide progress through background/equivalent execution

#### Scenario: Failure is not covered by a wait message

- **WHEN** either branch exits non-zero
- **THEN** the Controller surfaces the producer-owned final diagnostic and owning repair path

### Requirement: Shared nodes are referenced via includes

A playbook SHALL be able to reference a shared node via `includes: [<node-name>]` in its frontmatter. The referenced node SHALL be defined in a standalone `.md` file with `shared: true` in its frontmatter. Multiple playbooks SHALL be able to include the same shared node.

#### Scenario: classify-change shared by edit-text and edit-visual

- **WHEN** `edit-text.md` and `edit-visual.md` both need change classification
- **THEN** both declare `includes: [classify-change]` in their frontmatter
- **AND** `classify-change.md` exists as a standalone shared node with `shared: true`

### Requirement: State file coexists with project-metadata.yaml

`_state/state.yaml` SHALL continue to own playbook executions, nodes, decisions, waits, gates, and the version-scoped HTML production reset transaction while `project-metadata.yaml` owns durable project configuration/status fields. For markerless legacy, existing `content_gate|visual_gate` and `_state.gates.content|visual` mirroring/readiness behavior SHALL remain. For HTML-first, version-scoped content/visual review records in `_state` SHALL be authoritative; only disjoint `html_content_gate|html_visual_gate` plus run-version metadata fields and `_state.gates.html_*` fields are compatibility/status mirrors. HTML publication SHALL never overwrite legacy mirrors. Gate dual-write SHALL use the recoverable journal protocol; full canonical reset SHALL use its state-first `deletion_pending|complete` transaction and never a caller-managed delete sequence. Plain state/status SHALL only report interrupted journal/reset state; build/check-gates/gate publication may perform tokenless same-host-dead gate-journal recovery but SHALL not complete a reset, and cross-host/uncertain journal repair requires the explicit human-confirmed token route. No observation or mirror alone creates approval.

#### Scenario: Metadata and HTML state disagree

- **WHEN** metadata says approved but current-version `_state` evidence is absent or stale
- **THEN** status reports the inconsistency and HTML delivery remains blocked

#### Scenario: Plain state sees recoverable mirror interruption

- **WHEN** authoritative HTML state is new and HTML metadata mirror remains old
- **THEN** state reports the recovery status without writing metadata or removing the journal

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

When file placement is uncertain, the Controller SHALL search canonical tokens and consult the run-bundle Where Map before creating a path. It SHALL respect pipeline ownership: HTML contact-sheet/review evidence resolves under `_generated/html_production/preview/`; markerless pilot/contact sheet remains `_generated/preview/`; `style_master.jpg` is legacy-only; version temp belongs under `_scratch/`; progress under `_state/`; lessons under `_lessons/`. It SHALL not create deck-root `_tmp`/backup directories or place generated evidence under the other pipeline's owner. `checkBundle` remains enforcement authority.

#### Scenario: HTML preview placement is resolved

- **WHEN** Agent searches `contact_sheet` or `pilot` for an HTML-first run
- **THEN** the Where Map routes to `_generated/html_production/preview/`

#### Scenario: Legacy preview placement is preserved

- **WHEN** the same search is for a markerless run
- **THEN** it routes to legacy `_generated/preview/`

#### Scenario: Temporary source backup is placed narrowly

- **WHEN** Agent needs a version-scoped backup
- **THEN** it uses `3_versions/vN/_scratch/` rather than inventing a deck-root directory

### Requirement: Pilot review gates content full-page header quality before full build

Pilot review SHALL classify the pipeline before selecting evidence. For markerless legacy, it SHALL retain content, full-page/header quality, selected pilot IDs, provenance, and force-image review behavior. For HTML-first, it SHALL show the exact content projection and production-equivalent effective preview plus forced-fallback pages when required, bind decisions to current review-plan hashes, and require neither style-master nor header-lock review. Successful preview SHALL not itself authorize full build; current authoritative content and visual evidence SHALL.

#### Scenario: HTML preview succeeds but is not approved

- **WHEN** compositor output is current but the user has not approved or waived both gates
- **THEN** full build remains blocked

### Requirement: Registered playbooks pass machine validation

Every active controller/shared node SHALL pass the canonical node-specification validator. A checked-in normative manifest SHALL bind the expected controller/shared-node inventory, globally unique IDs, exact order, pipeline ownership, lifecycle/module values, includes/requires, conditions, decisions, and absence of Phase-4 execution. Validation SHALL not rely on a stale hard-coded count alone.

#### Scenario: Final controller set validates

- **WHEN** the framework indexes all active playbooks
- **THEN** the normalized graph matches the checked-in manifest with no duplicates, missing references, cycles, unknown conditions, impossible gates, or ownership conflicts

### Requirement: Playbook lifecycle and methodology metadata are explicit

Every registered node SHALL declare lifecycle Phase `0|1|2|3|4|5` and one exact final method module `00-setup|01-content|02-visual-system|03-html-production|04-image2-refinement|05-iteration`. Phase 3 nodes own complete HTML delivery. Change 3's active index SHALL contain no lifecycle-4 or module-`04-image2-refinement` executable node. Legacy whole-page maintenance SHALL be Phase 5/module `05-iteration`, and provider channel probing SHALL remain Phase 0/module `00-setup`.

#### Scenario: HTML production node is unambiguous

- **WHEN** Agent inspects the create-deck production node
- **THEN** it declares lifecycle Phase 3 and method module `03-html-production`

#### Scenario: Unavailable Phase 4 is registered accidentally

- **WHEN** a Change-3 active node declares lifecycle 4 or module `04-image2-refinement`
- **THEN** playbook validation fails

### Requirement: Legacy duplicate node state remains resumable

When a known duplicate node ID is renamed to a unique intent-specific ID, the state read/heal path SHALL migrate an in-progress legacy `current_node` using the active playbook as context and SHALL preserve the node's existing status and extra fields in the active execution working set. If both legacy and canonical keys exist, the canonical record wins and only missing fields are merged from the legacy record.

#### Scenario: Legacy edit-text verify-output resumes

- **WHEN** an existing state has `playbook: edit-text` and `current_node: verify-output`
- **THEN** read/heal maps it to the new text-specific verification node
- **AND** preserves its node record, active execution identity, and playbook stack

### Requirement: Resume cards use the active playbook model

When durable execution state exists, human and JSON resume cards SHALL use the canonical pipeline-compatible active playbook index to calculate pending nodes and eligible successors. `waiting_for` remains highest priority; exactly one eligible successor is suggested; multiple eligible branches remain explicit candidates. HTML artifact/review freshness SHALL be evaluated before suggesting a downstream production/completion node, and a current complete HTML delivery SHALL not gain a synthetic Phase-4 successor. For a historical markerless deck without durable state, state/status SHALL use the read-only legacy compatibility projection and SHALL not run active-node calculation or fabricate an execution; explicit legacy controller entry initializes state and then uses the canonical index.

#### Scenario: Unique current successor is suggested

- **WHEN** durable current-pipeline state has one eligible downstream node and no wait/freshness block
- **THEN** suggested-next names that node and later absent nodes remain pending

#### Scenario: Branch requires a decision

- **WHEN** two downstream branch nodes are eligible
- **THEN** both remain candidates and neither is auto-selected

#### Scenario: HTML evidence blocks structural eligibility

- **WHEN** graph conditions appear complete but current HTML review/delivery evidence is stale
- **THEN** suggested-next names the owning review/repair action before a downstream completion node

#### Scenario: Markerless compatibility card has no active graph

- **WHEN** a historical markerless deck lacks state
- **THEN** its resume card identifies legacy-maintenance ownership without pending-node invention or disk write

### Requirement: Restructure controller executes one previewed slide transaction

`restructure-slides.md` SHALL translate add/delete/reorder/normalize/multi-operation intent into one shared `ppt_flow slides` transaction. Before mutation it SHALL show resolved formal IDs, snapshot-bound `position + slide_id + title` before/after order, anticipated target version, pipeline-specific deterministic impact, and semantic-reference warnings; retain the canonical plan hash internally; wait for explicit authorization; and apply only the same base/hash-bound plan. It SHALL not manually split/reorder/renumber canonical Markdown. Heading-only normalization remains the documented atomic current-version exception; stale base/hash or selector ambiguity returns to preview.

Structural apply SHALL publish only validated source/control vNext and make no renderer/provider/generated publication. For HTML-first, the receipt's `needs_local_materialization` SHALL lead to a separate explicit target-local materializer that reuses only revalidated target-owned immutable bytes or locally composes missing/stale IDs, then completes current review/delivery. For markerless legacy, verified raw inputs may be materialized locally while `needs_render` remains incomplete remote work requiring separate cost authorization. Both branches SHALL semantically repair reported prose references and finish by verifying actual target PPTX/order/IDs/notes with the user.

#### Scenario: HTML structure apply remains source-only

- **WHEN** an authorized HTML-first insert/reorder/delete transaction applies
- **THEN** visible vNext contains validated source/control and reports `needs_local_materialization`
- **AND** no HTML manifest, browser, or provider is invoked during source publication

#### Scenario: HTML materialization is separately local

- **WHEN** the Agent explicitly materializes the published HTML target
- **THEN** verified reusable bytes become target-owned and missing/stale IDs compose locally
- **AND** the controller completes required review/delivery without remote authorization

#### Scenario: Legacy unproven render pauses before cost

- **WHEN** a markerless source apply reports `needs_render`
- **THEN** the source version remains published but remote material work waits for separate authorization

#### Scenario: Plan drift returns to preview

- **WHEN** base or plan hash differs at apply time
- **THEN** the controller shows a new preview and does not reinterpret original positions

### Requirement: Restructure controller uses the version and deck escape ladder

`restructure-slides.md` SHALL guide the narrowest truthful scope: heading-only projection repair in the current version; same-deck clean vNext for membership/order changes; pipeline-specific explicit materialization in vNext; and a new-deck recommendation when audience/objective/narrative materially changes. HTML materialization is local and uses `needs_local_materialization`; markerless unproven raw work uses `needs_render` and separate remote-cost authorization. The Controller SHALL not ask the user to choose technical commit/materialization strategy, but SHALL ask before material remote cost, discarding/materially changing content, or changing deck identity.

#### Scenario: Same narrative stays in vNext

- **WHEN** pages change while audience and narrative remain continuous
- **THEN** the Controller uses the same deck's Structural Versioning Path without delegating technical strategy to the user

#### Scenario: HTML vNext needs local bytes

- **WHEN** an HTML receipt reports `needs_local_materialization`
- **THEN** the Controller runs the explicit local target materializer without asking for provider authorization

#### Scenario: Legacy vNext needs remote bytes

- **WHEN** a markerless receipt reports `needs_render`
- **THEN** the Controller separates published source success from later remote-cost authorization

#### Scenario: New audience warrants a new deck

- **WHEN** the revision would make the prior deck identity misleading
- **THEN** the Controller explains and asks the product decision before creating a new deck

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

Every HTML controller that can publish a new contact sheet/PPTX/notes SHALL finish through current `html-delivery-review`. The Controller SHALL show current delivery artifacts, record exact typed decision `proceed|repair|redirect`, require and persist a concise reason for repair/redirect, and route them before completion. JS SHALL bind/validate the decision against current nullable HTML-production reset ID, HTML delivery digest, contact-sheet SHA, assembly-v2/PPTX SHA, and notes-v3 receipt/PPTX SHA. Conversation memory, a pre-reset decision, or a prior execution's node completion SHALL not substitute for current evidence. Markerless legacy final-review behavior remains under its existing controller/state semantics.

After obtaining the decision, the Controller SHALL invoke `ppt_flow state <run-dir> --record-delivery-review <decision>` plus `--reason <text>` only for repair/redirect and consume its producer-owned result. That one call SHALL atomically record system evidence and the current final-review node decision; the Controller SHALL not call `setNodeDecision` again, hand-edit state, call the JS module through ad-hoc code, or pass digest/SHA/path arguments. Repair reason SHALL enter shared pipeline-first classification and its owning repair node. Create-deck redirect SHALL reset to `checkpoint-intake` and downstream current-execution records; iteration redirect SHALL ask for exact target `edit-text|edit-visual|edit-notes|restructure-slides|create-deck|stop` before switching. `stop` persists `waiting_for: user:resume-or-replace`; HTML redirect SHALL reject legacy maintenance. A conflict/stale result SHALL return to current status/artifact presentation rather than record the conversation alone.

#### Scenario: Local notes refresh completes technically

- **WHEN** Stage 5 publishes current notes after an HTML notes edit
- **THEN** the edit controller still shows the current result and records a new evidence-bound delivery decision before completion

#### Scenario: Prior execution said proceed

- **WHEN** a new HTML delivery digest differs from the prior reviewed digest
- **THEN** the prior decision cannot complete the current controller

#### Scenario: Controller persists proceed through public state route

- **WHEN** the user accepts the current shown delivery
- **THEN** the Controller calls the closed state evidence operation with `proceed`
- **AND** completion relies on the resulting evidence-referenced node decision, not chat memory or a second write

#### Scenario: Redirect does not guess a controller

- **WHEN** the user rejects current delivery and asks to take a different direction
- **THEN** the Controller records redirect plus reason, remains incomplete, and follows create-deck re-intake or the exact iteration target prompt
- **AND** does not infer or switch controller solely from prose

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
