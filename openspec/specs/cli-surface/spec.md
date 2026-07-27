## Purpose

Define the producer contract for every registered direct Node CLI under `PPTMAKER_FRAMEWORK/scripts/`: entry discovery, output transactions, success and JSON channels, bounded actionable failure diagnostics, secret-safe boundaries, and exhaustive return auditing. It defines `ppt_flow.mjs` as the fixed 14-command unified entry point.
## Requirements
### Requirement: Public CLI exposes one production-mode surface
`ppt_flow init` SHALL accept no production-mode choice or exact `--mode image2-page-authority`, and
default an omitted mode to `image2-page-authority`. It SHALL reject legacy init modes. The closed state grammar SHALL retain existing
same-pipeline and cross-pipeline transition behavior and SHALL add Page Authority operations only through
the Page Authority receipt and authorization boundaries. Help and successful init/mode results SHALL
include normalized run version, selected mode, derived pipeline, and nearest next action.

Unknown mode values, missing/corrupt authority, selected-run execution mismatch, mode/source mismatch,
pre-current state, retired Controller identity, or CAS conflict SHALL use the existing final JSON
diagnostic producer and fail before readiness, provider credentials, generated paths, or writes. The
diagnostic SHALL name the owner's one bounded typed next action and never a hand-edited state recipe.

#### Scenario: Init defaults to Page Authority
- **WHEN** `ppt_flow init` is called without `--mode`
- **THEN** v1 records `image2-page-authority` and source declares `page-authority-image2-v1`
- **AND** the result reports `framed-image2` as the new-deck default

#### Scenario: Invalid mode is supplied
- **WHEN** init or a mode transition receives an unknown mode
- **THEN** CLI returns `USAGE` through the registered diagnostic envelope before creating or changing a bundle

#### Scenario: Legacy transition has no generic CLI bypass
- **WHEN** a caller requests a Page Authority transition through a generic in-place mode setter
- **THEN** CLI returns the owner-issued transition guidance without source, state, or generated mutation
- **AND** it does not infer an adoption

#### Scenario: Same-pipeline legacy transition remains available
- **WHEN** the exact run changes from `html-only` to `html-then-image2` with current expected state
- **THEN** CLI reports the old/new mode and unchanged `html-first-v1` pipeline
- **AND** it does not submit provider work

#### Scenario: Legacy cross-pipeline transition remains deferred
- **WHEN** the exact run requests `image2-only` from an HTML mode
- **THEN** CLI reports current versioned-transition guidance and makes no state, source, or generated mutation

#### Scenario: Published same-pipeline target registration is retried
- **WHEN** the exact same-pipeline target is visible but prior mode registration was interrupted
- **THEN** state registration commits or reports the already-current target record idempotently
- **AND** it does not copy source gates, node completion, or generated evidence

#### Scenario: State operation flags are mixed
- **WHEN** a caller combines mode transition, mirror repair, registration, JSON, gate, or delivery-review forms
- **THEN** CLI returns `USAGE` before state, metadata, source, or target mutation

#### Scenario: Cross-pipeline registration has no generic CLI bypass
- **WHEN** a caller invokes generic state registration for source and target with different pipelines
- **THEN** the command rejects before state, metadata, source, or target mutation
- **AND** it names the owner-issued transition or adoption guidance instead of registering a Page Authority target

#### Scenario: Init omits mode
- **WHEN** `ppt_flow init` is called without `--mode`
- **THEN** stdout reports `image2-page-authority`, `page-authority-image2-v1`, and the Page Authority next action

#### Scenario: Same-pipeline transition succeeds
- **WHEN** an explicitly targeted legacy run changes from `html-only` to `html-then-image2` with current expected state
- **THEN** CLI reports the old/new mode and unchanged `html-first-v1` pipeline
- **AND** it does not submit provider work

#### Scenario: Cross-pipeline transition is deferred
- **WHEN** an explicitly targeted legacy HTML run requests `image2-only`
- **THEN** CLI reports current versioned-transition guidance and makes no state, source, or generated mutation

#### Scenario: Published target registration is retried
- **WHEN** the exact same-pipeline legacy target is visible but prior mode registration was interrupted
- **THEN** state registration commits or reports the already-current target record idempotently
- **AND** it does not copy source gates, node completion, or generated evidence

