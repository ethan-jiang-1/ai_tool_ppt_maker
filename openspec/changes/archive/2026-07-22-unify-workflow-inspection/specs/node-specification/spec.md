## MODIFIED Requirements

### Requirement: CLI exposes state via ppt_flow state command

`scripts/ppt_flow.mjs` SHALL retain `state <runDir>`, `state <runDir> --json`, and `state <runDir>
--check-gates`, plus closed HTML-only forms `state <runDir> --recover-gate-journal <owner-token>` and
`state <runDir> --record-delivery-review <proceed|repair|redirect> [--force] [--reason <text>]` on the
same registered command interface. Both forms SHALL be mutually exclusive with JSON/check-gates and
each other, resolve through `deckRoot`, and classify the canonical production marker before writes.
Recovery SHALL require an exact 64-lowercase-hex token plus the human-confirmed/age/owner rules.
Delivery recording SHALL call only `publishHtmlDeliveryDecision(runDir,{decision,reason,force})`,
require reset not pending and journal absent, derive current delivery identity itself, require a
normalized non-empty reason for `repair|redirect` or forced `proceed`, forbid a reason for normal
`proceed`, and accept no reset-ID/digest/path/SHA/timestamp overrides. Normal proceed SHALL require
complete current contact-sheet/assembly-v2/notes-v3 evidence. Forced proceed SHALL require current
target-version PPTX and contact-sheet bytes and MAY waive missing/stale lineage evidence; missing
reviewable artifacts, ambiguous target identity, unsafe paths, invalid state, or concurrency conflicts
remain hard stops. `repair|redirect` SHALL retain their complete-current-evidence requirement. Plain
`state`, `state --json`, and the shared status inspection SHALL call `readState` with
`purpose: observe, heal: false` together with the existing `validateStateReadOnly` diagnostic path; a
repairable state SHALL remain unmodified and return its owner action.
Existing execution and closed mutation commands retain only their already-owned execute/heal behavior,
including unambiguous schema-v3 migration. A historical markerless deck with no `_state/state.yaml`
SHALL be inspected through a non-persisted legacy compatibility projection; state/status/check-gates
SHALL not seed a file merely to report it. A marked HTML run with missing, ambiguous, or unusable
authoritative state SHALL fail closed with the producer-owned state-repair/replacement diagnostic rather
than fall back to metadata.

For markerless legacy, `--check-gates` SHALL retain the existing scalar `isGateApproved` compatibility
semantics and exit behavior using only legacy metadata `content_gate|visual_gate` and
`_state.gates.content|visual`; every `html_*` mirror/evidence field is ineligible. For `html-first-v1`,
`--check-gates` SHALL first invoke the explicit journal-recovery interface, then pass only when no reset
is `deletion_pending`, current normalized-version `html-content-review` and `html-visual-review` records
exist, their reset IDs equal the current nullable reset ID, each record has current source/projection and
recorded plan/artifact audit bytes, all owning content/system/recipe/page fingerprints are fresh, and the
approval journal is absent. An approved record SHALL additionally require complete plan evidence; an
incomplete waived record SHALL instead require its bounded reason/check snapshot and current computable
projection. Plain human/JSON state and status SHALL inspect/report journal/reset state without recovery
writes. Metadata gates or `_state.gates` scalar mirrors alone SHALL never pass HTML readiness. A
pending/stale/missing HTML review SHALL exit `1` with final envelope code `GATE_BLOCKED` and bounded
outstanding gate/recipe-key/slide-ID evidence. Active/uncertain journal ownership or `deletion_pending`
reset SHALL return `CONFLICT`; invalid journal or forbidden/third-SHA recovery state SHALL fail closed
with its repair diagnostic and SHALL not be flattened into approval or ordinary pending status.

Successful human and JSON state output SHALL remain a whole-session resume card and SHALL additionally
expose exact `pipeline`, whether durable state is present, and, for HTML, content/visual/delivery-review
decision, identity freshness, evidence completeness, waived checks, and outstanding recipe-key/page
coverage. `html-delivery-review` SHALL inform completion/suggested-next but SHALL not become a third gate
checked by `--check-gates`. A current user-accepted HTML delivery SHALL not report unavailable Phase-4
refinement as debt; incomplete evidence SHALL produce a repair recommendation without undoing the
current decision. Markerless compatibility output SHALL identify legacy-maintenance ownership without
fabricating an active execution record. `workflow_summary` and `suggested_next` remain non-empty;
waiting-first semantics and existing optional node fields/stack/gates remain when durable state exists.

#### Scenario: HTML scalar mirrors cannot pass gate check

