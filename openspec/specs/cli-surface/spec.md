## Purpose

Define the producer contract for every registered direct Node CLI under `PPTMAKER_FRAMEWORK/scripts/`: entry discovery, output transactions, success and JSON channels, bounded actionable failure diagnostics, secret-safe boundaries, and exhaustive return auditing. It defines `ppt_flow.mjs` as the fixed 15-command unified entry point.
## Requirements
### Requirement: CLI surface preserves command names

The `ppt_flow` CLI SHALL expose exactly 15 top-level commands: the existing `doctor`, `init`, `status`, `approve`, `style-master`, `validate`, `pilot`, `build`, `refresh`, `new-version`, `test`, `state`, `slides`, and `migrate-html`, plus `image2`. Existing command arguments remain compatible. `image2` SHALL expose only closed `plan`, `authorize`, `generate`, `accept`, `use-html`, `cleanup`, and unknown-submit resolution operations for marked HTML-first runs; it is the sole modern refinement CLI entry. `migrate-html` SHALL expose closed `preview` and `apply` operations and SHALL not mutate a source version in place.

#### Scenario: Help lists the complete surface

- **WHEN** `ppt_flow --help` runs
- **THEN** all 15 command names, including `image2`, are listed once

#### Scenario: Existing init invocation remains valid

- **WHEN** Agent runs `ppt_flow init deck_demo --deck-type keynote --style dark-executive`
- **THEN** a run bundle is created using the current HTML-first default contract

### Requirement: ppt_flow delegates to capability scripts

`ppt_flow.mjs` SHALL delegate bundle management, environment checks, state, slide transactions, HTML migration, and the selected production branch to owning Phase interfaces or categorized shared CLI adapters. It SHALL route HTML Stage 1-5 through the Phase-3 interface and markerless production/maintenance through the Phase-5 legacy adapter. It SHALL keep orchestration/renderer logic out of the command router, probe the canonical marker before branch-specific readiness or option handling, and import no Phase private path or direct executable.

#### Scenario: HTML build routes to the HTML adapter

- **WHEN** a marked run invokes `ppt_flow build`
- **THEN** `ppt_flow` delegates through unified orchestration to the HTML Stage-2/3 capability scripts
- **AND** does not delegate to style-master or Image2 generation

#### Scenario: Legacy style command retains its owner

- **WHEN** a markerless run invokes `ppt_flow style-master`
- **THEN** `ppt_flow` delegates to `generate_style_master.mjs` rather than implementing it inline

### Requirement: Uses commander for CLI

`ppt_flow.mjs` SHALL use the `commander` npm package for argument parsing and subcommand routing. Hard failures originating from commander (unknown command, missing required options/arguments) SHALL be routed through the JSON failure envelope with `code` `USAGE` (see Requirement: Commander errors are mapped through the envelope), not through commander's default prose-only exit.

#### Scenario: CLI parses a subcommand and its flags

- **WHEN** `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs init deck_demo --deck-type keynote --style dark-executive` is run
- **THEN** commander parses `init` as the subcommand and the options, routing to the init handler

### Requirement: CLI hard failures emit a JSON envelope on stderr

On any hard failure that causes `ppt_flow.mjs` to exit non-zero, the process SHALL write exactly one failure envelope as the **last non-empty line of stderr**, formatted as a single-line JSON object. Required fields: `ok` (boolean `false`), `code` (non-empty string), `message` (non-empty string), `hint` (non-empty string), `where` (non-empty string). Allowed `code` values for this capability SHALL be exactly: `UNCAUGHT`, `USAGE`, `GATE_BLOCKED`, `TITLE_REVIEW_REQUIRED`, `STATE_CORRUPTED`, `FAILED`. Emitting only prose without this JSON line is forbidden. Emitting more than one failure envelope for a single externally invoked process is forbidden. An MD Controller SHALL recover the envelope by taking the last non-empty stderr line and calling `JSON.parse`.

Successful paths, including `--help` and successful command completion, SHALL NOT emit a failure envelope.

#### Scenario: Uncaught exception during startup or dispatch

- **WHEN** `ppt_flow.mjs` throws before or during command dispatch
- **THEN** the process exits non-zero with `code` `UNCAUGHT`
- **AND** the last non-empty line of stderr is JSON with `ok: false` and non-empty `message`, `hint`, and `where`

#### Scenario: Unknown subcommand

- **WHEN** Agent runs `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs nosuch`
- **THEN** exit is non-zero with `code` `USAGE`
- **AND** the last non-empty line of stderr is parseable JSON with `ok: false`

#### Scenario: Invalid style preset on init

- **WHEN** Agent runs `init` with an unknown `--style`
- **THEN** exit is non-zero with `code` `USAGE`
- **AND** `hint` lists allowed presets without mutating frozen arrays
- **AND** stderr contains exactly one final JSON object with `ok: false`

#### Scenario: Full-page title edit requires review

- **WHEN** a title refresh affects a `full-page` slide without current reviewed evidence
- **THEN** exit is non-zero with `code` `TITLE_REVIEW_REQUIRED`
- **AND** `hint` gives the selected pilot and approval path

#### Scenario: Subprocess failure is wrapped as FAILED

- **WHEN** a `ppt_flow` command receives a non-zero delegated child result
- **THEN** `ppt_flow` exits non-zero
- **AND** preserves a valid child exit status, falling back to `1` when no valid status exists
- **AND** the final visible envelope uses `code` `FAILED` unless a more specific parent-level code applies
- **AND** useful child message/hint context is preserved without forwarding a second JSON envelope

#### Scenario: Help does not emit failure envelope

- **WHEN** Agent runs `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs --help`
- **THEN** exit is `0`
- **AND** stderr does not end with a JSON object whose `ok` field is `false`

### Requirement: Commander errors are mapped through the envelope

`ppt_flow.mjs` SHALL enable commander `exitOverride` (or equivalent) so that unknown commands and missing required arguments do not bypass the JSON envelope path. Such failures SHALL use `code` `USAGE`.

#### Scenario: Missing required init flags surface as USAGE

- **WHEN** Agent runs `init` without required `--deck-type` / `--style` such that commander rejects the invocation
- **THEN** exit is non-zero with `code` `USAGE`
- **AND** the last non-empty line of stderr is parseable failure JSON

### Requirement: Frozen preset arrays are never mutated in place

`ppt_flow.mjs` SHALL NOT call in-place mutators (`.sort`, `.reverse`, `.splice`) on imported `Object.freeze` arrays such as `STYLE_PRESETS`. Display/sort SHALL use a shallow copy (for example `[...STYLE_PRESETS].sort()`).

#### Scenario: doctor starts without freeze TypeError

- **WHEN** Agent runs `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs doctor`
- **THEN** stderr does not contain `Cannot assign to read only property`
- **AND** env-check is invoked (overall exit may still be non-zero if credentials are missing)

### Requirement: state is registered inside main before parse

`ppt_flow.mjs` SHALL register the `state` subcommand inside `main()` on the same `Command` instance passed to `parseAsync`, and SHALL register it before `parseAsync` runs. Module-top-level registration that references `main`'s local `program` is forbidden.

#### Scenario: state appears in help

- **WHEN** Agent runs `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs state --help`
- **THEN** help text for `state` is shown
- **AND** the process does not throw `ReferenceError: program is not defined`
- **AND** exit is `0` without a failure envelope

### Requirement: Pilot uses preview readiness and does not waive gates

`ppt_flow pilot` SHALL classify the run before readiness. For markerless legacy, preview readiness SHALL remain structure plus style master, gates SHALL not be required or mutated, and Stage 2 SHALL receive `--preview`. For `html-first-v1`, pilot SHALL require structure plus valid local HTML source/runtime inputs but no style master and no approved gates; it SHALL compose production-equivalent review artifacts only and SHALL not publish Stage 4/PPTX. Neither branch SHALL write `waived` to unlock preview. Full build SHALL require that branch's current authoritative gate evidence.

#### Scenario: HTML preview runs while gates are pending

- **WHEN** a valid HTML-first run has pending content/visual gates
- **THEN** pilot produces review evidence without style master or provider setup
- **AND** Stage 4 remains blocked

#### Scenario: Legacy preview behavior remains compatible

- **WHEN** a markerless run has a style master and pending gates
- **THEN** pilot may run legacy Stage 2 under preview readiness
- **AND** does not mutate gate fields

### Requirement: Pilot accepts --force-images and skips by default

