## Purpose

Define the producer contract for every registered direct Node CLI under `PPTMAKER_FRAMEWORK/scripts/`: entry discovery, output transactions, success and JSON channels, bounded actionable failure diagnostics with source/artifact lineage, secret-safe provider and child boundaries, and exhaustive return auditing. It also defines `ppt_flow.mjs` as the fixed 12-command unified entry point, preserving command compatibility and delegated capability routing.
## Requirements
### Requirement: CLI surface preserves command names

The `ppt_flow` CLI SHALL expose **13** commands: `doctor`, `init`, `status`, `approve`, `style-master`, `validate`, `pilot`, `build`, `refresh`, `new-version`, `test`, `state`, and `slides`. Arguments and flags for the original twelve commands SHALL remain compatible.

#### Scenario: Agent runs ppt_flow init

- **WHEN** Agent runs `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs init deck_demo --deck-type keynote --style dark-executive`
- **THEN** a run bundle is created at `deck_demo/` with the three-tier structure, preset templates seeded, metadata initialized

#### Scenario: help lists state

- **WHEN** Agent runs `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs --help`
- **THEN** the help output includes the `state` command

#### Scenario: help lists slides

- **WHEN** Agent runs `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs --help`
- **THEN** the help output includes the `slides` command group

### Requirement: ppt_flow delegates to capability scripts

`ppt_flow.mjs` SHALL delegate to `bundle_layout.mjs`, `unified_pipeline.mjs`, `generate_style_master.mjs`, and `env-check.mjs` as appropriate for each command.

#### Scenario: Command routes to its capability script

- **WHEN** Agent runs `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs style-master <run_dir>`
- **THEN** `ppt_flow.mjs` delegates the work to `generate_style_master.mjs` rather than implementing style-master generation inline

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

`ppt_flow.mjs pilot` SHALL treat readiness as **preview** (structure + style master): it SHALL NOT require metadata `content_gate`/`visual_gate` to be `approved`/`waived`, and SHALL NOT write `waived` or otherwise mutate gate fields. When invoking Stage 2, pilot SHALL pass `unified_pipeline --preview` so the child process uses the same readiness. Full `build` and non-preview Stage 2 SHALL continue to use pipeline readiness (gates required).

#### Scenario: Pilot runs while gates are pending

- **WHEN** metadata gates are `pending`
- **AND** style master exists and structure is valid
- **AND** Agent runs `ppt_flow.mjs pilot <run_dir>`
- **THEN** pilot proceeds (including Stage 2 under `--preview`)
- **AND** metadata gate fields remain `pending`

#### Scenario: Build / non-preview Stage 2 still blocked

- **WHEN** gates are `pending`
- **AND** Agent runs `ppt_flow.mjs build` or `unified_pipeline --stage 2` without `--preview`
- **THEN** the command fails for gate readiness
- **AND** prior pilot success is not treated as approval

### Requirement: Pilot accepts --force-images and skips by default

`ppt_flow.mjs pilot` SHALL expose `--force-images`. Without it, pilot SHALL NOT pass force into Stage 2 (existing pilot images are skipped). With it, selected pilot images regenerate.

#### Scenario: Default pilot skips existing images

- **WHEN** pilot target images already exist
- **AND** pilot runs without `--force-images`
- **THEN** Stage 2 skips those files

#### Scenario: Pilot --force-images regenerates

- **WHEN** `pilot … --force-images` runs
- **THEN** Stage 2 regenerates the pilot selection

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

`ppt_flow.mjs state` human output and successful `--json` output SHALL present a **where-am-I** resume card for whole-session recovery (not playbook name alone). The card SHALL include: active `playbook`, `current_node`, current node status, optional `waiting_for` / `note` (when set on the current node), `_state` gates, `playbook_stack` (possibly empty), a non-empty `workflow_summary` (short human-readable whole-workflow position; default Chinese), and a non-empty `suggested_next`. Card construction SHALL live in `state.mjs` as `buildResumeCard(state, statusSnapshot?)` (or equivalent exported helper) so `status` can reuse it. Heuristics for `workflow_summary` / `suggested_next` SHALL follow the change design (waiting-first; optional status snapshot for artifacts) and SHALL NOT mutate state. The CLI SHALL resolve the deck root via `deckRoot(resolve(runDir))`. Successful `--json` SHALL expose `workflow_summary` and `suggested_next` as **top-level** string fields on the printed object (in addition to normal state fields). The CLI command count remains **12**.