- **WHEN** an HTML-first run has approved metadata and `_state.gates` scalars but missing or stale authoritative HTML review evidence
- **THEN** `state --check-gates` exits `1` with `GATE_BLOCKED`
- **AND** the diagnostic identifies bounded outstanding review evidence without treating mirrors as authority

#### Scenario: Current HTML reviews pass gate check

- **WHEN** both current-version HTML review decisions, their required audit/current-projection evidence, and settled journal state verify
- **THEN** `state --check-gates` exits `0`
- **AND** absence of `html-delivery-review` does not turn the two-gate check into a third gate

#### Scenario: Journal owner is active

- **WHEN** HTML gate checking encounters an active or uncertain approval-journal owner
- **THEN** it returns `CONFLICT` immediately
- **AND** neither scalar mirrors nor partial transaction bytes satisfy readiness

#### Scenario: Historical markerless state inspection is non-writing

- **WHEN** a markerless historical deck has no `_state/state.yaml` and Agent runs state, status, or check-gates
- **THEN** legacy compatibility semantics are reported without creating `_state/state.yaml`
- **AND** explicit controller entry remains the authority that initializes durable execution state

#### Scenario: Repairable state remains unchanged during plain observation

- **WHEN** plain state, state JSON, or status observes a state that execution could heal
- **THEN** observation returns the owning repair action without changing state, history, metadata, or generated artifacts
- **AND** only a later owner-authorized execution path may perform the defined heal

#### Scenario: Complete HTML state has no refinement debt

- **WHEN** current HTML gates, delivery, notes, and `html-delivery-review: proceed` verify
- **THEN** the resume card reports completion
- **AND** it does not suggest an unavailable lifecycle-4 node or create a placeholder record

#### Scenario: Controller records current final review

- **WHEN** the Controller has shown current HTML delivery and invokes state with `--record-delivery-review proceed`
- **THEN** JS derives and publishes the current version-scoped `html-delivery-review`
- **AND** no third gate or metadata gate field is created

#### Scenario: Repair omits reason

- **WHEN** Controller records `repair` without non-empty `--reason`
- **THEN** the command returns `USAGE` and writes no delivery-review record

#### Scenario: Proceed includes reason

- **WHEN** Controller records `proceed --reason ...` without `--force`
- **THEN** the command rejects the non-canonical combination before writes

#### Scenario: Forced proceed records an evidence waiver

- **WHEN** Controller records `proceed --force --reason ...` for current reviewable PPTX/contact-sheet bytes with incomplete lineage
- **THEN** the command publishes current user acceptance with `evidence_complete: false` and bounded `waived_checks`
- **AND** it does not invent missing receipt fields

#### Scenario: Caller supplies delivery digest override

- **WHEN** delivery-review state mode receives an unsupported digest/path/SHA/timestamp option
- **THEN** it returns `USAGE` before reading a human decision into state

## ADDED Requirements

### Requirement: Raw state observation nests workflow inspection without replacement
The state observation protocol SHALL retain the exact parsed durable-state document only as `durable_state`, plus independently readable schema, recovery, and debug card output. It SHALL NOT duplicate raw durable-state keys at top level. `workflow_inspection` SHALL be an additional nested projection and SHALL NOT become a state record, cache, migration target, or substitute for raw state; it SHALL NOT overwrite a `durable_state` field. Resume-card/status consumers SHALL use its primary action and observations rather than independently synthesizing mode, gate, recovery, or completion readiness.

#### Scenario: Raw state remains inspectable beside workflow projection
- **WHEN** Agent requests `state <runDir> --json` for a durable run
- **THEN** the response retains `durable_state`, recovery/card fields, and nested `workflow_inspection`
- **AND** no raw field is replaced by a derived inspection verdict

#### Scenario: Compatibility state remains observable
- **WHEN** a markerless historical run has no durable state
- **THEN** state exposes its existing compatibility/raw-state absence context with workflow inspection
- **AND** observation does not fabricate an active execution record

### Requirement: State mutation revalidates direct facts after observation
State-owned transition, gate, journal, reset, and recovery mutations SHALL continue to perform their existing direct-fact and CAS checks at write time. A workflow inspection result SHALL be consumed only as observation; it SHALL not satisfy an identity, receipt, provenance, authorization, journal, or CAS precondition.

#### Scenario: Journal changes after inspection
- **WHEN** a journal owner or state byte changes after a workflow inspection is produced
- **THEN** the subsequent state mutation revalidates the current journal and CAS facts
- **AND** it fails or follows the existing owner recovery path when they no longer match
