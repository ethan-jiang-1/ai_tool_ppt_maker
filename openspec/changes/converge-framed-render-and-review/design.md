## Context

See [proposal.md](proposal.md) for motivation. The current Framed path has four relevant shapes:

1. `text_frame.mjs` owns a light `standard-v1` preset and an estimated-width preflight.
2. `framed_composition.mjs` independently emits dark Arial CSS and trusts caller-supplied preflight.
3. `resolveTargetSourceContext()` initializes or advances state and writes the source receipt before raw-plan compilation can fail; each later lifecycle command rebuilds and rewrites the plan.
4. Shared raw review renders only images and `slide_id`, while accepted specs already require safe-zone/profile-aware Page Authority evidence.

The retained Playwright runtime and checked-in Source Sans 3/Noto Sans SC inventory already provide the
necessary local primitives. This design reassigns and composes those existing owners; it does not add a
browser dependency, a new workflow, or a new user decision.

## Goals / Non-Goals

**Goals:**

- Make one normalized preset and one compiler explain raw geometry, plan-time fit, pilot-ready preview pixels, and final pixels.
- Make browser proof a precondition of materialized, authorizable Framed raw plans without persisting page proofs.
- Preserve stored-plan identity across authorize/generate/review/accept instead of rebuilding it at every command.
- Restore complete raw-review evidence through typed, semantics-blind shared mechanics.
- Keep Text Frame-only refresh provider-free and notes-only refresh browser-free when their direct prerequisites remain current.
- Give each independent failure one owner, one bounded diagnostic outcome, and one same-check recovery action.

**Non-Goals:**

- Add presets, user CSS/HTML/capture controls, system-font fallback, per-slide workflow selection, OCR, automatic visual acceptance, or cross-profile underlay reuse.
- Persist DOM/layout observations, introduce another approval/waiver, or add a second plan/review/state ledger.
- Introduce Style Master feedback, exact generation batches, item attempts/materializations, Pilot Run, or Expansion.
- Migrate, inspect, or rewrite production `deck_*` bundles during framework maintenance.

## Decisions

### 1. Normalize `standard-v1` before assigning profile identity

`text_frame.mjs` remains the Framed preset owner, but its exported canonical data is normalized before
hashing or compilation:

- panel opacity exists once rather than in both theme and every panel;
- an unrendered border is removed;
- panel padding is removed because fields already own absolute geometry;
- panel, field, typography, palette, line-limit, and reserved-underlay rectangles remain explicit facts.

The new normalized digest intentionally differs from the current digest. Retaining duplicate or
unconsumed fields only to preserve an old hash would make accidental representation part of the pixel
contract.

`render_profile_digest` is canonical JSON over:

```text
normalized preset digest
  + layout compiler schema/version
  + checked-in font render-inventory digest
  + font-selection algorithm identity
  + pinned Playwright/Chromium identity
  + capture profile identity
```

It excludes Text Frame literals, page measurements, selected per-page shard lists, underlay/final
bytes, executable paths, temporary directories, and other host facts. A compiler fixture and coherence
test require a compiler-version change whenever pixel-producing logic changes.

Alternative considered: include source text or selected shards in the profile. Rejected because both
are deterministic page inputs; including them would incorrectly convert ordinary Text Frame edits into
provider-generation debt.

### 2. One private deep module owns description, proof, and pixels

Introduce `scripts/03-framed-image/internal/framed_render_contract.mjs` with a small conceptual API:

```text
describeFrame(textFrame)
verifyFrames([{ slideId, textFrame }])
composePages([{ slideId, textFrame, verifiedRaw }])
```

The exact return records may evolve during implementation, but ownership does not:

- `describeFrame` performs literal/variant/code-point checks and derives normalized preset, safe-zone, and render-profile facts without starting a browser.
- `verifyFrames` compiles self-contained pages and evaluates one ordered bounded batch under one pinned browser process. Observations are ephemeral.
- `composePages` verifies accepted underlay bytes, compiles the same documents, repeats layout/font checks, captures final PNG bytes, and returns only after the whole batch succeeds.

