## Purpose

Define how MD Controller playbooks under `PPTMAKER_FRAMEWORK/playbook/` drive an agent through a deck lifecycle: registered controller inventory is owned by the normative controller manifest, while playbooks provide intent routing, ownership-aware refresh paths, state initialization, gates, and shared-node reuse. Execution state lives in `_state/state.yaml` beside static project metadata.
## Requirements
### Requirement: Playbook controller delegates workflow control to inspection
After it has resolved a semantic intent and exact run, the MD Controller SHALL use the workflow-entry inspection result for resume, small refresh, structural change, and recovery observation/routing. Greenfield creation SHALL first use the direct `init` entry, then consume inspection only after the exact run exists. The Controller SHALL retain intent interpretation, creative work, human communication, and playbook sequencing, but SHALL not reconstruct direct-owner mode/gate/recovery rules or turn a resume action into a substitute for a requested mutation.

#### Scenario: Existing-run Controller delegates observation
- **WHEN** a Controller has resolved an exact run for resume, refresh, structural change, or recovery observation
- **THEN** it uses the workflow-entry inspection result for workflow control
- **AND** it retains the requested mutation with its direct owner rather than substituting a resume action

### Requirement: Controller routing follows production mode before pipeline behavior

Every fresh, resume, and iteration controller SHALL obtain the exact version-scoped production policy
before selecting mode-specific nodes. The MD Controller SHALL own semantic intent, presentation of real
review artifacts, and human decisions; it SHALL delegate deterministic mode/pipeline consistency,
readiness, state mutation, and completion evaluation to JS. A missing/invalid mode or mode/source drift
SHALL stop controller entry with the producer-owned recovery action rather than choosing a controller
from source prose, metadata, generated directories, or conversation context.

For an explicitly targeted run, the MD Controller SHALL consume the direct legacy protocol observer before
selecting ordinary HTML, whole-page, or Page Authority prerequisites. A `recognized-legacy` result SHALL
expose only provider-free adoption preparation, human-authored candidate/matrix intake, exact preview,
target-intake confirmation, and clean Page Authority handoff. A `current` result retains Page Authority
lifecycle routing; `current-pair-corrupt` and `unsupported-or-corrupt` expose their single repair owner.
Cross-pipeline mode requests SHALL route to versioned-transition guidance without clearing the active
controller or editing current-version source/state.

The active node list SHALL come from the canonical mode-filtered playbook index. Inapplicable branch
nodes remain outside that list and SHALL not be marked skipped or deleted. Before a first-class
whole-page operation that will actually submit provider work, the Controller SHALL show exact operation,
run version, selected IDs/roles, profile, and maximum submit count and record the typed human
authorization in the active node. Reuse/no-submit paths SHALL not ask for a fictitious authorization.

#### Scenario: Recognized Image2 source enters adoption

- **WHEN** an explicitly targeted run has a recognized `whole-page-image2-v1` / `image2-only` pair
- **THEN** the Controller presents only the provider-free adoption checkpoint
- **AND** it does not enter HTML production, whole-page production, or refinement

#### Scenario: Resume sees mode drift

- **WHEN** durable state mode and source pipeline do not agree
- **THEN** resume stops at the typed state/transition recovery action
- **AND** it does not infer a replacement controller

### Requirement: playbook/ directory contains the registered MD controllers
PPTMAKER_FRAMEWORK/playbook/ SHALL contain only the controller identities registered by the normative controller manifest plus shared nodes. create-deck SHALL declare mode-aware paths for html-first-v1 and whole-page-image2-v1, and image2-refine SHALL serve only a marked HTML-first run. production-mode-transition SHALL be a distinct state-owned cross-pipeline Controller with only its apply/recovery node, entered only after the exact plan-hash transaction commit. That commit records the target user's intake decision; it is not a `confirm` gate, risk waiver, or source-state continuation. No current Controller inventory, file name, state record, stack frame, migration map, or workflow ledger may retain a maintenance-only or retired transition alias.

For html-only, new entry to image2-refine is mode-disabled and the Controller SHALL offer the atomic switch to html-then-image2 without running refinement. For html-then-image2, create-deck SHALL perform its explicit state-bound handoff to the registered refinement route and return to mode-aware completion after current refinement/final review. Normal refinement entry requires current html delivery review with complete evidence; an explicit offline image2 planning waiver may apply only when current final-slide/slot identity is valid and never authorizes provider generation.

#### Scenario: Agent lists available controllers
- **WHEN** the playbook index is built
- **THEN** it contains only registered current controllers with Image2-primary create and HTML refinement ownership
- **AND** it contains no maintenance-only or retired transition controller

