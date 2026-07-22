## 1. State-Owned Transition Protocol

- [ ] 1.1 Add the exact-source, CAS-bound cross-pipeline transition transaction in the state owner: candidate receipts, anticipated vNext, target mode/pipeline, exact plan confirmation, target registration, bounded audit history, and no competing mode/transition store. (Capabilities: `node-specification`.)
- [ ] 1.2 Preserve the existing in-place HTML-mode transition while making every `html-* <-> image2-only` in-place setter return transition guidance with zero mutation; implement source-preserving target handoff and idempotent visible-target recovery. (Capabilities: `node-specification`.)
- [ ] 1.3 Add focused state tests for stale CAS/plan/source drift, decline, target conflict, source evidence preservation, target-only authority, interrupted registration, and recovery without manual state/generated edits. (Capabilities: `node-specification`.)

## 2. Directional Candidates And Publication

- [ ] 2.1 Generalize the existing Image2-to-HTML candidate/preview/apply transaction to select `html-only` or `html-then-image2`, retain no-replace/journal/receipt rules, and limit transition proof to the existing runnable HTML contract rather than HTML quality or visual parity. (Capabilities: `run-bundle-management`, `pipeline-orchestration`.)
- [ ] 2.2 Add the HTML-to-Image2 explicit markerless candidate path with confined source/control inputs, offline validation, exact plan receipts, and no inference from HTML source, pixels, generated artifacts, metadata, or history. (Capabilities: `run-bundle-management`, `pipeline-orchestration`.)
- [ ] 2.3 Publish both directional targets as clean vNext source/control with target-specific receipt and post-publication mode registration; preserve source bytes/evidence and report target `needs_local_materialization` or `needs_render` without implicit rendering. (Capabilities: `run-bundle-management`, `node-specification`.)
- [ ] 2.4 Extend pipeline tests to prove HTML target preview has no new quality score/parity gate and HTML-to-Image2 preview has zero provider/style-master transport; retain normal post-publication Image2 authorization/review behavior. (Capabilities: `pipeline-orchestration`.)

## 3. CLI And Controller Handoff

- [ ] 3.1 Implement the closed `ppt_flow state` transition prepare/preview/confirm/apply/recover grammar, single-envelope prerequisite-first diagnostics, mutual exclusions, and return-audit entries without making `state` a generic editor. (Capability: `cli-surface`.)
- [ ] 3.2 Update `migrate-import` and state resume/handoff behavior for both directions: show exact target mode/hash, preserve incomplete source execution on decline/failure, and enter target-owned mode-compatible work only after verified registration. (Capabilities: `playbook-execution`, `node-specification`.)
- [ ] 3.3 Update `COMMANDS.md`, change classification, charter, and controller guidance so page-authority changes use versioned transition while HTML-quality-only requests remain outside this change; retain normal Image2 quality/authorization disclosure. (Capabilities: `commands-reference`, `framework-charter`.)

## 4. Verification

- [ ] 4.1 Add CLI/integration coverage for both directions, invalid/mixed flags, stale confirmation, collision, recovery, no wrong-owner writes, and one final diagnostic envelope. (Capabilities: `cli-surface`, `run-bundle-management`.)
- [ ] 4.2 Add playbook simulations for incomplete-source preservation, target registration/handoff, source/target mode consistency, and cross-pipeline refusal outside the transaction. (Capabilities: `playbook-execution`, `node-specification`.)
- [ ] 4.3 Add mocked E2E flows for Image2-to-HTML and HTML-to-Image2, including decline/failure recovery, source-work preservation, offline HTML-to-Image2 preview, and normal Image2 post-publication quality/authorization boundaries. (Capabilities: `run-bundle-management`, `pipeline-orchestration`.)
- [ ] 4.4 Run focused state/CLI/pipeline/controller suites, `npm test`, `npm run test:e2e`, CLI return and docs-consistency audits, `git diff --check`, and strict OpenSpec validation; prove no HTML visual-quality evaluator or Image2 preview provider call was added. (Capabilities: all modified capabilities.)
