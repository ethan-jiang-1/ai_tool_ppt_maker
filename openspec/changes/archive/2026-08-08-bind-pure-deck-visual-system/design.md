## Context

See `proposal.md` for motivation and the three delta specs for required behavior. The current Pure
adapter already compiles full-page provider input from Page Image Core, a selected Style Master,
visual-language clauses, and one generation profile. The common invalidation evaluator compares
exact per-slide raw-contract and provider-input bindings when plans are available. It therefore
already has a correct place to detect visual-system drift without State or a new lifecycle owner.

The existing visual-language registry owns per-slide content-neutral scene direction and rejects
typography/content clauses. Framed's Header Rendering Policy owns deterministic local overlay
geometry and does not apply to Pure. Those are distinct concepts from a deck-wide Pure system.

## Goals / Non-Goals

**Goals:**

- Give Pure every page the same validated deck visual-system projection and exact digest.
- Make a visual-system source change produce one existing Pure raw-rebuild path through current
  plan/binding/invalidation machinery.
- Keep the validation interface small, source-owned, and reusable by target and progressive Pure
  planning.

**Non-Goals:**

- No deterministic pixel-compliance score, image classifier, new review decision, State field,
  retry, or controller node.
- No local rendering of Pure headers/body, no Framed preset/geometry reuse, and no alteration of
  exact raw bytes, Style Master candidate history, existing delivery, or v2 hard stops.
- No automatic migration of existing Run Bundles and no provider-backed E2E during implementation.

## Decisions

### 1. One deep Visual Config module validates a deck-authored source record

Add a dependency-light Pure visual-system module below `02-visual-system/`. Its public interface
is one resolver taking a current run and returning either one immutable canonical projection with
its SHA-256 or the owner-issued source/configuration failure. It resolves the existing backbone
asset/override path and owns all YAML parsing, confined-file checks, exact-key validation,
normalization, digesting, and error classification.

The closed `pure-deck-visual-system-v1` record will contain only structured presentation tokens:
one font-voice pair plus relative text-role hierarchy, `style-master` as the only palette source
with bounded colour-role use, normalized named title/content zones, one whitespace density, and a
nonempty set of named permitted layout families. Values use bounded identifiers/enums and numeric
normalized geometry; arbitrary prompt prose, source literals, image paths, URLs, and lifecycle
facts are rejected. The seeded record supplies an editorial presentation system, but the chosen
record remains deck-authored source under existing override precedence.

This is a deep module: Pure callers learn only `projection + sha256`, while parsing and
normalization stay local. Reusing `page-image-visual-language.yaml` was rejected because that
registry is per-slide and intentionally forbids typography/content semantics. Reusing a Framed
header preset was rejected because it would import local-renderer geometry into a provider-owned
Pure page.

`parsePureTargetReceipt` receives the canonical `runDir` from the target runtime and invokes this
resolver with that run so source validation and later raw compilation select the same
override-or-backbone path, including on the Style Master candidate route. It does **not** add the
projection or its digest to the source receipt:
that receipt's SHA must remain the exact `slide-specifications.md` byte hash checked by the shared
target runtime. Actual target/progressive raw compilation resolves the projection once and passes
it to Core. This keeps a missing/malformed source record ahead of Style Master readiness while a
valid layout-token edit leaves the selected Style Master context/currentness unchanged.

### 2. Bind the projection once through the existing Pure raw data path

`createPureCoreFacts` receives the resolved projection and places its digest in each Pure Core
slide. The Pure raw contract carries an exact content-neutral
`deck_visual_system: { sha256, projection }` object; the compiled provider input emits that same
object. The workflow-neutral provider-input binding gains one explicit
`deck_visual_system_sha256` slot: Pure requires the
validated digest, while Framed keeps the exact `null`/not-applicable value. This is an atomic
closed-shape change across the Core factory, ordinary raw-plan artifact validator, progressive
raw-plan schema, invalidation comparison, provider-input inspection projection, and shared test
binding fixture. It does not introduce a second registry or plan field.

This places the seam at the adapter input boundary. Transport treats the compiled bytes as opaque,
and delivery only consumes final bytes, so neither must learn visual-system semantics. Style Master
continues to own selected reference bytes and colour authority; changing Pure layout tokens does
not generate, reselect, or invalidate Style Master candidates.

### 3. Existing plan comparison owns invalidation

When the selected record changes, its new digest changes the Pure raw contract, compiled input,
and the binding already compared by `evaluatePageImageInvalidation`. The first affected
prerequisite is therefore binding drift, with the existing `authorize_and_rebuild_pure_raw` action.
No profile digest is written to State, receipt, grant, acceptance, review, or a new freshness
record. A standalone `classifyPureRefresh` caller that has no candidate plan remains a
receipt-only classifier; the owning plan/replan path supplies the direct old/new bindings required
to classify this source-adjacent configuration change.

