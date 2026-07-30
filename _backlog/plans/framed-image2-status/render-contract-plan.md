# Framed Render Contract Design

> Companion to [README.md](README.md) | Status: decision-ready | Updated: 2026-07-30

## Problem And Required Invariant

The current `standard-v1` model declares geometry, colors, Source Sans 3, and
Noto Sans SC. The private compositor independently hard-codes a dark Arial
layout. Its heuristic preflight is not equivalent to browser layout, so the
source receipt and raw contract can describe a frame that the final pixels do
not use.

The governing invariant is:

> A Framed raw plan may be materialized only after every current Text Frame
> fits the exact self-contained render profile that the plan binds; final
> composition must prove the same contract again before publishing pixels.

The selected `03-framed-image` workflow owns this rule. Shared raw mechanics
continue to handle opaque typed contracts, hashes, authorization, bytes, and
review evidence without interpreting Framed fields.

## Policy Alignment

This design is subordinate to the three policies linked from
[README.md](README.md) and to accepted capability behavior.

### Responsibility handoff

| Actor | Owns | Does not own |
| --- | --- | --- |
| Human | Text meaning, generated-underlay visual/content judgment, and existing explicit provider authorization decisions. | Browser geometry, font readiness, hashes, state repair, or artifact materialization. |
| Agent | Authorized mechanical work: run checks, apply legal owner-issued repair, rerun the same checkpoint, and explain bounded results. | Implicit permission to waive integrity, overwrite state, or invent content decisions. |
| JS/runtime owner | Deterministic parsing, profile construction, layout evaluation, diagnostics, exact writes, and evidence invalidation. | Creative judgment, a second playbook, inferred intent, or human risk acceptance. |

The Agent must not ask a person to replay routine commands that it can legally
perform. It stops for the smallest genuinely human decision or missing external
authority, then resumes remaining mechanical work after that decision.

### Gate classification

| Checkpoint fact | Outcome | Protected invariant | One nearest legal action |
| --- | --- | --- | --- |
| Doctor observes a deterministic missing local runtime/font prerequisite | `guide` | None is waived; production remains unopened. | Repair through the environment owner, then rerun doctor. |
| `image2 plan` cannot prove current Text Frame fit or code-point coverage | `hard-stop` | Final-pixel integrity and pre-provider authorization correctness. | Repair current Text Frame source, then rerun the same plan checkpoint. |
| `image2 plan` lacks a ready pinned browser/font environment | `hard-stop` | Layout result is unknown and cannot become an authorizable plan. | Repair environment readiness, then rerun the same plan checkpoint. |
| A later command sees source/profile/stored-plan drift | `hard-stop` | Exact identity, provenance, and recoverability. | Rerun `image2 plan` to obtain the current exact plan. |
| Provider authorization is absent or does not bind the exact current plan | `hard-stop` | Explicit provider-spend authorization. | Obtain authorization for the exact current plan. |
| An accepted-raw/final path sees raw-contract/render-profile drift | `hard-stop` | Accepted-underlay attribution and recoverability. | Run Generated Image Rebuild through the selected owner. |
| Raw projection is complete/current but has no human decision | Existing `confirm` | Human ownership of generated-underlay quality. | Show current evidence and request the existing bounded raw-review decision. |
| Raw review coverage is missing, partial, or stale | `hard-stop` | Review evidence completeness and byte/profile attribution. | Rebuild the current projection, then rerun the same review checkpoint. |
| Preset/compiler/runtime assertions contradict their own contract | `hard-stop` | Framework integrity; source editing cannot repair it. | Repair the owning framework contract, then rerun the failed checkpoint. |

There is no force or waiver for an identity, integrity, authorization, or
evidence-completeness failure. The raw-review `confirm` never substitutes for
missing coverage and does not make incomplete evidence complete. This plan
does not alter the accepted decision record/schema. `Proceed` on complete and
current evidence is the human evaluator's content judgment, not a waiver of a
known failed deterministic check. If a future change permits continuation
despite a known reversible warning, that new continuation must be version-bound
and carry the normalized human reason required by policy.

### Net simplification admission

The new browser checkpoint is admitted because it removes more control than it
adds:

1. **Direct facts:** current source receipt/Text Frame, normalized preset,
   checked-in font render inventory, pinned runtime profile, and accepted raw
   bytes are the owning facts.
