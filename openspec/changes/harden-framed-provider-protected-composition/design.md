## Context

See [proposal.md](proposal.md) for the motivation. The selected Framed profile
currently supplies local CSS geometry, while the Framed raw contract serializes
bare protected geometry and exact local header literals as
`context_not_to_render`. Page Image Core drops the already parsed
`subject_restrictions`, so the canonical request cannot bind them. The shared
transport faithfully submits the adapter's bytes but exposes no verified native
region or mask field.

C4 established selected workflow-isolated presentation projections and C5
publishes the resulting per-page request chain before authorization. C6 changes
the current Framed contract atomically; it does not inspect, migrate, or repair
any production Run Bundle.

## Goals / Non-Goals

**Goals:**

- Give one selected Framed profile a canonical normalized reserved-header and
  body-safe composition, with provenance and one exact digest binding.
- Preserve parsed source `subject_restrictions` through Page Image Core into
  Framed-only raw contracts and canonical provider requests.
- Keep exact header literals exclusively in the deterministic local renderer;
  provider instructions receive non-text composition guidance instead.
- Reuse existing planning, invalidation, Task-Mandate, transport, and Complete
  Page Review control paths.

**Non-Goals:**

- Claiming that a prompt has pixel-level enforcement, adding a native provider
  region/mask field, or changing the opaque shared transport.
- Adding a local body renderer, a second page-layout authority, an OCR runtime
  dependency, an automatic acceptance/rejection decision, or a C6-specific
  control state.
- Running a paid probe, touching v3, or migrating historical/current production
  data. A paid synthetic probe requires a separate explicit Work Request.

## Decisions

### 1. One profile-derived normalized composition is the Framed source of truth

**Owner:** Visual Config resolves the selected Framed profile; JS validates and
serializes the result. The MD Controller only chooses existing source/page
scope and never supplies geometry.

The resolver will publish a `protected_composition` projection alongside the
existing Framed profile facts. It uses one declared normalized canvas coordinate
space (`0..1` per axis), one reserved-header region, and one body-safe region.
The body-safe region must lie in the canvas and not overlap the reserved region.
Both are deterministically derived from the selected profile's existing local
geometry and declared canvas, never from a slide, C5 output, or previous raw
contract. The C5 page-layout serializes this projection as inspection only;
the adapter continues to consume the resolver output.

This replaces bare CSS coordinate lists as the provider-facing semantic
contract while retaining local CSS geometry for deterministic overlay rendering.
It keeps the full provider canvas and transparent overlay, so it cannot become
a blank header band or an implicit local body renderer.

The `page-source-receipt`, `page-layout`, and `image2-request` stage
definitions will collectively declare the source restriction (both workflows),
Framed composition provenance, and the Framed local-only-header boundary. The
existing opt-in conformance sweep will assert that boundary from synthetic data
only; it remains non-runtime and cannot authorize or reject provider work.

**Alternative rejected:** send CSS pixels with a provider size conversion in
the adapter. It makes the input depend on a specific output raster size and
leaves the provider coordinate system ambiguous.

**Alternative rejected:** permit per-page source coordinates. It creates a
second layout authority and cannot be validated against the selected profile.

### 2. Header literals remain local; the provider receives only non-text guidance

**Owner:** Content Parsing owns the Header Rendering Policy; Page Image Core
normalizes it; the Framed adapter owns canonical provider bytes.

For Framed, the current `local_header` remains an immutable local-renderer
input. The `context_not_to_render` literal mirror is removed from the current
Framed receipt/Core/request shape. The provider request instead states the
normalized coordinate system, reserved-header region, body-safe region, and
the non-text requirements for readable body content and key subjects. It never
serializes kicker, title, subtitle, or a field derived from their literal
values.

The request is intentionally a bounded best-effort avoidance instruction. It
does not assert provider compliance and does not create a provider-native
capability claim. This removes the conflicting instruction to imitate the very
literals that the local renderer will draw.

The clean current-contract cutover updates the parser/receipt, Core, Framed
overlay and raw-contract readers, compiler, architecture prompt-assembly
inventory, shared fixtures, and `BOOTSTRAP.md` together. C5 publication keeps
serializing the adapter-owned exact request as opaque bytes, so it has no
separate header-context reader. There is no legacy reader, converter, or
fallback shape: a current Framed receipt containing the removed field is
invalid at its owning current validator.

**Alternative rejected:** retain literal `context_not_to_render` with stronger
negative wording. A deterministic request test could prove only the wording,
not prevent literal imitation, so the field would remain misleading authority.

### 3. Source restrictions enter Framed lineage through the shared Core

**Owner:** the current source receipt is the direct source of record; Page
Image Core owns common fact validation; the Framed adapter owns its raw
contract and request.

