## MODIFIED Requirements

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

### Requirement: Structured source control remains inside the existing run-bundle topology
HTML-first source SHALL remain canonical 3_versions/vN/slide-specifications.md; shared/sparse assets and v2 catalogs SHALL remain under backbone/version-override visual-style/assets; physical slide-block order remains the source order. Every plan, diagnostic, receipt, and generated-manifest path is normalized POSIX and confined to its owning deck/run version. General validation and Stage-1 dry run remain write-free; canonical write-enabled Stage 1 publishes only _generated/slide_plan.json. HTML Stages 2-5 publish only their owned rebuildable HTML/QA/PPTX outputs and state evidence.

Current whole-page output has its own declared current adapter ownership and never becomes HTML source/control authority. Unsupported historical branch outputs are neither validated as current source nor adopted as input; validation reports bounded protocol guidance without writing source, state, generated paths, or a transition candidate.

#### Scenario: Historical generated output is not source control
- **WHEN** a current HTML or whole-page validation finds stale branch-owned output
- **THEN** it does not use that output as source, state, or routing authority
- **AND** it creates no migration candidate or inferred current control

## ADDED Requirements

### Requirement: Whole-page run identity is explicit
A whole-page run SHALL declare `production.pipeline: whole-page-image2-v1` in its canonical source. Layout validation SHALL not treat absent source metadata as a whole-page identity.

#### Scenario: Whole-page run has an explicit marker
- **WHEN** layout validates a canonical whole-page source with the current marker
- **THEN** it applies whole-page ownership rules

#### Scenario: Whole-page marker is absent
- **WHEN** layout validates a source without a production marker
- **THEN** it reports the marker as invalid
- **AND** it does not apply a whole-page compatibility layout

## REMOVED Requirements

### Requirement: Legacy migration scratch is temporary and version-local
**Reason**: `_scratch/html-migration/` and its projected-run compatibility layout are removed.

**Migration**: Current cross-pipeline work uses only the existing `_scratch/production-mode-transition/` owner.
