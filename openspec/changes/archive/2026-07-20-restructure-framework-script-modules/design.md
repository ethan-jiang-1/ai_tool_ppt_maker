## Context

The framework methodology and controller trees already expose lifecycle ownership as `00-setup` through `05-iteration`, but the Node implementation and tests remain mostly flat. Callers currently learn many filenames and import private files directly. That shape has low locality: ownership, path knowledge, CLI registration, and tests are spread across root scripts and a generic `lib/` directory.

This change is a behavior-preserving repository migration. The stable user interface remains `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs <command>`. The physical paths of direct internal executables are allowed to break, provided every active framework reference, delegation target, diagnostic audit, and test moves atomically. No `deck_*` or `dpt_*` data is part of the migration or verification fixture set.

The controlling ownership remains split as follows:

- MD Controllers own workflow order, route selection, human decisions, and gates.
- JS modules own deterministic parsing, validation, state, evidence, rendering, artifacts, and diagnostics.
- `cli-surface`, `node-specification`, and `bundle_layout.mjs` remain the authorities for their existing contracts; the directory architecture does not duplicate them.

## Goals / Non-Goals

**Goals:**

- Make physical source and test paths express the same Phase 0-5 ownership vocabulary as workflow and playbook.
- Create deep Phase modules with small `index.mjs` interfaces, high leverage for callers, and strong locality for maintenance.
- Make the allowed import graph, direct executable inventory, and source-to-test ownership machine-checkable.
- Isolate markerless whole-page Image2 maintenance under Phase 5 and reserve Phase 4 for the later visual-slot refinement change.
- Preserve command behavior, output bytes, state, evidence, gates, migration, reset, receipts, and run-bundle paths.

**Non-Goals:**

- Add modern Image2 commands, nodes, authorization, candidates, adapters, provider calls, or run-bundle paths.
- Redesign business algorithms, CLI envelopes, state schemas, artifact schemas, or MD Controller behavior.
- Preserve old direct executable paths with shims.
- Create one wrapper per private file or retain old implementation-level tests underneath new interface tests.

## Decisions

### 1. Use an exact ownership tree

The implementation SHALL converge on this tree:

```text
PPTMAKER_FRAMEWORK/scripts/
├── README.md
├── ppt_flow.mjs
├── 00-setup/
│   ├── index.mjs
│   ├── env-check.mjs
│   └── internal/
├── 01-content/
│   ├── index.mjs
│   └── internal/
├── 02-visual-system/
│   ├── index.mjs
│   └── internal/
├── 03-html-production/
│   ├── index.mjs
│   ├── stage1_build_inputs.mjs
│   ├── stage2_render_html.mjs
│   ├── stage3_compose_slides.mjs
│   ├── stage4_build_pptx.mjs
│   ├── stage5_inject_notes.mjs
│   ├── unified_pipeline.mjs
│   └── internal/
├── 04-image2-refinement/
│   └── README.md
├── 05-iteration/
│   ├── index.mjs
│   ├── change-classifier.md
│   ├── structural/
│   ├── migration/
│   ├── legacy-image2/
│   │   ├── generate_style_master.mjs
│   │   ├── make_contact_sheet.mjs
│   │   ├── stage2_generate_images.mjs
│   │   ├── stage3_lock_headers.mjs
│   │   └── internal/
│   └── internal/
├── shared/
│   ├── cli/
│   ├── run-bundle/
│   │   ├── bundle_layout.mjs
│   │   └── lessons.mjs
│   ├── state/
│   │   ├── state.mjs
│   │   ├── md_controller_reader.mjs
│   │   ├── html_review_evidence.mjs
│   │   └── internal/html_review_evidence_core.mjs
│   └── identity/
│       ├── canonical_json.mjs
│       ├── byte_hash.mjs
│       ├── notes_receipt.mjs
│       └── render_artifacts.mjs
├── contracts/
│   ├── canonical_json.mjs
│   ├── executable_inventory.mjs
│   ├── framework_architecture.mjs
│   ├── html_source_ast.mjs
│   └── html_review_projection.mjs
├── fonts/
└── fixtures/
```

The root whitelist is `README.md`, `ppt_flow.mjs`, the six numbered Phase directories, `shared/`, `contracts/`, `fonts/`, and `fixtures/`. `scripts/lib/` and generic replacement roots such as `scripts/internal/` are forbidden. Private directory names beneath a Phase may be refined during Apply when current dependency clusters are inspected, but ownership may not move outside this tree.

The mixed, cross-Phase `agent-prompts.md` appendix moves out of the JS implementation tree to `PPTMAKER_FRAMEWORK/reference/agent-prompts.md`; it is not falsely assigned to Phase 1. `change-classifier.md` remains code-adjacent under Phase 5 because it is the detailed maintenance-routing table consumed by the classifier controller.