#### Scenario: Image2-primary uses create-deck
- **WHEN** a new image2-only run enters its workflow
- **THEN** entry validation selects create-deck and current whole-page nodes
- **AND** it rejects a maintenance-only controller name

#### Scenario: HTML deck cannot enter a retired page-authority route
- **WHEN** either HTML mode attempts to enter a whole-page-only controller
- **THEN** entry validation fails with a pipeline/mode-ownership diagnostic

#### Scenario: HTML-then-Image2 reaches refinement
- **WHEN** current HTML delivery is reviewable under html-then-image2
- **THEN** create-deck hands off to image2-refine and cannot complete until current refinement/final-review conditions pass

#### Scenario: User explicitly enters refinement before complete delivery evidence
- **WHEN** current HTML final-slide/slot inputs are identifiable and the user accepts the displayed prerequisite risk with a reason
- **THEN** the controller may create only the offline prerequisite-waived plan
- **AND** it still requires exact authorization before any provider operation

### Requirement: create-deck playbook covers complete deck creation
`create-deck.md` SHALL define a complete Page Authority workflow from init/intake through authored
content, visual direction, real-artifact gates, receipt-bound raw work, evidence-bound final review,
readiness, and completion. A fresh run SHALL use `image2-page-authority`: resolve per-slide
Pure/Framed authority, obtain scoped authorization for raw work, obtain raw visual review, finalize one
mixed manifest, assemble PPTX, inject notes, and record delivery review. An exact recognized
`image2-only`, `html-only`, or `html-then-image2` source/state pair is historical adoption input only;
it is not a fresh-init choice or a normal mode-owned controller workflow.

For Page Authority, the Controller SHALL bind a provider decision to run, operation, selected stable
IDs, generation profile, and maximum submissions. It SHALL not infer authorization from init, doctor,
review, a prior batch, or chat. A proven zero-submit operation continues mechanically. Before delivery
review, the Controller SHALL show the current raw/final projections and PPTX/notes result; JS binds the
decision to exact current evidence. Repair returns to the owner, and redirection never mutates the
current version from free text.

#### Scenario: User starts with the default mode
- **WHEN** COMMANDS routes a fresh request without a historical run
- **THEN** execution begins with `image2-page-authority` and its Page Authority node set
- **AND** it does not require HTML source, whole-page mode selection, or visual-slot refinement

#### Scenario: Framed local refresh needs no authorization
- **WHEN** an exact current Framed Text Frame refresh proves it will submit zero provider work
- **THEN** the Controller continues through local finalization/delivery work without requesting authorization
- **AND** it still requires current raw acceptance before finalization

#### Scenario: Recognized legacy run enters adoption
- **WHEN** an explicitly targeted existing run resolves to a recognized legacy source/state pair
- **THEN** the Controller presents provider-free adoption preparation, candidate/matrix authoring, exact preview, and target-intake confirmation
- **AND** it does not select legacy HTML, whole-page, review, provider, or delivery nodes

#### Scenario: Delivery changes after final review
- **WHEN** a Page Authority raw tuple, final manifest, assembly, or notes receipt changes after `proceed`
- **THEN** the prior delivery decision is stale and completion returns to current review

#### Scenario: User says "帮我做一个PPT"

- **WHEN** COMMANDS routes a fresh request without another mode preference to `create-deck`
- **THEN** execution begins with the default `image2-page-authority` Page Authority path
- **AND** it does not select a legacy production mode

#### Scenario: Adoption target resumes with clean Page Authority debt

- **WHEN** a confirmed adoption target is published
- **THEN** the Controller enters `authorize-page-authority-raw` with every target slide needing raw generation
- **AND** it does not use a source approval, raw review, final review, provider authorization, or delivery decision as target evidence

### Requirement: Iteration playbooks resolve semantic paths
Iteration playbooks SHALL classify the exact current mode/source pair, structural scope, source owner, stale artifacts, and required real-artifact review before selecting a path. HTML text/body changes SHALL use local slide rebuild; HTML visual-system changes SHALL use local deck rebuild; notes-only changes SHALL use notes refresh; structural changes SHALL use previewed identity-aware versioning; and image2-only generated-body, header, safe-zone, style-master, and whole-page visual changes SHALL use the normal current whole-page route. html-only refinement requests SHALL offer the same-pipeline switch before a modern Image2 operation. Missing/retired marker, pre-current state, or Controller drift SHALL return the one owner-issued typed next action rather than an inferred iteration route.

#### Scenario: HTML title or body edit
- **WHEN** an HTML-mode user changes text or body content
- **THEN** the Controller selects local affected-slide work and current evidence review

