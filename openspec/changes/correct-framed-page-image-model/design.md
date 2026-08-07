## Context

See [proposal.md](proposal.md) for the motivation. The active implementation
currently models Framed as a text-free Image2 underlay plus a local Text Frame
that owns `kicker`, `title`, `subtitle`, and `callout`. The old source parser,
raw-plan schema, state mode, artifact paths, review contribution, final
manifest, delivery readers, Controller, and CLI all encode that v2 model.

This is a Harness maintenance change. It touches `ppt_maker_harness/`,
`openspec/`, `tests/`, and `tests_e2e/`; it does not inspect, change, migrate,
or use a production `deck_*` directory as a fixture. Existing v2 bytes may
remain on disk but are not an input to the replacement production path.

The proposal, active capability specifications, and the current Harness source
surface establish the resulting domain language. The implementation must keep
the established ownership split: the MD Controller / Agent owns intent and
human interaction; Node owns deterministic parsing, compilation, state,
provenance, invalidation, and diagnostics; the human owns content meaning and
the explicit quality/cost decisions.

## Goals / Non-Goals

**Goals:**

- Replace Page Authority v2 with one current Page Image Workflow lineage,
  including parser, receipt, state, artifacts, evidence, final manifest, and
  active guidance.
- Give Pure and Framed a shared full-canvas Page Image Core while preserving
  their different Header Rendering Policies as isolated adapters.
- Bind actual adapter-compiled provider-input bytes through plan,
  authorization, attempts, review, invalidation, and finalization.
- Replace Framed's split raw/composite decision with one Complete Page Review.
- Make the active Harness reject v2 before provider/state/derived work and
  prevent future regression through focused automated tests and coherence
  scans.

**Non-Goals:**

- No v2 converter, data migration, compatibility parser, evidence bridge,
  fallback, automatic deck mutation, or legacy review/delivery reader.
- No third `hybrid` workflow, per-slide policy, local body/callout renderer,
  provider-authored factual content, or free-form provider prompt ingress.
- No change to the exact-local-Harness binding policy. Its
  `pptmaker-run-bundle-v2` locator is a binding schema, not the retired page
  production protocol.
- No new external runtime dependency, daemon, retry path, alternate provider,
  or second Controller.

## Decisions

### 1. Start a new protocol lineage, not “v3”

The source marker becomes `page-image-workflow-v1`; the matching state mode is
`image2-page-workflow-v1`; the source receipt is
`page-image-workflow-source-v1`; and delivery consumes
`page-image-final-slide-manifest-v1`. New plan, authorization, attempt,
review, provenance, Style Master selection, and delivery schemas use the
`page-image-*` family rather than any `page-authority-*` schema.

The production-marker evaluator is the direct source of record for source
identity; the production-mode evaluator is the direct source of record for the
matching state identity. Every current entrypoint invokes them before parser,
state, artifact, or provider work. A v2 byte sequence produces the existing
owner-issued `unsupported-protocol/export` hard-stop, whose only recovery is
to export the untouched pair; it is never decoded into a current object. This
gives one short control path:

```text
locator -> current source/state identity -> current owner evaluator
        -> plan / review / delivery
```

The alternative, renaming v2 to v3 and adapting old records, would preserve
the faulty content/evidence model and require ambiguous conversion rules. It
is rejected. The local Run Bundle locator stays unchanged because changing it
would neither correct the page model nor strengthen local binding.

### 2. Replace the source grammar with a closed Provider Content Schema

`01-content` will replace the v2 `page_authority_source` parser and receipt
with a Page Image source parser. It retains canonical slide identity, visual
selection, and a fixed header vocabulary, while accepting provider-visible
content only through one fenced `**SLIDE BODY**` YAML mapping:

```yaml
items:
  - role: metric
    literal: "92%"
  - role: callout
    literal: "Close the loop in one working day"
  - role: supporting_copy
    literal: "A practical service promise"
    copy_policy: presentation_adaptable
```

The parser normalizes and freezes each item, preserves the exact literal, and
records explicit adaptation permission. `copy_policy` defaults to `exact`; the
only non-default permission is `presentation_adaptable` on explicitly
non-factual `supporting_copy`. No source field represents provider prompt text,
coordinates, typography, local ownership, aliases, or a free-form `BODY` /
`CALLOUT` escape hatch.

