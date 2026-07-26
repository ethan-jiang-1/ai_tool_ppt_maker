# Page Authority Working Papers

This directory keeps the large Page Authority plan reviewable without turning the parent plan
into an implementation ledger.

| File | Purpose | Authority |
|---|---|---|
| `../unify-image2-page-authority.md` | Human-readable decision, invariants, and delivery intent | Architecture summary |
| `contract-matrix.md` | Map closed current contracts to their required vNext delta replacement | Review aid only |
| `active-protocol-contract.md` | Closed current Page Authority source, state, and readiness decisions | Architecture decision |
| `legacy-compatibility-contract.md` | One read-only legacy observation seam and adoption bridge | Architecture decision |
| `review-and-versioning-contract.md` | Raw/final review order and ordinary structural-version rules | Architecture decision |
| `agent-reference-contract.md` | Approved Agent asset, profile, role, and provider-reference rules | Architecture decision |
| `main-spec-retirement.md` | End-state cleanup inventory for current main specifications | Review aid only |
| `review-log.md` | Findings, disposition, and re-review criteria | Review aid only |
| Future `openspec/changes/.../` entry | Created from this plan only after scope review | Future normative implementation plan |

Rules:

1. A working paper never creates a second runtime schema or implementation requirement.
2. Every accepted finding must be represented in this plan before a future OpenSpec change is created.
3. A future `Apply ready` claim requires strict OpenSpec validation and a final clean review of
   the future normative artifacts, not merely a green status in this directory.
