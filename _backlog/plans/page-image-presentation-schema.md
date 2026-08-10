# Plan: Page Image presentation schema recovery

> Type: settled schema design prerequisite | Updated: 2026-08-10

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
| Q8 | settled | Page-definition schema and profile-data ownership are a separate cross-workflow design problem; current Pure configuration cannot be repurposed. The selected design is the fixed `page-image-presentation/` package described below. |
| Q9 | settled | One version-level configuration system resolves Page Class into strictly isolated Pure and Framed projections through four fixed source documents, not one cross-workflow YAML. |
| Q10 | settled | Before production, each page exposes source, resolved configuration, and a structured Image2 controller; Framed also exposes its exact deterministic Header HTML. A duplicate Header Controller JSON is not introduced. |
| Q11 | settled | These layers publish as independent, human-readable artifacts, with an index rather than one giant document. |
| Q12 | settled | A deck-level Control Map helps human and Agent understand purpose, adjustment scope, downstream controllers, and rebuild/review impact. |
| Q13 | settled | Page Class Profiles inherit Deck Baseline and declare only typed differences; the resolved view shows the inherited result. |

### Design Decisions Reached From Q2-Q13

- The class-first package below is accepted. It gives a human one small class
  catalog to inspect first while retaining separate, typed Pure and Framed
  profile sources. It avoids both the one-giant-file problem and one workflow
  becoming the other workflow's configuration owner.
- The initial v1 fields, inheritance, profile restrictions, controller
  projections, and paths are closed in this plan. A missing or stale derived
  view is rebuilt by `image2 plan` or reported as a planning failure; it never
  becomes a second approval or authorization state.
- Framed publishes Header HTML only. `resolved-presentation.json` already
  carries the structured Header Profile and `framed-header.html` is the exact
  deterministic local controller. A sibling JSON copy would add a shallow,
  duplicate controller with no additional decision value.
- The old Pure visual-system source and code-only `FRAME PRESET` are retired
  only through the explicit current-v3-to-v4 migration defined below. v3 stays
  byte-preserved; historical v2 or otherwise unsupported source/state pairs
  remain `unsupported-protocol/export` inputs rather than candidates for
  inferred adoption.

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
7. At the pre-submit `image2 plan` point, the system must expose the complete
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

## Accepted Q8 Topology

The remaining decision is not whether Page Class is needed; it is how to make
the version-owned design system both human-readable and safely isolated by
workflow. The original single-file candidate is no longer the leading shape:
it would make a human reconstruct too much unrelated configuration in one
place, which conflicts with the stated requirement for independently
inspectable configuration.

The recommendation is class-first at the human control surface, with a fixed
small package of renderer-isolated configuration documents rather than one
large cross-workflow YAML:

1. Add one closed per-slide `PAGE CLASS` source fact, normalized into the
   receipt and Page Image Core.
2. Add one fixed version-resolved package under
   `visual-style/page-image-presentation/`: `page-classes.yaml`,
   `deck-baseline.yaml`, `pure-profiles.yaml`, and
   `framed-header-profiles.yaml`. These are fixed owned filenames, not
   user-configurable imports or paths. Each resolves through ordinary
   override-first/backbone-default selection, and the resolver validates the
   complete selected package before it emits one immutable presentation
   snapshot.
3. Let `page-classes.yaml` own only the closed class catalog and the mapping
   from one Page Class to one Pure profile identifier and one Framed Header
   Profile identifier. Keep concrete Pure and Framed profile facts in their
   respective files. Adapters receive an immutable selected projection plus
   digest, not an arbitrary configuration object or the sibling subtree.
4. Bind the selected per-slide projection digest into raw semantics and
   provider-input bindings. An edit to an unrelated class or profile must not
   stale the page; a selected class/profile change must force raw rebuild and
   review.

| Document | Owns | Must not contain |
| --- | --- | --- |
| `page-classes.yaml` | Closed class catalog, `standard` default, and class-to-profile identifiers | slide literals, geometry, provider prose, lifecycle facts |
| `deck-baseline.yaml` | Workflow-neutral typography, colour-role, and density tokens inherited by all classes | per-slide facts, renderer geometry, raw prompts |
| `pure-profiles.yaml` | Pure-only full-page layout/treatment deltas selected by a Page Class | Framed Header Profiles or local-renderer facts |
| `framed-header-profiles.yaml` | Framed-only allowed header fields, Reserved Header Region, local typography, colour, spacing, and contrast | Pure zones, provider prose, slide-local overrides |

