## Context

See [proposal.md](proposal.md) and the `image-generation` delta. The Framed
adapter already derives a single `protected_composition` from the selected
profile, compiles it into canonical provider-input bytes, binds those bytes into
the raw plan, and shows the same regions in the existing Complete Page Review.
The current compiler instruction says to use `body_safe` and reserve the header,
but does not state the inverse, exclusive prohibition that failed in the C7
reconstruction.

The direct sources of record remain the selected Framed presentation profile,
source receipt, raw contract, and compiled provider input. Review images are
derived evidence, not configuration inputs.

## Goals / Non-Goals

**Goals:**

- Express one unambiguous, content-neutral exclusive header reservation in
  every canonical Framed provider input.
- Make the resulting instruction part of the input's normal digest and
  raw-rebuild invalidation surface.
- Reuse the existing Complete Page Review for human assessment of provider
  compliance and retain its one `repair -> rebuild -> review` loop.

**Non-Goals:**

- Detect provider typography or occupied pixels automatically with OCR,
  collision analysis, image segmentation, or a second quality gate.
- Leak local header text, header-derived context, new masks, regions, or
  provider-native transport parameters into a Framed request.
- Change Pure compilation, existing persisted history, provider retry rules,
  or lifecycle state schemas.

## Decisions

### 1. Extend the existing canonical Framed instruction, not the request schema

**Owner:** the Framed JS adapter owns canonical request bytes.

The compiler will replace its current one-way guidance with a fixed instruction
that says all provider-rendered readable body content, labels, and key subjects
belong in `body_safe`, while `reserved_header` is exclusively for the local
overlay and contains none of those Provider elements. The instruction will use
only the established semantic region names. Exact selected coordinates remain
in the existing `protected_composition` object.

Because this text is part of the canonical UTF-8 input, the existing compiled
input digest, raw-plan binding, and invalidation evaluator automatically make a
changed clause a raw rebuild. No new raw-contract property, state field, or
request transport field is required.

Alternative considered: add `no_text_in_header`, `header_owner`, or a native
region/mask field to the serialized request. Rejected because it duplicates
existing composition authority, risks exposing local-header ownership as
provider input schema, and would falsely imply verified provider support.

### 2. Validate the local compiled contract before provider work

**Owner:** the Framed adapter's provider-free plan compiler and its existing
contract tests.

The implementation will centralize the fixed reservation instruction and add a
small deterministic assertion on the parsed canonical Framed input: it must
contain the exact selected `reserved_header`/`body_safe` binding and the full
exclusive-reservation clauses; it must contain no local header field or literal.
This runs while building the Framed plan, so a compiler regression fails before
derived publication, grant, credential resolution, or provider attempt.

This is an integrity `hard-stop` under
`human-centered-gates.md`: it protects attributable canonical request bytes.
The nearest legal action is the existing source/configuration repair followed
by the same plan checkpoint. The Agent performs that mechanical repair under
the Task Mandate as described by `agent-assistance-and-control.md`.

Alternative considered: inspect rendered remote raster output in this
validator. Rejected because the direct source of record is the compiled input,
not an image whose typography cannot be reliably classified without adding a
separate evaluator and false claims of automatic acceptance.

### 3. Keep remote compliance in the existing Complete Page Review

**Owner:** the current raw owner records the decision; the human owns visual
quality judgment.

The existing review contribution already publishes exact provider and Framed
composite images plus selected region guides. The review guidance will name
header encroachment as a reason to choose `repair`. No new reviewer-facing
record, CLI option, controller node, or automatic observation is added.

This remains a `confirm`: the human decides whether the actual rendered page is
usable. A `repair` keeps immutable evidence, withholds accepted raw evidence,
and returns the existing raw-rebuild action. It is not a waiver. The same
existing hard-stops continue to protect plan/receipt integrity and submitted
attempt recovery.

Alternative considered: block `proceed` using OCR or a geometric occupancy
threshold. Rejected because it would add a competing pass/fail authority and
is not reliable for arbitrary generated layouts. It violates the
`simple-reliable-control.md` principle that quality control must be simpler
than the work it validates.

### 4. Cover the contract at its existing seams

**Owner:** `tests/03-framed-image/` verifies the adapter; shared lifecycle
tests verify evidence behavior; public CLI tests remain the integration surface.

Focused adapter tests will parse a real canonical Framed provider input from a
temporary bundle and assert the exclusive reservation, body-safe placement,
selected composition equality, absence of local-header data, and changed input
digest. A negative compiler test will prove a missing or weakened fixed clause
stops before plan publication or provider initialization. Existing Pure tests
will assert that Pure input does not acquire Framed-only wording or geometry.

Existing Complete Page Review/lifecycle tests will be extended only to show the
approved `repair` outcome withholds accepted evidence and exposes the normal
rebuild action. The public CLI mock journey will validate that the modified
Framed input still reaches normal plan/authorize/review controls without a real
provider call. No separate end-to-end suite is needed: the changed behavior is
covered by deterministic adapter and existing public CLI integration seams;
external provider adherence remains a human-reviewed quality fact.

## Risks / Trade-offs

- [A remote provider can still ignore the strengthened instruction] -> The
  existing Complete Page Review remains mandatory and the only quality decision;
  repair triggers a fresh exact request rather than accepting overlap.
- [Fixed wording changes current Framed input digests] -> This is intentional
  provider-visible drift; the normal plan lineage invalidates old raw evidence
  and preserves it as history.
- [Instruction accidentally leaks local-header terms or literals] -> Focused
  parsing tests assert only semantic region names and absence of local header
  fields/literals.
- [A new automatic visual validator expands control complexity] -> Explicitly
  excluded; reuse the compiled-input assertion plus the existing human review.

## Migration Plan

No migration is required. Existing runs and evidence remain byte-preserved.
After deployment, a current Framed `image2 plan` compiles the strengthened
input and creates a normal new raw plan. A retained or previously repaired plan
cannot be reopened; its recovery remains the existing rebuild path. Rollback is
the normal source-code rollback before any new plan is authorized; no state or
generated artifact needs manual repair.
