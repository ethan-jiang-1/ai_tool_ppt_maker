# CLI Surface Specification (delta)

## ADDED Requirements

### Requirement: Progressive store-lock failures distinguish three legal next actions

When a progressive image2 mutation fails because the exclusive raw-owner store
lock is already held (`progressive_raw_store_locked`), the producer SHALL
classify the contention into exactly one of three states using lock-owner
liveness facts plus the current raw-owner snapshot, and SHALL emit the
corresponding typed next action:

1. **Live or unprovable writer** — the lock owner process is alive, or its
   liveness cannot be disproven (no readable lock-owner facts). The envelope
   SHALL use the closed next action `wait_then_reread` with
   `requires_human: false` and a `gate` category: wait for the active writer to
   exit, then re-run the same inspection; no mutation is offered.
2. **Dead writer with one unresolved submitted attempt** — the lock owner is
   provably not alive and the current snapshot has exactly one persisted
   `submitted` attempt with no terminal outcome. The envelope SHALL use the
   existing `reconcile` next action and SHALL carry the exact attempt selector
   (`attempt_sha256`) in its subject so the caller can run the one exact
   reconcile without re-deriving it.
3. **Abnormal contention** — the lock owner is provably dead and no
   reconcileable attempt exists. The envelope SHALL use `report_internal` with
   an `internal` category and SHALL name the anomaly: a store lock persists
   without a live writer or reconcilable attempt. An unprovable owner SHALL NOT
   be classified here — it stays a conservative wait.

Every branch SHALL keep the lock bytes untouched, SHALL NOT suggest deleting
the lock, rebuilding a batch, retrying a provider request, or resubmitting an
item, and SHALL NOT expose raw owner secrets. Only branch 2 permits the
`reconcile` next action.

#### Scenario: Live writer returns a wait action

- **WHEN** a mutation hits the store lock while its owner process is alive, or
  its liveness cannot be disproven
- **THEN** the envelope reports `next.action: wait_then_reread` with
  `requires_human: false`
- **AND** it does not offer reconcile, repair, review, or any mutation action

#### Scenario: Dead writer with a submitted attempt returns the exact selector

- **WHEN** a mutation hits the store lock, the owner is provably dead, and the
  snapshot has exactly one unresolved submitted attempt
- **THEN** the envelope reports `next.action: reconcile` and its subject names
  the exact `attempt_sha256`
- **AND** no other branch produces a reconcile action

#### Scenario: Abnormal lock returns a report

- **WHEN** a mutation hits the store lock with no live writer and no
  reconcileable attempt
- **THEN** the envelope reports `next.action: report_internal` and an
  `internal` category naming the anomaly
- **AND** the hint does not suggest deleting the lock or resubmitting provider
  work

### Requirement: `wait_then_reread` joins the closed next-action set

The closed CLI next-action set SHALL include `wait_then_reread`, which SHALL
mean: perform no mutation, wait until the named contention clears, then re-run
the same command to re-read the exact facts. It SHALL NOT be a human action
(`requires_human` stays `false`), SHALL NOT imply retrying a provider request,
and SHALL be emitted only when another writer owns the contention or its
liveness cannot be disproven (a conservative wait, never an anomaly report).

#### Scenario: The machine contract accepts the new action

- **WHEN** any failure envelope carries `next.action: wait_then_reread`
- **THEN** the CLI machine contract validates it as a closed action value
- **AND** the exit-matrix and help-contract audits accept it without a second
  parallel vocabulary
