## Why

BUG-066 proved that an inactive Page Image run can reach the progressive delivery
state owner. `readState` decorates the durable state object with an
execution-version diagnostic, but the downstream guards check a different
field; a clone-and-write then persists those diagnostic fields as invalid YAML
keys and makes the whole deck state unavailable. The current state contract
already requires exact active-run identity and pre-write validation, so this is
an integrity breach that needs a single, owner-controlled repair path rather
than manual YAML editing.

## What Changes

- Separate requested-run execution resolution from durable state reads. A
  mismatch becomes a typed, non-persistable result; no reader returns a
  caller-scoped diagnostic as part of a writable state record.
- Make every Page Image mutation, including progressive delivery handoffs,
  consume the same exact-run resolution before it creates a derived artifact,
  enters a state transition, or makes provider work possible. An inactive run
  hard-stops with its requested and active versions intact.
- Make `writeState` reject a candidate that fails the complete current state
  grammar, including unknown top-level fields, before creating a temporary
  file. It must not silently remove invalid fields and continue the mutation.
- Add the narrow `ppt_flow state <active-run> --repair-known-execution-mismatch`
  recovery operation. It repairs only the exact BUG-066 diagnostic triplet
  through the state owner, CAS, and history when removing it yields a fully
  valid current state; all other corruption remains a non-writing hard-stop.
- Add focused Pure/Framed regression coverage proving inactive delivery fails
  before all source, generated-artifact, state, history, and provider writes,
  plus owner-repair coverage for the known signature.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `node-specification`: durable state reads, exact execution selection,
  pre-write validation, and the owner-authorized repair contract must preserve
  active-run identity and reject non-state diagnostics.
- `cli-surface`: run-scoped Page Image operations, especially `build`, must
  fail closed before work on an inactive run; the state command gains one
  bounded, deterministic repair form.

## Impact

- Harness source: `ppt_maker_harness/scripts/shared/state/state.mjs`,
  Page Image route/delivery owners, and `ppt_maker_harness/scripts/ppt_flow.mjs`.
- Tests: state, Pure, Framed, and CLI/integration coverage under `tests/` and
  `tests_e2e/` as warranted by the public repair option.
- Control owner: JS/CLI owns exact identity evaluation, mutation, diagnostics,
  and deterministic recovery; the MD Controller only presents the emitted
  action. No human decision is required for the exact known signature.
- Run-bundle contract: compatible. Existing production decks are never scanned
  or migrated; an already polluted deck is repaired only by an explicit
  active-run owner operation.
- Control policy: this is an integrity `hard-stop` for inactive execution,
  while the exact known-signature repair is a deterministic `guide`. The
  shortest loop is direct state bytes -> exact evaluator -> one owner action ->
  rerun; it replaces manual state editing and does not add a generic retry,
  force, or repair surface.
