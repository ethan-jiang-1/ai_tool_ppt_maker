## 1. Provider Request Inspection

- [x] 1.1 (`image-generation`) Add the canonical rebuildable inspection-sidecar path and a target-runtime writer that derives only safe, plan-bound prompt/transport facts from the exact ordered request map; validate item membership and canonical request digests without granting the sidecar lifecycle authority.
- [x] 1.2 (`image-generation`, `cli-surface`) Invoke that writer from the Pure and Framed progressive plan build/replay paths and extend their public `image2 plan` projections with only the run-relative path, sidecar digest, and matching progressive plan hash; keep generation independent of the sidecar.

## 2. Provider Media Boundary

- [x] 2.1 (`image-generation`) At the common selected-adapter provider boundary, decode the returned bytes with the existing CRC-checked PNG capability and require exact `2000x1125`; mark empty, malformed, non-PNG, and wrong-size results as tagged Page Authority known failures while preserving unresolved transport/response semantics.
- [x] 2.2 (`image-generation`, `cli-surface`) Carry only bounded expected/actual media facts from a tagged adapter failure through the existing progressive `known_failure` terminal outcome, proving that no raw materialization, provenance, `succeeded` attempt, resize, new retry flag, or additional gate is introduced.

## 3. Focused Regression Coverage

- [x] 3.1 (`image-generation`, `cli-surface`) Add Pure and Framed fixture coverage for the inspection sidecar's plan/request binding, replay/drift replacement, provider-free behavior, and absence of credential, header, image-data, and prompt leakage from normal CLI output or failure envelopes.
- [x] 3.2 (`image-generation`, `cli-surface`) Add synthetic provider-response coverage for valid exact PNG success and empty, malformed, and wrong-dimension PNG known failures; assert both workflows preserve the existing successor action and create no raw bytes or provenance for rejected media.

## 4. Validation and Bookkeeping

- [x] 4.1 Run the focused Page Authority, progressive-owner, and direct-CLI suites plus the relevant broader regression; run `openspec validate harden-page-authority-provider-boundary --strict` and `git diff --check`, then record the result in the backlog plan's Change 1 implementation step.