The small class catalog is the primary human entry point. It maps each
canonical class to exactly one Pure profile identifier and exactly one Framed
Header Profile identifier; those identifiers select closed profile definitions
from their respective files. The resolver returns only the active workflow's
projection, so a Pure adapter never receives Framed geometry and a Framed
adapter never receives Pure layout facts.

```yaml
# page-classes.yaml (proposed shape)
schema: pptmaker-page-image-class-catalog-v1
revision: 1
default_page_class: standard
classes:
  standard:
    pure_profile: standard
    framed_header_profile: standard
  opening:
    pure_profile: opening
    framed_header_profile: opening
  transition:
    pure_profile: transition
    framed_header_profile: transition
  closing:
    pure_profile: closing
    framed_header_profile: closing
```

`deck-baseline.yaml` supplies only shared named tokens. Each selected profile
inherits those tokens and declares its typed difference: a Pure profile can
change provider-owned layout treatment, while a Framed Header Profile can
change its fixed field set and Reserved Header Region. The closed fields are
defined below; no field may create a slide-local coordinate or a free-form
prompt escape hatch.

The source-facing counterpart is one closed field:

```markdown
**PAGE CLASS**: opening
```

Omission normalizes to `standard`; any non-standard value is explicit. In the
target schema `FRAME PRESET` is not another source control. The resolver derives
Framed Header Rendering Policy from the selected Page Class and Header Profile,
then binds the resulting selected projection into Core, raw contract,
compiled-provider-input binding, and invalidation.

```text
Page Source + selected package
          |
          v
Source Receipt (page class + provenance)
          |
          v
Resolved Page Presentation (one workflow projection)
          |
          v
Page Image Core -> selected adapter controller(s) -> raw-plan binding
```

This is the accepted design for the implementation change. Its fixed package
prevents the declaration of a path or filename from becoming yet another
per-deck configuration decision. The resolver reads every selected document,
validates them as one package, and returns only the caller's selected workflow
projection. It does not expose a mutable universal configuration object.

### Closed Source Package And Inheritance

Each document is a direct, alias-free YAML mapping with exact keys and
`revision: 1`. The four fixed files resolve independently through normal
override-first / backbone-default selection, then form one validated package
digest. A version may override one document, but a malformed, missing, or
cross-file-inconsistent selected document prevents planning; the resolver never
falls back to an earlier generated projection.

```text
2_backbone/visual-style/page-image-presentation/
  page-classes.yaml
  deck-baseline.yaml
  pure-profiles.yaml
  framed-header-profiles.yaml

3_versions/vN/overrides/visual-style/page-image-presentation/
  (optional same-name source overrides)
```

`page-classes.yaml` is exactly `schema`, `revision`,
`default_page_class`, and `classes`. Its class keys are exactly `standard`,
`opening`, `transition`, and `closing`; each class maps exactly to
`pure_profile` and `framed_header_profile`. `default_page_class` is exactly
`standard`, and every referenced profile ID must resolve in the corresponding
workflow document.

`deck-baseline.yaml` is exactly `schema`, `revision`,
`provider_typography`, `provider_colour_use`, and `provider_density`. It owns
the content-neutral provider-wide facts common to both selected workflows:

```yaml
provider_typography:
  voices: { display: editorial-serif, text: editorial-sans }
  hierarchy:
    kicker: eyebrow
    title: display
    subtitle: supporting
    body: body
    label: label
    metric: metric
    diagram_text: diagram
    quote: quote
    callout: callout
    supporting_copy: supporting
provider_colour_use:
  palette_source: style-master
  roles:
    primary_text: primary
    secondary_text: secondary
    accent: accent
    surface: neutral
provider_density: generous
```

These use the existing closed enum sets. A resolved projection includes the
entire baseline; both adapters compile its provider-facing facts, so a baseline
change is a real Deck Baseline change rather than decorative unused metadata.

`pure-profiles.yaml` is exactly `schema`, `revision`, and `profiles`. Each
profile is exactly `title_zone`, `content_zone`, and `layout_families`.
Both zones are normalized non-overlapping rectangles and each family is one of
the existing closed Pure layout families. The selected Pure profile inherits
all baseline provider typography, colour, and density facts; it contributes
only its class-specific full-page treatment.