#### Scenario: HTML visual-system edit
- **WHEN** an HTML-mode user changes palette, typography, or visual direction
- **THEN** the Controller selects renderer-neutral exploration and local deck review/rebuild

#### Scenario: Notes-only edit
- **WHEN** only speaker notes change
- **THEN** the Controller selects the notes owner without staling content/visual evidence

#### Scenario: Explicit whole-page visual rebuild
- **WHEN** a consistent image2-only user changes generated-body or whole-page visual direction
- **THEN** the Controller selects its normal current whole-page refresh/review route

#### Scenario: HTML-only user requests modern refinement
- **WHEN** an html-only user requests visual-slot Image2 refinement
- **THEN** the Controller offers the atomic switch before creating an Image2 plan or provider authorization

### Requirement: COMMANDS.md is a routing table
`PPTMAKER_FRAMEWORK/COMMANDS.md` SHALL remain the natural-language-to-controller routing table with examples, target Controller, entry parameters, and sections for exploration/preview, production-mode transition, Image2 channel diagnosis, resume, and post-delivery iteration. Every deck-scoped route SHALL validate the canonical source marker and authoritative production mode before selecting Controller behavior. HTML visual-direction/preview intent SHALL enter local renderer-neutral `iterate-style`/`quick-preview` behavior; an explicit whole-page style-master phrase SHALL not create a style master for an HTML deck. An `html-only` refinement request SHALL first route to the mode switch. A consistent `image2-only` visual/style request SHALL enter the ordinary whole-page create/iteration route. Missing, retired, malformed, or source/state-drifted facts SHALL remain a bounded non-writing diagnostic rather than an alternate projection.

Image-channel symptom/direct-probe examples SHALL route to `probe-image-channels` only for a selected Image2-dependent operation and SHALL not diagnose local HTML rendering as a provider problem. Resume examples SHALL run state/status first. A durable execution resumes its active current Controller/node after reporting whole-workflow position; a complete `html-only` run is not restarted or assigned refinement debt. Cross-pipeline requests SHALL use only the closed state-owned production-mode transition operations.

#### Scenario: Fresh HTML user asks for visual exploration
- **WHEN** an HTML-mode user asks to try several visual directions
- **THEN** COMMANDS routes to local renderer-neutral exploration/preview
- **AND** does not require a whole-page style master or provider channel

#### Scenario: Current Image2 user asks to iterate style master
- **WHEN** a consistent `image2-only` user explicitly asks to refine its style master
- **THEN** COMMANDS routes to the current whole-page controller and its normal review obligations

#### Scenario: HTML browser failure is not an Image2 symptom
- **WHEN** HTML composition fails locally without a provider/API diagnostic
- **THEN** COMMANDS routes to local source/runtime repair rather than `probe-image-channels`

#### Scenario: Durable execution resumes at current node
- **WHEN** state contains a consistent in-progress execution
- **THEN** the Agent reports position and resumes that Controller/node instead of restarting create-deck

#### Scenario: Unsupported whole-page source cannot resume through a fallback
- **WHEN** a source lacks a current marker or durable mode record
- **THEN** COMMANDS reports the source/state diagnostic or recreation outcome without writing state
- **AND** it does not select a maintenance Controller

#### Scenario: First-class Image2 visual intent stays first class
- **WHEN** an `image2-only` run asks to iterate whole-page visual direction or style master
- **THEN** COMMANDS routes to its normal whole-page Controller rather than an inferred route

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

### Requirement: Gates are enforced at node boundaries
Every gate-sensitive playbook node SHALL classify its outcome as guide, confirm, or hard-stop and invoke the owning deterministic evaluator before crossing a protected boundary. The Controller SHALL show real artifacts for semantic/quality decisions, preserve version-scoped reasoned waivers as waived rather than approved, and never treat a successful command, generated bytes, chat memory, or a source-version decision as substitute evidence. This gate taxonomy does not recategorize the separately state-owned exact production-mode plan commit: it records selected target intake, carries no waiver reason or continuation, and cannot bypass its direct state/receipt/CAS checks. For a current image2-only run, existing content, visual, header, provider-authorization, delivery, and final-review boundaries remain first class. Both HTML modes retain their own content/visual/delivery boundaries. Pre-current or retired state cannot satisfy, inherit, or waive a gate.

#### Scenario: HTML preview is available before approval
- **WHEN** a valid HTML run reaches preview with pending review gates
- **THEN** the Controller shows review artifacts and does not claim approval or completion

#### Scenario: HTML content changes after review
- **WHEN** reviewed HTML content changes
- **THEN** the Controller routes to the owning refresh/review path before delivery

