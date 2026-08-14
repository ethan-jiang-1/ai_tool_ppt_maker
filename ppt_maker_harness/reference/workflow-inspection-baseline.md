# Workflow Inspection Baseline

Inspection is read-only. It projects one current Page Image action, or one
bounded owner-issued hard-stop for an undeclared, partial, hybrid, missing, or corrupt
pair. It never writes state, submits a provider request, or accepts generated
artifacts as authority.

| Journey | Direct facts | Expected primary action | Writes / remote work |
| --- | --- | --- | --- |
| Fresh current run | source/state, raw/final/delivery evidence | current lifecycle owner | 0 / 0 |
| Framed local refresh | source and accepted raw evidence | local finalization owner | 0 / 0 |
| Pure or raw-contract refresh | source and raw evidence | raw planning/authorization owner | 0 / 0 |
| Notes refresh | final manifest and assembly receipt | notes owner | 0 / 0 |
| Structural versioning | stable IDs, order, preview receipt | preview or exact-hash apply owner | 0 / 0 |
| Foreign, unreadable, incomplete, or cross-lineage production record | direct source/state/evidence/delivery prerequisites | `production-protocol` `repair-current-protocol-identity` hard-stop | 0 / 0 |
| Declared fresh authoring draft | direct draft facts | narrative/workflow-selection owner | 0 / 0 |
| Declared-current state defect | direct state facts | state owner | 0 / 0 |
| Exact Work Version mismatch | requested and active execution versions | execution-version owner | 0 / 0 |
| Attributable current delivery-media drift | current final/receipt lineage and derived media | delivery rebuild owner | 0 / 0 |
| Interrupted transaction | journal and owner binding | recovery owner | 0 / 0 |

## Observation Invariants

- `status` and `state --json` consume the same inspection projection for the
  same direct-fact checkpoint.
- Changed facts produce a fresh bounded action rather than a cached conclusion.
- Raw durable state is exposed only through the designated state report field.
- Mutation owners revalidate their direct facts and CAS fences at write time.
- The invalid-current-contract hard-stop preserves source, state, evidence, and
  delivery bytes; it does not initialize state, refresh a task projection, or
  initialize a provider.
