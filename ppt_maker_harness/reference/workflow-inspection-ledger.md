# Workflow Inspection Ledger

This review document describes the direct owners read by `workflow_inspection`.
The machine-checkable source of truth is
`tests/contracts/workflow-control-ledger-v2.json`; this document is not a runtime
registry or mutation authority.

| Fact | Direct owner | Inspection role |
| --- | --- | --- |
| Run-bundle layout and canonical source path | `bundle_layout.mjs` | Locate the exact source and version. |
| Current source marker | Page Authority source parser | Establish current protocol identity. |
| Current state and execution binding | `state.mjs` | Project current lifecycle evidence and durable context. |
| Raw plan, authorization, and review | Page Authority raw owner | Determine raw-generation prerequisites. |
| Final manifest, assembly, notes, delivery review | Page Authority final owners | Determine completion and delivery action. |
| Structural preview and transaction journal | structural/state owner | Bind preview, apply, and recovery. |
| Unsupported source/state pair | protocol evaluator | Return the byte-preserving export hard-stop. |

Inspection never writes source, state, journals, metadata, receipts, or generated
output, and never submits a provider request. Each mutation owner validates its
direct facts and CAS preconditions again when it acts.