#### Scenario: Current whole-page preview retains gates
- **WHEN** a current image2-only pilot runs with pending content/visual/header review
- **THEN** it preserves those gates and does not authorize later build submissions

#### Scenario: Content evidence is stale
- **WHEN** a current gate evaluator reports stale evidence
- **THEN** the Controller shows the bounded rebuild/review action rather than fabricating approval

#### Scenario: User chooses explicit continuation
- **WHEN** a reversible prerequisite risk has a permitted reasoned waiver
- **THEN** the Controller records the current version-scoped waiver and exposes incomplete evidence separately

#### Scenario: Hard-stop transaction conflict
- **WHEN** identity, journal, CAS, or provider authority is unsafe
- **THEN** the Controller stops at the owner diagnostic and does not offer force or state editing

### Requirement: Explore playbooks cover pre-commitment style and pilot preview
Explore playbooks SHALL provide pre-commitment visual exploration and pilot preview without silently authorizing provider work. HTML exploration remains renderer-neutral/local and shall not create whole-page style-master or provider state. A consistent image2-only request may enter its normal whole-page pilot/style workflow only after the Controller presents the exact operation, run, IDs/roles, profile, count, and authorization boundary. Unsupported history cannot enter an inferred exploration branch.

#### Scenario: Fresh user requests a quick visual sample
- **WHEN** a user asks for a quick visual sample before choosing a mode
- **THEN** the Controller explains available mode-specific preview paths and their boundaries
- **AND** it does not submit provider work without a selected current operation

#### Scenario: HTML user requests a quick visual sample
- **WHEN** a consistent HTML user requests a visual sample
- **THEN** the Controller uses local preview/exploration without a whole-page provider dependency

#### Scenario: Current whole-page user requests a pilot
- **WHEN** a consistent image2-only user asks for representative whole-page visuals
- **THEN** the Controller follows normal whole-page pilot authorization and review

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
Long-running current whole-page style-master, pilot, and build nodes SHALL keep the user informed through the established progress/heartbeat contract while the direct owner runs. The Controller SHALL state the exact phase/operation boundary and relay bounded progress, completion, or failure; a wait message never substitutes for a missing result, gate, authorization, or recovery action. HTML local composition remains observable through its own local node progress.

#### Scenario: HTML deck composition is observable
- **WHEN** an HTML composition node runs for a noticeable duration
- **THEN** the Controller reports bounded local progress and final result without implying provider work

#### Scenario: Current whole-page pilot remains observable
- **WHEN** a current image2-only pilot submits or reuses work
- **THEN** the Controller relays the normal progress/heartbeat contract without relabeling it as compatibility work

#### Scenario: Failure is not covered by a wait message
- **WHEN** a long-running owner reports failure
- **THEN** the Controller reports the producer-owned failure/recovery action rather than continuing to wait

### Requirement: Shared nodes are referenced via includes

A playbook SHALL be able to reference a shared node via `includes: [<node-name>]` in its frontmatter. The referenced node SHALL be defined in a standalone `.md` file with `shared: true` in its frontmatter. Multiple playbooks SHALL be able to include the same shared node.

#### Scenario: classify-change shared by edit-text and edit-visual

- **WHEN** `edit-text.md` and `edit-visual.md` both need change classification
- **THEN** both declare `includes: [classify-change]` in their frontmatter
- **AND** `classify-change.md` exists as a standalone shared node with `shared: true`

### Requirement: State file coexists with project-metadata.yaml
`_state/state.yaml` SHALL own current playbook executions, nodes, decisions, waits, gates, the HTML production reset, version-scoped production mode, and mode transition/registration authority. `project-metadata.yaml` SHALL retain durable non-routing project configuration/status plus a human-readable mirror of only the last presented production mode/version. That mirror SHALL never select an adapter, heal a missing mode, authorize delivery, or supply gate evidence.

For a current `image2-only` `whole-page-image2-v1` run, the existing `content_gate|visual_gate` metadata mirrors and `_state.gates.content|visual` are its current whole-page gate/readiness contract. Both HTML modes retain their version-scoped authoritative review records plus disjoint `html_*` status mirrors. No branch publication overwrites another current branch's gate mirrors. A pre-current, markerless, retired, malformed, or source/state-mismatched record SHALL hard-stop before any gate mirror is read as current evidence, and its retained fields SHALL not be promoted into an approval, execution, or Controller route.

Gate dual-write SHALL retain the recoverable journal protocol; full HTML reset SHALL retain its state-first `deletion_pending|complete` transaction. Plain state/status SHALL report interrupted journal, reset, and production-mode mirror state without repair writes. Existing owning operations retain their bounded automatic/explicit recovery rules. Production-mode mirror drift uses its separate state-owned repair and no observation or mirror creates approval or routing authority.

