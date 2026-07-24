## RENAMED Requirements

- FROM: `### Requirement: HTML and workflow migration diagnostics remain producer-owned`
- TO: `### Requirement: HTML and workflow transition diagnostics remain producer-owned`

## MODIFIED Requirements

### Requirement: CLI surface preserves command names
The `ppt_flow` CLI SHALL expose exactly 14 top-level commands: `doctor`, `init`, `status`, `approve`, `style-master`, `validate`, `pilot`, `build`, `refresh`, `new-version`, `test`, `state`, `slides`, and `image2`. Cross-pipeline page-authority work SHALL be exposed only by the closed `state --*-production-mode-transition` operations. There SHALL be no top-level `migrate-html` or `production-mode-transition` command and no compatibility help entry for either removed surface.

#### Scenario: Help lists the complete current surface
- **WHEN** `ppt_flow --help` runs
- **THEN** the 14 current command names are listed exactly once
- **AND** no removed migration or top-level transition command is advertised

#### Scenario: Existing init invocation remains valid
- **WHEN** an Agent runs `ppt_flow init deck_demo --deck-type keynote --style dark-executive`
- **THEN** a run bundle is created using the compatible invocation shape and the current `image2-only` default

### Requirement: CLI exposes a closed versioned production-transition protocol
`ppt_flow state` SHALL expose mutually exclusive `--prepare-production-mode-transition <html-only|html-then-image2|image2-only>`, `--preview-production-mode-transition`, `--confirm-production-mode-transition --plan-hash <hash>`, `--apply-production-mode-transition --plan-hash <hash>`, `--confirm-production-mode-transition-recovery <owner-token>`, and `--recover-production-mode-transition [owner-token]` operations. They SHALL delegate to the state-owned transaction and selected adapter; they SHALL not accept `--force`, caller-supplied lineage paths, old-side migration modes, or legacy migration fields.

Prepare and preview SHALL remain local and non-writing with respect to source state and visible versions. The named confirmation command is the first state write: an exact plan-hash transaction commit that binds the exact source execution, target mode/intake, candidate inputs, anticipated target version, plan hash, and existing target-user `transition_confirmation` decision to the `production-mode-transition/apply-production-mode-transition` execution. It is not a quality/process-risk continuation, accepts neither `--reason` nor `--force`, and writes no `waived` decision or waiver record. Apply SHALL rederive that hash and revalidate the closed target-intake/digest/decision tuple before publication. An Image2 target reports the later normal authorization/pilot/build boundary and does not submit a provider request during transition.

Recovery SHALL operate only on the exact transition journal or one exact visible receipt. Same-host proven-dead recovery is automatic only after the existing 60000-ms floor; cross-host or otherwise uncertain recovery requires the state-owned no-active-apply fact attestation after the 300000-ms floor. That attestation is revalidated factual input to a recovery `hard-stop`, not a risk waiver or continuation, and carries no `--reason`/`--force` bypass. A live owner is non-overridable. No removed migration Controller, node, receipt, scratch owner, or command may start or finish a transition.

#### Scenario: HTML-to-Image2 preview is offline
- **WHEN** a valid HTML source previews an explicitly authored `image2-only` candidate
- **THEN** CLI returns the exact target mode, plan hash, and later Image2 authorization boundary
- **AND** it makes no provider request or target version write

#### Scenario: Image2-to-HTML selects the target mode
- **WHEN** a consistent Image2 source prepares an `html-then-image2` candidate
- **THEN** CLI preserves the source and reports the selected HTML target mode rather than silently choosing `html-only`

#### Scenario: Confirmation flags conflict
- **WHEN** a caller mixes transition operations, JSON, gate recovery, delivery review, or another state operation
- **THEN** CLI returns one `USAGE` envelope before source, state, candidate, or target mutation

#### Scenario: Apply lacks current confirmation
- **WHEN** apply receives a missing, stale, or mismatched plan hash
- **THEN** CLI hard-stops before reservation or publication and directs the Controller to the exact preview checkpoint

#### Scenario: Uncommitted transition preview is non-writing
- **WHEN** the Controller does not invoke the exact plan-hash commit after displaying an exact preview
- **THEN** the source execution, current node, and authoritative source mode remain unchanged
- **AND** no transition execution or target version is created

#### Scenario: Transition commit cannot become a waiver
- **WHEN** a caller supplies `--reason` or `--force` with `--confirm-production-mode-transition`
- **THEN** CLI returns `USAGE` before source, state, candidate, journal, or target mutation
- **AND** it creates no waiver, continuation, or alternate transition path