Core will require the already parsed closed `subject_restrictions` value to
match the current source receipt and carry it as a canonical semantic binding.
Only the Framed adapter projects that binding into its raw contract and provider
request. Pure continues not to receive Framed composition, local-header, or
the C6 Framed raw/request restriction binding. This does not remove the
existing parser-owned restriction fact from a Pure source receipt or its
existing Visual Config identity-resolution input. A mismatch, missing value,
malformed composition, or stale digest fails at the existing earliest
planning/checkpoint owner with one direct source/configuration repair action.

This gives inspection, preflight, and submission the same source → Core →
Framed contract chain. It adds no durable state: C5 files are regenerable, and
raw lifecycle bindings already own the persistent evidence.

### 4. Invalidation and review reuse existing owners

**Owner:** the existing Page Image invalidation evaluator classifies changes;
the raw lifecycle owns authorization and evidence; Complete Page Review owns
the sole acceptance decision.

The composition digest and Framed restriction binding become direct compiled
input/raw-contract bindings. Drift forces the existing raw-rebuild path and a
new Complete Page Review; it can never select a local-header-only refresh or
reuse a provider page. Profile/source/configuration integrity failures are
hard-stops because they protect attributable canonical bytes and raw lineage.
Their recovery is the existing source/configuration repair followed by the same
planning checkpoint.

Visual observation of a collision is a `guide`: the Agent presents it through
the existing review and recommends the existing repair path. It is not a
`confirm`, because routine review is already the human decision, and it cannot
be a `hard-stop` quality assertion when raster compliance is not reliably
determinable. No waiver is introduced. This follows the human-centered control
policy while retaining the shortest direct loop required by the assistance and
simple-control policies.

**Alternative rejected:** add OCR as a blocking validator. It would create a
second, host-dependent authority for a fact the provider output cannot be
reliably evaluated from deterministic inputs. Any observation remains optional
advisory evidence with a bounded false-positive policy.

### 5. Native provider capability and paid probe remain external

The current transport contract has no native region/mask field, and no
provider-specific primary contract has been verified. C6 therefore does not
invent one. A human may later issue a Work Request for the prepared synthetic
probe; the normal Task Mandate then covers its ordinary scoped provider work
and evidence without repeated prompts. The probe must use a dedicated synthetic
run, never v3, and its result can only document bounded observations.

A verified native primitive would require a new OpenSpec change that specifies
the transport field, exact request binding, provider contract, and tests. This
keeps a future external capability decision from silently widening C6.

## Risks / Trade-offs

- [Prompt-only composition can still be ignored] -> describe the request as
  bounded best effort and keep the existing human Complete Page Review.
- [Profile geometry is malformed] -> validate normalized containment and
  non-overlap before C5 publication or provider initialization; repair the
  owning profile and rerun the same planning checkpoint.
- [Clean contract cutover makes former records unreadable] -> active readers
  and writers change together; do not add a legacy reader or migrate production
  records. Historical bytes remain untouched and outside C6 scope.
- [Restriction propagation leaks into Pure] -> validate workflow isolation in
  Core, both adapters, and contract tests.
- [A diagnostic becomes a duplicate controller] -> retain no diagnostic unless
  it is provider-free, advisory, and does not write a decision/state record.

## Migration Plan

1. Update the active schema declarations, resolver, Core, Framed compiler, and
   current validators together so every newly planned current Framed run uses
   the same contract.
2. Regenerate C5 derived data only through `image2 plan`; do not hand-edit
   `_generated/` or copy a prior request, raw contract, or review record.
3. Do not read, rewrite, convert, or migrate any production Run Bundle. Older
   unsupported records remain byte-preserved under their existing owner-issued
   boundary.
4. Roll back only by reverting this Harness change before it is released; no
   data rollback/migration process is introduced.

## Verification Strategy

- **Unit:** validate normalized composition invariants, Framed-only Core
  restriction propagation, retention of Pure's existing source/identity
  restriction semantics without a C6 Framed request field, absence of header
  literals from canonical provider bytes, direct digest changes, and the
  closed source-restriction grammar. Cover every direct current
  `context_not_to_render` reader/writer so a removed-field receipt is rejected
  rather than compatibility-read.
- **Integration:** compile representative Framed profiles through resolver,
  Core, raw contract, C5 publisher, and mock transport; prove Pure isolation,
  pre-publication hard-stops, and raw-rebuild classification.
- **Static conformance:** extend the existing synthetic sweep to assert C6
  stage-field ownership and Framed/Pure presence/absence without loading a Run
  Bundle or becoming a runtime validator.
- **E2E:** extend the existing mock-provider public CLI journey only if it can
  demonstrate the unchanged authorization/review handoff with the new exact
  request binding. Do not call a real provider.
- **Regression:** run focused Framed/Core/review/schema suites, `npm test`,
  strict OpenSpec validation, the Run Bundle layout self-check, and
  `git diff --check`.