#### Scenario: Metadata and HTML state disagree
- **WHEN** metadata says approved but current-version `_state` evidence is absent or stale
- **THEN** status reports the inconsistency and HTML delivery remains blocked

#### Scenario: Plain state sees recoverable mirror interruption
- **WHEN** authoritative review or production-mode state is new and its metadata mirror remains old
- **THEN** state reports the owning recovery status without writing metadata, changing routing, or removing a journal

#### Scenario: Retired whole-page gate mirrors have no authority
- **WHEN** an unsupported record contains old `content_gate`, `visual_gate`, or `_state.gates` values
- **THEN** observation and approval hard-stop before using those values as current evidence
- **AND** they do not initialize a mode, gate, execution, or Controller

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
When file placement is uncertain, the Controller SHALL search canonical tokens and consult the run-bundle Where Map before creating a path. It SHALL respect the exact current pipeline owner: HTML contact-sheet/review evidence resolves under `_generated/html_production/preview/`; a current `image2-only` `whole-page-image2-v1` pilot/contact sheet resolves under the declared whole-page `_generated/preview/` owner; version temp belongs under `_scratch/`; progress under `_state/`; and lessons under `_lessons/`. It SHALL not create deck-root `_tmp`/backup directories, place generated evidence under the other pipeline's owner, or treat a generated path as source/state authority. `checkBundle` remains the layout enforcement authority.

A missing, retired, malformed, or mismatched source/state pair SHALL hard-stop before the Where Map selects a pipeline-owned path. The Controller may report generic structure facts, but it receives only the state owner's one typed next action and SHALL not revive a historical preview, scratch, or maintenance location.

#### Scenario: HTML preview placement is resolved
- **WHEN** an Agent searches `contact_sheet` or `pilot` for a current HTML-mode run
- **THEN** the Where Map routes to `_generated/html_production/preview/`

#### Scenario: Current whole-page preview placement is resolved
- **WHEN** the same search is for a current `image2-only` `whole-page-image2-v1` run
- **THEN** it routes to the declared whole-page `_generated/preview/` owner

#### Scenario: Unsupported source has no preview placement route
- **WHEN** source/state identity is absent, retired, or inconsistent
- **THEN** the Controller returns the owner-issued hard-stop action before creating or selecting a pipeline path

#### Scenario: Temporary source backup is placed narrowly
- **WHEN** an Agent needs a version-scoped backup
- **THEN** it uses `3_versions/vN/_scratch/` rather than inventing a deck-root directory

### Requirement: Pilot review gates content full-page header quality before full build
Pilot review SHALL resolve the exact version-scoped production mode and verify its direct source pipeline before selecting evidence. For current `image2-only` with `whole-page-image2-v1`, it SHALL retain content, full-page/header quality, selected pilot IDs, provenance, and force-image review behavior. The typed provider authorization required before an actual submit is a separate decision and SHALL not be inferred from pilot selection, pilot success, or content/visual approval. For either HTML mode, pilot review SHALL show the exact content projection and production-equivalent effective preview plus forced-fallback pages when required, bind decisions to current review-plan hashes, and require neither a whole-page style master nor header-lock review. Successful preview SHALL not itself authorize full build; current authoritative content and visual evidence SHALL.

A missing, retired, malformed, or mismatched source/state pair SHALL hard-stop before selecting pilot IDs, reusing force-image behavior, loading a provider adapter, or publishing review evidence. It receives the one owner-issued next action and cannot enter a compatibility pilot path.

#### Scenario: HTML preview succeeds but is not approved
- **WHEN** compositor output is current but the user has not approved or waived both gates
- **THEN** full build remains blocked

#### Scenario: Current whole-page pilot success does not authorize build submissions
- **WHEN** an `image2-only` pilot is approved and a later build batch will submit provider work
- **THEN** the controller requires a new exact build authorization at that submit boundary

#### Scenario: Unsupported source cannot use pilot force behavior
- **WHEN** pilot receives a pre-current, markerless, or source/state-mismatched record with `--force-images`
- **THEN** it returns the bounded owner action before provider or review work

### Requirement: Registered playbooks pass machine validation

Every active controller/shared node SHALL pass the canonical node-specification validator. A checked-in normative manifest SHALL bind the expected controller/shared-node inventory, globally unique IDs, exact order, pipeline ownership, lifecycle/module values, includes/requires, conditions, decisions, and Phase-4 ownership only by `image2-refine`. Validation SHALL not rely on a stale hard-coded count alone.

#### Scenario: Final controller set validates

