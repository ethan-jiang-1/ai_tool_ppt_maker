## 1. Shared Provider-Native Media Contract

- [ ] 1.1 (`image-generation`) Replace the fixed page-raw `2048x1136` acceptance evaluator with one CRC-checked, positive-dimension provider-native PNG inspection result that retains the original bytes and actual dimensions.
- [ ] 1.2 (`image-generation`) Update target raw generation profiles, request inspection projections, provider response handling, progressive raw provenance, and bounded invalid-media classification to consume that shared result without adding a preflight, retry, state record, or provider-specific branch.
- [ ] 1.3 (`image-generation`) Audit `ppt_flow`, target runtime, progressive raw owner, Framed validation, Pure finalization, and delivery/PPTX assembly for fixed native-size assumptions; make prerequisite media failure short-circuit before materialization or attempt success publication.

## 2. Style Master Compatibility Projection

- [ ] 2.1 (`style-master-generation`) Change compatibility JPEG generation for selected PNG candidates to draw verified decoded RGBA pixels into the existing local canvas encoder, while preserving the existing atomic projection write, JPEG verification, selection CAS semantics, and exact replay guide.
- [ ] 2.2 (`style-master-generation`) Keep malformed, CRC-invalid, and non-positive candidate media fail-closed through the existing candidate validation path; do not strip provider chunks, rewrite immutable candidate bytes, or create another selection/provenance record.

## 3. Workflow Finalization And Delivery

- [ ] 3.1 (`image-production`) Update Pure finalization and shared final-media validation so actual accepted native dimensions flow from raw evidence to final manifest while Pure retains byte and digest identity.
- [ ] 3.2 (`image-production`) Keep Framed's local fixed composition contract independent of provider-native underlay dimensions, and update delivery/PPTX assembly to validate each final entry against its recorded actual media dimensions before placing it on the slide canvas.
- [ ] 3.3 (`cli-surface`) Retain the existing bounded secret-safe known-failure surface only for invalid provider media; route CRC-valid positive non-default provider dimensions through the existing progressive success surface with no new command or recovery option.

## 4. Focused Regression Coverage

- [ ] 4.1 (`style-master-generation`) Add a deterministic CRC-valid provider-like PNG fixture whose private `caBX` payload is first proved to fail the prior canvas PNG-load path while succeeding with the shared PNG decoder; prove Style Master accept creates a valid JPEG while retaining selection identity and candidate bytes, and preserve the existing projection-failure/replay test.
- [ ] 4.2 (`image-generation`, `cli-surface`) Extend shared media-contract, target-provider, progressive-owner, and CLI diagnostic tests to prove non-default native PNG dimensions materialize with actual provenance/progress and that empty, malformed, CRC-invalid, or non-positive media still cannot create evidence or leak provider content.
- [ ] 4.3 (`image-production`) Extend Pure, Framed where applicable, delivery, and PPTX assembly tests to prove a non-default native Pure image keeps its bytes and dimensions through the final manifest and full-slide PPTX projection, while the Framed final canvas remains owned and fixed.

## 5. Validation

- [ ] 5.1 Run the focused Style Master, page-authority media contract, progressive raw owner, workflow finalization, delivery/PPTX, and CLI diagnostic test files; investigate and resolve any regression before proceeding.
- [ ] 5.2 Run `openspec validate harden-provider-native-media-boundary --strict` and `npm test`; confirm the change introduces no production-deck mutation, extra authorization, retry/force route, or unaudited media acceptance path.
