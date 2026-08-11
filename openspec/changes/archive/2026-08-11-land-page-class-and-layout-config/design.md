## Context

See [proposal.md](proposal.md) for motivation and the seven delta specs for the
behavioral contract. C3 now publishes current Page Source with one version-wide
workflow, but the current parser also emits source-owned `FRAME PRESET:
standard`; `header_overlay.mjs` accepts only that hard-coded preset. Pure has a
separate, whole-deck `pure-deck-visual-system.yaml`. Neither side can safely
become the other workflow's presentation registry.

C4 is a cross-cutting source/configuration/adapter/invalidation change. Its
direct source records remain editable in the Run Bundle; its resolved page
view is an internal deterministic value until C5 deliberately publishes it.
No production `deck_*` or `dpt_*` data is a fixture or a migration target.

## Goals / Non-Goals

**Goals:**

- Give every page one normalized class and exactly one workflow-isolated,
  provenance-carrying presentation projection.
- Keep the current Framed standard overlay as the `standard` Framed profile
  while moving its selection out of Page Source and into version configuration.
- Reuse the current raw-plan/evidence lifecycle to bind projection drift and
  to route selected changes to raw rebuild plus Complete Page Review.
- Make a malformed presentation package fail at its direct source with one
  repair-and-rerun path.

**Non-Goals:**

- Publishing `page-layout`, header HTML, receipts, render models, generation
  specs, or a page index to disk. Those are C5 work.
- New playbook nodes, direct CLI commands, persistent approval/state fields,
  provider calls, cost authorization, or another review gate.
- Compatibility parsing, automatic conversion, or migration for `FRAME PRESET`,
  the old Pure source location/shape, existing Run Bundles, or historic evidence.
- A mixed per-page Framed/Pure workflow, a shared profile language, generic
  provider prose, or a post-generation geometry override.

## Decisions

### 1. `PAGE CLASS` replaces `FRAME PRESET` at the source boundary

**Owner: JS parser, with MD/Agent-owned authoring advice.**

`page_image_source.mjs` will extend the current Page Source grammar with one
optional `PAGE CLASS` field and normalize absence to `standard` in the source
receipt. It will reject an unknown/repeated value and any `FRAME PRESET` field
before it writes a receipt. The receipt carries the normalized class, but no
selected profile, geometry, or provider instruction.

The Controller/Agent may suggest a special class in presentation language when
it fits the narrative; that is a `guide`, never a completion condition or
parser inference. The author changes canonical Page Source only when they want
that result. JS does not turn content, position, or prior images into a class.

The old per-slide preset is deliberately removed, rather than translated into
`standard`. A translation would retain two selection semantics and make an
unknown old value look valid. Retaining it beside Page Class was rejected
because a Framed page could then choose two conflicting presentations.

### 2. One four-file source package, selected file by selected file

**Owner: `bundle_layout.mjs` for locations/seeds; a new Visual Config resolver
for parsing, validation, and resolution.**

The canonical package directory is
`2_backbone/visual-style/page-image-presentation/`, with matching version
override directory `overrides/visual-style/page-image-presentation/`. It has
exactly these source records:

| File | Current unversioned source contract | Owns |
| --- | --- | --- |
| `page-class-catalog.yaml` | `pptmaker-page-image-class-catalog` | the four closed class names, default `standard`, and per-workflow profile identifiers |
| `deck-defaults.yaml` | `pptmaker-page-image-deck-defaults` | workflow-neutral typography, colour roles, and density defaults |
| `pure-deck-visual-system.yaml` | `pptmaker-pure-deck-visual-system` | Pure-only profiles keyed by the catalog's Pure identifiers |
| `framed-header-profiles.yaml` | `pptmaker-framed-header-profiles` | Framed-only permitted header literals, local type/colour/spacing, and protected header regions keyed by the catalog's Framed identifiers |

Each document uses the existing normal override-first/backbone-default resolver:
the matching version override replaces that document's backbone source for the
version. There is no partial YAML merge and no fallback from a malformed
override to the backbone file. This keeps the source actually edited by the
author as the direct fact and makes failure/rebuild scope visible. Inheritance
is only semantic, inside a validated selected profile over `deck-defaults`.
Each file carries exactly the table's inventory-declared `schema` value and no
revision/version marker. The prior Pure source shape is removed rather than
read or converted.