The MD side owns the lifecycle vocabulary; the JS side mirrors it for navigation and enforcement. An alternative capability-only tree was rejected because it would still require translating workflow Phase language into unrelated physical paths. A file-type tree was rejected because it recreates the current flat ownership problem one level lower.

The current flat source inventory has this required disposition; Apply may refine private subdirectory names but not owner assignment:

| Target owner | Current files / required treatment |
|---|---|
| root | keep only `ppt_flow.mjs`; move `agent-prompts.md` to `reference/` |
| Phase 0 | `env-check.mjs`, `html_runtime.mjs`, `html_runtime_profile.mjs`, `html_fonts.mjs`; owns package/browser/font readiness and the pinned local-runtime inspection/launch interface consumed by Phase 3 |
| Phase 1 private | editing/transaction/selector portions of `slide_document.mjs`, `slide_ids.mjs`, `render_policy.mjs`, and the structured-source/identity orchestration split from `html_slide_contract.mjs`; the versioned pure source AST/projection contract is extracted below `contracts/` and consumed through this interface |
| Phase 2 private | `asset_manifest.mjs`, `visual_config.mjs`, `deck_system.mjs`, `html_asset_catalog.mjs`, `html_chart_svg.mjs`, `html_component_registry.mjs`, `html_visual_tokens.mjs`, plus the filesystem/runtime loader portion split from `html_family_geometry.mjs` |
| Phase 3 direct/private | direct `stage1_build_inputs.mjs`, `stage2_render_html.mjs`, `stage3_compose_slides.mjs`, `stage4_build_pptx.mjs`, `stage5_inject_notes.mjs`, `unified_pipeline.mjs`; private HTML publication/lock portion of `html_object_store.mjs`, `html_preview.mjs`, `html_render_runtime.mjs`, `html_slide_renderer.mjs`, and HTML plan-assembly logic split from `html_slide_contract.mjs` |
| Phase 5 structural/migration | `structural_reuse.mjs`, `html_migration.mjs`, `change-classifier.md` |
| Phase 5 legacy | `generate_style_master.mjs`, `make_contact_sheet.mjs`, `stage2_generate_images.mjs`, `stage3_lock_headers.mjs`, `image_api_client.mjs`, `image_provenance.mjs`, `header_review.mjs`; keep Image2 generation profiles/fingerprints, raw-image manifests, provenance inspection/repair, and materialization private to this owner |
| shared CLI | `cli_bootstrap.mjs`, `cli_error.mjs` |
| shared run-bundle | `bundle_layout.mjs`, `lessons.mjs`, `production_marker.mjs` |
| shared state | `state.mjs`, `md_controller_reader.mjs`, public/core split of `html_review_evidence.mjs` |
| shared identity | stable public `canonical_json.mjs` facade over the contract-owned canonical serializer, a small `byte_hash.mjs` extracted from generic `sha256Bytes`/`sha256File`, and `notes_receipt.mjs`; split only provider-neutral final-slide record schemas/fingerprints and caller-supplied byte/record verification from `render_artifacts.mjs`, while Phase 3 retains HTML current-manifest/path/decode/publication and Phase 5 retains legacy Image2 manifest/discovery/decode/adaptation |
| contracts | move canonical JSON implementation here behind the stable shared facade; keep `framework_coherence.mjs` as repository-verification tooling (not a runtime pure contract) and make it consume canonical path registries; move the pure geometry schema/formula/validation/semantic-hash portion of `html_family_geometry.mjs` here while Phase 2 owns file resolution/loading; keep existing JSON/evidence contracts and narrowly scoped versioned pure `html_source_ast.mjs`/`html_review_projection.mjs`; make `generate_html_family_geometry.mjs` and `seed_html_visual_presets.mjs` import-safe functions, and add the executable registry/architecture checker |

`html_slide_contract.mjs` is deliberately decomposed rather than assigned wholesale: source/identity validation belongs behind Phase 1, visual resolution uses Phase 2, and final HTML plan assembly belongs behind Phase 3. This removes the present dependency magnet instead of recreating it inside a new `internal/` directory. Legacy callers use the public Phase interfaces and shared production marker, not a foreign private copy.

Phase 0 owns base readiness rather than depending on production internals. Its import-safe interface exposes base/runtime/font inspection and pinned local-runtime launch/capture prerequisites; Phase 3 consumes that interface. The direct `00-setup/env-check.mjs` process adapter and root `ppt_flow doctor` coordinate optional Image2 modes: they run Phase 0 prerequisites first and only after explicit mode selection lazily call the Phase 5 public provider-diagnostic operation, which alone loads the legacy provider client. Phase 0 itself never imports Phase 5. This preserves the direct checker's zero-static-npm startup closure, keeps ordinary base doctor free of provider initialization, and avoids the cycle `Phase 0 -> Phase 5 -> Phase 3 -> Phase 0`.

