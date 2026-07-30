# Research: Framed Image2 Current Status

> Evidence snapshot | Date: 2026-07-30

## Scope And Method

This investigation covers framework source, current OpenSpec capabilities,
tests, and local deterministic probes. It does not inspect production `deck_*`
or `dpt_*` data. Besides this requested plan directory, no other `_backlog`
material is used as authority.

The report separates observed behavior from proposed design. Decisions and the
implementation sequence live in [render-contract-plan.md](render-contract-plan.md),
[pilot-run-plan.md](pilot-run-plan.md), and
[progressive-plan.md](progressive-plan.md).

## Terminology Finding

`image2only` is not the current protocol name. New authoring uses
`page-authority-image2-v2`; one whole `vN` selects exactly one
`production.workflow: framed|pure`. `framed-image2` is the parser's derived
authority for a Framed version, not a per-slide source choice. A source `PAGE
AUTHORITY` field is rejected.

Sources:

- `PPTMAKER_FRAMEWORK/BOOTSTRAP.md:26-37`
- `PPTMAKER_FRAMEWORK/scripts/01-content/internal/page_authority_source.mjs:535-566`
- `openspec/specs/pipeline-orchestration/spec.md:83-106`

## Conclusion

Framed is **workflow-complete but render-contract incomplete**.

Implemented behavior includes source parsing, Text Frame validation, text-free
raw planning, exact-hash authorization, provider generation, human raw review,
accepted raw evidence, local Chromium composition, common final-manifest
publication, PPTX/notes delivery, provider-free Text Frame refresh, and
notes-only refresh.

The blocking integrity gap is that authoring/preflight and final composition
implement different frames. The declared `standard-v1` data is light,
preset-sized, and names bundled fonts. Chromium receives separately hard-coded
dark Arial CSS. The current heuristic therefore cannot prove that final text
fits the frame described by the raw contract.

There is also a cross-workflow UX gap. Current v2 requires Style Master bytes
but does not expose a first-class Style Master feedback loop, and both Framed
and Pure authorize and generate the complete raw plan before the human sees a
representative production-equivalent sample.

## Current Framed/Pure Boundary

| Concern | `framed` | `pure` |
| --- | --- | --- |
| Pixel ownership | Image2 supplies a text-free 2000x1125 underlay; local Chromium adds the Text Frame. | Image2 supplies all final pixels, including display text. |
| Source restrictions | Requires title, `no-readable-text`, and `no-labels`; semantic `BODY` is forbidden. | Display text is part of the provider-owned raw contract. |
| Raw contract | Carries frame preset/safe zones and `text_free: true`. | Carries visual language, identity reference, and display fields. |
| Finalization | Composes accepted raw PNG plus local fields, then publishes the common v2 manifest. | Publishes accepted raw PNG bytes unchanged into the same manifest schema. |
| Visible text edit | May recompose locally with exact accepted underlay evidence and unchanged raw facts. | Display/visual changes create raw-generation debt. |
| Version rule | Cannot coexist slide-by-slide with Pure in one `vN`. | Same. |

Sources:

- `PPTMAKER_FRAMEWORK/BOOTSTRAP.md:28-33,58-65`
- `PPTMAKER_FRAMEWORK/scripts/01-content/internal/page_authority_source.mjs:414-460`
- `PPTMAKER_FRAMEWORK/scripts/03-framed-image/index.mjs:134-264,289-409,434-548`
- `PPTMAKER_FRAMEWORK/scripts/04-pure-image/index.mjs:78-227`

## Current Style Master And Pilot Status

Page Authority raw planning requires nonempty effective bytes at
`2_backbone/visual-style/style_master.jpg`. Both selected workflow adapters
place that exact path into provider submission references, and the style byte
digest contributes to `provider_profile_sha256`.

Sources:

