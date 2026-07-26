# Plan: Unify Image2 Page Authority

> Type: Architecture and delivery plan | Updated: 2026-07-26 | Status: Active planning, contract-closure revisions in progress
>
> Supersedes and absorbs: [`legacy-whole-page-image2-contract-hardening.md`](./legacy-whole-page-image2-contract-hardening.md)
>
> Proposed OpenSpec change: `unify-image2-page-authority`
>
> Working papers: [index](./unify-image2-page-authority/README.md) | [contract matrix](./unify-image2-page-authority/contract-matrix.md) | [review log](./unify-image2-page-authority/review-log.md)

The document below is the durable human-readable architecture plan. The working papers hold
the mutable review and specification-coverage material; OpenSpec remains the normative
implementation contract.

## The Decision

We will stop treating HTML production, whole-page Image2, header lock, and visual-slot refinement as competing ways to make the same slide.

The new system has one deck-level visual system and exactly two per-slide pixel-authority choices:

```text
Deck Visual System
  - style master and palette
  - typography and frame preset
  - optional Agent identity/reference material
  - Image2 model/profile and review policy
  |
  +-- Pure Image2       -> Image2 owns every final pixel, including all text
  |
  +-- Framed Image2     -> HTML owns a deterministic text frame;
                           Image2 owns a text-free, full-canvas visual underlay
```

`Framed Image2` is the normal default for a serious deck because title, kicker, subtitle, and callout placement become stable. `Pure Image2` remains an intentional per-slide choice for covers, closers, section carriers, and any page where the model should compose the entire artifact.

There is no third hybrid route. In particular:

- `body+header-lock` is **not** Framed Image2. It lets Image2 draw body text and then overlays only a Canvas header.
- `html-then-image2` is **not** Framed Image2. It is a complete HTML page plus visual-slot refinement.
- A slide never goes “Framed first, then Pure.” It has one authority for its current version.

## Why The Old Direction Is Too Small

The initial issue looked like a prompt conflict: v3 reserves a header, but its prompt still asks Image2 to render titles and labels. That is real, and the existing identity/receipt work solves part of it. But the deeper problem is ownership ambiguity: the model is asked to make a finished slide while local code also claims portions of that slide.

Fixing individual prompt clauses would repeat the same work at every workflow step. The durable repair is to make the ownership decision explicit once, compile all later work from it, and reject every route that bypasses it. The former whole-page hardening proposal is historical evidence only: this plan absorbs its useful receipt, identity, authorization, and ingress-fencing requirements so there is one owner for each Image2 contract and registry.

## Non-Negotiable Invariants

1. **One visual system, both authorities.** Style master, palette, visual language, and optional Agent identity are shared deck assets. Pure and Framed slides must feel like one deck.
2. **A Framed Image2 underlay is always full 16:9.** It is not cropped into a middle strip. Opaque deterministic frame panels cover the reserved header and optional callout zones above the full-canvas underlay.
3. **Image2 never owns Framed text.** A Framed prompt must forbid readable text, labels, title, kicker, subtitle, callout, table text, logos, and watermarks. The local frame supplies those pixels.
4. **HTML frame ownership is typed, not free-form.** v1 has one compiler-owned frame preset. A slide may select only allowed fields and a preset; it may not smuggle in arbitrary CSS, geometry, fonts, colors, or markup.
5. **Stable slide identity survives.** `slide_id` remains the page identity. Position, page authority, and frame data are version/content facts, never identity.
6. **No legacy inference.** Historic `full-page` and `body+header-lock` are read-only legacy facts. The framework must never silently map either to `pure-image2` or `framed-image2`.
7. **One verified final PNG per slide.** PPTX assembly consumes a current final-slide manifest, not raw Image2 files, old header-locked files, or a separately guessed overlay.
8. **Text refresh is cheap only when it is honestly local.** Changing Framed text recompiles the local frame. Changing Pure text requires a new provider render and review.

## Target Vocabulary

| Term | Exact meaning |
|---|---|
| **Page Authority** | The declared owner of a slide's final pixels: `pure-image2` or `framed-image2`. |
| **Pure Image2** | Image2 creates the complete final page, including all readable text. |
| **Framed Image2** | Image2 creates a text-free visual underlay; the local HTML compositor creates the stable text frame and final page. |
| **Text Frame** | The typed, deterministic kicker/title/subtitle/callout layout resolved from the shared visual system. |
| **Visual Underlay** | A full-canvas Image2 raw image for a Framed slide. It is not a final slide by itself. |
| **Raw Image Contract** | The exact material sent to Image2 and therefore the scope of provider authorization and raw-image invalidation. |
| **Final Frame Contract** | The local inputs that turn a verified raw underlay into the final slide PNG. |

