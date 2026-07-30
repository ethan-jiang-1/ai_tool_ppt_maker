# Research: Framed Image2 Current Status

Date: 2026-07-30

## Scope and terminology

This review covers only framework source, OpenSpec, and tests. It does not
inspect any `deck_*`, `dpt_*`, or `_backlog` content.

`image2only` is not the current protocol name in the reviewed source. New
authoring uses `page-authority-image2-v2`; one whole `vN` selects exactly one
`production.workflow: framed|pure`. `framed-image2` is the parser's derived
authority name for a `framed` version, not a source field that an individual
slide may choose. A `PAGE AUTHORITY` field is rejected.

Sources:

- `PPTMAKER_FRAMEWORK/BOOTSTRAP.md:26-37`
- `PPTMAKER_FRAMEWORK/scripts/01-content/internal/page_authority_source.mjs:535-566`

## Conclusion

Framed is not a concept-only alternative to Pure. Its v2 production path is
implemented and tested: source validation, Text Frame preflight, text-free raw
underlay planning, authorization, provider generation, review/acceptance,
local Chromium composition, common final-manifest publication, PPTX assembly,
notes injection, and a provider-free Text Frame refresh path.

However, it is best described as **workflow-complete but render-contract
incomplete**. The sole `standard-v1` preset declared to authoring/preflight and
the CSS actually sent to Chromium disagree on fonts, palette, geometry, and
type scale. Therefore the current preflight does not prove the final rendered
text fits the declared standard frame.

## Pure and Framed comparison

| Concern | `framed` | `pure` |
| --- | --- | --- |
| Pixel ownership | Image2 supplies a text-free 2000x1125 underlay; local renderer adds the Text Frame. | Image2 supplies all final pixels, including display text. |
| Source restrictions | Requires title, `no-readable-text`, and `no-labels`; semantic `BODY` is forbidden. | Source display is included in the raw contract; display cannot contradict those no-text constraints. |
| Raw contract | `standard-v1` preflight evidence, reserved underlay rectangles, `text_free: true`. | Visual language, identity reference, and `display` fields. |
| Finalization | Chromium composes accepted raw PNG plus local fields, then publishes the shared v2 manifest. | Publishes accepted raw PNG bytes unchanged into the same manifest schema. |
| Visible text edit | Can recompose locally only with exact accepted underlay evidence and unchanged raw contract. | Any source/display or visual change creates raw-generation debt. |
| Whole-version rule | Cannot coexist slide-by-slide with Pure in one `vN`; switching workflow is structural versioning. | Same. |

Sources:

- `PPTMAKER_FRAMEWORK/BOOTSTRAP.md:28-33,58-65`
- `PPTMAKER_FRAMEWORK/scripts/01-content/internal/page_authority_source.mjs:414-460`
- `PPTMAKER_FRAMEWORK/scripts/03-framed-image/index.mjs:198-264,289-409,440-498`
- `PPTMAKER_FRAMEWORK/scripts/04-pure-image/index.mjs:78-99,119-227`
- `openspec/specs/pipeline-orchestration/spec.md:84-106`

## What is implemented for Framed

1. **Typed local Text Frame.** There is one locked preset, `standard-v1`, with
   `kicker`, `title`, `subtitle`, and optional `callout`. Preflight rejects
   invalid literals and overflow before provider authorization, records the
   appropriate reserved underlay areas, and declares 1000x562.5 CSS / 2000x1125
   capture output.
   Source: `PPTMAKER_FRAMEWORK/scripts/03-framed-image/internal/text_frame.mjs:5-18,34-74,154-224`.

2. **Receipt-bound raw generation.** The Framed adapter compiles a raw
   contract containing the visual language plus the preset digest, canvas,
   reserved rectangles, and `text_free: true`; it then goes through the same
   plan-hash authorization, raw review, and acceptance mechanism as Pure.
   Sources: `PPTMAKER_FRAMEWORK/scripts/03-framed-image/index.mjs:289-381` and
   `PPTMAKER_FRAMEWORK/scripts/shared/image2/page_authority_target_runtime.mjs:375-525`.

3. **Actual local composition and delivery.** Framed validates an accepted
   raw PNG, invokes the private HTML/Chromium compositor, writes final PNG
   bytes through the v2 manifest, and hands them to the shared delivery owner
   for the final projection, PPTX, and notes.
   Sources: `PPTMAKER_FRAMEWORK/scripts/03-framed-image/index.mjs:231-264,384-409` and
   `PPTMAKER_FRAMEWORK/scripts/05-delivery/index.mjs:165-248`.

