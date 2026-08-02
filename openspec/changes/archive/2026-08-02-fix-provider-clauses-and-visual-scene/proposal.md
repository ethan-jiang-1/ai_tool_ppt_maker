## Why

The Page Authority semantic chain compiles three facts for each slide — a
closed visual-language selection, an optional agent identity reference, and an
optional per-slide scene — but the current provider prompt receives only the
first two as opaque SHA digests. Two defects keep the resolved text out of the
Image2 request:

- **BUG-035:** `pureRawContract` and `framedRawContract` take only
  `slide.visual_language.projection` (recipe/composition/motif IDs and
  `provider_clause_sha256` digests) and discard the already-computed
  `slide.visual_language.provider_clauses` text. The submit factory sends the
  request verbatim as the prompt, so the model receives hash strings instead of
  the warm-editorial clause descriptions.
- **BUG-036:** `PAGE_AUTHORITY_FIELDS` has no per-slide scene field, and
  `scanSlideFields` drops any unregistered bold field. The `CONCEPT` scene prose
  in deck sources never reaches the provider, so every slide is driven only by
  the generic recipe/composition/motif selection.

The framework already computes the clause text and the identity role clause;
the fix is to bind that text into the receipt-bound raw contract, add one
guarded per-slide scene field to the source grammar, and require the same
text guard that already protects registry clauses. The change is scoped to the
raw-contract boundary and adds no new CLI, state field, authorization, or
retry policy.

## What Changes

- Add an optional single-occurrence `**VISUAL SCENE**` inline source field to
  the v2 Page Authority grammar, parsed into each slide receipt as raw text and
  not yet guarded at parse time.
- Extend both workflow raw contracts (`pureRawContract`, `framedRawContract`)
  with the resolved `provider_clauses` text (recipe/composition/motifs), the
  identity `role_clause` text, and the text-guard-normalized `visual_scene`.
  The existing `visual_language.projection` (IDs + SHA) stays for hash
  consistency and authorization binding.
- Apply the existing versioned Page Authority text guard to the scene text at
  raw-contract compilation time, so an invalid scene hard-stops planning with a
  bounded diagnostic before any provider submission.
- Update the Framed raw-contract canonical-shape validator to include and type
  check the three new fields, keeping the exact-key contract enforced.
- Add focused unit and integration tests proving the text reaches the contract,
  the scene is guard-normalized, and a guard violation fails closed at
  planning.

The change does not alter the provider submit factory, the request envelope,
the visual-language registry schema, authorization/evidence records, the CLI
surface, or state schema. Existing sources without a VISUAL SCENE field remain
valid (`visual_scene` is `null`). No production `deck_*` bundle is read or
changed; the bug fix enables deck v5 authoring but is a framework capability
fix.

This change applies `openspec/policies/human-centered-gates.md`: scene guard
violation and invalid provider-clause input are `guide`/`hard-stop` at the
existing planning checkpoint — planning is provider-free, returns a bounded
source-repair action, and never authorizes a provider call. No waiver or force
path is introduced.

It applies `openspec/policies/agent-assistance-and-control.md` and
`openspec/policies/simple-reliable-control.md` by reusing the existing direct
authority (source parser → adapter raw contract → shared provider request) and
deleting the accidental "text silently dropped" branch rather than adding a new
diagnostic layer, parser, or fallback. The Agent's single mechanical action is
to repair the guarded source field and rerun the named planning checkpoint.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `content-parsing`: recognize `VISUAL SCENE` as an optional single-occurrence
  inline Page Authority source field and carry it into the slide receipt.
- `image-generation`: require the receipt-bound raw contract to carry resolved
  `provider_clauses` text, the identity `role_clause`, and a
  text-guard-normalized `visual_scene` for both Pure and Framed workflows.
- `visual-config`: extend the deterministic no-text guard requirement so the
  per-slide scene text passes the same guard that protects registry clauses.

## Impact

- **Framework source:** `PPTMAKER_FRAMEWORK/scripts/01-content/internal/page_authority_source.mjs`,
  `PPTMAKER_FRAMEWORK/scripts/04-pure-image/index.mjs`,
  `PPTMAKER_FRAMEWORK/scripts/03-framed-image/index.mjs`.
- **Tests:** focused unit tests in `tests/01-content/test_page_authority_source.mjs`,
  and integration tests in `tests/04-pure-image/test_pure_workflow.mjs` and
  `tests/03-framed-image/test_framed_workflow.mjs`. No test invokes a live
  provider; no production `deck_*` or `dpt_*` directory is read or changed.
- **Control ownership:** JS/CLI owns parsing, guard validation, and raw-contract
  shape enforcement; MD/Agent owns source repair and checkpoint rerun. This is a
  JS capability fix, not an MD consumer change.
- **Run-bundle contract:** `compatible`. Existing sources parse identically
  (scene is optional, null when absent); raw contracts gain additive fields and
  a validated canonical shape; no state, receipt, grant, attempt, history, or
  projection field changes.
