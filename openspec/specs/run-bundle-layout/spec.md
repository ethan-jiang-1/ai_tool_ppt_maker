## Purpose

Define the canonical **run bundle** (`deck_{NAME}/`) directory ontology: three-tier tree, per-directory roles, structure gradient (上严下松 / upper-strict lower-loose), and GREP-friendly placement index (Where Map in `reference/glossary.md`).

Counterpart to `framework-directory-layout` (soft bundle `PPTMAKER_FRAMEWORK/` only). Do not merge the two.

Machine authority for tree text and path constants: `PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs` (`renderTree()`). CLI scaffold/validate behavior is owned by `run-bundle-management` on the same module.
## Requirements
### Requirement: Canonical run-bundle tree and directory roles
A conformant run bundle SHALL remain rooted at deck_{NAME} with upstream material, backbone, and version
tiers; 3_versions/vN is the run-dir; deck root owns _state and _lessons; and a version owns canonical
slide-specifications.md, overrides, rebuildable _generated, and deletable _scratch. _state permits
durable state/README plus only the recoverable gate-publication journal; journal presence never proves
approval.

For html-first-v1, _generated/html_production owns html_pages, final_slides, and preview with
immutable object paths, one manifest current-set pointer per owner, and only their declared transient
lock/temp children. Canonical current manifests and review plans bind the current state-owned HTML reset
ID. preview holds canonical immutable plans and independent content/visual/review/delivery pointers.
Object/plan paths remain rebuildable and non-current unless an owning manifest references them. QA owns
current assembly/notes receipts and an optional production_mode_transition receipt only as
publication/handoff provenance, never completion authority. Refinement remains lazy under its declared
current source/control/generated/scratch owners.

For whole-page-image2-v1, current style master, prompt/image/header/contact-sheet artifacts use the
current whole-page adapter's declared paths and manifests. They are required only by a consistent
image2-only run and never by HTML init/build. No markerless layout, retired whole-page manifest, or
retired projected scratch path is a valid current run role. renderTree SHALL describe these
pipeline-specific/lazy roles without presenting generated paths as source truth.

#### Scenario: Fresh HTML run tree is complete without Image2
- **WHEN** a fresh HTML-first deck completes build
- **THEN** it has structured source, HTML production pages/final slides/preview, PPTX/notes receipts, state, and lessons
- **AND** no whole-page generated or accepted directory is required or created

#### Scenario: Current whole-page run tree has explicit ownership
- **WHEN** a consistent image2-only deck initializes or builds
- **THEN** its whole-page artifacts use current declared paths and source marker
- **AND** no compatibility layout is selected

#### Scenario: Run-dir remains the version leaf
- **WHEN** a path is documented or validated as --run-dir
- **THEN** it resolves to deck_/3_versions/vN rather than deck root

#### Scenario: Retired tree is presented
- **WHEN** layout sees a markerless or retired whole-page tree shape
- **THEN** it rejects that shape as current authority and names bounded repair/recreation

### Requirement: Structure gradient upper-strict lower-loose

Run-bundle layout SHALL follow **stricter toward the root, looser toward the leaves** (上严下松 / structure gradient): deck root admits only constitutionally named control files and first-class directories; mid-tier dirs remain whitelist-bound; a version dir admits source + `overrides/` + `_generated/` + `_scratch/`; `_scratch/` internals are not filename-whitelisted. Temporary files SHALL sink down into `_scratch/` and SHALL NOT be placed at the deck root or in invented dirs named `_tmp/`, `backup/`, or `_bak/`.

#### Scenario: Gradient names root strictest and scratch loosest

- **WHEN** Agent reads the structure-gradient / 上严下松 definition under this capability or its Where Map
- **THEN** the text states the deck root is the strictest layer
- **AND** version `_scratch/` is the official loose temp outlet

### Requirement: Glossary Where Map is the GREP placement index
The framework glossary SHALL retain a GREP-friendly Where Map with term/path/meaning/do-not fields for
run bundle, soft bundle, run-dir, _scratch, _generated, html_production, style_master, contact sheet or
pilot, _state, and _lessons. It SHALL distinguish deck root from version run-dir and source/control from
rebuildable/deletable outputs. HTML pages/final slides/review/delivery plans belong under version-local
HTML production; current whole-page contact sheets and style-master artifacts belong to their declared
whole-page owner paths; Image2 refinement is optional/lazy after explicit authorization. The map SHALL
not direct manual edits/copies into generated output, cross-version manifest references, current work
through a retired maintenance label, or any HTML-migration scratch path.

