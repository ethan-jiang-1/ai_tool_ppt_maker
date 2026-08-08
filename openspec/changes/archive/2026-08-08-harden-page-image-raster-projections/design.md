## Context

See [proposal.md](proposal.md) for the motivation and the five delta specs for
the behavioral contract. `fast-png` returns decoded samples in the source
layout: 8-bit `Uint8Array` or 16-bit `Uint16Array`, with 1--4 channels. Canvas
`ImageData`, by contrast, needs RGBA8. Several existing derived projections
either copied source samples into an RGBA destination or sent exact provider
bytes to a canvas loader. Both approaches make layout/depth an accidental
call-site responsibility.

The existing raw-media and final-media owners intentionally accept CRC-valid
PNG bytes, record their actual dimensions, and preserve their bytes and hashes.
They are not conversion points.

## Goals / Non-Goals

**Goals**

- Put all decoded-layout validation and RGBA8 conversion behind one small
  shared module interface.
- Cover every current `decode PNG -> canvas` or `loadImage(exact PNG)` derived
  path, while retaining validation-only decode paths as-is.
- Give each owner its existing bounded failure behavior when the projection
  cannot be built.

**Non-Goals**

- Do not normalize accepted provider media, final PNG files, manifests,
  provenance, hashes, or dimensions.
- Do not change PNG acceptance, request dimensions, JPEG profile, provider
  transport, selection/review semantics, controller flow, state, retry, or
  human gate behavior.
- Do not introduce a color-management pipeline or promise bit-exact color
  preservation through an 8-bit JPEG/contact projection.

## Decisions

### One deep raster-projection module

Add `scripts/shared/image2/png_raster_projection.mjs` as a registered public
shared interface with one small interface for derived work:

- `normalizeDecodedPngForProjection(decoded)` validates one `fast-png` decoded
  value and returns `{ width, height, data }` where `data` is RGBA8.
- `createPngRasterProjectionCanvas(bytes)` CRC-decodes bytes, normalizes them,
  and returns a same-dimension canvas populated with those pixels.

The module owns all source-layout details: positive safe dimensions, exact
`width * height * channels` sample count, channel count 1/2/3/4, depth 8/16,
matching sample storage, grayscale replication, default opaque alpha, and
16-bit-to-8-bit sample reduction. Its errors contain only bounded local shape
facts; callers translate them into their existing owner-specific errors.

This is a deep module: callers either need a normalized decoded raster for a
crop or a canvas for drawing. They never need to know a stride, data type,
channel mapping, or conversion rule. It gives the same seam to focused tests
and production code, concentrating future PNG compatibility fixes in one
place.

### Architecture admission and ownership

This module is consumed by Style Master/shared review, Framed capture, and
delivery. The Harness architecture guard therefore requires it to be admitted
as a public shared interface, rather than treating `shared/image2` as a
directory-wide public surface. Implementation adds the exact module path to
the public-interface registry and to the `shared/image2` entry of the
source-test ownership manifest, together with its focused test path. The
architecture contract test then proves both the registered import and the
absence of an unowned recursive test.

This is not a new workflow seam: the module accepts only decoded pixels or PNG
bytes and returns derived pixels/canvas data. It does not read a run bundle or
accept workflow, provider, selection, manifest, receipt, or state facts. The
public registration makes the existing cross-owner import rule explicit while
keeping the interface narrow.

**Alternatives considered**

- Patch each call site with its own channel/depth arithmetic: rejected because
  it recreates the present failure class and loses locality.
- Change raw-media validation to re-encode every provider PNG: rejected because
  raw bytes, hashes, and provenance are authoritative evidence.
- Require all providers and Chromium to emit RGBA8: rejected because valid PNG
  layouts are already accepted and this adds an external, unprovable contract.

### Convert only at derived-projection seams

The audited call-site plan is:

| Location | Current role | Disposition |
| --- | --- | --- |
| `shared/image2/style_master_plan.mjs` compatibility JPEG | selected PNG -> canvas -> `style_master.jpg` | use registered projection interface; retain same-dimension/JPEG verification |
| `03-framed-image/internal/capture_runtime.mjs` crop and nonblank check | decoded screenshot -> cropped output | import registered projection interface; normalize decoded pixels before cropping and semantic visibility check |
| `shared/image2/page_image_complete_page_review.mjs` | exact raw/complete bytes -> browseable review sheet | use projection canvas for each drawn page; continue writing exact evidence bytes separately |
| `shared/image2/page_image_target_runtime.mjs` | exact raw bytes -> contact review sheet | use projection canvas for each drawn page |
| `05-delivery/index.mjs` | exact final bytes -> final contact projection | import registered projection interface for each drawn page |
| `05-delivery/internal/page_image_delivery_media_v1.mjs` | final PNG -> JPEG delivery media | retain `sharp` pipeline; it already independently decodes and verifies delivery JPEGs |
| `ppt_flow.mjs` Style Master transport and `page_image_media_contract.mjs` | validation-only decode | retain: they inspect PNG validity/dimensions and do not create derived pixels |
| Style Master provider/review validators | validation-only decode | retain for the same reason |

The retained `loadImage` call that verifies an already-derived JPEG remains
valid. All canvas drawing of exact provider/final PNG bytes moves through the
new module.

### Deterministic conversion rules and crop behavior

For every supported source pixel, the normalizer emits `[r, g, b, a]`:

- grayscale: `[gray, gray, gray, 255]`;
- grayscale-alpha: `[gray, gray, gray, alpha]`;
- RGB: `[red, green, blue, 255]`;
- RGBA: `[red, green, blue, alpha]`.

8-bit samples are copied. 16-bit samples reduce to their most-significant
eight bits. The result makes each RGBA row `width * 4` bytes, so Framed's
fractional-row crop can use a fixed output stride only after normalization.
Its encoded result and nonblank inspection therefore share one representation
for RGB and RGBA Chromium captures.

Any shape failure is a hard-stop of the existing projection operation: it
protects the integrity of generated pixels, cannot be waived, and supplies the
nearest existing rebuild/repair route. This follows `human-centered-gates.md`.
No state, retry, fallback, or controller decision is added. Under
`agent-assistance-and-control.md` and `simple-reliable-control.md`, the direct
decoded input is evaluated once at the earliest shape check and replaces each
duplicated source-stride assumption.

### Error and publication discipline

The shared module has no filesystem writes and no ownership logic. It throws a
bounded projection error before writing its output. Existing callers preserve
their current atomic-write/publish discipline:

- Style Master selection is already committed and remains committed if its
  compatibility projection fails.
- Framed capture returns its normal bounded capture failure before result bytes
  are returned.
- Page Image review publishers do not publish the failed contact projection or
  use it as review authority.
- Delivery does not publish the receipt after a final projection failure; it
  does not mutate final media or manifests.

### Delivery preflight precedes final-root writes

Existing delivery derives JPEG media in memory, but writes each final PNG before
it creates the contact projection. That order is incompatible with a newly
possible raster-projection failure: a valid final PNG could be copied into the
final root even though delivery cannot complete.

Delivery will instead complete both the JPEG derivation and the final contact
projection in memory before it writes a final PNG, delivery-media file, or
receipt. Only then may it use its existing atomic publication helpers. A forced
failure from the registered raster interface will be covered by a focused
delivery test that verifies a prior final root remains byte-identical and an
empty final root remains empty. No rollback record or new state is needed: the
operation short-circuits before its first final-root write.

## Risks / Trade-offs

- [16-bit conversion loses low-order precision in an 8-bit derivative] -> This
  is explicit and limited to JPEG/canvas projections; exact source PNG stays
  available and unchanged.
- [A `fast-png` shape field changes] -> Focused normalizer tests cover every
  supported depth/channel shape plus malformed data, and callers only use the
  module interface.
- [A raw-PNG drawing call is missed] -> The call-site inventory is checked with
  repository search and focused review/delivery tests before completion.
- [Browser integration hides an RGB row-stride regression] -> Use a real
  pinned-Chromium capture with bottom-edge color evidence in addition to unit
  normalization tests.
- [Delivery leaves a partial final root on projection failure] -> Construct all
  derived delivery bytes before final-root writes and force the registered
  raster seam to fail in a focused no-write regression.

## Migration Plan

1. Add the shared module and its direct tests.
2. Register its public shared seam and source/test ownership before target
   method modules import it.
3. Replace the audited projection call sites and add focused regression tests.
4. Prove a forced delivery-projection failure leaves final-root artifacts
   unchanged, then run the focused suites, protected architecture/development verifier, and
   strict OpenSpec validation. No run-bundle migration is needed because all
   changed artifacts are rebuildable.
5. Roll back by reverting the code change only; no authoritative media or
   persisted schema has changed.
