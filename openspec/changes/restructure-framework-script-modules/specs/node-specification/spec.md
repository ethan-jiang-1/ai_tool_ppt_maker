## MODIFIED Requirements

### Requirement: CONDITIONS registry is implemented in state.mjs

`PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs` SHALL export a `CONDITIONS` object mapping each standard condition name to an executable check function. Parameterized conditions (e.g., `node_completed:<name>`) SHALL be supported via function factories. The path move SHALL NOT change any condition name or result.

#### Scenario: Condition is checked

- **WHEN** `CONDITIONS['run_bundle_exists'](state, ctx)` is called
- **THEN** it returns `true` if the deck directory exists on disk
- **AND** `false` otherwise

### Requirement: state.yaml carries a discoverability header on every write

`writeState(deckDir, state)` SHALL write `state.yaml` as a UTF-8 file whose leading lines are `#` comments that identify the file as playbook execution state and point readers to `charter/NODE-SPEC.md` and `PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs` (and MAY mention `ppt_flow state`). The header text SHALL be defined once in `state.mjs` and SHALL be re-emitted on every successful write so it is not lost when the YAML body is regenerated from the in-memory object. The YAML parse path used by `readState` SHALL ignore `#` comment lines.

#### Scenario: Header survives rewrite

- **WHEN** `writeState` is called twice on the same deck with updated state
- **THEN** the resulting `state.yaml` still begins with a `#` comment header
- **AND** `readState` still returns the expected playbook fields

### Requirement: State YAML parse/stringify uses a maintained YAML library

The shared `state.mjs` interface SHALL use the npm `yaml` package for production `_state/state.yaml` I/O. **Read** SHALL use tolerant `parseDocument` options (at minimum `strict: false`, and duplicate keys not fatal) then schema healing, analogous in intent to JSON `jsonrepair`. **Write** SHALL emit only `stringify` output plus the existing `#` header. Hand-written mini-YAML SHALL NOT remain the authority for production state I/O. Relocation under `shared/state/` SHALL NOT change these semantics.

#### Scenario: Round-trip encoding matches stack semantics

- **WHEN** `writeState` serializes a non-empty `playbook_stack` and `readState` parses the file
- **THEN** the parsed value is an array of objects with `playbook` and `current_node`
- **AND** no entry is the string `"[object Object]"`

#### Scenario: Dirty read is written back clean

- **WHEN** `state.yaml` parses but needs schema healing (for example `playbook_stack` as `{}`)
- **AND** `readState` runs with default heal
- **THEN** the returned state is usable
- **AND** the on-disk `state.yaml` body is rewritten as canonical YAML from library stringify

### Requirement: writeState ensures _state README exists

`PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs` SHALL export the canonical `_state/README.md` body used by bundle scaffolding. Before or as part of writing `state.yaml`, `writeState` SHALL ensure `_state/README.md` exists (create if absent) using that same body. `state.mjs` SHALL NOT import `bundle_layout.mjs`.

#### Scenario: Legacy deck gains README on next write

- **WHEN** a deck has `_state/state.yaml` but no `_state/README.md`
- **AND** `writeState` runs
- **THEN** `_state/README.md` is created with the canonical discoverability content

#### Scenario: State module does not import bundle_layout facade

- **WHEN** a developer inspects `shared/state/state.mjs` imports
- **THEN** it does not import `shared/run-bundle/bundle_layout.mjs`

### Requirement: Runtime Agents discover the consumer contract from generated run-bundle controls

An Agent entering a newly initialized run bundle SHALL encounter a generated root `AGENTS.md`/`CLAUDE.md` route to `deck-guide.md`. The guide SHALL explain the consumer essentials without referencing repo-only OpenSpec paths: parse the final failure envelope, use supported structured `diagnostic.next`, preserve invocation argument boundaries, stop when `requires_human` is true, do not guess omitted lineage, and never hand-edit `_generated/`.

Repository-maintenance discovery for MD implementation SHALL also be present in root `AGENTS.md` and short headers of `PPTMAKER_FRAMEWORK/scripts/shared/state/md_controller_reader.mjs` and `state.mjs`, pointing to `node-specification` and active deltas without duplicating field schema.

#### Scenario: New run bundle receives a CLI failure

- **WHEN** its runtime Agent follows generated entry guidance
- **THEN** it can act on a supported diagnostic without reading repository OpenSpec files
- **AND** it stops for human-owned decisions and preserves source/generated ownership

#### Scenario: Coding Agent changes MD consumption

