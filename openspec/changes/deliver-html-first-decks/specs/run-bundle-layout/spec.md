## MODIFIED Requirements

### Requirement: Canonical run-bundle tree and directory roles

A conformant run bundle SHALL remain rooted at `deck_{NAME}/` with `1_upstream_raw_material/`, `2_backbone/`, `3_versions/v{n}/` as `--run-dir`, deck-root `_state/`, and `_lessons/`. A version SHALL contain source `slide-specifications.md`, `overrides/`, rebuildable `_generated/`, and deletable `_scratch/`.

For HTML-first runs, `_generated/html_production/` SHALL own `html_pages/`, `final_slides/`, and `preview/` plus their manifests. `_generated/qa/` SHALL own assembly/notes receipts. Optional Image2 refinement physical partitions are reserved as lazy paths: `_scratch/image2_refinement/`, `_generated/image2_refinement/`, and accepted source assets under `overrides/visual-style/assets/refined/image2/{style-reference,visual-slots}/`; their absence is conformant and Change 3 SHALL NOT create them. `1_upstream_raw_material/` SHALL NOT accept generated/rejected Image2 history.

Legacy `style_master.jpg`, prompt/image/header directories, and their manifests remain compatibility-owned and SHALL not be required or created by new HTML-first init/build. `bundle_layout.mjs` `renderTree()` SHALL describe the pipeline-specific and lazy roles without presenting generated paths as source truth.

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

## ADDED Requirements

### Requirement: HTML production and Image2 refinement partitions cannot be confused

Bundle validation SHALL apply distinct immediate-entry whitelists and ownership labels to HTML production, Image2 scratch/generated, and accepted override assets. HTML manifests may reference only HTML-production paths plus canonical source/control/framework receipts. Image2 paths SHALL remain unavailable/lazy in Change 3 and SHALL not satisfy HTML final-slide, gate, assembly, or notes evidence.

#### Scenario: Candidate appears under HTML production

- **WHEN** an Image2 candidate/plan/authorization-shaped file appears under `_generated/html_production/`
- **THEN** bundle self-check reports an ownership violation

#### Scenario: HTML build has no refinement directories

- **WHEN** a user finishes after HTML delivery
- **THEN** the run remains conformant with all reserved Image2 directories absent

### Requirement: Legacy migration scratch is temporary and version-local

An explicit migration preview MAY use `_scratch/html-migration/` for candidate source/control, comparison artifacts, and the hash-bound plan. This directory SHALL be version-local, deletable, excluded from source truth, and never accepted by normal build or state completion conditions. Apply SHALL publish only a clean new version and its canonical source/control tree.

#### Scenario: Migration preview is abandoned

- **WHEN** the user declines a migration comparison
- **THEN** deleting `_scratch/html-migration/` loses no source, version, gate, or production truth
