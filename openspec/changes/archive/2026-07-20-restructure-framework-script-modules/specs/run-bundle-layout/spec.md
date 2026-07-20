## MODIFIED Requirements

### Requirement: Canonical run-bundle tree and directory roles

The machine authority for the run-bundle tree, path constants, and `renderTree()` SHALL be the public module at `PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs`. A conformant run bundle SHALL remain rooted at `deck_{NAME}/` with `1_upstream_raw_material/`, `2_backbone/`, `3_versions/v{n}/` as `--run-dir`, deck-root `_state/`, and `_lessons/`. `_state/` SHALL allow durable `state.yaml`/README plus transient `gate-approval-journal.json` owned only by recoverable gate publication; the journal's absence is normal and its presence never independently proves approval. A version SHALL contain source `slide-specifications.md`, `overrides/`, rebuildable `_generated/`, and deletable `_scratch/`.

For HTML-first runs, `_generated/html_production/` SHALL own `html_pages/`, `final_slides/`, and `preview/`; each SHALL contain an `objects/` directory for immutable raw-byte-SHA-addressed bytes, one `manifest.json` as its current-set pointer, and MAY transiently contain exclusive `.publish.lock/owner.json`, `.manifest.<64hex-owner-token>.tmp`, plus object-directory `.object.<64hex-owner-token>.<64hex-byte-sha>.tmp`. No other lock/temp child is valid. Their exact manifest schemas SHALL be `pptmaker-html-pages-manifest-v1`, `pptmaker-html-final-slides-manifest-v1`, and `pptmaker-html-preview-manifest-v1` respectively. Canonical current manifests/locks and `pptmaker-html-review-plan-v1` preview plans SHALL bind the state-owned nullable HTML-production reset ID; migration-preview equivalents use null. `preview/` SHALL additionally contain immutable canonical `plans/<review-plan-hash>.json`; its manifest SHALL hold independent current slots for content/visual plans and visual-review/delivery contact sheets rather than one overloaded pointer. Object/plan paths are rebuildable and non-current unless referenced by the owning manifest. Normal publication SHALL not delete unreferenced final objects/plans; no garbage-collection interface is introduced. `_generated/qa/` SHALL own assembly/notes receipts plus optional exact `html_migration.json` only on a clean migrated target; HTML assembly/notes receipts bind the current reset ID, while `html_migration.json` is publication/handoff provenance and never completion authority. Optional Image2 refinement physical partitions are reserved as lazy paths: `_scratch/image2_refinement/`, `_generated/image2_refinement/`, and accepted source assets under `overrides/visual-style/assets/refined/image2/{style-reference,visual-slots}/`; their absence is conformant and Change 4 SHALL NOT create them. `1_upstream_raw_material/` SHALL NOT accept generated/rejected Image2 history.

Legacy `style_master.jpg`, prompt/image/header directories, and their manifests remain compatibility-owned and SHALL not be required or created by new HTML-first init/build. The relocated `bundle_layout.mjs` `renderTree()` SHALL describe the pipeline-specific and lazy roles without presenting generated paths as source truth. Relocation SHALL NOT change any exported path constant or run-bundle path.

#### Scenario: Fresh HTML run tree is complete without Image2

- **WHEN** a fresh HTML-first deck completes build
- **THEN** it has structured source, HTML production pages/final slides/preview, PPTX/notes receipts, state, and lessons
- **AND** no Image2 scratch/generated/accepted directory is required or created

#### Scenario: --run-dir remains the version leaf

- **WHEN** a path is documented or validated as `--run-dir`
- **THEN** it resolves to `deck_*/3_versions/v{n}/` rather than the deck root

#### Scenario: Legacy deck remains conformant

- **WHEN** a markerless deck retains its style master and legacy generated directories
- **THEN** bundle validation recognizes them through the legacy compatibility shape
- **AND** does not require HTML migration

#### Scenario: Machine authority moves without ontology drift

- **WHEN** the framework imports or invokes the relocated bundle-layout owner
- **THEN** `renderTree()`, exported constants, resolvers, and validation describe the same run-bundle ontology as before the repository migration
