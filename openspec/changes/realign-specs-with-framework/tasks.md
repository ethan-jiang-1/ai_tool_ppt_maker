## 1. Repair Main-Spec Structure

- [x] 1.1 Capture the baseline `openspec validate --all` failures and map each invalid requirement index to its exact main-spec heading.
- [x] 1.2 For `framework-charter`, `node-specification`, `playbook-execution`, and `cli-surface`, preserve the full still-valid requirement content and add the missing scenarios.
- [x] 1.3 Replace the `workflow-inspection` placeholder Purpose and complete its two invalid requirements with their existing behavior plus scenarios.
- [x] 1.4 Review the structural-repair main-spec diff and prove no unrelated requirement text or scenarios were dropped.

## 2. Reconcile The Change Contract

- [x] 2.1 Record the interrupted implementation baseline: structurally valid OpenSpec artifacts, contradictory current/compatibility semantics, retired identifiers, stale registries, and failing core/sweep verification.
- [ ] 2.2 Create deltas for the missing proposal capabilities: `bootstrap-env-guidance`, `environment-check`, `framework-directory-layout`, `framework-script-layout`, `header-lock`, `html-slide-contract`, `html-slide-rendering`, `slide-identity-and-ordering`, `visual-asset-management`, and `visual-config`; use complete `MODIFIED` or explicit `REMOVED` operations for every existing requirement that authorizes markerless input, legacy whole-page maintenance, old HTML migration, or compatibility receipts.
- [ ] 2.3 Preview the synchronized main-spec result and prove it contains one current source/state/Controller/CLI/receipt model without dropping unrelated scenarios.

## 3. Close Source, State, And Controller Identity

- [ ] 3.1 Make content parsing accept only direct `html-first-v1|whole-page-image2-v1`, report both supported values, and reject missing, malformed, indirect, retired, or unknown markers before branch work.
- [ ] 3.2 Make init, layout, and state seed/require the exact source/mode pairs `whole-page-image2-v1 -> image2-only` and `html-first-v1 -> html-only|html-then-image2`; remove state-absent whole-page projection, inference, and healing, and fail closed on mode/source drift.
- [ ] 3.3 Remove the legacy-maintenance Controller and aliases; rename the current `migrate-import` transition Controller/file/state identity to `production-mode-transition`, and delete stale state-migration-map node mappings.
- [ ] 3.4 Replace whole-page generation, structural reuse, assembly, and notes lineage with current producer/pipeline identities and delete old whole-page receipt readers.

## 4. Reconcile CLI And Agent-Facing Guidance

- [ ] 4.1 Make `ppt_flow`, `COMMANDS.md`, `cli-surface`, executable/return audits, and baselines agree on exactly 14 top-level commands and only state-owned cross-pipeline transition operations.
- [ ] 4.2 Remove `migrate-html`, any top-level transition compatibility grammar, old HTML-migration nodes/fields/scratch/help/routes, and historical maintenance recovery paths.
- [ ] 4.3 Update Charter, BOOTSTRAP, workflow, playbooks, references, script docs, and main specs to describe current whole-page Image2 as first-class `image2-only`/`whole-page-image2-v1` work through `create-deck`.
- [ ] 4.4 Add an owner/reason-bounded retired-token exception registry and reject exact retired identities, current whole-page legacy/compatibility labels, and malformed phrases such as `whole-page whole-page` across active surfaces.

## 5. Rebuild Verification Inputs And Coverage

- [ ] 5.1 Convert canonical whole-page unit/integration/E2E fixtures to explicit source markers and durable state; retain markerless/retired values only in named negative tests.
- [ ] 5.2 Reconcile Controller manifests, state migration maps, workflow-control ledgers, source-test ownership, executable inventories, CLI return audits, relocation baselines, and command-count assertions with the current owner set.
- [ ] 5.3 Add focused negative coverage for missing/retired markers, absent state, old Controller/command/node/receipt identities, mode/source drift, and state-write short-circuiting; prove repair returns to the same current checkpoint.
- [ ] 5.4 Update affected E2E journeys for current whole-page creation, structural versioning, production-mode transition, refinement isolation, assembly, and notes lineage.

## 6. Verify And Prepare Archive

- [ ] 6.1 Run syntax/import checks over changed ESM/tests and fail on malformed identifier replacements before broader suites.
- [ ] 6.2 Run `openspec validate --all`, `openspec validate realign-specs-with-framework --strict`, and inspect the synchronized main-spec diff.
- [ ] 6.3 Run focused source/state/CLI/Controller/receipt/documentation tests, `npm test`, `npm run test:sweep`, and the affected E2E journeys.
- [ ] 6.4 Confirm the final supported surface contains no retired whole-page identity or compatibility behavior and no changes under `deck_*`, `dpt_*`, or `_generated/` production artifacts.
