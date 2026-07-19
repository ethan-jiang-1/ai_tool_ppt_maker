## 1. Baseline And Architecture Contracts

- [ ] 1.1 Record the current registered executable inventory, direct-entry indicators, import graph, active documentation paths, recursive test baseline, and Change-3 regression commands without reading `deck_*` or `dpt_*` data.
- [ ] 1.2 Create the exact `scripts/00-setup` through `scripts/05-iteration`, categorized `shared`, `contracts`, `fonts`, and `fixtures` skeleton, with Phase-4 README-only/unavailable content and no executable placeholder.
- [ ] 1.3 Create the mirrored `tests/` and `tests_e2e/` ownership directories, `tests/helpers`, `tests_e2e/helpers`, and the checked-in source-to-test ownership manifest location under `tests/contracts/`.
- [ ] 1.4 Implement the deterministic architecture checker for root whitelist, Phase interface inventory, Phase-4 absence, old-path rejection, `scripts/lib/` rejection, and forbidden generic dumping grounds.
- [ ] 1.5 Extend the architecture checker with static ESM import-direction, legacy/modern Image2 isolation, path-qualified direct-entry, and source-to-test manifest validation; add focused network-free tests under `tests/contracts/`.

## 2. Shared Modules And Phase Interfaces

- [ ] 2.1 Move and regroup CLI bootstrap, error, progress, and delegated-process helpers under `scripts/shared/cli/` while preserving the existing producer contract and direct-entry behavior.
- [ ] 2.2 Move bundle layout/coherence/marker helpers and lessons ownership under `scripts/shared/run-bundle/`, preserving `bundle_layout.mjs` as the run-bundle SSOT and keeping shared modules free of Phase imports.
- [ ] 2.3 Move state/controller/evidence primitives into `scripts/shared/state/` and canonical JSON/receipt/identity primitives into `scripts/shared/identity/` without changing schemas, fingerprints, or reset/gate semantics.
- [ ] 2.4 Build the Phase 0 interface and move `env-check.mjs` behind it, updating resource resolution for `scripts/fonts/` and `scripts/fixtures/` while preserving all readiness modes and check names.
- [ ] 2.5 Build the Phase 1 interface and regroup structured source, slide identity, and content parsing implementation behind that seam; preserve legacy branch behavior and stable slide IDs.
- [ ] 2.6 Build the Phase 2 interface and regroup visual configuration, asset catalog, geometry, tokens, fonts, and component implementation behind that seam; preserve renderer-neutral contracts.
- [ ] 2.7 Build the Phase 3 interface and move HTML Stage 1-5, orchestration, renderer/runtime, object-store, review-evidence, artifact, and notes implementation into its private tree without changing CLI or artifact behavior.
- [ ] 2.8 Build the Phase 5 interface and regroup structural, migration, local iteration, lessons, and markerless legacy maintenance implementation; place whole-page Image2, style-master, contact-sheet, and header-lock code only under `legacy-image2/`.
- [ ] 2.9 Leave `scripts/04-image2-refinement/` README-only and add an explicit architecture test proving no modern Image2 command, adapter, provider transport, or executable is introduced by this change.
- [ ] 2.10 Reserve the future Phase-4 private transport-port seam in design/ownership metadata only; do not add a shared provider module, placeholder adapter, authorization record, or runtime import.

## 3. Direct CLI And Import Migration

- [ ] 3.1 Update `ppt_flow.mjs` to import only Phase interfaces and `shared/cli`, and route every existing command through the same owning capability without changing marker probing, options, exits, or diagnostics.
- [ ] 3.2 Move and update all registered direct executables to their canonical owner paths: Phase 0 environment, Phase 3 HTML/orchestration, Phase 5 legacy Image2, and shared run-bundle CLIs.
- [ ] 3.3 Replace basename-only executable registration with normalized path-qualified inventory and update direct-entry/return-audit fixtures for every registered executable, including `lessons.mjs`.
- [ ] 3.4 Rewrite all static imports, dynamic import specifiers, `import.meta.url` resource resolution, child-process paths, shebang/bootstrap query paths, and diagnostic `where` locations affected by the move.
- [ ] 3.5 Run the import-direction checker and remove every Phase-to-foreign-internal, shared-to-Phase, root-to-private, and HTML/legacy Image2 crossover before deleting old paths.