- `PPTMAKER_FRAMEWORK/scripts/shared/image2/page_authority_target_runtime.mjs:44,190-212`
- `PPTMAKER_FRAMEWORK/scripts/03-framed-image/index.mjs:314-349`
- `PPTMAKER_FRAMEWORK/scripts/04-pure-image/index.mjs:134-167`

The current create-deck Controller only has `configure visual system ->
authorize raw -> generate all -> review all`. It has no node that generates,
shows, decides, and promotes a Style Master candidate. File existence is
visible in status, but existence is not a human feedback loop or byte-bound
visual decision.

Sources:

- `PPTMAKER_FRAMEWORK/playbook/create-deck.md:62-202`
- `PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs:484-498,609-622`
- `openspec/specs/style-master-generation/spec.md:1-30`

Current v2 also has no first-class Pilot Run:

- plan projection reports `maximum_submissions` for every item in the complete
  plan;
- authorization always records `rawWorkPlan.items.length`;
- generation requires provider requests to cover the complete plan exactly and
  submits every item;
- raw review requires bytes for every plan item;
- target `--slides` input is explicitly rejected rather than treated as a
  supported scoped batch;
- public help is contract-tested not to expose `pilot` or `style-master`.

Sources:

- `PPTMAKER_FRAMEWORK/scripts/shared/image2/page_authority_target_runtime.mjs:378-443,469-525`
- `PPTMAKER_FRAMEWORK/scripts/shared/image2/page_authority_raw_mechanics.mjs:24-55`
- `PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs:1373-1387,1507-1539,1974-1985`
- `tests/contracts/test_retired_cli_surface.mjs:119-123`

The authorization record has one plan-wide scope and a count but no exact
selected-ID grant. Lowering only `max_submissions` would therefore be unsafe:
it could authorize N submissions without proving which N plan items the human
saw. A real pilot needs exact item scope and generation provenance, not a
count-only shortcut.

Accepted raw evidence also carries one top-level provider-authorization digest
and no per-item grant binding. A second expansion authorization would overwrite
current authorization state, so treating only its digest as authority would
lose the exact grant that produced pilot bytes. Progressive generation needs
one versioned cumulative authorization owner plus item-to-grant materialization
provenance; a later broad grant cannot retroactively cover earlier bytes.

Sources:

- `PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs:474-488,1148-1248`
- `PPTMAKER_FRAMEWORK/scripts/shared/image2/page_authority_artifacts.mjs:56-99,101-153`

## Historical Pilot Context

The repository did have the desired interaction idea before the legacy
whole-page production surface was retired:

- the old create-deck Controller explicitly sequenced Style Master
  authorization/generation, representative pilot generation, pilot review, and
  a separate full-build authorization;
- `selectPilotSlideIds()` defaulted to three and selected by render/visual risk
  before falling back to first/middle/last positions;
- `pilot` generated only selected IDs and published a contact sheet before full
  build.

Historical sources at parent of commit `2a42fe4`:

- `PPTMAKER_FRAMEWORK/playbook/create-deck.md:118-235`
- `PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs:881-955,1596-1778`
- `PPTMAKER_FRAMEWORK/charter/AGENT_CONTRACT.md:187-197`

Commit `2a42fe4` removed those commands and implementations together with the
legacy HTML/whole-page/Header-Lock production authority. The retained current
Style Master spec now preserves only shared Page Authority input/client
primitives. Therefore the old flow is useful product evidence, but it is not a
current v2 route and its old state, adapter, command grammar, or render-mode
semantics must not be copied back implicitly.

## Primary Contradiction: Two Definitions Of `standard-v1`

The preset declares:

- Source Sans 3 and Noto Sans SC;
- a light `#f5f0eb` panel at `x=40, y=28, w=920, h=238`;
- absolute field rectangles, including a 46px two-line title;
- top and optional bottom reserved underlay rectangles;
- a 1000x562.5 CSS canvas captured at 2000x1125.