The implementation adds one Visual Config module that loads the four confined
source paths, uses the repository's YAML/canonical-digest helpers, validates
closed shapes and cross-file bindings, and returns immutable JSON-safe
projections. It exposes package-level validation separately from per-page
resolution so all failures share one evaluator. The existing Pure loader is
refactored behind this resolver; `pure-deck-visual-system.yaml` remains
Pure-only, and Framed never reads its record or digest. The old option of
expanding that file into a shared config was rejected because it would make a
Pure-owned semantic input affect Framed raw evidence.

### 3. A resolved projection is a typed, in-memory adapter input

**Owner: JS `visual-config` -> Page Image Core/adapter protocol.**

For `(normalized page class, selected version workflow)`, the resolver produces
one immutable `ResolvedPagePresentation` equivalent containing the class,
workflow, catalog-selected profile ID, resolved values, per-value provenance,
and source/binding digests. A Framed projection exposes only its permitted
header fields, local render facts, and protected region. A Pure projection
exposes only whole-page Pure facts. Both retain deck-default origins without
copying source Page Content.

Page Image Core and both adapters receive this projection from the resolver,
not from source literals or caller options. `header_overlay.mjs` becomes a
deterministic renderer/validator of an already-resolved Framed profile; its
current `standard` constants seed the `standard` profile rather than select it.
The Pure adapter receives its selected Pure class profile through the same core
boundary. C4 does not serialize the projection as `page-layout`, header HTML,
or any other C5 file; the existing immutable raw plan is the sole durable
consumer that records the exact binding required to establish evidence.

The existing Framed review contribution already carries a profile digest and
guide per stable page ID, but currently rejects a batch with more than one
digest. C4 removes that deck-wide equality check and every equivalent batch-wide
assumption in Framed raw planning. The compiler validates each raw contract
against its own resolved frame profile, rather than the first page's profile.
The ordinary and progressive plan-time browser proofs must return exactly the
candidate's ordered stable IDs and, for each ID, the same resolved profile digest
and protected-region guide as that candidate page. A mismatch on one page stops
before source/state/plan materialization; a matching sibling cannot make it
valid. The header-contract batch verifier and compositor describe each page from
its own resolved profile and do not emit or compare a deck-wide profile digest.

It retains each page's own profile digest, protected-region guide, composite,
and raw-contract lineage in the existing contribution, so a Complete Page Review
remains one current decision over a heterogeneous but fully attributable page
set. It does not add a review-wide profile field, second decision, another
review publisher, or a durable browser-proof record beyond the existing
per-page raw-contract and review bindings.

For Framed, the resolver also cross-validates the receipt's non-null header
literals against the selected profile's permitted field set before it constructs
the adapter input. A title-only profile therefore requires title-only source;
an extra kicker or subtitle is a direct Page Source repair, never a dropped
literal or a provider-visible substitute. This preserves source content
authority and makes the author choose either compatible source content or an
existing named class.

An alternative small adapter-specific resolver was rejected: it would duplicate
catalog and inheritance logic, make provenance inconsistent, and create a
different answer for the same source page.

### 4. Resolution binds lifecycle evidence; selection determines invalidation

**Owner: existing Page Image invalidation and raw-plan owners.**

The raw input/core binding will include the normalized class plus the selected
projection's canonical binding/digest. The invalidation evaluator re-resolves
the same direct page/config facts before it compares a current operation to
that binding. A class reassignment, selected deck-default change, selected
Pure/Framed profile change, or workflow transition changes the binding and
takes the existing raw-rebuild path; the next complete page must receive a new
Complete Page Review. A class/profile document that the page does not select
does not enter the page's binding and, when the complete package remains valid,
changes nothing for that page. A malformed or cross-file-inconsistent sibling
is instead an earlier package-validator hard-stop: it preserves current
immutable evidence and performs no raw rebuild, refresh, authorization, or
review until the direct source is repaired.

This adds no status flag or second invalidation ledger. Current raw/review
records remain immutable and become non-current through their existing
successor binding. Provider-free Framed local refresh remains legal only if all
existing bindings, including the resolved projection, are byte-equal.

### 5. One direct failure path, no new gate

**Owner: Visual Config evaluator and existing runtime diagnostic path.**

The direct facts are the normalized source receipt, four selected source files,
and selected workflow. A missing/malformed/conflicting package, forbidden
cross-workflow fact, absent selected profile, or stale projection binding is a
`hard-stop`: it protects source integrity, workflow isolation, provenance, and
the exact evidence a review represents. The existing bounded diagnostic names
the direct source/config repair; the Agent edits that owner and reruns the same
resolver/planning checkpoint. There is no force, waiver, generated fallback,
or recovery state.