2. **Real uncovered failure:** the heuristic can approve text that the actual
   browser overflows; the final compositor currently renders a different frame.
3. **Complexity removed:** delete heuristic authorization authority, duplicate
   hard-coded CSS, caller-trusted `preflight`, public arbitrary `compose`, and
   raw-plan rebuild/write on every lifecycle command.
4. **One recovery per root:** each independent root maps to exactly one of
   source edit, environment repair, fresh plan, exact authorization, Generated
   Image Rebuild, fresh review projection, or framework repair; each then
   returns to the same failed checkpoint.
5. **Focused negative proof:** prerequisite short-circuiting, no wrong-owner
   write/provider call, bounded diagnostics, no bypass/fallback, and successful
   same-check rerun are all required tests.

One internal layout evaluator is reused by plan-time verification and final
composition. It runs at both boundaries because their direct facts differ in
time and final composition additionally owns accepted underlay bytes; this is
not two competing pass/fail authorities.

No page-specific layout result is durable. Only the canonical profile digest
is bound into the existing raw contract/hash lineage because later invocations
must detect profile drift. Raw review enriches its existing coverage owner; it
does not create another ledger.

Durable-state discipline is explicit:

| Binding | Owner/writer | Readers | Freshness and removal path |
| --- | --- | --- | --- |
| `render_profile_digest` inside the Framed raw-contract lineage | Framed adapter during post-proof plan materialization | Current-plan validation, refresh classification, raw-review contribution, and finalization | Recompute from direct profile facts; mismatch makes derived evidence stale and the owner rebuild replaces it. |
| Raw-review coverage/profile binding | Existing shared target raw-review owner | Review decision validation and finalization | Rebuild the projection/coverage through that owner; never copy or hand-edit it. |
| Page layout proof | No durable owner or writer | Recomputed only at plan and final composition | Nothing to migrate/remove; rerun the same evaluator. |

The future design must not add another field without naming its owner, writer,
readers, freshness rule, and owner-controlled invalidation/removal path.

Prerequisites short-circuit derived checks:

```text
source identity/schema
  -> preset + font inventory + runtime readiness
  -> one browser layout evaluator
  -> post-success source/state/raw-plan materialization
```

If an earlier authority is invalid or readiness is unknown, no browser-derived
symptom, provider call, retry, fallback, or state write follows. Once shared
prerequisites pass, the batch may report a bounded set of independent
page/field fit failures, each with the same source-repair action.

## Domain Vocabulary

### Preset

A preset is declarative visual data: canvas, variants, panel rectangles,
field rectangles, typography, palette, line limits, and raw safe zones. It
does not contain HTML, browser results, runtime facts, or source literals.

Normalize `standard-v1` before treating it as authoritative:

- keep panel fill/opacity once, not both in theme and every panel;
- remove the unused border fact unless the renderer actually draws it;
- remove panel padding because fields already use absolute geometry and the
  current callout padding disagrees with those coordinates;
- keep rectangles and field geometry as the explicit source of layout truth.

The normalized preset gets a new digest. Compatibility is not a reason to hash
known duplicate or unused data forever.

### Render profile

A render profile is the stable identity of everything that can change how a
preset becomes pixels:

```text
render profile = normalized preset digest
               + layout compiler schema/version
               + checked-in font render-inventory digest
               + font-selection algorithm identity
               + pinned Chromium/Playwright identity
               + capture profile identity
```

Its canonical JSON produces `render_profile_digest`. It excludes source text,
per-page line measurements, selected per-page font shards, underlay bytes, and
final PNG bytes. Otherwise an ordinary Text Frame edit could spuriously become
raw-generation debt.

The profile must use stable owned identities, not an absolute executable path
or host-specific temporary value. Missing or mismatched installed runtime
facts are readiness failures against the profile, not inputs that silently
create a different profile.

This is specifically the **Framed final-pixel render profile**. It is distinct
from the provider generation profile (`provider_profile_sha256`) and the raw
review contact sheet's projection/capture profile. Each identity has one owner
and one purpose; none is renamed or reused as an alias for another.

### Layout proof

A layout proof is a page-specific browser observation derived from current
Text Frame literals and the current render profile. It proves geometry, lines,
overflow, and actual custom-font use. It is recomputed at plan time and final
composition and is not persisted as a new approval or lifecycle artifact.

### Derived output

