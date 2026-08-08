## 1. Delivery Media Contract

- [x] 1.1 Extend the Page Image final-artifact paths, layout rendering, and Where Map for the rebuildable `delivery-media/NN_slideID.jpg` files and `delivery-media-manifest-v1.json`, while retaining final PNG ownership and the existing `NN_slideID.png` contract.
- [x] 1.2 Add one delivery-media contract module that derives and validates the ordered JPEG manifest from the current final-slide manifest and final PNG bytes, with source/JPEG digests, dimensions, workflow, and fixed profile metadata including its opaque-white alpha handling.
- [x] 1.3 Encode JPEGs through the existing Node image dependency at quality 95, 4:4:4 chroma sampling, unchanged dimensions, and deterministic white flattening; expose no delivery profile override.

## 2. Delivery And Assembly

- [x] 2.1 Integrate complete JPEG delivery-media derivation into the sole shared delivery writer after current final-PNG validation and before PPTX assembly; use staged/atomic publication so failed conversion does not replace a PPTX or receipt.
- [x] 2.2 Change Page Image PPTX assembly to accept only the validated current delivery-media manifest, embed its JPEG files, and bind the manifest digest plus ordered source/JPEG fingerprints in the assembly receipt.
- [x] 2.3 Remove direct final-PNG embedding from the assembly path, while preserving final PNG bytes, final-manifest semantics, review evidence, and existing Framed/Pure ownership boundaries.
- [x] 2.4 Classify an absent, old, stale, corrupt, or hand-copied JPEG derivative as rebuildable delivery state and route it through the existing delivery writer; do not add a CLI flag, controller node, waiver, or compatibility reader.

## 3. Downstream Lineage

- [x] 3.1 Extend notes injection and notes-receipt validation to require the assembly's exact JPEG delivery-media lineage before opening a PPTX for mutation.
- [x] 3.2 Extend the top-level delivery receipt, State's delivery-handoff admission, and notes-only delivery inspection to retain and validate the new assembly lineage; old derived receipts without it must require normal delivery rebuild rather than hand migration.
- [x] 3.3 Update exported delivery contracts, targeted documentation, and invariant checks so the fixed JPEG profile and derived-only ownership have one authoritative definition.

## 4. Focused Coverage

- [x] 4.1 Add unit coverage for fixed JPEG encoder profile, JPEG signature, observable 4:4:4 sampling, source-dimension preservation, white flattening, and unchanged final-PNG hash; do not assert nonexistent decoder quality metadata.
- [x] 4.2 Add delivery integration coverage proving that a current PNG manifest yields an ordered JPEG manifest, a PPTX containing JPEG media, and mutually consistent assembly, notes, and delivery receipts.
- [x] 4.3 Add negative tests for invalid final PNG input, stale/corrupt/manual JPEG media, and forced encoder failure; each must prove short-circuiting before PPTX/receipt replacement and preserve the prior delivery.
- [x] 4.4 Extend run-bundle/layout, State handoff, and notes-only tests for missing or old JPEG-lineage artifacts, confirming the existing owner-issued rebuild route without adding real-provider E2E coverage.

## 5. Verification

- [x] 5.1 Run the focused delivery, Page Image, run-bundle, and notes test selections, followed by the bounded core verification; record that provider-backed E2E is out of scope because conversion is local post-finalization work.
  - Verification: provider-backed E2E is out of scope because JPEG conversion is local post-finalization work; focused Page Image suites and bounded core verification passed.
- [x] 5.2 Run `openspec validate add-jpeg-delivery-media --strict` and resolve every proposal, delta-spec, design, and task validation finding.
