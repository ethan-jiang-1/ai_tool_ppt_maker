## Context

See [proposal.md](proposal.md). The Pure workflow already parses `BODY` into the
source field map and rejects it for Framed, but never carries it into the receipt
or the raw contract, so body text is silently dropped. Separately, the final-slide
manifest writes `${slide_id}.png` and validates that exact shape, contradicting the
`NN_slideID` production-conventions doc. Both are small, well-bounded JS changes.

## Goals / Non-Goals

**Goals:**

- Deliver Pure slide body text to the provider so pages are text-rich, image as
  metaphor (BUG-044).
- Name final production files `NN_slideID.png` with stable slide_id inside (BUG-043).
- Keep the canonical identity (`slide_id`) intact and rebuildable.

**Non-Goals:**

- Change the provider submit factory, request envelope, state schema, style master
  lifecycle, or raw/evidence records.
- Add a new CLI, source grammar element, or delivery folder to the run bundle layout.
- Change Framed behavior (Framed keeps rejecting BODY and keeps text-free underlays).

## Decisions

### 1. Carry BODY as raw receipt text, no text-guard

`BODY` is display content (the model paints it), same as KICKER/TITLE/SUBTITLE, so it
is not text-guard validated. The source parser stores the raw inline value as `body`
on the receipt; `pureRawContract` adds `body: slide.body ?? null`. Framed remains
forbidden via the existing `framed_semantic_body_forbidden` check. This preserves the
`01-content`/`02-visual-system` module boundary (no guard import needed for display
text).

### 2. Pure contract carries body additively

`pureRawContract` adds one `body` field. `createTargetProviderRequest` already wraps
the contract opaquely and the submit factory stringifies the whole request, so body
text reaches the prompt with no transport change. Pure's registry provider_clauses
(deck-owned) tell the model to paint the display heading and body content with the
scene as metaphor.

### 3. NN_slideID is the final manifest path

`createFinalSlideManifest` derives `path: ${String(index + 1).padStart(2, "0")}_${slide_id}.png`
and `validateFinalSlideManifest` requires that exact shape. The legacy v1 assembly
validator stays canonical-only because its entries carry no position; the active v2
target delivery uses the new path. `slide_id` remains in the filename, so cross-version
reference and rebuild are unaffected; `NN` is the derived position projection.

## Risks / Trade-offs

- [BODY becomes a single inline line, not multi-paragraph] -> The inline grammar
  supports one line per slide; decks author the key proposition/quote there. Richer
  text structure is a later source-grammar change, out of scope.
- [NN_ prefix on final files diverges from canonical `${slide_id}.png` doc] -> slide_id
  stays in the filename; production-conventions already specify NN_slideID for
  deliverables. The final manifest is rebuilt deterministically.

## Migration Plan

1. Add failing focused tests: BODY parse (present/absent/framed-forbid), Pure contract
   body delivery, final path `NN_slideID`.
2. Implement BODY in the source parser + Pure contract; implement NN_slideID in the
   final manifest + validators.
3. Run focused suites, core tier, and strict OpenSpec validation. Existing decks
   rebuild final files with the new path; no durable authority change.

## Open Questions

None. BODY delivery and NN_slideID naming are established; the model's actual painting
fidelity for body text is validated by the deck's pilot review, not by framework tests.
