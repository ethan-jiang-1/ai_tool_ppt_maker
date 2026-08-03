## Why

The selected Page Authority Image2 transport accepts only a synchronous inline
PNG result. A verified Image2 route can instead accept the exact request with a
stable `task_id`, then expose the completed `2000x1125` PNG at
`GET /tasks/{task_id}`. The current adapter misclassifies that accepted async
workflow as an empty provider-media failure, consuming a legal attempt without
giving the existing PNG validator a chance to inspect the completed result.

This is a framework behavior gap discovered during the authorized v7 production
run. The legacy Image2 workflow previously supported the same submit/poll
pattern; Page Authority needs the narrow equivalent without restoring legacy
or creating a second provider lifecycle.

## What Changes

- Extend the Page Authority provider-result boundary to recognize a stable
  `task_id` from a successful submit response and resolve it through a bounded,
  same-credential `GET /tasks/{task_id}` poll loop.
- Extract completed inline image bytes from the provider task result and pass
  them through the existing exact PNG format and `2000x1125` validation before
  raw materialization, provenance, or success state is possible.
- Preserve the current synchronous inline-byte path unchanged.
- Keep polling inside the one authorized submission: it creates no new grant,
  does not resubmit the request, creates no background task or durable task-ID
  store, and exposes no prompt, credential, task ID, response body, headers,
  or image data in CLI output.
- Preserve current terminal semantics: a completed failed/invalid response is
  `known_failure`; a poll transport interruption or bounded timeout remains
  `unknown` and uses the existing exact reconciliation route.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `image-generation`: Page Authority provider submissions must resolve a
  provider-accepted async task to verified PNG bytes within the existing
  authorization and progressive raw-owner lifecycle.

## Impact

- **Framework source:** `PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs` gains the
  bounded async result resolver beside the existing Page Authority transport.
- **Tests:** focused Page Authority transport and direct CLI tests cover
  synchronous compatibility, async success, terminal async failure, and
  interrupted/timeout polling.
- **Control owner:** JS remains the sole provider-result and lifecycle owner;
  MD and the Agent keep their current authorization, review, and recovery
  roles.
- **Run-bundle contract:** compatible. Existing source, plans, grants,
  attempts, receipts, and known failures are immutable and are not migrated or
  reinterpreted. A later owner-issued successor batch is the only path that can
  use the repaired transport.

Per `human-centered-gates.md`, async resolution is a `guide` inside an already
authorized submission, not a new human confirmation. The existing
authorization, identity, and exact-PNG invariants remain hard boundaries:
unknown polling outcomes cannot be overwritten or retried, and invalid media
cannot become raw evidence. Per `agent-assistance-and-control.md` and
`simple-reliable-control.md`, the implementation reuses the selected adapter's
one submit path and existing progressive owner outcomes instead of adding a
daemon, fallback chain, second state store, or user-operated recovery step.
