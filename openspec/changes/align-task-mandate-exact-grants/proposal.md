## Why

The control policies and `CONTEXT.md` promise that one clear Work Request is
enough for normal in-scope provider work. The current progressive Page Image
runtime contradicts that promise: it classifies every Pilot selection and exact
batch grant as a human-required cost confirmation. This makes an Agent ask the
same question repeatedly even though it still needs to preserve exact plan,
batch, attempt, cost, and provenance evidence.

This change aligns the running Page Image raw-owner and Controller path with the
accepted Task Mandate policy before larger Page Class or Framed-composition
work begins.

## What Changes

- Add one durable, non-secret Page Image Task Mandate reference for the active
  current version/workflow/execution. Normal provider-free planning establishes
  or reuses it without copying Work Request prose into state.
- Bind newly published progressive raw plans and their later exact batch grants
  to that mandate while retaining the current exact plan hash, batch hash,
  selected IDs, maximum submissions, attempt reconciliation, cost ledger, and
  provenance chain.
- Reclassify Task-Mandate-covered Pilot scope selection, successor planning,
  and exact batch grant creation as Agent-run `guide` actions. A routine
  `image2` diagnostic must no longer set `requires_human: true` merely because
  the runtime is recording ordinary provider cost.
- Keep human-owned visual decisions intact: partial Pilot review and Complete
  Page Review remain explicit quality decisions, with Complete Page Review
  retaining its single `proceed | repair` branch. Identity, integrity,
  recoverability, and uncertain-attempt hard-stops remain non-bypassable.
- Preserve historical plan/grant evidence byte-for-byte. Legacy raw work may be
  inspected and reconciled, but it is never silently upgraded or used for a
  new provider submission without a newly planned Task-Mandate-bound scope.

This change does not add a generic budget system, arbitrary provider scope
flags, a natural-language authorization parser, automatic visual acceptance,
or a Task Mandate field in the Presentation Control Map. It intentionally does
not change the separate Style Master candidate-grant lifecycle; that owner
needs its own scoped follow-up.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `image-generation`: Bind current progressive Page Image raw work to an active
  Task Mandate while preserving immutable exact-grant and attempt lineage.
- `node-specification`: Define the durable Task Mandate state record and the
  Controller's typed, non-user handling of a mandate-covered grant.
- `cli-surface`: Keep the fixed `image2` forms but expose routine
  Task-Mandate-covered actions as non-human diagnostics and preserve bounded
  stops for out-of-scope work.
- `playbook-execution`: Replace repeated batch-cost decision nodes with
  Agent-owned exact-grant steps while retaining human visual-review branches.

## Impact

- **Affected Harness sources:** `state.mjs`, the progressive raw plan/grant
  schema and owner, selected Framed/Pure plan publication, workflow inspection
  and task projection, `ppt_flow.mjs`, and `playbook/create-deck.md`.
- **Affected tests:** progressive raw-owner/schema/state coverage, workflow
  inspection and task-projection coverage, MD Controller parsing, and public
  `image2` diagnostic tests for both Framed and Pure routes.
- **Control owner:** MD translates a clear Work Request into normal scope; JS
  owns mandate/grant validation and durable lineage; the human owns new goals,
  explicit limits, and visual quality decisions.
- **Run-bundle contract:** compatible for observation and recovery of historic
  evidence. New provider work requires a newly planned current mandate-bound
  raw scope; no `deck_*` bundle, including v3 production evidence, is migrated
  or edited in place.
- **Control policy:** the change applies
  `human-centered-gates.md`, `agent-assistance-and-control.md`, and
  `simple-reliable-control.md` by removing repeated routine confirms while
  preserving the shortest exact-grant-to-submit path and all hard-stop
  invariants.
