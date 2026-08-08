## 1. Shared Raster Projection Module

- [x] 1.1 Implement `png_raster_projection.mjs` as the sole decoded-layout validator and RGBA8 normalizer for derived pixels, covering 8/16-bit 1/2/3/4-channel layouts and bounded invalid-shape failures.
- [x] 1.2 Add focused module tests for every supported channel/depth mapping, 16-bit reduction, source-layout validation, and same-dimension canvas construction.
- [ ] 1.3 Register the raster projection module as a public `shared/image2` interface and assign its focused test in the architecture/source-test ownership contracts before target method modules import it.

## 2. Derived Projection Call Sites

- [x] 2.1 Route Style Master compatibility JPEG encoding through the shared module and add the BUG-059 regression for a 16-bit RGB selected candidate without changing selection bytes or authority.
- [x] 2.2 Route Framed screenshot crop and nonblank verification through normalized pixels; add RGB/RGBA capture regression coverage that proves the fixed output dimensions and bottom-edge crop behavior.
- [x] 2.3 Route Complete Page Review and target raw-review contact rendering through the shared module; add coverage that non-RGBA provider media renders while exact raw evidence remains byte-identical.
- [x] 2.4 Route delivery final-contact rendering through the shared module; add coverage that a non-RGBA/16-bit Pure final PNG produces the projection while final manifest/media identity remains unchanged.
- [ ] 2.5 Complete JPEG and contact-projection derivation before any final-root write; add a forced raster-projection failure regression proving final PNG files, delivery media, and receipt remain unchanged.

## 3. Verification And Backlog

- [x] 3.1 Re-audit direct PNG-to-canvas and raw-PNG canvas-loader call sites, retaining validation-only decoding and derived-JPEG verification only where documented in the design.
- [ ] 3.2 Run focused raster, Style Master, Framed, Page Image review, delivery, and architecture suites; run the protected `npm test` baseline plus strict change and all-spec validation.
- [ ] 3.3 Update BUG-059 and BUG-060 with implementation evidence and resolved status after the focused regressions pass.