The provider-neutral artifact interface is split by operation, not file history. Shared identity owns final-slide record schemas/fingerprints plus pure verification of caller-supplied confined bytes and manifest records; it neither discovers owner paths nor opens a branch-owned manifest on its own. Phase 3 owns HTML object paths, current-manifest reads/writes, PNG decoding/dimension checks, locks, temp files, and commits before passing verified records/bytes into the shared identity core. Phase 5 owns legacy Image2 generation/raw-render manifests, legacy file discovery, profile matching, provenance repair/materialization, image decoding/dimension adaptation, and then produces the same common final-slide record. `shared/identity/render_artifacts.mjs` therefore imports neither Phase 3 nor Phase 5, `fast-png`, nor `@napi-rs/canvas`; performs no directory scan or manifest write; and does not load provider/legacy implementation. The old `stableJson` alias is removed: callers use `canonicalJson` directly, while generic SHA helpers use `byte_hash.mjs`.

### 2. Phase interfaces are deep module seams

Each active Phase (`00`, `01`, `02`, `03`, and `05`) exposes one `index.mjs` interface. The interface presents cohesive operations needed by callers and hides physical artifact paths, receipt formats, runtime setup, transaction mechanics, and private helper composition. It is not a barrel that re-exports every implementation function.

The Phase 3 module owns the complete local Stage 1-5 production adapter. The Phase 5 module owns local maintenance, structural versioning, migration, and the isolated markerless legacy adapter. This gives callers leverage through a small interface and gives maintainers locality: implementation changes and verification remain inside the owning Phase.

The intended interface responsibilities are fixed even if Apply refines exact private filenames:

| Module interface | Cohesive responsibility | Primary consumers |
|---|---|---|
| `00-setup/index.mjs` | provider-free base/package/browser/font/runtime readiness and Phase-0 setup coordination | `ppt_flow doctor`, env-check adapter, Phase 3, setup tests |
| `01-content/index.mjs` | structured slide document parsing, validation, selector/identity resolution | Phase 3, Phase 5 structural operations |
| `02-visual-system/index.mjs` | visual config, asset catalog, family/geometry/recipe resolution | Phase 3, contract generator verification |
| `03-html-production/index.mjs` | local validate/preview/build/refresh and Stage 1-5 orchestration | `ppt_flow`, Phase 5 local materialization |
| `05-iteration/index.mjs` | structural preview/apply, migration, markerless legacy maintenance | `ppt_flow slides/migrate-html`, legacy routes |

Phase 0's interface includes import-safe `inspectBaseEnvironment` and `inspectHtmlRuntime`; it does not expose or coordinate provider checks. Phase 5's interface includes an import-safe provider diagnostic operation used only by explicitly selected Image2 modes through the env-check/root process adapters. Phase 3 exposes migration-preview/materialization and branch-neutral notes/PPTX operations so Phase 5 never imports renderer/object-store/unified private files. Exact function names may be refined during Apply, but these operation groups and dependency direction are fixed.

An interface is import-safe at module-load time, not merely free of direct-entry guards. Phase `index.mjs` files contain no CLI bootstrap, Commander parse, process exit, top-level production read/write, browser launch, provider initialization, or eager import of an operation-specific heavy/private implementation. They use statically analyzable string-literal dynamic imports at the operation boundary where command-selective loading is required. `ppt_flow.mjs` likewise loads Phase interfaces by command and marker rather than eagerly loading every Phase at startup. The base doctor closure loads Phase 0 only, plus Phase 5 diagnostic only after explicit Image2 selection; an HTML-local command loads no Phase 5 legacy provider/transport; a markerless provider command loads no Phase 3 browser/compositor implementation unless it explicitly invokes the shared Stage-4/5 Phase-3 operation.

Categorized shared modules expose their existing deep public interfaces directly (`bundle_layout.mjs`, `state.mjs`, `html_review_evidence.mjs`, CLI helpers); they do not gain ceremonial `index.mjs` wrappers. Direct Phase executables are adapters over their owning Phase interface, not the interface consumed by other modules.

The declared public shared set is explicit: `shared/cli/cli_bootstrap.mjs`, `shared/cli/cli_error.mjs`, `shared/run-bundle/bundle_layout.mjs`, `shared/run-bundle/production_marker.mjs`, `shared/state/state.mjs`, `shared/state/md_controller_reader.mjs`, `shared/state/html_review_evidence.mjs`, `shared/identity/canonical_json.mjs`, `shared/identity/byte_hash.mjs`, `shared/identity/notes_receipt.mjs`, and `shared/identity/render_artifacts.mjs`. `shared/identity/canonical_json.mjs` is the stable public facade over the contract-owned serializer and adds no alternate implementation. Other files under those categories are private and may not be imported cross-owner, with one exact internal collaboration seam: only `shared/run-bundle/bundle_layout.mjs` and `shared/state/html_review_evidence.mjs` may import `shared/state/internal/html_review_evidence_core.mjs`. The core is not public, cannot be imported by any other production caller, and gains no directory/pattern exception. In particular, `image_provenance.mjs` is Phase-5-private. `shared/run-bundle/lessons.mjs` is a registered direct CLI adapter, not a cross-owner library interface.

