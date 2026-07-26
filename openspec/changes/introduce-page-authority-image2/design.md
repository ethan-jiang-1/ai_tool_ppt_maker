## Context

The current production families own pixels by route (`html-only`, `html-then-image2`, or
`image2-only`) rather than by slide. Whole-page Image2 and header-lock can both claim visible text,
while HTML state, review artifacts, and generated directories provide parallel authority. This change
introduces a clean production protocol for newly initialized decks without making an existing deck
silently switch, migrate, or lose its current execution route.

The MD Controller continues to own intent, visual judgment, and human review. JS/CLI owns parsing,
deterministic compilation, state, provider authorization, artifact verification, and diagnostics.
`bundle_layout.mjs`, the owning capability specifications, and the canonical source/state records
remain the respective sources of record; this design creates no second playbook or path registry.

## Goals / Non-Goals

**Goals:**

- Give every new slide exactly one final-pixel authority: `pure-image2` or `framed-image2`.
- Preserve Image2 as the visual author while making Framed kicker/title/subtitle/callout placement
  deterministic, tested, and locally refreshable.
- Make source visual language and Agent references closed, reviewable, checksum-bound inputs rather
  than free prompt/asset ingress.
- Bind raw evidence, human raw review, final composition, PPTX, and notes into one lineage.
- Keep provider work explicit, exact-scope, and last-mile; keep preview, local composition, review,
  assembly, and notes provider-free.

**Non-Goals:**

- Legacy inspection/adoption, automatic content conversion, or removal of legacy production routes.
- A third render mode, a public compositor interface, arbitrary CSS/HTML, direct provider prompt/style
  arguments, or a visual-slot path for Page Authority decks.
- Local deterministic body charts/tables/labels. In v1, Framed local pixels are only the fixed Text
  Frame; all visual body expression remains Image2-owned and text-free.
- OCR-based automatic approval, provider retry policy, additional frame presets, or additional identity
  taxonomies.

## Decisions

### 1. A new source/state pair selects one production adapter

New init writes `production.pipeline: page-authority-image2-v1` and authoritative version state
`production_mode: image2-page-authority`. The source default and an optional slide-level override
resolve only `pure-image2` or `framed-image2`; each resolved receipt records the result by stable
`slide_id`. Parsing rejects legacy render fields and free `IMAGE PROMPT` for this new marker.

The Page Authority resolver reads only the canonical source and state pair. It accepts the exact new
pair or reports a source/state repair diagnostic; it never infers a route from metadata or generated
files. Existing markers retain their existing dispatch during Change 1. Change 2 will replace that
interim compatibility dispatch with the bounded observer and adoption-only diagnostic. This avoids an
outage while also preventing any Page Authority source from falling back into a legacy adapter.

### 2. Authority determines final pixels, not deck mode

`pure-image2` sends the allowed structured display fields to Image2 and publishes verified raw bytes
through the finalizer. `framed-image2` sends no visible Frame text to Image2. It generates a text-free
full-canvas underlay, then the private compositor captures the fixed `standard-v1` Text Frame over it.
The frame has no caller CSS, geometry, font, color, capture option, or HTML input. `TITLE` is required;
kicker, subtitle, and callout are optional.

Authority selection is an Agent-owned semantic judgment, never an OCR or parser inference. A slide whose
meaning requires readable body labels, data values, quotations, captions, timeline dates, or diagram
text MUST be authored as `pure-image2` in v1. `framed-image2` is for a text-free visual body with the
message carried by its local Text Frame. This is still two page authorities, not a third body-rendering
route; it makes the tradeoff visible before provider authorization.

`finalizePage(receipt, verifiedRaw, verifiedEvidence)` is the sole external Interface for final-slide
publication. Its implementation can dispatch to Pure pass-through or the private Framed compositor,
but callers cannot select another finalization path. This creates one test seam and removes the
historical competition between provider text, header lock, and HTML delivery.

### 3. Visual intent is a closed source selection, not prompt prose

`VISUAL BRIEF` is a typed selection of registered recipe, composition, motifs, and negative
constraints. The `visual-config` module owns the only registry at
`2_backbone/visual-style/page-authority-visual-language.yaml`; version overrides, generated copies,
asset-manifest routing, and CLI prompt/style/output overrides are rejected. Registry clauses use the
deterministic `page-authority-text-guard-v1` grammar and are selected in canonical order.

This gives a slide a controlled visual scene vocabulary without creating a local body renderer. The
registry, not one-off source prose, evolves when a new narrative visual pattern is needed. Framed
compilation requires `no-readable-text` and `no-labels`; the compiler additionally proves that no Text
Frame literal reaches a provider payload. Pure may own structured display text and cannot combine it
with contradictory no-text constraints.

### 4. Agent identity is reference doctrine with one provider-safe derivative

