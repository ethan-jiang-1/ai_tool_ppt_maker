## ADDED Requirements

### Requirement: CLI exposes a closed versioned production-transition protocol

`ppt_flow state` SHALL add closed mutually exclusive operations for a cross-pipeline source run:
`--prepare-production-mode-transition <html-only|html-then-image2|image2-only>`,
`--preview-production-mode-transition`, `--confirm-production-mode-transition --plan-hash <hash>`,
`--apply-production-mode-transition --plan-hash <hash>`, and
`--confirm-production-mode-transition-recovery --owner-token <64-lowercase-hex>`, and
`--recover-production-mode-transition [--owner-token <64-lowercase-hex>]`.  Recovery without a live
journal uses the same closed recovery operation with no owner token only when state can identify one exact
visible target receipt; an owner token is otherwise required for journal recovery.  A cross-host or
otherwise uncertain journal additionally requires the Controller's persisted explicit no-active-apply
confirmation after the 300000-ms age floor; same-host proven-dead recovery is automatic only at or after
60000 ms and a live same-host owner is non-overridable.  These are the only cross-pipeline transition
forms.
They SHALL delegate to the state-owned transaction and selected adapter; they SHALL not be a generic
state editor, accept caller-supplied receipt/lineage paths, or accept `--force`.

The recovery-confirmation form is valid only for the exact active uncertain transition journal after its
300000-ms age floor. It accepts no plan/source/target path or human-claim text from the caller. The state
owner first verifies the token and journal bytes, then writes its closed user no-active-apply confirmation
record through expected-state CAS. Success reports only the bound source/target versions, plan hash,
journal digest, and next recovery action; it never reports the token. Any later journal/state/plan/source-
execution/target drift invalidates the record. The recover form consumes no human confirmation supplied
only in prose or CLI flags.

Prepare and preview SHALL be local/offline and SHALL leave the source active controller pointer unchanged.
Confirmation is the first state write: after the human accepts the exact preview, it binds the source
execution and makes the bounded transition execution active.  The target mode in prepare and every
candidate/input/source-state receipt, anticipated target version, target marker expectation, source
execution identity, and explicitly authored target-intake digest in preview SHALL be covered by the plan hash. Apply SHALL rederive that same hash and
revalidate the active confirmation before reservation or publication.  HTML-to-Image2 preview SHALL not resolve transport or
submit a provider request; Confirmation SHALL create only the transition branch's exact active
`migrate-import/apply-production-mode-transition` record; it SHALL not write legacy migration fields or
activate `apply-html-migration`.  Successful Image2 target publication SHALL report the later normal
authorization/pilot/build boundary.  Image2-to-HTML preview SHALL report source/candidate/contract
validity and may emit current renderer evidence, but SHALL not report an HTML quality score, visual
parity verdict, or quality retry action.  Confirmation is a `confirm` gate on the exact mode/hash;
missing authority, stale inputs, conflict, or invalid provenance is a hard-stop before writes.

`ppt_flow migrate-html` SHALL retain its historical compatibility grammar but SHALL reject a source with
durable authoritative production-mode state before preparing or previewing a cross-pipeline candidate, and
direct the Controller to the closed state transition protocol.  It SHALL not alias, partially invoke, or
recover a mode transition.  The only narrow compatibility continuation is an exact historical
legacy-to-HTML checkpoint: `state --confirm-migration-apply` MAY finish an active
`migrate-import/confirm-html-migration` checkpoint only after its exact preview inspection proves the
selected source version/hash/mode, and `migrate-html apply` (including `--recover-journal`) MAY finish only
an active `migrate-import/apply-html-migration` record whose execution ID, `migration_source_version`,
plan hash, and old-side mode agree and whose journal or success receipt, when present, also agrees.  That
exception creates no new legacy candidate or preview, accepts no alternate source version, and may use
only the legacy receipt-bound target handoff.  A durable source without one of those exact pre-existing
checkpoints SHALL use the closed state transition protocol.

#### Scenario: HTML-to-Image2 preview is offline

- **WHEN** a valid HTML source previews an explicitly authored `image2-only` candidate
- **THEN** CLI returns the exact target mode, plan hash, and later Image2 authorization boundary
- **AND** it makes no provider request or target version write

#### Scenario: Image2-to-HTML selects the target mode

- **WHEN** a consistent Image2 source prepares an `html-then-image2` candidate
- **THEN** CLI preserves the source and reports the selected HTML target mode rather than silently choosing `html-only`

#### Scenario: Confirmation flags conflict

- **WHEN** a caller mixes transition operations, JSON, gate recovery, delivery-review, or an unrelated state operation
- **THEN** CLI returns one `USAGE` envelope before source/state/candidate/target mutation

#### Scenario: Apply lacks current confirmation

- **WHEN** apply receives a missing, stale, or mismatched plan hash
- **THEN** CLI hard-stops before reservation/publication and directs the Controller to the exact preview checkpoint

#### Scenario: Declining an unconfirmed transition is non-writing

- **WHEN** the Controller does not call confirmation after displaying an exact preview
- **THEN** the source execution/current node and authoritative source mode remain unchanged
- **AND** no transition playbook execution or target version is created

#### Scenario: Recovery grammar is closed

- **WHEN** a caller combines recovery or recovery confirmation with prepare, preview, confirm, apply, JSON, a different state operation, or an invalid owner token
- **THEN** CLI returns one `USAGE` envelope before state, journal, staging, source, or target mutation

#### Scenario: Uncertain recovery requires a durable confirmation