`ppt_flow pilot` SHALL retain `--force-images` for markerless legacy decks: without it existing current pilot images are skipped, and with it selected legacy images regenerate. For `html-first-v1`, `--force-images` SHALL fail with `USAGE` before readiness/writes because HTML preview freshness is fingerprint-driven; callers SHALL use the HTML preview/rebuild selector rather than a provider-generation flag.

#### Scenario: Legacy pilot skips existing images by default

- **WHEN** markerless pilot images exist and pilot runs without `--force-images`
- **THEN** legacy Stage 2 skips those current files

#### Scenario: HTML pilot receives force-images

- **WHEN** a marked HTML-first run invokes pilot with `--force-images`
- **THEN** the command fails before writes/provider setup with the HTML preview next action

### Requirement: --only accepts friendly slide selectors

`ppt_flow` paths that accept `--only` (including `pilot`) SHALL use the shared selector contract owned by `slide-identity-and-ordering` and used by `pipeline-orchestration`. All tokens in one invocation SHALL resolve against one current plan snapshot as per-token bindings containing the original token, formal slide ID, current position, and `matched_by`. The `--only` caller MAY deduplicate repeated formal IDs for execution after retaining binding evidence; the shared resolver SHALL NOT silently deduplicate them. Unknown or ambiguous selectors SHALL fail with the standard JSON envelope whose bounded hint/evidence lists available or matching `position + slide_id + title` tuples.

#### Scenario: Page number selects a slide

- **WHEN** `--only 3` is passed and the third plan entry has ID `UXGap`
- **THEN** pilot or Stage 2 targets formal ID `UXGap`

#### Scenario: Spoken mnemonic selects a slide

- **WHEN** `--only "UX gap"` is passed and formal ID `UXGap` exists
- **THEN** the command targets `UXGap`

#### Scenario: Unknown selector lists current pages

- **WHEN** `--only slide_03` matches nothing
- **THEN** the command exits non-zero with an envelope
- **AND** its bounded diagnostic identifies real current positions, formal IDs, and titles from `slide_plan.json`

#### Scenario: Unknown selector lists ids

- **WHEN** `--only slide_03` matches nothing
- **THEN** the command exits non-zero with an envelope
- **AND** `hint` includes real ids from `slide_plan.json`

#### Scenario: Repeated selectors retain resolution evidence

- **WHEN** one `--only` invocation contains multiple tokens that resolve to the same formal ID by different branches
- **THEN** selector output retains one ordered binding per token and each `matched_by`
- **AND** the pipeline may execute the formal ID once without changing the shared resolver result

### Requirement: doctor forwards optional --smoke

`ppt_flow.mjs doctor` SHALL accept `--smoke` and forward it to `env-check.mjs`. `--smoke` SHALL imply Image2 readiness, so the old invocation remains valid without also specifying `--image2`. Without `--smoke` and without `--probe-vendors`, doctor SHALL make no Image2 network call; default doctor SHALL run base readiness only unless `--image2` is present. `--image2 --smoke` MAY be accepted as a redundant explicit combination.

#### Scenario: doctor --smoke flag is accepted

- **WHEN** Agent runs `ppt_flow.mjs doctor --smoke`
- **THEN** the flag is passed through to env-check
- **AND** help text documents that it includes Image2 presence plus one live first-vendor probe

#### Scenario: default doctor is local only

- **WHEN** Agent runs `ppt_flow.mjs doctor` without Image2/live flags
- **THEN** the command delegates only base readiness
- **AND** it does not require credentials or make an Image2 network call

### Requirement: doctor forwards optional --probe-vendors

`ppt_flow.mjs doctor` SHALL accept `--probe-vendors` and forward it to `env-check.mjs`. `--probe-vendors` SHALL imply Image2 readiness, so the old invocation remains valid without also specifying `--image2`. Help text SHALL document that it probes every resolved Image2 vendor and prints a channel report, distinct from `--smoke`, which probes only the first. The top-level command inventory SHALL remain unchanged. Passing both `--smoke` and `--probe-vendors` SHALL be rejected as USAGE; `--image2` MAY accompany either live flag.

#### Scenario: doctor --probe-vendors flag is accepted

- **WHEN** Agent runs `ppt_flow.mjs doctor --probe-vendors`
- **THEN** the flag is passed through to env-check
- **AND** help text documents the implied Image2 presence checks and all-vendor live report

#### Scenario: live flags remain mutually exclusive

- **WHEN** Agent passes both `--smoke` and `--probe-vendors`
- **THEN** doctor exits non-zero with the existing usage/envelope authority
- **AND** no live provider request is started

#### Scenario: explicit Image2 plus one live flag is allowed

- **WHEN** Agent passes `--image2 --probe-vendors`
- **THEN** the redundant Image2 flag does not cause a usage failure or duplicate presence checks

### Requirement: state prints a where-am-I resume card

`ppt_flow.mjs state` human output and successful `--json` output SHALL retain the whole-session where-am-I card and SHALL classify the canonical production marker before state interpretation. The card SHALL expose non-empty `workflow_summary` and `suggested_next`, exact `pipeline`, and `state_present`. When durable state exists it SHALL retain active `playbook`, `current_node`, current-node status, optional `waiting_for`/`note`, gates, and `playbook_stack`. For a historical markerless deck without state it SHALL expose legacy-maintenance ownership through a non-persisted compatibility card, leave absent execution fields explicitly null/not-active, and SHALL not create `_state/state.yaml`. When the exact migration target receipt exists but its source execution handoff is absent, state/status SHALL expose `migration_handoff_pending: true`, source/target version, and resume guidance without writing or leaking receipt SHAs/paths; all other outputs use false/null.

`state --recover-gate-journal <owner-token>` SHALL be a closed HTML-only repair operation requiring the exact token previously shown by plain state/status. `state --record-delivery-review <proceed|repair|redirect> [--reason <text>]` SHALL be the only public publication route for `html-delivery-review`; it SHALL derive current evidence through the deep module, require reason for repair/redirect, forbid it for proceed, and accept no evidence override. Both operations SHALL be mutually exclusive with `--json`, `--check-gates`, and each other and SHALL emit no ordinary resume card until their transaction completes. Markerless runs SHALL reject both before writes with branch-inapplicable guidance.

For HTML-first, human output and top-level JSON `html_reviews` SHALL expose the exact bounded snapshot: content/visual objects with `decision: pending|approved|waived` and `freshness: current|stale|missing|invalid`; content `review_required` boolean; visual sorted `outstanding_recipe_keys` and `outstanding_slide_ids`; delivery with `freshness: current|stale|missing|invalid`, `decision: null|proceed|repair|redirect`, and `reason_present` boolean; reset with `status: absent|deletion-pending|complete`, `ownership: none|active|waiting|recoverable|uncertain|invalid`, and nullable `retry_after_ms`; and journal `status: absent|active|uncertain|recoverable-abort|recoverable-mirror|recoverable-cleanup|recoverable-reset-yield|invalid|forbidden` plus optional `owner_token` of exactly 64 lowercase hex when non-absent. Plain state/status SHALL not expose reset IDs/tokens, claim timestamps, bound SHAs/paths/raw owner data, or perform recovery. For markerless compatibility, `html_reviews` SHALL be null and pipeline SHALL be exact `legacy-image2-first`; HTML uses exact `html-first-v1`.

Suggested-next SHALL be waiting-first, then journal conflict/repair, then owning stale/missing review or delivery action, and SHALL never present unavailable Phase 4 as required debt after complete delivery. Card construction SHALL remain in the shared state module so `status` consumes the same semantics without mutating state. Deck resolution SHALL use `deckRoot(resolve(runDir))`. The complete CLI surface SHALL remain exactly 14 commands.

#### Scenario: HTML resume card exposes outstanding review

- **WHEN** an HTML-first run has current content approval but stale page evidence for two slides
- **THEN** state output identifies the HTML pipeline and the two sorted outstanding slide IDs
- **AND** suggested-next names the visual-review path rather than Image2 refinement

#### Scenario: Complete HTML card omits Phase-4 debt

- **WHEN** current delivery, notes, gates, and `html-delivery-review: proceed` verify
- **THEN** workflow summary reports a complete deliverable
- **AND** suggested-next does not require lifecycle 4 or create optional-refinement state

#### Scenario: Markerless state card does not seed execution

- **WHEN** `state` inspects a historical markerless deck without `_state/state.yaml`
- **THEN** output identifies markerless legacy-maintenance ownership and `state_present: false`
- **AND** no state file is written and no active node is fabricated

#### Scenario: Interrupted journal is observable but not healed by plain state

