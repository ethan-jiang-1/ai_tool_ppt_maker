## 1. Establish the Canonical Harness Surface

- [ ] 1.1 [harness-directory-layout] Record a baseline of active old-root references and relevant tests without reading `deck_*`, `dpt_*`, `_backlog/`, or archived changes; identify only active ownership/executable references that must change.
- [ ] 1.2 [harness-directory-layout] Move the reusable source tree to `ppt_maker_harness/`, remove `PPTMAKER_FRAMEWORK/` completely, and verify no alias, symlink, empty shell, or duplicate source root remains.
- [ ] 1.3 [project-versioning] Change root package metadata and lockfile identity from `ppkmaker-framework` to `pptmaker-harness` without changing `VERSION` or `VERSION_LOG.md`.
- [ ] 1.4 [harness-script-layout] Rename Framework-named architecture inventories, contract modules, and semantic source constants to Harness terms while preserving `ppt_flow`, `PPTMAKER_*`, and `pptmaker-*` namespaces.

## 2. Replace Run Bundle Binding

- [ ] 2.1 [run-bundle-layout] Replace the locator schema and manifest renderer with `pptmaker-run-bundle-v2` and exactly `schema`, `deck_root`, `harness_root`, and `harness_relation`; validate canonical absolute, distinct roots and relation equality without introducing `harness_id`, version, hash, or portability fields.
- [ ] 2.2 [run-bundle-management] Rename locator APIs and resolved context from Framework to Harness, remove v1 parsing, card-relocation recovery, and requested-root fallback, and enforce that a new Bundle is outside its verified local Harness root before any scaffold write.
- [ ] 2.3 [node-specification] Update `bundle_layout`, `ppt_flow`, state-condition consumers, and all direct callers to use `harnessDir`/`HARNESS_DIR` and the one resolved Harness root; remove obsolete fallback-source fields rather than translating them.
- [ ] 2.4 [cli-surface] Route missing, malformed, v1, Framework-named, conflicting, or unverified bindings through the existing bounded JSON diagnostic path before state, provider, generated-artifact, or production work; the hard-stop must name the identity invariant and one reconstruction action, with no waiver, force, or automatic migration.

## 3. Update Active Guidance and Specifications

- [ ] 3.1 [harness-charter, commands-reference, bootstrap-env-guidance, playbook-execution] Rename active Charter, BOOTSTRAP, COMMANDS, playbook, Agent guidance, root documentation, help text, and examples to PPT Maker Harness and `ppt_maker_harness/`; preserve the Human/Agent/Harness/Run Bundle ownership boundary.
- [ ] 3.2 [environment-check, lessons-management] Update normal and pre-install environment entrypoints, lessons CLI help, executable inventories, and architecture checks to the Harness root while keeping their existing bounded readiness and bundle-local behavior.
- [ ] 3.3 [project-versioning] Move the Harness README version surface to `ppt_maker_harness/README.md` and update active package/readme references without performing the archive-time version bump.
- [ ] 3.4 [harness-charter, harness-directory-layout, harness-script-layout] Move active main-spec directories from `framework-*` to `harness-*`, update their purposes and requirements, and remove the retired capability directories.
- [ ] 3.5 [run-bundle-layout, run-bundle-management, node-specification, cli-surface, commands-reference, bootstrap-env-guidance, environment-check, lessons-management, playbook-execution, project-versioning] Reconcile every listed active main spec and `openspec/config.yaml` with the new root, terminology, capability registry, v2 binding, and package identity; do not edit `openspec/changes/archive/`.

## 4. Update Contracts and Focused Coverage

- [ ] 4.1 [harness-script-layout] Rename each active schema ID that explicitly names Framework to a Harness ID with an incremented version, including the governance-ledger fixture and its contract test; keep unrelated project/protocol namespaces unchanged.
- [ ] 4.2 [run-bundle-layout] Update locator unit tests to prove v2 rendering and exact resolution, direct/relation agreement, external Bundle placement, and rejection of a conflicting relation or a different Harness root.
- [ ] 4.3 [run-bundle-management, cli-surface] Add focused negative tests showing v1/Framework-named/malformed locator input short-circuits before writes and reports one bounded reconstruction diagnostic without fallback-root selection, state initialization, or generated-artifact work.
- [ ] 4.4 [harness-script-layout, node-specification] Update architecture, import, CLI, state-context, and contract tests to new file paths and Harness API names; remove all expectations that exercise compatibility aliases or v1 parsing.
- [ ] 4.5 [run-bundle-management] Update or add temporary-directory integration coverage for fresh `init` and `--check` through `node ppt_maker_harness/scripts/ppt_flow.mjs`, confirming that fresh bundles use v2 and do not require provider work.
- [ ] 4.6 [cli-surface] Update end-to-end command-path coverage under `tests_e2e/` for the renamed Harness entry and a legacy-binding hard-stop, using only generated temporary data and verifying no existing production Bundle is touched.

## 5. Validate the Clean Break

- [ ] 5.1 Run the focused locator, bundle-management, CLI, architecture, contract, and end-to-end tests; fix failures through their owning source rather than by editing generated artifacts or legacy data.
- [ ] 5.2 Run the full regression suite with `npm test` and the relevant provider-free Harness commands, including `node ppt_maker_harness/scripts/ppt_flow.mjs doctor` and the bundle layout checker.
- [ ] 5.3 Perform a scoped active-surface audit for retired root names, `frameworkDir`, `FRAMEWORK_DIR`, v1 locator fields/schema, and Framework-named active schemas; retain only deliberate historical references in immutable archives, accepted ADR history, or this change's migration narrative.
- [ ] 5.4 Run `openspec validate adopt-ppt-maker-harness --strict`, review the resulting diff for accidental production-data edits, and report that archive-time version-bump judgment remains a later, user-confirmed decision.
