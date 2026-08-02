## Why

Two production-quality gaps surfaced while delivering a Pure deck (`deck_ai_sdlc_keynote` v5):

- **BODY text never reaches the model (BUG-044).** The Pure raw contract carries only
  `display` (KICKER/TITLE/SUBTITLE/CALLOUT). `BODY` is a registered Page Authority
  source field (`PAGE_AUTHORITY_FIELDS`) and is only forbidden for Framed, but it is
  never added to the slide receipt or the Pure raw contract — so per-slide body
  propositions, data, and quotes can never be painted. Slides come out image-heavy and
  text-light, unlike the markerless-era decks whose body text was drawn in.
- **Production files lack `NN_slideID` naming (BUG-043).** The production-conventions
  doc specifies `NN_slideID.png` for deliverables, but `createFinalSlideManifest`
  writes `path: ${slide_id}.png` and the validator rejects any other path. Final
  deliverable files carry no page-order prefix.

Both are delivery-semantics defects, not content-authoring choices. The framework must
deliver the text the source already declares and name production files by page order.

## What Changes

- `content-parsing`: `**BODY**` becomes an optional single-occurrence inline source
  field parsed into the slide receipt as `body` (raw text, null when absent). Framed
  slides continue to reject BODY via the existing `framed_semantic_body_forbidden`.
- `image-generation`: the Pure raw contract carries `body` (the slide's BODY text)
  alongside `display`, so body text reaches the provider prompt for painting.
- `image-production`: the common final-slide manifest names each production file
  `NN_slideID.png` (`position` zero-padded to two digits + slide_id). The final
  manifest validator and PPTX assembly accept the `NN_slideID` path. `slide_id` stays
  in the filename and remains the cross-version identity; `NN` is only the current
  position projection.

This change does not alter the provider submit factory, request envelope, state schema,
style master lifecycle, or raw/evidence records. Existing final manifests are rebuilt
from source; no durable authority file changes. Run-bundle contract is `compatible`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `content-parsing`: recognize `BODY` as an optional single-occurrence inline Page
  Authority source field and carry it into the slide receipt.
- `image-generation`: require the Pure raw contract to carry the slide `body` text so
  body content can be painted.
- `image-production`: require the final-slide manifest to name production files
  `NN_slideID.png` and validate/assemble against that path.

## Impact

- **Framework source:** `PPTMAKER_FRAMEWORK/scripts/01-content/internal/page_authority_source.mjs`,
  `PPTMAKER_FRAMEWORK/scripts/04-pure-image/index.mjs`,
  `PPTMAKER_FRAMEWORK/scripts/shared/image2/page_authority_artifacts.mjs`,
  `PPTMAKER_FRAMEWORK/scripts/05-delivery/internal/page_authority_pptx_assembly_v1.mjs`.
- **Tests:** focused unit/integration tests under `tests/` verify BODY parsing, Pure
  contract body delivery, and `NN_slideID` final paths. No test invokes a live provider;
  no production `deck_*` or `dpt_*` directory is read or changed.
- **Control ownership:** JS owns parsing, contract shape, and path naming; MD/Agent
  owns content authoring. This is a JS capability fix, not an MD consumer change.
- **Run-bundle contract:** `compatible`. Existing sources parse identically (BODY
  optional); final production files gain the `NN_` position prefix and slide_id remains
  the stable identity; no state, receipt, grant, or evidence field changes.