- **WHEN** plain state sees new authoritative state with the old metadata mirror
- **THEN** `html_reviews.journal.status` is `recoverable-mirror`
- **AND** state emits no journal or metadata write

#### Scenario: Cross-host journal is explicitly recovered

- **WHEN** the Controller has shown an uncertain journal, obtained human confirmation that its owner stopped, and invokes `state --recover-gate-journal` with the exact current token after 300000 ms
- **THEN** CLI applies only the exact recovery matrix and exits with bounded recovered/blocked status
- **AND** it does not create a content/visual decision

#### Scenario: Recovery token is stale or owner is active

- **WHEN** the token mismatches, journal changed, minimum age is unmet, or same-host PID is active
- **THEN** recovery fails with `CONFLICT` or repair-required evidence and changes no store

#### Scenario: Uncertain owner diagnostic requires a human

- **WHEN** state/check-gates/build cannot automatically recover an uncertain journal
- **THEN** the producer-owned next action marks human confirmation required and carries the opaque token for the Controller
- **AND** does not tell the human to edit `_state` or invent approval

#### Scenario: Delivery review decision is recorded

- **WHEN** the Controller invokes `state --record-delivery-review repair --reason <text>` after showing current delivery
- **THEN** the command publishes one current evidence-bound repair decision
- **AND** status remains incomplete and routes to the owning repair node

#### Scenario: Delivery review targets legacy run

- **WHEN** markerless state receives `--record-delivery-review`
- **THEN** it fails before state writes and points to legacy controller review semantics

#### Scenario: Waiting state remains first

- **WHEN** durable state has a non-empty current-node `waiting_for`
- **THEN** `suggested_next` surfaces that wait before artifact-based heuristics

#### Scenario: State resolves deck via deckRoot

- **WHEN** Agent supplies a version run directory under `3_versions/vN`
- **THEN** state resolves the deck through `deckRoot(resolve(runDir))`

### Requirement: status surfaces playbook position and lesson count

`ppt_flow.mjs status` SHALL classify the canonical marker before reading branch-specific state/artifacts and SHALL reuse the same non-mutating resume-card projection and exact `html_reviews` enums as `state`. With durable state, human and JSON output SHALL retain `playbook` and `current_node`; an HTML-first run SHALL additionally expose the same `pipeline`, `state_present`, freshness/outstanding coverage, journal status, delivery-review decision, workflow summary, and completion semantics. A historical markerless deck without state SHALL report `state_present: false` and legacy-maintenance ownership without healing/seeding `_state`; it SHALL not silently claim an active playbook/node. A complete current HTML delivery SHALL be complete without any Phase-4 record or action.

Status SHALL retain the `Lessons` line and JSON `lessons_count`, counting files in deck-root `_lessons/` except `README.md` without invoking `lessons.mjs` as a subprocess. Missing/empty means zero/`none`; positive counts retain the review hint.

#### Scenario: Status shows lesson count when lessons exist

- **WHEN** Agent runs status on a deck with two lesson files excluding README
- **THEN** human output shows `Lessons: 2` with the review hint
- **AND** JSON includes `lessons_count: 2`

#### Scenario: Status shows no lessons

- **WHEN** `_lessons/` is absent or contains no counted files
- **THEN** human output shows `Lessons: none`
- **AND** JSON includes `lessons_count: 0`

#### Scenario: Status shows durable playbook position

- **WHEN** a run has usable `_state/state.yaml`
- **THEN** human and JSON output include its active playbook and current node

#### Scenario: HTML status exposes evidence freshness

- **WHEN** an HTML run has stale content, one uncovered recipe key, and no delivery review
- **THEN** status exposes each condition through the shared HTML review projection
- **AND** does not reduce them to metadata scalar gate values

#### Scenario: Markerless status is non-writing

- **WHEN** a historical markerless deck lacks `_state/state.yaml`
- **THEN** status reports legacy compatibility without creating state or inventing an execution pointer

### Requirement: approve dual-writes metadata and _state gates

`ppt_flow approve <runDir> <gate>` SHALL classify the run before validating approval evidence. For markerless legacy, existing metadata `content_gate|visual_gate` and `_state.gates.content|visual` compatibility writes/reads SHALL remain and HTML approval SHALL never overwrite them. For `html-first-v1`, content and visual approval/waiver SHALL require no reset pending plus the exact current-reset hash of an `approvable: true` plan covering every outstanding evidence item; scoped/incomplete/pre-reset plans SHALL fail and list missing/stale evidence. Successful publication SHALL write one version-scoped/current-reset `html-content-review` or `html-visual-review` record under authoritative `_state`, update only `_state.gates.html_content|html_visual` plus matching `_state.gates.html_content_run_version|html_visual_run_version`, then update only metadata `html_content_gate|html_visual_gate` plus matching `html_content_gate_run_version|html_visual_gate_run_version` through the recoverable journal protocol. These HTML fields are compatibility/status mirrors; they SHALL use status `pending|approved|waived`, exact normalized run version, and SHALL never satisfy legacy or HTML readiness by themselves. A waiver SHALL require a reason accepted by the shared 1024-byte `normalizeHumanReason` rule and the same complete current-reset plan. Ambiguous or unrecoverable partial writes SHALL fail closed.

#### Scenario: HTML visual approval binds current evidence

- **WHEN** Agent approves visual with the exact current HTML review-plan hash
- **THEN** authoritative current-version visual evidence is published before mirrors are synchronized
- **AND** the record binds current preview/fingerprint evidence

#### Scenario: HTML waiver omits a reason

- **WHEN** Agent requests an HTML gate waiver without an explicit reason
- **THEN** approval fails without changing authoritative evidence or mirrors

#### Scenario: HTML scoped plan is incomplete

- **WHEN** approval supplies a current hash whose plan is non-approvable because other evidence is outstanding
- **THEN** approval fails, identifies the missing IDs/coverage, and writes neither state nor mirrors

#### Scenario: Legacy approval remains compatible

- **WHEN** Agent approves a markerless legacy gate
- **THEN** existing metadata and `_state.gates` values remain synchronized

#### Scenario: HTML approval coexists with approved legacy version

- **WHEN** one deck has markerless legacy gate scalars and an HTML version is approved
- **THEN** HTML publication changes only `html_*` mirror fields and authoritative HTML evidence
- **AND** legacy `content_gate|visual_gate` plus `_state.gates.content|visual` remain byte-semantically unchanged

### Requirement: Title refresh routes by the affected slides' resolved modes

`ppt_flow refresh --kind title` SHALL classify the canonical marker and retain `--only <ids>|--all` selector semantics. For HTML-first, header text is renderer-owned visible content: the command SHALL refresh Stage 1, locally rebuild affected HTML/final-slide review output, validate overflow, stale content approval when its fingerprint changes, and preserve visual approval when the page visual dependency fingerprint is unchanged. It SHALL reject legacy force/reuse/profile options. It SHALL not publish Stage 4 until current content/visual evidence exists; after exact content review, repeating or continuing the controller path SHALL rebuild ordered delivery without remote work. For markerless legacy, existing render-mode routing, selector-free body-lock restriction, `TITLE_REVIEW_REQUIRED`, force-pilot/header evidence, and reviewed-image reuse SHALL remain.

#### Scenario: HTML title changes

- **WHEN** one marked slide title changes
- **THEN** local review pixels are rebuilt, content evidence becomes stale, and visual evidence remains current if visual dependencies are unchanged
- **AND** no Image2/header-review route is selected

#### Scenario: Legacy full-page title changes

- **WHEN** a markerless selected title belongs to full-page and lacks current header review
- **THEN** existing `TITLE_REVIEW_REQUIRED` and exact force-pilot action remain

### Requirement: Existing approve command records header review evidence

`ppt_flow approve <run-dir> header` SHALL be explicitly markerless-legacy-only. For markerless runs it SHALL retain current pilot/provenance checks, version-scoped `nodes.header-review.by_version`, matching-profile merge/partial coverage, stale rejection, and ID-plus-reason waiver behavior without changing content/visual metadata gates. For HTML-first, it SHALL fail before readiness/artifact/state writes with branch-inapplicable guidance to `approve ... visual --plan-hash`; HTML evidence SHALL never enter `header-review`.

#### Scenario: Legacy partial header batches merge

- **WHEN** two markerless current pilot batches have matching fingerprint/profile
- **THEN** their reviewed IDs merge under the same version record

#### Scenario: HTML run approves header

- **WHEN** a marked run invokes `approve ... header`
- **THEN** CLI writes no legacy evidence and points to the current HTML visual review path

### Requirement: Build preserves reviewed full-page images

