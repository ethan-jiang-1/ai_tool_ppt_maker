## Why

After `recover-stale-style-master-scope` correctly publishes a provider-free
Style Master successor plan, `image2 artifact-view` still tries to resolve the
stale accepted selection as current. It returns an opaque internal diagnostic
instead of the required human-facing view, so the Agent cannot disclose the
new candidate scope before reaching the Style Master owner's next existing
human gate.

The Style Master owner already has the direct, immutable successor-plan and
candidate facts needed for that projection. The plan must bind the exact stale
predecessor selection; the view can then consume those facts without weakening
selection freshness or raw-work readiness.

## What Changes

- Let the provider-free human artifact view project a current, validated Style
  Master successor plan while its predecessor selection is stale for raw
  authority: expose verified local-existing or succeeded generated candidate
  locators when available, and clearly mark every other generated slot by its
  owner-established lifecycle state without a locator.
- Make the direct `image2 artifact-view` result describe that bounded
  successor-plan state and its one owner-issued next action rather than
  translating it to an internal failure.
- Preserve hard-stops for unsupported protocol, invalid source/plan/lineage,
  and unverified candidate media. The view remains provider-free and cannot
  select a candidate, authorize cost, generate work, publish raw lineage, or
  change any acceptance evidence.
- Add focused owner and process-CLI coverage for the stale-selection successor
  view and for its no-mutation boundary.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `style-master-generation`: expose a read-only, owner-validated projection of
  candidate artifacts in an eligible current successor plan.
- `image-generation`: project a valid current Style Master successor plan into
  the provider-free human artifact view before a replacement selection exists.
- `cli-surface`: expose that owner-issued artifact-view projection and its
  bounded forward action as normal CLI success.

## Impact

- Affected Harness source: Style Master/artifact-view composition and the
  `image2 artifact-view` success projection under `ppt_maker_harness/`.
- Affected verification: focused Style Master artifact-view and process CLI
  tests under `tests/`.
- Control owner: the Style Master JS owner reads immutable plan, candidate,
  and selection records; the `image2` JS adapter performs the deterministic
  view rebuild; the Agent invokes only the provider-free operation; the human
  continues to decide any exact nonzero candidate authorization and later
  visual selection.
- Gate posture: the view is a provider-free `guide`. Existing authorization,
  identity, integrity, selection, and raw-evidence conditions remain
  non-bypassable hard-stops with their current owner actions.
- Run-bundle contract: compatible. No migration, provider call, automatic
  authorization, new state authority, historical evidence rewrite, or
  production-deck mutation is introduced.

## Authority And Control Boundaries

The accepted `style-master-generation` lifecycle owns candidate-plan, attempt,
media, provenance, predecessor-selection, and next-action facts. The accepted
`image-generation` human-artifact-view requirement owns only their bounded
human projection, and `cli-surface` owns the success or diagnostic envelope.

This change applies
[`human-centered-gates.md`](../../policies/human-centered-gates.md): rebuilding
the view is a `guide`, while identity, integrity, authorization, and
recoverability remain hard-stops with no waiver. It also applies
[`agent-assistance-and-control.md`](../../policies/agent-assistance-and-control.md)
and [`simple-reliable-control.md`](../../policies/simple-reliable-control.md):
the adapter consumes one Style Master owner projection, short-circuits before
raw inspection, returns that owner's one action, and adds neither durable state
nor a parallel recovery controller.
