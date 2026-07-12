## Purpose

Define the command-line surface of the framework's single entry-point script, `ppt_flow.mjs`: the fixed set of 12 subcommands it exposes, the capability scripts it delegates to, and its use of `commander` for argument parsing and subcommand routing. This capability guarantees that the CLI contract stays stable — command names and flags remain backward-compatible — that each command routes to the correct underlying capability script rather than reimplementing it, and that hard failures emit a machine-parseable JSON envelope on stderr for MD Controllers.
## Requirements
### Requirement: CLI surface preserves command names

The `ppt_flow` CLI SHALL expose **12** commands: `doctor`, `init`, `status`, `approve`, `style-master`, `validate`, `pilot`, `build`, `refresh`, `new-version`, `test`, and `state`. Arguments and flags for the original eleven commands SHALL remain compatible.

#### Scenario: Agent runs ppt_flow init

- **WHEN** Agent runs `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs init deck_demo --deck-type keynote --style dark-executive`
- **THEN** a run bundle is created at `deck_demo/` with the three-tier structure, preset templates seeded, metadata initialized

#### Scenario: help lists state

- **WHEN** Agent runs `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs --help`
- **THEN** the help output includes the `state` command

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

`ppt_flow` paths that accept `--only` (including `pilot`) SHALL use the same `resolveSlideIds` rules as `pipeline-orchestration`. Unknown/ambiguous selectors SHALL fail with a JSON envelope whose `hint` lists available slide ids (truncated if long).

#### Scenario: Page number selects a slide

- **WHEN** `--only 3` is passed and the third plan entry has id `s03_one_tool_two_modes`
- **THEN** pilot / Stage 2 targets that slide id

#### Scenario: Unknown selector lists ids

- **WHEN** `--only slide_03` matches nothing
- **THEN** the command exits non-zero with an envelope
- **AND** `hint` includes real ids from `slide_plan.json`

### Requirement: doctor forwards optional --smoke

`ppt_flow.mjs doctor` SHALL accept `--smoke` and forward it to `env-check.mjs`. Without `--smoke` and without `--probe-vendors`, doctor remains presence-only (no Image2 network).

#### Scenario: doctor --smoke flag is accepted

- **WHEN** Agent runs `ppt_flow.mjs doctor --smoke`
- **THEN** the flag is passed through to env-check
- **AND** help text documents `--smoke`

### Requirement: doctor forwards optional --probe-vendors

`ppt_flow.mjs doctor` SHALL accept `--probe-vendors` and forward it to `env-check.mjs`. Help text SHALL document that `--probe-vendors` probes every resolved Image2 vendor and prints a channel report (distinct from `--smoke`, which probes only the first). The CLI command count remains **12** (no new top-level subcommand). Passing both `--smoke` and `--probe-vendors` SHALL be rejected (forwarded mutual exclusion or local USAGE).

#### Scenario: doctor --probe-vendors flag is accepted

- **WHEN** Agent runs `ppt_flow.mjs doctor --probe-vendors`
- **THEN** the flag is passed through to env-check
- **AND** help text documents `--probe-vendors`

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

### Requirement: status surfaces playbook position

`ppt_flow.mjs status` human output SHALL include a compact Playbook section with at least active `playbook` and `current_node` from `_state` (via `readState` with default heal). Successful `status --json` SHALL include `playbook` and `current_node` fields on the JSON object. If `_state` is missing and heal seeds a default, status SHALL still report the seeded position rather than omitting those fields silently. Status MAY also print or JSON-include `workflow_summary` by calling the same resume-card helper with a status snapshot.

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

`ppt_flow refresh --kind title` SHALL remain available and SHALL accept the existing selector forms `--only <ids>` and `--all` for title changes. It SHALL refresh Stage 1 from current source before routing. If `--only` is provided, standard slide-id resolution SHALL determine affected slides; `--all` means all slides. With neither selector, the command SHALL preserve the old Chain-A behavior only when every slide is `body+header-lock`; on a mixed/full-page deck it SHALL fail with a usage envelope asking the caller to specify affected ids or `--all`.

When all affected slides are `body+header-lock`, title refresh SHALL complete through Stages 3, 4, and 5 without Stage 2. When any affected slide is `full-page`, the command SHALL require current header-review/accepted-risk evidence for those changed ids. If evidence is absent or stale, it SHALL fail with code `TITLE_REVIEW_REQUIRED`, list the affected full-page ids, and provide an exact `ppt_flow pilot <run-dir> --only <ids> --force-images` hint; it SHALL NOT emit a final PPTX. After pilot regeneration and review create current evidence, repeating the title refresh SHALL reuse those images and run Stages 3, 4, and 5 without regenerating them again.

#### Scenario: Body-lock title refresh keeps Chain A
- **WHEN** all selected title changes resolve to `body+header-lock`
- **THEN** refresh runs Stage 1 followed by Stages 3, 4, and 5 and does not run Stage 2

#### Scenario: Full-page title refresh requires review first
- **WHEN** a selected title change resolves to `full-page` and has no current review evidence
- **THEN** refresh fails with `TITLE_REVIEW_REQUIRED`, lists that id, and does not assemble a final PPTX

#### Scenario: Reviewed full-page title refresh completes without a second image generation
- **WHEN** the affected full-page image was regenerated by pilot and current review evidence exists
- **THEN** repeating refresh reuses the reviewed image and completes Stages 3, 4, and 5

#### Scenario: Mixed deck without selector fails safely
- **WHEN** title refresh is invoked without `--only` or `--all` and the deck contains a full-page slide
- **THEN** the CLI asks for explicit affected ids rather than regenerating every full-page slide or silently using Chain A

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