For markerless legacy, current header evidence SHALL retain reviewed/accepted full-page image preservation: default force conflicts with reviewed bytes, `build --reuse-images` preserves matching reviewed images and generates only missing/unreviewed ones, and profile drift requires new pilot/review. For HTML-first, currentness SHALL come from effective composition fingerprints/manifests; `--reuse-images`, legacy resolution/model/provider options, and reviewed legacy image evidence SHALL be rejected before writes. HTML build SHALL reuse current immutable effective objects automatically and SHALL never treat review-only forced-fallback bytes as delivery.

#### Scenario: Legacy reviewed build uses reuse

- **WHEN** markerless header evidence/profile/images are current
- **THEN** `build --reuse-images` preserves those images and fills only missing legacy output

#### Scenario: HTML build receives reuse-images

- **WHEN** a marked run invokes build with `--reuse-images`
- **THEN** the command rejects the legacy-only option before production writes

### Requirement: Supported standalone CLIs obey the failure envelope constitution

Every registered standalone executable under `PPTMAKER_FRAMEWORK/scripts/` SHALL, on hard failure, exit non-zero and write exactly one machine-parseable failure envelope as the final non-empty line of its own stderr. The envelope SHALL contain `ok: false`, stable `code`, non-empty `message`, non-empty `hint`, and non-empty `where`. Human-readable diagnostics MAY precede the envelope. Library imports and successful/help paths SHALL NOT emit failure envelopes.

Every executable SHALL expose `--help`, exit zero for help, and list its supported long options so documentation checks have a stable command contract.

#### Scenario: bundle layout usage failure is machine-readable

- **WHEN** `bundle_layout.mjs` is invoked with `--structure-only` but without `--check`
- **THEN** it exits non-zero
- **AND** the final non-empty stderr line is a valid failure envelope with `code: USAGE`

#### Scenario: standalone stage usage failure is machine-readable

- **WHEN** a standalone Stage script is invoked without required arguments
- **THEN** it exits non-zero
- **AND** the final non-empty stderr line is a valid failure envelope naming that script in `where`

#### Scenario: imported module does not terminate the process

- **WHEN** a stage module is imported by a test or orchestrator
- **THEN** the shared CLI wrapper is not executed
- **AND** the module remains usable as a library

#### Scenario: Library-only module is not advertised as an executable

- **WHEN** executable inventory is compared with direct-entry guards and shebangs
- **THEN** `image_api_client.mjs` and `visual_config.mjs` are classified as libraries
- **AND** library-only files do not carry a misleading executable shebang or failure-probe obligation

#### Scenario: standalone help is side-effect free

- **WHEN** any registered executable is invoked with `--help`
- **THEN** it exits zero, lists supported options, and performs no production writes or network calls
- **AND** emits no failure envelope

### Requirement: CLI envelope tests cover the registered executable inventory

The test suite SHALL maintain the exact registered inventory of **thirteen** executable `.mjs` entries: existing `bundle_layout.mjs`, `env-check.mjs`, `generate_style_master.mjs`, `make_contact_sheet.mjs`, `ppt_flow.mjs`, `stage1_build_inputs.mjs`, `stage2_generate_images.mjs`, `stage3_lock_headers.mjs`, `stage4_build_pptx.mjs`, `stage5_inject_notes.mjs`, and `unified_pipeline.mjs`, plus `stage2_render_html.mjs` and `stage3_compose_slides.mjs`. It SHALL compare this set with direct-entry guards/shebangs and probe help plus deterministic failure-envelope behavior for every entry. Libraries SHALL remain excluded; any inventory drift SHALL fail with exact names.

#### Scenario: HTML compositor lacks a failure probe

- **WHEN** `stage3_compose_slides.mjs` is executable but absent from the inventory tests
- **THEN** the CLI contract suite fails and names it

### Requirement: Delegated failures expose one parent envelope

When `ppt_flow.mjs` delegates to another compliant Node CLI, it SHALL stream child stdout and frame child stderr across arbitrary chunk boundaries while retaining at most the latest candidate final line, capped at 64 KiB. It SHALL relay preceding human-readable diagnostic lines, consume rather than forward a valid child final failure envelope, and emit exactly one parent envelope as the final non-empty stderr line. The parent envelope SHALL preserve useful child `message`/`hint` context while using the parent command's stable `where` and mapped code. If the final child line is oversized or not a valid envelope, the parent SHALL relay it and synthesize bounded fallback context rather than dropping diagnostics or buffering unbounded stderr.

#### Scenario: Child and parent both support envelopes

- **WHEN** a delegated Stage script exits non-zero with its own final envelope
- **THEN** the user-visible `ppt_flow` stderr contains the child's prose diagnostics but not its JSON line
- **AND** ends with exactly one `ppt_flow` failure envelope

#### Scenario: Delegated image job remains observable

- **WHEN** a long child command prints heartbeats or `i/N` progress on stdout
- **THEN** `ppt_flow` relays that output while the child runs
- **AND** envelope capture does not turn the job into a silent wait

#### Scenario: Child envelope is fragmented and has no newline

- **WHEN** a child's final JSON envelope is split across stderr chunks and EOF arrives without a trailing newline
- **THEN** the parent reconstructs and consumes that single envelope
- **AND** emits one parent envelope without leaking a partial JSON diagnostic

#### Scenario: Child fails with prose only

- **WHEN** a spawned child exits non-zero and its final stderr line is not a valid envelope
- **THEN** the parent relays all child diagnostics
- **AND** emits one fallback parent envelope containing useful final diagnostic context

#### Scenario: Child exits zero while emitting a failure envelope

- **WHEN** a delegated child exits `0` but its final stderr line is a valid `ok:false` envelope
- **THEN** the parent treats this as a child contract failure
- **AND** exits non-zero with exactly one parent envelope

#### Scenario: Child emits an oversized stderr line

- **WHEN** a child writes more than 64 KiB without a line delimiter
- **THEN** the parent relays the overflow without unbounded buffering
- **AND** emits one bounded fallback envelope if the child fails

### Requirement: Every non-zero framework CLI return includes a versioned actionable diagnostic

Every registered direct Node CLI under `PPTMAKER_FRAMEWORK/scripts/` that reaches a non-zero JS-controlled termination path after bootstrap SHALL write exactly one failure envelope as the last non-empty stderr line. Covered paths include normal non-zero return/exit, caught or uncaught runtime errors, rejected promises, dependency module-evaluation errors after bootstrap, and handled `SIGINT`/`SIGTERM`. Uncatchable termination such as ESM syntax/resolution/link failure before any module evaluates, `SIGKILL`, runtime/native abort or native fd output before handlers run, host power loss, or output-device failure is outside the emission guarantee. Existing required top-level fields (`ok:false`, `code`, `message`, `hint`, `where`) and the closed top-level code set SHALL remain unchanged. Repository CLIs migrated by this change SHALL additionally include `diagnostic.version: 1`, a bounded `category`, and `diagnostic.next` containing `action`, `requires_human`, and `default`. Parsers SHALL continue to accept legacy envelopes without `diagnostic`.

Each registered executable SHALL place the shared zero-dependency CLI bootstrap as its first static import using a literal entry query. During its own module evaluation the bootstrap SHALL read that token from `import.meta.url`, compare the normalized basename of `process.argv[1]` with the exact inventory token, and install the output/error/signal guard before later dependencies evaluate only for the matching direct entry; library/dependency imports SHALL remain inert.

Repository JS SHALL NOT bypass the transaction/collector with direct fd 1/2 writes, `/dev/stdout`/`/dev/stderr`, or inherited child output descriptors. The shared direct-entry guard SHALL transactionally capture stdout and stderr independently up to 1 MiB from installation until JS-controlled termination while continuing to drain overflow. Query bootstrap instances and ordinary helper imports SHALL share one `Symbol.for` process-global record. Wrapped stream writers SHALL preserve supported Node write overloads, callbacks, and boolean return behavior, and originals SHALL be restored exactly once before replay/commit. `emitCliError` SHALL register/replace the pending authoritative envelope inside the transaction rather than bypass it. On exit zero the guard SHALL replay captured output unchanged. On non-zero it SHALL discard ordinary captured prose/child envelopes and synchronously release only: (a) one explicitly registered, schema-validated, secret-safe JSON stdout failure report for a documented report mode, when applicable; (b) a bounded human stderr rendering derived solely from the sanitized final envelope; and (c) the one final stderr envelope. Incidental parseable JSON SHALL NOT qualify. Commit SHALL be re-entrancy guarded. Direct capture overflow SHALL fail closed with bounded `internal`/truncation evidence rather than replay partial output or report success.