The raw plan, authorization, accepted underlay, final PNG/manifest, projection,
PPTX, notes, and delivery receipt remain existing owner-produced artifacts.
Their current hash chain must transitively bind the render profile through the
Framed raw contract.

## Authority And Identity Flow

For each Framed slide:

```text
source receipt Text Frame -----+
                               |
normalized standard-v1 --------+--> describeFrame()
font inventory + runtime IDs --+          |
                                          +--> raw-contract contribution
                                          |       + render_profile_digest
                                          |       + safe zones
                                          |
                                          +--> verifyFrames() [ephemeral]
                                                       |
                                                       v
                                      materialized raw plan and exact hash
                                                       |
                                                       v
                                    authorization -> raw -> human review
                                                       |
accepted raw bytes + current Text Frame ----------------+
                                                       v
                                               composePages()
                                                       |
                                                       v
                                             final PNG/manifest
```

The raw contract retains the preset name, normalized canvas, and reserved
underlay rectangles because the provider and human reviewer need those facts.
It also binds `render_profile_digest`; the profile itself binds the preset
digest. No independent caller-supplied digest is trusted.

## Deep Module Boundary

Introduce `scripts/03-framed-image/internal/framed_render_contract.mjs`. Its
small conceptual interface is:

```text
describeFrame(textFrame)
verifyFrames([{ slideId, textFrame }])
composePages([{ slideId, textFrame, verifiedRaw }])
```

Exact return shapes belong to implementation design, but these responsibilities
do not:

- `describeFrame` validates literals and code-point coverage, resolves the
  normalized variant, derives safe zones and the render-profile binding, and
  returns deterministic contract facts without launching a browser.
- `verifyFrames` launches the pinned runtime once for a bounded batch, builds
  each self-contained page, and either accepts the whole batch or returns
  bounded page/field diagnostics. Its observations are ephemeral.
- `composePages` validates accepted underlay bytes, renders the same documents
  with those bytes, repeats layout/font checks, and returns final PNG bytes
  only after the whole batch succeeds.

The module hides HTML generation, escaping, CSS, data-URI encoding, font-shard
selection, DOM evaluation, geometry tolerances, network denial, capture scale,
and browser lifecycle. Callers cannot supply markup, CSS, font paths, capture
options, a trusted `preflight` object, or an alternate compositor.

The existing setup/font owner may expose a narrow private helper for canonical
font inventory and code-point-to-shard selection. Framed consumes that owner;
it does not fork font metadata or accept arbitrary filesystem assets.

Test substitution belongs below the public Framed workflow, such as a private
browser-launch or capture dependency. Public APIs must exercise the unique
owner path and must not expose the current arbitrary `compose` callback.

A bounded batch means the current plan's ordered Framed slides, one pinned
browser process, controlled page/context reuse, an existing per-page timeout,
and an explicit total operation limit. It does not mean unbounded concurrency,
one browser per field, or a long-lived daemon.

## Font Contract

Each self-contained page embeds only WOFF2 faces selected for the code points
that actually appear. It must not use `local()` or a system-font fallback as a
successful path.

Validation separates three facts:

1. A source literal containing a code point not covered by the checked-in
   inventory fails source validation with the field name and a bounded list of
   `U+XXXX` values. Coverage is a code-point fact; diagnostics must not claim
   broad language support.
2. Expected font families are derived from the faces selected for the actual
   glyphs. A Latin-only page does not fail because no Han face was used, while
   a page selecting a Han face must prove that face was used.
3. A missing/corrupt font file, unavailable pinned runtime, or failed font load
   is an `environment` readiness failure. Any actual noncustom fallback with a
   positive rendered glyph count in a Text Frame leaf fails closed.

The font render-inventory digest covers all permitted checked-in face bytes and
pixel-relevant metadata: canonical face identity, family, style, weight,
unicode ranges, and content hash. Legal/provenance text, source URLs, host
paths, and other non-rendering metadata remain integrity/readiness facts but do
not create pixel invalidation. The selected subset is a deterministic page
derivation and therefore does not change the render-profile identity when text
changes.

The layout compiler uses an explicit versioned identity. Any pixel-affecting
compiler change must bump it, with profile fixtures/coherence tests guarding
that obligation; incidental host paths never participate in the digest.

## Browser Layout Contract

The compiler emits fixed-size elements from preset coordinates. Verification
uses DOM facts that correspond to CSS layout:

- the slide canvas and every present panel have the expected rectangle;
- every present field container has its exact preset rectangle;
- `scrollWidth` and `scrollHeight` remain within the field's usable dimensions
  under a small documented device-pixel tolerance;
- text `Range` fragments are grouped by their y coordinate to count rendered
  lines, and the count does not exceed `max_lines`;
- every expected leaf marker exists exactly once and is visibly rendered;
- panel rectangles are contained by the corresponding reserved underlay safe
  zones;
- CDP/runtime evidence reports only the selected custom font families for
  actual text leaves;
- the page makes no forbidden network request and captures exactly 2000x1125.

Raw `Range.getClientRects()` glyph boxes are useful for grouping lines but are
not required to remain inside the CSS field rectangle. Font ink and browser
rounding can legitimately extend beyond the layout box; field scroll geometry
is the overflow authority.

The current estimated glyph-width preflight must not authorize or reject raw
work. Cheap synchronous checks may remain for source grammar and code-point
coverage, but actual Chromium layout is the fit authority.

## Lifecycle Integration

### Plan command

`image2 plan` becomes an ordered transaction:

1. Read and resolve current source/registry facts into a candidate receipt
   through a new read-only source-resolution path. Do not initialize/advance
   source state or write the source receipt.
2. Compile all Framed descriptions, raw contracts, provider requests, and the
   candidate plan in memory.
3. Verify all Text Frames in one bounded Chromium batch.
4. If every page passes, commit the exact candidate source receipt/state and
   raw plan through their existing owners, then return the exact plan hash.
   If any page fails, write no source receipt, state, raw plan, authorization,
   provider, review, accepted-raw, or final artifact.

Current `resolveTargetSourceContext()` writes the source receipt and may
initialize or advance state before compilation. It cannot be reused as the
read-only candidate path. Materialization may still use its state/receipt
owners after verification, but it must publish a raw plan only when that plan
binds the just-committed receipt and source epoch. A partial filesystem failure
must remain fail-closed and rerunnable; it must never leave an authorizable
plan bound to a different source tuple.

### Later raw lifecycle commands

Authorize, generate, prepare review, decide review, and accept must load the
already-materialized plan. They recompile deterministic current contract/profile
facts in memory as needed and validate the stored plan, current source receipt,
profile digest, and exact plan hash. They do not rewrite the plan and do not
rerun Chromium layout proof.

That validation uses the same read-only current-source/plan context. Source
changes after planning fail stale and require a fresh `image2 plan`; a later
command must not advance the source epoch as a side effect of discovering
drift.

This removes the current pattern where every command calls a plan builder that
also writes the plan.

### Final composition

Finalization loads exact accepted underlay evidence and calls `composePages`
for the bounded set. The renderer repeats the same geometry/font assertions
while capturing final bytes. A failure publishes no partial final manifest or
delivery artifact. Successful bytes continue through the existing shared final
manifest and delivery owners; no new durable proof schema is introduced.

### Text-only and notes-only refresh

A Text Frame-only edit remains provider-free when slide order, visual/raw
contract, safe zones, provider profile, and render profile are unchanged and
exact accepted underlay evidence is current. The refreshed text is validated
and proved during local final composition before publication.

Notes-only refresh does not launch Chromium. It must still reject pixel-owning
source drift and profile drift through the current owner. Structural edits or
workflow changes continue to require preview plus exact Structural Versioning
plan hash.

## Invalidation Policy

Any change to normalized preset facts, compiler identity, allowed font
inventory, font-selection algorithm, pinned runtime identity, or capture
profile changes `render_profile_digest`. That change invalidates affected
Framed raw plans, authorization, raw review, accepted raw evidence, final
manifest, and delivery derivatives through existing hash/owner checks.

The recovery is the existing generated-image rebuild path. Do not silently
rebind old accepted underlays even when their safe-zone rectangles happen to
be unchanged. A future optimization may introduce separately reasoned
underlay-contract and render-profile identities, but that is intentionally out
of this change.

Text literals and their selected shard subset do not change the profile and do
not by themselves create provider debt. Underlay-owning visual facts, safe
zones, provider profile, slide order, and workflow retain their current
invalidation rules.

## Compatibility, Idempotency, And Recovery

The run-bundle contract impact is `compatible`, not a source/state migration.
Source grammar, version workflow, slide identity, state ownership, and existing
provider authorization boundary remain unchanged. The deliberate compatibility
cost is that a new render-profile digest makes old Framed derived evidence
stale; the selected run repairs that fact through Generated Image Rebuild.

