## Context

See [proposal.md](proposal.md) for the incident and motivation. The durable
source of truth is `_state/state.yaml`; its active `run_version` identifies the
only execution that may mutate shared state. Today `readState` folds a
requested-run mismatch diagnostic into the object that otherwise represents
durable state. Several consumers then test a different property name, and the
progressive handoff clones that object into `writeState`.

The Page Image CLI routes to both Framed and Pure adapter operations. Some
adapter operations create rebuildable plans, final manifests, or delivery
outputs before a state handoff, so state-owner rejection alone is too late to
meet the zero-mutation requirement. `writeState` already has identity, CAS,
and journal fences, but it serializes a candidate without full grammar
validation.

The direct source of record for active execution is the current state record;
the State module owns its evaluation and mutation. `cli-surface` remains the
producer of the public diagnostic. The MD Controller consumes the bounded
result and does not gain a second execution evaluator or recovery route.

## Goals / Non-Goals

**Goals:**

- Make selected-run resolution a discriminated, non-persistable State result
  shared by inspection, Page Image command routing, and state mutations.
- Stop inactive Page Image work before its first derived, source, state,
  history, or provider side effect.
- Make the final state writer reject every invalid candidate, especially an
  unknown top-level diagnostic field.
- Recover the exact BUG-066 signature through one auditable owner operation.

**Non-Goals:**

- No generic state repair, force, arbitrary field deletion, or manual-YAML
  workflow.
- No compatibility support, migration, or adoption for v2 Page Authority
  artifacts.
- No automatic scan or migration of production run bundles, and no change to
  `new-version`, continuation-target, provider authorization, or human
  acceptance semantics.

## Decisions

### 1. Introduce one internal execution-resolution seam

`state.mjs` will own a narrow resolver that accepts the selected `runVersion` /
`runDir` and returns one of two immutable variants:

```text
success: { ok: true, runVersion, state, stateSha, sourceIdentity, ... }
mismatch: { ok: false, code: execution_run_version_mismatch,
            requested_run_version, active_run_version }
```

The resolver reads the canonical state bytes, validates their current-state
identity, and compares the selected and active versions before exposing a
mutation-capable context. `readState` remains a durable-state reader: it will
return either a state-shaped read result or its existing bounded
unsupported/corruption result, but never caller-scoped mismatch fields spread
onto a state-shaped object.

`inspectRunProductionMode` and the Page Image target-evidence helper will
consume this resolver instead of testing an accidental field. State mutation
owners will require its success or create it internally before they clone a
state record. Existing CAS verification remains mandatory at write time; a
successful earlier resolver result is not permission to skip a fresh-byte
check.

This is a deeper module boundary than stripping keys in `prepareStateWrite`:
it gives every consumer the same direct fact and makes a mismatch impossible to
mistake for mutable durable data. The rejected alternative is updating only the
misspelled property checks, which leaves every future clone-and-write caller
able to persist diagnostics.

### 2. Preflight Page Image commands before adapter side effects

The run-scoped Page Image route in `ppt_flow.mjs` will resolve the active
execution before dispatching plan, review, refresh, build, or delivery work.
On a mismatch, it will translate that result directly instead of sending its
code to the generic unsupported-protocol/export reporter: the registered
failure envelope uses `FAILED` / `gate`, reason kind
`execution_run_version_mismatch`, requested/active versions as
`reason.actual`/`reason.expected`, and the existing zero-write `inspect` action
against the active run. It does not rerun or redirect the requested operation;
selecting a different mutation target remains outside this failure handler.
It will pass the successful context only through internal trusted calls; an
adapter must not accept caller-constructed state as authority. Framed and Pure
owners will also perform or receive that same preflight at each exported
mutation boundary so direct module callers cannot bypass the CLI route.

The delivery paths are explicit priority cases. They must resolve before final
manifest publication, not merely when `recordTargetProgressiveFinalManifest`
or `recordTargetProgressiveDeliveryReceipt` later reaches state. The progressive
handoff remains protected by the state-owner resolution and full writer check
as a backstop.

During implementation, enumerate the operations map and exported Pure/Framed
APIs into read-only and side-effecting entries. Every side-effecting entry
(plan publication, pilot/batch work, authorization, generation, review,
acceptance, reconciliation, finalization, delivery, and refresh) must reach
the shared preflight before its first write or provider call. Read-only
inspect/projection helpers remain outside that guard. This keeps the boundary
auditable without treating a function name or a test list as a second runtime
authority.

This duplicates neither policy nor state: one resolver produces the direct
fact, CLI translates only its result into the registered failure envelope, and
each side-effecting entry point uses it at its earliest legal boundary. The
alternative of guarding only `mutateProgressiveHandoff` protects YAML but can
still leave an inactive run with newly written derived output.

### 3. Validate the serialized candidate before a temporary write exists

`prepareStateWrite` will continue to remove only documented ephemeral
in-memory markers. It will not become a diagnostic scrubber. `writeState` will
build its canonical candidate, then run complete current-state validation over
that candidate before `ensureStateDirHints`, temporary-file creation, history
append, or rename. It will retain the existing replacement identity,
execution-binding, continuation-target, CAS, journal, and pre-rename checks.