- **WHEN** a repository-maintenance Agent edits MD-controller/state consumption behavior
- **THEN** root and code-adjacent instructions route it to `node-specification` plus active deltas

### Requirement: HTML review readiness has one deep module interface

`PPTMAKER_FRAMEWORK/scripts/shared/state/html_review_evidence.mjs` SHALL remain the single public owner of exactly the orchestration-level interfaces `inspectHtmlReviewReadiness(runDir)`, `recoverHtmlGatePublication(runDir, { confirmedOwnerToken } = {})`, `publishHtmlGateDecision(runDir, { gate, planHash, status, waiverReason })`, `publishHtmlDeliveryDecision(runDir, { decision, reason })`, and `resetHtmlProduction(runDir, { confirmedRunVersion })`. It SHALL canonicalize the run/version, classify the marker, resolve immutable plan/artifact bytes, compute current content/system/recipe/page/delivery fingerprints, and own all evidence/journal/reset publication internally. Callers SHALL not pass metadata gates, state records, manifest paths, fingerprints, reset IDs, timestamps, or SHAs as alternate truth. `confirmedOwnerToken` SHALL be accepted only by the explicit human-confirmed CLI route; normal build/check-gates/publication calls SHALL omit it. `confirmedRunVersion` SHALL be accepted only by the closed full-reset CLI route and SHALL exactly equal the normalized target version. Delivery reason SHALL follow the exact decision rules above and be stored for resume, not used as evidence/fingerprint input.

The module SHALL own one `normalizeHumanReason` rule for gate-waiver and delivery repair/redirect reasons: normalize CRLF/CR to LF, trim leading/trailing Unicode whitespace, preserve remaining Unicode scalars without normalization, reject NUL and C0 controls except LF/TAB, require non-empty, and cap serialized UTF-8 at 1024 bytes. Failure diagnostics SHALL report only invalid/missing/too-long classification and SHALL not echo reason text.

`inspectHtmlReviewReadiness` SHALL be strictly read-only, including when a journal or reset transaction exists. `recoverHtmlGatePublication` SHALL operate only on an existing journal using the exact recovery matrix and SHALL never create a new decision: old/old abort-cleanup, new/old mirror completion, new/new cleanup, exact reset-pending takeover cleanup, and old/new or every other third SHA fail closed. Without a token it SHALL allow only same-host dead-owner automatic recovery after 60000 ms. With an exact confirmed token it MAY recover cross-host/uncertain ownership only after 300000 ms and SHALL still reject a provably active same-host PID. `publishHtmlGateDecision` SHALL invoke automatic recovery without a token, canonicalize state, and then create the exclusive fence before publishing. `publishHtmlDeliveryDecision` SHALL require the journal absent, require the current controller node to declare the exact delivery decision, derive the canonical playbook index, and atomically publish both the reserved `html-delivery-review` record and current-execution node decision with an exact evidence reference in one `writeState`; it SHALL not require a later `setNodeDecision`. It SHALL recheck the state precondition before atomic write. `resetHtmlProduction` SHALL own the complete state-first invalidation, HTML-mirror reset, exact generated-owner deletion, and idempotent completion protocol defined by the main capability; no Controller or renderer caller may reproduce those steps. Plain state/status and direct `checkBundle` SHALL inspect only. `state --check-gates` and HTML build orchestration SHALL attempt automatic gate-journal recovery then inspect before readiness. Stage-4 readiness and controller completion SHALL consume the resulting snapshot. Tests SHALL cross these same interfaces; clock/filesystem fault seams MAY remain internal. Markerless logic SHALL remain outside this module except for returning a branch-inapplicable classification before writes.

All five orchestration interfaces SHALL remain synchronous, local-filesystem-only, and provider/browser-free so existing synchronous `checkBundle` callers do not change contract. To avoid a `bundle_layout` to HTML facade import cycle, the implementation SHALL place the single evaluator in implementation-private `html_review_evidence_core.mjs` or an equivalently named core that imports neither `bundle_layout.mjs` nor a Phase module. Exactly `bundle_layout.mjs` and the public evidence facade MAY import that core; architecture validation SHALL reject every other importer, and the core SHALL not become public. `bundle_layout.mjs` SHALL construct its trusted context only from its own canonical constants/resolvers and call that core for pipeline readiness; the public facade SHALL construct the same trusted context through public bundle-layout exports and call the same core. The core SHALL resolve a closed canonical byte map only through confined trusted-context resolvers, verify persisted plan/manifest/receipt references, and use the same pure versioned source-AST/review-projection contract modules that Phase 1/2/3 publication uses to derive content/system/recipe/page projections and fingerprints. Those contracts MAY use declared parser packages but SHALL import no Phase and perform no filesystem access/write, state mutation, browser/provider initialization, or publication. Phase interfaces SHALL retain confinement, resolution, higher-level validation, transaction, and publication ownership. This arrangement SHALL preserve notes-only, copy-only, visual-system, recipe, and page-dependency freshness distinctions and SHALL NOT create a second source/visual validator or trust stale generated `slide_plan.json` as current truth. The core/context interface SHALL not be exported as an alternate orchestration interface. No other caller may supply paths or a prebuilt context. External tests SHALL cover the five public interfaces plus `checkBundle` integration and parity goldens for all five change classes; internal fault seams remain implementation-private.