Tests and callers use the same seam. Existing tests that assert private wiring are replaced by interface tests when the interface covers the same behavior. Versioned pure contracts, golden fixtures, and true external-adapter tests remain direct where their stable contract is itself the subject.

An alternative of preserving every current export in a root compatibility barrel was rejected because it would create a shallow module and keep the old coupling alive. Old-path shim files were rejected for the same reason.

### 3. Enforce a one-way import graph

The architecture checker parses repo-local static imports, `export ... from`, and string-literal dynamic `import()` edges and enforces:

```text
ppt_flow -> active Phase interfaces + declared public shared interfaces
ordinary Phase direct CLI adapter -> own Phase interface + shared/cli + declared public shared interfaces
declared cross-owner process adapter -> public Phase interfaces + declared public shared interfaces
active Phase -> own private implementation + declared public shared interfaces + contracts + allowed foreign Phase interface
shared -> declared public shared interfaces + contracts
contracts -> Node built-ins + explicitly allowlisted declared parser packages + contracts only
```

The allowed foreign-Phase adjacency is exact: `00-setup -> {}`, `01-content -> {}`, `02-visual-system -> {}`, `03-html-production -> {00-setup, 01-content, 02-visual-system}`, and `05-iteration -> {01-content, 02-visual-system, 03-html-production}`. Phase 4 has no node. Any other Phase edge fails, even when it targets an `index.mjs`; this makes the lifecycle graph acyclic and prevents a vague “needed dependency” exception.

Node built-ins and declared runtime dependencies from `package.json` remain allowed wherever the owning capability already uses them; they are external leaves and do not create repository-owner edges. Undeclared bare package imports fail the existing runtime/dependency checks. The graph below governs only relative/file repo-local imports.

Additional rules are:

- `ppt_flow.mjs` is the composition root. It may import Phase `index.mjs` files and declared public shared interfaces under `shared/cli`, `shared/run-bundle`, and `shared/state`; it never imports a Phase private path, direct Phase CLI, or shared private implementation.
- `shared/` never imports a numbered Phase.
- A Phase never imports another Phase's `internal/`, direct executable, or physical artifact-path constant.
- Phase 3 consumes Phase 0, Phase 1, and Phase 2 only through their interfaces.
- Phase 5 consumes Phase 1/2 and invokes Phase 3 production only through those owners' interfaces; no lower Phase imports Phase 5.
- Contract generators use Node built-ins and contract-owned pure modules only. They become import-safe functions with no shebang, direct-entry guard, or top-level write; contract tests call them to compare/regenerate canonical bytes. If generation currently depends on Phase internals, the pure contract definition moves into `contracts/` and the Phase consumes the resulting contract; no contracts-to-Phase back edge is introduced. `contracts/html_review_projection.mjs` and `contracts/html_source_ast.mjs` are not generators or a new service layer: together they are the single versioned, synchronous, provider/browser/filesystem-write-free implementation of the content/system/recipe/page review projections used by Phase 1/2/3 publication and shared-state freshness evaluation. They accept a closed canonical byte map plus declared versions, return typed projections/fingerprints/issues, and may use only Node built-ins, declared parser packages, and contract-owned modules including `contracts/canonical_json.mjs`. The stable `shared/identity/canonical_json.mjs` facade also delegates to that same core; contracts never import shared, so the graph remains one-way. Phase interfaces retain confinement, resolution, orchestration, transactions, and publication.
- An ordinary direct Phase executable is a separate CLI-adapter module at the process seam. It imports its owning Phase `index.mjs` plus shared CLI helpers rather than bypassing the deep module seam to private implementation. The Phase index never imports the executable or triggers CLI bootstrap/process behavior on library import. Files that currently mix CLI parsing/bootstrap with exported application functions are split rather than moved wholesale.
- Exactly five cross-owner process adapters are allowlisted: root `ppt_flow.mjs`, `00-setup/env-check.mjs`, `03-html-production/unified_pipeline.mjs`, `03-html-production/stage1_build_inputs.mjs`, and `03-html-production/stage4_build_pptx.mjs`. Env-check preserves base plus explicitly selected Image2 modes while keeping Phase 0 provider-free; Stage 1 preserves marked-source validation and markerless input-building modes; Stage 4 preserves `--run-dir` branch classification and legacy artifact flags. Each adapter coordinates only at the process seam and delegates to public Phase/shared interfaces; it imports no Phase/shared private implementation. Stage 5's direct CLI is branch-neutral PPTX mutation and remains an ordinary Phase-3 adapter over an import-safe Phase-3 operation; markerless Phase 5 invokes that operation only through the Phase-3 interface. It receives no cross-owner allowlist and is not mislabeled as shared identity. No other direct CLI gains this exception.
- No modern Image2 code imports legacy Image2 implementation, and the legacy module cannot import the future Phase 4 implementation.