#### Scenario: Human state output names playbook and node

- **WHEN** Agent runs `ppt_flow.mjs state <runDir>` on an in-progress deck
- **THEN** stdout identifies the active playbook and current_node
- **AND** includes a workflow summary and suggested next action

#### Scenario: JSON state dump carries suggested_next and workflow_summary

- **WHEN** Agent runs `ppt_flow.mjs state <runDir> --json`
- **THEN** the JSON object includes non-empty top-level `suggested_next` and `workflow_summary` strings

#### Scenario: waiting_for shapes suggested_next

- **WHEN** the current node has `waiting_for: user:review-style-master`
- **AND** Agent runs `ppt_flow.mjs state <runDir> --json`
- **THEN** `suggested_next` includes that waiting_for token (e.g. prefixed with `waiting:`)
- **AND** `workflow_summary` indicates a human-wait / review blockage

#### Scenario: state resolves deck via deckRoot

- **WHEN** Agent runs `ppt_flow.mjs state` with a version runDir under `3_versions/v1`
- **THEN** state is read via `deckRoot(resolve(runDir))` (same resolver path family as `status` / `approve`, not an unresolved one-off `join(runDir, '..', '..')`)

### Requirement: status surfaces playbook position and lesson count

`ppt_flow.mjs status` human output SHALL include a compact Playbook section with at least active `playbook` and `current_node` from `_state` (via `readState` with default heal). Successful `status --json` SHALL include `playbook` and `current_node` fields on the JSON object. If `_state` is missing and heal seeds a default, status SHALL still report the seeded position rather than omitting those fields silently. Status MAY also print or JSON-include `workflow_summary` by calling the same resume-card helper with a status snapshot.

`ppt_flow.mjs status` human output SHALL also include a `Lessons` line showing the count of lesson files in `deck_*/_lessons/` (excluding `README.md`). When lessons exist, the line SHALL display the count and a hint to run `lessons.mjs list` to review them. When no lessons exist, the line SHALL display "none." Status `--json` SHALL include a `lessons_count` integer field. The lesson count SHALL be collected by reading the `_lessons/` directory; it SHALL NOT require `lessons.mjs` as a subprocess.

#### Scenario: status shows lesson count when lessons exist

- **WHEN** Agent runs `ppt_flow.mjs status <runDir>` on a deck with 2 lesson files
- **THEN** human output includes "Lessons: 2 (run `lessons.mjs list` to review)"
- **AND** `status --json` includes `"lessons_count": 2`

#### Scenario: status shows no lessons

- **WHEN** Agent runs `ppt_flow.mjs status <runDir>` on a deck with no `_lessons/` or an empty one
- **THEN** human output includes "Lessons: none"
- **AND** `status --json` includes `"lessons_count": 0`

#### Scenario: status shows playbook breakpoint

- **WHEN** Agent runs `ppt_flow.mjs status <runDir>` on a deck with `_state/state.yaml`
- **THEN** human output mentions the active playbook and current_node

#### Scenario: status JSON includes playbook fields

- **WHEN** Agent runs `ppt_flow.mjs status <runDir> --json` on a deck with `_state/state.yaml`
- **THEN** the JSON includes `playbook` and `current_node`

### Requirement: approve dual-writes metadata and _state gates

`ppt_flow.mjs approve <runDir> <gate>` SHALL set the corresponding `content_gate` or `visual_gate` in `project-metadata.yaml` **and** set `_state.gates.<gate>` to the same value (`approved` or `waived`) via `writeState` on the deck root. Pipeline readiness MAY continue to read metadata; session resume and `state --check-gates` SHALL see matching `_state` gates after approve. Command count remains 12.

