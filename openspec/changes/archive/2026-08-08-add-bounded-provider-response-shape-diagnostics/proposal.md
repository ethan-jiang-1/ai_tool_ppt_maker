## Why

A fully received successful provider response that cannot be parsed as JSON is
currently reported only as `invalid_json`. Operators cannot distinguish an
empty response from an HTML error page, yet the current secret-safety contract
correctly forbids exposing provider bodies and headers. The confirmed D2 policy
allows one finite, non-content response-shape fact to close that diagnostic
gap without changing provider cost or recovery control.

## What Changes

- Add `response_shape` to an existing `invalid_json` known-failure fact only,
  with the closed values `empty`, `html_like`, and `other_non_json`.
- Derive that value once in the existing common provider-response reader, then
  preserve it through the existing Page Image known-failure fact and its
  existing CLI-visible diagnostic projection. Style Master uses the same
  classified known-failure error to retain its current terminal lifecycle, but
  does not gain a persisted fact or new CLI field.
- Prove synthetically that valid JSON, HTTP failures, unreadable/lost
  responses, provider body/header sentinels, task identifiers, prompts, and
  credentials retain their present behavior and privacy boundary.
- Add no retry, failover, authorization, command, persistent control head,
  provider request, human gate, or alternate recovery route.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `image-generation`: accepted Page Image provider outcomes retain a bounded
  response shape for a fully read, non-JSON known failure.
- `cli-surface`: the existing Page Image producer-owned success diagnostic
  projection may carry that closed fact while continuing to exclude provider
  content and metadata.
- `style-master-generation`: Style Master uses the same bounded fact and
  retains its current terminal lifecycle/replay behavior.

## Impact

- Harness source: the common provider-response reader in `ppt_flow.mjs`, its
  Page Image and Style Master failure adapters, and existing fact consumers.
- Tests: focused reader, lifecycle, and process-diagnostic tests using only
  synthetic responses; no provider call or production `deck_*`/`dpt_*` data.
- Control owner: JS owns the deterministic classification from an already-read
  response; Agent and human receive the existing owner-issued next action and
  make no new decision.
- Run-bundle contract: compatible. Existing known-failure records remain
  readable; a newly written shape is a bounded extension of their diagnostic
  fact, not a selector, authorization, or evidence authority.
- Gate/control posture: under `human-centered-gates.md`, the existing
  terminal known-failure remains non-bypassable for its exact submitted item;
  this change adds no confirm or waiver. Under
  `agent-assistance-and-control.md` and `simple-reliable-control.md`, one
  shared evaluator replaces opaque `invalid_json` feedback while retaining one
  nearest existing action and avoiding state, retry, fallback, or a parallel
  recovery path.
