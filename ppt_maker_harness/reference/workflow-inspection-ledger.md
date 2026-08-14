# Workflow Inspection Ledger

This review document describes the direct owners read by `workflow_inspection`.
The machine-checkable source of truth is
`tests/contracts/workflow-control-ledger.json`; this document is not a runtime
registry or mutation authority.

| Fact | Direct owner | Inspection role |
| --- | --- | --- |
| Run-bundle layout and canonical source path | `bundle_layout.mjs` | Locate the exact source and version. |
| Current source marker | Page Image source parser | Establish current protocol identity. |
| Current state and execution binding | `state.mjs` | Project current lifecycle evidence and durable context. |
| Raw plan, authorization, and review | Page Image raw owner | Determine raw-generation prerequisites. |
| Final manifest, assembly, notes, delivery review | Page Image final owners | Determine completion and delivery action. |
| Structural preview and transaction journal | structural/state owner | Bind preview, apply, and recovery. |
| Foreign, unreadable, incomplete, or cross-lineage production identity record | `production-protocol` evaluator | Return the byte-preserving `repair-current-protocol-identity` hard-stop. |

Inspection never writes source, state, journals, metadata, receipts, or generated
output, and never submits a provider request. Each mutation owner validates its
direct facts and CAS preconditions again when it acts.

The shared hard-stop does not absorb a Harness binding failure, declared fresh
authoring draft, declared-current state defect, exact execution-version mismatch,
or attributable current delivery-media drift. Each remains with its direct
binding, narrative/workflow-selection, state, execution-version, or delivery
rebuild owner.
