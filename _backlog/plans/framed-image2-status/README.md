# Plan: Framed Image2 Render Contract

> Type: Design | Status: Draft | Updated: 2026-07-30

## Intent

`framed` already has a complete v2 lifecycle, but its authoring/preflight
contract and Chromium output are two different frame definitions. This plan
closes that gap without expanding the product surface.

The supporting investigation is in [research.md](research.md). The proposed
implementation design and acceptance strategy are in
[render-contract-plan.md](render-contract-plan.md).

## Decision

Make `standard-v1` the single source of truth for all of these facts:

- panels and their reserved underlay rectangles;
- text-field geometry, line limits, type scale, colors, and weights;
- the bundled font families and exact font-use evidence;
- the Framed compositor's self-contained HTML/CSS and its layout assertions.

The chosen unit is a deep private Framed layout module. It hides HTML, CSS,
font-shard selection, and DOM measurement behind the existing Framed workflow;
callers continue to supply only receipt-bound text-frame data and verified raw
PNG evidence. No caller gains a markup, CSS, font-path, or capture-options
interface.

## Scope

Included:

1. Converge the current `standard-v1` preset, renderer, preflight, and raw
   safe-zone facts.
2. Use the checked-in Source Sans 3 and Noto Sans SC material in actual
   Framed pages, with fail-closed custom-font evidence.
3. Verify actual DOM/pixel layout before a nonzero provider submission and at
   final composition.
4. Add targeted Framed lifecycle, runtime, and mock-E2E coverage.
5. Remove or clarify the stale `Mixed deck` scenario in the orchestration spec.

Excluded:

- additional Frame presets, per-slide workflow selection, or Framed/Pure
  mixing within a version;
- free-form local body text, table/chart labels, or a replacement for Pure;
- OCR or an automated judgment that an Image2 raw underlay obeyed no-text
  instructions. Raw visual acceptance remains human-owned.

## Proposed Sequence

1. **Contract convergence.** Introduce the private layout module and replace
   hard-coded compositor CSS with preset-derived output.
2. **Proof before spend.** Run exact browser layout/font verification before
   provider authorization so a non-fitting Text Frame stops before submission.
3. **Proof at production.** Reuse that same verifier during composition and
   fail finalization before it publishes output if bounds, fonts, or safe-zone
   facts differ.
4. **Regression proof.** Add bilingual, overflow, title-wrap, and both
   callout-variant tests; cover the public Framed raw rebuild route in mock
   E2E.
5. **Spec cleanup.** Record the owner, invariant, and recovery in the relevant
   OpenSpec capability specs, then archive the resulting change normally.

## OpenSpec Handoff

There is no active OpenSpec change. Once this plan is accepted, create a
framework-maintenance change, likely named
`converge-framed-render-contract`. It should modify existing capabilities
instead of creating a new one:

- `image-production` for the Framed compositor invariant;
- `image-generation` for the pre-authorization layout check;
- `html-render-runtime` for actual Framed page font/layout evidence;
- `pipeline-orchestration` for corrected homogeneous-version terminology.

Run-bundle contract impact: **compatible**. Source grammar, version workflow,
and receipt ownership remain unchanged. Existing derived final PNG/PPTX output
remains rebuildable through the normal owner; no production `deck_*` data is a
fixture or migration target.