Run-bundle path strings and constants have one owner: `shared/run-bundle/bundle_layout.mjs`. The checker maintains a narrow, file-specific allowlist for canonical path declarations and documentation/test fixtures; production modules outside that owner consume resolvers/constants rather than redeclaring known artifact subpaths. Broad token exclusions are forbidden.

The checker is a contract library at `scripts/contracts/framework_architecture.mjs`, exercised by `tests/contracts/test_framework_architecture.mjs`; it is not a fifteenth direct CLI. `scripts/contracts/executable_inventory.mjs` owns the path-qualified executable set, while `shared/cli/cli_error.mjs` re-exports/consumes it under `cli-surface`. This prevents the CLI audit and architecture checker from maintaining competing inventories.

`contracts/framework_coherence.mjs` is repository verification tooling and may read the declared framework/spec roots and spawn side-effect-free `--help` probes, but it is not production orchestration. It resolves documented scripts through the path-qualified executable registry rather than basename lookup, updates authority/compatibility pointers to final owner paths, and retains only exact historical exceptions. Pure contract modules remain free of filesystem/process behavior; the architecture policy distinguishes these two contract-directory roles explicitly instead of pretending all files there have the same dependency profile.

The direct env-check pre-install closure is an even smaller subgraph: `00-setup/env-check.mjs`, Node built-ins, `shared/cli/cli_bootstrap.mjs`, `shared/cli/cli_error.mjs`, and pure `contracts/executable_inventory.mjs`. Those three helper/registry modules use only Node built-ins and pure checked-in data; they do not import Commander, YAML, a Phase, or another npm package. Phase 0/runtime and Phase 5 diagnostic modules are reached only by string-literal dynamic import after the relevant prerequisite/mode gate. Root `ppt_flow.mjs` remains a Commander CLI and therefore is the canonical post-install user-facing doctor, not the pre-install recovery entrypoint; after Commander is installed, its doctor command must still avoid loading renderer/provider implementation before delegating.

The checker is architecture enforcement owned by JS repository maintenance; it does not define workflow behavior. A runtime dependency-injection container was rejected because explicit ESM interfaces are sufficient.

The checker is developed before the physical move against synthetic target-tree fixtures and explicit path inventories, but it is connected to default `npm test` only at the atomic cutover when the real tree is expected to conform. There is no committed transition/bypass mode and no environment flag that weakens final enforcement. During migration, focused legacy regression commands and explicit checker fixture tests are the checkpoints; after cutover, both old-path and final-architecture checks are mandatory.

Import-graph conformance is necessary but not sufficient: subprocess load probes run representative base-doctor, HTML-local, and markerless commands with forbidden package/provider sentinels. They prove command-selective module closure and fail if an unused Phase implementation initializes merely because a front controller or `index.mjs` was imported.

### 4.1 Keep shared state and bundle layout synchronous without a facade cycle

`shared/state/html_review_evidence.mjs` remains the five-operation public facade required by `node-specification`. Its implementation-private core accepts only a trusted context and imports neither `bundle_layout.mjs` nor any Phase. `shared/run-bundle/bundle_layout.mjs` constructs that context from its own SSOT constants/resolvers and calls the core for synchronous `checkBundle` readiness. The public evidence facade constructs the same context through public bundle-layout exports and calls the same core. This is the sole exact cross-category internal import exception described above; architecture tests reject every other importer of the core.

The review core resolves a closed byte map through bundle-layout-owned confined resolvers, reads persisted immutable plan/manifest/receipt objects, verifies every confined reference itself, and calls the same versioned source-AST/review-projection contracts that Phase 1/2/3 use when those records are published. The contracts own only deterministic format parsing and projection/fingerprint rules; Phase 1/2/3 retain higher-level validation/resolution orchestration and all publication. This lets the core recompute current content/system/recipe/page evidence (including notes-only, copy-only, visual-system, recipe, and page-dependency distinctions) without importing a Phase or trusting stale `slide_plan.json`, and it does not create a second validator. Golden parity tests freeze all five change classes before moving the code.

This yields file-level dependencies without a facade cycle:

```text
bundle_layout.mjs ────────> html_review_evidence_core.mjs
        ▲                              ▲
        │                              │
html_review_evidence.mjs ──────────────┘
```