- **WHEN** the framework indexes all active playbooks
- **THEN** the normalized graph matches the checked-in manifest with no duplicates, missing references, cycles, unknown conditions, impossible gates, or ownership conflicts

### Requirement: Playbook lifecycle and methodology metadata are explicit
Every registered node SHALL declare lifecycle Phase `0|1|2|3|4|5` and one exact final method module `00-setup|01-content|02-visual-system|03-html-production|04-image-production|05-iteration`. Phase 3 owns complete HTML delivery. Image Production owns explicit `visual-slot` and `whole-page` adapters: visual-slot is disabled for `html-only`, required by `html-then-image2` completion, and requires current HTML delivery; whole-page is legal only for `image2-only`, is owned by `create-deck` through `04-image-production/whole-page`, and retains direct authorization and final-review owners.

Phase 5 owns iteration and may expose the state-owned versioned transition handoff/recovery surface, but it SHALL not implement whole-page generation or create a second transition authority. Retired Controller identity or historical source/state evidence SHALL not receive a Phase-5 continuation.

#### Scenario: HTML production node is unambiguous
- **WHEN** an Agent inspects an HTML create-deck production node
- **THEN** it declares lifecycle Phase 3 and method module `03-html-production`

#### Scenario: Optional refinement node is unambiguous
- **WHEN** the controller index inspects `image2-refine`
- **THEN** it declares lifecycle 4/module `04-image-production`, requires `html-then-image2`, and preserves disabled html-only work without executing it

#### Scenario: Image2-primary production has current ownership
- **WHEN** the graph resolves a current `image2-only` whole-page production node
- **THEN** it declares lifecycle 4/module `04-image-production`, adapter `whole-page`, and `create-deck` ownership
- **AND** it does not use a Phase-5 maintenance or historical continuation node

### Requirement: Resume cards use the active playbook model
Resume cards SHALL use the current mode-and-pipeline-compatible active playbook index to calculate pending nodes and eligible successors. They SHALL preserve direct current cursor facts but shall not independently infer a route. A current record with valid identity may expose the next legal action from shared inspection. A pre-current schema, missing/retired marker, topology-only run identity, or retired Controller/node SHALL expose only one bounded owner-issued typed next action; it SHALL not receive a compatibility projection, pending-node list, or invented active graph.

#### Scenario: Unique current successor is suggested
- **WHEN** a current execution has one legal successor after all prerequisites are met
- **THEN** the resume card names that successor and direct owner action

#### Scenario: Branch requires a decision
- **WHEN** a current execution has multiple legal next branches
- **THEN** the resume card names the decision posture without selecting one from prose

#### Scenario: HTML evidence blocks structural eligibility
- **WHEN** HTML evidence is stale before a structural target can materialize
- **THEN** the resume card names the owning evidence path before structural completion

#### Scenario: Required refinement is suggested
- **WHEN** html-then-image2 has current HTML delivery but stale refinement
- **THEN** the card names the refinement owner before completion

#### Scenario: Historical record has no active graph
- **WHEN** an unsupported historical record is observed
- **THEN** its card contains only the one bounded owner-issued typed next action and no pending current nodes

### Requirement: Restructure controller executes one previewed slide transaction
The restructure controller SHALL resolve every selector against one pre-edit snapshot, display position plus stable ID plus title, preview before mutation, bind apply to the exact plan hash, and publish only source/control vNext without renderer/provider calls. After publication, HTML targets report needs_local_materialization and use their explicit local target materializer; whole-page-image2-v1 targets verify current raw-render proof and report needs_render for unproven/inserted IDs. needs_render is a later authorization boundary, not an automatic provider request. The Controller SHALL not copy generated manifests, source gate decisions, or history into the target, and an unsupported historical source has no restructure continuation.

#### Scenario: HTML structure apply remains source-only
- **WHEN** an authorized HTML-mode insert, reorder, or delete transaction applies
- **THEN** visible vNext contains validated source/control, inherits registered mode, and reports needs_local_materialization
- **AND** no HTML manifest, browser, or provider is invoked during source publication

#### Scenario: HTML materialization is separately local
- **WHEN** an HTML target needs local materialization
- **THEN** the Controller invokes its explicit local materializer after source publication
- **AND** it does not request provider authorization

#### Scenario: Whole-page unproven render pauses before cost
- **WHEN** a current whole-page target has an unproven or inserted ID
- **THEN** the Controller reports needs_render and waits for separate normal authorization before build work

#### Scenario: Plan drift returns to preview
- **WHEN** source inputs or exact plan hash drift after preview
- **THEN** the Controller returns to preview without source/target publication

