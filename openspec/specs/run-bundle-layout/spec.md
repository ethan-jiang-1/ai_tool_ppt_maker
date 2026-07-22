## Purpose

Define the canonical **run bundle** (`deck_{NAME}/`) directory ontology: three-tier tree, per-directory roles, structure gradient (上严下松 / upper-strict lower-loose), and GREP-friendly placement index (Where Map in `reference/glossary.md`).

Counterpart to `framework-directory-layout` (soft bundle `PPTMAKER_FRAMEWORK/` only). Do not merge the two.

Machine authority for tree text and path constants: `PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs` (`renderTree()`). CLI scaffold/validate behavior is owned by `run-bundle-management` on the same module.
## Requirements
### Requirement: Canonical run-bundle tree and directory roles

A conformant run bundle SHALL remain rooted at `deck_{NAME}/` with `1_upstream_raw_material/`, `2_backbone/`, `3_versions/v{n}/` as `--run-dir`, deck-root `_state/`, and `_lessons/`. `_state/` SHALL allow durable `state.yaml`/README plus transient `gate-approval-journal.json` owned only by recoverable gate publication; the journal's absence is normal and its presence never independently proves approval. A version SHALL contain source `slide-specifications.md`, `overrides/`, rebuildable `_generated/`, and deletable `_scratch/`.

For HTML-first runs, `_generated/html_production/` SHALL own `html_pages/`, `final_slides/`, and `preview/`; each SHALL contain an `objects/` directory for immutable raw-byte-SHA-addressed bytes, one `manifest.json` as its current-set pointer, and MAY transiently contain exclusive `.publish.lock/owner.json`, `.manifest.<64hex-owner-token>.tmp`, plus object-directory `.object.<64hex-owner-token>.<64hex-byte-sha>.tmp`. No other lock/temp child is valid. Their exact manifest schemas SHALL be `pptmaker-html-pages-manifest-v1`, `pptmaker-html-final-slides-manifest-v1`, and `pptmaker-html-preview-manifest-v1` respectively. Canonical current manifests/locks and `pptmaker-html-review-plan-v1` preview plans SHALL bind the state-owned nullable HTML-production reset ID; migration-preview equivalents use null. `preview/` SHALL additionally contain immutable canonical `plans/<review-plan-hash>.json`; its manifest SHALL hold independent current slots for content/visual plans and visual-review/delivery contact sheets rather than one overloaded pointer. Object/plan paths are rebuildable and non-current unless referenced by the owning manifest. Normal publication SHALL not delete unreferenced final objects/plans; no garbage-collection interface is introduced. `_generated/qa/` SHALL own assembly/notes receipts plus optional exact `html_migration.json` only on a clean migrated target; HTML assembly/notes receipts bind the current reset ID, while `html_migration.json` is publication/handoff provenance and never completion authority. For marked HTML-first versions, modern refinement is lazy: accepted style-reference and visual-slot bytes live only at `overrides/visual-style/assets/refined/image2/{style-reference,visual-slots}/`; the only refinement source-control file is `overrides/visual-style/image2-refinement.yaml`; candidates/comparisons/attempt evidence live only at `_generated/image2_refinement/`; and the exclusive promotion journal lives only at `_scratch/image2_refinement/`. These paths are absent until explicit refinement, never satisfy HTML delivery evidence, and rejected/generated history never enters `1_upstream_raw_material/`.

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

### Requirement: Structure gradient upper-strict lower-loose

Run-bundle layout SHALL follow **stricter toward the root, looser toward the leaves** (上严下松 / structure gradient): deck root admits only constitutionally named control files and first-class directories; mid-tier dirs remain whitelist-bound; a version dir admits source + `overrides/` + `_generated/` + `_scratch/`; `_scratch/` internals are not filename-whitelisted. Temporary files SHALL sink down into `_scratch/` and SHALL NOT be placed at the deck root or in invented dirs named `_tmp/`, `backup/`, or `_bak/`.

#### Scenario: Gradient names root strictest and scratch loosest