No orchestration caller receives the core or may inject paths/prebuilt state. Moving the public facade/core under categorized shared state is a location change only; its five interfaces and all journal/reset/evidence semantics remain owned by `node-specification`.

`shared/state/` is not a generic HTML dumping ground: the facade is allowed there because its contract is explicitly cross-cutting state/evidence protocol consumed by `state`, `status`, `approve`, `checkBundle`, Stage 4, and controllers. HTML renderer internals, family recipes, and browser/runtime code remain Phase 3 private.

### 5. Keep one stable front controller and move direct executables

`ppt_flow.mjs` remains at the scripts root and remains the only command path users need to remember. Registered direct executables move to their owner paths:

| Executable owner | Direct paths after migration |
|---|---|
| root | `ppt_flow.mjs` |
| Phase 0 | `00-setup/env-check.mjs` |
| Phase 3 | `03-html-production/stage1_build_inputs.mjs`, `stage2_render_html.mjs`, `stage3_compose_slides.mjs`, `stage4_build_pptx.mjs`, `stage5_inject_notes.mjs`, `unified_pipeline.mjs` |
| Phase 5 legacy | `05-iteration/legacy-image2/generate_style_master.mjs`, `make_contact_sheet.mjs`, `stage2_generate_images.mjs`, `stage3_lock_headers.mjs` |
| shared run-bundle | `shared/run-bundle/bundle_layout.mjs`, `shared/run-bundle/lessons.mjs` |

The inventory has fourteen entries; Change 4 corrects the stale main-spec prose that said thirteen while already omitting current `lessons.mjs`. The executable set itself does not change. The inventory stores normalized paths, not basenames, so duplicate filenames cannot hide ownership errors. Direct-entry detection remains recursive. Help, exit status, stdout JSON, final stderr envelope, logical diagnostic `where`, diagnostic redaction, and child-process behavior are unchanged. Only safe invocation/inspect paths that intentionally identify a direct executable move.

The root router stays thin through this ownership map:

| `ppt_flow` command | Owning interface |
|---|---|
| `doctor` | Phase 0 |
| `init`, `new-version` | public shared run-bundle interface |
| `status`, `state` | public shared state/controller interface |
| `approve` | shared review-evidence/legacy state routing, with Phase 3 or Phase 5 behavior behind the owning interface |
| `style-master` | Phase 5 legacy |
| `validate`, `pilot`, `build`, `refresh` | marker-first Phase 3 or Phase 5 interface |
| `slides`, `migrate-html` | Phase 5 structural/migration interface |
| `test` | shared CLI process adapter |

The table fixes interface ownership, not command implementation. `ppt_flow` continues to probe the marker before branch-specific validation and preserves delegated child-envelope behavior where the current contract requires a subprocess.

`03-html-production/unified_pipeline.mjs` remains a registered direct compatibility surface for both HTML and markerless runs and is one of the exact five cross-owner process adapters. Although physically placed with the default complete HTML production owner, after marker probing it delegates to the Phase 3 or Phase 5 public interface and contains no branch implementation.

Old direct paths are removed in the same commit that updates `ppt_flow`, docs, controller references, audits, tests, and OpenSpec path references. A compatibility shim collection was rejected because it would make the architecture checker unable to distinguish the canonical owner and would indefinitely preserve the flat interface.

### 6. Reserve Phase 4 without creating a hypothetical implementation

During Change 4, `04-image2-refinement/` contains only an unavailable README and has no `index.mjs`, direct executable, adapter, or import edge. Legacy whole-page Image2 remains entirely within `05-iteration/legacy-image2/`.

Change 5 will place the modern Image2 transport port at an internal seam inside the Phase 4 module. The production provider adapter and a test fake will make that a real two-adapter seam; ordinary HTML production and local iteration will not receive the port. Change 4 records and checks the reserved ownership but does not create a placeholder port or pass-through adapter.

An immediately shared legacy/modern provider module was rejected because the two business models have different authorization and attempt semantics. Shared extraction or transport behavior may only be reconsidered after Change 5 can demonstrate a genuinely common interface without leaking either business implementation.

### 7. Mirror source ownership in tests

The test roots become:

```text
tests/{00-setup,01-content,02-visual-system,03-html-production,04-image2-refinement,05-iteration,shared,contracts,helpers}
tests_e2e/{00-setup,01-content,02-visual-system,03-html-production,04-image2-refinement,05-iteration,shared,helpers}
```

Fresh HTML delivery E2E belongs to `tests_e2e/03-html-production/`. Structural, migration, and markerless legacy journeys belong to `tests_e2e/05-iteration/`. State-machine and lessons journeys belong to `tests_e2e/shared/state/` and `tests_e2e/shared/run-bundle/`, matching their production owners. Future paid refinement belongs only to `tests_e2e/04-image2-refinement/`. Cross-owner setup performed inside a journey does not change the final outcome owner.

