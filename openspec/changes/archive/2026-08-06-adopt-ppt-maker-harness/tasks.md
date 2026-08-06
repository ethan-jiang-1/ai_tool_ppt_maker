## 1. Establish the Canonical Harness Surface

- [x] 1.1 [harness-directory-layout] Record a baseline of active old-root references and relevant tests without reading `deck_*`, `dpt_*`, `_backlog/`, or archived changes; identify only active ownership/executable references that must change.
- [x] 1.2 [harness-directory-layout] Move the reusable source tree to `ppt_maker_harness/`, remove `PPTMAKER_FRAMEWORK/` completely, and verify no alias, symlink, empty shell, or duplicate source root remains.
- [x] 1.3 [project-versioning] Change root package metadata and lockfile identity from `ppkmaker-framework` to `pptmaker-harness` without changing `VERSION` or `VERSION_LOG.md`.
- [x] 1.4 [harness-script-layout] Rename Framework-named architecture inventories, contract modules, and semantic source constants to Harness terms while preserving `ppt_flow`, `PPTMAKER_*`, and `pptmaker-*` namespaces.

## 2. Replace Run Bundle Binding

- [x] 2.1 [run-bundle-layout] Replace the locator schema and manifest renderer with `pptmaker-run-bundle-v2` and exactly `schema`, `deck_root`, `harness_root`, and `harness_relation`; validate canonical absolute, distinct roots and relation equality without introducing `harness_id`, version, hash, or portability fields.
- [x] 2.2 [run-bundle-management] Rename locator APIs and resolved context from Framework to Harness, remove v1 parsing, card-relocation recovery, and requested-root fallback, and enforce that a new Bundle is outside its verified local Harness root before any scaffold write.
- [x] 2.3 [run-bundle-management, node-specification] Add one read-only Deck-root binding preflight and route every authority-carrying run operation through it, including `ppt_flow` status/validate/build/refresh/slides/new-version/state/style-master/image2/doctor-with-run, standalone normal bundle check/new-version, and lessons operations; retain `bundle_layout --check --structure-only` as a no-state/no-write layout observation.
- [x] 2.4 [cli-surface] Route missing, malformed, v1, Framework-named, conflicting, or unverified bindings through the existing bounded JSON diagnostic path before state, provider, generated-artifact, or production work; the hard-stop must name the identity invariant and one reconstruction action, with no waiver, force, automatic migration, or fallback Harness selection.

## 3. Update Active Guidance and Specifications

- [x] 3.1 [harness-charter, commands-reference, bootstrap-env-guidance, playbook-execution] Rename active Charter, BOOTSTRAP, COMMANDS, playbook, Agent guidance, root documentation, help text, and examples to PPT Maker Harness and `ppt_maker_harness/`; preserve the Human/Agent/Harness/Run Bundle ownership boundary.
- [x] 3.2 [environment-check, lessons-management] Update normal and pre-install environment entrypoints, lessons CLI help, executable inventories, and architecture checks to the Harness root while keeping their existing bounded readiness and bundle-local behavior.
- [x] 3.3 [project-versioning] Move the Harness README version surface to `ppt_maker_harness/README.md` and update active package/readme references without performing the archive-time version bump.
- [x] 3.4 [harness-charter, harness-directory-layout, harness-script-layout] Move active main-spec directories from `framework-*` to `harness-*`, update their purposes and requirements, and remove the retired capability directories.
- [x] 3.5 [run-bundle-layout, run-bundle-management, node-specification, cli-surface, commands-reference, bootstrap-env-guidance, environment-check, lessons-management, playbook-execution, project-versioning] Reconcile every listed active main spec and `openspec/config.yaml` with the new root, terminology, capability registry, v2 binding, and package identity. Directly update the affected `## Purpose` sections and current-system Framework wording in every remaining active main spec, including `slide-identity-and-ordering`, `style-master-generation`, `image-production`, and `html-render-runtime`; wording-only edits do not add a capability delta. Do not edit `openspec/changes/archive/`.

## 4. Update Contracts and Focused Coverage

- [x] 4.1 [harness-script-layout] Rename each active schema ID that explicitly names Framework to a Harness ID with an incremented version, including the governance-ledger fixture and its contract test; keep unrelated project/protocol namespaces unchanged.
- [x] 4.2 [run-bundle-layout] Update locator unit tests to prove v2 rendering and exact resolution, direct/relation agreement, external Bundle placement, and rejection of a conflicting relation or a different Harness root.
- [x] 4.3 [run-bundle-management, cli-surface, node-specification] Add focused negative tests showing v1/Framework-named/malformed locator input short-circuits every authority-carrying run path before writes and reports one bounded reconstruction diagnostic without fallback-root selection, state initialization, or generated-artifact work; separately prove `--structure-only` stays layout-only and cannot establish execution authority.
- [x] 4.4 [harness-script-layout, node-specification] Update architecture, import, CLI, state-context, and contract tests to new file paths and Harness API names; remove all expectations that accept compatibility aliases or v1 parsing, while retaining only focused negative fixtures that prove their rejection.
- [x] 4.5 [run-bundle-management, cli-surface] Add temporary-directory integration coverage for fresh `init`, normal check, `--structure-only`, and a currently bypassing run command such as `new-version` through `node ppt_maker_harness/scripts/ppt_flow.mjs`; confirm fresh bundles use v2, legacy bundles hard-stop without provider work, and no existing production Bundle is touched.
- [x] 4.6 [harness-directory-layout] Update existing `tests_e2e/` source references to the renamed Harness path, but do not add or claim a locator E2E gate: the repository declares no applicable Harness-locator E2E command, so the binding proof remains in supported temporary-directory integration tests.

## 5. Validate the Clean Break

- [x] 5.1 Run the supported focused locator and process seams with `npm run test:focused -- <selected-test-path>`, including the v2 binding preflight cases; fix failures through their owning source rather than by editing generated artifacts or legacy data.
- [x] 5.2 Run the protected core suite with `npm test`, then run only the relevant provider-free Harness CLI checks; do not use the undeclared `test:e2e` command or paid/live-provider tests.
- [x] 5.3 Perform a scoped active-surface audit for retired root names, `frameworkDir`, `FRAMEWORK_DIR`, v1 locator fields/schema, Framework-named active schemas, and current-system Framework terminology. Retain legacy literals only in immutable archives, accepted ADR history, this change's migration narrative, or focused negative fixtures that prove rejection; no retained literal may establish an active compatibility route.
- [x] 5.4 Run `openspec validate adopt-ppt-maker-harness --strict`, review the resulting diff for accidental production-data edits, and report that archive-time version-bump judgment remains a later, user-confirmed decision.