Source:
`PPTMAKER_FRAMEWORK/scripts/03-framed-image/internal/text_frame.mjs:5-74`.

The final compositor instead emits:

- `Arial,sans-serif`;
- a dark full-width top panel beginning at `top:0`;
- a 34px title and independent flow/margin geometry;
- capture without `fontRoles`, producing no custom-font evidence.

Sources:

- `PPTMAKER_FRAMEWORK/scripts/03-framed-image/internal/framed_composition.mjs:6-36`
- `PPTMAKER_FRAMEWORK/scripts/03-framed-image/internal/capture_runtime.mjs:90-140`

The compositor only checks that a caller supplied an `ok` preflight object. It
does not prove that the object was produced for the exact current receipt,
preset, fonts, runtime, or CSS.

## Empirical False-Acceptance Probe

A deterministic local probe used the pinned Chromium runtime and checked-in
Source Sans 3 with a title containing 28 uppercase `W` characters.

| Observation | Result |
| --- | --- |
| Current heuristic width | 811.44px |
| Declared field width | 872px |
| Heuristic decision | accepted |
| Browser rendered width | 1047.72px |
| Browser decision | overflow |
| Browser launch plus measurement | approximately 727ms |

This is a direct counterexample to treating the current glyph-width estimator
as authorization evidence. It also supports one bounded browser batch rather
than one launch per field or one launch in every lifecycle command.

## Preset Data Quality Findings

The declared preset is closer to the intended authority than the compositor,
but it is not yet a clean canonical model:

- panel opacity exists in the theme and is copied into every panel;
- `border` is declared but never rendered;
- panel `padding` is not the source of field layout because fields use absolute
  coordinates;
- header padding happens to approximate its field inset, while callout padding
  contradicts the callout field's absolute x coordinate.

Hashing these facts does not make them semantically authoritative. Any faithful
convergence needs a normalized preset and a deliberate digest change.

Source:
`PPTMAKER_FRAMEWORK/scripts/03-framed-image/internal/text_frame.mjs:8-74`.

## Current Planning And Write Topology

`compileFramedTargetRawPlan()` is synchronous. It performs heuristic
preflight, constructs raw contracts/provider requests, creates the plan, and
immediately calls `writeTargetRawWorkPlan()`.

Every later Framed raw lifecycle command calls `buildFramedTargetRawPlan()`
again:

```text
plan / authorize / generate / prepare-review / decide-review / delivery
                              |
                              v
                 rebuild and rewrite current plan
```

Sources:

- `PPTMAKER_FRAMEWORK/scripts/03-framed-image/index.mjs:198-228,314-409`
- `PPTMAKER_FRAMEWORK/scripts/shared/image2/page_authority_target_runtime.mjs:371-408`

This topology has two implications:

1. Adding asynchronous browser proof inside the current helper would rerun it
   in authorize/generate/review/delivery unless the command topology is split.
2. A blanket guarantee that failed proof writes no state would be false.
   `resolveTargetSourceContext()` initializes or advances target source state
   and writes the source receipt before raw-plan compilation begins.

Source:
`PPTMAKER_FRAMEWORK/scripts/shared/image2/page_authority_target_runtime.mjs:245-283`.

The current implementation can only offer a narrower guarantee: failed proof
would write no raw plan or downstream raw/final evidence, while source state
may already have changed. The target design should correct this by separating
read-only candidate source resolution from post-proof source-state/receipt and
raw-plan materialization.

## Raw Review Does Not Show Its Required Framed Facts

Current target raw review renders a contact sheet containing raw images and
`slide_id` labels. It does not show the required `position + slide_id + title`,
does not overlay Framed safe-zone rectangles, and its review record carries no
explicit capture/projection profile or typed coverage record.

Source:
`PPTMAKER_FRAMEWORK/scripts/shared/image2/page_authority_target_runtime.mjs:455-525`.

This is more than a future enhancement: retained specs already describe raw
review/rebuild behavior around safe-zone guides and canonical renderer-profile
evidence.

