## Why

`ppt_flow new-version` correctly makes a clean source-only copy, but for a
current Page Authority source it leaves the deck-level Controller on the prior
version or on no active execution after that source has completed. The visible
target therefore has no legal draft route or durable mode record, and ordinary
validation stops at `MODE_MISSING` before the target can plan its own Style
Master and fresh page-raw work.

This was discovered during real-run acceptance. A clean downstream version
must be usable as a distinct Page Authority authoring scope without inheriting
the source version's accepted artifacts or paid-work authority.

## What Changes

- Make the public `new-version` flow activate a clean v2 Page Authority target
  as an exact `create-deck` authoring draft after the source-only copy succeeds.
- Reuse the state owner to bind the new active Controller execution to the
  target version and its already-authored selected workflow, whether the exact
  source is still active or is an inactive durable current-v2 run; keep the
  target unbound until the existing raw-plan owner materializes its first
  source/state tuple.
- Preserve source-version state and all target-cleanliness guarantees: no
  target production mode, target evidence, Style Master selection, source
  receipt, raw plan, provider grant, raw acceptance, final manifest, or
  delivery receipt is copied or synthesized by version creation.
- Add public-CLI and state regression coverage proving that a new clean target
  validates through its legal draft route and can reach provider-free planning
  rather than failing `MODE_MISSING`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `run-bundle-management`: a clean downstream Page Authority version becomes a
  usable target authoring scope, while non-Page-Authority copy behavior stays
  source-only.
- `node-specification`: state owns the deterministic target-draft activation
  and preserves exact version, Controller, and no-inherited-evidence bounds.
- `cli-surface`: `ppt_flow new-version` reports success only after its current
  Page Authority target is activated for the existing pre-raw lifecycle.

## Impact

- Framework source: `ppt_flow.mjs` and the existing state owner.
- Tests: focused CLI/state integration coverage for a clean downstream target.
- Run-bundle contract: compatible. Existing production decks are not migrated
  or rewritten; only newly created Page Authority versions receive the missing
  deterministic Controller handoff.

The activation is a mechanical consequence of an explicit `new-version`
request, not a quality or cost decision. Per
`openspec/policies/human-centered-gates.md`, source/state identity conflicts
remain hard-stops that protect exact version and state ownership; no waiver or
provider work is introduced. Per
`openspec/policies/agent-assistance-and-control.md`, the Agent performs this
deterministic handoff through the state owner, while the human still makes the
later Style Master and raw-review decisions. Per
`openspec/policies/simple-reliable-control.md`, the change removes the normal
`MODE_MISSING` dead end by reusing one direct marker/state path rather than
adding a second mode registry, retry loop, or inferred workflow.
