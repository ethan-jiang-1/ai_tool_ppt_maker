# Plan: Page Image presentation schema recovery

> Type: investigation and schema design prerequisite | Updated: 2026-08-10

> Coordinated by [page-image-progressive-plan.md](page-image-progressive-plan.md).
> This work package owns the shared presentation schema and data-exposure
> contract; it does not own Framed provider-capability semantics.

## Why This Is Separate

This plan was split out of `framed-provider-protected-composition.md` during
Q8. The observed Framed collision needs protected-composition repair, but the
question of where a page's design class and its workflow projections live is
larger: it defines the human-facing control surface for every current Page
Image Workflow version.

No implementation is authorized by this plan. It first recovers a single,
inspectable definition of a page that can drive either selected version
workflow without turning one workflow's private renderer into the other's
configuration owner.

## Decision Ledger

This ledger separates confirmed design decisions from research findings and
unasked implementation choices. The original wording and answer for Q1 are
not preserved in the traceable record available to this plan; it is
intentionally not reconstructed from guesswork.

| Question | Status | Confirmed conclusion |
| --- | --- | --- |
| Q2 | settled | The current Work Version is the design boundary; other versions may learn but do not inherit its system automatically. |
| Q3 | settled | Human flexibility for opening, transition, and closing pages is source-authored Page Class selection, not a post-generation free-form layout override. |
| Q4 | settled | The initial closed Page Class set is `standard`, `opening`, `transition`, and `closing`. |
| Q5 | settled | `standard` is the default; every special class is explicit in source. |
| Q6 | settled | A Framed Header Profile owns its allowed kicker/title/subtitle set; a special class may be title-only. |
| Q7 | settled | A human may redirect a page only to an existing named class through source; that invalidates raw work and requires a new review. |
| Q8 | in this plan | Page-definition schema and profile-data ownership are a separate cross-workflow design problem; current Pure configuration cannot be repurposed. |
| Q9 | settled at principle | One version-level configuration system must resolve Page Class into strictly isolated Pure and Framed projections. Exact nesting and filename remain open. |
| Q10 | settled at principle | Before production, each page exposes the resolved configuration and its Image2 JSON; Framed also exposes its deterministic Header HTML. |
| Q11 | settled | These layers publish as independent, human-readable artifacts, with an index rather than one giant document. |
| Q12 | settled | A deck-level Control Map helps human and Agent understand purpose, adjustment scope, downstream controllers, and rebuild/review impact. |
| Q13 | settled | Page Class Profiles inherit Deck Baseline and declare only typed differences; the resolved view shows the inherited result. |

### Open Decisions That Must Not Be Assumed

- The exact nesting of the version-level configuration: class-first versus
  workflow-first, and its final filename/path.
- Exact closed fields in Deck Baseline and in each Pure/Framed class profile.
- Whether Framed publishes a structured Header Controller JSON beside its
  rendered Header HTML.
- Exact pre-production artifact paths, schemas, and whether absent/stale
  publication hard-stops authorization.
- Migration of current `pure-deck-visual-system.yaml` and code-only
  `FRAME PRESET` without silent adoption of old runs.

## Research Record

### What exists now

The current system is structured in parts, but it does not expose one complete
page-definition schema.

| Concern | Current owner | What a human must infer |
| --- | --- | --- |
| Exact header and provider-visible copy | per-slide `slide-specifications.md` | Framed additionally carries a `FRAME PRESET` field |
| Per-slide visual scene direction | `page-image-visual-language.yaml` | recipe, composition, motifs, and relationship IDs |
| Whole-deck Pure typography and zones | `pure-deck-visual-system.yaml` | Pure-only title/content zones and layout families |
| Framed header geometry and field treatment | code-only `standard-v1` overlay preset | no source record, no opening/transition/closing alternative |

The source parser is strict rather than free-form: `SLIDE BODY` and `VISUAL
BRIEF` are closed YAML structures, and unknown fields fail. But it has no
`PAGE CLASS`; Framed accepts only `FRAME PRESET: standard-v1`. The current v3
run confirms all three pages use that sole preset.

The data then flows as:

`slide-specifications.md` -> source receipt -> Page Image Core -> selected
Framed or Pure adapter -> raw contract, compiled provider input, binding, and
review.

Page Image Core currently retains provider content, workflow-specific header
policy, and visual language. It drops even existing `subject_restrictions`
before adapter compilation, which is independently responsible for the current
forbidden-subject defect. A Page Class placed only in Markdown would therefore
be non-authoritative: it must deliberately enter the receipt, Core semantic
facts, selected adapter contract, and invalidation binding.

### Why the existing YAML files are not a shortcut

`pure-deck-visual-system.yaml` is intentionally Pure-only. Its closed parser
allows only global typography, colour use, title/content zones, whitespace, and
layout families. Current specifications require this digest for Pure and
require `null` for Framed; tests explicitly prove Framed does not depend on the
file. Extending it with Framed Header Profiles would violate its defined
ownership, not merely rename a file.