The module hides escaping, markup, CSS, data URIs, font selection, DOM evaluation, tolerances, network
denial, capture scale, timeout, and browser lifecycle. Public workflow functions no longer accept a
preflight record or arbitrary `compose` callback. Test substitution stays below this boundary at a
private browser-launch/capture seam.

Alternative considered: retain estimated preflight as a fast authorization gate and use Chromium only
at finalization. Rejected by the observed false acceptance and because it preserves two competing
answers to the same fit question.

### 3. The browser evaluator checks layout boxes, not font ink

Each compiled page uses fixed preset coordinates and only selected checked-in WOFF2 faces. The browser
evaluator checks:

- exact slide, present panel, and present field rectangles within a documented device-pixel tolerance;
- field `scrollWidth`/`scrollHeight` against usable dimensions;
- rendered line count by grouping `Range` fragments on y coordinates;
- exactly one visible marker for every expected text leaf;
- panel containment by the corresponding reserved-underlay rectangles;
- selected custom-family use for every rendered leaf with glyphs;
- zero forbidden network activity and exact 2000x1125 output geometry.

It does not require raw glyph rectangles to remain inside the CSS field rectangle because browser
rounding and font ink may extend beyond the layout box without overflow. Scroll geometry and line
count remain the fit authority.

The setup/font owner exposes a narrow internal mapping from actual code points to checked-in faces.
Unsupported code points fail as `source_validation`; missing or invalid selected files and font-load
failure fail as `environment`; any rendered noncustom fallback fails closed. Only the needed shards are
embedded, avoiding the roughly full-inventory payload on every page.

Alternative considered: embed all font files or allow system fallback. The former creates unnecessary
page weight; the latter makes pixels host-dependent and unprovable.

### 4. Plan becomes proof followed by a fail-closed commit

Add a read-only candidate source resolver that parses current source bytes and selected workflow facts
without initializing/advancing state or writing a receipt. Framed planning becomes:

```text
read/parse candidate source
  -> describe every frame and compile the complete raw plan in memory
  -> verify one bounded browser batch
  -> commit source state/receipt through existing owners
  -> write the plan bound to that exact receipt/epoch
  -> return the exact plan hash
```

No persistent artifact is written before proof succeeds. The existing state/receipt/plan owners remain
the only writers. If a filesystem failure occurs during the post-proof commit, any incomplete tuple is
not authorizable: plan loading requires all exact state, receipt, profile, and hash bindings. Recovery
is rerunning the same `image2 plan` checkpoint; no parallel journal or synthetic success record is
added.

Authorize, generate, prepare-review, decide-review, accept, and delivery load a read-only current-plan
context. They deterministically recompile contract/profile facts in memory and compare them with the
stored plan, but do not launch Chromium, rewrite the plan, or advance source state when drift is found.

Alternative considered: run browser proof inside the existing plan builder. Rejected because the
builder is called by every lifecycle command and currently mutates source state before compilation,
causing redundant browser work and wrong-time writes.

### 5. Render profile binds raw lineage; layout proof does not persist

Each Framed raw contract receives `render_profile_digest`; the existing raw-plan hash then binds it
transitively into authorization, raw review, accepted raw evidence, final manifest, and delivery
derivatives. The persistent facts are limited to identities later invocations cannot otherwise compare:

| Fact | Owner/writer | Readers | Freshness/removal |
| --- | --- | --- | --- |
| Framed render-profile digest inside raw contract | Framed adapter during successful plan materialization | plan validation, refresh, review contribution, finalization | recompute from direct profile facts; mismatch makes derivatives stale and owner rebuild replaces them |
| Raw-review coverage/profile binding | existing shared target raw-review owner | review decision validation and finalization | rebuild projection/coverage through the same owner |
| Page layout proof | no durable writer | plan and finalization only, in memory | recompute with the same evaluator |