Omitted Page Class and a non-blocking Agent recommendation are `guide`s. C4
introduces no `confirm`; the existing Complete Page Review remains the only
human decision after a raw rebuild and remains owned by its current lifecycle
record. This applies the short loop from
`human-centered-gates.md`, `agent-assistance-and-control.md`, and
`simple-reliable-control.md`: direct source -> one resolver -> earliest bounded
failure -> Agent repair -> same check. Deleting `FRAME PRESET`, reusing one
resolver for inspection/planning/invalidation, and avoiding duplicate header
JSON or persistent projections are the concrete simplifications that justify
the added package validator.

### 6. Schema and layout changes expose ownership, not another runtime

**Owner: Harness schema home and serialization inventory.**

The C4 definitions for `page-source.page_class`, `layout-config`, and
`page-layout` move from planned to materialized with executable anchors,
provenance, and invalidation language matching the resolver. The inventory
groups the four tabled source contracts under `layout-config`, moves
`pptmaker-pure-deck-visual-system` out of the visual-language group, and removes
the active `framed_header_preset` selector. It declares only durable
values/bindings that code actually uses. Schema documents stay descriptive
authority: they neither scan a bundle nor resolve a profile.

## Risks / Trade-offs

- **A four-document package can be partly edited.** -> Treat the package as one
  closed validation unit and fail before raw planning, with the invalid document
  and nearest repair action; never fill gaps from generated history.
- **A profile edit might accidentally invalidate all pages.** -> Bind each page
  only to its selected class/profile/default inputs and add focused valid
  selected-versus-sibling invalidation tests for both workflows; prove a
  malformed sibling fails package validation without mutating evidence.
- **Moving the Pure file can look like a compatibility exercise.** -> Make it a
  clean current-layout cutover in templates, layout enforcement, and synthetic
  tests only. No historical production path is read or rewritten.
- **Framed local styling could mistakenly look provider-free.** -> Include the
  complete resolved projection in the existing raw binding and retain the
  all-bindings-equal condition for a local refresh.
- **A Framed review batch currently assumes one overlay profile.** -> Remove
  every global-digest assumption in candidate compilation, browser proof,
  composition, and review contribution; keep the existing per-page profile
  digest and guide as the exact binding, with mixed-class plan/proof/review
  tests and a one-page proof-mismatch no-write test.
- **Profile flexibility could become a second source of page content.** -> Keep
  catalog/default/profile shapes closed and content-neutral, and reject body
  literals, prompt prose, and per-page overrides at the direct source.
- **A title-only profile could silently suppress source copy.** -> Validate
  selected-profile field permission against non-null receipt literals before raw
  planning and return the Page Source repair; never omit or reclassify copy.

## Migration Plan

This is a clean cutover, not a data migration.

1. Update the layout constants, validation, init seeds, templates, schema
   declarations, source parser, and test fixtures together so current source
   work has the four-file package and `PAGE CLASS` only.
2. Remove active `FRAME PRESET` parsing, receipt fields, hard-coded preset
   selection, old Pure-source location references, templates, guidance, and
   tests; add no reader, translation, write-back, or compatibility branch.
3. Verify with synthetic temporary Run Bundles only. Current/historical
   production `deck_*` objects are neither inspected nor modified. A source
   lacking the new package stops at the current configuration hard-stop.
4. If the change must be reverted before release, revert the Harness source and
   its synthetic tests as one source-control change. Do not attempt to backfill
   or mutate production packages, receipts, evidence, or generated artifacts.

## Verification Strategy

- **Unit:** Page Source optional/invalid Page Class and removed `FRAME PRESET`;
  all four source grammar validators; override confinement; cross-file failures;
  provenance; Framed/Pure field isolation; deterministic resolver digest; and
  selected versus unselected invalidation.
- **Integration:** temporary initialized bundles cover current seeds, full
  package validation, both adapters consuming a standard/special projection,
  mixed-profile Framed raw-plan/proof and review binding, old raw binding
  rejection after selected drift, and the unchanged sibling binding. They
  assert no page-layout file, provider call, review record, or lifecycle state
  is created by configuration work or by a per-page proof mismatch.
- **E2E:** one selected mock Page Image Workflow journey covers source ->
  resolver -> adapter -> existing raw rebuild/review route after a selected
  class/profile edit. It uses the mock provider and temporary bundle only; no
  live provider or production deck is needed.
- **Contract/layout:** schema-conformance, serialization-inventory, architecture
  boundary, layout/init/new-version, lexical clean-cutover, and strict OpenSpec
  validation tests prove that active code has no `FRAME PRESET` control path and
  that C4 producers are no longer declared planned.