The old terms `full-page` and `body+header-lock` remain historical protocol names only. New source, plans, receipts, documentation, and diagnostics use the vocabulary above.

## vNext Source Shape

The deck declares one Image2 production family through the exact pair `production.pipeline: page-authority-image2-v1` and version state mode `image2-page-authority`. That state mode routes the protocol only; it does not decide every slide's pixels.

At source level, the deck has a default page authority, normally `framed-image2`, and each slide may explicitly override it to `pure-image2`. Every slide continues to carry structured `KICKER`, `TITLE`, and `SUBTITLE` where relevant. For Framed slides:

- `TITLE` is required.
- `KICKER` is optional.
- `SUBTITLE` is optional.
- `CALLOUT` is optional and is one structured text field, not prompt prose.
- the only v1 `FRAME PRESET` is compiler-owned `standard-v1`, with deterministic `callout_absent` / `callout_present` variants.
- an optional subject may be selected only as `VISUAL IDENTITY: <profile-id>/<role-id>`; absence means no Agent identity subject.

The absence of an optional field does not let slide-local layout drift. `frame-canvas-v1` fixes the logical canvas at `1000 x 562.5` CSS pixels and the final capture at `2000 x 1125`; `standard-v1` fixes exact normalized header/text/body/callout rectangles, field-to-rectangle mapping, line budgets, panel opacity, and shared-theme font/token resolution. Its preset, variant, and resolved theme/font profile are bound into both raw and final fingerprints. The old `1672 x 941` header-lock coordinates are migration evidence only, not vNext geometry. Before any style-master or page provider authorization, the same pinned HTML/font runtime that will compose the final frame proves the Text Frame fits its measured bounds.

## Rendering Contracts

### Pure Image2

Stage 1 compiles the full visual brief, structured display text, shared style system, and an optional identity reference into the Image2 contract. Image2 owns the final pixels. The raw image is the final slide after normal verification.

Changing a Pure title, kicker, subtitle, callout, or visual brief changes the raw Image2 contract. It therefore requires scoped authorization, regeneration, visual review, and final publication.

### Framed Image2

Stage 1 compiles two separate things:

1. a visual-only Image2 underlay contract, including the style master, optional identity reference, full-canvas composition, and the reserved frame geometry;
2. a typed local Text Frame contract containing the exact human-readable fields, frame preset, resolved theme, fonts, and geometry.

The Image2 prompt names the visual subject and composition but prohibits readable text of every kind. It requests visual breathing room for the frame panels; it must never repeat the title or callout words in model-owned form.

After Image2 returns a verified canonical `2000 x 1125` raw underlay, a local HTML compositor places it as the full 16:9 background and renders opaque header/callout panels with the Text Frame on top. An exact-16:9 provider result may only be uniformly normalized through a versioned profile; crop, letterbox, stretch, and body-strip fitting are forbidden. The compositor repeats font/geometry checks before capture, publishes one verified final PNG, and Stage 4 assembles only that PNG.

This is deliberately a frame compositor, not a renamed header-lock Canvas pass. It may reuse the pinned HTML runtime and final-slide artifact conventions, but it does not inherit HTML-first source/catalog/state ownership.

## Shared Style And Agent Identity

The Agent must be a durable, reusable deck asset rather than an accidental scratch image. The first promotion is:

```text
source: deck_ai_sdlc_keynote/3_versions/v1/_scratch/agent_reference_sheet.png
target: deck_ai_sdlc_keynote/2_backbone/visual-style/assets/reference/amber-agent-model-sheet.png
```

The target bytes are registered with SHA-256 and provenance. A separate Image2 reference registry, owned by the Image2 production family, resolves an opt-in profile such as `amber-agent` with controlled roles such as `guide`, `collaborating`, `working`, `orchestrating`, and `reviewing`. The existing HTML asset manifest remains an HTML catalog; it must not silently become a second source of Image2 identity authority.

The reference participates only in the raw Image2 projection, whether the page authority is Pure or Framed. It never changes the deterministic HTML frame, and it is not globally injected into every slide. A slide must ask for the Agent because its narrative needs a recurring partner, not because the deck happens to have a robot asset.

## Receipts, Fingerprints, And Refresh

Stage 1 publishes one current `page-composition` receipt that is the only authority-bearing input for provider work and local composition. It contains only source-known inputs, never a future raw-image or final PNG SHA. Stage 2 publishes a raw-images manifest whose entries preserve the raw contract digest and verified raw bytes/provenance. Stage 3 later publishes a separate final-slides manifest that binds the current Stage 1 receipt, an exact raw-evidence record, final PNG, and compositor evidence. A later Framed text-only receipt may reuse raw bytes only by exact raw-contract-digest match, never by filename, slide ID, or old receipt identity. Assembly, notes, and final review require both current source/final lineage and the resolved raw evidence. Convenience artifacts such as human-readable prompts and `slide_plan.json` may exist, but they cannot bypass or replace either authority.

