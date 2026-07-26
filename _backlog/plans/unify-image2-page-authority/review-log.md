# Review Log

## Round 1: Architecture And Contract Audit

Accepted findings:

- Page Authority needs a distinct `page-authority-image2` adapter, not the legacy whole-page adapter.
- Adoption candidates live in source-version transition scratch; no target version exists before apply.
- The superseded hardening change cannot own a competing reference registry.
- Framed raw reuse must compare a raw-image-contract digest, not paths, slide IDs, or old receipts.
- Final review must bind the actual review projection SHA/profile.

## Round 2: Apply-Readiness Audit

Open findings to close in the plan before creating normative artifacts:

- Raw acceptance must be an explicit Stage 2-to-Stage 3 confirm gate for every raw entry consumed by
  a final manifest, with partial/stale coverage rejection tests.
- Raw acceptance must survive a local Framed final-frame execution when raw bytes/contracts and its
  review projection remain current; execution identity alone must not stale it.
- `amber-agent` needs a typed registry/profile contract: role clause, subject class, cardinality,
  restriction compatibility, and raw-contract digest binding.
- Page Authority source grammar must permit the existing top-level `identity.scheme` contract while
  closing only the keys of the `production` mapping.
- Framed no-text validation must be deterministic and must not reject a negative constraint such as
  `no labels`; the compiler, not a heuristic token scan, is the boundary for display text.
- Every delta that changes an `only` or `exactly` base contract must use an exact-name full
  `MODIFIED Requirement`, especially CLI, header lock, visual-slot refinement, and command routing.

## Exit Criteria

1. Each finding above is resolved in the plan, with a named future implementation/test obligation.
2. The plan has a reviewed retirement inventory for old main-spec routes.
3. Only then may a future OpenSpec proposal be created and validated.