`KICKER`, `TITLE`, and `SUBTITLE` are header literals, not Provider Content
Schema items. In Pure they enter provider-rendered content. In Framed they
enter a local-header input and the provider's exact `context_not_to_render`.
The source parser owns this normalization and validation; visual config only
resolves registered visual language and cannot add or rewrite literal content.

This is stricter than the old text guard but simpler: one structured semantic
source replaces a no-text constraint plus a separate local display model. A
free-form prompt field was considered and rejected because it would create a
second content authority that cannot be reliably checked or invalidated.

### 3. Use one deep Page Image Core Module with two adapters at its seam

Introduce a shared `Page Image Core` Module under the shared Harness source
tree. Its Interface takes normalized current source facts, selected visual
facts, the current Style Master selection, and the selected Header Rendering
Policy. It returns immutable semantic facts needed by either adapter:

- ordered stable slide IDs and canonical content/literal-policy facts;
- visual/Style Master bindings and generation-profile inputs;
- header literals and Framed protected-geometry facts where applicable; and
- canonical byte inputs/digests from which the selected adapter creates its
  provider input, raw contract, and review contribution.

Its Implementation hides content normalization, literal-policy validation,
canonical JSON construction, source/style/visual cross-checking, and shared
lineage facts. The Core does **not** emit a generic provider prompt or submit
provider work. The actual provider-input bytes are policy-specific:

```text
Page Image Core facts
       |
       +-- Framed adapter: protected geometry + header context-not-to-render
       |                  -> exact provider input + local header input
       |
       +-- Pure adapter: provider-rendered header content
                          -> exact provider input
```

`03-framed-image` remains the sole owner of deterministic transparent local
header rendering, browser/font/capture behavior, and Framed review composite.
`04-pure-image` remains the sole owner of Pure publication. The existing shared
Image2 transport receives already-bound bytes and does not dispatch semantic
compilation. The siblings do not import one another.

This is a real seam because the two adapters vary in Header Rendering Policy.
The Core is deliberately a deep Module: callers and tests cross one compact
Interface instead of reproducing schema normalization, literal rules, and
lineage calculation. It gains Depth, Leverage, and Locality; removing it would
recreate common semantic compilation in both adapters. A shared “universal
prompt compiler” was rejected because it would obscure policy differences and
put semantic ownership into transport code.

### 4. Framed is a transparent three-field overlay, not a local text frame

Replace `text_frame`'s four-field / panel model with a Framed header-overlay
Module. Its Interface accepts only normalized `kicker`, `title`, `subtitle`,
the selected header preset, and deterministic browser/font/capture facts. Its
Implementation performs fit, rendering, and minimal preset-bound contrast
treatment. It does not accept body, label, metric, diagram text, quote,
callout, arbitrary CSS, or caller layout overrides.

The preset emits one protected zone into the Framed adapter's compiled provider
input and review guide. It describes avoidance of provider text and important
subjects, while keeping a continuous full canvas. It must not request a blank
band, crop, opaque card, or whole-page no-readable-text rule. The protected
zone is a composition constraint, not proof that Image2 obeyed it.

The local header profile digest excludes header literals and provider media;
the Framed compiled-provider-input digest includes the exact header literals as
context-not-to-render. Keeping these identities separate prevents a local
renderer change from looking like a provider input change and prevents a
literal change from being mistaken for a local-only refresh.

### 5. Bind real compiled provider inputs into the progressive page lifecycle

The selected adapter compiles canonical UTF-8 provider-input bytes per slide
and hashes those exact bytes. The Page Image plan stores each byte digest with
the source receipt, Provider Content Schema digest, visual/Style Master facts,
raw-contract digest, generation-profile digest, and policy-specific profile or
protected-geometry digest. The adapter writes a secret-safe local inspection
projection; CLI output names only its path, digest, and matching plan hash.

Before authorization, submit, reconcile, review, finalization, or local
refresh, the owning evaluator recompiles direct inputs and requires exact
bindings. The shared progressive owner preserves its existing immutable
plan/batch/attempt/provenance history, CAS-scoped current head, exact human
authorization, one-item submission, verified-media acceptance, and
uncertain-submission reconciliation discipline, but its schemas and store paths
are replacement-protocol records. It may carry opaque adapter plan facts; it
must not interpret Framed/Pure semantics.

This moves compilation out of `ppt_flow.mjs` transport assembly and makes the
requested provider payload auditable. Binding only a source receipt or a
pre-compiled prompt description was rejected because it cannot prove the bytes
sent after policy-specific compilation.

