## 1. Retire Competing Agent Control Surfaces

- [x] 1.1 Reconfirm the zero-consumer findings for `agent-prompts.md`, both
  workflow-inspection prose projections, and the Intent Route Catalog; preserve
  each unique current invariant in its current owner before deleting the
  orphaned Harness files. (commands-reference, harness-charter,
  workflow-inspection)
- [x] 1.2 Remove the Intent Route Catalog JSON, reader, schema declaration,
  contract test, source-test ownership row, and coherence requirements; route
  active command, Charter, Controller, and context guidance directly to their
  current MD Controller or CLI owner. (commands-reference, harness-charter,
  playbook-execution, production-schema-conformance)
- [x] 1.3 Add a bounded reachability check proving no retained active guidance,
  source, or test route consumes a prompt cookbook, duplicate inspection prose,
  or route catalog. (harness-charter, production-schema-conformance)

## 2. Close Controller Metadata Grammar

- [x] 2.1 Implement exact Controller, shared-node, and fenced-node frontmatter
  key validation at the Markdown parser boundary, including actionable source
  location diagnostics before index, draft-route, or handoff construction.
  (node-specification, playbook-execution)
- [x] 2.2 Remove the fixed `production_modes`,
  `supported_production_modes`, and `mode_transition_handoff` metadata dialect
  from current Controllers and the reader; retain source-selected
  `production_workflows` filtering and manifest invariants. (node-specification,
  playbook-execution)
- [x] 2.3 Update the canonical Controller/node guidance and the active
  controller inventory so every checked-in declaration passes the closed
  grammar with `method_module` as its only lifecycle-location field.
  (node-specification, playbook-execution, harness-charter)
- [x] 2.4 Add focused parser and index negative controls for an unknown key,
  `phase`, `lifecycle_phase`, a retired mode key, and a duplicate YAML key;
  prove valid declarations still index and draft-route normally.
  (node-specification, playbook-execution)

## 3. Cut Over To Production Identity

- [x] 3.1 Replace the fixed-value production-mode module and persisted
  `production_mode.by_version` parser/validator with the current
  `production_identity.by_version` `{workflow, source_epoch}` evaluator.
  Remove the project-metadata mode mirror at the same ownership boundary.
  Prove the exact record shape and source-workflow agreement without a mode
  policy return. (node-specification, run-bundle-management)
- [x] 3.2 Update State creation, mutation, CAS/replay, and source-epoch
  invalidation writers to own only the identity record. Preserve the
  intentionally absent record for a fresh authoring draft and clean structural
  target. (node-specification, run-bundle-management)
- [x] 3.3 Update Controller eligibility, structural publication, narrative
  planning, Style Master, and workflow inspection readers to consume the source
  marker plus identity record. A missing, malformed, source-disagreeing, or
  retired-mode record must retain the owner-issued non-writing hard-stop.
  (node-specification, playbook-execution, workflow-inspection,
  style-master-generation)
- [x] 3.4 Update direct CLI status/state projections and diagnostics to expose
  selected workflow plus epoch through `production_identity` only. Retire the
  pre-install `env-check`, root `init`/`doctor` delegation, and standalone
  initializer `--mode` parser/default/help contracts so operations select the
  fixed Page Image readiness profile without a mode flag.
  (cli-surface, environment-check, run-bundle-management)
- [x] 3.5 Update schema inventory/anchors, Node Spec, Charter, COMMANDS,
  Bootstrap, root Agent guidance, Context, and active Harness docs to name only
  the current production-identity model; update mnemonic identity prose at the
  same time. (production-schema-conformance, node-specification,
  harness-charter, commands-reference, slide-identity-and-ordering)

## 4. Prove The Clean Break

- [x] 4.1 Update evaluator and State unit fixtures for current production
  identity; plant missing, malformed, source-disagreeing, and retired-mode
  records and prove each short-circuits before state mutation or provider work.
  (node-specification, run-bundle-management)
- [x] 4.2 Update focused Controller, Style Master, workflow-inspection,
  CLI/status, and direct environment-check integration coverage. Prove current
  source/identity propagation, absent fresh-draft identity, removed direct and
  initialization `--mode`, and no wrong-owner fallback. (cli-surface,
  environment-check, playbook-execution, run-bundle-management,
  style-master-generation, workflow-inspection)