4. **Local text-only refresh.** It rebinds exact accepted underlay evidence
   and recomposes the final PNG without a provider submission. Underlay,
   preset, visual-contract, or raw-profile changes are rejected from that path
   and require a new authorized raw cycle.
   Source: `PPTMAKER_FRAMEWORK/scripts/03-framed-image/index.mjs:147-195,434-498`.

## Primary gap: the declared preset is not the rendered preset

The implementation has two contradictory definitions of `standard-v1`.

- **Preflight declaration:** `Source Sans 3` and `Noto Sans SC`; a light
  `#f5f0eb` panel; header at `x=40, y=28, w=920, h=238`; and a 46px,
  two-line title. It uses these geometry values and a heuristic glyph-width
  function for the fit decision.
  Source: `PPTMAKER_FRAMEWORK/scripts/03-framed-image/internal/text_frame.mjs:8-17,34-58,84-95,172-224`.

- **Actual compositor:** `Arial,sans-serif`; a dark full-width panel beginning
  at `top:0` with `min-height:143px`; and a 34px title. The HTML does not read
  the declared preset's theme, fonts, or field geometry. It also calls capture
  without `fontRoles`, so the returned `font_evidence` is `null`.
  Source: `PPTMAKER_FRAMEWORK/scripts/03-framed-image/internal/framed_composition.mjs:16-36`;
  the conditional font-evidence collection is in
  `PPTMAKER_FRAMEWORK/scripts/03-framed-image/internal/capture_runtime.mjs:138-140`.

Impact: a string can pass the 46px `Source Sans 3` / `Noto Sans SC` heuristic
while wrapping, overflowing, or simply rendering differently in 34px Arial.
The raw contract's reserved regions similarly describe a frame that the final
renderer does not faithfully place. This weakens the central Framed promise:
predictable local text over a provider-generated text-free background.

## Other gaps and limits

1. **Human review, not semantic raw verification.** Raw review creates a
   contact sheet and stores a human `proceed|repair|redirect` decision. It has
   no automated OCR or reserved-region/text-free inspection. The provider is
   instructed through the raw contract, but adherence remains a reviewer
   responsibility.
   Source: `PPTMAKER_FRAMEWORK/scripts/shared/image2/page_authority_target_runtime.mjs:439-525`.

2. **Narrow current capability.** There is exactly one fixed frame preset and
   only four single-line text fields; `BODY` is deliberately not available in
   Framed. Content needing labels, values, quotations, captions, dates, or
   diagram text belongs to Pure under the present model.
   Sources: `PPTMAKER_FRAMEWORK/BOOTSTRAP.md:30-31` and
   `PPTMAKER_FRAMEWORK/scripts/03-framed-image/internal/text_frame.mjs:154-170`.

3. **Test coverage proves lifecycle, not frame fidelity.** The Framed suite
   tests lifecycle, successful local composition, local refresh, and CLI
   routing, but has no direct cases for CJK metrics, long tokens/overflow in
   the rendered browser, both callout variants, bundled-font usage, or pixel/
   geometry agreement between preflight and the captured PNG.
   Source: `tests/03-framed-image/test_framed_workflow.mjs:41-305`.

4. **One stale/ambiguous spec phrase.** `pipeline-orchestration` has a scenario
   called "Mixed deck", but its authoritative current rule explicitly says one
   version resolves exactly one of Framed or Pure and prohibits per-slide
   authority dispatch. Do not interpret that phrase as implemented mixed-mode
   support.
   Source: `openspec/specs/pipeline-orchestration/spec.md:56-64,84-106`.

## Verification performed

- `npm exec -- vitest run tests/03-framed-image/test_framed_workflow.mjs`:
  passed, 6 tests. This includes an actual local composition plus shared
  delivery using a provider fake, local text refresh without a second provider
  submission, and the public title-refresh command.
- Project verification run in parallel: `npm test` passed; selected mock E2E
  `tests_e2e/shared/workflow/test_mock_target_workflow_journey.mjs` passed
  2 tests.

## Recommended next work

1. Make the compositor consume `FRAMED_TEXT_FRAME_STANDARD_V1` as its only
   source of font, colour, panel, field geometry, and line limits. Do not keep
   a second hard-coded CSS specification.
2. Bundle and verify the declared fonts, pass `fontRoles`, and use browser
   text measurements (or otherwise demonstrate equivalence) for preflight.
3. Add rendered-pixel/DOM geometry tests for CJK, long unbreakable tokens,
   title wrapping, and both callout variants; assert their bounds stay inside
   the frame and their panels match the raw reserved regions.
4. Decide whether text-free/reserved-region raw validation remains strictly
   human review or requires automated assistance, then state the decision in
   the raw-review contract.
5. Clarify or remove the stale "Mixed deck" wording in the orchestration spec.