#### Scenario: Agent searches HTML contact sheet
- **WHEN** an Agent greps contact_sheet for an HTML-first run
- **THEN** the Where Map identifies the HTML preview owner and manifest

#### Scenario: Agent searches current whole-page style master
- **WHEN** an Agent greps style_master for an image2-only run
- **THEN** the entry identifies the current whole-page owner rather than a maintenance route

#### Scenario: Run bundle and run-dir remain distinct
- **WHEN** an Agent reads both definitions
- **THEN** run bundle is deck_NAME and run-dir is 3_versions/vN

### Requirement: Run-bundle root admits an agent-agnostic generated entry control
The canonical strict deck root SHALL admit RUN_BUNDLE.md and AGENTS.md alongside CLAUDE.md and deck-guide.md without loosening any other root name. RUN_BUNDLE.md is a static locator manifest; deck-guide.md is the operating guide; AGENTS.md and CLAUDE.md are short pointers to locator then guide. None claims current run version, mode, node, gate, digest, next action, or approval. The root-control validator is shared by structure checking and locator verification and neither reads state nor selects a version.

An older bundle may physically lack a newer locator or Agent card without failing structure-only validation. That tolerance is layout-only: it SHALL not establish current source/state identity, select a run, permit resume, or trigger a write. State-aware commands classify unsupported protocol separately and return one bounded owner-issued typed next action.

#### Scenario: Optional historical card is not execution authority
- **WHEN** an existing bundle lacks RUN_BUNDLE.md or AGENTS.md
- **THEN** structure validation may report its layout without mutation
- **AND** no state/resume command treats that absence or presence as current run authority

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
HTML-first source SHALL remain canonical 3_versions/vN/slide-specifications.md; shared/sparse assets and v2 catalogs SHALL remain under backbone/version-override visual-style/assets; physical slide-block order remains the source order. Every plan, diagnostic, receipt, and generated-manifest path is normalized POSIX and confined to its owning deck/run version. General validation and Stage-1 dry run remain write-free; canonical write-enabled Stage 1 publishes only _generated/slide_plan.json. HTML Stages 2-5 publish only their owned rebuildable HTML/QA/PPTX outputs and state evidence.

Current whole-page output has its own declared current adapter ownership and never becomes HTML source/control authority. Unsupported historical branch outputs are neither validated as current source nor adopted as input; validation reports bounded protocol guidance without writing source, state, generated paths, or a transition candidate.

#### Scenario: Historical generated output is not source control
- **WHEN** a current HTML or whole-page validation finds stale branch-owned output
- **THEN** it does not use that output as source, state, or routing authority
- **AND** it creates no migration candidate or inferred current control

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

### Requirement: Production-mode transition scratch is isolated and layout-validated
The general cross-pipeline transition adapter's canonical version-local `_scratch/` owner set SHALL admit only `_scratch/production-mode-transition/`. Its immediate entries SHALL be exactly `candidate-run/`, `plan.json`, and `apply-journal.json`; their internals remain scratch-local and deletable. The only target-visible receipt is `_generated/qa/production_mode_transition.json`. `bundle_layout.mjs` SHALL validate those exact entries, their path confinement, the target QA receipt placement, and artifact ownership without admitting them at the version root, another version, `_generated/` outside that QA receipt, or `_state/`. It SHALL reject any other cross-pipeline scratch owner and SHALL not recognize retired scratch artifacts as a candidate, plan, journal, or receipt authority.

#### Scenario: Transition scratch remains version-local
- **WHEN** a source version has a valid production-mode-transition candidate and journal
- **THEN** bundle layout accepts only its declared owner under that source version's `_scratch/`
- **AND** the same names at the version root or a target version fail structure validation

#### Scenario: Unexpected cross-pipeline scratch owner is rejected
- **WHEN** a source version contains a cross-pipeline scratch owner other than `production-mode-transition`
- **THEN** layout reports an ownership violation
- **AND** it does not adopt any artifact from that owner as transition authority

### Requirement: Whole-page run identity is explicit
A whole-page run SHALL declare `production.pipeline: whole-page-image2-v1` in its canonical source. Layout validation SHALL not treat absent source metadata as a whole-page identity.

#### Scenario: Whole-page run has an explicit marker
- **WHEN** layout validates a canonical whole-page source with the current marker
- **THEN** it applies whole-page ownership rules

#### Scenario: Whole-page marker is absent
- **WHEN** layout validates a source without a production marker
- **THEN** it reports the marker as invalid
- **AND** it does not apply whole-page ownership rules
