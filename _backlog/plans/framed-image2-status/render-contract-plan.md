# Framed Render Contract Design

> Companion to [README.md](README.md) | Status: draft | Updated: 2026-07-30

## Problem To Solve

The current `standard-v1` data model declares geometry, colors, and Source
Sans 3/Noto Sans SC, while the private compositor independently hard-codes a
different dark Arial layout. The source receipt and raw contract therefore
describe a frame the final pixels do not necessarily use.

The required invariant is:

> A Framed page may enter raw authorization only when its declared Text Frame
> fits the exact self-contained renderer that will later compose the final PNG.

The existing source receipt remains the direct Source of Record for text. The
selected `03-framed-image` workflow owns the new check; shared raw mechanics
continue to receive only typed raw-plan hashes and do not interpret Framed
semantics.

## Shape Of The Module

Introduce one private `standard_v1_layout` module within
`scripts/03-framed-image/internal/`. Its external seam is intentionally small:

```text
typed Text Frame + verified underlay (only for final composition)
                         |
                         v
              standard_v1_layout module
                         |
       +-----------------+------------------+
       |                 |                  |
       v                 v                  v
 preset-derived      self-contained      expected panels,
 raw safe zones      page document       leaves, and fonts
       |                 |                  |
       +---------> browser verifier <-------+
                         |
                         v
            pre-authorization result / final PNG
```

The module's interface should accept only typed `text_frame` fields plus an
optional already-verified underlay data URI. It returns the self-contained
document and the expected panel, leaf, font, and safe-zone facts. It must not
accept user CSS, HTML, arbitrary asset paths, or capture settings.

This is a deep module: HTML generation, escaping, data-URI handling,
font-shard selection, CSS derivation, and geometry comparisons remain inside
one implementation. `preflightFramedTextFrame` and
`composePageAuthorityFramedPage` become its two consumers rather than each
redefining parts of the same layout.

## Key Design Decisions

### 1. Keep one preset, do not add configuration

Use the current `standard-v1` values as the initial visual contract, then make
the renderer faithfully emit them. The user-facing source remains only
`kicker`, `title`, `subtitle`, and optional `callout`; no CSS or layout override
fields are added.

This removes the current duplicate renderer definition instead of adding a
second styling layer. A future preset is a separate product decision because it
changes raw safe zones and the output aesthetic.

### 2. Verify with the actual browser before provider authorization

Keep the current synchronous structural preflight for malformed source and
obvious invalid literals. Add an asynchronous private layout verification when
the Framed raw plan is compiled, before the plan is offered for authorization.
It loads the exact self-contained document in the pinned Chromium runtime and
proves that:

- every present text leaf is visible and contained by its declared field;
- each panel matches its declared rectangle;
- text ranges do not exceed the allowed line count or field bounds;
- the declared Source Sans 3 and Noto Sans SC custom fonts are actually used;
- the text panels are contained by the reserved text-free raw rectangles.

This is a hard-stop before a nonzero submission. The direct failed fact is the
current Text Frame's inability to fit the current preset; the single recovery
action is to shorten/edit its source fields and rerun `image2 plan`. It creates
no provider authorization, raw evidence, or derived final artifact.

Do not add a second persistent gate or an approval state. The check is part of
the existing selected-workflow raw-plan checkpoint and its facts can be
recomputed from the receipt, preset, font bundle, and pinned runtime.

### 3. Emit self-contained, verified bundled fonts

The current font bundle is authoritative but its runtime smoke fixture is not a
deck page. Extend its owned implementation with a narrowly scoped helper that
selects the required checked-in WOFF2 faces for a frame's actual code points
and emits `@font-face` rules with data URIs. The Framed layout module consumes
that helper; it does not read arbitrary font paths or use `local()`/system
fallbacks.

Use the capture runtime's existing `fontRoles` and CDP font evidence to require
custom platform fonts for both relevant roles. The exact font-selection and
data-URI mechanics are private implementation details, not a caller-facing
adapter.

### 4. Recheck at final composition, without new state

Final composition invokes the same layout verifier with the verified raw PNG
and fails before manifest publication on any mismatch. Its output remains the
existing final PNG and final-manifest schema; the captured pixel hash plus the
existing preset/raw-contract digests preserve lineage without adding duplicate
state for a recomputable DOM projection.

