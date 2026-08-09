## ADDED Requirements

### Requirement: Requested execution resolution remains separate from durable state

For a supported current state, the State owner SHALL evaluate a caller's
requested run version as a separate typed execution-resolution result. A
successful result SHALL bind the caller to the exact active execution version
and current state identity. A version mismatch SHALL return the requested and
active versions in a bounded diagnostic result; it SHALL NOT be represented as
fields on, merged into, or returned as a durable state record that can enter a
state mutation. State consumers that intend to mutate Page Image lifecycle,
history, or delivery facts SHALL require a successful execution resolution
before their first derived-artifact, state/history, or provider action.

#### Scenario: Inactive Page Image request is rejected before delivery work

- **WHEN** a current state has active `run_version: v2` and a Page Image
  mutation is requested for `v1`
- **THEN** the state owner returns the bounded execution-version mismatch
  hard-stop with `v1` and `v2`
- **AND** it creates no derived artifact, state/history record, provider work,
  or source/generated mutation

#### Scenario: Durable state object remains within the current grammar

- **WHEN** a caller resolves a run version that differs from the active
  execution
- **THEN** no returned durable state record contains `code`,
  `requested_run_version`, or `active_run_version` as top-level state fields
- **AND** an otherwise valid state remains valid for subsequent read-only
  validation

### Requirement: Owner-controlled repair removes only the known execution mismatch signature

The State owner SHALL provide one explicit, deterministic repair operation for
the BUG-066 signature: top-level `code` with value
`execution_run_version_mismatch`, plus `requested_run_version` and
`active_run_version`. The operation SHALL be eligible only when the selected
run is the current active execution, the diagnostic versions exactly identify
that selected and active run, removing all three fields yields a fully valid
current state, and current source/state identity, journal, and CAS facts pass.
It SHALL atomically write the repaired state and append an owner-attributed
history event. The operation SHALL be idempotent after a successful repair.

All other unknown state fields, partial signatures, version disagreement,
inactive selections, failed validation, or changed CAS/journal/source facts
SHALL remain bounded non-writing hard-stops. The repair SHALL NOT infer a
replacement execution, source, workflow, receipt, evidence, or acceptance.

#### Scenario: Exact known signature repairs through the state owner

- **WHEN** the selected active run has exactly the BUG-066 top-level diagnostic
  triplet and the remaining current state passes complete validation
- **THEN** the state owner removes only that triplet through its atomic/CAS
  boundary and appends one repair history event
- **AND** a subsequent read-only validation succeeds without creating a new
  execution or derived artifact

#### Scenario: Valid state needs no second repair

- **WHEN** the selected active state is already fully valid and has no BUG-066
  triplet
- **THEN** a repeated or unnecessary repair operation reports the bounded
  no-repair-needed success without changing state or appending a history event
- **AND** it does not reinterpret the absence of the diagnostic triplet as a
  request for another repair

#### Scenario: Partial or broader state corruption is preserved

- **WHEN** an active state has the BUG-066 triplet plus another unknown field
  or a mismatched diagnostic version
- **THEN** the state owner returns its bounded non-writing hard-stop
- **AND** state bytes, history, source, generated artifacts, and provider work
  remain unchanged

## MODIFIED Requirements

### Requirement: State writes are atomic

writeState(deckDir, state, { journalOwnerToken, expectedStateSha } = {}) SHALL
retain a unique same-directory temporary write plus atomic rename and ignore
stale temporary siblings as truth. Every mutation of a supported current state
SHALL use the exact expected-state SHA from which its output was derived. The
writer SHALL verify that SHA before temporary creation and immediately before
rename. With a transaction journal present, a missing or mismatched token
returns CONFLICT before temporary creation; a matching token is valid only for
its journal-bound canonical output SHA. While a state-owned transaction is
active, only its closed owner operation may write its bound record.

Before temporary creation, the writer SHALL validate the complete candidate
against the current state grammar, including the allowed top-level key set,
schema, exact current source/state/run identity, and existing semantic
invariants. A failed validation SHALL reject the candidate without removing,
normalizing, or serializing its invalid field. Immediately before rename, every
writer SHALL recheck journal bytes/absence, current-state SHA, reset status/ID/
owner token, and current supported source/state identity. Any mismatch removes
only its own temporary file and leaves durable state unchanged. Unsupported
historical records are never write targets for writeState; their caller
receives one non-writing owner-issued typed next action.

#### Scenario: Current writer races a gate journal

- **WHEN** an ordinary node transition lacks the exact journal token while a
  journal exists
- **THEN** it returns CONFLICT before creating a temp file or changing state

#### Scenario: Candidate contains a non-state diagnostic

- **WHEN** a state mutation supplies a candidate with an undeclared top-level
  diagnostic key such as `code`
- **THEN** the writer rejects it before temporary-file creation or history
  append
- **AND** it does not silently strip the field and continue the mutation

#### Scenario: Historical state is not atomically rewritten into current form

- **WHEN** a pre-current or retired state protocol reaches a write path
- **THEN** the path stops before temp creation and leaves original bytes
  untouched
