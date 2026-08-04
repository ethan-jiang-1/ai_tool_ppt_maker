## Why

Style Master candidate generation currently assumes one synchronous provider response shape, serializes the
entire slide projection into its provider prompt, and rejects every PNG that is not exactly `2000x1125`.
Real compatible providers therefore either reject a 13-slide prompt before producing work, return a usable
native PNG that is misclassified as an uncertain submission, or return an async task that the Style Master
transport never resolves. The separate dotenv path and inherited fetch deadline make that boundary less
predictable and can turn an otherwise explainable outcome into an abandoned paid submission.

This change makes the existing Style Master provider boundary bounded, provider-compatible, and honest about
what is known. It is deliberately not a new reconciliation system: an already-submitted request whose terminal
outcome cannot be proven remains uncertain and retains the existing protected authorization boundary.

## What Changes

- Compile a deterministic, bounded Style Master provider brief from authored intent and a compact global visual
  summary. The complete canonical slide projection remains in the plan's identity digest, but is not serialized
  as provider prompt structure. A brief that cannot meet the framework-owned bound fails during provider-free
  planning, before a grant or submission; it is never silently truncated.
- Align Style Master generation with the existing scoped dotenv resolution used by page raw generation. Validate
  `IMAGE2_BASE_URL` as exactly one endpoint and reject comma-separated endpoint lists before any request; the
  framework will not introduce implicit provider failover.
- Give Style Master one bounded transport lifecycle: accept an inline response or poll a returned provider task
  during the same authorized invocation, use explicit finite request and poll deadlines, and preserve an
  uncertain outcome only when the provider result cannot be established. A received rejection, malformed
  response, terminal task failure, or invalid image is a known failed attempt rather than an `unknown` attempt.
- Treat a decoded PNG with positive native dimensions as a valid generated Style Master reference and preserve
  those dimensions in immutable provenance. The requested generation size remains part of the profile, but a
  provider response is not resized or rejected solely for differing native dimensions.
- Apply the same explicit bounded provider deadline discipline to page raw submit/poll transport, without
  changing its authorization or idempotency contract.
- Make `doctor --smoke` describe a successful submission as a connectivity result, not proof that a production
  Style Master prompt or response will pass. The provider-free Style Master plan is the authoritative preflight
  for its own prompt contract.

The direct source of truth remains the existing Style Master plan, grant, and attempt records. Per
`human-centered-gates.md`, ambiguous post-submit results remain a hard-stop because provider work and recovery
are uncertain; this change does not add a waiver, force option, or automatic resubmission. Per
`agent-assistance-and-control.md`, same-process task polling reuses the existing transport owner and writes no
new durable task state. Per `simple-reliable-control.md`, deterministic prompt and received-response failures
short-circuit before paid work or successor planning, leaving one owner-issued next action rather than a
provider-specific fallback chain.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `style-master-generation`: Bound provider prompt compilation, native candidate media validation, and the
  known-versus-uncertain Style Master transport lifecycle.
- `cli-surface`: Explicit bounded Image2 submit/poll behavior and secret-safe direct diagnostics for current
  Style Master and page-raw provider operations.
- `environment-check`: Accurate scope and wording for the optional live Image2 smoke probe.

## Impact

- Framework source: `PPTMAKER_FRAMEWORK/scripts/shared/image2/style_master_plan.mjs`, Image2 credential
  resolution, `ppt_flow.mjs`, and `00-setup/internal/env_check.mjs`.
- Tests: focused shared Image2 unit tests, CLI process tests, and environment-check tests; mock provider
  fixtures cover sync, async, invalid-media, timeout, and malformed configuration paths. Real provider calls
  remain outside automated regression.
- Control owner: JS/CLI owns deterministic compilation, transport, state transitions, and diagnostics. MD
  continues to consume the existing producer-issued action and does not receive a new state or recovery route.
- Run-bundle contract impact: compatible. Existing accepted selections and historical attempts remain readable;
  no production `deck_*` data is a fixture or migration target, and no generated artifact is edited manually.
- Deliberately excluded: cross-process task reconciliation, persisted provider task IDs, idempotency lookup,
  automatic retry/resubmission, `--force`, and comma-list provider failover. Those require a separate durable
  state and authorization decision.
