## MODIFIED Requirements

### Requirement: HTML content and visual approval are exact-evidence-hash bound

The public `approve <run-dir> content|visual` command SHALL require an exact current plan hash for
`approved`. `--waive --reason` SHALL accept a missing/incomplete quality plan only when the canonical
HTML source parses and current run version/reset identity is known. It SHALL publish through the same
gate owner/journal/CAS authority with gate `status: waived`, a bounded reason, and a bounded
`waived_checks` list. `evidence_complete` SHALL reflect the actual evidence: it MAY be true for a
complete intentional waiver and SHALL be false when checks are missing. A caller-supplied non-matching
plan hash SHALL return `CONFLICT` or `GATE_BLOCKED` without mutation. HTML legacy gate fields SHALL
remain untouched. A `deletion_pending` reset SHALL return `CONFLICT`; a pre-reset plan hash SHALL be
stale even when rebuilt raw artifacts are byte-identical. Legacy visual/header approval syntax and
evidence SHALL remain isolated. A stale or missing hash on ordinary approval SHALL fail with a
human-review next action and no gate mutation.

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

### Requirement: approve dual-writes metadata and _state gates

`ppt_flow approve <runDir> <gate>` SHALL classify the run before validating approval evidence. For
markerless legacy, existing metadata `content_gate|visual_gate` and `_state.gates.content|visual`
compatibility writes/reads SHALL remain and HTML approval SHALL never overwrite them. For
`html-first-v1`, ordinary content and visual approval SHALL require no reset pending plus the exact
current-reset hash of an `approvable: true` plan covering every outstanding evidence item; scoped,
incomplete, or pre-reset plans SHALL fail and list missing/stale evidence. An explicit
`--waive --reason` MAY instead bind the current computable source/projection/reset/version identity when
the plan is missing or incomplete; it SHALL publish `status: waived`, bounded `waived_checks`, and
independent `evidence_complete`, and any supplied hash SHALL match exactly. Successful publication
SHALL write one version-scoped/current-reset `html-content-review` or `html-visual-review` record under
authoritative `_state`, update only `_state.gates.html_content|html_visual` plus matching
`_state.gates.html_content_run_version|html_visual_run_version`, then update only metadata
`html_content_gate|html_visual_gate` plus matching run-version fields through the recoverable journal
protocol. These HTML fields are compatibility/status mirrors; they SHALL use status
`pending|approved|waived`, exact normalized run version, and SHALL never satisfy legacy or HTML
readiness by themselves. A waiver SHALL require a reason accepted by the shared 1024-byte
`normalizeHumanReason` rule. Ambiguous or unrecoverable partial writes SHALL fail closed.

#### Scenario: HTML visual approval binds current evidence

- **WHEN** Agent approves visual with the exact current HTML review-plan hash
- **THEN** authoritative current-version visual evidence is published before mirrors are synchronized
- **AND** the record binds current preview/fingerprint evidence

#### Scenario: HTML waiver omits a reason

- **WHEN** Agent requests an HTML gate waiver without an explicit reason
- **THEN** approval fails without changing authoritative evidence or mirrors

#### Scenario: HTML scoped plan is incomplete

- **WHEN** ordinary approval supplies a current hash whose plan is non-approvable because other evidence is outstanding
- **THEN** approval fails, identifies the missing IDs/coverage, and writes neither state nor mirrors

#### Scenario: HTML incomplete plan is explicitly waived

- **WHEN** current source/reset/version identity is valid and Agent supplies `--waive --reason` for that incomplete plan
- **THEN** the gate publishes `status: waived` with bounded failed checks
- **AND** readiness reports the waiver decision separately from evidence completeness

#### Scenario: Legacy approval remains compatible

- **WHEN** Agent approves a markerless legacy gate
- **THEN** existing metadata and `_state.gates` values remain synchronized

#### Scenario: HTML approval coexists with approved legacy version

- **WHEN** one deck has markerless legacy gate scalars and an HTML version is approved
- **THEN** HTML publication changes only `html_*` mirror fields and authoritative HTML evidence
- **AND** legacy `content_gate|visual_gate` plus `_state.gates.content|visual` remain byte-semantically unchanged

### Requirement: state prints a where-am-I resume card

