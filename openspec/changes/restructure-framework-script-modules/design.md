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
│   ├── agent-prompts.md
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
│   └── identity/
├── contracts/
├── fonts/
└── fixtures/
```

The root whitelist is `README.md`, `ppt_flow.mjs`, the six numbered Phase directories, `shared/`, `contracts/`, `fonts/`, and `fixtures/`. `scripts/lib/` and generic replacement roots such as `scripts/internal/` are forbidden. Private directory names beneath a Phase may be refined during Apply when current dependency clusters are inspected, but ownership may not move outside this tree.

The MD side owns the lifecycle vocabulary; the JS side mirrors it for navigation and enforcement. An alternative capability-only tree was rejected because it would still require translating workflow Phase language into unrelated physical paths. A file-type tree was rejected because it recreates the current flat ownership problem one level lower.

### 2. Phase interfaces are deep module seams

Each active Phase (`00`, `01`, `02`, `03`, and `05`) exposes one `index.mjs` interface. The interface presents cohesive operations needed by callers and hides physical artifact paths, receipt formats, runtime setup, transaction mechanics, and private helper composition. It is not a barrel that re-exports every implementation function.

The Phase 3 module owns the complete local Stage 1-5 production adapter. The Phase 5 module owns local maintenance, structural versioning, migration, and the isolated markerless legacy adapter. This gives callers leverage through a small interface and gives maintainers locality: implementation changes and verification remain inside the owning Phase.

Tests and callers use the same seam. Existing tests that assert private wiring are replaced by interface tests when the interface covers the same behavior. Versioned pure contracts, golden fixtures, and true external-adapter tests remain direct where their stable contract is itself the subject.

An alternative of preserving every current export in a root compatibility barrel was rejected because it would create a shallow module and keep the old coupling alive. Old-path shim files were rejected for the same reason.

### 3. Enforce a one-way import graph

The architecture checker parses static ESM imports and enforces:

```text
ppt_flow -> active Phase interfaces + shared/cli
active Phase -> own private implementation + allowed shared modules + contracts
shared -> shared + contracts
contracts (data) -> no imports
contracts (generator tools) -> owning public Phase interface + shared identity
```

Additional rules are:

- `ppt_flow.mjs` never imports a Phase private path, direct Phase CLI, or non-CLI shared implementation.
- `shared/` never imports a numbered Phase.
- A Phase never imports another Phase's `internal/`, direct executable, or physical artifact-path constant.
- Phase 3 consumes Phase 1 and Phase 2 only through their interfaces.
- Phase 5 invokes another owner only through that owner's interface.
- Contract generator tools may consume an owning public Phase interface to produce versioned contract data, but production Phases never import a generator tool.
- No modern Image2 code imports legacy Image2 implementation, and the legacy module cannot import the future Phase 4 implementation.

The checker is architecture enforcement owned by JS repository maintenance; it does not define workflow behavior. A runtime dependency-injection container was rejected because static ESM imports and a small number of stable interfaces are sufficient.

### 4. Keep one stable front controller and move direct executables

`ppt_flow.mjs` remains at the scripts root and remains the only command path users need to remember. Registered direct executables move to their owner paths:

| Executable owner | Direct paths after migration |
|---|---|
| root | `ppt_flow.mjs` |
| Phase 0 | `00-setup/env-check.mjs` |
| Phase 3 | `03-html-production/stage1_build_inputs.mjs`, `stage2_render_html.mjs`, `stage3_compose_slides.mjs`, `stage4_build_pptx.mjs`, `stage5_inject_notes.mjs`, `unified_pipeline.mjs` |
| Phase 5 legacy | `05-iteration/legacy-image2/generate_style_master.mjs`, `make_contact_sheet.mjs`, `stage2_generate_images.mjs`, `stage3_lock_headers.mjs` |
| shared run-bundle | `shared/run-bundle/bundle_layout.mjs`, `shared/run-bundle/lessons.mjs` |

The executable inventory stores normalized paths, not basenames, so duplicate filenames cannot hide ownership errors. Direct-entry detection remains recursive. Help, exit status, stdout JSON, final stderr envelope, diagnostic redaction, and child-process behavior are unchanged.

Old direct paths are removed in the same commit that updates `ppt_flow`, docs, controller references, audits, tests, and OpenSpec path references. A compatibility shim collection was rejected because it would make the architecture checker unable to distinguish the canonical owner and would indefinitely preserve the flat interface.

### 5. Reserve Phase 4 without creating a hypothetical implementation

During Change 4, `04-image2-refinement/` contains only an unavailable README and has no `index.mjs`, direct executable, adapter, or import edge. Legacy whole-page Image2 remains entirely within `05-iteration/legacy-image2/`.

Change 5 will place the modern Image2 transport port at an internal seam inside the Phase 4 module. The production provider adapter and a test fake will make that a real two-adapter seam; ordinary HTML production and local iteration will not receive the port. Change 4 records and checks the reserved ownership but does not create a placeholder port or pass-through adapter.

An immediately shared legacy/modern provider module was rejected because the two business models have different authorization and attempt semantics. Shared extraction or transport behavior may only be reconsidered after Change 5 can demonstrate a genuinely common interface without leaking either business implementation.

### 6. Mirror source ownership in tests

The test roots become:

```text
tests/{00-setup,01-content,02-visual-system,03-html-production,04-image2-refinement,05-iteration,shared,contracts,helpers}
tests_e2e/{00-setup,01-content,02-visual-system,03-html-production,04-image2-refinement,05-iteration,helpers}
```

Fresh HTML delivery E2E belongs to `tests_e2e/03-html-production/`. Structural, migration, state-machine maintenance, lessons, and markerless legacy journeys belong to `tests_e2e/05-iteration/` unless their final owner is Phase 0. Future paid refinement belongs only to `tests_e2e/04-image2-refinement/`.

`tests/helpers/` and `tests_e2e/helpers/` may build inputs, temporary directories, and fake adapters, but cannot copy production parsing, state, fingerprint, or path rules. `vitest.config.mjs` uses recursive discovery. No root `tests/test_*.mjs` or `tests_e2e/test-*.mjs` business suite remains.

### 7. Add one machine-readable ownership manifest

A checked-in JSON manifest under `tests/contracts/` maps each active Phase interface, shared interface, and registered direct executable to exactly one unit/integration owner and zero or more E2E journey owners. Entries use repository-relative normalized paths. The manifest does not duplicate CLI schemas or source behavior; it records ownership only.

The architecture checker verifies that:

- every required source interface and executable has exactly one unit/integration owner;
- every referenced test exists under the matching owner directory;
- no source or test has multiple owners;
- no old flat path remains;
- Phase 4 has only its absence/unavailability contract in Change 4.

An inferred filename convention alone was rejected because renamed or consolidated tests can satisfy ownership without having one mechanical filename per private module.

### 8. Preserve behavior with an atomic migration sequence

Apply proceeds by ownership cluster, but the repository is not considered valid until all paths and audits are switched together:

1. Add the target directories, Phase interfaces, ownership manifest, and architecture checker while current files still exist.
2. Move categorized shared modules and contracts; update imports within one cluster at a time.
3. Move Phase 1/2 implementation and expose their interfaces.
4. Move Phase 3 HTML production and direct executables; update `ppt_flow` delegation.
5. Move Phase 5 structural, migration, lessons, and legacy Image2 implementation.
6. Move tests into mirrored owners, replace private-wiring tests with interface tests, and enable recursive discovery.
7. Update all active docs, playbooks, OpenSpec path references, executable/return audits, and coherence checks.
8. Remove root business files and `scripts/lib/`; run old-path and architecture checks before full regression.

Rollback is a Git revert of the complete migration commit or commit series. There is no data migration and no run-bundle rewrite. Partial rollback by restoring shims is forbidden because it would leave two active interfaces.

### 9. Verify at the correct surfaces

- Unit tests verify pure contracts and private algorithms only where those contracts are stable and owned locally.
- Integration tests exercise each Phase interface, direct executable envelope/help behavior, import rules, source-to-test ownership, docs coherence, and recursive discovery.
- E2E tests exercise the public `ppt_flow` surface for fresh HTML delivery and Phase 5 structural/migration/legacy journeys.
- Existing doctor, runtime evidence, benchmark, bundle self-check, CLI return audit, full `npm test`, and strict OpenSpec checks remain required.

Artifact and receipt equivalence is checked through existing golden/acceptance suites. No production `deck_*` or `dpt_*` directory is used as a fixture.

## Risks / Trade-offs

- **[Risk] A large path migration can leave hidden dynamic imports or documentation references stale.** -> Use recursive import/reference scans, normalized executable paths, old-path rejection, and complete regression before removing old files.
- **[Risk] Phase interfaces become shallow barrels.** -> Require cohesive interface operations, forbid blanket private re-exports, and replace implementation-coupled tests with interface tests.
- **[Risk] `shared/` becomes the next dumping ground.** -> Allow only `cli`, `run-bundle`, `state`, and `identity`; require source/test ownership and reject Phase imports from shared.
- **[Risk] Moving files accidentally changes `import.meta.url`-relative resource resolution.** -> Move path resolution behind owning interfaces and run font/runtime/fixture/doctor tests plus artifact equivalence checks.
- **[Risk] Direct executable consumers outside active framework docs break.** -> Treat the path move as explicitly breaking, preserve `ppt_flow` as canonical, update all active repository references atomically, and do not claim support for undeclared old direct paths.
- **[Trade-off] Numeric directory names require quoted or explicit relative imports in some tooling.** -> Node ESM and Vitest accept numeric-leading path segments; the ownership clarity is worth the minor path verbosity.

## Migration Plan

The migration is repository-only and requires no state heal, run-bundle conversion, or generated-artifact rebuild. Implementation shall follow Decision 8, preserve a clean comparison point before moves, and validate after every ownership cluster. Final cutover removes old paths only after the new interfaces, imports, tests, docs, and registries agree.

If verification fails after old paths are removed, revert the complete Change 4 implementation rather than introduce temporary shims. Existing run bundles remain usable with the pre-change framework because their on-disk schema is unchanged.

## Open Questions

None. Private filenames and the exact grouping inside each owning `internal/` directory may be refined during Apply from the observed dependency graph, provided the specified interfaces, import rules, root whitelist, and behavior-preservation constraints remain unchanged.