### Requirement: Doctor exposes production-scoped readiness without hidden live work
The root grammar SHALL accept `ppt_flow doctor --mode image2-page-authority` and a Page Authority
run-bound operation selection. `--run-dir` SHALL inspect the exact authoritative mode and fail closed on
unusable state/drift; explicit `--mode` supports pre-init checks. For an unbound Page Authority mode,
doctor reports independent `framed-runtime` and `image2-raw` profiles without an aggregate source-ready
claim. Existing `--image2` remains the compatibility alias for the legacy `image2-only` profile and is
mutually exclusive with other selectors. `--smoke` and `--probe-vendors` remain mutually exclusive and
live only when explicitly selected; neither authorizes production generation.

#### Scenario: Page Authority doctor is unbound
- **WHEN** `doctor --mode image2-page-authority` runs without run-dir, operation, or live flags
- **THEN** it reports independent offline Frame and raw profiles without a combined readiness claim
- **AND** it makes no network request

#### Scenario: Page Authority doctor resolves a local operation
- **WHEN** `doctor --run-dir <run-dir> --operation framed-local-refresh` targets a valid Page Authority run
- **THEN** it checks only the `framed-runtime` profile
- **AND** it does not require provider credentials or probe a vendor

#### Scenario: Doctor selectors conflict
- **WHEN** mode, run-dir, operation, or the compatibility `--image2` selector is combined incompatibly
- **THEN** doctor returns `USAGE` before environment or provider inspection

#### Scenario: Pre-init Image2-primary doctor is scoped

- **WHEN** `doctor --mode image2-only` is explicitly requested without live flags for an existing legacy workflow
- **THEN** HTML-only runtime failures do not affect that legacy profile and Image2 presence is checked offline

#### Scenario: Existing run supplies mode authority

- **WHEN** `doctor --run-dir <run-dir>` targets a valid existing `html-only` version
- **THEN** it runs the HTML readiness profile without consulting metadata as mode authority

#### Scenario: HTML-then-Image2 can begin locally

- **WHEN** HTML readiness passes but deferred Image2 presence fails under an existing `html-then-image2` run
- **THEN** doctor reports current HTML work ready plus the later repair guidance
- **AND** no live provider request runs and refinement submit remains blocked until repaired

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

### Requirement: CLI surface preserves command names
The `ppt_flow` CLI SHALL expose exactly 14 top-level commands: `doctor`, `init`, `status`, `approve`,
`style-master`, `validate`, `pilot`, `build`, `refresh`, `new-version`, `test`, `state`, `slides`, and
`image2`. Page Authority work SHALL use receipt-bound forms under this existing surface; no top-level
Page Authority or migration command is added. Help SHALL not advertise legacy modes as fresh-init
choices.

#### Scenario: Help lists the complete current surface
- **WHEN** `ppt_flow --help` runs
- **THEN** the 14 current command names are listed exactly once
- **AND** no extra Page Authority top-level command is advertised

#### Scenario: Existing init invocation uses the new default
- **WHEN** an Agent runs `ppt_flow init deck_demo --deck-type keynote --style dark-executive`
- **THEN** a run bundle is created using the compatible invocation shape and `image2-page-authority`
- **AND** the resulting source default is `framed-image2`

#### Scenario: Existing init invocation remains valid
- **WHEN** an Agent runs `ppt_flow init deck_demo --deck-type keynote --style dark-executive`
- **THEN** a run bundle is created using the compatible invocation shape and the `image2-page-authority` default
- **AND** the resulting source default is `framed-image2`

### Requirement: ppt_flow delegates to capability scripts
ppt_flow.mjs SHALL delegate bundle management, environment checks, state, slide transactions, the state-owned production-mode transition, and the selected production branch to owning Phase interfaces or categorized shared CLI adapters. It SHALL route HTML Stage 1-5 through the HTML interface and explicit current whole-page production through the public 04-image-production/whole-page adapter. It SHALL keep orchestration/renderer logic out of the command router, verify the canonical source/state pair before branch-specific readiness or option handling, and import no retired Phase-5 migration bridge or private path.