### 6. Invalidate from the bound facts, not field names

The change classifier, workflow inspector, adapters, and finalization use the
same direct invalidation evaluator. It compares the previous and current:

```text
compiled provider-input digest
protected geometry
raw contract
generation profile
Framed local header profile
accepted provider-page bytes / evidence
```

Any drift in Provider Content Schema, header context, visual direction,
generation profile, raw contract, protected geometry, or version workflow
requires raw rebuild. Framed local overlay refresh is available only when all
provider-facing facts and its local profile remain exactly unchanged. Notes
remain delivery-owned. Structural membership/order or policy changes remain
previewed exact-hash vNext work.

The direct source of record is the adapter's compiled plan and current direct
evidence, not a field name, task card, rendered filename, or conversation
summary. This removes the former special case where a Framed title could
rebind old raw evidence just because it was a local Text Frame literal.

### 7. Make Complete Page Review the only page-quality decision

Raw provider media and policy-specific review artifacts are derived evidence.
For Framed, the review publisher creates the exact raw provider page and a
production-equivalent composite using the same header input/profile that
finalization will use. It records both byte digests and their current plan,
profile, geometry, and source bindings in one review record. For Pure, the
provider page is the complete-page representation. A contact sheet or
per-page projection may help presentation, but it is not a second source of
truth.

`proceed` or `repair` is the one human Complete Page Review decision. It checks
source-required literal/data fidelity and readable composition. `proceed`
publishes normal page acceptance only after current evidence validation; it is
not a waiver. A later delivery review remains responsible for final PNG, PPTX,
notes, and deck-level quality.

The `pilot` operation only plans a provider-free selected batch; the Pilot
sample becomes provider work only after that exact batch receives its separate
cost authorization and generation proceeds. Pilot presents the same
policy-specific representation for selected pages but cannot mint complete
acceptance, final media, a manifest, PPTX, or notes. The prior second
composite-approval state is deleted rather than carried forward.

### 8. Replace state and artifact ownership atomically; retain old bytes inert

The implementation creates replacement source/state/receipt/path helpers and
updates state writers/readers, `bundle_layout`, workflow inspection, CLI
routing, final manifest, assembly, and notes to use them. New derived artifacts
live under a replacement-owned Page Image workflow root rather than the old
`page_authority_image2` root. New Style Master history and acceptance records
are scoped to the replacement identity; existing candidate lifecycle safety
(immutable history, CAS head, exact authorization, and uncertainty handling)
is retained.

No v2 object is read as an input, even to copy a visual asset or a style
selection. The current identity evaluator runs before a path is followed, so
old artifact files remain inert bytes. This gives all current operations the
one `unsupported-protocol/export` recovery action: export the untouched pair
and re-author a new current source/version; it does not offer a force, state
edit, conversion, or automatic migration.

State remains the durable writer for Controller lifecycle references. It stores
only durable replacement facts that cannot be reconstructed, and references
rather than duplicates provider input or adapter-specific evidence. The
selected adapter remains the evaluator for raw contract, compiled input, and
review contribution; delivery remains the evaluator for final assembly and
notes lineage.

### 9. Keep Controller, CLI, and documentation as projections of the owners

`workflow-inspection` remains marker-first and observation-only. It first
checks local binding and replacement identity, then asks the selected owner for
the earliest current fact and one action. `ppt_flow` preserves its
producer-owned JSON diagnostic envelope and delegates semantic operations to
the selected adapter; it must not recompile prompts or invent recovery.

Gate posture follows the existing policies:

| Direct fact / outcome | Posture | Owner and legal response |
| --- | --- | --- |
| malformed current source, wrong source/state pair, stale byte binding, invalid provenance, missing authorization | hard-stop | owning parser/state/evidence evaluator; repair the owner fact then rerun the same checkpoint |
| v2 source/state/receipt/evidence input | hard-stop | protocol owner; `unsupported-protocol/export` preserves bytes and exports the pair without selecting a current route |
| missing configured local runtime/font | guide | environment owner gives deterministic repair, then rerun |
| disclosed Style Master or page provider cost | confirm | human authorizes the exact owner-issued scope |
| complete page quality | confirm | human chooses `proceed` or `repair` on the one complete-page representation |

No confirm crosses identity, integrity, authorization, or recovery boundaries.
Controller playbooks, `COMMANDS.md`, Charter, BOOTSTRAP, reference material,
and generated task projections explain only this route. Task projections remain
rebuildable collaboration views, never a pass/fail authority.

