## Context

The selected source of authority is root `AGENTS.md` plus the owner's explicit
V2-only decision. Current implementation, tests, guidance, and accepted specs
still describe another protocol as current. That is an implementation and
contract migration, not a reason to retain two active paths.

The Page Presentation System concepts and fixed source files are settled in
`CONTEXT.md`. The protocol activation and presentation work share one critical
boundary: no receipt, State, raw plan, controller, review, or finalization may
be created until marker-first V2 identity and the selected presentation are
both valid.

## Goals / Non-Goals

**Goals:**

- Leave one current Page Image graph:
  `03-framed-image XOR 04-pure-image -> 05-delivery -> 06-iteration`, bound to
  `page-authority-image2-v2` / `image2-page-authority-v2`.
- Delete every active obsolete protocol writer, reader, import, controller
  route, document reference, fixture, and test; prove no active route can
  select or reintroduce it.
- Resolve a V2 slide's closed Page Class package before receipt materialization
  and expose only that slide's selected workflow projection to downstream code.
- Publish an atomic, provider-free, non-authoritative Pre-Production Data View
  from already validated V2 plan facts.

**Non-Goals:**

- Do not decode, migrate, scan, rewrite, or create a compatibility command for
  non-V2 production data.
- Do not create a hybrid workflow, a slide-level workflow choice, local body
  renderer, local geometry override, second Header Controller JSON, or second
  human review decision.
- Do not make the Data View an input, selector, authorization record, durable
  State record, Human Navigation prompt copy, or review artifact.
- Do not promise that a Framed Header Profile makes the provider avoid its
  Reserved Header Region; Complete Page Review remains the visual decision.

## Decisions

### 1. One marker-first V2 evaluator is the protocol boundary

JS owns one direct evaluator over canonical source and State. It recognizes
only the exact V2 pair and selected `framed|pure` workflow. Every other
combination returns the existing `unsupported-protocol/export` hard-stop before
receipt, generated-artifact, State, provider, or controller work. This removes
rather than translates a competing graph.

New initialization and structural versioning use V2. A V2 structural successor
starts fresh at source epoch one and never inherits authorization, raw review,
delivery acceptance, or generated evidence. The change does not mutate an
existing production bundle to reach V2.

MD/Agent asks the human only for the one semantic workflow choice and new
content/design decisions. JS owns deterministic parsing and the producer-side
diagnostic; MD consumes it without reconstructing a protocol route.

### 2. The presentation resolver is the only source-package seam

`visual-style/page-image-presentation/` contains exactly:

```text
page-classes.yaml
deck-baseline.yaml
pure-profiles.yaml
framed-header-profiles.yaml
```

Each file uses normal override-first/backbone selection. A deep Visual Config
module validates the four direct, alias-free YAML documents as one package,
performs class-to-profile resolution and inheritance, and returns source and
selected-presentation digests. Callers receive no arbitrary path, whole-package
tree, merge rule, or sibling-workflow projection.

`PAGE CLASS` is source-owned narrative intent, not geometry. The parser records
only the normalized class and explicit/defaulted provenance in a candidate V2
receipt. The resolver then combines it with the version workflow. A Pure
projection contains only provider-owned zones/layout families; a Framed
projection contains only the Header Profile's permitted fields, normalized
geometry, typography, and Reserved Header Region.

### 3. V2 publication starts only after complete deterministic validation

The receipt remains a candidate until the resolver and selected adapter have
validated it. The Page Image Core receives receipt plus selected presentation;
adapters receive only their selected Core slide. The selected digest binds raw
contracts, compiled provider input, grants, attempts, review, final evidence,
and invalidation. A class, baseline, or selected-profile edit rebuilds raw;
an unselected profile does not stale unrelated work.

```text
canonical V2 Page Source
  -> candidate receipt (class provenance)
  -> presentation resolver (selected projection)
  -> Page Image Core (selected digest)
  -> selected adapter (controller + compiled bytes)
  -> existing V2 plan/evidence lineage
```

Malformed identity, package, class, or selected profile is a `hard-stop` that
protects source-to-controller provenance. Its one legal recovery is repair of
the named direct source/configuration followed by the same `image2 plan`
checkpoint. It neither writes State nor initiates provider work.

### 4. Controller projections are compiled once, then materialized as views