#### Scenario: Recovery grammar is closed
- **WHEN** a caller combines recovery with another operation or supplies an invalid owner token
- **THEN** CLI returns one `USAGE` envelope before state, journal, staging, source, or target mutation

#### Scenario: Uncertain recovery requires durable fact attestation
- **WHEN** an old-enough uncertain journal is recovered without a current matching recovery-confirmation record
- **THEN** CLI hard-stops before takeover and names the closed fact-attestation form
- **AND** a stale attestation cannot be replayed after journal or plan drift

#### Scenario: Exact plan commit creates only the current transition record
- **WHEN** the Controller commits an exact production-mode transition preview
- **THEN** state starts `production-mode-transition/apply-production-mode-transition` with the bound source execution, target mode/version, and plan hash
- **AND** it records the target user's `proceed` decision without a risk reason, waiver, or continuation
- **AND** it creates no removed migration field or node

#### Scenario: Exact plan commit binds target intake
- **WHEN** the Controller commits a transition preview with explicit target topic, audience, and success criteria
- **THEN** the plan binds those target-intake fields, their digest, and the target-user decision before target handoff records only new target intake evidence
- **AND** a source Controller decision cannot satisfy the target intake node

### Requirement: Resume-card action displays derive from one inspection projection
`state` and `status` SHALL retain non-empty public `workflow_summary` and `suggested_next` fields, but each SHALL be a display adaptation of the same `workflow_inspection.primary_action` in that response. `eligible_candidates` MAY remain as a bounded diagnostic field, but SHALL not select a route, override the primary action, or expose an alternate mutation command. The shared state card retains raw cursor context but SHALL not independently evaluate a resume/next action.

#### Scenario: State and status display the same primary action
- **WHEN** `state` and `status` render a response for the same workflow-inspection projection
- **THEN** each derives its public resume-card action from that response's `primary_action`
- **AND** neither display field or eligible candidate selects an alternate route

### Requirement: Public CLI exposes one production-mode surface
ppt_flow init SHALL accept exact --mode html-only|html-then-image2|image2-only and default to image2-only. The closed state grammar SHALL retain same-pipeline mode transition, metadata-mirror repair, idempotent same-pipeline post-publication registration, first-class Image2 delivery review, and only the state-owned cross-pipeline transition forms: prepare with requested target mode, preview, exact-hash transaction commit through `--confirm-production-mode-transition`, exact-hash apply, durable recovery confirmation, and owner-scoped recovery. All forms SHALL be mutually exclusive with one another and with JSON, gate checks/recovery, and delivery-review forms.

Same-pipeline registration SHALL reject sources outside the same deck, non-visible targets, changed/conflicting relationships, and cross-pipeline use. Cross-pipeline target registration is permitted only inside the transition state owner's verified receipt-bound handoff; it shall not be exposed through generic registration or caller-supplied source/target/mode arguments. Same-pipeline HTML transitions SHALL delegate to the state owner, while cross-pipeline requests through the in-place setter SHALL return typed transition-required guidance without state, source, generated-tree, or current-version mutation. Help and successful init/mode/registration/repair/transition results SHALL include normalized run or source/anticipated-target version, selected mode, derived pipeline, exact plan hash where applicable, and nearest next action.

Unknown mode values, missing/corrupt authority, selected-run execution mismatch, mode/source mismatch, pre-current state, retired Controller identity, or CAS conflict SHALL use the existing one-final-JSON diagnostic producer and fail before branch-specific readiness, provider credentials, generated paths, or writes. The diagnostic SHALL name the owner's one bounded typed next action, never a hand-edited state recipe.

#### Scenario: Cross-pipeline registration has no generic CLI bypass
- **WHEN** a caller invokes state registration for source and target with different pipelines
- **THEN** the command rejects before state, metadata, source, or target mutation
- **AND** only the exact confirmed transition handoff may register the selected target mode

#### Scenario: Init omits mode
- **WHEN** ppt_flow init is called without --mode
- **THEN** stdout reports image2-only, its whole-page pipeline, and the Image2-primary next action

#### Scenario: Invalid mode is supplied
- **WHEN** init or a mode transition receives an unknown mode
- **THEN** CLI returns USAGE through the registered diagnostic envelope before creating or changing a bundle

