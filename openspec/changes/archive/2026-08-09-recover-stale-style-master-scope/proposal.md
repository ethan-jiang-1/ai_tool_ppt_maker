## Why

A visual-language edit after a human `repair` correctly makes the previously
selected Style Master stale. The current recovery path then deadlocks: raw-plan
publication requires a current Style Master selection, while Style Master
inspection and provider-free planning reject the same stale target
source/state binding. The CLI reports that bounded condition as a generic
internal failure and directs the Agent back to an inspection that cannot
advance it.

This blocks the normal source edit -> exact scope -> authorization -> rebuild
loop without any integrity, provider, or human-approval reason to do so.

## What Changes

- Let the Style Master owner create a provider-free successor candidate plan
  from an exact validated selected-workflow source candidate when visual/source
  drift has made the prior target binding stale, while preserving the prior
  immutable plan, selection, and review history as audit-only.
- Make the selected workflow's stale-Style-Master raw-plan result name that
  single replacement-planning action before source epoch, raw plan,
  authorization, provider request, or Page Image evidence mutation.
- Project the same owner-issued recovery through direct CLI owner output and
  raw-plan diagnostics instead of an opaque internal error or a
  self-referential `inspect` loop.
- Add focused Pure, Framed where shared behavior applies, and CLI regression
  coverage for visual-language drift, replacement planning, and the preserved
  authorization/evidence boundary.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `style-master-generation`: permit a current validated replacement candidate
  to start the existing immutable Style Master successor-plan lifecycle after
  visual/source drift has invalidated a prior selection.
- `image-generation`: route stale selected Style Master facts to that
  provider-free replacement plan before any raw-plan or source-epoch mutation.
- `cli-surface`: expose the bounded owner recovery action for stale Style
  Master planning rather than classifying it as an internal failure.

## Impact

- Affected Harness source: selected-workflow Style Master scope resolution,
  Style Master lifecycle projection, Pure/Framed raw-plan recovery mapping, and
  direct CLI diagnostics under `ppt_maker_harness/`.
- Affected verification: focused Style Master, selected-workflow, and CLI tests
  under `tests/`.
- Control owner: JS owners continue to validate source, scope, lineage, and
  state; the Agent can perform only the new deterministic provider-free plan
  action. A human still authorizes any nonzero candidate or page-raw scope.
- Gate posture: recovery is a `guide` because it creates no remote work or
  acceptance. Source/state identity, immutable history, exact authorization,
  and uncertain submission preservation remain non-bypassable hard-stops.
- Run-bundle contract: compatible. No migration, provider retry, new state
  authority, historical evidence rewrite, or deck-data mutation is introduced.
