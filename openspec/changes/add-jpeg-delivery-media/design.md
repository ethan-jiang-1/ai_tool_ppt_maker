## Context

Current shared delivery validates the current final-slide manifest and its
receipt-bound PNG files, writes those final files under the version's
`_generated/page_image_workflow/final/` root, and passes their paths directly
to PPTX assembly. The assembly and notes receipts bind the final-manifest and
final-PNG digests, but do not distinguish the bytes embedded in the PPTX from
the source PNG evidence.

The direct source of record remains the current
`page-image-final-slide-manifest-v1` plus the PNG files it names. The existing
`deliverTargetFinalSlideManifest` writer is the only normal delivery writer;
the MD Controller already calls that route after human review and finalization.
PPTX assembly consumes delivery-owned media rather than becoming a second
writer. State owns only the target delivery handoff and must not treat a
pre-JPEG receipt as current. The repository already declares `sharp`, so the
conversion needs no new runtime dependency or command surface.

## Goals / Non-Goals

**Goals:**

- Produce one high-quality, full-resolution JPEG delivery file for every
  current final PNG before PPTX composition.
- Keep the accepted final PNG, review lineage, and final-slide manifest as the
  only source-side image authority.
- Make the PPTX, assembly receipt, and notes receipt auditable against both
  the source final PNGs and the exact JPEGs embedded in the PPTX.
- Rebuild stale or missing delivery media through the existing delivery route
  without a new controller node, human confirmation, or quality option.

**Non-Goals:**

- Recompress provider raw pages, review projections, source PNGs, or any
  historical run-bundle media.
- Perform a one-off deck migration, delete existing generated artifacts, or
  rewrite Git history.
- Add WebP, PNG optimization, JPEG quality controls, per-deck overrides, or a
  second visual approval gate.

## Decisions

### Derive delivery JPEGs beneath the final generated owner

Shared delivery will write the following rebuildable artifacts beneath the
existing `final/` root:

```text
delivery-media/
  NN_slideID.jpg
delivery-media-manifest-v1.json
```

The manifest will contain the final-manifest digest, workflow, fixed profile,
and ordered entries with `slide_id`, `position`, source final-PNG digest,
JPEG digest, relative path, and pixel dimensions. The final-slide manifest and
its `NN_slideID.png` paths are unchanged.

This keeps ownership direct: the final manifest and PNG bytes establish what
was approved; the delivery-media manifest only proves the mechanical derivative
that assembly may embed. Keeping JPEGs beside, rather than in, the final
manifest prevents an output encoding choice from becoming content authority.

An alternative was to transcode in memory inside PPTX assembly. That would
shrink the PPTX but leave no independently verifiable delivery bytes for the
assembly and notes receipts, and would make every consumer repeat conversion.
Another alternative was to make JPEG the finalization format; it would make a
lossy representation the review/evidence boundary and is rejected.

### Use one fixed conservative JPEG profile

The delivery writer will decode each validated PNG with `sharp`, flatten any
transparent pixels against white, and encode a JPEG with quality `95` and 4:4:4
chroma sampling. It will not resize, crop, rotate, or expose encoder switches.
The derived manifest records the fixed profile and the JPEG's verified pixel
dimensions.

The user confirmed this exact fixed profile, including its opaque white matte,
during proposal polish. Quality 95 with 4:4:4 sampling prioritizes text and
fine diagram edges over the smallest possible file. Flattening is
deterministic for the JPEG format, including when a valid final PNG contains
alpha; it changes only the delivery derivative. PNG remains available for
exact evidence and investigation.

Using a configurable quality or an adaptive encoder would make every receipt
depend on unbounded settings and complicate stale-media handling. Using the
existing canvas JPEG default would not make chroma subsampling or quality an
explicit, testable contract.

### Rebuild the complete delivery representation before assembly

For each normal delivery invocation, the writer will validate current final
PNG input first, derive all JPEG buffers from that input, verify their
dimensions and JPEG structure, then atomically publish their files and the
delivery-media manifest. The manifest records the fixed profile declaration;
assembly validates that declaration and the byte lineage but does not infer an
encoder-quality value from JPEG decoder metadata. Its receipt gains the
delivery-media manifest digest and ordered JPEG fingerprints; the notes and
top-level delivery receipt carry that assembly lineage. State then accepts only
the resulting delivery receipt's bounded manifest digest and keeps the rest of
the JPEG evidence delivery-owned.