Existing HTML benchmarks and runtime-evidence scripts move beneath `tests/03-html-production/`; contract/coherence checks move beneath `tests/contracts/`; shared static input data and fake adapters move beneath the owning Phase or `tests/helpers/fixtures/`. `tests/helpers/` and `tests_e2e/helpers/` may build inputs, temporary directories, static fixtures, and fake adapters, but cannot copy production parsing, state, fingerprint, or path rules. `vitest.config.mjs` uses recursive `tests/**/test_*.mjs` and `tests/**/test-*.mjs` discovery while leaving helper/benchmark builder modules importable but not standalone suites. No root business `.mjs` remains in either test tree, including non-`test_*` CI scripts.

Because Git does not preserve empty directories, an ownership directory with no current suite contains a short `README.md` stating its owner and current absence. Phase 4 READMEs explicitly say refinement is unavailable in Change 4; they are not executable tests and do not imply coverage.

### 8. Add one machine-readable ownership manifest

A checked-in `tests/contracts/source-test-ownership-v1.json` manifest uses schema `pptmaker-source-test-ownership-v1`. Its sorted `owners[]` entries contain one canonical owner name plus sorted repository-relative POSIX paths for `interfaces`, `executables`, `unit_integration`, and `e2e`. It maps every active Phase interface, declared public shared interface, declared executable/architecture/canonical/source-AST/review-projection contract interface, and registered direct executable to exactly one unit/integration owner and zero or more E2E journey owners. It does not duplicate CLI schemas or source behavior; it records ownership only.

The architecture checker verifies that:

- every required source interface and executable has exactly one unit/integration owner;
- every referenced test exists under the matching owner directory;
- no source or test has multiple owners;
- no old flat path remains;
- Phase 4 has only its absence/unavailability contract in Change 4.
- the manifest executable union exactly equals the canonical executable registry rather than becoming a second inventory authority.

An inferred filename convention alone was rejected because renamed or consolidated tests can satisfy ownership without having one mechanical filename per private module.

### 9. Preserve behavior with an atomic migration sequence

Apply builds by ownership cluster, then performs one canonical-path cutover. A focused checkpoint records progress without treating a coexistence worktree as a valid final architecture:

1. Record the baseline; add the target skeleton, canonical executable registry, synthetic-fixture architecture checker, and ownership-manifest schema without enabling final-tree enforcement.
2. Extract contract-owned pure representations and categorized shared modules, including review evidence and provider-neutral final-slide identity; prove synchronous bundle-layout/evidence parity before moving Phase orchestration.
3. Build Phase 0/1/2 interfaces and import-safe implementations. Add the minimal Phase 5 provider diagnostic and legacy identity implementation needed by env-check, while Phase 0 itself remains provider-free.
4. Build the complete Phase 3 interface/application implementation, then Phase 5 structural/migration/legacy implementation against only the exact allowed Phase interfaces. Direct executable files are not yet the dependency seam.
5. Run the pre-cutover checkpoint through target interfaces and synthetic architecture fixtures. Failure resumes within the owning cluster; no old production file has been removed yet.
6. Atomically switch the five cross-owner process adapters, ordinary CLI adapters, `ppt_flow`, all import/resource/diagnostic paths, executable registry, tests, controllers, docs, playbooks, and active spec references to the target tree. No compatibility shim is introduced.
7. In the same canonical-path cutover, remove root business files and `scripts/lib/`, enable recursive test discovery and real-tree architecture enforcement, and require old-path/path-token/dynamic-import/source-ownership checks to pass before the cutover checkpoint is complete.
8. Run full regression and Purpose reconciliation. Any failure is repaired in the target owner; old paths are not restored.

Rollback is a Git revert of the complete atomic canonical-path cutover (plus any explicitly dependent preparatory commits), never a selective restoration of old-path shims. Preparatory commits, if used, may contain only import-safe target modules, tests, and synthetic checker fixtures that no production entrypoint references; the repository's supported production surface remains the old tree until the cutover. There is no data migration and no run-bundle rewrite.

### 10. Verify at the correct surfaces

- Unit tests verify pure contracts and private algorithms only where those contracts are stable and owned locally.
- Integration tests exercise each Phase interface, direct executable envelope/help behavior, import rules, source-to-test ownership, docs coherence, and recursive discovery.
- E2E tests exercise the public `ppt_flow` surface for fresh HTML delivery and Phase 5 structural/migration/legacy journeys.
- Existing doctor, runtime evidence, benchmark, bundle self-check, CLI return audit, full `npm test`, and strict OpenSpec checks remain required.

Artifact and receipt equivalence is checked through existing golden/acceptance suites. No production `deck_*` or `dpt_*` directory is used as a fixture.