- **WHEN** an old-enough cross-host or otherwise uncertain journal is recovered without a current matching recovery-confirmation record
- **THEN** CLI hard-stops before takeover and names the closed confirmation form
- **AND** a stale confirmation cannot be replayed after journal-byte or plan drift

#### Scenario: Existing migration command cannot fork the protocol

- **WHEN** a mode-governed Image2 source without an exact active legacy migration checkpoint invokes `migrate-html prepare`, `preview`, or `apply`
- **THEN** CLI returns transition guidance before candidate, state, journal, or visible-target mutation
- **AND** it names the closed `state` transition checkpoint rather than performing a partial legacy migration

#### Scenario: Upgraded legacy checkpoint may finish but cannot start another migration

- **WHEN** a markerless source has an exact pre-existing `migrate-import` legacy confirmation or apply checkpoint and schema-v5 mode state is installed
- **THEN** its matching `state --confirm-migration-apply`, `migrate-html apply`, or owner-scoped `migrate-html apply --recover-journal` continuation remains available
- **AND** `migrate-html prepare` or `preview`, a mismatched plan/source/execution, or a new durable-mode request returns transition guidance before mutation

#### Scenario: Confirm creates only the transition branch record

- **WHEN** the Controller confirms an exact production-mode transition preview
- **THEN** state starts `migrate-import/apply-production-mode-transition` with the exact transition hash/source execution/target mode/version bindings
- **AND** it does not populate `migration_plan_hash`, `old_side_mode`, or `apply-html-migration`

#### Scenario: Confirmation accepts target intake rather than source intake

- **WHEN** the Controller confirms a transition preview with its explicit target topic, audience, and success criteria
- **THEN** the exact plan binds those target-intake fields and the target handoff may record only new target user intake evidence
- **AND** a source controller decision cannot satisfy the target intake node

## MODIFIED Requirements

### Requirement: Public CLI exposes one production-mode surface

`ppt_flow init` SHALL accept exact `--mode html-only|html-then-image2|image2-only` and default to
`image2-only`. The closed state grammar SHALL retain exactly:

- `ppt_flow state <run-dir> --set-production-mode <mode>` for an exact same-pipeline mode transition;
- `ppt_flow state <run-dir> --repair-production-mode-mirror` to copy the exact authoritative mode/version into metadata;
- `ppt_flow state <target-run-dir> --register-production-mode-from <source-run-dir>` for idempotent same-pipeline post-publication registration; and
- `ppt_flow state <run-dir> --record-image2-delivery-review <proceed|repair|redirect> [--reason <text>]` for first-class whole-page final review; and
- only the closed cross-pipeline transition forms defined above: prepare with requested target mode,
  preview, confirm with exact plan hash, apply with exact plan hash, durable recovery confirmation, and
  owner-scoped recovery.

All forms SHALL be mutually exclusive with one another and with JSON, gate checks/recovery, and
delivery-review forms. Same-pipeline registration SHALL reject a source outside the same deck, a
non-visible target, a changed/conflicting relationship, and cross-pipeline use; the historical migration
owner MAY call its internal explicit-`html-only` registration only after verifying its exact migration
success receipt. Cross-pipeline target mode registration is permitted only inside the transition state
owner's verified receipt-bound handoff; it shall not be exposed through
`--register-production-mode-from` or caller-supplied source/target/mode arguments. Same-pipeline HTML
transitions SHALL delegate to the state owner, while cross-pipeline requests through the in-place setter
SHALL return typed `transition_required` guidance without state, source, generated-tree, or current-version
mutation. Help and successful init/mode/registration/repair/transition results SHALL include normalized
run or source/anticipated-target version, selected mode, derived pipeline, exact plan hash where
applicable, and nearest next action.

Unknown mode values, missing/corrupt authority, selected-run execution mismatch, mode/source mismatch,
or CAS conflict SHALL use the existing one-final-JSON diagnostic producer and SHALL fail before
branch-specific readiness, provider credentials, generated paths, or writes. CLI return audits SHALL cover
every new success and non-zero path without copying the diagnostic schema into MD consumers.

#### Scenario: Cross-pipeline registration has no generic CLI bypass

- **WHEN** a caller invokes `state --register-production-mode-from` for source and target with different pipelines
- **THEN** the command rejects before state, metadata, source, or target mutation
- **AND** only the exact confirmed transition handoff may register the selected target mode

#### Scenario: Init omits mode

- **WHEN** `ppt_flow init` is called without `--mode`
- **THEN** stdout reports `image2-only`, its whole-page pipeline, and the Image2-primary next action

#### Scenario: Invalid mode is supplied

- **WHEN** init or a mode transition receives an unknown mode
- **THEN** CLI returns `USAGE` through the registered diagnostic envelope before creating or changing a bundle

#### Scenario: Same-pipeline transition succeeds

- **WHEN** the exact run changes from `html-only` to `html-then-image2` with current expected state
- **THEN** CLI reports the old/new mode and unchanged `html-first-v1` pipeline
- **AND** it does not submit provider work

#### Scenario: Cross-pipeline transition is deferred

- **WHEN** the exact run requests `image2-only` from an HTML mode
- **THEN** CLI reports typed versioned-transition guidance and makes no state/source/generated mutation

#### Scenario: Published target registration is retried

- **WHEN** the exact same-pipeline target is visible but its prior mode registration was interrupted
- **THEN** `state --register-production-mode-from` commits or reports the already-current target record idempotently
- **AND** it does not copy source gates, node completion, or generated evidence

#### Scenario: State operation flags are mixed

- **WHEN** a caller combines mode transition, mirror repair, registration, JSON, gate, or delivery-review forms
- **THEN** CLI returns `USAGE` before state, metadata, source, or target mutation