The `standard-v1` digest remains in the Framed raw contract. A change to panel
or safe-zone data changes that digest, invalidates the raw contract, and routes
the edit through the existing authorized raw rebuild path. Text-only changes
retain the current local-compose behavior only when that exact contract and
accepted raw evidence still match.

### 5. Leave raw-image semantic judgment human-owned

Automated layout verification can prove local typography and safe-zone
placement. It cannot reliably determine whether a generative underlay contains
unwanted text or visually unsuitable content. Do not add OCR in this change;
the existing human raw review is the appropriate owner for that judgment.

## Work Breakdown

| Slice | Owner and files | Observable completion |
| --- | --- | --- |
| 1. Contract | `03-framed-image`: preset/layout/compositor | No hard-coded frame values remain outside `standard-v1`; generated page uses preset geometry and theme. |
| 2. Fonts | `00-setup` font bundle plus Framed private layout | Actual Framed pages load only selected bundled WOFF2 data URIs; CDP proves custom Latin/Han font use. |
| 3. Gate | `03-framed-image` raw-plan compiler and existing runtime | Layout failure is an owner-issued pre-authorization hard-stop with one repair action and no provider call/state write. |
| 4. Finalization | `03-framed-image` compositor | Finalization rechecks exact layout before it publishes final bytes; no changes to Pure or shared manifest schema. |
| 5. Tests | `tests/03-framed-image`, `tests/00-setup`, `tests_e2e/shared/workflow` | Bilingual, wrap, overflow, callout, font use, no-provider failure, raw rebuild, and current lifecycle behavior are demonstrated. |
| 6. Specs | Existing OpenSpec capabilities | Requirements and the stale homogeneous/mixed wording match executable behavior. |

## Test Strategy

Unit and integration tests:

- Pure layout generation uses the exact preset rectangles and colors for both
  callout variants.
- Font selection covers Latin, Simplified Chinese, and mixed strings; an
  unavailable character or malformed bundle fails closed.
- Browser verification accepts fitting English, Chinese, and mixed text; it
  rejects overlong unbreakable tokens, third-line titles, field overflow,
  wrong font use, and panel/safe-zone mismatch.
- A Framed plan with failed layout performs zero provider submissions and does
  not write authorization, accepted raw evidence, final manifest, or delivery
  state.
- Existing text-only local refresh remains provider-free when all contract
  facts are unchanged. A changed frame preset/safe zone requires raw rebuild.

Mock E2E:

- A valid bilingual Framed version runs plan through delivery and emits a
  2000x1125 final PNG using custom-font evidence.
- A title-only refresh preserves raw bytes and makes zero new provider calls.
- An underlay/preset change follows the normal plan/authorize/generate/review/
  accept rebuild path before delivery.

No real-provider E2E is necessary: this change exercises a deterministic local
renderer and must retain the existing mock-provider authorization boundary.

## Risks And Tradeoffs

- **[Font payload size]** Embedding all 100+ Noto shards per page would bloat
  HTML and slow capture. Select only shards whose unicode ranges cover the
  frame's code points, then prove selection in tests.
- **[Browser preflight cost]** A browser launch is slower than the present
  heuristic. Run layout checks as one bounded Framed-plan batch and keep the
  structural validator synchronous; do not launch per field or add a daemon.
- **[Existing accepted raw]** The first renderer correction changes final
  pixels but not the already-declared raw safe zones. Existing accepted underlay
  may be locally recomposed only when the unchanged `standard-v1` safe-zone
  digest still proves coverage; any changed safe-zone data takes the normal raw
  rebuild route.
- **[New quality control]** The browser verifier replaces the heuristic as the
  authoritative fit proof and reuses the current raw-plan checkpoint. It must
  not become a parallel state machine, override, or retry system.

## Open Questions To Settle In The Proposal

1. Does `standard-v1` itself remain the intended light editorial frame, or is
   the current dark top panel the desired design and therefore the preset data
   should be changed to it? The recommendation is to preserve the declared
   preset, because it is already hashed into raw safe-zone evidence.
2. Should a code point outside the curated Source/Noto bundle be a hard-stop
   or be rejected earlier in source validation with clear supported-language
   guidance? The default recommendation is hard-stop at layout verification,
   because actual font coverage is a final-pixel integrity fact.
3. Is persistent finalization font/layout evidence needed for audit, or is
   verified finalization plus the final PNG and preset/raw-contract digests
   sufficient? Start without new state; only add durable evidence if a concrete
   audit/recovery consumer requires it.