#### Scenario: HTML build routes to the HTML adapter
- **WHEN** a marked HTML run invokes ppt_flow build
- **THEN** ppt_flow delegates through unified orchestration to the HTML capability scripts
- **AND** does not delegate to style-master or Image2 generation

#### Scenario: Whole-page style command retains its owner
- **WHEN** a consistent image2-only run invokes ppt_flow style-master
- **THEN** ppt_flow delegates to the public whole-page style-master owner rather than implementing it inline

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
- **THEN** header approval records version-scoped whole-page evidence without a retired maintenance route

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

The command-return registry SHALL cover exactly the 15 registered top-level commands, including `image2`. Every command/subcommand/closed repair or evidence operation SHALL register applicable success/usage/validation/gate/conflict/stale/commit/internal return categories or an explicit not-applicable reason. `state --recover-gate-journal` SHALL cover mutual-exclusion/invalid-token/too-young/token-drift/active-owner/forbidden-SHA/successful-abort/mirror-complete/cleanup/exact-reset-yield returns and prove no approval creation. `state --record-delivery-review` SHALL cover invalid decision, required/forbidden reason combinations, reason control/UTF-8-size validation, explicit whole-page rejection, missing/stale/current evidence, journal/reset conflict, each typed decision success, and unsupported evidence overrides. `refresh --kind reset-html-production` SHALL cover explicit-versus-default flag detection, exact-version confirmation, explicit whole-page/unusable-state/gate-journal/reset-CAS/metadata-CAS/unsafe-owner conflicts, gate-journal race yield, new reset, live/waiting/dead/uncertain/invalid owner matrices at exact 60000/300000-ms boundaries, competing takeover CAS, same-reset resume, idempotent completed retry only without current-epoch authority, absent-owner no-reset-needed versus authority-loss epoch rotation, deletion failure with retained fence, and successful completion without approval creation. `slides` SHALL retain its operation-specific audit; `production-mode-transition preview|apply` SHALL cover complete/degraded preview, exact mode/hash acknowledgement, drift, decline, apply-journal mutual exclusion, automatic/confirmed recovery age-token-owner matrices, absent-target owned cleanup/full rerender, exact-target idempotent completion, conflicting target/foreign path denial, and zero-provider failures. Its closed refinement operations SHALL audit help, explicit whole-page rejection, current-delivery eligibility, plan/authorization drift, duplicate or unknown attempt handling, candidate identity, promotion conflict/recovery, cleanup ambiguity, and success; every applicable category shall have an explicit case or not-applicable reason. Set mismatch SHALL fail.

#### Scenario: Migrate command is not audited

- **WHEN** `production-mode-transition` is registered without preview/apply return cases
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

### Requirement: HTML content and visual approval are exact-evidence-hash bound
The public `approve <run-dir> content|visual` command for a current HTML run SHALL require an exact current plan hash for `approved`. `--waive --reason` SHALL accept a missing/incomplete quality plan only when the canonical HTML source parses and current run version/reset identity is known. It SHALL publish through the same gate owner/journal/CAS authority with gate `status: waived`, a bounded reason, and a bounded `waived_checks` list. `evidence_complete` SHALL reflect actual evidence: it MAY be true for a complete intentional waiver and SHALL be false when checks are missing. A caller-supplied non-matching plan hash SHALL return `CONFLICT` or `GATE_BLOCKED` without mutation.

HTML approval SHALL neither read nor write retired whole-page visual/header syntax, gate fields, or evidence as an isolated retired surface. It SHALL leave current non-HTML branch mirrors untouched, and a retired field presented to this command SHALL be rejected before gate mutation. A `deletion_pending` reset SHALL return `CONFLICT`; a pre-reset plan hash SHALL be stale even when rebuilt raw artifacts are byte-identical. A stale or missing hash on ordinary approval SHALL fail with the current human-review next action and no gate mutation.

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

### Requirement: CLI continuation controls are registered and auditable