Documented JSON commands SHALL call `setCliOutputMode("json")` immediately after parsing that mode and before output/progress. JSON report registration SHALL be rejected outside registered JSON mode. Human mode SHALL be the default.

The human rendering SHALL be a deterministic non-authoritative view containing at most code/message, `where`, retained sanitized issues as compact message + source/subject lines (up to the 20-issue wire cap), omitted-issue count, `next.default`, the first inspect locator, and a display-quoted safe invocation. It SHALL omit absent fields, SHALL NOT regenerate lineage or arbitrary prose, and SHALL use only the already-sanitized envelope. Its complete rendering SHALL be bounded to 20 KiB.

Long-running human-mode CLIs MAY stream live informational output only through shared `emitCliProgress(event, fields)`. Each event SHALL have a registered fixed template and allowlisted bounded fields. The API SHALL reject free-form messages and exception/provider/prompt/environment/child text. For direct execution, bootstrap SHALL render the fixed template. For a framework-collected child identified by a private parent-set environment flag, the API SHALL write a reserved single-line JSON progress frame to child stderr; the parent SHALL schema-validate known event/fields and locally render it, while suppressing unknown/malformed frames. The frame SHALL omit `ok:false`, SHALL NOT be parsed as an envelope, and SHALL NOT be exposed raw. Progress SHALL NOT be control authority. JSON modes SHALL suppress progress. Ordinary `console.*` output remains inside the transaction.

When JS knows structured context, the diagnostic SHALL include the applicable subject, editable source locator, stage/operation, reason, ordered lineage, delegated boundary, or bounded issues. Unknown facts SHALL be omitted rather than inferred. Invalid optional diagnostic input SHALL be dropped or bounded and SHALL NOT prevent emission of the valid minimal envelope. If JS can deterministically heal a format/schema defect, it SHALL heal and continue before returning failure.

#### Scenario: Aggregate failure remains readable to a human

- **WHEN** a sanitized aggregate diagnostic retains multiple issues and omits others
- **THEN** the human view lists retained issue message/location summaries within its bound
- **AND** states the omitted issue count before showing the next action

#### Scenario: Deterministic usage failure has a minimal diagnostic

- **WHEN** a registered CLI rejects missing, conflicting, or invalid arguments
- **THEN** it exits non-zero with one final envelope
- **AND** the envelope includes a v1 diagnostic with category `usage`
- **AND** `diagnostic.next` tells MD how to correct or inspect usage without fabricating source lineage

#### Scenario: Contextual Stage failure reports known lineage

- **WHEN** a Stage CLI fails while it knows the slide or artifact, source path, and pipeline stage
- **THEN** those facts are represented in the v1 diagnostic
- **AND** lineage is ordered from editable source toward the observed derived artifact when known
- **AND** the next action identifies source inspection or a prerequisite/rerun invocation instead of instructing edits to `_generated/`

#### Scenario: Direct CLI writes unsafe prose before failing

- **WHEN** a registered direct CLI writes stdout/stderr prose containing a sentinel and later exits non-zero
- **THEN** the transaction does not release that prose
- **AND** stderr contains only the deterministic safe human view followed by the final envelope

#### Scenario: Human-owned decision is explicit

- **WHEN** execution is blocked on visual review, content approval, or risk acceptance
- **THEN** `diagnostic.next.requires_human` is `true`
- **AND** the default or invocation does not imply permission for MD to fabricate approval

### Requirement: Diagnostic v1 is bounded, allowlisted, and shell-independent

The v1 formatter SHALL accept only these diagnostic fields and leaf shapes:

- `version`: integer `1`.
- `category`: one closed value from the category semantics table.
- `stage`, `operation`: optional tokens matching `^[a-z][a-z0-9_-]{0,63}$`.
- `subject`: optional `{kind,id?,field?}`; kind uses the token grammar.
- `source`: optional editable-source `{path,line?,column?}`; positions are positive safe integers.
- `reason`: optional `{kind,actual?,expected?}`; kind uses the token grammar and actual/expected are trusted bounded JSON scalars or arrays of at most 16 scalars, never arbitrary exception/prose/provider/environment values.
- `lineage`: optional ordered array of `{kind,path,stage?}` from source toward observation.
- `issues`: optional array of non-recursive `{message?,subject?,source?,reason?,lineage?}` leaves; a leaf cannot contain diagnostic/issues/next/delegated.
- `delegated`: optional `{invocation?,child_code?,child_where?}`.
- `next`: required `{action, requires_human, inspect?, invocation?, default}`.
- `omitted_count`: optional non-negative safe integer. `truncated`: optional boolean.

Unknown keys/values SHALL be dropped. Strings, arrays, source positions, issue/lineage counts, invocation arguments, and total serialized size SHALL be bounded with explicit truncation. Required `version/category/next` SHALL be retained first, followed by top-level context/delegation, complete issue leaves in input order, and top-level lineage. A partial issue SHALL NOT be emitted, required next/default SHALL NOT be dropped, and any reduction SHALL set `truncated:true`. If `version`, `category`, or a required `next` field is absent or invalid, formatting SHALL replace the nested object with a valid minimal `internal`/`report_internal` diagnostic.

Category semantics SHALL be: `usage`, `source_validation`, `structure`, `artifact`, `gate`, `environment`, `provider`, `delegated`, `interrupted`, `internal`.

`diagnostic.next` action semantics SHALL be: `fix_arguments`, `inspect`, `edit_source`, `repair_environment`, `repair_prerequisite`, `rerun`, `review`, `approve`, `report_internal`. `review` and `approve` SHALL require `requires_human:true`. A preferred invocation SHALL be `{program,args}` with a non-empty program and bounded string args assembled only from known credential-free values. It SHALL be omitted when any argument may contain a credential, prompt/body content, or other secret. A machine consumer SHALL execute it without a shell.

#### Scenario: Recovery path contains spaces and metacharacters

- **WHEN** a known recovery invocation targets a run directory whose path contains spaces or shell metacharacters
- **THEN** `program` and each argument remain separate JSON values
- **AND** executing the invocation does not interpolate the path as shell syntax

#### Scenario: Oversized diagnostic is safely reduced

- **WHEN** a failure contains more issues, lineage entries, arguments, or text than v1 permits
- **THEN** the CLI still emits a valid minimal envelope
- **AND** retained diagnostic data stays within configured bounds
- **AND** `truncated` and/or `omitted_count` reveals that evidence was reduced

### Requirement: The complete failure channel is secret-safe

Secret safety SHALL cover the entire externally visible failure channel: top-level envelope fields, deterministic human rendering, registered progress, direct output transactions, registered JSON failure reports, captured child output, and provider error summaries. New envelopes SHALL NOT emit stacks; parsers MAY tolerate and discard legacy stack fields. Top-level `message`/`hint` SHALL be bounded trusted templates populated only with allowlisted metadata, and `where` SHALL be a bounded code-location token. Raw `.env` content, API keys/tokens, authorization headers, prompt bodies, image bytes, raw provider request/response bodies, stacks, and unbounded child output SHALL NOT be copied into output.

Provider and child-process boundaries SHALL normalize unsafe failures into allowlisted metadata before formatting. Bounded fields such as `reason.actual`, `reason.expected`, and `next.default` SHALL NOT receive arbitrary exception messages, provider/environment values, prompts, or child output merely because those values fit their size limits.

#### Scenario: Provider failure does not expose payloads

- **WHEN** an image request fails after credentials and prompt content have been loaded
- **THEN** output MAY name stage, provider host/role, HTTP status, safe reason code, slide id, and artifact paths
- **AND** stdout/stderr do not contain credential, raw environment, prompt, provider-body, or stack sentinels

#### Scenario: Generic fallback receives a sensitive thrown message

- **WHEN** a CLI reaches its generic guard with a thrown/rejected value containing a secret sentinel
- **THEN** the final envelope uses a fixed safe summary and `internal` diagnostic
- **AND** its next step points MD to the known executable/code location and `report_internal`
- **AND** no top-level or nested field contains the thrown/rejected text

### Requirement: Direct-entry and return audits cover the observable CLI surface

`EXECUTABLE_INVENTORY` SHALL remain the explicit public direct-CLI registry. Tests SHALL recursively scan `PPTMAKER_FRAMEWORK/scripts/**/*.mjs` for direct-entry indicators, including a main guard based on `process.argv[1]`/`import.meta.url`, direct Commander parsing, or standalone-envelope installation. The detected candidate set SHALL exactly equal the executable inventory.