- **WHEN** Agent reads the structure-gradient / 上严下松 definition under this capability or its Where Map
- **THEN** the text states the deck root is the strictest layer
- **AND** version `_scratch/` is the official loose temp outlet

### Requirement: Glossary Where Map is the GREP placement index

`PPTMAKER_FRAMEWORK/reference/glossary.md` SHALL retain a GREP-friendly Where Map with term/path/meaning/do-not fields and exact searchable headings/tokens for at least run bundle, soft bundle, `--run-dir`, `_scratch/`, `_generated/`, `html_production`, `style_master.jpg`, `contact_sheet`/pilot, `_state/`, and `_lessons/`. It SHALL distinguish deck root from version run-dir and source/control from rebuildable/deletable outputs.

Placement entries SHALL be pipeline-specific: HTML pages/final slides/review/delivery contact sheets/plans belong under version-local `_generated/html_production/`; markerless contact sheets remain `_generated/preview/`; `style_master.jpg` is markerless legacy compatibility only; Image2-refinement paths are optional/lazy after explicit authorization. The map SHALL not direct manual edits/copies into `_generated/`, cross-version manifest references, or HTML evidence into legacy paths.

#### Scenario: Agent searches HTML contact sheet

- **WHEN** Agent greps `contact_sheet` for an HTML-first run
- **THEN** the Where Map identifies `_generated/html_production/preview/` and its owning manifest

#### Scenario: Agent searches legacy style master

- **WHEN** Agent greps `style_master.jpg`
- **THEN** the entry labels it markerless legacy-only rather than a new-deck prerequisite

#### Scenario: Run bundle and run-dir remain distinct

- **WHEN** Agent reads both definitions
- **THEN** run bundle is `deck_NAME/` and `--run-dir` is `3_versions/vN/`

### Requirement: Run-bundle root admits an agent-agnostic generated entry control

The canonical strict deck root SHALL admit `RUN_BUNDLE.md` and `AGENTS.md` as named control
files alongside `CLAUDE.md` and `deck-guide.md`, without loosening any other root name.
`RUN_BUNDLE.md` SHALL be the static portable locator manifest. `deck-guide.md` SHALL remain the
detailed in-bundle operating guide; it SHALL NOT be re-roled into a locator manifest.
`AGENTS.md` and `CLAUDE.md` SHALL be short agent-agnostic pointers that direct an Agent first to
the locator and then to the guide, not a second workflow or directory ontology. `README.md` SHALL
tell a human that `RUN_BUNDLE.md` is the file to hand to an Agent. `bundle_layout.mjs` constants,
deck-root whitelist, module tree comment, and `renderTree()` SHALL agree on these controls.

`RUN_BUNDLE.md` SHALL contain only a closed static locator record and short handoff prose. It
SHALL NOT claim current run version, production mode, node, gate, digest, next action, or
approval. Legacy bundles without `RUN_BUNDLE.md` or `AGENTS.md` remain structurally valid;
validation SHALL not require either file merely because it is newly allowed. `bundle_layout.mjs`
SHALL retain one narrow root-control validator for both normal structure checking and locator
verification; it SHALL validate the strict root names and mandatory legacy controls, treat
`RUN_BUNDLE.md` as optional, and neither read state nor select a version.

#### Scenario: Canonical tree shows distinct Agent entry controls

- **WHEN** init creates a fresh bundle
- **THEN** the root contains a `RUN_BUNDLE.md` locator and a separate `deck-guide.md` guide
- **AND** its Agent pointers preserve both roles in that order

#### Scenario: Legacy deck remains valid

- **WHEN** an existing conformant run bundle lacks `RUN_BUNDLE.md` or `AGENTS.md`
- **AND** structure validation runs
- **THEN** absence of that optional compatibility control alone does not fail validation

### Requirement: Visual-style directory optionally includes assets subdirectory

