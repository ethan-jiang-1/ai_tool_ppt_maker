## 1. Repair Main-Spec Structure

- [x] 1.1 Capture the baseline `openspec validate --all` failures and map each validator requirement index to its exact main-spec heading.
- [x] 1.2 For `framework-charter`, `node-specification`, `playbook-execution`, and `cli-surface`, replace each invalid requirement with a full-content `MODIFIED` delta/main block that preserves every existing scenario and adds the missing scenario.
- [x] 1.3 Replace the `workflow-inspection` placeholder Purpose and complete its two invalid requirements with their existing behavior plus scenarios.
- [x] 1.4 Review the synchronized main-spec diff to prove no unrelated requirement text or scenarios were dropped during replacement.

## 2. Baseline Terminology Audit

- [x] 2.1 Search active new-run guidance and main requirements for claims that first-class `image2-only` work is compatibility-only; classify each hit against `production_mode.mjs` and the current controller policy.
- [x] 2.2 Establish that `legacy-image2-first` is a persisted protocol value and that its source marker, reader, receipt, and maintenance path must be changed together.
- [x] 2.3 Identify the existing capability owners for source parsing, run-bundle initialization, state, CLI, controller, assembly, notes, and human routing.

## 3. Remove The Legacy Whole-Page Protocol

- [x] 3.1 Inventory every code, playbook, documentation, main-spec, and test occurrence of `legacy-image2-first`, markerless source routing, legacy-maintenance ownership, and legacy receipt schemas; assign each to an existing capability owner.
- [ ] 3.2 Replace the source-marker resolver and run-bundle seeds with explicit `production.pipeline: whole-page-image2-v1`; reject markerless or `legacy-image2-first` input without migration.
- [ ] 3.3 Replace state/controller policy, CLI/status, transition, assembly, and notes protocol values with `whole-page-image2-v1`; delete legacy readers and compatibility routing.
- [ ] 3.4 Remove legacy-maintenance playbooks, references, migration branches, obsolete CLI/help routes, and historical fixtures; update current whole-page docs to one first-class route.
- [ ] 3.5 Update unit, integration, E2E, and documentation tests for explicit whole-page sources; add negative coverage proving legacy/markerless input fails closed.
- [x] 3.6 Add coherent delta requirements under every affected existing capability; do not create a capability for this cleanup.

## 4. Verify and Prepare Archive

- [ ] 4.1 Run `openspec validate --all` and `openspec validate realign-specs-with-framework --strict`.
- [ ] 4.2 Run focused source/state/CLI/controller/docs tests, `npm test`, and the full sweep.
- [ ] 4.3 Inspect the final diff to confirm no `legacy-image2-first`, markerless compatibility branch, `deck_*`, `dpt_*`, or `_generated/` artifact remains in the supported framework surface.