Every registered executable SHALL have an audit record for each applicable return category: help, deterministic usage failure, contextual hard failure, delegated hard failure, catchable interruption, prose success, and documented JSON success. An unsupported category SHALL have an explicit not-applicable reason. Non-zero probes SHALL verify one final v1 envelope; successful help/prose SHALL verify exit zero and no failure envelope; successful JSON SHALL verify exactly one parseable stdout value and no failure envelope. Fixtures SHALL be deterministic, temporary, and network-free.

#### Scenario: New direct-entry script is not registered

- **WHEN** a new `.mjs` gains a direct-entry main guard or direct CLI parser
- **AND** it is absent from `EXECUTABLE_INVENTORY`
- **THEN** the audit fails and names the candidate path

#### Scenario: Registered JSON-mode failure keeps both channels valid

- **WHEN** a documented JSON command explicitly registers and emits its schema-valid secret-safe failure report before exiting non-zero
- **THEN** stdout remains parseable according to that report contract
- **AND** stderr ends with exactly one v1 failure envelope

### Requirement: The CLI producer contract is discoverable during repository maintenance

Repository-root `AGENTS.md` SHALL route any Coding Agent that adds or changes a direct CLI, command, exit path, stdout JSON path, stderr diagnostic, delegated process boundary, or `cli_error.mjs` to `openspec/specs/cli-surface/spec.md`, active `cli-surface` deltas, and the shared helper. `PPTMAKER_FRAMEWORK/scripts/README.md` and the `cli_error.mjs` module header SHALL contain short pointers to the canonical main capability without duplicating schema details.

#### Scenario: Coding Agent begins a CLI-sensitive change

- **WHEN** the Agent follows repository-root maintenance instructions
- **THEN** it is routed to the main `cli-surface` capability and active deltas before editing
- **AND** that capability alone contains the complete producer obligations

### Requirement: ppt_flow preserves actionable diagnostics across command boundaries

Every `ppt_flow.mjs` command that exits non-zero under JS control SHALL emit exactly one final failure envelope with v1 diagnostic. Parent `code`, `message`, `hint`, `where`, and `next` remain authoritative. Parent summaries and next action SHALL be constructed from the known operation and allowlisted structured evidence, never copied from child top-level `message`/`hint`, child `next`, or prose. Only a supported v1 diagnostic from a registered framework child is eligible as evidence, and the parent SHALL sanitize it again before preserving safe child subject/source/reason/lineage/issues. A legacy envelope, unsupported/malformed diagnostic, or unregistered child SHALL use the minimal delegated fallback. The parent SHALL add flat delegated metadata and SHALL NOT relay or recursively nest the complete child envelope.

For a legacy or prose-only child, `ppt_flow` SHALL emit a safe minimal delegated diagnostic using known credential-free invocation/exit metadata. Every CLI-owned asynchronous or synchronous subprocess SHALL pipe/capture both output streams; no `stdio:inherit` child path may bypass the transaction. Framework-child spawns SHALL set the private delegated-progress flag. The parent SHALL capture each child stream independently up to 1 MiB while continuing to drain overflow. On child success it SHALL replay remaining non-frame output according to the existing success contract. On child failure it SHALL discard non-envelope prose from both streams and expose only the parent envelope. Capture overflow SHALL produce an explicit truncated delegated failure.

#### Scenario: Delegated Stage failure keeps causal evidence

- **WHEN** a child Stage exits with a v1 diagnostic naming source and slide lineage
- **THEN** the parent emits exactly one final envelope
- **AND** parent control fields and next action remain authoritative
- **AND** safe child causal evidence remains available with delegated child code/location

#### Scenario: Parent action overrides generic child recovery

- **WHEN** a child suggests a direct rerun but `ppt_flow` knows pilot review is required
- **THEN** parent `diagnostic.next` provides the pilot/review workflow
- **AND** child source/reason/lineage remain intact

### Requirement: The complete ppt_flow command surface has return-audit coverage

The command-return registry SHALL cover exactly the 15 registered top-level commands, including `image2`. Every command/subcommand/closed repair or evidence operation SHALL register applicable success/usage/validation/gate/conflict/stale/commit/internal return categories or an explicit not-applicable reason. `state --recover-gate-journal` SHALL cover mutual-exclusion/invalid-token/too-young/token-drift/active-owner/forbidden-SHA/successful-abort/mirror-complete/cleanup/exact-reset-yield returns and prove no approval creation. `state --record-delivery-review` SHALL cover invalid decision, required/forbidden reason combinations, reason control/UTF-8-size validation, markerless rejection, missing/stale/current evidence, journal/reset conflict, each typed decision success, and unsupported evidence overrides. `refresh --kind reset-html-production` SHALL cover explicit-versus-default flag detection, exact-version confirmation, markerless/unusable-state/gate-journal/reset-CAS/metadata-CAS/unsafe-owner conflicts, gate-journal race yield, new reset, live/waiting/dead/uncertain/invalid owner matrices at exact 60000/300000-ms boundaries, competing takeover CAS, same-reset resume, idempotent completed retry only without current-epoch authority, absent-owner no-reset-needed versus authority-loss epoch rotation, deletion failure with retained fence, and successful completion without approval creation. `slides` SHALL retain its operation-specific audit; `migrate-html preview|apply` SHALL cover complete/degraded preview, exact mode/hash acknowledgement, drift, decline, apply-journal mutual exclusion, automatic/confirmed recovery age-token-owner matrices, absent-target owned cleanup/full rerender, exact-target idempotent completion, conflicting target/foreign path denial, and zero-provider failures. Its closed refinement operations SHALL audit help, markerless rejection, current-delivery eligibility, plan/authorization drift, duplicate or unknown attempt handling, candidate identity, promotion conflict/recovery, cleanup ambiguity, and success; every applicable category shall have an explicit case or not-applicable reason. Set mismatch SHALL fail.

#### Scenario: Migrate command is not audited

- **WHEN** `migrate-html` is registered without preview/apply return cases
- **THEN** return audit fails and names the missing command/subcommands

#### Scenario: Image2 command is not audited

- **WHEN** `image2` is registered without its closed operation return cases
- **THEN** the return audit fails and names the missing command/operation

### Requirement: Active documented CLI examples use real flags

The documentation consistency suite SHALL extract active Node CLI examples from `bash`/`sh`/`shell`/`console` fenced blocks and inline code whose first executable token, after an optional prompt marker and environment assignments, is `node`. It SHALL join backslash continuations, ignore comment/output lines, require one analyzable Node invocation per logical command, identify the script and optional `ppt_flow` subcommand, and verify that every documented long option is present in the corresponding side-effect-free `--help` output. Intentionally non-executable pseudocode SHALL use `<!-- coherence:pseudocode reason="..." -->` immediately before that one example; the marker SHALL NOT exempt a whole file or directory.

#### Scenario: Stage script is documented with unsupported run-dir flag

- **WHEN** an active guide shows `stage3_lock_headers.mjs --run-dir ...` but the script help does not expose `--run-dir`
- **THEN** documentation validation fails with the source file, line, script, and unsupported flag

#### Scenario: Current ppt_flow command example is valid

- **WHEN** an active guide shows `ppt_flow.mjs build <run-dir> --resolution 2k --reuse-images`
- **THEN** validation resolves the `build` help surface
- **AND** confirms both long flags are supported

#### Scenario: Broad pseudocode exemption is rejected

- **WHEN** a marker lacks a reason, is not adjacent to an example, or attempts to exempt multiple examples
- **THEN** documentation validation fails with source file and line

### Requirement: ppt_flow slides exposes deterministic identity and order operations

`ppt_flow slides` SHALL expose `list`, `resolve`, `normalize`, `move`, `delete`, `insert`, and `apply-plan` subcommands backed by the shared slide-document and transaction interfaces rather than command-local Markdown rewrites. The canonical structure-editing target SHALL be one run-directory `slide-specifications.md`.

`list` SHALL display current `position + formal slide_id + title`; `resolve` SHALL return per-token bindings with formal IDs, current page metadata, and `matched_by` without mutation. `normalize`, `move`, `delete`, `insert`, and plan creation SHALL return the shared before/after transaction preview including canonical `plan_sha256` and SHALL write no source, version, state, or generated artifact. A new insertion SHALL require a caller-supplied complete slide block with an Agent-authored, historically available mnemonic ID; the CLI SHALL validate but SHALL NOT invent that ID.