#### Scenario: Same-pipeline transition succeeds
- **WHEN** the exact run changes from html-only to html-then-image2 with current expected state
- **THEN** CLI reports the old/new mode and unchanged html-first-v1 pipeline
- **AND** it does not submit provider work

#### Scenario: Cross-pipeline transition is deferred
- **WHEN** the exact run requests image2-only from an HTML mode
- **THEN** CLI reports typed versioned-transition guidance and makes no state, source, or generated mutation

#### Scenario: Published target registration is retried
- **WHEN** the exact same-pipeline target is visible but prior mode registration was interrupted
- **THEN** state registration commits or reports the already-current target record idempotently
- **AND** it does not copy source gates, node completion, or generated evidence

#### Scenario: State operation flags are mixed
- **WHEN** a caller combines mode transition, mirror repair, registration, JSON, gate, or delivery-review forms
- **THEN** CLI returns USAGE before state, metadata, source, or target mutation

### Requirement: Public production commands route from canonical mode policy
For run-scoped validate, pilot, approve, style-master, build, refresh, image2, state, and status, ppt_flow SHALL inspect the exact version-scoped production mode and verify its direct source pipeline before branch-specific parsing or readiness. It SHALL then delegate to the owning adapter: HTML commands for both HTML modes, normal whole-page pilot/build for image2-only, and modern image2 refinement only for html-then-image2. html-only SHALL return typed mode-disabled guidance to the same-pipeline switch without creating refinement state; whole-page image2-only SHALL return not-applicable guidance to normal pilot/build and SHALL NOT redirect modern refinement commands into whole-page generation.

Mode-inapplicable but future-reserved behavior MAY return successful typed guidance only when no protected invariant is at risk. Unknown identity, pipeline drift, pre-current state, retired Controller/node, active ownership conflict, invalid provenance, or missing provider authorization SHALL remain a non-waivable hard failure through the existing producer-owned envelope. For a durable image2-only create execution, state image2 delivery review SHALL call the state-owned Image2 final-review publication; it SHALL reject force and caller-supplied lineage. Before a whole-page style-master, pilot, build, or refresh actually submits to a provider, the Controller SHALL have persisted current typed human authorization for the shown operation/scope/count; CLI SHALL fail before submit if it lacks that decision. No authorization is required when provenance proves zero provider submissions.

#### Scenario: Image2-primary pilot routes normally
- **WHEN** ppt_flow pilot targets a consistent image2-only version
- **THEN** it delegates to whole-page Image2 pilot generation with current cost/provenance gates
- **AND** it does not invoke HTML composition or modern refinement

#### Scenario: HTML-only build stays local
- **WHEN** ppt_flow build targets a consistent html-only version with current gates
- **THEN** it delegates to local HTML delivery without Image2 credentials

#### Scenario: Modern Image2 is inapplicable to whole-page mode
- **WHEN** ppt_flow image2 plan targets image2-only
- **THEN** CLI returns typed not-applicable guidance that points to normal pilot/build
- **AND** it creates no refinement state or provider attempt

#### Scenario: Modern Image2 is disabled in html-only
- **WHEN** ppt_flow image2 plan targets html-only
- **THEN** CLI returns typed guidance for the same-pipeline html-then-image2 switch
- **AND** it creates no refinement state or provider attempt

#### Scenario: Provider authority is missing
- **WHEN** an Image2-primary operation reaches a chargeable submit boundary without current authorization/readiness
- **THEN** CLI hard-stops before submit and names the authorized recovery action
- **AND** no force or quality waiver bypasses provider authority

#### Scenario: HTML style-master seam is not implemented
- **WHEN** a consistent HTML mode invokes style-master
- **THEN** CLI exits successfully with typed available-false guidance and the local visual-system next action
- **AND** it writes no artifact and initializes no provider

#### Scenario: Image2-primary final review is recorded
- **WHEN** the Controller invokes state Image2 delivery review proceed after showing current whole-page delivery
- **THEN** CLI derives and atomically binds current execution/version/artifact evidence
- **AND** it creates no HTML delivery-review record

### Requirement: ppt_flow delegates to capability scripts
ppt_flow.mjs SHALL delegate bundle management, environment checks, state, slide transactions, the state-owned production-mode transition, and the selected production branch to owning Phase interfaces or categorized shared CLI adapters. It SHALL route HTML Stage 1-5 through the HTML interface and explicit current whole-page production through the public 04-image-production/whole-page adapter. It SHALL keep orchestration/renderer logic out of the command router, verify the canonical source/state pair before branch-specific readiness or option handling, and import no retired Phase-5 migration bridge or private path.

