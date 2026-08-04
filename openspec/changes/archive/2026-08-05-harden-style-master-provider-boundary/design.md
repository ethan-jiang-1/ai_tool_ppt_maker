## Context

See [proposal.md](proposal.md) for the motivation. The current provider boundary is split between the
Style Master lifecycle owner and `ppt_flow` transport adapters. Page raw already has task-poll parsing, scoped
dotenv loading, and bounded poll tests; Style Master has the same lifecycle records but only understands an
inline image response. Its plan compiler currently serializes the full projection object, including digest-only
fields, and its terminal PNG validator treats a non-`2000x1125` response as an uncertain transport outcome.

The direct facts remain the existing immutable plan, grant, attempt, candidate bytes, provenance, and effective
selection records. A provider task ID is not currently durable authority and is not enough to recover a later
process safely.

## Goals / Non-Goals

**Goals:**

- Make Style Master provider work deterministic before authorization where possible, and classify received
  provider results accurately after authorization.
- Reuse one current Image2 transport vocabulary for sync responses, async task responses, deadlines, and
  secret-safe errors without changing public CLI forms or lifecycle ownership.
- Preserve valid native Style Master PNG bytes and their provenance dimensions without treating a request-size
  mismatch as a transport loss.

**Non-Goals:**

- Persisting provider task IDs, adding task/status lookup across invocations, or reconciling an orphaned
  `submitted` attempt.
- Retrying or resubmitting a paid request, adding `--force`, changing Page Authority idempotency, or trying a
  comma-separated endpoint list.
- Making `doctor --smoke` simulate a full run or using a production deck as a test fixture.

## Decisions

### 1. Compile a bounded global brief, preserve complete context as identity

**Owner:** Style Master JS lifecycle owner.

The plan keeps `style_context_sha256` over the full canonical sorted projection list. The provider-facing brief
uses the authored intent plus a deterministic compact summary of unique recipe, composition, motif, and
identity-subject identifiers. It never emits per-slide projection JSON or SHA-256 fields. The compiler measures
UTF-8 bytes and rejects a nonempty brief above 4,000 bytes during `plan`; it never truncates.

This separates two facts that were incorrectly coupled: complete source identity must invalidate the plan, while
the provider only needs a bounded global visual direction. The 4,000-byte bound is intentionally below the
observed compatible provider limit and is a fixed framework contract, not a per-provider guess.

Alternative considered: compact the existing JSON by shortening hash strings. Rejected because identity digests
are structural rather than visual direction and still scale with slide count. Alternative considered: provider
specific prompt limits. Rejected because it introduces endpoint policy and fallback configuration before the
provider boundary has a stable capability contract.

### 2. Keep the request profile but make generated candidate validation native-reference based

**Owner:** Style Master JS lifecycle owner.

The existing generation profile continues to request `2000x1125`; its digest and cost binding remain unchanged.
On a received successful response, Style Master validates that bytes are a CRC-valid PNG with positive decoded
dimensions, records the original bytes and dimensions in generated provenance, and does not resize. This aligns
with how accepted candidate provenance already carries media dimensions and leaves compatibility JPEG projection
as the existing later derived path.

Alternative considered: resize every provider result to the requested dimensions. Rejected because it would
create a second, unbound image transformation before candidate provenance and hide the actual provider output.
Alternative considered: retain exact dimensions and classify mismatches as `unknown`. Rejected because bytes and
dimensions are directly observable, so uncertainty is false and needlessly consumes the only recovery route.

### 3. Normalize provider completion inside the existing invocation

**Owner:** JS/CLI transport adapters; lifecycle owner remains the only writer of Style Master attempts.

Extract shared response helpers from the existing Page Authority transport: parse a response once, detect inline
bytes or a valid task ID, poll `GET /tasks/<id>` only while the invocation is live, and map terminal task states
to the same response classes used by sync requests. Style Master supplies the result to its existing attempt CAS
path; it does not gain a second attempt store or recovery command.

Use one fixed 600,000 ms total deadline starting before the provider POST. The POST and every poll receive an
AbortSignal limited by the remaining budget. Polling ends when the same budget expires, rather than obtaining a
fresh timeout per GET. Existing dependency injection for clock, sleep, and fetch remains available for tests.
Page raw adopts the same total-deadline helper while retaining its persisted idempotency key and reconciliation
contract. The 600,000 ms value is the external current-Image2 CLI contract recorded in `cli-surface`, not a
transport tuning default or environment override; changing it requires a later bounded-deadline decision.

Received HTTP rejection, invalid JSON, a terminal failed task, a malformed completed task, or bytes that fail
the applicable media validator are known failures. No response, unreadable response, request abort, connection
loss, or deadline expiry is uncertain because the provider may have accepted work. The latter leaves the existing
submitted attempt unresolved and uses its existing hard-stop, not a retry.

Alternative considered: persist a task ID before polling. Rejected because it needs a durable state owner,
freshness/invalidation semantics, provider lookup security, and a new reconciliation authority. Alternative
considered: mark all transport errors failed. Rejected because it would authorize an unsafe resubmission after a
possibly accepted request.

### 4. Reuse scoped dotenv and make one-endpoint configuration fail closed