### 11. Reconcile main-spec Purpose summaries during the final cutover

Delta operations merge requirements, not existing Purpose prose. The final implementation cutover therefore updates only non-normative Purpose/preamble summaries that would otherwise contradict already-current requirements or the new canonical locations:

| Capability | Required Purpose/preamble correction |
|---|---|
| `framework-directory-layout` | mention the delegated Phase/shared script tree and `reference/agent-prompts.md` while retaining the five-root soft-bundle boundary |
| `cli-surface` | replace the stale 12-command summary with the current 14-command/path-qualified direct-CLI contract |
| `commands-reference` | point the detailed classifier to `scripts/05-iteration/change-classifier.md` |
| `bootstrap-env-guidance` | describe base local HTML readiness and optional legacy Image2 readiness using the Phase 0 checker path |
| `framework-charter` | point the bundle-layout SSOT to `shared/run-bundle/` and include the prompt appendix under reference material |
| `playbook-execution` | remove stale hard-coded controller/node counts and defer inventory cardinality to the normative controller manifest |
| `environment-check` | replace the obsolete Node 18/Image2-hard-gate summary with supported Node `22.x|24.x|26.x`, base local HTML readiness, and optional Image2 modes at the Phase 0 path |
| `lessons-management` | name the relocated shared run-bundle CLI path |
| `node-specification` | point the state/controller interfaces to `shared/state/` |
| `run-bundle-layout` | point the machine-authority preamble to `shared/run-bundle/bundle_layout.mjs` |
| `run-bundle-management` | point the scaffold CLI and state dependency to their categorized shared paths |
| `pipeline-orchestration` | replace the obsolete Node 18/Image2-first summary with supported runtime and marker-first Phase 3/5 delegation |

This is documentation reconciliation, not a behavior change or a license to rewrite unrelated requirements. Main-spec coherence must pass before archive; normal delta sync then sees requirements already aligned and does not need to infer these Purpose edits.

## Risks / Trade-offs

- **[Risk] A large path migration can leave hidden dynamic imports or documentation references stale.** -> Use recursive import/reference scans, normalized executable paths, old-path rejection, and complete regression before removing old files.
- **[Risk] Phase interfaces become shallow barrels.** -> Require cohesive interface operations, forbid blanket private re-exports, and replace implementation-coupled tests with interface tests.
- **[Risk] Importing a legal interface eagerly initializes an unselected browser/provider branch.** -> Require import-safe interfaces, command/marker-selective literal dynamic imports, and subprocess load-closure probes for base doctor, HTML-local, and markerless-provider commands.
- **[Risk] `shared/` becomes the next dumping ground.** -> Allow only `cli`, `run-bundle`, `state`, and `identity`; require source/test ownership and reject Phase imports from shared.
- **[Risk] The private review evaluator becomes a hidden public interface or a broad shared-internal exception.** -> Allow exactly two named importers of `html_review_evidence_core.mjs`, reject every other importer, and keep all external tests on the five public evidence operations plus `checkBundle`.
- **[Risk] Moving files accidentally changes `import.meta.url`-relative resource resolution.** -> Move path resolution behind owning interfaces and run font/runtime/fixture/doctor tests plus artifact equivalence checks.
- **[Risk] An interrupted cutover leaves both old and new production surfaces active.** -> Build and verify import-safe target modules first, switch every production path/registry/doc/test in one cutover checkpoint, and repair failures only in the target tree or revert the complete cutover without adding shims.
- **[Risk] Direct executable consumers outside active framework docs break.** -> Treat the path move as explicitly breaking, preserve `ppt_flow` as canonical, update all active repository references atomically, and do not claim support for undeclared old direct paths.
- **[Risk] Delta specs validate while capability Purpose text still names old paths.** -> Include every path-owning capability in this change and update its non-requirement purpose/path summary during the final implementation cutover before pre-archive coherence is accepted.
- **[Trade-off] Numeric directory names require quoted or explicit relative imports in some tooling.** -> Node ESM and Vitest accept numeric-leading path segments; the ownership clarity is worth the minor path verbosity.

## Migration Plan

The migration is repository-only and requires no state heal, run-bundle conversion, or generated-artifact rebuild. Implementation shall follow Decision 8, preserve a clean comparison point before moves, and validate after every ownership cluster. Final cutover removes old paths only after the new interfaces, imports, tests, docs, and registries agree.

If verification fails after old paths are removed, revert the complete Change 4 implementation rather than introduce temporary shims. Existing run bundles remain usable with the pre-change framework because their on-disk schema is unchanged.

## Open Questions

None. Apply may rename or subdivide private implementation files only within their already-fixed owner. It may not change the public shared set, exact Phase adjacency, five cross-owner process adapters, two-importer review-core seam, source/test owner, load-closure rules, or atomic-cutover contract without returning to OpenSpec review.