#### Scenario: HTML build routes to the HTML adapter
- **WHEN** a marked HTML run invokes ppt_flow build
- **THEN** ppt_flow delegates through unified orchestration to the HTML capability scripts
- **AND** does not delegate to style-master or Image2 generation

#### Scenario: Whole-page style command retains its owner
- **WHEN** a consistent image2-only run invokes ppt_flow style-master
- **THEN** ppt_flow delegates to the public whole-page style-master owner rather than implementing it inline

### Requirement: Pilot uses preview readiness and does not waive gates
ppt_flow pilot SHALL resolve authoritative production mode and verify current source pipeline before readiness. For image2-only with whole-page-image2-v1, preview readiness SHALL remain structure plus current style master; content/visual gates SHALL not be required or mutated, and whole-page Stage 2 SHALL receive preview mode. An operation that will submit provider work also requires current scoped authorization; proven zero-submit reuse does not. For both HTML modes, pilot SHALL require structure plus valid local HTML source/runtime inputs but no whole-page style master or approved gates; it SHALL compose production-equivalent review artifacts only and shall not publish Stage 4/PPTX. Neither adapter writes waived merely to unlock preview. Full build still requires the adapter's current authoritative gate evidence. Missing, retired, or state-inconsistent whole-page identity SHALL stop before preview artifacts, adapter startup, or mutation.

#### Scenario: HTML preview runs while gates are pending
- **WHEN** a valid HTML-mode run has pending content/visual gates
- **THEN** pilot produces review evidence without whole-page style master or provider setup
- **AND** Stage 4 remains blocked

#### Scenario: Current whole-page preview retains normal readiness
- **WHEN** an image2-only run has a style master and pending gates
- **THEN** pilot may run whole-page Stage 2 under current preview readiness
- **AND** does not mutate gate fields

#### Scenario: Unsupported whole-page record is non-routable
- **WHEN** pilot cannot establish current state and marker identity
- **THEN** it returns the one owner-issued typed next action without writing state or initiating a provider adapter

### Requirement: Pilot accepts --force-images and skips by default
ppt_flow pilot SHALL retain --force-images for image2-only with whole-page-image2-v1: without it, current pilot images are skipped; with it, selected whole-page images regenerate under applicable authorization/review contract. For either HTML mode, --force-images SHALL fail with USAGE before readiness/writes because HTML preview freshness is fingerprint-driven; callers SHALL use the HTML preview/rebuild selector instead of a provider-generation flag. A historical or markerless record shall not acquire the whole-page force behavior.

#### Scenario: Current whole-page pilot skips existing images by default
- **WHEN** current whole-page pilot images exist and pilot runs without --force-images
- **THEN** whole-page Stage 2 skips those current files

#### Scenario: HTML pilot receives force-images
- **WHEN** a marked HTML-mode run invokes pilot with --force-images
- **THEN** the command fails before writes/provider setup with the HTML preview next action

#### Scenario: Image2-primary force-images is authorized
- **WHEN** image2-only pilot will regenerate selected images with --force-images
- **THEN** submit scope must match the active authorization before transport

### Requirement: state prints a where-am-I resume card
ppt_flow state human output and successful JSON output SHALL retain the whole-session where-am-I card and SHALL resolve an exact current production-mode/source-pipeline pair before rendering a normal workflow card. With usable durable state it SHALL expose non-empty workflow_summary and suggested_next, normalized pipeline, active playbook/current node/status, optional waiting_for/note, gates, and playbook_stack, and evaluate pending/completion only against the mode-filtered active node set. A current v5 record with a one-to-one canonical defect may be repaired only by its owning execution path after identity validation; state observation itself is non-writing. A pre-current schema, topology-only version identity, retired Controller/node, missing marker/mode, or unrecoverable current record SHALL expose only one producer-owned typed next action with no active execution graph, compatibility projection, state seed, or inferred continuation.

Closed recovery, delivery-review, production-mode transition/mirror/version-registration, and Image2 final-review operations SHALL remain mutually exclusive with JSON, gate checks, and one another. Both HTML modes retain their bounded HTML review projection. image2-only exposes bounded whole-page gate, header, PPTX/notes, final-review freshness, completion, and nearest owner facts; it SHALL not expose HTML/refinement record or infer currentness from generated-file presence. Suggested-next remains waiting-first, then identity/registration/journal repair, then the earliest mode-owned stale/missing action. Card construction remains in the shared state module so status consumes the same non-mutating projection.