Each adapter first compiles a canonical non-secret controller object, then
derives the existing exact UTF-8 Compiled Provider Input. Framed also derives
deterministic `framed-header.html` through its overlay-contract path without an
underlay raster. The exact provider bytes remain the existing audit artifact;
the controller is never reconstructed by parsing a prompt.

After immutable adapter outputs exist, `image2 plan` calls a provider-free
writer. It validates matching receipt, presentation, plan/binding, and
controller facts for every selected slide, then atomically replaces only:

```text
_generated/page_image_workflow/pre-production-data/
  presentation-control-map.json
  slides/<slide_id>/
    source-receipt.json
    resolved-presentation.json
    image2-controller.json
    framed-header.html
```

The writer does not read or write State, grants, review records, navigation,
or provider interfaces. A missing or stale view is a `guide`: rerunning the
same provider-free plan rebuilds it. `image2 plan` retains its existing V2
source, Task Mandate, and immutable-plan publication behavior.

### 5. Controls remain short and owner-issued

This design applies `human-centered-gates.md`,
`agent-assistance-and-control.md`, and `simple-reliable-control.md` as follows:

- Non-V2 identity and invalid source/package are `hard-stop`; their protected
  invariants are identity, byte preservation, and source-to-controller binding.
  No waiver, fallback, or forced continuation exists.
- A missing/stale Data View is a `guide` with the sole action `image2 plan`.
- Provider authorization and Complete Page Review remain the existing
  owner-recorded `confirm` decisions. The new system does not add one.

## Initial Profile Content

The initial V2 package is intentionally conservative: it preserves the only
existing Pure baseline and Framed overlay treatment instead of inventing a new
visual language during protocol activation. It declares this closed mapping:

| Page Class | Pure Profile | Framed Header Profile |
| --- | --- | --- |
| `standard` | `baseline` | `standard` |
| `opening` | `baseline` | `opening-title-only` |
| `transition` | `baseline` | `standard` |
| `closing` | `baseline` | `standard` |

`baseline` carries the existing Pure title zone
`{ x: 0.08, y: 0.08, width: 0.84, height: 0.22 }`, content zone
`{ x: 0.08, y: 0.34, width: 0.84, height: 0.54 }`, `generous` density, and
`editorial-hero`, `diagram-led`, and `data-led` families. The V2 Deck Baseline
retains existing provider typography and colour-role facts.

`standard` preserves the existing Framed canvas, font families, colour/contrast
treatment, Header Region, and kicker/title/subtitle field geometry. The
`opening-title-only` profile retains that same canvas, theme, Header Region,
and title bounds, while allowing and requiring only `title`. It deliberately
does not center, enlarge, or otherwise restyle the title. Later profile changes
remain a version-level source/package design decision with normal selected-only
invalidation; they are not a slide-level escape hatch.

## Risks / Trade-offs

- **Protocol replacement touches broad shared code.** Use an absorb-or-delete
  inventory, update the owning main-spec deltas, and add an active-root absence
  audit before deleting an obsolete surface.
- **Four package files can disagree.** Validate as one closed package before
  receipt or raw publication and expose selected file bindings in the Control
  Map.
- **A derived view can become accidental authority.** Lifecycle owners ignore
  it; hand edits are replaced by the next plan or ignored.
- **Framed HTML can diverge from capture.** Export it through the existing
  overlay-contract compilation path and prove byte-equivalent header output.

## Migration And Rollback

The Harness gains no in-place production-data migration. New V2 bundles and
V2 structural successors have clean source/configuration and evidence.
Non-V2 bundles remain byte-preserved behind their hard-stop. Roll back an
incomplete deployment by reverting Harness source changes before retrying; do
not reopen an obsolete runtime route or copy old evidence forward.

## Verification Strategy

- **Unit:** marker/state classification; source Page Class grammar; strict
  package shape and confinement; inheritance; selected digest behavior; header
  field rules; controller and HTML determinism.
- **Integration:** V2 receipt -> resolver -> Core -> adapter -> raw binding;
  selected/unselected invalidation; Data View matching and State isolation;
  no obsolete adapter/receipt/route can be imported or selected.
- **End-to-end:** mock V2 Pure and Framed `image2 plan` journeys; inspect every
  Data View artifact and CLI locator; prove no provider transport is reached
  during planning and non-V2 observation makes no writes. Production bundles
  are not fixtures.