#### Scenario: approve visual syncs _state gates

- **WHEN** Agent runs `ppt_flow.mjs approve <runDir> visual`
- **THEN** `project-metadata.yaml` has `visual_gate: approved`
- **AND** `_state/state.yaml` has `gates.visual: approved`

#### Scenario: approve --waive syncs both stores

- **WHEN** Agent runs `ppt_flow.mjs approve <runDir> content --waive`
- **THEN** metadata `content_gate` is `waived`
- **AND** `_state.gates.content` is `waived`

### Requirement: Title refresh routes by the affected slides' resolved modes

`ppt_flow refresh --kind title` SHALL remain available and SHALL accept the existing selector forms `--only <ids>` and `--all` for title changes. It SHALL refresh Stage 1 from current source before routing. If `--only` is provided, standard slide-id resolution SHALL determine affected slides; `--all` means all slides. With neither selector, the command SHALL preserve the selector-free Header Text & Style Refresh behavior only when every slide is `body+header-lock`; on a mixed/full-page deck it SHALL fail with a usage envelope asking the caller to specify affected ids or `--all`.

When all affected slides are `body+header-lock`, title refresh SHALL complete Header Text & Style Refresh through Stages 3,4,5 without Stage 2. When any affected slide is `full-page`, the command SHALL require Generated Image Rebuild and current header-review/accepted-risk evidence for those changed ids. If evidence is absent or stale, it SHALL fail with code `TITLE_REVIEW_REQUIRED`, list the affected full-page ids, and provide an exact `ppt_flow pilot <run-dir> --only <ids> --force-images` hint; it SHALL NOT emit a final PPTX. After pilot regeneration and review create current evidence, repeating the title refresh SHALL reuse those images and run Stages 3,4,5 without regenerating them again.

The English names describe logical refresh paths only. They SHALL NOT become CLI arguments, output enums, or replacements for the existing `--kind title|visual|notes` surface.

#### Scenario: Body-lock title refresh uses Header Text & Style Refresh
- **WHEN** all selected title changes resolve to `body+header-lock`
- **THEN** refresh runs Stage 1 followed by Stages 3, 4, and 5 and does not run Stage 2

#### Scenario: Full-page title refresh requires review first
- **WHEN** a selected title change resolves to `full-page` and has no current review evidence
- **THEN** refresh fails with `TITLE_REVIEW_REQUIRED`, lists that id, and does not assemble a final PPTX
- **AND** its next invocation selects that id and includes `--force-images`

#### Scenario: Reviewed full-page title refresh completes without a second image generation
- **WHEN** the affected full-page image was regenerated by pilot and current review evidence exists
- **THEN** repeating refresh reuses the reviewed image and completes Stages 3, 4, and 5

#### Scenario: Mixed deck without selector fails safely
- **WHEN** title refresh is invoked without `--only` or `--all` and the deck contains a full-page slide
- **THEN** the CLI asks for explicit affected ids rather than regenerating every full-page slide or silently using Header Text & Style Refresh

### Requirement: Existing approve command records header review evidence

The existing `ppt_flow approve` command SHALL accept `header` as an additional gate argument without adding a new top-level command. `approve <run-dir> header` SHALL read the current pilot subset/artifacts, recompute current source/config header inputs, verify the pilot images exist and have current raw-image generation provenance, then persist review evidence and history under `_state/state.yaml` `nodes.header-review.by_version[<normalized version-relative run-dir>]`. Evidence SHALL be usable only for that version. It SHALL NOT modify `project-metadata.yaml` content/visual gates or add `_state.gates.header`.

Multiple approvals for the same version SHALL merge reviewed ids and image hashes only when fingerprint and generation profile match. A partial approval MAY be persisted with that version record's status `in_progress` and SHALL report remaining coverage/changed ids; that record becomes `completed` only when baseline content coverage and every changed full-page id are reviewed or specifically accepted. Other version records SHALL remain unchanged. A new fingerprint/profile SHALL not inherit prior reviewed ids.