`move`, `delete`, and `insert` apply SHALL require both `--apply` and `--plan-sha256 <confirmed-hash>` and SHALL refuse to apply if a newly canonicalized transaction differs from the confirmed preview. `apply-plan --apply` SHALL accept only a schema-valid, self-hash-valid plan from the current run directory's `_scratch/` boundary and SHALL enforce both its plan hash and base source hash. A bare mutating `--apply` SHALL fail closed rather than previewing and applying within one invocation. Structural apply SHALL use the Structural Versioning Path and publish the shared edit receipt without invoking a remote renderer. `normalize --apply` SHALL be the sole in-place exception, SHALL only correct heading projections, and SHALL still require its confirmed preview hash. Every subcommand SHALL support stable `--json` success output where applicable; human output SHALL remain a rendering of the same structured facts.

#### Scenario: List exposes both ways to refer to a page

- **WHEN** `ppt_flow slides list <run-dir>` runs on a valid source
- **THEN** each row includes current position, formal ID, and title
- **AND** no file is changed

#### Scenario: Move defaults to preview

- **WHEN** `ppt_flow slides move <run-dir> 7 --after 3` runs without `--apply`
- **THEN** it resolves target and anchor against one pre-edit snapshot and returns per-token bindings, before/after order, impact, and `plan_sha256`
- **AND** it does not create a version or write source

#### Scenario: Confirmed apply creates a structural version

- **WHEN** the same valid move is invoked with `--apply --plan-sha256 <preview-hash>` after confirmation
- **THEN** it creates and atomically publishes the next-version source through the structural transaction contract
- **AND** success output contains the confirmed plan hash, edit receipt, new run-directory locator, and any `needs_render` IDs

#### Scenario: Normalize apply does not create a version

- **WHEN** `ppt_flow slides normalize <run-dir> --apply --plan-sha256 <preview-hash>` corrects heading drift
- **THEN** only the current source heading projections change atomically
- **AND** no next version is created

#### Scenario: Insert has no Agent-authored identity

- **WHEN** an insert invocation supplies a slide block with an empty, invalid, reused, or missing ID
- **THEN** the command fails with a source-validation diagnostic
- **AND** does not generate a random mnemonic or create a version

#### Scenario: Bare structural apply is rejected

- **WHEN** `ppt_flow slides delete <run-dir> 7 --apply` omits a confirmed plan hash
- **THEN** the command fails without writing source, state, generated artifacts, or a visible version
- **AND** directs the caller to run the preview and submit its `plan_sha256`

#### Scenario: Plan hash changed after preview

- **WHEN** the command arguments or planner result produce a canonical hash different from `--plan-sha256`
- **THEN** the command fails even if `base_spec_sha256` still matches
- **AND** does not substitute or apply the unconfirmed transaction

#### Scenario: Structural apply does not authorize rendering

- **WHEN** apply publishes a target whose inserted or unverified retained IDs need raw renders
- **THEN** success output reports those IDs under `needs_render`
- **AND** the invocation makes no Image2 or future remote-render request

### Requirement: Structural CLI failures use the existing diagnostic authority

All non-zero `slides` outcomes SHALL use `cli_error.mjs` and the existing `cli-surface` envelope, bounded diagnostic, secret-safety, and output-transaction requirements. Deterministic structure facts SHALL use the existing diagnostic categories and fields by reference; this change SHALL NOT introduce a second error schema. Missing/mismatched plan hash, source hash mismatch, selector ambiguity, validation errors, and staging/publication failures SHALL identify known source/subject/operation lineage and provide an argument-safe next action without instructing edits to `_generated/`.

#### Scenario: Stale preview cannot be applied

- **WHEN** `apply-plan` receives a transaction whose base source hash no longer matches
- **THEN** it exits non-zero with exactly one standard final envelope
- **AND** the diagnostic identifies the canonical source and directs a fresh preview rather than rebasing

#### Scenario: Ambiguous selector needs a human choice

- **WHEN** a structural selector matches multiple pages
- **THEN** the final diagnostic contains bounded candidate facts and marks the choice as requiring human input
- **AND** no source or version is changed

#### Scenario: JSON preview remains valid on success

- **WHEN** a preview subcommand runs with `--json` and succeeds
- **THEN** stdout is one documented structured preview report
- **AND** no failure envelope or human progress text corrupts the JSON channel

### Requirement: Optional Git observation preserves the direct environment CLI contract

The direct `env-check.mjs` CLI SHALL append the advisory `git` record to the already-generic `env-check-v1` `checks[]` report. This is a producer-boundary change because it adds a child-process observation and public check record, but it SHALL NOT add a top-level JSON field, change the `env-check-v1` schema validator, alter READY/exit/failure-envelope semantics, or expose child output. The record SHALL use the existing `check`, `status`, `detail`, and `fix` fields only; it SHALL omit the optional `foundation` field so an advisory warning cannot affect foundation readiness.

`ppt_flow doctor` SHALL remain a text delegation of `env-check`; this change SHALL NOT add `ppt_flow doctor --json`, document that flag, or create a second JSON report route.

#### Scenario: Generic report schema accepts the advisory record

- **WHEN** direct `env-check --json` reports an advisory `git` check
- **THEN** the report validates as the existing `env-check-v1` schema
- **AND** its `git` record omits `foundation` and the report has no new top-level JSON field or Git-specific envelope schema

#### Scenario: Delegated doctor keeps its flag boundary

- **WHEN** a user runs `ppt_flow doctor --help`
- **THEN** the help does not list `--json`
- **AND** passing `--json` remains unsupported rather than silently creating a JSON delegation path

### Requirement: doctor forwards explicit Image2 readiness mode

`ppt_flow.mjs doctor` SHALL accept `--image2` and forward it to `env-check.mjs`. Help SHALL describe it as base checks plus offline Image2 presence checks, not a live provider probe. The change SHALL add no top-level command and SHALL keep doctor text-only; `ppt_flow doctor --json` remains unsupported. A delegated non-zero result SHALL continue to use the existing parent-envelope contract without exposing credential values.

#### Scenario: doctor --image2 is accepted

- **WHEN** Agent runs `ppt_flow.mjs doctor --image2`
- **THEN** the flag is passed through to env-check
- **AND** help explains that it checks Image2 presence without a network probe

#### Scenario: Image2 readiness failure is delegated safely

- **WHEN** delegated `env-check --image2` exits non-zero because credentials are missing
- **THEN** `ppt_flow doctor` preserves the existing delegated failure/envelope behavior
- **AND** stderr contains no API key value or provider body

### Requirement: HTML renderer and compositor CLIs are registered envelope-compliant executables

Direct `stage2_render_html.mjs` and `stage3_compose_slides.mjs` SHALL be Node ESM registered executables whose production interface accepts exactly required `--run-dir <vN>`, optional shared `--only <selectors>`, exact `--variant effective|forced-fallback`, and `--dry-run` in addition to side-effect-free `--help`. `effective` SHALL be the explicit default only when the flag is absent; review orchestration SHALL pass `forced-fallback` explicitly. The CLIs SHALL derive canonical plan/control/object/manifest paths internally from the validated run and SHALL accept no arbitrary input/output/manifest path, provider/base-url/model/style-master, browser channel/executable, or package-root override. They SHALL provide deterministic stdout and the existing one-final-JSON failure envelope. Diagnostics SHALL identify bounded slide/field/box/artifact/runtime phases without absolute paths, raw HTML, source prose, browser stack, or asset bytes.

#### Scenario: Renderer CLI help is audited

- **WHEN** executable inventory runs `--help`
- **THEN** each CLI exits zero without creating files or launching Chromium

#### Scenario: Caller attempts an arbitrary output manifest

- **WHEN** either direct CLI receives `--output`, `--manifest`, or another unsupported path override
- **THEN** it returns `USAGE` before validated-run creation or writes

#### Scenario: Pixel overflow fails

- **WHEN** direct composition detects overflow
- **THEN** stderr ends with one `FAILED` envelope carrying slide/field/measurement evidence and a local source/layout repair action

#### Scenario: Direct forced fallback is review-only

- **WHEN** a direct renderer/compositor invocation uses `--variant forced-fallback`
- **THEN** it may publish verified immutable review objects and deterministic receipts
- **AND** it does not replace HTML-page/final-slide delivery manifests or claim a current preview plan

#### Scenario: Direct dry-run writes nothing

- **WHEN** either direct CLI uses `--dry-run`
- **THEN** it publishes no object, manifest, plan, lock residue, or generated directory

### Requirement: Public HTML build and refresh commands route without provider flags

