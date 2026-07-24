# Workflow Inspection Baseline

The baseline measures the observation seam before Change 2 control retirement.
Each journey consumes direct owners through one read-only inspection result.

| Journey | Primary direct owners | Human gate | Expected primary action | Writes / remote work during inspection |
| --- | --- | --- | --- | --- |
| Fresh HTML-only | layout, mode/source, state, HTML review | content/visual review | pilot or exact review action | 0 / 0 |
| Fresh Image2-only | layout, mode/source, state, whole-page owner | scope authorization/final review | owner-selected whole-page next step | 0 / 0 |
| HTML-then-Image2 | layout, mode/source, HTML review, refinement | review/authorization as owned | HTML prerequisite then refinement | 0 / 0 |
| Resume | state execution, active playbook index | existing wait/decision | current owner action | 0 / 0 |
| Small refresh | source, receipt/provenance, selected owner | only if owner requires | stale owner rebuild | 0 / 0 |
| Structural versioning | slide identity/order, structural transaction | exact preview/hash confirmation | preview or transaction recovery | 0 / 0 |
| Visual-slot refinement | current HTML delivery, refinement record | authorization/candidate review | refinement owner action | 0 / 0 |
| Production-mode transition | transition state, exact plan/receipt | target-intake plan commit | transition owner action | 0 / 0 |
| Crash / restart | journal/reset/attempt owner | uncertain-owner confirmation | recovery owner action | 0 / 0 |

## BUG-033 Probe Discipline

The probe starts from temporary fixture helpers and owner interfaces. It must
record the first direct diagnostic for layout, exact mode state, selected-slide
authorization, provenance staleness, artifact reconciliation, and canonical
assembly. It does not hand-write state, authorization, receipt, PPTX, or
`_generated/` bytes. A non-reproduced claim is recorded as non-reproduced; it
does not justify a bypass, force flag, or metadata fallback.

| Probe fixture | Earliest direct diagnostic | Durable/file diff before repair | Human decision | Canonical owner repair | Same-check rerun |
| --- | --- | --- | --- | --- | --- |
| One-slide `createHtmlFirstRun` HTML-first run | `html-review/content-review-missing` | none during observation | approve or waive the content gate with the current owner-issued plan hash | `publishHtmlGateDecision(... content, approved)` | `html-review/visual-review-missing`; source bytes unchanged and only owner-published state/history evidence changes |
| Mode, selected-slide authorization, provenance, artifact reconciliation, canonical assembly | not reached while the content gate is the earliest prerequisite | none | none | none; no bypass introduced | recorded as prerequisite-short-circuited, not claimed as independently reproduced |

## Observation Invariants

- Status and state use the same canonical inspection projection when their
  direct-fact checkpoint is unchanged.
- A changed direct fact produces a bounded refresh action, not a cached or
  mixed verdict.
- Raw durable state appears only under `durable_state` in `state --json`.
- State repair, journal recovery, provider submit, and canonical rebuilding
  remain explicit owner operations after observation.