#### Scenario: Image2-primary target waits for rendering authority
- **WHEN** an image2-only structural target needs provider work
- **THEN** the Controller holds at the normal whole-page authorization boundary without auto-submit

### Requirement: Restructure controller uses the version and deck escape ladder
The restructure controller SHALL use the current version/deck escape ladder: same narrative and audience use clean vNext; materially different audience, objective, or narrative may require a new deck. HTML targets materialize locally; current whole-page targets may later need separately authorized raw rendering. The Controller SHALL not present a retired maintenance route as an escape path and shall preserve source version history rather than converting it in place.

#### Scenario: Same narrative stays in vNext
- **WHEN** a user changes slide order or a bounded section while the deck's narrative remains the same
- **THEN** the Controller recommends a clean vNext structural transaction

#### Scenario: HTML vNext needs local bytes
- **WHEN** an HTML vNext contains inserted/stale pages
- **THEN** the Controller reports local target materialization and its review boundary

#### Scenario: Whole-page vNext needs remote bytes
- **WHEN** a current whole-page vNext contains unproven selected IDs
- **THEN** the Controller reports separate normal authorization before remote rendering

#### Scenario: New audience warrants a new deck
- **WHEN** the user changes audience, objective, or narrative materially
- **THEN** the Controller may recommend a new deck rather than forcing a structural version

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
When plain state/status reports a cross-host/uncertain gate journal, the Controller SHALL explain that another process or machine may still own the transaction, retain the opaque owner token internally, and ask the human to attest that no other deck process is active before invoking `state --recover-gate-journal <token>`. The human SHALL not need to type/read the token. This is revalidated factual input to a recovery hard-stop, not a quality-risk waiver or continuation. Decline or uncertainty SHALL make zero writes. Successful recovery SHALL be described only as transaction repair, never new content/visual approval.

When a canonical HTML publication lock cannot be automatically reclaimed, the Controller SHALL first ensure the gate journal is absent/resolved, identify the exact target run and consequence that all canonical HTML generated review/delivery evidence will be rebuilt, and obtain explicit confirmation that no canonical writer/reader must be preserved. It SHALL then invoke only `ppt_flow refresh <run-dir> --kind reset-html-production --confirm-run-version <vN>` and consume its producer-owned `started|resumed|already-complete` result; it SHALL not delete generated paths, edit reset state/mirrors, or invent a reset ID itself. After successful reset it SHALL run a clean local canonical rebuild, show new reset-bound content/visual plans and delivery artifacts, and obtain new decisions even when all raw bytes/fingerprints are identical. A transition-owned journal or scratch conflict remains owned by the state production-mode-transition recovery protocol; this HTML recovery path SHALL neither delete nor reconstruct transition scratch, plans, or receipts.

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

#### Scenario: Transition scratch is not an HTML reset target
- **WHEN** status reports a transition-owned journal or scratch conflict
- **THEN** the Controller uses only the closed production-mode-transition recovery operation
- **AND** it does not delete transition scratch, state, canonical HTML evidence, or reviews

### Requirement: HTML content and visual review are human gates over exact evidence

The MD Controller SHALL show the exact ordered content projection before content approval and hash-bound representative or affected-page preview artifacts before visual approval. It SHALL force fallback composition for a page-local fallback review even when a selected asset is current, report which family/geometry/assets were reviewed, and never infer approval from successful rendering. JS SHALL reject stale reset IDs, content fingerprints, plan hashes, or bytes; after full canonical reset the Controller SHALL show the rebuilt reset-bound plan rather than reuse a remembered pre-reset hash.

#### Scenario: Preview changed before approval

- **WHEN** source/config/renderer/asset evidence changes after the user viewed a preview
- **THEN** approval fails as stale and the Controller shows a new current preview

### Requirement: HTML final review is bound to current delivery evidence
Every HTML controller that can publish a new contact sheet, PPTX, or notes SHALL finish through current html-delivery-review. The Controller SHALL show current delivery artifacts, record typed proceed|repair|redirect decision, require/persist concise reason for repair/redirect or forced proceed, and route the decision before completion. JS SHALL bind/validate the decision against current reset ID, delivery digest, reviewable artifacts, and required lineage. Conversation memory, a pre-reset decision, or prior execution completion shall not substitute for current evidence. Whole-page image2-only final review remains under its separate current state-owned Image2 final-review operation; it is not an HTML exception or historical fallback.

After obtaining the decision, the Controller SHALL invoke the closed state delivery-review operation. It SHALL not hand-edit state, call the JS module through ad hoc code, or pass digest/SHA/path arguments. Repair reason enters shared pipeline-first classification and its owning repair node. A conflict/stale result returns to current status/artifact presentation rather than conversation-only state.