`framed-header-profiles.yaml` is exactly `schema`, `revision`, and `profiles`.
Each Header Profile is exactly `allowed_fields`, `required_fields`, `canvas`,
`reserved_header_region`, `font_families`, `theme`, and `fields`:

- `allowed_fields` is a non-empty ordered subset of `kicker`, `title`, and
  `subtitle`; `required_fields` is an ordered subset of it and always includes
  `title`.
- `canvas` fixes CSS and capture dimensions; `reserved_header_region` and each
  field rectangle use normalized `x`, `y`, `width`, and `height` values in
  that canvas. The Header compiler converts only at its local renderer edge.
- `font_families`, `theme` (three six-digit colours plus the existing bounded
  text-shadow contrast), and each allowed field's `font_size_css_px`,
  `line_height_css_px`, `weight`, and `max_lines` define the fixed local
  treatment. `fields` contains exactly the allowed field keys and no source
  literals, body fields, or provider instruction.

The standard profile therefore fixes the same kicker/title/subtitle regions,
sizes, fonts, colours, and contrast for all `standard` Framed pages. An
`opening` profile may allow and require only `title`; it is a named alternate
Header Profile, not a per-slide adjustment. The profile's Reserved Header
Region is the source fact from which later Framed work derives a normalized
Provider Avoidance Constraint and Body-Safe Region; neither is authored in a
slide.

The source parser accepts one optional `**PAGE CLASS**` field. Omission
normalizes to `standard`; only `opening`, `transition`, and `closing` may be
explicitly authored. An explicit `standard`, an unknown value, a duplicate, or
a field in the wrong workflow/source protocol is a source repair. For Framed,
the resolved Header Profile validates that every supplied header literal is
allowed and that each required field is non-empty. `FRAME PRESET` is forbidden
in a migrated source: Page Class is the only source selection for local header
treatment.

The resolver is the deep module at this seam:

```text
resolvePageImagePresentation({ runDir, sourceReceipt })
  -> { package, slides: [{ slide_id, page_class, selected_projection,
                          selected_presentation_sha256 }] }
```

It owns source-package selection, cross-file validation, default normalization,
baseline/profile inheritance, selected projection construction, and digests.
The parser owns source grammar, Core owns semantic binding, adapters own their
renderer controller compilation, and the data-view writer only publishes
already-bound results. No adapter accepts the full package or reaches across
the resolver seam to read sibling-workflow configuration.

### Required Pre-Production View

The configuration chain, rather than the origin of individual values, is the
human control surface. At the existing pre-submit `image2 plan` point, before
any provider submission, the system must make
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

Each page publishes each layer as an independent artifact in its own dedicated,
non-navigation pre-production directory. A deck-level index provides direct
paths but does not aggregate the layer data into one large opaque document.
This keeps source facts, resolved configuration, and each controller input
separately readable and locally comparable. `artifact-view` may add safe links
or summaries, but it does not create these artifacts or copy raw Image2 prompt
prose into Human Navigation.

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

### Accepted Pre-Production Data Layout

The view should publish from `image2 plan` into one derived root that is not a
Human Navigation Path and is never read as a lifecycle input:

```text
_generated/page_image_workflow/pre-production-data/
  presentation-control-map.json
  slides/<slide_id>/
    source-receipt.json
    resolved-presentation.json
    image2-controller.json
    framed-header.html                 # Framed only
```

Each file is independently readable. `source-receipt.json` is the exact
per-slide receipt slice with field-level Page Class provenance;
`resolved-presentation.json` has schema
`pptmaker-resolved-page-presentation-v1`, the source/package bindings, the
full inherited Deck Baseline, exactly one selected workflow profile, and its
`selected_presentation_sha256`; `image2-controller.json` has schema
`pptmaker-image2-controller-v1`, the structured non-secret adapter controller
object, its selected-presentation binding, and the digest of the exact compiled
provider input. `framed-header.html` is the exact deterministic local
controller projection with no provider raster underlay. The separate existing
provider-input inspection remains the exact byte/audit sidecar; it is not
copied into Human Navigation.

The Control Map is an index, not a configuration dump. It identifies the
selected workflow, source package snapshot, Page Class assignments, affected
slides for each scope, per-page artifact paths, and the resulting raw/review
impact. Every published artifact carries the same source receipt and selected
presentation binding so a stale or missing data view can be rebuilt by
`image2 plan` without becoming an authorization gate.

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

