## Why

`openspec/config.yaml` is injected into repository-maintenance work, but its
capability registry currently omits seven main specs, names one capability that
does not exist, and points to nine nonexistent implementation paths. The same
active context and root terminology still teach retired lifecycle, render-mode,
refresh-chain, and historical-identifier concepts, while the current coherence
test passes because it does not validate those authority relationships.

This must be the first cleanup batch so later retirement changes start from an
accurate map of current specifications and public owner surfaces rather than
amplifying stale context.

## What Changes

- Make the OpenSpec capability registry an exact projection of the immediate
  main-spec directories: every current capability appears once, no unbacked
  capability appears, and every cited owner path is an existing current public,
  contract, or entry surface.
- **BREAKING** Remove retired lifecycle numbering, render-mode compatibility
  aliases, Chain aliases, the stale Stage 1-5 production story, and historical
  identifier compatibility framing from active maintenance context. No alias or
  compatibility explanation remains in this projection.
- Keep detailed capability behavior in main specs and current runtime owners;
  config and terminology documents provide bounded navigation only and do not
  become a second schema, Controller, or executable authority.
- Fill the missing `slide-identity-and-ordering` purpose and correct stale
  `ppt_flow` comments plus test/script README ownership labels without changing
  their runtime behavior.
- Extend the existing Harness coherence checkpoint to compare the parsed config
  registry with current main specs and validate its literal owner paths. Add
  safe planted negative controls for missing, extra, duplicate, and stale-path
  entries, then prove the restored current input passes the same checkpoint.
- Keep the check repository-local and provider-free. It writes no state, scans
  no Run Bundle, and adds no command, retry, fallback, or persistent result.

The validation posture follows
`openspec/policies/human-centered-gates.md`: an invalid active authority map is
a repository-maintenance hard failure protecting deterministic authority and
required structure, not a human content `confirm`, and it has no waiver or
force path. Per `openspec/policies/agent-assistance-and-control.md`, direct facts
are the current main-spec directories, parsed config, filesystem, and declared
public owner surfaces; the Agent repairs the owning source and reruns the same
checkpoint. Per `openspec/policies/simple-reliable-control.md`, this change
extends the existing coherence evaluator and deletes stale special cases rather
than adding a parallel validator or status store.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `harness-charter`: require active repository-maintenance context to be an
  exact, mechanically checked projection of current capabilities, terminology,
  and public authority paths.

## Impact

- Harness source: active guidance and terminology under
  `ppt_maker_harness/`, the existing provider-free contract checker under
  `ppt_maker_harness/scripts/contracts/`, and stale ownership comments/README
  labels.
- OpenSpec: `openspec/config.yaml`, the `harness-charter` delta/main spec, and
  normal change/archive records. Other main specs remain the behavioral
  authorities being projected; their requirements do not change in this batch.
- Tests: focused contract/coherence tests under `tests/`; `tests_e2e/` may receive
  ownership-label-only README corrections but no journey behavior change.
- Control owner: active Markdown/YAML guidance is the navigation projection;
  deterministic JS contract validation checks it against direct authority.
  There is no MD Controller/state/CLI protocol change.
- Run-bundle contract impact: `none`. No `deck_*` or `dpt_*` data is read,
  modified, scanned, migrated, or used as a fixture.
- Dependencies and public APIs: none added; no production command, runtime
  dependency, persisted field, or provider behavior changes.