`build`, `state --record-delivery-review proceed`, and `image2 plan` SHALL expose the explicitly
reasoned continuation controls defined by their owners. `--force --reason` SHALL never silently
submit to a provider, create a second state authority, or bypass active journal/reset/CAS fences.
Each successful continuation SHALL return a structured result that identifies the decision (`waived`
or evidence waiver), identity freshness, evidence completeness, and the bounded waived checks. Each
failure SHALL use the existing single stderr JSON envelope and secret-safe diagnostic contract.

#### Scenario: Build continues after a user waiver

- **WHEN** content/visual evidence is pending or stale and the user invokes `build --force --reason <text>`
- **THEN** the command publishes current gate waivers through the gate authority and continues local assembly
- **AND** it does not publish approval or falsely claim evidence completeness

#### Scenario: Build force dry-run is non-writing

- **WHEN** `build --force --reason <text> --dry-run` is invoked
- **THEN** the success result lists prospective gate decisions and local stages
- **AND** no gate, metadata mirror, or generated artifact is written

#### Scenario: Delivery continuation lacks reviewable artifacts

- **WHEN** delivery review has no PPTX/contact sheet that the user could inspect
- **THEN** `state --record-delivery-review proceed --force` returns a hard-stop diagnostic
- **AND** it does not create a delivery decision

#### Scenario: Image2 planning is forced without delivery proceed

- **WHEN** current HTML/final-slide/slot identity exists but delivery review is not current
- **THEN** `image2 plan --force --reason <text>` creates only an offline plan with a prerequisite waiver
- **AND** authorization and provider generation remain separate explicit steps

### Requirement: State validation is a registered read-only operation

`ppt_flow state <run-dir> --validate-state` SHALL validate the authoritative state and referenced
evidence without mutating files by default. It SHALL report unknown/missing/extra keys, canonical
version-key errors, SHA format or on-disk reference mismatches, and delivery-record field differences
with bounded expected/actual paths. It SHALL provide a producer-owned normalize/repair next action
without requiring a novice to hand-edit YAML.

#### Scenario: State contains an intuitive but noncanonical version key

- **WHEN** a record is stored under `v2` instead of `3_versions/v2`
- **THEN** validation reports the exact key and canonical replacement
- **AND** the read-only command does not silently rewrite the state

#### Scenario: Delivery record has one wrong SHA

- **WHEN** a delivery record SHA differs from the referenced file
- **THEN** validation reports the field path plus bounded expected and actual values
- **AND** normal state observation remains non-mutating

### Requirement: CLI exposes a closed versioned production-transition protocol
`ppt_flow state` SHALL expose mutually exclusive `--prepare-production-mode-transition <html-only|html-then-image2|image2-only>`, `--preview-production-mode-transition`, `--confirm-production-mode-transition --plan-hash <hash>`, `--apply-production-mode-transition --plan-hash <hash>`, `--confirm-production-mode-transition-recovery <owner-token>`, and `--recover-production-mode-transition [owner-token]` operations. It SHALL also expose mutually exclusive `--inspect-legacy-protocol`, `--prepare-legacy-adoption`, `--preview-legacy-adoption`, `--confirm-legacy-adoption --plan-hash <hash>`, `--apply-legacy-adoption --plan-hash <hash>`, `--confirm-legacy-adoption-recovery <owner-token>`, and `--recover-legacy-adoption [owner-token]` forms. All forms SHALL delegate to the same state-owned transition transaction and selected adapter; they SHALL not accept `--force`, caller-supplied lineage paths, old-side migration modes, `--reason`, or legacy migration fields.

`--inspect-legacy-protocol` SHALL be read-only and return exactly one observer classification: `recognized-legacy`, `current`, `current-pair-corrupt`, or `unsupported-or-corrupt`, with bounded facts and one next action. Only `recognized-legacy` may prepare adoption. The generic transition prepare form SHALL reject `image2-page-authority`; the adoption form fixes that target and accepts no target-mode argument. Normal legacy production commands that resolve a `recognized-legacy` run SHALL fail before pipeline/provider work with the producer-owned `LEGACY_PROTOCOL_ADOPTION_REQUIRED` envelope and only the provider-free adoption prepare/preview action.