**Owner:** JS/CLI transport initialization and shared credential resolver.

Style Master initialization will use the existing page-raw ordered dotenv scope: deck root first, then process
current working directory, without overriding exported environment values. Shared credential normalization will
reject a comma in `IMAGE2_BASE_URL` before URL construction or fetch. The failure is an environment diagnostic
with the existing producer envelope and one repair action. Page raw and the normal doctor Image2 endpoint check
use the same single-endpoint validation, so a comma list cannot appear locally ready or reach a smoke POST. The
separately confirmed `--probe-vendors` diagnostic remains a probe, not a production failover route.

Alternative considered: accept a list and fail over in order. Rejected because a failed or timed-out POST can be
ambiguous and a second endpoint would turn a single authorized submission into an implicit retry.

### 5. Keep smoke as a narrow connectivity probe

**Owner:** Environment-check JS adapter.

`doctor --smoke` retains one small submit-only request and its existing JSON report shape. Its successful human
detail and global READY conclusion will state that the probe proves endpoint connectivity only; it does not prove
prompt fit, output size, decoded media, async completion, or a run's authorization. It preserves the existing
machine-compatible READY and JSON shape, but it must not say that deck building or production generation can
begin. The provider-free Style Master plan remains the single deterministic prompt preflight.

Alternative considered: have smoke send a production-sized Style Master prompt and download media. Rejected
because it duplicates plan validation, spends provider work, needs run-specific source authority, and still
cannot prove every future provider response.

### 6. Preserve the existing gate and recovery topology

**Owner:** Style Master lifecycle owner; CLI remains producer, MD remains consumer by reference.

Under `human-centered-gates.md`:

- An oversized provider brief and malformed comma-list endpoint are hard-stops before a grant or submit. They
  protect deterministic source/configuration prerequisites; repair the owner input and rerun the same checkpoint.
- A received rejection or invalid media is a known failed attempt. It follows the existing terminal-plan path;
  later paid work requires a successor plan and a new exact authorization.
- A post-submit result that cannot be proven is a hard-stop. It protects provider-cost and recovery integrity;
  the only existing legal continuation is reasoned abandonment of the exact plan. There is no waiver or force.

Under `agent-assistance-and-control.md`, the Agent may run provider-free planning and any producer-issued exact
mechanical action. A human is needed only for the already-existing abandonment reason. No task ID, diagnostic,
or smoke result becomes a competing source of truth. This follows `simple-reliable-control.md`: one direct
plan/attempt evaluator differentiates deterministic pre-submit failure, known response failure, and actual
uncertainty, removing the old size-mismatch false branch instead of adding a recovery layer.

## Risks / Trade-offs

- [A provider needs more than ten minutes] -> The command terminates as `unknown`, preserving cost safety;
  operators may use the existing reasoned abandonment path. Increasing the contract later requires a separate
  bounded-deadline decision, not an ad hoc environment override.
- [A provider returns a syntactically valid but visually poor native PNG] -> It remains reviewable rather than
  being rejected on dimensions; human review retains visual quality ownership.
- [A new concise summary omits useful per-slide nuance] -> Full source context still invalidates the plan, and
  authored intent remains available. Tests cover deterministic unique semantic identifiers; future changes can
  extend the bounded summary deliberately.
- [Provider task API differs from current Page Authority shape] -> Unsupported/malformed terminal responses are
  bounded known failures; no provider-specific parser or fallback chain is added.
- [Existing pre-submit plans use the old compiled prompt] -> Generate detects compiler drift before submit and
  follows the existing stale/successor behavior. Existing submitted unknown attempts remain unchanged.

## Migration Plan

1. Ship the compiler, credential normalization, transport deadline, and smoke wording together with focused
   mock coverage.
2. Do not migrate state, task IDs, grants, attempts, candidate images, or accepted selections. Existing accepted
   selections remain readable because their provenance already carries native media fields.
3. Allow an old unsubmitted plan to become stale through the existing recomputation guard; it must obtain a new
   exact plan and authorization before provider work. Do not edit plan, grant, attempt, or `_generated/` files.
4. If the change must be rolled back, roll back code before creating new plans. A plan compiled under one
   compiler is allowed to fail its existing pre-submit drift check under the other; normal successor planning,
   not state rewriting, restores a valid checkpoint.

## Validation Strategy

Unit tests will cover the deterministic 4,000-byte compiler boundary, digest exclusion, native PNG dimensions,
invalid PNG classification, comma endpoint rejection, and request/poll deadline accounting. Integration tests
will use local mock providers to cover inline success, async completion, terminal task failure, malformed
responses, an aborted submit, and a poll deadline while asserting persisted attempt status and exact provider
call counts. CLI process tests will verify scoped dotenv behavior, comma-list rejection before a Style Master or
Page Authority fetch, and secret-safe diagnostics. Environment-check tests will verify the same comma-list
rejection before a live probe, unchanged JSON shape, one smoke POST, and a qualified connectivity-only global
conclusion.

No real-provider E2E test is added: it would create paid external work and would not be deterministic. Existing
mock process coverage is the suitable end-to-end boundary for this change; the full regression suite remains the
final compatibility check.
