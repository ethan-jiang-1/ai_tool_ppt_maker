## Why

The authorized v7 Page Authority Pilot reached the provider three times, then
each persisted submission became terminal `unknown`. The current adapter loses
the distinction between no response and a response that is definitely unusable
(for example, a non-success HTTP response or malformed response envelope).
After reconciliation, the terminal partial Pilot has no materializations, but
the raw owner still routes to a Pilot review that cannot establish coverage.
That blocks the owner-derived successor scope required to continue production.

## What Changes

- Classify a Page Authority provider submission as terminal `known_failure`
  when the adapter has received a definite, bounded unusable response. Preserve
  `unknown` and reconciliation for a transport interruption before any response
  or another genuinely unprovable outcome.
- Keep provider response bodies, prompt text, credentials, headers, image data
  URLs, and raw bytes out of normal output and diagnostics. Expose only a
  bounded known-failure classification and, when applicable, an HTTP status.
- Make a terminal partial Pilot with missing current raw coverage route to the
  owner-derived successor Pilot planning confirmation rather than an
  inapplicable Pilot-review action. The old grant remains closed and the new
  scope still requires its own exact authorization.
- Cover the provider outcome boundary, raw-owner transition, workflow
  inspection, and public CLI diagnostics with local synthetic tests.

This does not retry a submission, reinterpret historical attempts, create a
fallback provider, weaken authorization, or add a bypass for raw evidence.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `image-generation`: distinguish provable provider failures from unresolved
  submissions and derive a legal successor scope after a terminal Pilot lacks
  usable coverage.
- `cli-surface`: return only secret-safe, bounded provider-failure facts and
  the raw owner's exact successor action.
- `workflow-inspection`: project the raw owner's successor-planning action for
  a terminal partial Pilot whose review coverage is incomplete.

## Impact

- **Framework source:** `ppt_flow.mjs`, the shared progressive raw owner, and
  selected workflow integration points may change. No new dependency, endpoint,
  CLI command, or general retry mechanism is added.
- **Framework specs and tests:** the three modified capability specs gain
  focused delta scenarios. Synthetic response tests cover all changed branches;
  no live provider call is needed for framework verification.
- **Control ownership:** JS owns transport classification, raw lifecycle, and
  the secret-safe direct diagnostic. The Agent can run the returned mechanical
  checkpoint. A person still owns the existing exact paid-batch authorization
  and visual-quality decision.
- **Run-bundle contract:** `compatible`. Existing attempts remain immutable.
  A designated run can only continue through a newly derived, newly authorized
  batch; no deck, receipt, state, or `_generated/` output is migrated or
  hand-edited.

This follows `openspec/policies/human-centered-gates.md`: an outcome without a
response remains a recoverability `hard-stop`; a received invalid response is a
bounded terminal fact, and successor cost remains a `confirm` gate. It follows
`openspec/policies/agent-assistance-and-control.md` and
`openspec/policies/simple-reliable-control.md` by reusing the existing adapter,
attempt owner, and successor-batch lifecycle rather than adding a response
store, retry mode, or parallel recovery route.