There is no bulk deck migration, automatic underlay rebind, or hand edit of
`_generated/`. Unselected production decks are not opened or rewritten.

For unchanged direct facts, candidate compilation/profile construction is
deterministic, plan verification is recomputable, and rerunning a successful
plan yields the same canonical plan identity. Post-proof materialization uses
the existing exact owners. A partial write remains non-authorizable and is
repaired by rerunning the same plan checkpoint; no parallel journal or success
record is introduced.

Rollback does not reinterpret artifacts across profile identities. If code is
reverted, artifacts are consumed only when they validate against that code's
current contract; otherwise the owning rebuild path remains the recovery.

## Raw Review Boundary

Browser proof can establish local typography and safe-zone geometry. It cannot
reliably establish that a generated underlay contains no readable text or is
visually suitable. Human raw review remains the owner of those judgments; no
OCR or automatic acceptance is added.

The generic raw-review projection must nevertheless show the Framed reserved
safe-zone guides and `position + formal slide_id + title`. Current v2 review
shows only images and IDs and omits the accepted projection/capture-profile
coverage.

Preserve ownership with a typed projection contribution:

```text
selected workflow adapter
  -> generic review contribution
       { slide identity, overlay primitives, workflow profile digest }
  -> shared raw-review owner
       { exact raw bytes, generic labels, contribution digest,
         raw-review projection/capture profile }
  -> projection PNG + coverage + human decision
```

For Framed, the adapter converts its reserved rectangles into generic guide
primitives and contributes `render_profile_digest`. The shared owner validates
and renders rectangles without parsing Text Frame literals or branching on
Framed semantics. Its own canonical projection-profile digest identifies
contact-sheet layout, guide rendering, labels, and capture behavior. Coverage
binds both identities rather than conflating either one with the provider
generation profile.

Restoring those accepted contract facts is a separate shared-owner change,
not a hidden side effect of the Framed renderer.

## Pilot Run Dependency Boundary

The progressive production UX in
[pilot-run-plan.md](pilot-run-plan.md) depends on this render contract but does
not belong inside the renderer module.

A Framed Pilot Run must compose its representative unreviewed underlays through
the same private compiler, font selection, browser evaluator, and capture
profile used by final composition. It may publish preview-only pilot bytes and
evidence, but it cannot publish accepted raw evidence, a final manifest, PPTX,
notes, or delivery state. This makes the early sample production-equivalent
without creating another renderer or a finalization bypass.

The renderer remains unaware of pilot selection, human decisions, batch
authorization, and expansion. Those facts belong to the selected Framed
Controller and existing shared raw/state owners. Pure Pilot Run does not import
this module at all; its provider bytes already own the final page pixels.

Therefore implementation order is strict: accept and archive this render
contract first, restore the shared raw-review contribution contract second,
then let the later Pilot Run change consume both. A pilot implemented against
the current dark Arial compositor would expose early feedback but still ask the
human to judge pixels that are not the declared Framed contract.

## Diagnostic Ownership

Use the existing producer-owned CLI diagnostic envelope and
`scripts/shared/cli/cli_error.mjs`. At minimum, distinguish:

- `source_validation`: invalid literal, unsupported code point, variant
  mismatch, or a non-fitting text field;
- `environment`: missing Playwright/Chromium, runtime identity mismatch, missing
  or corrupt font shard, font load failure, or capture readiness failure;
- `internal`: preset/compiler panel, field, safe-zone, leaf, or
  capture-geometry mismatch that source editing cannot repair;
- stale evidence: current source/profile/plan no longer matches persisted raw
  lifecycle artifacts.

Layout/runtime failures before a provider call are never categorized as
generic `provider` errors. The MD Controller consumes the producer result and
must not copy its schema.

Direct `env-check.mjs` must retain its zero-static-npm-dependency startup path.
It may dynamically load profile/font/browser readiness only after package
presence checks pass; a missing `node_modules` remains a normal actionable
environment report rather than a module-load crash.

## Deliberate Deferrals

- More presets or author-facing style configuration.
- Durable DOM/layout proof artifacts.
- OCR or automatic raw-underlay semantic validation.
- Cross-profile accepted-underlay reuse.
- Per-slide workflow mixing.
- Claims of language support based only on Unicode coverage.

These are separate product or architecture decisions, not hidden follow-up
requirements for this correction.