#### Scenario: HTML resume card exposes outstanding review
- **WHEN** an HTML-mode run has current content approval but stale page evidence for two slides
- **THEN** state identifies the HTML pipeline and the two sorted outstanding slide IDs
- **AND** suggested-next names the visual-review path rather than whole-page Image2

#### Scenario: Current record repair stays owner-owned
- **WHEN** a current v5 record has a one-to-one canonical defect
- **THEN** a selected owner mutation may repair it behind current identity and fence validation
- **AND** plain state observation returns no write and no raw YAML instruction

#### Scenario: Historical state card does not seed execution
- **WHEN** state observes missing/retired source identity, pre-current schema, or retired Controller state
- **THEN** it returns the one bounded owner-issued typed next action with no active graph
- **AND** no state file, history, journal, or generated artifact is written

#### Scenario: Interrupted journal is observable but not healed by plain state
- **WHEN** plain state sees new authoritative state with an old metadata mirror
- **THEN** the owning review/mode projection reports repairable mirror drift
- **AND** state emits no journal, state, or metadata write

#### Scenario: Cross-host journal is explicitly recovered
- **WHEN** the Controller shows an uncertain journal, obtains human confirmation that its owner stopped, and invokes the exact recovery route after 300000 ms
- **THEN** CLI applies only the exact recovery matrix and exits with bounded recovered/blocked status
- **AND** it does not create a content/visual decision
- **AND** the human statement is revalidated fact input, not a waiver of writer ownership

#### Scenario: Image2-primary card uses whole-page evidence
- **WHEN** a durable image2-only run has current whole-page delivery and final review
- **THEN** the card reports completion without HTML or modern-refinement debt

### Requirement: status surfaces playbook position and lesson count
ppt_flow status SHALL reuse the exact non-mutating mode-aware resume-card projection from state after resolving the current mode/pipeline pair. With usable durable state, human and JSON output SHALL retain production mode, normalized pipeline, active playbook/current node, mode-filtered completion, and nearest owning action. Both HTML modes SHALL expose existing html_reviews; html-only can complete without Phase 4, while html-then-image2 remains incomplete until current refinement and renewed final review. image2-only SHALL expose whole-page gate/header/delivery/final-review facts without HTML/refinement debt. An unsupported source/state record SHALL report only its one owner-issued hard-stop action and SHALL not heal/seed state or invent execution.

Status SHALL retain Lessons and JSON lessons_count, counting files in deck-root _lessons except README.md without invoking lessons.mjs as a subprocess. Missing/empty remains zero/none; positive counts retain the review hint.

#### Scenario: Status shows lesson count when lessons exist
- **WHEN** Agent runs status on a deck with two lesson files excluding README
- **THEN** human output shows Lessons: 2 with the review hint
- **AND** JSON includes lessons_count: 2

#### Scenario: Status shows no lessons
- **WHEN** _lessons is absent or contains no counted files
- **THEN** human output shows Lessons: none
- **AND** JSON includes lessons_count: 0

#### Scenario: Status shows durable playbook position
- **WHEN** a run has usable current state
- **THEN** human and JSON output include its active playbook and current node

#### Scenario: HTML status exposes evidence freshness
- **WHEN** an HTML-mode run has stale content, one uncovered recipe key, and no delivery review
- **THEN** status exposes each condition through the shared HTML review projection
- **AND** does not reduce them to metadata scalar gate values

#### Scenario: Unsupported whole-page status is a hard-stop
- **WHEN** an unsupported whole-page record lacks a current state/source identity
- **THEN** status reports the one owner-issued hard-stop action without creating state or an execution pointer

#### Scenario: Image2-primary status is mode-owned
- **WHEN** status targets a durable consistent image2-only run
- **THEN** it reports whole-page completion facts and the first missing owner action

### Requirement: approve dual-writes metadata and _state gates
ppt_flow approve <runDir> <gate> SHALL resolve current production mode and verify pipeline before validating approval evidence. For image2-only with whole-page-image2-v1, current whole-page metadata content_gate|visual_gate and state gate writes/reads SHALL remain; HTML approval SHALL never overwrite them. For both HTML modes, ordinary content/visual approval SHALL require no reset pending plus exact current-reset hash of an approvable plan covering every outstanding evidence item; scoped, incomplete, or pre-reset plans SHALL fail and list missing/stale evidence. Explicit waiver with reason MAY retain bounded current-identity waiver behavior.

