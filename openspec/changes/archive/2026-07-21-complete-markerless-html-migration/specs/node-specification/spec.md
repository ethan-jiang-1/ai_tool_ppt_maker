## ADDED Requirements

### Requirement: Migration apply confirmation is an atomic receipt-bound state transition

The state owner SHALL expose one controller-only operation and API for
`migrate-import` confirmation: `ppt_flow state <source-run-dir>
--confirm-migration-apply --plan-hash <64-lowercase-hex>
--old-side-mode <verified-current|degraded-missing|degraded-stale>`. It SHALL
not be a generic node-state editor or accept arbitrary migration fields.

Before any state write, the operation SHALL delegate plan and receipt inspection
to the migration owner. It SHALL require a markerless source run, an active
`migrate-import` execution, completed `preview-html-migration` evidence in that
same execution, and active `confirm-html-migration`. The supplied hash/mode
must equal the current preview plan and its re-resolved source, candidate,
source-version-override, and backbone receipts. It SHALL also recompute the
current old-side mode/evidence and require exact equality with the preview
plan's mode/evidence; a transition between `verified-current` and either
degraded mode is stale comparison evidence, not a harmless improvement.
Source/candidate/inherited receipt drift, old-side evidence drift, missing plan,
malformed plan, a marked source, wrong version/run, wrong node or execution, or
a state/journal/reset CAS fence SHALL fail before mutation.

On success, one atomic state write SHALL record the typed user `apply`
decision on `confirm-html-migration`, complete it, and make
`apply-html-migration` the sole active node. Only that apply-node record may
contain `migration_plan_hash`, `old_side_mode`, and normalized
`migration_source_version`; all three SHALL be bound to the current execution
and supplied source run version. State-root fallbacks, aliases, and arbitrary
controller-node fields SHALL not authorize migration apply.

An exact retry after that transition SHALL return idempotent success without
rewriting state. A different hash/mode or changed receipt after prior
confirmation SHALL fail closed. `revise` and `decline` remain ordinary typed
controller decisions and SHALL not create apply binding, target publication,
approval, waiver, reset, or provider work. `applyHtmlMigration` and handoff
inspection SHALL consume only this exact active apply record.

#### Scenario: Exact confirmation becomes the active apply execution

- **WHEN** the Controller has an active migration confirmation node and the
  user accepts the current complete preview
- **THEN** the confirmation transition records `decision.value: apply` with
  `kind: user`, completes confirmation, and starts `apply-html-migration`
- **AND** the new active record has the exact plan hash, old-side mode, and
  normalized source version

#### Scenario: Stale confirmation has no side effect

- **WHEN** candidate or inherited input receipts drift after preview but before
  confirmation
- **THEN** the confirmation operation rejects before writing `_state/state.yaml`
- **AND** it creates no journal, staging directory, target version, approval,
  or provider request

#### Scenario: Old-side evidence changes after preview

- **WHEN** the candidate receipts remain current but the old-side evidence or
  `verified-current|degraded-*` mode changes after preview
- **THEN** confirmation rejects before writing state
- **AND** the Controller must show a fresh comparison before asking again

#### Scenario: A repeated exact confirmation is harmless

- **WHEN** the exact apply-node binding already exists for the current
  execution, hash, mode, source version, and receipts
- **THEN** confirmation reports idempotent success
- **AND** persisted state bytes remain unchanged