## 4. Test And Verification Migration

- [ ] 4.1 Move unit and integration suites into the mirrored ownership directories, assigning fresh HTML delivery to Phase 3, structural/migration/legacy/state journeys to Phase 5, shared contracts to `tests/shared`/`tests/contracts`, and fixtures/builders to helpers.
- [ ] 4.2 Move E2E suites into their final lifecycle owners and create only the Phase-4 absence contract; do not add a paid refinement journey in Change 4.
- [ ] 4.3 Replace private-file wiring tests with Phase-interface tests at the same observable behavior surface, retaining only stable pure contract/golden and true adapter tests at justified internal seams.
- [ ] 4.4 Change `vitest.config.mjs` to recursively discover nested `tests/**/*.mjs`, preserve existing test exclusions/fixtures, and prove root flat business test files are absent.
- [ ] 4.5 Complete the source-to-test ownership manifest for every Phase interface, shared interface, direct executable, unit/integration suite, and owning E2E journey; make missing, duplicate, and mismatched entries fail closed.
- [ ] 4.6 Add focused tests for architecture layout, import direction, executable inventory, recursive discovery, source/test manifest, old-path rejection, Phase-4 absence, and no `deck_*`/`dpt_*` fixture access.

## 5. Documentation, Playbook, And Spec Path Cutover

- [ ] 5.1 Update `scripts/README.md` with the exact target tree, deep Phase interface seams, direct executable inventory, import rules, manifest location, and pointers to canonical `cli-surface`/`framework-script-layout` authorities.
- [ ] 5.2 Move `agent-prompts.md` to Phase 1 and `change-classifier.md` to Phase 5, then update `COMMANDS.md`, `BOOTSTRAP.md`, `AGENTS.md`, charter, workflow references, and playbook references to canonical paths.
- [ ] 5.3 Update active OpenSpec main-spec path references and coherence fixtures so `framework-directory-layout`, `cli-surface`, `commands-reference`, `bootstrap-env-guidance`, `framework-charter`, and `playbook-execution` agree with the migrated tree without copying another capability's schema.
- [ ] 5.4 Update controller/shared-node manifests and playbook metadata to point to Phase interfaces/direct executable owner paths, preserve lifecycle/module values, and keep Phase 4 unregistered.
- [ ] 5.5 Run active Markdown/CLI example coherence checks and remove all stale flat script paths, `scripts/lib/` references, old classifier paths, and old direct executable examples; retain only explicit historical/archive exceptions.

## 6. Atomic Removal And Regression

- [ ] 6.1 Remove the old flat business scripts, `scripts/lib/`, old direct executable paths, and any compatibility shim collection only after all imports, docs, tests, inventories, and controllers resolve to canonical paths.
- [ ] 6.2 Run targeted Phase 0/3/5 interface, CLI envelope, direct-entry, docs, architecture, and source-to-test tests and compare command envelopes, exits, stdout, diagnostics, and receipts with the recorded baseline.
- [ ] 6.3 Run complete `npm test`, all relevant `tests_e2e`, doctor/runtime evidence, HTML benchmarks, bundle self-check, CLI return audit, and documentation coherence suites; verify no provider call appears on HTML/local-only paths.
- [ ] 6.4 Run `git diff --check`, `openspec validate restructure-framework-script-modules --strict`, `openspec validate --all --strict`, old-path/flat-layout audits, and source-to-test manifest audit; resolve every failure before declaring the change ready to archive.
- [ ] 6.5 Confirm artifact bytes/fingerprints, state/gate/reset/migration semantics, markerless legacy behavior, and canonical `ppt_flow` command compatibility are unchanged except for explicitly breaking internal direct paths.