Successful HTML publication SHALL write one version-scoped/current-reset HTML review record under authoritative state, update only matching state mirrors/run versions, then update only metadata mirrors through the recoverable journal. Those fields are status mirrors and SHALL never satisfy readiness alone or overwrite current whole-page scalars. Waiver reasons retain bounded normalization; ambiguous or unrecoverable partial writes fail closed. An unsupported historical state cannot approve a whole-page gate or be converted into current evidence.

#### Scenario: HTML visual approval binds current evidence
- **WHEN** an Agent approves visual with exact current HTML review-plan hash
- **THEN** authoritative current-version visual evidence publishes before mirrors synchronize
- **AND** the record binds current preview/fingerprint evidence

#### Scenario: HTML waiver omits a reason
- **WHEN** an Agent requests an HTML gate waiver without an explicit reason
- **THEN** approval fails without changing authoritative evidence or mirrors

#### Scenario: HTML scoped plan is incomplete
- **WHEN** ordinary approval supplies a current hash whose plan is non-approvable because other evidence is outstanding
- **THEN** approval fails, identifies missing IDs/coverage, and writes neither state nor mirrors

#### Scenario: HTML incomplete plan is explicitly waived
- **WHEN** current source/reset/version identity is valid and Agent supplies waiver with reason for an incomplete plan
- **THEN** the gate publishes status waived with bounded failed checks
- **AND** readiness reports the waiver decision separately from evidence completeness

#### Scenario: Whole-page approval uses current gates
- **WHEN** an Agent approves content or visual for a consistent image2-only run
- **THEN** the normal whole-page scalar/state contract applies without creating HTML review evidence

#### Scenario: Historical whole-page approval is rejected
- **WHEN** a historical or state-inconsistent whole-page record asks for approval
- **THEN** CLI stops before state/metadata mutation and returns the one owner-issued typed next action

### Requirement: HTML content and visual approval are exact-evidence-hash bound
The public `approve <run-dir> content|visual` command for a current HTML run SHALL require an exact current plan hash for `approved`. `--waive --reason` SHALL accept a missing/incomplete quality plan only when the canonical HTML source parses and current run version/reset identity is known. It SHALL publish through the same gate owner/journal/CAS authority with gate `status: waived`, a bounded reason, and a bounded `waived_checks` list. `evidence_complete` SHALL reflect actual evidence: it MAY be true for a complete intentional waiver and SHALL be false when checks are missing. A caller-supplied non-matching plan hash SHALL return `CONFLICT` or `GATE_BLOCKED` without mutation.

HTML approval SHALL neither read nor write retired whole-page visual/header syntax, gate fields, or evidence as an isolated compatibility surface. It SHALL leave current non-HTML branch mirrors untouched, and a retired field presented to this command SHALL be rejected before gate mutation. A `deletion_pending` reset SHALL return `CONFLICT`; a pre-reset plan hash SHALL be stale even when rebuilt raw artifacts are byte-identical. A stale or missing hash on ordinary approval SHALL fail with the current human-review next action and no gate mutation.

#### Scenario: User approves current HTML preview
- **WHEN** content or visual approval receives the exact current plan hash and complete evidence
- **THEN** the command records gate `status: approved` and returns `decision: approved` with `evidence_complete: true`
- **AND** the result uses the current reset/version-bound review record

#### Scenario: Incomplete evidence is explicitly waived
- **WHEN** the source parses, current identity is known, and the user supplies `--waive --reason`
- **THEN** the command records a current version-scoped `status: waived` gate and returns its failed checks
- **AND** readiness distinguishes the waiver decision from independently computed evidence completeness

#### Scenario: User supplies a wrong hash
- **WHEN** a caller passes a non-matching explicit plan hash
- **THEN** the command returns a bounded mismatch diagnostic with expected/actual lineage
- **AND** it writes no gate, mirror, or waiver record

#### Scenario: Preview changed after showing
- **WHEN** the supplied hash no longer matches current source/config/artifacts
- **THEN** approval fails without changing the gate

#### Scenario: Reviewed content changes
- **WHEN** the ordered content fingerprint no longer matches the supplied content review hash
- **THEN** content approval fails without changing authoritative evidence or mirrors

#### Scenario: Retired approval syntax is rejected
- **WHEN** an HTML approval receives a retired whole-page visual/header field or evidence shape
- **THEN** CLI rejects it before gate, mirror, or waiver mutation
- **AND** it does not preserve an isolated compatibility approval path

