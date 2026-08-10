## Context

See `proposal.md` for the motivation. The implementation already has a
current Framed source grammar and an observable end-to-end planning seam:
`buildFramedTargetRawPlan` returns each adapter-owned request, and
`targetPageImageSubmitFactory` submits those bound bytes. The stale workflow
suite predates that grammar and instead constructs retired `text_frame`
receipts or source containing `VISUAL SCENE` and whole-page text exclusions.

The future protected-composition change needs a green baseline, but it must not
silently turn current best-effort behavior into a stronger provider promise.
The relevant authoritative behavior remains in `content-parsing`,
`visual-config`, and `image-generation`; this change makes no delta to them.

## Goals / Non-Goals

**Goals:**

- Exercise the current Framed source -> receipt -> Core/raw plan -> adapter
  request -> shared transport path using one valid reusable fixture builder.
- Preserve the existing single review and exact-bound-input ownership model in
  regression tests.
- Leave a visible, non-green characterization of the three later semantic
  fixes without lowering the passing baseline.

**Non-Goals:**

- No change to Page Class, Header Profile, protected-composition semantics,
  subject-restriction propagation, provider transport, state, CLI, or review.
- No use of a `deck_*` run bundle as a fixture and no mutation of v3 evidence.
- No new gate, grant, confirmation, retry, or quality-control state. Under the
  control policies, this is JS-owned deterministic diagnosis only.

## Decisions

### Use current canonical source fixtures, not synthetic receipt shapes

Every lifecycle test that writes `slide-specifications.md` will use a small
Framed fixture builder with the current header fields, `FRAME PRESET`, `SLIDE
BODY`, and closed `VISUAL BRIEF`. It will use a valid provider-content item and
the existing visual registry selection rather than retired `VISUAL SCENE`,
`no-readable-text`, `no-labels`, or text-free assumptions.

The test-only `receipt` fixture will match the current parser output's
`header_policy` and provider-content facts, or will be obtained from parsing
the fixture where that is clearer. This catches protocol drift at the first
meaningful boundary. Continuing to hand-author the retired `text_frame` shape
would hide the production source contract from the test.

### Observe exact compilation through existing public results

The new focused test will build a current Framed plan, retain its returned
per-slide request, and send it through `targetPageImageSubmitFactory` with a
fake provider. It will assert that the serialized request body matches the
adapter-owned request and binding digest already returned by planning. This
uses an existing production seam; no CLI test hook or transport rewrite is
added.

An alternative was exporting an internal compiler function solely for tests.
That would create a second observation surface and is unnecessary while the
plan return and submit factory already exercise the real boundary.

### Represent future semantic defects as explicit pending tests

The three known gaps will be named `it.todo` cases with the exact desired
future outcome: restrictions survive to compiled input, protected composition
declares coordinate/canvas semantics, and it declares a body-safe region.
They intentionally remain pending until the later Framed hardening change
modifies the runtime contract and its specs. A failing active test would make
the restored baseline permanently red; asserting that the omission exists
would instead normalize a known defect.

### Keep quality and control ownership unchanged

This change neither treats a prompt instruction as an acceptance proof nor
adds OCR. Existing Complete Page Review remains the only `proceed | repair`
decision. The repaired tests only prove deterministic inputs, bindings, and
local contract behavior. This preserves the simplest control path required by
`human-centered-gates.md`, `agent-assistance-and-control.md`, and
`simple-reliable-control.md`: no new human question, no second controller, and
no new fallback state.

## Risks / Trade-offs

- [Some old test names encode retired behavior] -> Rename expectations to the
  current contract rather than preserving a misleading historic name.
- [A test may reveal an actual current regression, not fixture debt] -> Stop
  before changing behavior, record the failure against this change, and route
  a semantic fix to the owning later change.
- [Browser-based Framed tests are slower] -> Keep the fixture deck to one page
  except where a lifecycle scenario explicitly requires more pages; run focused
  suites before the full repository suite.
- [TODO cases could be overlooked] -> Give each a narrow failing behavior and
  reference the later hardening change in its description and task notes.

## Migration Plan

1. Update test fixtures and assertions only.
2. Run the focused Framed workflow suite and adjacent parser/render/review/
   binding/invalidation suites.
3. If all pass, no deployed data or run-bundle migration is needed. Reverting
   this change reverts test coverage only; no generated artifact or state needs
   restoration.