The canonical `2_backbone/visual-style/` directory MAY contain an `assets/` subdirectory. When present, it SHALL contain `asset-manifest.yaml`, `svg/`, `reference/`, and `icons/`. `renderTree()` SHALL include this subtree in its output regardless of whether a given deck has populated it — the tree describes the canonical structure, not runtime state. The whitelist `_ALLOWED_IN_VISUAL_STYLE` SHALL include `assets` as an allowed entry so that decks with assets pass validation. A new whitelist `_ALLOWED_IN_ASSETS` SHALL define the allowed contents of the `assets/` directory. Decks without an `assets/` directory SHALL pass `checkBundle()` without error — the directory is optional infrastructure.

For a version override, `_ALLOWED_IN_VISUAL_STYLE` SHALL additionally admit exactly `assets/` and `image2-refinement.yaml`; no other refinement control file is valid. `image2-refinement.yaml` is lazy and is not an asset-manifest entry.

#### Scenario: renderTree shows assets directory

- **WHEN** Agent inspects `renderTree()` output
- **THEN** the tree includes `assets/` under `visual-style/`
- **AND** includes `asset-manifest.yaml`, `svg/`, `reference/`, and `icons/`

#### Scenario: Assets directory is whitelisted in visual-style

- **WHEN** `checkBundle()` validates a deck with an `assets/` directory under `visual-style/`
- **THEN** the `assets/` directory itself passes validation (is in the whitelist)
- **AND** only canonical entries inside `assets/` are accepted

#### Scenario: Deck without assets directory passes validation

- **WHEN** `checkBundle()` validates a deck that has no `assets/` directory under `visual-style/`
- **THEN** validation passes without error
- **AND** no "missing assets directory" message is emitted

#### Scenario: Unexpected entry in assets directory is flagged

- **WHEN** a run bundle has a manually created unexpected file in `visual-style/assets/`
- **THEN** `checkBundle()` reports it as an unexpected entry

#### Scenario: Refinement provenance is whitelisted narrowly

- **WHEN** a refined version contains `overrides/visual-style/image2-refinement.yaml`
- **THEN** it passes structure validation while an alternate provenance filename fails

### Requirement: Path resolvers provide assets directory access

`bundle_layout.mjs` SHALL export `assetsDir(runDir)` resolving to the assets directory path (via `resolveBackboneAsset`, checking override first). It SHALL also export `resolveAssetPath(runDir, relpath)` resolving a relative path from the assets directory. Both SHALL follow the existing override-first-then-backbone resolution pattern.

#### Scenario: assetsDir resolves to backbone by default

- **WHEN** `assetsDir(runDir)` is called on a version with no asset overrides
- **THEN** the returned path is `{deckRoot}/2_backbone/visual-style/assets/`

#### Scenario: resolveAssetPath follows override-first pattern

- **WHEN** `resolveAssetPath(runDir, "svg/diagram.svg")` is called
- **AND** a version override exists at `3_versions/v{n}/overrides/visual-style/assets/svg/diagram.svg`
- **THEN** the override path is returned, not the backbone path

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

### Requirement: Derived contract artifacts are rebuildable

Any resolved plan, merged catalog, diagnostic, or fingerprint evidence produced by the contract SHALL be rebuildable from canonical `slide-specifications.md`, the one effective visual config, v2 manifests and registered asset bytes, checked-in `PPTMAKER_FRAMEWORK/scripts/contracts/html-family-geometry-v1.json`, and the verified framework font authority. The existing `_generated/slide_plan.json` MAY carry the resolved plan but SHALL not become an order/content/selection source of truth.

#### Scenario: Deleting derived contract output is safe

- **WHEN** a derived structured-plan receipt is deleted
- **THEN** the next canonical write-enabled unified Stage 1 rebuilds it from canonical source/control/framework inputs
- **AND** no source or slide order is lost

### Requirement: HTML production and Image2 refinement partitions cannot be confused

Bundle validation SHALL apply distinct immediate-entry whitelists and ownership labels to HTML production, Phase-4 generated/scratch partitions, and accepted override assets. HTML current manifests may reference only their own final-slide objects plus canonical source/control receipts; Phase-4 candidates and journals SHALL never be current HTML manifests, gate, assembly, notes, or delivery evidence.

#### Scenario: Candidate appears under HTML production

- **WHEN** an Image2 candidate/plan/authorization-shaped file appears under `_generated/html_production/`
- **THEN** bundle self-check reports an ownership violation