Prepare and preview SHALL remain local and non-writing with respect to source state and visible versions. The named confirmation command is the first state write: an exact plan-hash transaction commit that binds the exact source execution, target mode/intake, candidate inputs, anticipated target version, plan hash, and existing target-user `transition_confirmation` decision to the `production-mode-transition/apply-production-mode-transition` execution. An adoption commit additionally binds its observer/matrix digests. It is not a quality/process-risk continuation, accepts neither `--reason` nor `--force`, and writes no `waived` decision or waiver record. Apply SHALL rederive that hash and revalidate the closed target-intake/digest/decision tuple before publication. An Image2 target reports the later normal authorization/pilot/build boundary and does not submit a provider request during transition or adoption.

Recovery SHALL operate only on the exact transition journal or one exact visible receipt. Same-host proven-dead recovery is automatic only after the existing 60000-ms floor; cross-host or otherwise uncertain recovery requires the state-owned no-active-apply fact attestation after the 300000-ms floor. That attestation is revalidated factual input to a recovery `hard-stop`, not a risk waiver or continuation, and carries no `--reason`/`--force` bypass. A live owner is non-overridable. No removed migration Controller, node, receipt, scratch owner, or command may start or finish a transition.

#### Scenario: HTML-to-Image2 preview is offline
- **WHEN** a valid HTML source previews an explicitly authored `image2-only` candidate
- **THEN** CLI returns the exact target mode, plan hash, and later Image2 authorization boundary
- **AND** it makes no provider request or target version write

#### Scenario: Image2-to-HTML selects the target mode
- **WHEN** a consistent Image2 source prepares an `html-then-image2` candidate
- **THEN** CLI preserves the source and reports the selected HTML target mode rather than silently choosing `html-only`

#### Scenario: Legacy adoption observer is provider-free
- **WHEN** a canonical legacy run invokes `state <run-dir> --inspect-legacy-protocol`
- **THEN** CLI returns its bounded classification and exact adoption action without state, source, target, credential, transport, or provider mutation

#### Scenario: Legacy production is fenced after the bridge exists
- **WHEN** a recognized legacy run invokes a normal build, refresh, pilot, provider, or legacy review command
- **THEN** CLI emits `LEGACY_PROTOCOL_ADOPTION_REQUIRED` before renderer/provider initialization
- **AND** it names only the provider-free adoption prepare or preview action

#### Scenario: Confirmation flags conflict
- **WHEN** a caller mixes transition operations, JSON, gate recovery, delivery review, or another state operation
- **THEN** CLI returns one `USAGE` envelope before source, state, candidate, or target mutation

#### Scenario: Apply lacks current confirmation
- **WHEN** transition or adoption apply receives a missing, stale, or mismatched plan hash
- **THEN** CLI hard-stops before reservation or publication and directs the Controller to the exact preview checkpoint

#### Scenario: Uncommitted transition preview is non-writing
- **WHEN** the Controller does not invoke the exact plan-hash commit after displaying an exact preview
- **THEN** the source execution, current node, and authoritative source mode remain unchanged
- **AND** no transition execution or target version is created

#### Scenario: Transition commit cannot become a waiver
- **WHEN** a caller supplies `--reason` or `--force` with any transition or adoption confirmation
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
- **WHEN** the Controller commits an exact production-mode transition or adoption preview
- **THEN** state starts `production-mode-transition/apply-production-mode-transition` with the bound source execution, target mode/version, and plan hash
- **AND** it records the target user's `proceed` decision without a risk reason, waiver, or continuation
- **AND** it creates no removed migration field or node

#### Scenario: Exact plan commit binds target intake
- **WHEN** the Controller commits a transition preview with explicit target topic, audience, and success criteria
- **THEN** the plan binds those target-intake fields, their digest, and the target-user decision before target handoff records only new target intake evidence
- **AND** a source Controller decision cannot satisfy the target intake node