### 10. Delete the old active route rather than layer it underneath

The implementation replaces v2-named parser/runtime/artifact/state modules,
imports, test fixtures, production schemas, active playbooks, and active
documentation. It adds an architecture/coherence guard that rejects live
imports or dispatch to a v2 parser, marker decoder, adapter, state initializer,
evidence reader, converter, or migration path. Historical OpenSpec archives
remain untouched.

This is intentionally an atomic semantic replacement, not a mechanical string
rename. A literal old token can remain only in an explicit negative rejection
fixture or archived/historical record; an active description of a current route
is a failure. The alternative of retaining `legacy-image2` internals as an
active fallback is rejected because it would silently reintroduce an
unreviewable second authority path.

## Risks / Trade-offs

- **Breaking replacement requires re-authoring current work** -> The parser
  fails at identity before derived reads and gives one bounded owner action;
  no deck data is destroyed or modified.
- **Provider may place text or subjects into the Framed protected zone** -> The
  constraint is bound into provider input and the production-equivalent
  composite is part of the one human review; failure routes to `repair`, not a
  post-approval overlay workaround.
- **Closed source schema raises authoring friction** -> Roles are small,
  explicit, and bounded; parsing diagnostics identify the exact source field
  and the Agent can perform legal deterministic formatting repair.
- **Cross-cutting replacement risks an overlooked v2 import or document** ->
  Use architecture/coherence scans plus focused negative tests over source,
  state, CLI, inspection, delivery, and active docs.
- **Removing v2 records may accidentally lose lifecycle safety** -> Port CAS,
  immutable history, exact authorization, and uncertain-submission behavior
  as replacement implementations; test them before deleting the old modules.
- **Large test fixture churn can conceal semantic regressions** -> Build small
  shared v1 fixture factories around the Page Image Core and verify both
  adapters against the same canonical content cases.

## Migration Plan

1. Implement the replacement protocol constants, closed source parser, and
   Page Image Core first. Add isolated fixtures that prove source/state v1
   identity and v2 rejection without touching a real Run Bundle.
2. Implement the Framed header-overlay adapter and Pure compiler over the Core.
   Add new raw-plan, provider-input, review, final-manifest, state, and path
   schemas/stores; preserve progressive/Style Master lifecycle protections as
   replacement records.
3. Wire selected adapters through `ppt_flow`, state, workflow inspection,
   playbooks, layout validation, delivery, notes, and change classification.
   Remove v2 imports/routes only when the replacement path passes its focused
   tests.
4. Replace active Harness docs and tests, including baseline/coherence ledgers.
   Retire old fixtures/modules rather than using them as current test input;
   keep only bounded negative fixtures that prove v2 hard-stop behavior.
5. Run focused unit/integration tests, mock E2E journeys, coherence scans, and
   the full repository test command. Validate the OpenSpec change, then sync
   main specs and archive only after implementation is complete.

There is no runtime data migration and no operational rollback to v2. Before
implementation is accepted, an incomplete branch can simply be abandoned. Once
the Harness ships the correction, any defect is fixed forward under the
replacement protocol; retained v2 bytes remain unsupported and are never
reactivated as a recovery path.

## Verification Strategy

**Unit tests** will cover the closed parser grammar, exact/adaptable literal
policy, header-policy selection, Page Image Core Interface, Framed/Pure
provider-input compilation, transparent-overlay-only field acceptance, digest
invalidation, v2 hard-stop, and final-manifest validation.

**Integration tests** will cover selected-adapter plan -> authorization ->
mock generation -> Pilot -> Complete Page Review -> finalization, current state
and artifact storage, CLI secret-safe inspection/diagnostics, local overlay
refresh proof, and no-mutation behavior for v2 state/evidence. They will use
small checked-in fixtures, never a production `deck_*` directory.

**Mock E2E tests** will drive both a Framed and Pure Controller journey through
the public entrypoint. Framed verifies provider-rendered callout/body content,
raw-plus-composite one-decision review, and header-literal raw rebuild; Pure
verifies complete provider-page review. A separate negative journey proves v2
cannot resume, plan, submit, publish, assemble, or inject notes.

**Coherence tests** will scan active Harness source, docs, specs, and tests for
forbidden current v2 routes/imports and assert that only explicit rejection
fixtures and archives may name them. They will also assert the single Core
seam, sibling locality, no transport-layer prompt compilation, and no second
composite approval state.