`approve <run-dir> header --waive` SHALL require both `--only <ids>` and a non-empty `--reason <text>`. It SHALL bind those named accepted-risk ids and symptoms to the current fingerprint. Header approval failures SHALL use the standard JSON envelope and SHALL never suggest hand-editing `_state`.

#### Scenario: Approve current pilot header review
- **WHEN** current pilot artifacts exist and match current source/config
- **THEN** `approve <run-dir> header` persists or merges reviewed ids, snapshot, image hashes, and fingerprint for that version without changing content/visual gates

#### Scenario: Partial batches merge until coverage completes
- **WHEN** two current pilot batches for the same version use the same fingerprint/profile
- **THEN** their approved ids merge
- **AND** the header-review node remains `in_progress` until all required coverage is satisfied, then becomes `completed`

#### Scenario: Version evidence cannot cross versions
- **WHEN** v1 has completed header evidence and v2 has none
- **THEN** v2 production remains blocked and does not reuse v1 evidence

#### Scenario: Stale pilot cannot be approved
- **WHEN** source/config changed after the pilot artifacts were generated
- **THEN** header approval fails and asks for pilot regeneration

#### Scenario: Risk acceptance is specific
- **WHEN** header waive omits ids or reason
- **THEN** the CLI fails with a usage envelope
- **AND** a valid waive records only the named ids/reason against the current fingerprint

### Requirement: Build preserves reviewed full-page images

When current header evidence binds reviewed or accepted full-page image hashes, `ppt_flow build` SHALL reject its default force-regeneration behavior for those ids. The failure hint SHALL direct the caller to `build --reuse-images` when the requested profile matches, or to rerun pilot at the target resolution/model/style and approve header again. `--reuse-images` SHALL still generate missing/unreviewed images while preserving matching reviewed images.

#### Scenario: Reviewed production build uses reuse
- **WHEN** header evidence matches the requested production profile and reviewed images are current
- **THEN** `build --reuse-images` preserves those images and generates any missing others

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

The test suite SHALL maintain an explicit registered inventory of these eleven executable `.mjs` entry points: `bundle_layout.mjs`, `env-check.mjs`, `generate_style_master.mjs`, `make_contact_sheet.mjs`, `ppt_flow.mjs`, `stage1_build_inputs.mjs`, `stage2_generate_images.mjs`, `stage3_lock_headers.mjs`, `stage4_build_pptx.mjs`, `stage5_inject_notes.mjs`, and `unified_pipeline.mjs`. It SHALL compare the registry with direct-entry guards and probe at least one deterministic failure path for each executable. A new executable SHALL fail the inventory test until its failure-envelope behavior is covered.

#### Scenario: New standalone script lacks envelope coverage

- **WHEN** a new documented executable is added under `scripts/` without a registered failure probe
- **THEN** the CLI contract test fails and names the uncovered script

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

The command-return registry SHALL cover exactly the 13 commands registered by `ppt_flow.mjs`: `doctor`, `init`, `status`, `approve`, `style-master`, `validate`, `pilot`, `build`, `refresh`, `new-version`, `test`, `state`, and `slides`. Each command SHALL register every applicable return category or an explicit not-applicable reason. Every `slides` subcommand SHALL be covered by command-specific success, usage, source-validation, conflict, stale-base, and commit return tests as applicable. A new, removed, or renamed command or subcommand SHALL fail the set comparison.

#### Scenario: Registered and audited commands differ

- **WHEN** commands registered before `parseAsync` are compared with the audit registry
- **THEN** the test fails on every missing or stale command name

#### Scenario: Slides subcommand lacks return coverage

- **WHEN** a `slides` subcommand is registered without applicable return cases or explicit not-applicable reasons
- **THEN** the return audit fails and names that subcommand

#### Scenario: Contextual gate failure guides MD

- **WHEN** a command is blocked by a known gate or review condition
- **THEN** the diagnostic identifies the gate/affected ids when known
- **AND** `next.action` and `next.requires_human` distinguish rerun from human decision
- **AND** `next.invocation` supplies the preferred argument-safe `ppt_flow` invocation when known

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