### Requirement: Title refresh routes by the affected slides' resolved modes
ppt_flow refresh --kind title SHALL resolve current production mode, verify pipeline, and retain selected-ID/all selector semantics. For both HTML modes, header text is renderer-owned visible content: refresh SHALL rebuild affected local review output, validate overflow, stale content approval when its fingerprint changes, preserve visual approval only when dependencies remain unchanged, reject whole-page force/reuse/profile options, and wait for current HTML evidence before Stage 4. For image2-only with whole-page-image2-v1, render-mode routing, selector-free body-lock restriction, TITLE_REVIEW_REQUIRED, force-pilot/header evidence, and reviewed-image reuse SHALL remain. A historical source shall not receive render-mode inference.

#### Scenario: HTML title changes
- **WHEN** one marked slide title changes
- **THEN** local review pixels are rebuilt, content evidence becomes stale, and visual evidence remains current if visual dependencies are unchanged
- **AND** no whole-page/header-review route is selected

#### Scenario: Current full-page title changes
- **WHEN** a current whole-page selected title belongs to full-page and lacks current header review
- **THEN** TITLE_REVIEW_REQUIRED and exact force-pilot action remain

#### Scenario: Image2-primary title uses render mode
- **WHEN** an image2-only title refresh resolves full-page or body+header-lock
- **THEN** it selects the whole-page render-aware path through normal mode ownership

### Requirement: Existing approve command records header review evidence
ppt_flow approve <run-dir> header SHALL be whole-page-image2-v1-only. It applies to a consistent image2-only record and retains current pilot/provenance checks, version-scoped header-review evidence, matching-profile merge/partial coverage, stale rejection, and ID-plus-reason waiver behavior without changing content/visual metadata gates. For both HTML modes it SHALL fail before readiness/artifact/state writes with branch-inapplicable guidance to HTML visual approval; HTML evidence SHALL never enter header-review. A missing/retired record has no header-review continuation.

#### Scenario: Current partial header batches merge
- **WHEN** two current whole-page pilot batches have matching fingerprint/profile
- **THEN** their reviewed IDs merge under the same version record

#### Scenario: HTML run approves header
- **WHEN** a marked HTML-mode run invokes header approval
- **THEN** CLI writes no whole-page evidence and points to the current HTML visual review path

#### Scenario: Image2-primary header approval remains first class
- **WHEN** current image2-only pilot evidence is reviewed
- **THEN** header approval records version-scoped whole-page evidence without compatibility maintenance

### Requirement: Build preserves reviewed full-page images
For image2-only with whole-page-image2-v1, current header evidence SHALL retain reviewed/accepted full-page preservation: default force conflicts with reviewed bytes, build reuse preserves matching reviewed images and generates only missing/unreviewed ones, and profile drift requires new pilot/review. Any actual submit also requires exact current build authorization; a proven reuse-only build does not. For both HTML modes, currentness SHALL come from effective composition fingerprints/manifests; whole-page reuse, resolution/model/provider options, and whole-page review evidence SHALL be rejected before writes. HTML build SHALL reuse current immutable effective objects automatically and never treat forced-fallback review bytes as delivery. An unsupported source/state record shall fail before reuse or provider decision.

#### Scenario: Current reviewed whole-page build uses reuse
- **WHEN** current whole-page header evidence, profile, and images are current
- **THEN** build reuse preserves those images and fills only missing whole-page output

#### Scenario: HTML build receives reuse-images
- **WHEN** a marked HTML-mode run invokes build with --reuse-images
- **THEN** the command rejects the whole-page-only option before production writes

#### Scenario: Image2-primary reuse avoids a fictitious authorization
- **WHEN** image2-only build proves every selected image reusable with zero submits
- **THEN** it preserves reviewed bytes without requesting or consuming provider authorization

### Requirement: Public HTML build and refresh commands route without provider flags
ppt_flow validate, preview, build, status, approve, slides, and refresh SHALL verify the explicit source marker and durable mode pair before branch-specific argument/readiness handling. HTML-first build SHALL use the local Stages 1-5 adapter. HTML refresh SHALL expose Local Slide Rebuild, Local Deck Rebuild, Notes-Only Refresh, structural materialization, and exceptional full generated-owner recovery through existing command ownership or explicit closed kinds; it SHALL reject whole-page provider/model/resolution/style-master/force-images/reuse-images flags and never delegate to whole-page image generation, style-master, or header approval. A whole-page run SHALL reject an HTML-only reset kind as branch-inapplicable. No unsupported history is treated as a valid HTML or whole-page branch.