Validation failure is a hard error that leaves the supplied candidate intact
in memory and the durable state unchanged. This makes the state grammar the
single writer admission check instead of relying on every caller to remember
top-level key exclusions. The alternative of deleting `code`,
`requested_run_version`, and `active_run_version` is rejected because it would
silently bless a broader corrupt candidate and create an unbounded repair
policy.

### 4. Add an exact, owner-controlled repair command

Add the mutually exclusive command form:

```text
ppt_flow state <active-run> --repair-known-execution-mismatch
```

The parser rejects either `--json` or `--validate-state` combined with this
flag as a usage error before binding, source, or State inspection. The repair
form is therefore the only state-command mutation path added by this change;
ordinary `state`, `state --json`, and `state --validate-state` retain their
observation semantics.

Its State-owned operation will read the raw current bytes and apply this exact
predicate in order:

1. The selected canonical run equals the active `run_version`.
2. The only unknown top-level fields are all three BUG-066 keys, and `code`
   exactly equals `execution_run_version_mismatch`.
3. `requested_run_version` equals the selected run and
   `active_run_version` equals the active run.
4. Removing precisely those three fields passes the complete current grammar
   and current source/state identity check.
5. Journal and CAS preconditions still hold at the owning writer.

Only then does the owner delete the three fields, call `writeState` with the
raw-state SHA, and append a typed repair history event after the state commit.
If the process stops after the atomic state commit but before history append,
the repaired state is still canonical. A later call sees only the valid state,
so it reports the bounded no-repair-needed success rather than claiming it can
prove a prior repair; history is audit support rather than a competing success
store. No state field is added for this repair.

The command is a deterministic `guide`: it needs no human risk acceptance.
Inactive execution, a partial/expanded signature, failed validation, an
identity conflict, or a live journal is an integrity `hard-stop`; no waiver,
force, or fallback may cross it. The nearest legal recovery is respectively
select the active run, preserve broader corruption for its owner action, or
retry the same exact command after the current conflict is resolved.

### 5. Keep the control path smaller than the failure it replaces

The direct fact is state bytes plus the selected canonical run. The existing
read decoration creates two competing interpretations of that fact: a
diagnostic-looking state record and separate guards. The resolver removes that
special case; the writer supplies one final grammar admission check; the repair
command supports one proven legacy signature. The resulting loop is:

```text
state bytes + selected run -> execution resolver -> one hard-stop or repair
  -> state owner -> rerun the same command
```

This deliberately avoids a new controller step, durable diagnostic field,
generic repair registry, or retry surface. Its focused negative tests prove
that the wrong run cannot write any owner and that a malformed broader record
cannot be repaired accidentally.

## Risks / Trade-offs

- [Previously hidden callers depend on decorated reads] -> Audit all callers
  that pass `runVersion` / `runDir` to `readState`; switch mutation paths to
  the resolver and add direct State API regression tests.
- [An adapter creates a file before it reaches state] -> Add preflight tests at
  the CLI route and both Pure/Framed exported mutation boundaries, capturing
  source, `_generated`, state, and history bytes before the inactive call.
- [Repair predicate becomes broader through future schema changes] -> Keep the
  three-key signature literal, require complete validation of the remainder,
  and reject any other unknown key.
- [A repair history append is interrupted after state commit] -> Preserve the
  valid repaired state and make rerun idempotent; do not add a second durable
  transaction or infer a failed repair from history absence.

## Migration Plan

1. Ship the resolver, writer validation, bounded repair operation, CLI flag,
   and focused tests together.
2. Do not scan or modify existing `deck_*` directories. An already polluted
   deck is repaired only when its owner invokes the explicit command against
   the active run.
3. After a successful repair, rerun the same read-only validation or intended
   active-run command. The repair leaves schema and protocol versions
   unchanged, so no artifact rebuild or content migration is necessary.
4. Rollback is code-only. Repaired state is ordinary valid current state and
   remains readable by the prior release; unrepaired state retains its original
   bytes. No rollback step edits generated artifacts or YAML manually.

## Validation Strategy

- **Unit:** State fixtures cover separated mismatch resolution, ordinary
  `readState` grammar, full writer rejection of unknown keys before temp files,
  and the exact repair predicate including no-op/idempotent, partial-signature,
  extra-key, inactive-run, source, journal, and CAS failures.
- **Integration:** First keep an explicit test-side inventory of every
  side-effecting operation in the Pure/Framed public operation maps. A shared
  guard contract exercises each inventory entry with active `v2` / requested
  `v1` inputs and proves preflight before source, `_generated`, state, history,
  or provider writes. Then run representative plan-side and delivery-side
  fixture journeys for both workflows, plus a successful active-run control,
  to prove the guard sits before both early and late lifecycle artifacts.
- **CLI / end-to-end:** A subprocess-level CLI fixture exercises inactive
  `ppt_flow build`, validates the final structured hard-stop (including its
  requested/active reason fields and active-run inspect action) and zero
  writes, then exercises the exact `state --repair-known-execution-mismatch`
  success, rejection, and mixed-observation forms without real provider
  credentials. Place this as a selected `tests_e2e/**/test_mock_*.mjs`
  zero-submission journey so the repository's mock-E2E runner can execute it.
  No browser or paid real-provider E2E is relevant to this deterministic state
  boundary.
