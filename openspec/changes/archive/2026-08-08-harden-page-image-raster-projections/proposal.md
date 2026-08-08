## Why

The Page Image workflow correctly accepts and preserves CRC-valid provider PNG bytes with their native dimensions, but several downstream projections assume every decoded PNG is 8-bit RGBA. A 16-bit RGB Style Master, an RGB Chromium capture, or a non-RGBA provider/final PNG can therefore fail or silently corrupt a rebuildable JPEG, crop, review sheet, or delivery contact sheet.

This change closes that common derived-pixel gap now that JPEG delivery has been synchronized and archived. It leaves the authoritative raw-media contract deliberately unchanged.

## What Changes

- Introduce one internal decoded-PNG projection boundary that verifies decoded layout and normalizes supported 8/16-bit, 1/2/3/4-channel PNG pixels to RGBA8 for canvas-based derived artifacts.
- Route Style Master compatibility JPEG generation, Framed screenshot crop/re-encode, Page Image review/contact projections, and delivery contact projections through that boundary.
- Preserve exact provider and final PNG bytes, hashes, actual dimensions, provenance, selection, manifests, and review authority; the normalizer produces only rebuildable derivative pixels.
- Fail the owning derived projection clearly for malformed or unsupported decoded layouts, without a fallback conversion, state mutation, retry, or new gate.
- Complete delivery-media and contact-projection derivation before delivery writes final PNG files, derived media, or a receipt, so a projection failure leaves current final artifacts unchanged.
- Add focused regression coverage for supported layouts, Chromium RGB/RGBA captures, and each affected projection path.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `style-master-generation`: compatibility JPEG projection must support valid non-RGBA and 16-bit selected PNGs without changing selected media authority.
- `html-render-runtime`: Framed capture crop and verification must handle Chromium PNG channel layouts without assuming four source bytes per pixel.
- `image-generation`: Page Image review and contact projections must render accepted valid provider PNG layouts as derived evidence.
- `image-production`: delivery contact projections must render valid final PNG layouts without changing final-media identity or the JPEG delivery contract.
- `harness-script-layout`: the cross-owner raster projection seam must be an explicit public shared interface with architecture and source-test ownership registration.

## Impact

- Harness source: one registered public shared raster projection interface; `style_master_plan.mjs`, `capture_runtime.mjs`, Page Image review/target projection modules, `05-delivery/index.mjs`, and the architecture/ownership registry that admits those imports.
- Tests: focused unit/integration tests for normalization and affected projection paths, plus the protected architecture/ownership verifier. No provider call or production `deck_*` / `dpt_*` artifact is involved.
- Control owner: JS owns deterministic decoded-pixel conversion. The direct source of record remains the exact PNG bytes held by existing media/manifest/provenance owners; this change introduces neither controller handoff nor a human decision.
- Run-bundle contract: compatible. Existing raw/final bytes and their identity records are neither converted nor migrated; only their independently rebuildable projections change.
- Control posture: per `human-centered-gates.md`, malformed/unsupported decoded layouts are a derived-projection `hard-stop` that protects raster integrity and has the existing owning rebuild/repair action. Per `agent-assistance-and-control.md` and `simple-reliable-control.md`, one shared evaluator replaces repeated stride/channel assumptions, fails at the earliest shape check, and adds no persistent state, fallback, retry, or duplicate control path.