#### Scenario: HTML build has no refinement directories

- **WHEN** a user finishes after HTML delivery
- **THEN** the run remains conformant with all reserved Image2 directories absent

### Requirement: Legacy migration scratch is temporary and version-local

An explicit migration preview MAY use `_scratch/html-migration/` for a projected candidate overlay, comparison artifacts, the hash-bound plan, and exact transient `apply-journal.json`. Its exact renderer workspace SHALL be `_scratch/html-migration/projected-run/`. The projected root SHALL contain exactly proposed `slide-specifications.md`, sparse normal `overrides/`, `preparation.json`, `authoring-context.json`, `authoring-checklist.json`, and scratch `_generated/slide_plan.json` plus `_generated/html_production/` using normal private object/manifest shapes with `publication_scope: migration-preview`. Candidate source and sparse overrides are writable only inside this root; all unchanged source-version overrides and deck-root backbone controls are inherited read-only through the closed migration candidate resolver. The projected root is not a deck root and SHALL not contain or replace deck-root metadata/state. `preparation.json` is an idempotency/input record, `authoring-context.json` is Agent-only legacy reference, and `authoring-checklist.json` is advisory; none is runtime target authority.

The workspace SHALL be version-local, confined, deletable, excluded from normal source truth, and never accepted by normal preview/build/gates/state/assembly/notes/completion conditions. Direct renderer CLIs SHALL not accept it as `--run-dir`; only the closed migration validator/orchestrator may issue its opaque render context. Preview SHALL recompute readiness from candidate source/overrides rather than trusting support JSON. Apply SHALL construct a hidden clean target from the same inherited source-version/backbone inputs, copy only revalidated `slide-specifications.md` and `overrides/` from the candidate, rerender its hidden canonical target, and SHALL not copy the legacy source tree, support JSON, or scratch generated objects/manifests/locks/receipts into that target. While a valid/uncertain apply journal exists, no whole migration-scratch reset may delete it; the apply recovery matrix owns its resolution first.

#### Scenario: Migration preview is abandoned

- **WHEN** the user declines a migration comparison
- **THEN** deleting `_scratch/html-migration/` loses no source, version, gate, or production truth

#### Scenario: Projected candidate inherits backbone without rewriting it

- **WHEN** migration preparation creates a projected candidate with one sparse visual override
- **THEN** unchanged controls resolve from the source-version override or deck-root backbone by the candidate precedence
- **AND** no deck-root control or source-version override is rewritten

#### Scenario: Scratch manifest is placed under canonical HTML production

- **WHEN** a `publication_scope: migration-preview` manifest or receipt appears under a visible version's canonical `_generated/html_production/`
- **THEN** bundle validation reports an ownership violation

### Requirement: Production-mode transition scratch is isolated and layout-validated

The canonical version-local `_scratch/` owner set SHALL admit
`_scratch/production-mode-transition/` only for the general cross-pipeline transition adapter. Its
immediate entries SHALL be exactly `candidate-run/`, `plan.json`, and `apply-journal.json`; their internals
remain scratch-local and deletable. The only target-visible receipt is
`_generated/qa/production_mode_transition.json`. `bundle_layout.mjs` SHALL validate those exact entries,
their path confinement, the target QA receipt placement, and artifact ownership without admitting them at
the version root, another version, `_generated/` outside that QA receipt, `_state/`, or legacy
`_scratch/html-migration/`. The legacy migration scratch owner and the production-mode transition owner
shall neither widen nor validate each other's artifact names as authority.

#### Scenario: Transition scratch remains version-local

- **WHEN** a source version has a valid production-mode-transition candidate and journal
- **THEN** bundle layout accepts only its declared owner under that source version's `_scratch/`
- **AND** the same names at the version root or a target version fail structure validation

#### Scenario: Legacy scratch cannot be adopted

- **WHEN** both `_scratch/html-migration/` and `_scratch/production-mode-transition/` exist
- **THEN** layout validates each immediate-entry contract independently
- **AND** no legacy artifact is accepted as a production-mode-transition plan, journal, or receipt