Sources:

- `openspec/specs/image-generation/spec.md:35-67`
- `openspec/specs/run-bundle-layout/spec.md:29-40`

The existing review remains intentionally human-owned. It has no OCR or
automated determination that the generated underlay is text-free; that is a
known boundary, not the renderer-contract bug.

The evidence also exposes three identities that future wording must not
conflate: provider generation profile, Framed final-pixel render profile, and
raw-review projection/capture profile. A semantics-blind shared owner can
retain its boundary if the selected workflow adapter supplies typed generic
overlay/profile contributions and the review binds their digest.

## Production-Facing Test Bypass

`composeFramedFinalSlideManifest()` exports a `compose` callback. Tests use it
to return arbitrary bytes, bypassing raw PNG validation, the pinned browser,
frame CSS, layout checks, fonts, network denial, capture dimensions, and the
unique compositor.

Sources:

- `PPTMAKER_FRAMEWORK/scripts/03-framed-image/index.mjs:231-264`
- `tests/03-framed-image/test_framed_workflow.mjs:48-58`

This makes final-manifest mechanics testable but weakens the production module
boundary. The replacement needs a private runtime seam so public workflow
tests cannot accidentally prove only a bypass.

## Font Inventory And Feasibility

The repository already has an owned, integrity-checked font inventory with
unicode-range metadata:

- 102 font files total: one Source Sans 3 face plus 101 Noto Sans SC shards;
- approximately 4.69 MB of font bytes in the full inventory;
- a typical English frame embeds approximately 170 KB;
- a sampled Chinese frame selects four Noto shards and embeds approximately
  402 KB total.

Sources:

- `PPTMAKER_FRAMEWORK/scripts/00-setup/internal/html_fonts.mjs:35-179`
- `PPTMAKER_FRAMEWORK/scripts/00-setup/internal/html_runtime.mjs:150-222`
- `openspec/specs/html-render-runtime/spec.md:16-87`

The inventory parser already validates face metadata, unicode ranges, local
files, and digests. What is missing is a narrow production helper that maps a
frame's actual code points to the required checked-in faces and emits them into
the self-contained page.

The numbers rule out embedding all Noto shards on every page and support
deterministic per-page selection. They do not justify saying that arbitrary
Chinese or any other language is supported; code-point coverage and language
support are different claims.

## Layout Evidence Requirements

The existing capture runtime can collect CDP font evidence when `fontRoles` is
provided, deny network routes, validate expected leaf markers, and capture a
fixed PNG. The Framed compositor does not currently use the font path, and
there is no exact DOM agreement check against preset panels/fields.

A robust browser observation can use:

- exact panel and field container rectangles;
- field `scrollWidth`/`scrollHeight`;
- y-grouped `Range` fragments for line count;
- conditional custom-font evidence for actual selected glyphs.

It should not require every raw glyph rectangle to remain inside the CSS field
rectangle: glyph ink and browser rounding do not define the layout box.

## Specification Coherence Findings

The orchestration spec contains a scenario titled `Mixed deck` that says
accepted Pure and Framed evidence is selected for one build. The same spec's
current authoritative requirement says one target version selects exactly one
workflow and prohibits per-slide dispatch.

Source:
`openspec/specs/pipeline-orchestration/spec.md:50-59,83-106`.

The stale scenario should be removed or rewritten; it must not be used to
invent mixed-mode support.

The render correction spans more than the four capabilities named in the
original draft. In addition to `image-production`, `html-render-runtime`,
`image-generation`, and `pipeline-orchestration`, proposal work must audit:

- `visual-config` for canonical visual/profile identity;
- `environment-check` for runtime/font readiness and recovery;
- `cli-surface` for owner-issued error category, JSON/stderr, and exit behavior.

The generic raw-review restoration may also touch accepted bundle-layout and
evidence requirements. CLI producer fields remain authoritative; consumer
specs must not copy their schema.