`page-image-visual-language.yaml` is shared by both workflows, but deliberately
contains only content-neutral visual scene selection. Its validator rejects
typography and content-like clauses, and it has no version override path. It
is not the home for fixed header geometry, field presence, or page-wide layout
policy.

This split is traceable to two deliberate adjacent migrations on 2026-08-08:
the shared Page Image Core kept Header Rendering Policy workflow-specific; the
following Pure visual-system change explicitly kept Framed geometry out of
Pure. The migrations protected ownership boundaries, but they left no shared
model for the page's narrative/layout role.

Evidence examined: `01-content/internal/page_image_source.mjs`,
`shared/page-image/page_image_core.mjs`,
`02-visual-system/internal/pure_deck_visual_system.mjs`,
`02-visual-system/internal/page_image_visual_language.mjs`,
`03-framed-image/internal/header_overlay.mjs`, the current Visual Config and
Image Generation specifications, and the archived 2026-08-08 Framed-correction
and Pure-visual-system designs.

## Settled Constraints

1. A version chooses exactly one workflow, `framed` or `pure`; Page Class must
   never become a per-slide workflow override.
2. A Page Class is canonical and workflow-neutral. Its initial closed set is
   `standard`, `opening`, `transition`, and `closing`; omitted source means
   `standard`, while every non-standard class is explicit.
3. The human selects or redirects a page only to an existing named Page Class
   in canonical source. A redirect changes raw semantics and requires a raw
   rebuild and a new Complete Page Review.
4. Framed projects the selected class to one fixed Header Profile, including
   its Reserved Header Region and allowed kicker/title/subtitle fields. It
   cannot accept slide-authored coordinates, field lists, or review-time
   repositioning.
5. Pure consumes the same class as a whole-page visual-system fact. It gains
   no local overlay and must not inherit Framed header geometry.
6. The eventual design must let a human inspect one page's class and its
   resolved workflow projection without chasing configuration across unrelated
   files or reading implementation code.
7. Before production authorization, the system must expose the complete
   configuration chain for every page: canonical source -> Resolved Page
   Presentation -> Rendering Controller Projection. Pure exposes one Image2
   JSON controller projection; Framed exposes the provider's Image2 JSON and
   the deterministic local Header HTML controller projection. All projections
   bind the same source and selected presentation facts.
8. The Pre-Production Data View must expose every non-secret data value and
   transformation in that chain. It cannot reduce the chain to prose summaries,
   hidden compiler defaults, or digest-only references; credentials and other
   non-page secrets remain excluded.
9. The schema must balance adjustment scopes rather than force all work into
   either a deck-wide blob or per-page nudges: Deck Baseline controls shared
   rules, Page Class Profile controls a named class of pages, and Page Source
   controls exact content plus Page Class selection. Controller projections are
   results, never an editable fourth scope.
10. Every Page Class Profile inherits the Deck Baseline and declares only its
    typed differences. The resolved projection must expose inherited values so
    a human never has to reconstruct the merge mentally.

## Design Question Deferred From Q8

The remaining decision is not whether Page Class is needed; it is the safe
data topology for its supporting version-owned design system.

The current leading candidate is:

1. Add one closed per-slide `PAGE CLASS` source fact, normalized into the
   receipt and Page Image Core.
2. Add one new, version-resolved shared presentation-system source record under
   `visual-style/`, provisionally named
   `page-image-presentation-system.yaml`. It owns the class catalog and
   class-to-workflow projection selection, but no slide literals, provider
   prompts, lifecycle state, or generated evidence.
3. Keep concrete Framed and Pure profiles in their respective owned sections
   or records. Adapters receive an immutable selected projection plus digest,
   not an arbitrary configuration object.
4. Bind the selected per-slide projection digest into raw semantics and
   provider-input bindings. An edit to an unrelated class or profile must not
   stale the page; a selected class/profile change must force raw rebuild and
   review.

This is a candidate to test, not a settled implementation schema. A
class-first layout is shown only to make the decision concrete; a workflow-first
layout remains a valid alternative until the next grilling decision.

```yaml
schema: pptmaker-page-image-presentation-system-v1
revision: 1
default_page_class: standard
deck_baseline: ...
page_classes:
  standard:
    pure: ...
    framed: ...
  opening:
    pure: ...
    framed: ...
```

`pure` would contain only full-page provider typography/zones/families;
`framed` would contain only fixed header field policy, geometry, typography,
colour, and contrast. Class entries inherit `deck_baseline` and declare only
their typed differences. The parser would resolve one selected class/workflow
projection. Neither adapter would receive the sibling subtree. This remains a
recommendation to grill, not an implementation commitment; it must not
repurpose the current Pure record merely to avoid a new file.

### Required Pre-Production View

The configuration chain, rather than the origin of individual values, is the
human control surface. Before any provider authorization the system must make
every non-secret fact in these three layers inspectable for each selected page:

