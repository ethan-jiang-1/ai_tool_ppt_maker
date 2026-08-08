## Why

The Page Image Workflow finalizes reviewed pages as lossless PNG files and the
delivery assembler currently embeds those exact files directly into the PPTX.
Those large binary images make generated deck files unnecessarily expensive to
store and distribute, while the underlying provider and review evidence must
remain lossless and auditable.

## What Changes

- Derive a high-quality JPEG delivery image for every current final PNG before
  PPTX assembly. The fixed delivery profile preserves source dimensions,
  uses JPEG quality 95 and 4:4:4 chroma sampling, and flattens any PNG alpha
  against opaque white before encoding. It does not offer a lossy-quality,
  resize, or background switch.
- Keep the receipt-bound final PNG as the finalization and review artifact.
  JPEG is a rebuildable delivery derivative, never a replacement source,
  accepted-review record, or authority for Page Image content.
- Publish and validate a delivery-media manifest that binds each JPEG's
  dimensions and digest to the exact current final PNG and final-slide
  manifest. PPTX assembly embeds only this validated JPEG media.
- Extend assembly and notes lineage so a delivered PPTX is bound both to the
  current final PNG evidence and to the exact JPEG files embedded in it.
- Fail before mutating a PPTX when JPEG derivation or its lineage validation
  fails. No new CLI option, confirmation, review gate, or compatibility path
  is introduced; normal delivery rebuilds stale derived JPEG media
  deterministically.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `image-production`: Final PNG naming remains the finalization contract, but
  shared delivery receives it as a source for a derived JPEG representation
  rather than embedding it directly.
- `pptx-assembly`: Assembly validates and embeds receipt-bound JPEG delivery
  media produced by shared delivery before writing the PPTX.
- `notes-injection`: Notes receipts validate and retain the JPEG delivery
  lineage carried by the assembly receipt.
- `node-specification`: State accepts a delivery handoff only when the receipt
  carries the required JPEG delivery-media lineage for its exact final manifest.
- `run-bundle-layout`: The Page Image final-artifact layout gains canonical,
  rebuildable ownership for JPEG delivery media and its manifest.

## Impact

The change is confined to Harness maintenance: `ppt_maker_harness/`,
`openspec/`, and focused tests. Shared Delivery JavaScript owns conversion,
validation, and derivative writes; assembly consumes the validated derivative;
State only records the resulting bounded handoff. The MD Controller retains the
existing delivery route and human final-delivery review. The implementation uses
the already declared `sharp` dependency and does not modify any production
`deck_*` run bundle as a migration. Existing source/state pairs remain
compatible; their derived delivery artifacts are rebuilt on their next normal
delivery.

The policy is deliberately a short automatic delivery step under
`openspec/policies/simple-reliable-control.md`: validate the current final
manifest, derive one fixed-profile JPEG representation, validate its exact
lineage, then assemble. A conversion failure is a hard stop before PPTX
mutation because it protects the invariant that embedded media is traceable to
the current reviewed final PNG. It requires no human confirmation and adds no
parallel controller state, consistent with
`openspec/policies/agent-assistance-and-control.md`.
