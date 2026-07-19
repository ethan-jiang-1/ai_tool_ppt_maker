## MODIFIED Requirements

### Requirement: Canonical run-bundle tree and directory roles

A conformant run bundle SHALL remain rooted at `deck_{NAME}/` with `1_upstream_raw_material/`, `2_backbone/`, `3_versions/v{n}/` as `--run-dir`, deck-root `_state/`, and `_lessons/`. `_state/` SHALL allow durable `state.yaml`/README plus transient `gate-approval-journal.json` owned only by recoverable gate publication; the journal's absence is normal and its presence never independently proves approval. A version SHALL contain source `slide-specifications.md`, `overrides/`, rebuildable `_generated/`, and deletable `_scratch/`.

For HTML-first runs, `_generated/html_production/` SHALL own `html_pages/`, `final_slides/`, and `preview/`; each SHALL contain an `objects/` directory for immutable raw-byte-SHA-addressed bytes, one `manifest.json` as its current-set pointer, and MAY transiently contain exclusive `.publish.lock/owner.json`, `.manifest.<64hex-owner-token>.tmp`, plus object-directory `.object.<64hex-owner-token>.<64hex-byte-sha>.tmp`. No other lock/temp child is valid. Their exact manifest schemas SHALL be `pptmaker-html-pages-manifest-v1`, `pptmaker-html-final-slides-manifest-v1`, and `pptmaker-html-preview-manifest-v1` respectively. Canonical current manifests/locks and `pptmaker-html-review-plan-v1` preview plans SHALL bind the state-owned nullable HTML-production reset ID; migration-preview equivalents use null. `preview/` SHALL additionally contain immutable canonical `plans/<review-plan-hash>.json`; its manifest SHALL hold independent current slots for content/visual plans and visual-review/delivery contact sheets rather than one overloaded pointer. Object/plan paths are rebuildable and non-current unless referenced by the owning manifest. Normal Change-3 publication SHALL not delete unreferenced final objects/plans; no garbage-collection interface is introduced. `_generated/qa/` SHALL own assembly/notes receipts plus optional exact `html_migration.json` only on a clean migrated target; HTML assembly/notes receipts bind the current reset ID, while `html_migration.json` is publication/handoff provenance and never completion authority. Optional Image2 refinement physical partitions are reserved as lazy paths: `_scratch/image2_refinement/`, `_generated/image2_refinement/`, and accepted source assets under `overrides/visual-style/assets/refined/image2/{style-reference,visual-slots}/`; their absence is conformant and Change 3 SHALL NOT create them. `1_upstream_raw_material/` SHALL NOT accept generated/rejected Image2 history.

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

### Requirement: Glossary Where Map is the GREP placement index

`PPTMAKER_FRAMEWORK/reference/glossary.md` SHALL retain a GREP-friendly Where Map with term/path/meaning/do-not fields and exact searchable headings/tokens for at least run bundle, soft bundle, `--run-dir`, `_scratch/`, `_generated/`, `html_production`, `style_master.jpg`, `contact_sheet`/pilot, `_state/`, and `_lessons/`. It SHALL distinguish deck root from version run-dir and source/control from rebuildable/deletable outputs.

Placement entries SHALL be pipeline-specific: HTML pages/final slides/review/delivery contact sheets/plans belong under version-local `_generated/html_production/`; markerless contact sheets remain `_generated/preview/`; `style_master.jpg` is markerless legacy compatibility only; Image2-refinement paths are unavailable/lazy in Change 3. The map SHALL not direct manual edits/copies into `_generated/`, cross-version manifest references, or HTML evidence into legacy paths.

#### Scenario: Agent searches HTML contact sheet

- **WHEN** Agent greps `contact_sheet` for an HTML-first run
- **THEN** the Where Map identifies `_generated/html_production/preview/` and its owning manifest

#### Scenario: Agent searches legacy style master

- **WHEN** Agent greps `style_master.jpg`
- **THEN** the entry labels it markerless legacy-only rather than a new-deck prerequisite

#### Scenario: Run bundle and run-dir remain distinct

- **WHEN** Agent reads both definitions
- **THEN** run bundle is `deck_NAME/` and `--run-dir` is `3_versions/vN/`