## Test Coverage And Baseline

The focused Framed suite currently proves six lifecycle behaviors, including a
real local composition/shared delivery path, provider-free text refresh, and
the public title-refresh command. It does not directly prove:

- browser equivalence with preset geometry;
- CJK/mixed font selection on actual deck pages;
- long-token, extra-line, or DOM scroll overflow;
- both callout variants;
- profile-bound invalidation;
- no raw-plan write after failed browser proof;
- browser launch counts by lifecycle command;
- safe-zone/profile evidence in raw review.
- Style Master candidate/review/promotion evidence;
- exact representative-scope authorization for either workflow;
- pilot-to-expansion byte reuse and prevention of premature full authorization;
- production-equivalent Framed and Pure pilot projections;
- small-scope review deduplication.

Source: `tests/03-framed-image/test_framed_workflow.mjs:41-305`.

Verification performed during the investigation:

- `npm exec -- vitest run tests/03-framed-image/test_framed_workflow.mjs`:
  6/6 tests passed;
- full `npm test`: passed;
- `tests_e2e/shared/workflow/test_mock_target_workflow_journey.mjs`: 2 tests
  passed.

These are uncovered contract gaps, not an existing red regression.

## Evidence-Based Implications

The observations support the following constraints on any implementation:

1. The heuristic cannot remain the authorization authority.
2. Preset normalization must precede profile identity and browser convergence.
3. Candidate source/contract compilation, browser verification, and source
   state/receipt/raw-plan materialization must become separate operations.
4. Later raw lifecycle commands should validate a stored plan rather than
   rebuilding it or rerunning Chromium.
5. The browser compiler and compositor must be one private owner.
6. Profile drift needs conservative raw-evidence invalidation.
7. Raw visual judgment remains human, but its review projection must expose
   the safe-zone/profile facts already required by contract.
8. Style Master existence must not be confused with an early human visual
   decision; candidate review and accepted-byte identity need an owner.
9. Pilot Run belongs to both workflows, but each selected workflow needs a
   straight independent Controller path and its own production-equivalent
   evidence.
10. One complete plan plus exact selected-ID authorization batches is safer
    than count-only scope or a preauthorized full batch.
11. Reusing paid pilot bytes requires owner-written tuple provenance; copied
    filenames or a later broader authorization cannot prove their origin.
12. Pilot `proceed` may unlock expansion but cannot make partial evidence
    complete or authorize the remaining provider calls.

## Policy Interpretation

The evidence maps directly to the repository policies without creating a new
runtime authority:

- the heuristic and hard-coded compositor are competing evaluators for one
  fact, contrary to the one-truth-path rule;
- rebuilding and rewriting the plan in every lifecycle command lengthens the
  control path and risks wrong-owner mutation;
- the public `compose` callback bypasses the owning integrity evaluator;
- missing raw-review guides/profile coverage weakens an existing human
  `confirm`, but does not justify OCR or another approval;
- actual browser fit is reconstructable, so persisting a second proof/gate
  would violate durable-state discipline.
- Style Master and Pilot Run quality are genuinely human-owned `confirm`
  decisions, while missing identity/evidence and unauthorized submit attempts
  remain non-waivable `hard-stop` outcomes;
- the minimum new durable pilot facts are justified only where prior human
  authorization, human judgment, or paid provider-byte provenance cannot be
  reconstructed;
- exact scoped batches shorten feedback and prevent full-plan preauthorization,
  while separate Framed/Pure Controller paths avoid a cross-workflow decision
  layer.

Therefore render convergence remains subtractive: one direct evaluator,
earliest-prerequisite short-circuiting, one nearest legal action, and same-check
rerun. Progressive production adds only irreconstructable decision/provenance
facts to the existing owners; it adds no hidden retry/fallback, inferred
authorization, cross-workflow Controller, or parallel success path.