The presentation-schema change must close that gap with one non-secret,
derived view, published by `image2 plan`. It must be regenerated only from
canonical source, selected version configuration, and adapter compilers; it
must never become an input, selector, authorization, or review decision.
Existing provider-input inspection remains the exact byte/audit evidence rather
than being replaced by a friendlier display. The new per-page Image2 controller
projection is directly inspectable outside Human Navigation; it is not a
wholesale navigation copy of raw prompt prose.

### Accepted Current-v3 Migration Direction

The repository's existing `--new-version` operation copies only
`slide-specifications.md` and `overrides/`, while it deliberately resets
`_generated/`. The accepted recovery route is therefore `v3 -> v4`: v3 remains
byte-preserved production evidence, while v4 receives a new canonical source
snapshot and the presentation package before any new raw plan is built.

This keeps the focus on the current v3 content without pretending the broken
v3 source/state pair already speaks the new schema. The explicit migration is
an owner-issued, provider-free operation with these rules:

1. It starts only from the exact current v3 Framed source under the normal
   `new-version` successor path; it never scans or adopts a sibling version.
2. It preserves v3 source, state, receipts, review records, and `_generated/`
   bytes. v4 receives no raw evidence, grant, review decision, or final media.
3. It writes the fixed presentation package and updates only v4 canonical
   source: remove `FRAME PRESET`; retain header/body/visual literals exactly;
   normalize omitted Page Class as `standard`. The observed v3 pages `DkfGo`,
   `TwoMet`, and `PlatGo` all become `standard`, so the migration makes no
   content or special-class judgment.
4. Its first v4 `image2 plan` resolves the new package and writes the first
   source receipt, selected presentations, controller projections, and raw
   bindings. The old pair is never parsed as if it already contained them.

Historical v2 and any non-exact/unresolved source-state pair do not enter this
route. They retain the existing `unsupported-protocol/export` result.

## Design Evidence Complete

- [x] Define the external authoring view: optional `PAGE CLASS`, default
  normalization, the four fixed presentation files, per-page projections, and
  the smallest inspection path for one page.
- [x] Define a closed, version-resolved schema that keeps the shared class
  taxonomy separate from Pure full-page treatment and Framed local-header
  treatment, without admitting prompt prose or slide-local geometry.
- [x] Specify receipt/Core facts and selected-presentation digest boundaries:
  receipt preserves Page Class provenance; Core and raw semantics bind only the
  selected workflow projection and digest; adapter input carries no sibling
  configuration subtree.
- [x] Set invalidation semantics: a Page Class reassignment, Deck Baseline
  edit, or selected profile edit changes selected presentation and requires raw
  rebuild plus Complete Page Review; an unselected class/profile edit does not
  invalidate the page; a workflow transition resolves a fresh selected
  projection and never reuses an old raw contract.
- [x] Walk the model through the required examples. A standard Framed content
  page selects `standard`; an opening Framed page selects the named title-only
  profile; a Pure transition receives only its Pure profile; a human redirect
  to `closing` changes only the page source selector and invalidates that page.
- [x] Define the owner-issued v3-to-v4 source/configuration migration and
  prove it matches the actual current v3 source: all three observed slides
  normalize to `standard`, so no content or special-class assumption is hidden
  in migration.
- [x] Split the future implementation change into bound presentation semantics
  first and Pre-Production Data View publication by `image2 plan` second. The
  Framed hardening change consumes the landed Header Profile rather than
  creating a private substitute.

### Guided Checkpoint A: Ready To Propose

The schema has one fixed topology, closed source/configuration fields, one
clear resolver seam, defined controller artifacts, selected-only invalidation,
and a non-destructive path for the current v3 content. It is ready for a
dedicated OpenSpec implementation proposal. No new human authorization is
needed for that provider-free repository-maintenance work; the later synthetic
provider probe and v3 repair remain in their explicitly later phases.

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

This prerequisite design plan is now settled. Its result is the immediate
input to a dedicated OpenSpec proposal for the shared presentation resolver and
Pre-Production Data View. `framed-provider-protected-composition.md` remains
blocked from defining protected-composition semantics until that implementation
lands and Phase 3 selects an evidence-backed provider path.