Each slide has two separately meaningful fingerprints:

| Change | Pure Image2 | Framed Image2 |
|---|---|---|
| Kicker/title/subtitle/callout text | Rebuild raw Image2, then review | Recompose local frame only; no provider call |
| Visual brief / visual concept | Rebuild raw Image2 | Rebuild raw underlay, then recompose frame |
| Agent profile/reference bytes or role | Rebuild consuming raw Image2 slides | Rebuild consuming raw underlays, then recompose frames |
| Style master / visual language | Rebuild affected raw Image2 slides | Rebuild affected raw underlays, then recompose frames |
| Frame font/color/panel styling | N/A unless it belongs in the Pure prompt | Local recompose only |
| Reserved frame geometry / preset | N/A unless it belongs in the Pure prompt | Rebuild raw underlay because available visual space changed |
| Page-authority switch | Semantic/structural change; fresh review | Semantic/structural change; fresh review |
| Notes only | Stage 5 only | Stage 5 only |

For Framed slides, the raw-image fingerprint includes page authority, visual-only prompt, shared visual/identity projection, canonical canvas, and reserved frame geometry. It excludes text content. The final-frame fingerprint includes raw-image SHA plus the exact Text Frame contract, preflight fit evidence, and compositor evidence. For Pure slides, text belongs in the raw-image fingerprint because the provider owns it.

Provider authorization uses `authorize-image2 plan|record`, an exact selected raw-material fingerprint, plan hash, maximum count, execution binding, CAS record, and immediate transport guard. Raw visual acceptance is separately bound to a raw-review projection, profile, and raw-evidence digest. Local Framed text refreshes do not ask for authorization because they do not submit anything remotely, but they do stale final delivery evidence: compose -> local review projection -> PPTX -> notes -> new final-delivery decision. Final delivery is bound to the actual final review projection SHA/profile as well as the receipt, final manifest, PPTX, and notes. Any raw artifact, direct prompt path, arbitrary style path, or stale receipt must hard-stop before cache reuse, authorization, or provider transport.

## New Production Flow

```text
Canonical source + shared visual system + optional identity profile
                              |
                              v
             source/frame fit -> style bootstrap -> Stage 1 receipt
                    /                         \
                   /                           \
          pure-image2                     framed-image2
          raw contract                    underlay + frame contracts
              |                                      |
              v                                      v
        Stage 2 Image2                         Stage 2 Image2
        verified final raw                      verified full-canvas underlay
              |                                      |
              +------------------+-------------------+
                                 v
                    Stage 3: final manifest + local frame compositor
                      Pure: verify/pass through
                      Framed: HTML compose and verify
                                 |
                                 v
                     Stage 4 final-slide manifest -> PPTX -> final review
                                 |
                                 v
                           Stage 5 notes
```

The deep `framed_image2_compositor` module owns all complexity behind one small interface: verified raw underlay, receipt-resolved Text Frame, and resolved theme/frame evidence go in; one verified final-slide artifact and provenance go out. Callers do not know CSS, browser lifecycle, font loading, opaque-panel mechanics, or screenshot verification.

## Legacy Migration And v3 Pilot

This is a versioned adoption, not an automatic conversion.

1. Preserve existing v1/v2/v3 source, state, prompts, raw images, header-locked images, and PPTX as historical evidence. Do not mutate `_generated/` by hand.
2. Create a clean vNext target and explicitly author every slide's page authority and, when Framed, its frame contract. Stable `slide_id` may carry forward; legacy render-mode labels and generated images do not.
3. Use the existing production-mode transition's source-version scratch owner and sole `plan.json` preview envelope to produce an adoption matrix. Its nested Page Authority subrecord is covered by the exact outer preview hash. Each carry-forward stable ID has one explicit authority/frame/callout/identity/rewrite row, and candidate source/default expansion must match every row.
4. Confirm and atomically materialize the exact candidate into a clean vNext version with no provider call, then run provider-free source validation and local frame composition tests. A legacy prompt containing title/label/callout instructions cannot enter a Framed provider request.
5. Authorize a tightly scoped pilot only after the matrix and local artifacts are reviewed. The pilot must include at least one Framed content slide, one Pure carrier page, one Agent-bound page, and one Framed text-only refresh proving zero provider work.
6. Only then choose the full vNext rebuild scope through the normal gate and authorization process.

There is no rule such as “all old `full-page` becomes Pure” or “all old `body+header-lock` becomes Framed.” Both would hide ambiguity precisely where the new contract is supposed to be explicit.