#### Scenario: Local notes refresh completes technically
- **WHEN** Stage 5 publishes current notes after an HTML notes edit
- **THEN** the edit controller still shows the result and records a new evidence-bound delivery decision before completion

#### Scenario: Prior execution said proceed
- **WHEN** a new HTML delivery digest differs from the prior reviewed digest
- **THEN** the prior decision cannot complete the current controller

#### Scenario: Controller persists proceed through public state route
- **WHEN** the user accepts the current shown delivery
- **THEN** the Controller calls the closed state evidence operation with normal or explicitly forced proceed
- **AND** completion relies on resulting evidence-referenced node decision, not chat memory or a second write

#### Scenario: Forced proceed lacks reviewable artifacts
- **WHEN** the user requests forced proceed but current target PPTX/contact-sheet bytes cannot be shown
- **THEN** the Controller explains the protected review-identity invariant and recommends rebuilding artifacts
- **AND** it does not offer state editing as a continuation

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

### Requirement: Historical whole-page and transition Controllers have literal ownership
The historical whole-page implementation remains readable only for explicit protocol observation and
adoption provenance. A recognized legacy run SHALL be fenced before ordinary whole-page controller
nodes, Header-Lock, provider work, or delivery work. A distinct `production-mode-transition` Controller
SHALL own only the state-owned apply/recovery node for cross-pipeline publication after the exact
plan-hash transaction commit. Its `legacy-adoption` plan kind alone publishes the fixed Page Authority
target; the commit records the target user's `proceed` intake decision, not a risk waiver or
continuation. For an uncertain transition journal, the Controller may present only the owner-issued
`no-active-apply` fact attestation after its age/identity checks; until owner reinspection validates it,
the recovery remains a hard-stop and no writer is waived or forced.

#### Scenario: Recognized Image2 source is fenced before its old controller
- **WHEN** an exact historical `image2-only` source/state pair is selected
- **THEN** the Controller offers only the provider-free adoption checkpoint
- **AND** it does not enter a whole-page production node or maintenance route

#### Scenario: Exact-commit transition applies
- **WHEN** state owns a current exact-plan-committed cross-pipeline transition
- **THEN** the Controller enters `production-mode-transition/apply-production-mode-transition`
- **AND** no other Controller can satisfy that entry or terminal recovery condition

#### Scenario: Retired transition playbook cannot be resumed
- **WHEN** an observed state or caller names a retired transition identity
- **THEN** the Controller reports the state-owned unsupported-protocol/recreation action without selecting a playbook
- **AND** it does not alias, rewrite, or resume that identity as `production-mode-transition`

### Requirement: New decks enter the Page Authority production controller
The registered create-deck controller SHALL route a fresh `image2-page-authority` run through Page
Authority source authoring, visual-language selection, scoped provider authorization, raw review, final
projection, assembly, notes, and delivery review. The MD Controller SHALL own human visual decisions;
JS SHALL own resolver, readiness, evidence, and state checks. Page Authority runs SHALL never enter
legacy nodes. A recognized legacy run SHALL no longer enter its ordinary legacy controller route: the
Controller SHALL present the direct provider-free adoption observer, candidate/matrix authoring, exact
preview, target-intake confirmation, and post-publication Page Authority handoff. It SHALL keep all
semantic slide choices human-owned and shall not infer them from legacy content or generated material.

#### Scenario: Fresh run uses Page Authority nodes
- **WHEN** a fresh initialized run has the exact Page Authority source/state pair
- **THEN** the active controller set contains the Page Authority lifecycle and excludes HTML/header-lock/visual-slot nodes
- **AND** provider work requires the displayed scoped authorization

#### Scenario: Recognized legacy run enters adoption intake
- **WHEN** an explicitly targeted existing run resolves to `recognized-legacy`
- **THEN** the Controller shows the provider-free adoption prepare/preview route and explicit per-slide matrix
- **AND** it does not run the old legacy controller, infer a Page Authority source, or create an adoption record before exact confirmation

#### Scenario: Adoption target resumes with clean Page Authority debt
- **WHEN** the state-owned adoption handoff publishes its target
- **THEN** the Controller enters the target Page Authority raw-authorization node with every target slide needing raw generation
- **AND** it does not treat a source approval, raw review, final review, or delivery decision as target evidence

#### Scenario: Current pair corruption remains outside adoption
- **WHEN** an existing run has a partial or mismatched Page Authority source/state pair
- **THEN** the Controller names the Page Authority repair owner
- **AND** it does not fall back to legacy nodes or adoption candidate authoring

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