The inspection snapshot SHALL normalize the public readiness projection without leaking evidence bytes: exact pipeline/run version/state presence; content/visual decision plus `current|stale|missing|invalid`; content review-required; sorted outstanding recipe keys/slide IDs; delivery freshness/typed decision; reset with `status: absent|deletion-pending|complete`, `ownership: none|active|waiting|recoverable|uncertain|invalid`, and nullable non-negative `retry_after_ms`; and journal status `absent|active|uncertain|recoverable-abort|recoverable-mirror|recoverable-cleanup|recoverable-reset-yield|invalid|forbidden` plus optional opaque owner token when non-absent. Reset ownership SHALL be `none` unless pending; live same-host is `active`, dead-but-too-young is `waiting`, dead/old-enough same-host is `recoverable`, valid cross-host/PID-uncertain is `uncertain`, and malformed ownership is `invalid`. `retry_after_ms` SHALL be present only for a valid age-gated owner that has not reached its applicable 60000/300000-ms floor; it SHALL expose no timestamp/host/PID. Internal callers MAY receive the current nullable reset ID/owner proof and additional typed proof handles, but public state/status SHALL not receive reset IDs/tokens, raw SHAs, paths, source content, raw host/PID, or mutable records from which to implement a second validator.

#### Scenario: Metadata-only readiness is evaluated once

- **WHEN** state/status, checkBundle, and Stage 4 inspect the same scalar-approved but evidence-stale HTML run
- **THEN** each consumes the same snapshot and reports blocked readiness
- **AND** no caller independently upgrades the mirrors to approval

#### Scenario: Synchronous checkBundle remains compatible

- **WHEN** an existing caller invokes `checkBundle(runDir, "pipeline")` without `await`
- **THEN** HTML readiness uses the shared core synchronously and returns the existing violation-array shape
- **AND** no browser, provider, or asynchronous initialization starts

#### Scenario: Caller attempts to inject trusted paths

- **WHEN** an orchestration caller tries to pass a preview manifest path, state record, or prebuilt evaluation context
- **THEN** none of the five public interfaces accepts it
- **AND** only the bundle-layout-owned internal context reaches the core

#### Scenario: Approval publication is module-owned

- **WHEN** the CLI publishes a current visual decision
- **THEN** it passes only gate/hash/status/reason to the module
- **AND** the module derives timestamps, evidence, SHAs, journal transitions, and returned snapshot

#### Scenario: Plain status observes an interrupted gate write

- **WHEN** plain state/status encounters a recoverable new-state/old-metadata journal
- **THEN** inspection reports the exact recoverable condition without changing metadata or removing the journal

#### Scenario: Build recovers before readiness

- **WHEN** HTML build encounters that same recoverable journal
- **THEN** orchestration invokes explicit recovery, completes only the planned mirror, removes the journal, and then inspects readiness
- **AND** recovery creates no new approval decision

#### Scenario: Delivery decision encounters a gate fence

- **WHEN** final delivery publication starts while any gate journal exists
- **THEN** it returns `CONFLICT` before reading a human decision into state
- **AND** the gate transaction remains the only state/mirror writer

#### Scenario: Final decision binds current delivery

- **WHEN** a controller records `proceed|repair|redirect`
- **THEN** the module derives and validates current delivery/contact-sheet/assembly/notes lineage before publication
- **AND** callers cannot submit their own digest or receipt SHA

#### Scenario: Delivery evidence and node branch publish atomically

- **WHEN** the current declared final-review node records a valid decision
- **THEN** one atomic state write contains both current `html-delivery-review` and the current-execution node decision referencing it
- **AND** a crash exposes neither a system-only nor node-only decision

#### Scenario: Wrong current node records delivery review

- **WHEN** state current node does not declare the supplied final-review decision
- **THEN** publication fails before mutation and does not attach the decision to another node