Profile drift takes the existing Generated Image Rebuild path even when old underlay geometry appears
unchanged. This is conservative but avoids inventing a second underlay-only identity in this change.

### 6. Raw review consumes typed ephemeral contributions

The selected workflow adapter produces an in-memory generic contribution:

```text
{
  ordered slide identity labels,
  generic overlay primitives,
  workflow profile contribution digest
}
```

For Framed, the contribution contains reserved rectangles and binds `render_profile_digest`. For Pure,
it contains no Text Frame or safe-zone semantics. Shared raw-review mechanics validate and draw generic
labels/primitives but do not parse workflow literals or branch on Framed/Pure meaning.

The shared owner separately canonicalizes its projection/capture profile, covering contact-sheet
layout, guide rendering, labels, and capture behavior. Review coverage binds exact raw PNG hashes,
workflow contribution digest, and projection/capture-profile digest. It writes the existing projection
PNG and review/coverage record; it does not persist the contribution as another artifact.

Labels use current `position + formal slide_id + title`. Position is a snapshot projection; stable ID
continues to own byte identity. Complete/current evidence with no decision remains the existing human
`confirm`; incomplete evidence stops before asking the human.

Alternative considered: let shared review understand Text Frame objects directly. Rejected because it
would move Framed semantics into shared mechanics and create a second workflow owner.

### 7. Refresh follows final-pixel ownership

For a Text Frame-only edit, the Framed local-compose resolver compares the previous and candidate raw
contract/profile facts. If underlay bytes, safe zones, provider profile, workflow, order, and render
profile remain exact, final composition evaluates the new text and then the existing owner rebinds the
accepted raw tuple to the new current source. It performs no provider call.

Preset/compiler/font/runtime/capture drift invalidates the render profile and therefore cannot use
local rebind. Notes-only refresh bypasses the browser only when all pixel-owning facts remain current.
Structural edits and workflow changes continue through preview plus exact Structural Versioning plan
hash.

### 8. Gate, diagnostic, and responsibility ownership stay direct

The outcome mapping is:

| Earliest fact | Outcome | Protected invariant | One nearest action |
| --- | --- | --- | --- |
| Doctor observes a repairable local package/runtime prerequisite | `guide` | production remains closed; no evidence is waived | repair through environment owner, rerun doctor |
| Invalid literal, variant, unsupported code point, or browser-proven text overflow | `hard-stop` / `source_validation` | final-pixel integrity before authorization | repair current Text Frame, rerun `image2 plan` |
| Missing/mismatched browser or font readiness | `hard-stop` / `environment` | unknown layout cannot become an authorizable plan | repair environment, rerun same checkpoint |
| Preset/compiler/capture assertions contradict their own contract | `hard-stop` / `internal` | framework integrity | repair framework owner, rerun failed checkpoint |
| Current source/profile/stored-plan or evidence drift | `hard-stop` / owning artifact category | identity, provenance, recoverability | rebuild through the named owner, rerun same checkpoint |
| Complete/current raw projection with no decision | existing `confirm` | visual/content quality belongs to human | show evidence and request existing decision |
| Missing/partial/stale review coverage | `hard-stop` | evidence completeness | rebuild projection through raw-review owner |

Identity, integrity, authorization, and evidence-completeness failures have no force or waiver. The CLI
producer maps these roots into the existing envelope and action vocabulary; the MD Controller consumes
the structured result without duplicating category or field rules.

Human, Agent, and runtime responsibilities remain:

- Human: Text Frame meaning and generated-underlay visual/content judgment.
- Agent/MD Controller: present current owner evidence, perform authorized mechanical repair, rerun the same checkpoint, and stop only for the true human decision or missing external authority.
- JS/runtime: parse, construct identities, evaluate layout, write exact artifacts/state, invalidate evidence, and produce diagnostics.

### 9. The new control removes more than it adds

The browser checkpoint is admitted because one evaluator replaces:

