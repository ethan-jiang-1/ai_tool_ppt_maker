# Harness Signal Cleanup

> Type: architecture/rot audit and implementation program | Updated: 2026-08-13
> Status: investigation complete; implementation requires one or more OpenSpec changes.

## Objective

Reduce active Harness surfaces to one current vocabulary, one current owner path,
and falsifiable drift guards. Backward compatibility is out of scope. Git history
and `openspec/changes/archive/` retain historical evidence; active guidance and
runtime do not need to preserve old concepts merely to explain them.

This plan extends, rather than repeats, the closed
`keel-harness-term-alignment-and-residue-audit`. That audit aligned the obvious
terminology and entry points. This pass found deeper contradictions in the active
spec/config/runtime surface and identifies clean deletion boundaries.

## Scope

In scope:

- `ppt_maker_harness/`
- `openspec/specs/` and `openspec/config.yaml`
- `tests/` and `tests_e2e/`
- root onboarding/terminology documents
- this authorized `_backlog/plans/` record

Out of scope:

- every `deck_*` Run Bundle and every `dpt_*` research input
- mutation or migration of historical production data
- deletion or rewriting of `openspec/changes/archive/`
- compatibility readers, aliases, converters, or migration code
- implementation during this explore pass

## Documents

- [progress-plan.md](progress-plan.md) - operational checklist, dependencies,
  OpenSpec gates, and local/remote closure evidence
- [findings.md](findings.md) - grounded contradictions, residue, and unknowns
- [program.md](program.md) - ordered OpenSpec-ready cleanup batches
- [deletion-matrix.md](deletion-matrix.md) - delete/absorb/decide/retain disposition
- [safety-and-closure.md](safety-and-closure.md) - Git, verification, and final-state invariants

## Recommended Direction

The work should converge on this active surface:

```text
root entry guidance
        |
        v
current main specs + CONTEXT terminology
        |
        v
MD Controllers ---- deterministic CLI/runtime owners
        |                         |
        +---- current schema -----+
```

Historical vocabulary belongs in Git/OpenSpec archive, not as tombstones,
compatibility prose, prompt libraries, or unconsumed fields in the active tree.

## Baseline

At investigation close:

- `openspec list --json`: no active changes
- `npm test`: passed core verification
- `npm run test:sweep`: 68 files / 552 tests passed
- focused docs coherence: 6/6 passed
- focused architecture/schema/controller set: 43/43 passed
- `openspec validate --all --strict`: 27/27 specs passed
- `master`, `origin/master`, and the remote master SHA were aligned before plan edits

The green baseline does not refute the findings: current guards accept several
known authority contradictions, which is itself one of the findings.