`ppt_flow validate`, preview, build, status, approve, slides, and refresh SHALL probe the source marker before branch-specific argument/readiness handling. HTML-first build SHALL use the local Stages 1-5 adapter. HTML refresh SHALL expose Local Slide Rebuild, Local Deck Rebuild, Notes-Only Refresh, structural materialization, and the exceptional full generated-owner recovery through existing command ownership or explicit closed `--kind` values; it SHALL reject legacy provider/model/resolution/style-master/`--force-images`/`--reuse-images` flags and never delegate to legacy image generation/style-master/header approval. Markerless behavior and flags remain backward compatible.

The only public canonical full-reset syntax SHALL be `ppt_flow refresh <run-dir> --kind reset-html-production --confirm-run-version <vN>`. It SHALL require exact normalized version equality and invoke the state-owned `resetHtmlProduction` interface with no caller-supplied reset/owner ID, path, lock, or manifest. This kind SHALL be mutually exclusive with explicitly supplied `--only`, `--all`, `--dry-run`, `--resolution`, `--provider`, `--base-url`, `--model`, every style/style-master option, force/reuse image flags, and every other refresh-kind-specific override. Parser defaults SHALL not count as supplied options or flow into reset; `--confirm-run-version` SHALL be rejected for every non-reset kind. Unsupported combinations SHALL return `USAGE` before state or filesystem writes. Markerless runs SHALL reject the kind as branch-inapplicable.

For a new reset the command SHALL atomically install its owner claim. For pending reset, a live same-host owner SHALL return `CONFLICT`; a dead same-host owner younger than 60000 ms SHALL return a bounded retry-after conflict; same-host proven-dead age at least 60000 ms MAY be claimed automatically; valid cross-host/PID-uncertain ownership younger than 300000 ms SHALL remain blocked, and at/after 300000 ms MAY be claimed only after the Controller's explicit no-active-writer confirmation represented by this exact destructive route. Invalid ownership SHALL fail closed. Every takeover SHALL retain the semantic reset ID and use state CAS to install a fresh internal owner claim before deletion. Success SHALL report only normalized run version, whether the transaction was `started|resumed|already-complete`, and that local rebuild plus fresh content/visual/final review is required; it SHALL not expose reset/owner IDs, old evidence hashes, or claim rebuild completion.

An absent generated owner SHALL not by itself make reset valid. When no current-reset authoritative review/delivery or HTML Stage-4/5 receipt exists, reset SHALL return branch-appropriate no-reset-needed guidance and ordinary preview may rebuild. When such authority exists, reset SHALL rotate a new epoch and complete with deletion already satisfied. Likewise `complete + owner absent` is `already-complete` only before any authority is published in that completed epoch; if authority was later published and the owner then disappeared, the command SHALL start a new reset rather than return idempotent success.

#### Scenario: HTML build without credentials

- **WHEN** a valid gated HTML-first run invokes `ppt_flow build`
- **THEN** it completes local delivery without reading Image2 environment variables

#### Scenario: Legacy-only flag targets HTML

- **WHEN** an HTML refresh/build receives `--force-images`, provider URL, or style-master option
- **THEN** CLI returns `USAGE` before remote prerequisite resolution or writes

#### Scenario: Reset confirmation names the wrong version

- **WHEN** `--confirm-run-version` does not exactly equal the canonical target version
- **THEN** refresh returns `USAGE` without state, metadata, or generated-owner mutation

#### Scenario: Reset resumes after deletion crash

- **WHEN** the target version already has `html-production-reset.status: deletion_pending`
- **THEN** the command continues that reset ID through mirror/deletion/completion and reports `resumed`

#### Scenario: Explicit parser defaults do not fake a flag conflict

- **WHEN** reset is invoked without a user-supplied resolution/provider/style option but the command parser has defaults for ordinary refresh
- **THEN** those defaults do not enter reset validation or the reset interface

#### Scenario: Live reset owner blocks a second command

- **WHEN** a second reset command observes a proven-live same-host owner
- **THEN** it returns `CONFLICT` without changing ownership, metadata, generated bytes, or completion status

#### Scenario: Reset is retried after completion

- **WHEN** the same version has a complete reset, no canonical generated owner, and no authority bound to that completed reset ID
- **THEN** the command reports `already-complete` without rotating state or writing files

#### Scenario: Completed epoch loses its rebuilt owner

- **WHEN** a complete reset ID later has current approvals/delivery evidence but its generated owner is absent
- **THEN** the confirmed command starts a new reset epoch and does not report `already-complete`

### Requirement: HTML content and visual approval are exact-evidence-hash bound

The public content and visual approval paths SHALL accept a required exact review-plan hash for HTML-first runs and SHALL verify current reset ID plus content projection or preview manifest/bytes/receipts before writing pipeline-specific gate evidence. A waiver SHALL also require an explicit reason. A `deletion_pending` reset SHALL return `CONFLICT`; a pre-reset plan hash SHALL be stale even when rebuilt raw artifacts are byte-identical. Legacy visual/header approval syntax and evidence remain isolated. A stale/missing hash SHALL fail with a human-review next action and no gate mutation.

#### Scenario: User approves current HTML preview

- **WHEN** the supplied review-plan hash matches current shown artifacts
- **THEN** `approve ... visual` records current `html-visual-review` evidence and visual gate status

#### Scenario: Preview changed after showing

- **WHEN** the supplied hash no longer matches current source/config/artifacts
- **THEN** approval fails without changing the gate

#### Scenario: Reviewed content changes

- **WHEN** the ordered content fingerprint no longer matches the supplied content review hash
- **THEN** content approval fails without changing authoritative evidence or mirrors

### Requirement: Legacy-to-HTML migration has preview and exact apply commands

`ppt_flow migrate-html <run-dir> preview` SHALL validate a version-local candidate transaction, render the complete proposed HTML deck/contact sheet, and emit exact `old_side_mode: verified-current|degraded-missing|degraded-stale`, anticipated target version, and exact plan hash without publishing a version. Only `verified-current` may include old pixels. Degraded modes SHALL show diagnosis/placeholder, no stale pixels/parity claim, and a separately authorized legacy-maintenance next action; preview itself SHALL succeed locally. Normal `ppt_flow migrate-html <run-dir> apply --plan-hash <sha> --old-side-mode <mode>` SHALL accept only the current exact hash/mode after human acknowledgement and an exact active source `migrate-import` apply execution, bind that execution ID into journal/target receipt, recheck target/input/evidence, and publish only when hidden-target ordered composition/final PNG/contact-sheet SHAs exactly match preview. Closed recovery form `ppt_flow migrate-html <run-dir> apply --recover-journal <owner-token>` SHALL be mutually exclusive with plan/mode flags, require exact 64-lowercase-hex token plus the human-confirmed/age/active-owner rules, and apply only the bounded migration-apply recovery matrix. A recoverable/uncertain journal SHALL be reported with opaque token; the Agent carries it without requiring user transcription. Preview, normal apply, and recovery SHALL make zero provider calls; unknown/legacy-generation/evidence/path flags SHALL be usage errors.

#### Scenario: Migration preview runs

- **WHEN** an Agent has prepared a complete candidate under canonical migration scratch
- **THEN** preview emits source/comparison evidence and a plan hash while the visible version set remains unchanged

#### Scenario: Bare migration apply is rejected

- **WHEN** apply omits or mismatches the exact plan hash
- **THEN** CLI fails before hidden staging or visible version publication

#### Scenario: Migration apply has no matching active execution

- **WHEN** normal apply finds no exact source `migrate-import` execution bound to the confirmed plan/mode
- **THEN** it fails before journal/reservation/staging creation and points to the controller entry

#### Scenario: Migration recovery flags are mixed

- **WHEN** apply receives `--recover-journal` together with plan hash or old-side mode
- **THEN** it returns `USAGE` before journal/staging/target mutation

#### Scenario: Cross-host migration recovery is confirmed

- **WHEN** the Controller supplies the exact old-enough token after the human confirms no migration apply is active
- **THEN** apply performs only the bound recovery matrix and creates no review approval

### Requirement: HTML and workflow migration diagnostics remain producer-owned

New reason kinds for renderer preparation, browser measurement, manifest drift, visual-review staleness, pipeline ownership, and state replacement SHALL be emitted only by the responsible JS producer through `cli_error.mjs`. MD/node specs SHALL consume category/reason/next semantics without copying the full envelope schema or interpreting shell prose.

#### Scenario: Browser error crosses ppt_flow boundary

- **WHEN** a delegated renderer fails
- **THEN** `ppt_flow` preserves one normalized actionable parent diagnostic
- **AND** does not append raw child stderr or a second JSON envelope