#### Scenario: HTML build without credentials
- **WHEN** a valid gated HTML-first run invokes ppt_flow build
- **THEN** it completes local delivery without reading Image2 environment variables

#### Scenario: Whole-page-only flag targets HTML
- **WHEN** an HTML refresh/build receives force-images, provider URL, or style-master option
- **THEN** CLI returns USAGE before remote prerequisite resolution or writes

#### Scenario: Reset confirmation names the wrong version
- **WHEN** confirm-run-version does not exactly equal the canonical target version
- **THEN** refresh returns USAGE without state, metadata, or generated-owner mutation

### Requirement: CLI observation does not mutate or invoke providers
Plain status, status JSON, state, and state JSON SHALL consume the read-only inspection path without healing state, migrating schema, recovering a journal, writing history/metadata/generated artifacts, or invoking a remote provider. They SHALL classify current identity before any potential repair writer. A pre-current schema, topology-only version identity, retired Controller/node, missing/retired marker, or unrecoverable current bytes SHALL retain one owner-provided typed next action and preserve state, history, journals, staging, target, and provider state. A safely repairable current-v5 record is repaired only by an owning mutation path after its fences validate; observation never triggers it.

#### Scenario: Plain observation sees an interrupted journal
- **WHEN** status or state JSON observes an interrupted journal
- **THEN** it reports the owner-provided recovery primary action
- **AND** it does not claim, recover, or modify the journal

#### Scenario: Historical observation preserves bytes
- **WHEN** status or state observes a pre-current or retired protocol record
- **THEN** it returns one bounded owner-issued typed next action
- **AND** it leaves state/history and all derived artifacts byte-identical

### Requirement: HTML and workflow transition diagnostics remain producer-owned
New reason kinds for renderer preparation, browser measurement, manifest drift, visual-review staleness, pipeline ownership, state replacement, and production-mode transition SHALL be emitted only by the responsible JS producer through `cli_error.mjs`. Each affected diagnostic SHALL expose exactly one existing producer-owned `next` action; this change SHALL not add a recreate/replacement/migrate action type, command, or parallel recovery surface. A `replacement_required` classification SHALL never be allowed to degrade through sanitizer fallback into `internal/report_internal`: its producer emits one valid final envelope. When direct facts classify the protocol as pre-current, retired, markerless, topology-only, or otherwise historically unsupported, that envelope SHALL use the existing `repair_prerequisite` action and say to preserve the old bytes and create a fresh explicit current run through `ppt_flow init`; fresh initialization starts normal current authoring and carries no old state, receipt, approval, provider authority, generated artifact, or execution evidence. It SHALL not tell the Agent or person to repair, replace, migrate, or resume old state. For a current-v5 record whose execution/evidence cannot be preserved, the owner selects one existing producer action from direct facts and likewise never exposes raw-YAML repair or an inferred continuation. MD/node specs SHALL consume category/reason/next semantics without copying the full envelope schema or interpreting shell prose. A retired migration identity may appear only as bounded negative input in the producer diagnostic; it SHALL not become a consumer-side route, field mapping, or continuation.

#### Scenario: Transition diagnostic keeps its producer ownership
- **WHEN** a current state-owned transition rejects source/state identity or a stale confirmation
- **THEN** its producer emits the registered diagnostic envelope and bounded next action
- **AND** the Controller consumes that action without parsing prose or reconstructing migration semantics

#### Scenario: Historical diagnostic directs a fresh start without inherited authority
- **WHEN** a CLI-facing owner rejects an unsupported historical source/state protocol
- **THEN** the valid final diagnostic exposes exactly one existing `repair_prerequisite` action whose default preserves old bytes and directs fresh explicit initialization with no inherited state, receipt, approval, provider authority, generated artifact, or execution evidence
- **AND** sanitizer does not fall back to `internal/report_internal` and the diagnostic does not emit a recreate/replacement/migrate action value, action menu, raw-state edit, or recovery command

## REMOVED Requirements

### Requirement: Legacy-to-HTML migration has preview and exact apply commands
**Reason**: The markerless/legacy source-to-HTML path, its top-level command, scratch owner, old-side modes, confirmation nodes, and receipt continuation are intentionally unsupported.

**Migration**: Recreate unsupported old runs or use the current state-owned production-mode transition from a valid explicit source.