This is `hard-stop` only for invalid source/configuration, protecting canonical source and exact
plan identity. Its repair is edit the owned source record and rerun the same plan checkpoint.
Visual consistency of provider pixels is not deterministically decidable from the binding, so it
remains the existing human `confirm` at paid Pilot/Complete Page Review. No new waiver or force
route is created.

### 4. Scaffold new source; do not adopt old data

`bundle_layout.mjs` owns the canonical filename, seed text, tree/Where Map output, and structural
checks. `init` creates the seed for new bundles. Older bundles are not rewritten. When an older
current Pure run is planned without the source record, the Visual Config resolver fails before
dependent source/plan/provider work and does not infer a profile from Style Master pixels, a prior
input inspection, or an accepted page.

Rollback is deletion of the new code and, for a new deck, its source record; generated evidence is
never altered. A config change is an ordinary source edit: it creates raw rebuild debt, then uses
the existing exact Pilot/authorization/review route.

### 5. Use deterministic testing for binding, human review for pixels

Unit tests cover parser strictness, canonicalization, override selection, escaped paths, and
forbidden prose/content. Adapter and raw-owner integration fixtures cover multi-page identical
digest/token input, Pure-only binding requirements, Framed null compatibility, source change
binding drift, stale accepted evidence, and secret-safe inspection. The initial focused Pure
fixture is repaired before those tests prove the new behavior.

No provider-backed E2E is appropriate: the harness can prove exact input binding but not provider
pixel obedience without paid work. After implementation and provider-free verification, an Agent
uses the existing exact Pilot authorization to request the human-approved cost scope for three
representative Pure slides. Human review checks the cross-page typography hierarchy, colour use,
zones, whitespace, and permitted-family discipline; it is evidence for a deck, not a new global
quality state.

## Planning Review Record

### Pass 1: Source Identity And Lifecycle Authority (2026-08-08)

Reviewed the proposal-to-task chain against Pure receipt parsing, target source materialization,
Style Master scope binding, and raw invalidation. The review found a source-identity ambiguity:
the `source_sha256` in the source receipt is the exact `slide-specifications.md` byte hash, so it
must not absorb the visual-system digest. The plan was corrected so receipt parsing validates the
profile as a prerequisite, while actual target/progressive raw compilation resolves and binds it.
This preserves the earliest missing/malformed-source stop and avoids turning a layout-token edit
into Style Master currentness or candidate churn.

### Pass 2: Closed Binding And Layout Integration (2026-08-08)

Reviewed the implementation seams in the Pure adapter, Page Image Core, ordinary/progressive raw
plan validators, invalidation, request inspection, run-bundle layout, and source-to-test
ownership inventory. The review found that the existing provider-input binding has three strict
schema validators, so extending only Core would make valid plans fail downstream. The plan now
names one `deck_visual_system_sha256` field and requires the ordinary and progressive validators,
Framed-null compatibility, invalidation reason, inspection, all shared fixtures, and ownership
manifest updates in the same atomic change. The target runtime passes `runDir`, so the resolver
can faithfully apply the existing override precedence at both source and compilation boundaries.
No State, selector, authorization,
Style-Master replan, local compositor, or provider work is needed.

### Planning Gate Result (2026-08-08)

`openspec validate bind-pure-deck-visual-system --strict`, `openspec validate --all --strict`,
`git diff --check`, and the repository's protected `npm test` baseline all pass. The focused
`tests/04-pure-image/test_pure_workflow.mjs` baseline remains 13/14: its sole failure is the
pre-existing invalid `receipt()` fixture without ordered `position` values and with the retired
per-slide `workflow` field. Its other thirteen lifecycle tests pass. Task 1.1 owns this repair
before visual-system behavior is added; this planning-only change neither edits the fixture nor
claims that it is green.

## Risks / Trade-offs

- [The source record becomes a free prompt tunnel] -> accept only exact structured tokens and
  bounded enums/geometry; reject arbitrary prose and source literals before planning.
- [A profile edit silently reuses accepted pages] -> bind its digest into both raw contract and the
  existing compared provider-input binding; cover accepted-evidence drift in focused tests.
- [Style Master churn adds provider cost] -> keep Style Master selection as colour/reference
  authority but outside Pure visual-system candidate scope; token edits rebuild raw pages only.
- [A deterministic token test is mistaken for pixel proof] -> state the split explicitly and use
  the existing authorized Pilot/Complete Page Review for human visual judgment.
- [Legacy bundles become unintentionally current] -> no fallback seed/adoption; missing source
  stops at the owning source/configuration repair route.

## Migration Plan

1. Ship the new seed and Pure-only resolver/binding together.
2. New bundles receive the source record automatically through `init`.
3. Existing current Pure bundles add an explicit record through the normal source-edit path before
   planning; their historical lifecycle artifacts remain byte-identical and non-current after a
   profile change.
4. Revert removes the new source requirement and code; it does not delete or rewrite any
   immutable record or derived output.