The existing `html-first` / `html-then-image2` family is also not a Framed adapter. It remains an independently readable historical protocol with its own source, assets, review, authorization, and journal rules. This change deliberately does not decide its long-term product future; no new page-authority run can enter it, and no old HTML run can be reinterpreted as Framed without a separate versioned migration decision.

## Implementation Program

### 1. Establish the language and ownership model

- Add Page Authority, Pure Image2, Framed Image2, Text Frame, and Visual Underlay to `CONTEXT.md` and the framework vocabulary.
- Replace new-use references to the old three production modes and two legacy render modes with the vNext marker and per-slide authority model.
- Preserve historical readers and diagnostics; they must identify legacy protocol rather than infer a vNext mapping.

### 2. Build the Page Composition contract

- Define source validation for page-authority default/override, required Framed title, optional structured fields, fixed frame preset, and explicit identity binding.
- Compile authority-specific prompt projections and one atomic receipt.
- Keep the receipt as the only route into Image2 transport, frame composition, review, PPTX, notes, and reuse.
- Carry forward the old change's run-bound ingress fence, exact material authorization, bounded ordered reference projection, and receipt freshness checks.

### 3. Establish the Agent reference material

- Promote the approved v1 amber Agent sheet into backbone `assets/reference/` with checksum and origin.
- Implement the separate Image2 reference registry/profile resolver and one-reference-plus-style-master budget/capability check.
- Enforce semantic role compatibility and prevent the model sheet's labels, borders, or five-pose layout from being copied into a slide.

### 4. Replace header lock with frame composition

- Retire new-use `body+header-lock`, Canvas header overlay, and header-review assumptions.
- Implement the strict typed `framed_image2_compositor` on the pinned HTML runtime, including opaque panels, local fonts, bounds/overflow checks, no network, deterministic final PNG capture, and artifact provenance.
- Make Stage 4 consume only the unified final-slide manifest for both authorities.

### 5. Align refresh, review, and authorization

- Implement the raw/final fingerprint split and local-only Framed text refresh.
- Require provider reauthorization for exactly the raw scope that changed.
- Adapt contact sheets and review to show the final composed artifact, while retaining raw underlay evidence for diagnosis.
- Replace the old “header quality” review with frame/underlay contract evidence and standard visual review.

### 6. Ship vNext safely

- Add explicit transition preview and adoption-matrix tooling, never automatic source mutation.
- Add unit, integration, and E2E tests for mixed-authority decks, identity scope, prompt text exclusion, pixel geometry, refresh locality, receipt drift, transport capability, and historical hard-stops.
- Run the provider-free v3 migration preflight, then the narrowly authorized pilot described above.

## Review Gates Before Apply

The future OpenSpec change is Apply-ready only when all of these are true:

- The proposal, design, delta specs, and tasks all use the same two-authority vocabulary with no accidental `body+header-lock` equivalence.
- Source schema, receipt, artifact ownership, state routing, CLI diagnostics, and playbook instructions agree about which layer owns which pixels.
- Framed text-only changes demonstrably leave the raw Image2 contract and authorization material unchanged.
- Pure text changes demonstrably alter the raw Image2 contract.
- A Framed prompt cannot contain generated display text or readable-label directives after compilation.
- The compositor can prove Text Frame fit before authorization and again at final composition, including canonical canvas/profile, bundled font use, panel/underlay geometry, nonblank final pixels, and one final-slide artifact.
- Legacy source cannot silently enter vNext production; the exact adoption plan binds every stable ID to the materialized candidate and no preview/materialization step calls a provider.
- The identity asset is registered once in the backbone and is scoped only to selected Image2 raw renders.

## Artifact Disposition

| Existing work | Disposition |
|---|---|
| `_backlog/plans/legacy-whole-page-image2-contract-hardening.md` | Superseded historical investigation; it is not an active delivery plan. |
| `openspec/changes/harden-image2-identity-and-prompt-contracts/` | Superseded investigation record. It MUST NOT be applied because it would create competing legacy registry and receipt ownership. |
| New human plan | This file: `_backlog/plans/unify-image2-page-authority.md`. |
| New OpenSpec change | `openspec/changes/unify-image2-page-authority/`, with fresh proposal/design/spec/task contracts. |

## Deliberately Out Of Scope

- Reintroducing generic HTML-only or HTML-then-Image2 as first-class new output routes.
- Arbitrary slide-local CSS or hand-authored frame markup.
- Automatic OCR scoring or automatic retries after a provider call.
- Automatic conversion of historical v3 content or copying historical generated images into vNext authority.
- A globally mandatory Agent character on every page.

This keeps the system small: one shared visual system, two honest pixel owners, one current composition receipt, and a bounded migration path.
