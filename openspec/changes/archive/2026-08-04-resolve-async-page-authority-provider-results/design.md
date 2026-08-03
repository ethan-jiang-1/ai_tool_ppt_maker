## Context

See `proposal.md` for motivation. The Page Authority provider transport in
`ppt_flow.mjs` currently handles one successful response as a synchronous JSON
envelope with inline PNG bytes. A live compatibility probe established the
following direct provider facts for an already-supported Image2 route:

- submit returns a stable task ID in a successful JSON envelope;
- `GET /tasks/{task_id}` returns `pending`, then `completed`;
- the completed record contains `result.images[0].bytes_base64`.

The existing progressive raw owner already owns authorization, attempt
terminalization, exact PNG validation, evidence, and reconciliation. It must
remain the only lifecycle authority.

## Goals / Non-Goals

**Goals:**

- Resolve one provider-accepted task inside its existing authorized submit.
- Reuse the existing PNG validator and progressive owner outcomes.
- Give async poll transport failures the same precise unknown/known distinction
  as the current submit path.
- Keep synchronous providers behaviorally unchanged.

**Non-Goals:**

- Provider failover, per-deck endpoint persistence, or automatic `.env`
  mutation.
- A polling daemon, a task queue, durable provider task IDs, or a new CLI
  command.
- Reinterpreting or repairing previously terminal attempts.
- Supporting arbitrary response schemas beyond the verified task envelope and
  completed inline-byte shape.

## Decisions

### D1: One adapter-owned resolver handles synchronous and async success

**Owner: JS.** The provider callback will first parse the received success JSON
without logging it. If it contains a stable task ID and no direct image, the
same callback polls `GET {base_url}/tasks/{task_id}` with the same
Authorization credential. Otherwise it preserves the current synchronous
inline-byte route. Completed async payloads are normalized only enough to
reach the existing PNG-byte extractor and exact media validator.

This reuses one selected-adapter evaluator and avoids a provider-specific
controller, a second result store, or a fallback chain. The alternative of
adding a separate async CLI or background worker would split one authorized
attempt across multiple authorities and create recovery complexity.

### D2: Bounded in-process polling has no durable task state

**Owner: JS.** Polling runs while the existing raw-owner mutation holds the
exact plan lock. It uses a fixed total budget and short polling interval; both
are private test-injectable timing controls, not user CLI flags. A normal
completed task therefore returns ordinary PNG bytes to the existing owner.

If a poll request cannot be completed or the total budget expires, the callback
throws the existing unresolved transport class. The raw owner records its
normal `unknown` outcome and exact reconciliation action. It does not persist
the task ID because that value is only useful while the callback is live and a
new persistent field would require a new reconciliation protocol. A completed
negative or malformed task response is provably terminal and maps to existing
bounded `known_failure` facts.

### D3: Keep the PNG boundary unchanged

**Owner: JS.** Task completion is not evidence. The resolved nested
`bytes_base64` is passed into the existing decoder and exact
`2000x1125` validator before materialization. This keeps raw evidence,
provenance, review, finalization, and delivery independent of whether a
provider was synchronous or asynchronous.

The alternative of accepting task completion without decoding media would
weaken the existing invariant and could make invalid provider data appear as
accepted raw evidence.

### D4: Existing gate and diagnostic behavior remains authoritative

Under `human-centered-gates.md`, resolving a task is a `guide` contained in an
already authorized provider submission. No new confirm is needed. The existing
authorization, exact plan/batch identity, and verified-media rules remain
hard boundaries. Existing successor-batch confirmation remains the only human
decision after a terminal result.

Under `agent-assistance-and-control.md`, the raw owner remains the direct
source of lifecycle truth and the adapter merely returns bytes or its existing
failure classes. Under `simple-reliable-control.md`, the change replaces the
current false `empty` branch with one direct fact path:

```text
submit response -> task ID -> bounded task poll -> existing PNG validator
```

It deliberately adds no retry policy, status projection, or competing
recovery action. Focused tests will prove the same checkpoint handles sync,
async success, terminal failure, and interrupted polling without mutating a
wrong attempt.

### D5: Resolve credentials before entering the progressive raw owner

**Owner: JS.** Only the direct `ppt_flow image2 generate` branch reaches a
remote Page Authority boundary. After it has accepted the exact CLI hashes and
read the current stored plan, it loads dotenv from `deckRoot(route.run_dir)`
and then `process.cwd()`. The existing loader fills only absent process
environment entries, so exported process values remain authoritative; it does
not write either dotenv file or print a path or value. The branch then resolves
one credential pair before calling `operations.generate()` and passes that
same pair through `credentialResolver` to the submit factory. POST and any
async task poll consequently use identical base-URL and authorization facts.

If either credential fact is unavailable or invalid, the existing secret-safe
credential error leaves the branch before the progressive raw owner can create
a `claimed` or `submitted` attempt. This is an environment preflight hard
stop, not a provider outcome: it protects attempt immutability, grant meaning,
and the one-submit cost invariant. `plan`, `pilot`, `expansion`, `authorize`,
`reconcile`, review, and delivery remain credential-free.

Loading dotenv at process startup would violate those provider-free paths, and
leaving resolution inside the submit callback is the proven ghost-attempt
failure. A separate credential state or dotenv mutation would add a second
authority without improving the direct boundary, so neither is introduced.

## Risks / Trade-offs

- [Provider task completion exceeds the bounded wait] -> return the current
  unresolved lifecycle rather than silently retrying or retaining an opaque
  task record.
- [A relay changes its task response shape] -> fail closed as an existing
  secret-safe known failure; do not accept unverified bytes.
- [Long task wait holds the plan lock] -> this preserves the existing single
  writer invariant; the bounded deadline prevents indefinite lock retention.
- [A dotenv value disagrees with an exported process value] -> preserve the
  existing fill-only precedence and resolve the exported value without writing
  either source.
- [Credentials are absent] -> fail before entering the owner; do not create a
  claim, submitted attempt, provider call, or replacement authorization.
- [The live deck has terminal failed attempts] -> do not migrate them. Resume
  only through a future owner-issued successor batch after framework validation.

## Migration Plan

1. Add focused test coverage for the verified async envelope, existing sync
   behavior, cwd dotenv loading, and missing-credential preflight.
2. Implement the adapter resolver and direct generate preflight, then run the
   focused plus full regression suites.
3. Strict-validate the OpenSpec change and review CLI secret-safety behavior.
4. Archive only after the framework change is complete; the specified deck is
   then resumed through its current owner action, never by hand-editing its
   generated records.

Rollback is code-only: removing the resolver restores the prior synchronous
behavior. No schema or run-bundle migration is required.