`ppt_flow.mjs state` human output and successful `--json` output SHALL retain the whole-session
where-am-I card and SHALL classify the canonical production marker before state interpretation. The card
SHALL expose non-empty `workflow_summary` and `suggested_next`, exact `pipeline`, and `state_present`.
When durable state exists it SHALL retain active `playbook`, `current_node`, current-node status,
optional `waiting_for`/`note`, gates, and `playbook_stack`. For a historical markerless deck without
state it SHALL expose legacy-maintenance ownership through a non-persisted compatibility card, leave
absent execution fields explicitly null/not-active, and SHALL not create `_state/state.yaml`. When the
exact migration target receipt exists but its source execution handoff is absent, state/status SHALL
expose `migration_handoff_pending: true`, source/target version, and resume guidance without writing or
leaking receipt SHAs/paths; all other outputs use false/null.

`state --recover-gate-journal <owner-token>` SHALL be a closed HTML-only repair operation requiring the
exact token previously shown by plain state/status. `state --record-delivery-review
<proceed|repair|redirect> [--reason <text>]` SHALL be the only public publication route for
`html-delivery-review`; it SHALL derive current evidence through the deep module, require a reason for
`repair|redirect`, forbid a reason for normal `proceed`, and accept `--force --reason` for a current
reviewable PPTX/contact-sheet proceed with an evidence waiver. Both operations SHALL be mutually
exclusive with `--json`, `--check-gates`, and each other and SHALL emit no ordinary resume card until
their transaction completes. Markerless runs SHALL reject both before writes with branch-inapplicable
guidance.

For HTML-first, human output and top-level JSON `html_reviews` SHALL expose the exact bounded snapshot:
content/visual objects with `decision: pending|approved|waived` and
`freshness: current|stale|missing|invalid`, plus independent `evidence_complete` and bounded
`waived_checks`; content `review_required` boolean; visual sorted `outstanding_recipe_keys` and
`outstanding_slide_ids`; delivery with `freshness: current|stale|missing|invalid`,
`decision: null|proceed|repair|redirect`, `reason_present` boolean, independent
`evidence_complete`, and bounded `waived_checks`; reset with `status:
absent|deletion-pending|complete`, `ownership:
none|active|waiting|recoverable|uncertain|invalid`, and nullable `retry_after_ms`; and journal
`status: absent|active|uncertain|recoverable-abort|recoverable-mirror|recoverable-cleanup|recoverable-reset-yield|invalid|forbidden`
plus optional `owner_token` of exactly 64 lowercase hex when non-absent. Plain state/status SHALL not
expose reset IDs/tokens, claim timestamps, bound SHAs/paths/raw owner data, or perform recovery. For
markerless compatibility, `html_reviews` SHALL be null and pipeline SHALL be exact
`legacy-image2-first`; HTML uses exact `html-first-v1`.

For content, visual, and delivery, `evidence_complete` SHALL be `true|false|null`: null means no valid
record can establish completeness. `waived_checks` SHALL be the record's canonical list or an empty
array when no valid waiver record exists; it SHALL not be synthesized from a diagnostic.

Suggested-next SHALL be waiting-first, then journal conflict/repair, then owning stale/missing review
or delivery action, and SHALL never present unavailable Phase 4 as required debt after a current user
accepted delivery. Card construction SHALL remain in the shared state module so `status` consumes the
same semantics without mutating state. Deck resolution SHALL use `deckRoot(resolve(runDir))`. The
complete CLI surface SHALL remain exactly 15 top-level commands.

#### Scenario: HTML resume card exposes outstanding review

- **WHEN** an HTML-first run has current content approval but stale page evidence for two slides
- **THEN** state output identifies the HTML pipeline and the two sorted outstanding slide IDs
- **AND** suggested-next names the visual-review path rather than Image2 refinement

#### Scenario: Complete HTML card omits Phase-4 debt

- **WHEN** current delivery, notes, gates, and `html-delivery-review: proceed` verify
- **THEN** workflow summary reports a complete deliverable
- **AND** suggested-next does not require lifecycle 4 or create optional-refinement state

#### Scenario: Forced delivery card remains transparent

- **WHEN** current target PPTX/contact sheet support forced `proceed` but lineage evidence is incomplete
- **THEN** the card reports current user acceptance with `evidence_complete: false` and bounded `waived_checks`
- **AND** suggested-next recommends repair without fabricating a missing receipt

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
- **AND** it does not tell the human to edit `_state` or invent approval

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

## ADDED Requirements

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
