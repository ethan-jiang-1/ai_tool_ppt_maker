## Why

The progressive Page Authority task projection exposes complete SHA-256 values
for plans, batches, evidence, handoffs, and its own projection digest. Those
values are necessary protocol identities, but they make the Controller's
run-scoped collaboration card hard for a human to scan and discuss.

The card is already a rebuildable, non-authoritative presentation surface.
This change improves that one surface now, while retaining complete digests in
every owner, storage, provider, diagnostic, and paid-operation contract.

## What Changes

- Add a pure, typed display-reference helper for already verified complete
  digests. References are scoped to one current task card and have no resolver
  or authority role.
- Render fixed eight-character typed references for the task card's structured
  owner and handoff facts. A fixed kind-to-prefix vocabulary and deterministic
  collision rank keep references distinct without ever displaying a complete
  digest.
- Remove the display-only projection digest from the task-card HTML comment and
  redact complete digest-looking tokens from rendered handoff notes without
  changing their persisted source records.
- Preserve full SHA-256 values in workflow inspection, state/owner records,
  content-addressed paths, locks, provider idempotency inputs, direct CLI JSON,
  diagnostics, and all `image2` exact selectors.
- Preserve the existing task-card refresh behavior: it remains an
  authority-read-only, provider-free collaboration projection that can neither
  advance state nor authorize work.

No breaking CLI, schema, storage, run-bundle, or historical-deck migration is
introduced.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `playbook-execution`: Define card-scoped typed display references, complete-
  digest redaction in rendered notes, and the unchanged non-authority boundary
  for the progressive Controller task projection.
- `run-bundle-layout`: Define the reserved progressive task card as a
  rebuildable collaboration view whose human-visible text uses non-authority
  display references rather than complete owner digests.

## Impact

- **Harness source:** the pure display-reference helper and the progressive
  task-card rendering boundary.
- **Harness tests:** focused reference behavior, task-card text, normal state
  refresh, and existing raw-owner/direct CLI/mock-journey regressions.
- **Control owner:** JS owns deterministic display formatting and redaction;
  the MD Controller continues to obtain lifecycle facts and next actions from
  workflow inspection and direct owners; humans retain only their existing
  quality decisions.
- **Run-bundle contract:** compatible. Existing decks are neither scanned,
  migrated, nor rewritten; a selected current card is simply rebuilt through
  its existing owner path.
- **Control simplification:** this adds no gate, state, selector, retry, or
  recovery branch. It centralizes scattered presentation truncation in one
  pure helper and leaves the direct owner-to-action control path unchanged.
- **Gate posture:** no `guide`, `confirm`, or `hard-stop` outcome changes.
  Exact identity, provenance, authorization, and recovery invariants remain
  protected by the existing owners; a card reference cannot waive or cross
  them.