| Layer | Meaning | Required projection |
| --- | --- | --- |
| Canonical page source | content, visual selection, and explicit/normalized `PAGE CLASS` | source receipt with field-level provenance |
| Resolved Page Presentation | selected class and only the selected workflow profile | closed JSON configuration with selected-profile digest |
| Rendering Controller Projection | the exact input each renderer will receive | Pure: Image2 JSON; Framed: Image2 JSON plus deterministic Header HTML |

The controller projections are diagnostic inputs, not a second source of
authority or an approval state. Their job is to show why a page will render as
it will, and to make a malformed transformation fail before paid work. Their
schema must separately identify source/content facts, selected presentation
facts, and adapter-owned provider or local-renderer instructions.

The view must expose data rather than only describe it. Each published layer
therefore needs its normalized structured values, its schema identity, and its
binding to the preceding layer. A digest is a verifier beside the data, not a
substitute for showing the data.

Each page publishes each layer as an independent artifact in its own
pre-production directory. A deck-level index provides human navigation but
does not aggregate the layer data into one large opaque document. This keeps
source facts, resolved configuration, and each controller input separately
readable and locally comparable.

In addition, the view publishes one deck-level Presentation Control Map for
the Agent and human to orient before opening individual page files. It is a
derived, machine-readable overview of the selected workflow, class catalog,
class-to-page assignments, resolved-profile digests, downstream controller
artifacts, and change-impact links. It answers what each configuration layer
controls and where a change propagates, then points to the authoritative
per-page data. It must not duplicate editable configuration or become a second
source of truth.

The map must present configuration through its three Presentation Scopes, not
as a flat dump. A human or Agent should be able to answer all three questions
without reading source code: what changes every page, what changes every page
of this class, and what changes this one page. It should also show the precise
downstream controller projections and raw/review impact of each scope.

| Adjustment scope | Authoritative change | Intended reach |
| --- | --- | --- |
| Deck Baseline | shared version presentation tokens | every page in the version |
| Page Class Profile | `standard`, `opening`, `transition`, or `closing` profile | every page selecting that class |
| Page Source | content facts, visual selection, or an existing `PAGE CLASS` selection | one stable slide identity |
| Controller Projection | none; derived inspection only | exposes the exact resulting controller input |

### Existing Projection And Gap

Both current adapters already compile one immutable provider request per slide
before authorization. Each binds a raw contract, generation profile, and exact
compiled provider input. The shared runtime writes a provider-free
`provider-input-inspection-v1.json` after plan construction, so the proposed
Image2 JSON controller view can build on a real pre-submit object rather than
reconstructing a prompt from logs.

Framed can already derive a deterministic Header HTML document from its closed
header contract, but it currently does so only in memory for browser capture.
It has no durable, human-navigable pre-production HTML controller projection.
The existing provider inspection is also lifecycle/audit-shaped: it does not
put the source selection, Resolved Page Presentation, Image2 JSON, and Header
HTML beside one another for the same page.

The presentation-schema change must close that gap with one provider-free
derived view. It must be regenerated only from canonical source, selected
version configuration, and adapter compilers; it must never become an input,
selector, authorization, or review decision. Existing provider-input
inspection remains the exact byte/audit evidence rather than being replaced by
a friendlier display.

## Required Design Work

1. Define the exact external authoring view: source field spelling, default
   behavior, resolved-page inspection, controller projections, and the
   smallest files a human must read to understand one page.
2. Define a closed, version-resolved schema that distinguishes shared class
   taxonomy from workflow-specific profiles without allowing prompt prose or
   slide-local geometry to enter.
3. Specify the normalized receipt/Core facts and selected projection/digest
   shapes. Preserve version workflow homogeneity and content authority.
4. Enumerate invalidation semantics for class reassignment, selected-profile
   changes, unrelated profile changes, and workflow transitions.
5. Test the model against concrete pages: a standard content slide, an
   opening title-only Framed slide, a Pure transition page, and a closing page
   redirected by a human before regeneration.
6. Only after those decisions are accepted, create a dedicated OpenSpec change
   for parser/Core/Visual Config/adapter/binding changes. The Framed protected-
   composition plan can then consume the resulting Header Profile contract.

## Risks / Trade-offs

- **A universal layout object leaks Framed local renderer facts into Pure** ->
  retain workflow-specific projections and give Pure no local renderer.
- **A shared catalog becomes another free-form provider prompt route** -> use
  closed identifiers, enums, normalized geometry, and no source literals.
- **A class field is parsed but has no lifecycle effect** -> require it in
  Core semantics, raw contracts, compiled input/bindings, and invalidation.
- **Profile edits invalidate the entire deck unnecessarily** -> bind selected
  class/profile projections per slide rather than only a whole-file digest.
- **The human still has to reverse-engineer configuration** -> make resolved
  page class and workflow projection an explicit provider-free inspection
  output, not an implementation-only detail.

## Landing Association

This is a prerequisite design plan, not an active OpenSpec change. It closes
only when its schema topology and external control surface have been grilled,
documented, and accepted. Its result will become a dedicated OpenSpec proposal;
`framed-provider-protected-composition.md` remains blocked from defining Header
Profile storage until then.
