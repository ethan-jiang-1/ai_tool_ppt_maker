## Context

Change 1 established `workflow_inspection` as the canonical zero-write projection for one exact
run. Generic controller state and CLI/status routing still retain overlapping control decisions.
This Change removes only facts that the Change-1 ledger proves reconstructible, while preserving
all direct mutation owners and the Image Production physical/durable model for Change 3.

## Goals / Non-Goals

**Goals:**

- Give each supported user goal one deep workflow-entry Interface backed by inspection.
- Retire reconstructible generic node writes in checkpointed, reversible steps.
- Preserve raw state compatibility and direct-owner mutation-time revalidation.

**Non-Goals:**

- Change Image Production graph, directories, record keys, adapters, provider authorization, or
  whole-page implementation.
- Add a workflow cache, generic state setter, new CLI command, or an operation-catalog facade.

## Decisions

### D1 - Inspection is the sole caller-facing workflow seam

**Owner: MD<->JS protocol.** A workflow entry accepts a user intent plus exact run context and
returns the existing inspection projection's single ordered action. It does not accept or expose
owner-specific flags, hashes, state fields, authorization records, or recovery protocol beyond the
owner-issued bounded action. The module is deep because it hides direct-owner composition; it is
not a mutation authority. Deleting it would make every controller/CLI caller rebuild the same
ordering and gate logic.

### D2 - Retire generic state only from the ledger

**Owner: state.** For every candidate generic node field, the implementation records direct
owner/writer/readers/invalidation/reconstructibility/removal path before changing a writer. A
reconstructible record stops new writes; supported historical records remain readable until each
reader is either removed or explicitly retained with a future owner. Human intent that cannot be
reconstructed may remain only as a minimal durable fact under its direct writer's CAS boundary.

### D3 - Three checkpoint cutover

1. Controller and CLI routing consume inspection while legacy generic writes remain unchanged.
2. Ledger-approved generic writers stop writing; direct owners retain their existing writes.
3. Remove readers with no supported caller, or retain named compatibility readers.

Each checkpoint has focused regression before the next starts. Release rollback restores the prior
implementation; it never asks users to edit state. Existing state remains parseable throughout.

### D4 - Gate and mutation boundaries do not move

Inspection still reports owner classification. `guide` identifies a mechanical next action,
`confirm` exposes only owner-approved reasoned continuation, and hard-stop protects
identity/integrity/authorization/recovery without force or waive. Every mutation independently
rechecks direct facts, CAS/journal/receipt/provenance and authorization after entry returns.

## Risks / Trade-offs

- [Ledger misclassifies a record as reconstructible] -> writer retirement is checkpointed and
  restart/same-check tests prove the direct owner can rebuild the action before reader removal.
- [Entry grows into a facade] -> deletion test and a fixed goal-to-entry table reject entries that
  merely rename command sequences.
- [Compatibility survives indefinitely] -> each retained reader names its retirement owner and
  trigger; no new write is permitted.
- [Simplification bypasses gates] -> direct owner remains authoritative and hard-stop negative
  coverage proves no state/authorization/receipt bypass.

## Migration Plan

1. Capture ledger decisions and baseline contract tests.
2. Land the three checkpoints in order, with schema-compatible reads at every point.
3. On regression, release-rollback the checkpoint implementation and preserve existing durable
   bytes; do not run a user-state migration.

## Open Questions

- Which non-reconstructible human intent facts survive checkpoint 2, as proven by the ledger?
- Which existing CLI aliases need a time-bounded pure forwarding contract rather than removal?