- [x] 4.3 Update the mocked end-to-end lifecycle/inactive-write coverage to
  prove the new current identity fences the exact run and preserves the
  no-provider/no-wrong-owner behavior on failure. (node-specification,
  workflow-inspection)
- [x] 4.4 Extend the provider-free active-surface evaluator with the fixed
  Change-3 roots (`ppt_maker_harness/`, tests, root Agent/Context guidance,
  accepted main specs, and OpenSpec config) and planted
  catalog/prompt/metadata/mode residue controls; prove exact categories,
  excluded historical roots, zero mutation, and zero provider access.
  (production-schema-conformance)
- [x] 4.5 Run scoped residue and reachability searches over each declared active
  root; inspect every remaining control term and leave only explicit current
  ownership or bounded negative-control text.
  (harness-charter, production-schema-conformance)

## 5. Verify And Close

- [x] 5.1 Run focused Controller grammar, state identity, CLI/status,
  workflow-inspection, schema-conformance, and mocked E2E tests; record the
  exact commands and outcomes here and in the program progress plan.
- [x] 5.2 Pass `npm test`, `npm run test:sweep`, strict active-change
  validation, strict all-spec validation, scoped residue searches, and
  `git diff --check`; resolve or explicitly reject every remaining P0/P1
  finding with owner and rationale.
- [x] 5.3 Synchronize accepted delta specs, revalidate main specs, archive the
  completed change, and update this checklist plus the program progress plan
  before Git closure.
- [ ] 5.4 Stage exact paths, inspect the staged diff, create an ordinary commit,
  fetch, push `master`, and record four-SHA reconciliation in this checklist and
  the program progress plan.

## Verification Record

- [x] `npx vitest run tests/shared/state/test_md_controller_reader.mjs tests/shared/state/test_target_authoring_draft_route.mjs tests/shared/run-bundle/test_page_image_layout.mjs tests/shared/state/test_target_page_image_state.mjs tests/shared/image2/test_raw_mechanics.mjs tests/03-framed-image/test_style_master_scope.mjs tests/04-pure-image/test_style_master_scope.mjs tests/shared/workflow/test_target_workflow_inspection.mjs tests/contracts/test_cli_surface.mjs tests/contracts/test_production_schema_conformance.mjs` - `10` files, `70` tests passed.
- [x] `npx vitest run --config vitest.process.config.mjs tests/00-setup/test_process_env_check.mjs` - `56` tests passed.
- [x] `npx vitest run --config vitest.process.config.mjs tests/contracts/test_process_command_surface_entry_seams.mjs` - `5` tests passed.
- [x] `npx vitest run --config vitest.e2e.config.mjs tests_e2e/shared/state/test_mock_inactive_run_state_writes.mjs` - `1` test passed.
- [x] `npx vitest run --config vitest.e2e.config.mjs tests_e2e/shared/workflow/test-workflow-inspection-flow.mjs` - `4` tests passed.
- [x] `npm test` - development-verification core admission passed.
- [x] `npm run test:sweep` - full unit/integration sweep passed.
- [x] `openspec validate "converge-agent-control-surfaces" --type change --strict --no-interactive` - active change passed.
- [x] `openspec validate --all --strict --no-interactive` - `27` items passed.
- [x] `node --input-type=module -e 'import { scanActiveSurfaceResidue } from "./ppt_maker_harness/scripts/contracts/harness_architecture.mjs"; const result = scanActiveSurfaceResidue(); process.stdout.write(JSON.stringify(result) + "\\n");'` - `338` text and `102` binary active files, zero issues.
- [x] Scoped active-root residue search and `git diff --check` - zero positive legacy control consumers; all remaining literal mentions are owner-issued normative rejection, test negative control, or guard definition, so there are no unresolved P0/P1 findings.
- [x] `openspec archive "converge-agent-control-surfaces" --yes --skip-specs --json` - archived to `openspec/changes/archive/2026-08-14-converge-agent-control-surfaces/` after pre-synchronized main specs; post-archive `openspec validate --all --strict --no-interactive` passed `26` specs and the active-surface scan remained clean.