### Requirement: Status and state JSON publish one shared workflow inspection
Successful `ppt_flow status --json` and `ppt_flow state <runDir> --json` reports SHALL invoke the shared workflow inspection for the same resolved run/checkpoint and expose it as `workflow_inspection` through the existing registered CLI JSON transaction/sanitizer. The projection's canonical JSON serialization, independent of outer-report pretty formatting, SHALL be byte-equivalent between the two outputs only when their checkpoints contain identical stable direct-fact identities; no cache may manufacture parity after a fact changes. Each command SHALL retain its existing compatible outer fields and command-specific context; neither command SHALL independently derive or override the workflow primary action. `state --json` SHALL additionally expose the exact parsed durable-state document used for observation as `durable_state`. It SHALL NOT duplicate raw durable-state keys at top level; top-level keys are the documented card/compatibility projection. A workflow projection SHALL NOT overwrite any field in the `durable_state` namespace or expand existing registered CLI JSON report bounds. A non-zero input, identity, or unusable-state failure SHALL retain the existing single producer-owned stderr envelope and SHALL NOT emit a partial stdout projection.

#### Scenario: JSON observation surfaces agree
- **WHEN** Agent runs `status --json` and `state <runDir> --json` without a fact change between calls
- **THEN** both outputs contain byte-equivalent `workflow_inspection` objects
- **AND** status/artifact summary and raw state remain available in their respective outer outputs

#### Scenario: Durable state field cannot be shadowed by projection
- **WHEN** a durable-state field has the same name as a compatibility or inspection-derived field
- **THEN** `state --json.durable_state` retains the exact observed durable value
- **AND** any outer compatibility projection does not replace it

#### Scenario: Raw state is not double-serialized
- **WHEN** `state --json` observes a durable state with a large version-scoped record
- **THEN** the raw record appears only under `durable_state`
- **AND** the report remains subject to the existing CLI JSON depth and byte limits

#### Scenario: Unusable state retains the error envelope
- **WHEN** status or state JSON cannot establish a usable observation context
- **THEN** it retains the existing single producer-owned stderr failure envelope
- **AND** it does not emit a partial `workflow_inspection` or fabricate `durable_state` on stdout

#### Scenario: Human-readable output adapts the shared action
- **WHEN** inspection reports a primary action for a human-readable state or status command
- **THEN** the command presents that action with its own contextual text
- **AND** it does not print a different independently computed next action

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

### Requirement: CLI routing does not duplicate workflow evaluation

`ppt_flow` SHALL parse arguments, dispatch every mutating command through its closed grammar to the selected direct owner, and emit the existing CLI envelope. `status` and non-mutating `state` observation SHALL obtain caller-facing workflow guidance from inspection. A mutating command MAY return its direct owner's gate/recovery result, but SHALL NOT replace the requested operation with an inspection resume action or add a second mode/gate/recovery evaluator or result schema.

#### Scenario: Pending resume does not redirect a direct operation
- **WHEN** inspection reports a primary action that differs from a requested mutating CLI operation
- **THEN** `ppt_flow` dispatches the requested operation only to its direct owner
- **AND** it does not execute, synthesize, or advertise the inspection action as an alternate command

### Requirement: Resume-card action displays derive from one inspection projection
`state` and `status` SHALL retain non-empty public `workflow_summary` and `suggested_next` fields, but each SHALL be a display adaptation of the same `workflow_inspection.primary_action` in that response. `eligible_candidates` MAY remain as a bounded diagnostic field, but SHALL not select a route, override the primary action, or expose an alternate mutation command. The shared state card retains raw cursor context but SHALL not independently evaluate a resume/next action.

#### Scenario: State and status display the same primary action
- **WHEN** `state` and `status` render a response for the same workflow-inspection projection
- **THEN** each derives its public resume-card action from that response's `primary_action`
- **AND** neither display field or eligible candidate selects an alternate route

### Requirement: Page Authority direct commands are receipt-bound
CLI SHALL expose Page Authority validation, raw-generation, local Framed refresh, assembly, and notes
operations only through canonical `--run-dir` source/state resolution and the resolved receipt. It SHALL
reject direct prompt, provider style, output-path, or legacy artifact override arguments. Any hard
failure SHALL use the existing secret-safe diagnostic envelope; no provider body, prompt, or credential
shall be emitted.

#### Scenario: Direct provider ingress is rejected
- **WHEN** a Page Authority command receives a raw prompt, style override, output override, or legacy image path
- **THEN** CLI returns `USAGE` before readiness, provider, or generated-artifact work
- **AND** it identifies the receipt-bound command path