### Requirement: Structured source control remains inside the existing run-bundle topology

HTML-first source SHALL remain canonical `3_versions/vN/slide-specifications.md`; shared/sparse assets and v2 catalogs SHALL remain under backbone/version-override `visual-style/assets/`; physical slide-block order SHALL remain sole source order. Every plan/diagnostic/receipt/generated-manifest path SHALL be normalized POSIX and confined relative to its owning deck/run version, never absolute, traversal-based, or cross-version. Asset whitelist and byte integrity SHALL retain their existing owners.

`ppt_flow validate`, direct Stage-1 validation, and unified Stage-1 dry-run SHALL remain write-free. Canonical write-enabled Stage 1 SHALL publish only `_generated/slide_plan.json`. Change-3 HTML Stages 2-5 MAY publish only the canonical rebuildable HTML-production/QA/PPTX outputs and state evidence defined by their owning capabilities; they SHALL add no source/control directory and no Image2 refinement path. Legacy branch outputs remain isolated.

#### Scenario: HTML source uses canonical version paths

- **WHEN** a run uses `html-first-v1`
- **THEN** source/control remain in the existing version/backbone/override locations
- **AND** derived HTML output remains under version-local `_generated/html_production/`

#### Scenario: Validation remains write-free

- **WHEN** any general HTML validation route runs
- **THEN** source, generated, state, and migration bytes remain unchanged

#### Scenario: Stage 1 writes only the projection

- **WHEN** canonical write-enabled Stage 1 succeeds
- **THEN** it atomically replaces only `_generated/slide_plan.json`

#### Scenario: HTML production paths are confined

- **WHEN** Stages 2-5 publish HTML delivery
- **THEN** every object/manifest/receipt path is target-run-owned and confined
- **AND** no Image2 candidate/refinement directory is created

## ADDED Requirements

### Requirement: HTML production and Image2 refinement partitions cannot be confused

Bundle validation SHALL apply distinct immediate-entry whitelists and ownership labels to HTML production, Image2 scratch/generated, and accepted override assets. HTML current manifests may reference only confined objects under their own run-version HTML-production owner plus canonical source/control/framework receipts; target manifests SHALL not reference another version's objects. Image2 paths SHALL remain unavailable/lazy in Change 3 and SHALL not satisfy HTML final-slide, gate, assembly, or notes evidence.

#### Scenario: Candidate appears under HTML production

- **WHEN** an Image2 candidate/plan/authorization-shaped file appears under `_generated/html_production/`
- **THEN** bundle self-check reports an ownership violation

#### Scenario: HTML build has no refinement directories

- **WHEN** a user finishes after HTML delivery
- **THEN** the run remains conformant with all reserved Image2 directories absent

### Requirement: Legacy migration scratch is temporary and version-local

An explicit migration preview MAY use `_scratch/html-migration/` for candidate source/control, comparison artifacts, the hash-bound plan, and exact transient `apply-journal.json`. Its exact renderer workspace SHALL be `_scratch/html-migration/projected-run/`, with transaction-owned source/control/assets, scratch `_generated/slide_plan.json`, and scratch `_generated/html_production/` using the normal private object/manifest shapes but `publication_scope: migration-preview`. The workspace SHALL be version-local, confined, deletable, excluded from source truth, and never accepted by normal preview/build/gates/state/assembly/notes/completion conditions. Direct renderer CLIs SHALL not accept it as `--run-dir`; only the closed migration validator/orchestrator may issue its opaque render context. Apply SHALL publish only a clean new version, SHALL rerender its hidden canonical target, and SHALL not copy scratch generated objects/manifests/locks/receipts into that target. While a valid/uncertain apply journal exists, no whole migration-scratch reset may delete it; the apply recovery matrix owns its resolution first.

#### Scenario: Migration preview is abandoned

- **WHEN** the user declines a migration comparison
- **THEN** deleting `_scratch/html-migration/` loses no source, version, gate, or production truth

#### Scenario: Scratch manifest is placed under canonical HTML production

- **WHEN** a `publication_scope: migration-preview` manifest or receipt appears under a visible version's canonical `_generated/html_production/`
- **THEN** bundle validation reports an ownership violation
