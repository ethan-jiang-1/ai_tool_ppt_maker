## 1. Cut Over Style Master Media Authority

- [x] 1.1 Update the `run-bundle-layout` Style Master media constant, tree,
  resolver, and structure checks to reserve optional `style_master.png` as the
  only local candidate source; remove `style_master.jpg` presentation-path
  handling and prove the layout does not adopt legacy files.
- [x] 1.2 Update `style-master-generation` candidate construction and promotion
  validation so newly planned local/generated candidates and current
  selections are CRC-valid PNG only, with PNG path/media facts retained in the
  existing immutable records; retain the existing JPEG parser only for
  immutable historical attribution and predecessor binding.
- [x] 1.3 Remove Style Master post-selection JPEG encoding, file writes,
  projection status, and replay recovery; ensure selection success ends at its
  existing CAS and raw planning continues to bind the exact selected PNG bytes.
- [x] 1.4 Make JPEG bytes at the canonical `style_master.png` source fail at
  the earliest Style Master media check with the existing bounded source-refresh
  action, no state mutation, no compatibility conversion, and no provider
  initialization; retain a historical JPEG selection as non-current evidence
  that can only lead to normal PNG replacement selection.
- [x] 1.5 Update `node-specification` State conditions so the layout-resolved
  PNG source is distinct from an accepted selection, and
  `style_master_accepted` requires an exact current PNG selection while
  preserving historical JPEG records without a State write.

## 2. Update Derived Views And Direct CLI

- [x] 2.1 Update artifact navigation to expose the accepted immutable Style
  Master PNG through its normal confined derived output, without reading or
  writing a root-level Style Master projection.
- [x] 2.2 Remove the retired JPEG-projection success field, diagnostic code,
  replay hint, and CLI routing branches while preserving existing
  producer-owned diagnostics for all remaining Style Master lifecycle failures.
- [x] 2.3 Update controller guidance, layout text, and glossary/reference
  entries, including the Charter tree and visual-system operational guidance,
  so they distinguish the optional Style Master PNG source, immutable selected
  PNG evidence, historical JPEG audit evidence, and final delivery JPEGs; do
  not document a PDF command that the Harness does not provide.

## 3. Preserve Final Delivery JPEG Isolation

- [x] 3.1 Confirm shared delivery remains the sole active JPEG writer:
  derive the existing fixed-profile delivery package only from current final
  PNGs after manifest validation and before PPTX assembly, without changing
  delivery schema, quality, alpha flattening, or final PNG authority.
- [x] 3.2 Remove any remaining active upstream Style Master, raw-plan, Pilot,
  review, final-PNG review, or navigation dependency on JPEG media, while
  retaining immutable historical JPEG readers for audit/predecessor binding and
  the declared PPTX delivery-package input contract.

## 4. Add Focused Regression Coverage

- [x] 4.1 Update Style Master schema and lifecycle unit fixtures to use
  `style_master.png`; cover valid local PNG admission, generated PNG admission,
  and exact selected-PNG raw binding.
- [x] 4.2 Add negative tests proving a structurally valid JPEG at the current
  local source hard-stops before plan/head mutation, grant/attempt creation, or
  provider work; prove a persisted historical JPEG selection remains immutable
  history but fails current readiness/raw authority before raw-plan publication.
- [x] 4.3 Add acceptance/replay and direct CLI tests proving there is no
  `presentation_jpeg_projection` field, JPEG-projection diagnostic, replay
  action, or root-level JPEG write after a valid PNG selection.
- [x] 4.4 Add layout and artifact-navigation integration coverage proving the
  selected immutable PNG is the displayed derived evidence and a legacy
  `style_master.jpg` is never adopted or converted, including the State
  `style_master_exists` layout-path lookup.
- [x] 4.5 Retain or extend delivery regression tests to prove the current final
  PNG is byte-stable while its same-dimension fixed-profile JPEG is derived
  only in delivery media for PPTX assembly.
- [x] 4.6 Run the relevant provider-free/mock workflow coverage with a local
  PNG Style Master; do not require real provider E2E for this deterministic
  boundary.

## 5. Validate The Cutover

- [x] 5.1 Run targeted Style Master, layout, artifact-view/CLI, raw-binding,
  and delivery test suites, including the direct process test through its
  intended test configuration when it is excluded from the default Vitest
  pattern.
- [x] 5.2 Run the relevant broader provider-free regression suite and inspect
  the active Harness sources, tests, and operational guidance for retired
  root-level Style Master JPEG projection references; retain final-delivery
  JPEG references and read-only immutable historical-media handling only where
  their owners require them.
- [x] 5.3 Run strict OpenSpec validation for
  `restrict-jpeg-to-final-delivery` and record the passing result before the
  change is offered for archive.