Rebuilding the complete set avoids a cache, per-file freshness rules, and a
second stale-media evaluator. The direct facts are the current final manifest
and its PNG hashes; one derived manifest is the only reusable delivery
projection. A conversion or validation failure is a `hard-stop`, not a
`confirm`: the protected invariant is that every embedded JPEG is attributable
to the current reviewed final PNG. Its single recovery is to repair the
current final media or encoder environment and rerun the existing delivery
operation.

The previous direct-PNG embedding path is removed from assembly. No new state,
gate, retry path, or Agent decision is added. This follows the shortest control
loop required by `simple-reliable-control.md` and keeps the existing delivery
writer as the sanctioned owner described by
`agent-assistance-and-control.md`.

### Treat older derived delivery records as stale and rebuildable

Assembly, notes, and delivery receipts will add the JPEG delivery-media
binding while retaining their final-manifest bindings. Existing records that
lack this binding are not migrated or read as current; the next normal delivery
rebuilds derived JPEGs, PPTX, and receipts from the still-current final PNG
evidence. The source/state protocol and `page-image-final-slide-manifest-v1`
remain unchanged.

This is a compatible run-bundle change because all affected files live under
`_generated/` and have an existing writer. A manual conversion or copied JPEG
cannot heal a stale record. On rollback, restore the previous implementation
and rerun normal delivery so it republishes a compatible PPTX and receipts
from the unchanged final PNG source.

## Risks / Trade-offs

- [JPEG is lossy around fine text or line art] -> Quality 95, 4:4:4 sampling,
  no resizing, and retained lossless PNG evidence minimize visible loss; the
  existing human final-delivery review continues to inspect the resulting
  PPTX.
- [A source image has transparency] -> Deterministically flatten over white
  and retain the original PNG, so JPEG conversion never silently chooses an
  implementation-dependent background.
- [A stale or manually replaced JPEG is embedded] -> Bind each entry and the
  complete delivery-media manifest to current source hashes, verify before
  assembly, and always rebuild the full set in normal delivery.
- [A conversion error damages a working deck] -> Complete conversion and
  validation precede PPTX/receipt replacement; failed conversion leaves the
  prior PPTX and delivery receipts untouched.
- [Historical repository size remains high] -> This change prevents new PPTX
  inflation but deliberately does not alter prior tracked PNG history; that
  needs a separately approved retention and Git-history change.

## Migration Plan

1. Add the delivery-media path constants, manifest contract, JPEG derivation,
   receipt bindings, and layout documentation in Harness source.
2. Update focused delivery, notes, and layout tests using generated fixture
   images only; no `deck_*` production data becomes a test fixture.
3. Existing run bundles acquire JPEG files only when normal delivery runs.
   Missing or old receipt bindings instruct the existing owner route to rebuild
   delivery; they are never hand-edited or automatically adopted.
4. Roll back by reverting the Harness change and rerunning delivery from the
   preserved final PNGs. No source, approval, or provider artifact migration is
   required.

## Validation Strategy

- Unit tests cover fixed-profile JPEG encoder arguments, JPEG signature,
  observable 4:4:4 subsampling and dimensions, deterministic white flattening,
  and preservation of the source PNG digest. JPEG decoders do not expose an
  authoritative quality value, so quality is proven by the fixed encoder
  profile and manifest contract rather than a fabricated metadata assertion.
- Delivery integration tests cover the generated manifest, PPTX image parts,
  assembly/notes/delivery receipt bindings, and a second delivery that replaces
  stale JPEG media from the same source facts.
- Negative focused tests cover an invalid final PNG, a corrupted or manually
  replaced JPEG entry, and a forced encoder failure. Each proves that no new
  PPTX or receipt is published and the prior delivery remains intact.
- Run the relevant `tests/05-delivery`, `tests/shared/image2`, and
  `tests/shared/run-bundle` suites, followed by the repository's bounded core
  verification. Provider-backed E2E is unnecessary because conversion begins
  only after receipt-bound final media is local.
