# Page Authority Working Papers

This directory keeps the large Page Authority plan reviewable without turning the parent plan
into an implementation ledger.

| File | Purpose | Authority |
|---|---|---|
| `../unify-image2-page-authority.md` | Human-readable decision, invariants, and delivery intent | Architecture summary |
| `contract-matrix.md` | Map closed current contracts to their required vNext delta replacement | Review aid only |
| `review-log.md` | Findings, disposition, and re-review criteria | Review aid only |
| `openspec/changes/unify-image2-page-authority/` | Proposal, design, delta specifications, and tasks | Normative implementation plan |

Rules:

1. A working paper never creates a second runtime schema or implementation requirement.
2. Every accepted finding must be reflected in the relevant OpenSpec artifact and task before
   it can be marked resolved here.
3. `Apply ready` requires strict OpenSpec validation and a final clean review of the normative
   artifacts, not merely a green status in this directory.
