## Why

Page Authority currently compiles an exact provider request for every planned
slide, but keeps that object only in memory. Operators can see a raw-contract
digest but cannot inspect the exact request that the provider will receive, so
prompt defects such as BUG-041 cannot be diagnosed from provider-free plan
evidence (BUG-042).

The same provider boundary accepts any non-empty response bytes. An invalid or
wrong-size PNG can therefore become raw materialization provenance before a
later Framed-only decoder rejects it, while Pure has no equivalent shared
media gate (BUG-037). This change makes the request inspectable and the result
valid before either becomes production evidence.

## What Changes

- Materialize a deterministic, current-plan-bound provider-request inspection
  projection during the existing provider-free planning checkpoint. It records
  each exact request's digest and local inspection location without exposing
  credentials, headers, environment values, or provider response bodies.
- Surface only bounded request identity and inspection-path facts in normal
  CLI success/diagnostic output. Raw prompt prose remains available only from
  the explicit local inspection artifact, never from a failure envelope.
- Decode the selected Page Authority provider result at the adapter boundary
  and require a valid `2000x1125` PNG before raw materialization, provenance,
  or `succeeded` visibility.
- Classify empty, malformed, or wrong-dimension provider results as the
  existing terminal `known_failure` path. Report bounded expected/actual media
  facts in that direct terminal outcome and preserve the exact
  retry/authorization lifecycle; do not silently resize bytes or create a
  second recovery route.
- Add local Pure and Framed regression coverage for request projection,
  secret-safe CLI output, accepted valid PNGs, and rejected invalid media.

This change does not add a provider call, a force/retry flag, a new human gate,
or a replacement raw-plan/state authority. It does not promise that a third
party provider honors the requested size; it protects the framework when that
provider does not.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `image-generation`: make exact current provider requests inspectable as a
  provider-free, plan-bound projection, and validate provider result media
  before it can become Page Authority raw evidence.
- `cli-surface`: expose bounded provider-request inspection references while
  preserving secret-safe producer-owned diagnostics and the existing direct
  progressive generation lifecycle.

## Impact

- **Framework source:** Page Authority target planning/runtime helpers,
  `ppt_flow.mjs` provider submission, and the shared progressive raw owner.
  The existing `fast-png` dependency is reused; no runtime dependency is
  added.
- **Framework specs:** delta specs modify only `image-generation` and
  `cli-surface`. `node-specification` remains the consumer and gains no copied
  producer schema.
- **Tests:** focused unit/integration coverage in `tests/shared/image2/` and
  the Pure/Framed workflow tests. Tests use synthetic provider responses and
  make no live provider call. No `deck_*` or `dpt_*` directory is a fixture or
  migration target.
- **Control ownership:** JS owns request projection, image decoding, durable
  provider-attempt state, and bounded diagnostics. The Agent can inspect the
  local projection and run the existing legal next action; a human still owns
  the existing explicit paid-provider authorization and visual-quality review.
- **Run-bundle contract:** `compatible`. The change adds rebuildable
  inspection output and rejects previously unsafe provider bytes before they
  become generated evidence; no source migration or hand-editing of
  `_generated/` is required.

This proposal applies `openspec/policies/human-centered-gates.md`: an
unverifiable or invalid response is a non-bypassable integrity `hard-stop`
that protects attributable raw evidence; prompt inspection is provider-free
guidance and requires no human continuation. It applies
`openspec/policies/agent-assistance-and-control.md` and
`openspec/policies/simple-reliable-control.md` by reusing the existing plan
compiler, progressive attempt owner, and terminal known-failure path rather
than adding a retry mode, state store, or controller recovery branch.