The Amber Agent five-pose model sheet is promoted from
`deck_ai_sdlc_keynote/3_versions/v1/_scratch/agent_reference_sheet.png`
(`f71a7ed8ec8f69e10ffbe2997e81f123d46515b5608de61afc155d6b3ed6c756`) into
`deck_ai_sdlc_keynote/2_backbone/visual-style/assets/reference/amber-agent/model-sheet.png` as
human-reviewed visual doctrine. It never becomes a provider reference. `visual-asset-management`
resolves only a registered, single-pose, label-free role derivative with an expected SHA-256 and a
text-guarded role clause. A selected identity requires exactly one identity subject and is included in
the raw image contract; the physical asset path is not part of the contract digest.

### 5. Evidence has separate source and provider identities

Every raw item has the exact identity
`{slide_id, raw_sha256, raw_image_contract_digest, raw_generation_profile_digest}`. The image contract
contains source-owned visual semantics: authority, selected registry projection, visual-system facts,
identity reference bytes, canvas/reserved geometry, and Pure-only display fields. The generation
profile contains provider/model/output/reference-transport facts and the generated style-master byte
profile. Both must match for reuse and raw-review freshness.

The state owner advances `source_epoch` only when raw-source authority changes. A provider-profile
change invalidates raw reuse/review but does not advance that epoch. Stage 3 consumes only a current
human `proceed` record covering the exact raw tuple. Its final manifest, projection, PPTX, and notes
receipts are then derived in order. A changed Framed Text Frame can retain raw coverage only when all
raw and review identity facts remain exact; it still creates new final/delivery evidence.

### 6. Runtime and readiness are operation-scoped

The private Framed compositor reuses only protocol-neutral browser primitives: fixed canvas, bundled
fonts, zero network, opaque panel capture, bounds checks, PNG verification, and cleanup. It cannot
read HTML slide source, legacy manifests, or legacy review artifacts.

`doctor --mode image2-page-authority` reports distinct offline `framed-runtime` and `image2-raw`
profiles. A run-bound operation selects only the needed profiles: local Framed refresh needs no
provider credential; raw generation needs `image2-raw` and Framed preflight when applicable. A live
probe remains explicit. Invalid source/state, missing authority, missing raw acceptance, or unauthorized
provider work are hard-stops with one owner-issued recovery action; semantic raw and delivery review
remain human decisions.

### 7. Artifact ownership is explicit and rebuildable

`run-bundle-layout` declares Page Authority receipts, raw evidence, review coverage, final manifest,
and final projection under the canonical version leaf. `_generated/` remains derived and removable.
State owns mode, source epoch, authorization, and evidence references; it does not copy provider
payloads or create an alternate ledger. Assembly and notes consume the one final manifest, never a
legacy output directory or a per-branch final image.

## Risks / Trade-offs

- **Image2 may hallucinate text in a Framed underlay** -> The source language is text-guarded,
  Framed requests require no-text constraints, raw review sees a non-publishing safe-zone guide, and
  unaccepted raw evidence cannot reach finalization.
- **A registry becomes too restrictive for a specific slide** -> Add a reviewed registry entry rather
  than reopening arbitrary prompt prose. This trades immediate flexibility for repeatability and clear
  ownership.
- **A new protocol can strand old decks** -> Change 1 leaves their existing dispatch intact; Change 2
  supplies and verifies adoption before normal legacy execution is fenced.
- **A local frame can become a second renderer** -> Its sole external seam is the finalizer, one fixed
  preset is accepted, and it consumes only verified underlay/frame evidence.
- **Evidence proliferation can create duplicate truth** -> State remains the owner of durable facts;
  manifests and projections are receipt-bound derived artifacts. The finalizer checks the direct
  prerequisites rather than trusting a parallel gate.

## Migration Plan

1. Implement and test the Page Authority path alongside existing production families.
2. Change fresh initialization and corresponding Controller/command guidance to the new marker and
   default `framed-image2`; retain existing deck behavior behind its current marker during this change.
3. Require new runs to pass source/state consistency, raw review, final projection, assembly, and notes
   evidence before delivery.
4. Run focused unit/integration tests for parsing, registry/reference confinement, evidence identity,
   finalization, state/CLI diagnostics, layout, and readiness; add one mixed Pure/Framed E2E journey.
5. Record a clean/classified baseline before completion. Change 2 introduces the legacy observer and
   adoption transaction; Change 3 removes the old execution surface.

Rollback is release-level: an already published Page Authority version is not downgraded in place. A
failed new run is repaired or recreated through its canonical source/state path; derived artifacts are
rebuildable and never manually edited.

## Open Questions

- None for Change 1. Agent selection between the two stated authorities is explicit: readable body text
  requires Pure, while Framed remains text-free below the local Text Frame. Broader deterministic body
  composition, new frame presets, and automatic legacy conversion are deferred rather than left as
  implementation discretion.
