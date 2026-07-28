# Main-Spec Retirement Coverage Audit

## Why This Exists

An exact-title ledger can prove that a listed Requirement exists. It cannot prove that every affected
Requirement was listed. This audit is the second proof required before a future proposal: search current
main specs for active legacy-production vocabulary, then require every matching Requirement to have a
deliberate ledger row.

## Direct Legacy Vocabulary

The mechanical scan operates on each `### Requirement:` block in `openspec/specs/*/spec.md` and treats
these as direct Page Authority retirement terms:

```text
full-page | body+header-lock | html-first | html-only | html-then-image2 |
image2-only | whole-page | visual-slot | header-lock | header-review |
render.default | html production | HTML approval
```

For every matching block, its exact `(capability, Requirement title)` pair must occur in
`main-spec-retirement-ledger.md`. The scan is deliberately broader than a filename or capability search:
the old route is often embedded in an otherwise generic gate, state, CLI, or playbook requirement.

## Recorded Re-Audit

Observed on 2026-07-26 after the second contract review:

| Check | Result |
|---|---|
| Ledger rows with explicit dispositions | 258 |
| Ledger titles missing from current main specs | 0 |
| Direct legacy-vocabulary Requirement blocks without a ledger row | 0 |
| `Collapse` rows without an observer output contract | 0, because the observer deliberately parses no legacy visual/HTML field grammar |

The first re-audit discovered 28 unledgered direct matches, including the hero render guard, node
frontmatter/state/gate requirements, routing and restructure playbooks, CLI error/audit coverage, and
Where Map/control-file documentation. Those rows are now explicitly classified in the ledger.

## Exit Rule

Before a future OpenSpec proposal and again before its retirement slice is considered complete:

1. Re-run both title-existence and direct-vocabulary scans against the current main specs.
2. Manually inspect the `HTML` runtime-only matches so retained browser/font primitives are explicitly
   `Keep` or `Replace`, never accidentally treated as a surviving HTML production route.
3. Update the ledger and this recorded result for any newly affected requirement.
4. Reject completion if a current executable, CLI help entry, Controller node, state gate, or current
   spec wording exposes a retired route outside the named historical observer/migration/fixture scope.