- estimated-width authorization;
- independent compositor CSS;
- caller-attested preflight;
- public arbitrary composition substitution;
- plan rebuild/write behavior repeated by later lifecycle commands.

Prerequisite order is fixed:

```text
source identity/schema
  -> normalized preset + font inventory
  -> pinned runtime readiness
  -> one browser batch
  -> exact owner materialization
```

Earlier failures short-circuit all derived symptoms. Once shared prerequisites pass, independent
page/field failures may be returned as one bounded set because all have the same source-repair action.

### 10. Verification is layered by boundary

- **Unit:** preset normalization; canonical profile stability and invalidation; font inventory and code-point selection; typed contribution canonicalization; refresh classification.
- **Private browser:** both callout variants; Latin, Simplified Chinese, and mixed supported text; the known 28-`W` false acceptance; long tokens, extra lines, scroll overflow, panel/field/marker mismatch, font fallback, denied network, wrong capture size, timeout, and cleanup.
- **Integration:** proof-before-write transaction; one browser launch per plan/final batch; zero launches for later raw commands and notes-only refresh; zero provider submissions on all earlier failures; stored-plan drift; final all-or-nothing publication; raw-review labels, guides, and dual profile coverage.
- **Mock E2E:** independent current Framed and Pure target journeys, raw review, repair-and-rerun, provider-free Framed text refresh, and no sibling workflow dispatch.
- **Regression:** focused Framed suite, shared Image2/state/CLI suites, `npm test`, strict OpenSpec validation, and terminology/ownership scans.

Tests use repository fixtures or temporary run bundles. Production `deck_*` directories are not read,
modified, or copied into fixtures.

## Risks / Trade-offs

- **[Browser proof increases plan latency]** -> Verify the bounded ordered batch in one browser process, keep later lifecycle commands browser-free, and enforce per-page plus total operation limits.
- **[Canonical profile misses a pixel-relevant input]** -> Centralize construction, require compiler-version coherence fixtures, and test every listed input for digest invalidation.
- **[Font evidence varies by glyph selection]** -> Derive expected families from actual selected faces and fail any rendered noncustom fallback; do not infer language support.
- **[Post-proof filesystem failure leaves a partial tuple]** -> Authorization requires exact state/receipt/plan bindings, so the tuple remains unusable; rerun the same owner checkpoint without adding another journal.
- **[Raw-review integration leaks Framed semantics into shared code]** -> Restrict the adapter interface to canonical generic primitives and test Pure for absence of Framed fields/branches.
- **[Conservative profile invalidation repeats paid underlay work]** -> Accept this compatibility cost now; underlay/render identity splitting is a separately justified future optimization.
- **[Existing Framed evidence becomes stale after rollout]** -> Report the single Generated Image Rebuild action for a user-selected run; never scan or rewrite production data automatically.

## Migration Plan

1. Add normalized preset/profile/font-selection contracts and tests without changing provider behavior.
2. Add the private compiler/evaluator and prove parity for both frame variants; keep it below public workflow interfaces.
3. Introduce read-only candidate source resolution and proof-before-materialization; switch later commands to stored-plan loading.
4. Bind render profile into Framed raw contracts and refresh/finalization invalidation.
5. Add typed raw-review contributions and migrate the existing review record through its owner to the new coverage identity when rebuilt.
6. Remove heuristic authorization, duplicate compositor CSS, public preflight/compose bypasses, and repeated plan writes only after replacement tests pass.
7. Run focused, browser, integration, mock-E2E, full regression, strict OpenSpec validation, and ownership scans before sync/archive.

Run-bundle impact is compatible: source grammar and selected workflow do not change. Existing derived
Framed evidence is not rewritten; the first operation that evaluates it under the new profile reports
staleness and the Generated Image Rebuild action. Rollback is release-level and never reinterprets
artifacts across profile identities: current code consumes an artifact only if its current contract
validates it, otherwise the owning rebuild path remains required.
