## Purpose

Define the canonical **run bundle** (`deck_{NAME}/`) directory ontology: three-tier tree, per-directory roles, structure gradient (上严下松 / upper-strict lower-loose), and GREP-friendly placement index (Where Map in `reference/glossary.md`).

Counterpart to `harness-directory-layout` (soft bundle `ppt_maker_harness/` only). Do not merge the two.

Machine authority for tree text and path constants: `ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs` (`renderTree()`). CLI scaffold/validate behavior is owned by `run-bundle-management` on the same module.
## Requirements
### Requirement: Structure gradient upper-strict lower-loose

Run-bundle layout SHALL follow **stricter toward the root, looser toward the leaves** (上严下松 / structure gradient): deck root admits only constitutionally named control files and first-class directories; mid-tier dirs remain whitelist-bound; a version dir admits source + `overrides/` + `_generated/` + `_scratch/`; `_scratch/` internals are not filename-whitelisted. Temporary files SHALL sink down into `_scratch/` and SHALL NOT be placed at the deck root or in invented dirs named `_tmp/`, `backup/`, or `_bak/`.

#### Scenario: Gradient names root strictest and scratch loosest

- **WHEN** Agent reads the structure-gradient / 上严下松 definition under this capability or its Where Map
- **THEN** the text states the deck root is the strictest layer
- **AND** version `_scratch/` is the official loose temp outlet

### Requirement: Run-bundle root admits an agent-agnostic generated entry control
The canonical strict deck root SHALL admit RUN_BUNDLE.md and AGENTS.md alongside CLAUDE.md and deck-guide.md without loosening any other root name. RUN_BUNDLE.md is a static locator manifest; deck-guide.md is the operating guide; AGENTS.md and CLAUDE.md are short pointers to locator then guide. None claims current run version, mode, node, gate, digest, next action, or approval. The root-control validator is shared by structure checking and locator verification and neither reads state nor selects a version.

An older bundle may physically lack a newer locator or Agent card without failing structure-only validation. That tolerance is layout-only: it SHALL not establish current source/state identity, select a run, permit resume, or trigger a write. State-aware commands classify unsupported protocol separately and return one bounded owner-issued typed next action.

#### Scenario: Optional historical card is not execution authority
- **WHEN** an existing bundle lacks RUN_BUNDLE.md or AGENTS.md
- **THEN** structure validation may report its layout without mutation
- **AND** no state/resume command treats that absence or presence as current run authority

### Requirement: Run Bundle locator binds one exact local Harness

A current Run Bundle locator SHALL use schema `pptmaker-run-bundle-v2` and
contain exactly the scalar fields `schema`, `deck_root`, `harness_root`, and
`harness_relation`. `deck_root` and `harness_root` SHALL be canonical absolute
local paths to distinct roots, and `harness_relation` SHALL be the normalized
relative relation from the Deck root to that exact Harness root. The declared
root and relation SHALL resolve to the same verified Harness root; the locator
SHALL not carry `harness_id`, a release, a Git revision, a content hash, or a
portable cross-Harness identity.

#### Scenario: A new locator describes a local Harness binding

- **WHEN** a current Run Bundle locator is rendered
- **THEN** it contains only the four v2 binding fields and resolves both binding
  references to the same local `ppt_maker_harness/` root
- **AND** it contains no retired root field or portability identifier

### Requirement: Run Bundle placement remains external to its Harness

One Deck SHALL have one Run Bundle, which MAY be placed in any local directory
outside its Harness root. The Bundle SHALL bind only to the exact local Harness
root that created it. Relocating either root or presenting a different Harness
SHALL not silently rebind, select a fallback root, or establish portability.

#### Scenario: A different Harness is presented for a current Bundle

- **WHEN** a locator's declared and relation-derived Harness roots do not match
  the exact local Harness binding
- **THEN** the locator does not resolve a Harness for that Bundle
- **AND** it does not substitute a requested root or scan for another Harness

### Requirement: Run Bundle lessons remain bundle-local

`_lessons/` SHALL retain only non-secret operational knowledge for its one Run
Bundle. Locator validation and Harness operation SHALL not promote, merge, or
infer a global or cross-session memory from those files.

#### Scenario: A Bundle contains local lessons

- **WHEN** an Agent opens a current Bundle with `_lessons/`
- **THEN** it may read those lessons before guessing about that Deck
- **AND** it does not treat them as Harness-wide knowledge or workflow state

### Requirement: Page Image Workflow artifacts have canonical rebuildable owners

Run-Bundle Layout SHALL give the current Page Image Workflow canonical owners
for normalized source, matching state, source receipt, Style Master lifecycle,
compiled provider input and digest, raw provider page/provenance, Page Review
contributions, `page-image-final-slide-manifest-v1`, JPEG delivery media and
its `page-image-delivery-media-v1` manifest, assembly, and notes. The selected
adapter owns policy-specific raw and review contributions; shared delivery owns
the common final-manifest projection and its JPEG delivery derivative. All
media, receipts, inspection projections, composites, and task cards beneath
`_generated/` or their declared derived owner remain rebuildable and SHALL NOT
become source authority by path, filename, timestamp, or hand edit.

For Framed, the review owner SHALL retain the exact provider page and its
production-equivalent transparent header composite as distinct bound
contributions to one Complete Page Review. For Pure, the provider page is the
complete-page contribution. Neither layout creates a second local-composite
approval record.

#### Scenario: A Framed review has two bound views but one owner

- **WHEN** layout resolves current Framed complete-page review artifacts
- **THEN** it identifies the raw provider page and local-header composite as
  separate derived contributions to one review record
- **AND** it does not treat either filename as a second acceptance decision

#### Scenario: Deleting a current derived artifact does not make it source

- **WHEN** a generated provider page, composite, final PNG, JPEG delivery
  file, delivery-media manifest, or task projection is absent
- **THEN** layout identifies its declared rebuild owner
- **AND** it does not accept a manually placed replacement as current evidence

### Requirement: Current Page Image lifecycle records remain append-mostly and CAS-scoped

The replacement-owned Style Master and page-production iteration owners SHALL
retain immutable plans, exact authorization grants, submitted attempts,
verified media/provenance, review decisions, and any bounded abandonment or
reconciliation records. For each exact version/workflow scope, one small
CAS-protected head SHALL name the current immutable plan generation and
predecessor; progress, paid debt, terminality, and next action SHALL be derived
from the referenced direct records rather than stored as a mutable head or
task-card projection.

An owner SHALL fully validate and atomically publish a staged immutable plan
before its head CAS. Staging and complete-but-unreferenced plans are never
current authority, and cleanup is confined to the owner staging root during an
explicit mutating operation. Immutable plans, grants, attempts, provenance,
and provider bytes SHALL not be selected, overwritten, or recovered by
directory order, timestamps, filenames, copied media, compatibility payloads,
or `_generated/` artifacts. Current media and provenance become evidence only
through their exact terminal attempt and plan/batch/selection lineage; State
may retain a typed handoff reference but not a duplicate lifecycle ledger.

#### Scenario: A staged or copied page artifact cannot become current

- **WHEN** a staged plan, orphaned provider page, or copied derived artifact is
  present beside a current scope
- **THEN** layout ignores it as current authority until the owning immutable
  plan, head, attempt, and provenance chain validates it
- **AND** it does not issue a grant, reconstruct an attempt, or use the bytes
  as accepted evidence

#### Scenario: A current head cannot be chosen from history order

- **WHEN** a replacement lifecycle contains terminal and successor plans
- **THEN** layout resolves the owner-declared CAS head and exact predecessor
  lineage
- **AND** it does not reopen a terminal plan or choose a directory by timestamp

### Requirement: Current layout records do not adopt v2 Page Authority artifacts

`page-authority-image2-v2` source/state, receipt, plan, provider media,
review, final-manifest, or delivery records may remain physically present but
are unsupported input to current Page Image Workflow layout and lifecycle
readers. Those readers SHALL stop at identity before following a v2 artifact
path, deriving provenance, or using a v2 record as a current pointer. They
SHALL NOT create an adoption directory, converter, evidence bridge, or
automatic cleanup.

#### Scenario: Old raw media cannot become a current rebuild source

- **WHEN** a current layout reader encounters a v2 raw artifact and its
  accompanying receipt
- **THEN** it returns the `unsupported-protocol/export` boundary before reading media
  provenance or review facts
- **AND** it does not copy, convert, or register the bytes in current layout

### Requirement: Current Page Image human artifact reference view is a canonical derived artifact

For one exact current Page Image Workflow run, Run-Bundle Layout SHALL reserve
`_generated/nav/` as the canonical run-scoped Human Navigation Path tree and
`_generated/nav/index.md` as its canonical human entry point. The tree SHALL remain outside
Style Master and progressive-production immutable storage roots. Every directory and filename
component beneath `_generated/nav/` SHALL contain 1 through 24 ASCII characters from
`[A-Za-z0-9._~-]` and SHALL NOT contain a full SHA-256 value; only the canonical index and its
contained short artifact paths are human-facing artifact locations.

The navigation tree SHALL contain only rebuildable derived regular files copied from artifacts
whose current availability has already been established by their owning records. Its paths and
files SHALL not become source, lifecycle state, a receipt, a CAS head, an alternate storage key,
evidence, or an input selector by path, filename, timestamp, or hand edit. Removing or editing
the tree SHALL not alter current authority; its owning explicit projection operation is the only
supported rebuild route. The tree and every ancestor created for it SHALL not be a symbolic link.

The retired long-name human-reference leaf under
`_generated/page_image_workflow/reference/` SHALL not be emitted as a current human navigation
entry after this contract applies. A supported explicit rebuild MAY remove that exact derived leaf
only after it has materialized the new navigation tree; it SHALL not rename, delete, or rewrite an
immutable owner artifact.

#### Scenario: A reference view is deleted or changed

- **WHEN** a current run's Human Navigation Path tree is absent or has been manually changed
- **THEN** current source, state, plans, grants, evidence, review, and delivery authority remain
  unchanged
- **AND** the supported projection operation can replace it from canonical owners without using
  its previous contents as input

#### Scenario: Layout resolves a human locator beside immutable history

- **WHEN** a current owner establishes an available artifact below a content-addressed immutable
  owner root
- **THEN** the human navigation index names a confined regular derived copy under
  `_generated/nav/` using only short path components
- **AND** the canonical immutable artifact, its SHA-256 directory, and its ownership records
  remain unchanged and are not exposed as the human navigation path

#### Scenario: A legacy long reference leaf is present before migration

- **WHEN** a supported current run contains the retired long-name reference leaf and an Agent
  explicitly rebuilds its artifact view
- **THEN** layout publishes the canonical `_generated/nav/index.md` entry and may remove only the
  retired derived leaf after that publication succeeds
- **AND** it does not create a symlink, rename an immutable root, or infer current evidence from
  the legacy file

### Requirement: Run-Bundle Layout owns the Pure visual-system source location

Run-Bundle Layout SHALL reserve
`2_backbone/visual-style/pure-deck-visual-system.yaml`, with the existing version
`overrides/visual-style/` precedence, as the version-resolved deck-authored source of the current
Pure deck visual system. New Run Bundles SHALL receive a valid seed record at that canonical
location. The record is source input: it SHALL not be stored in `_generated/`, Style Master
immutable history, Page Image lifecycle storage, receipts, grants, State, or delivery artifacts.

Removing or changing the record SHALL not mutate existing lifecycle authority. A subsequent Pure
owner operation re-evaluates it from the resolved source location; it does not recover a value from
a prior plan, inspection projection, or accepted image.

#### Scenario: A new bundle receives a Pure visual-system source seed

- **WHEN** a new Run Bundle is initialized
- **THEN** its backbone visual-style directory contains the canonical valid Pure visual-system
  source record
- **AND** the seed is a source asset rather than derived Page Image state or media

#### Scenario: A version override changes only that version's Pure source input

- **WHEN** a version provides a valid visual-style override of the Pure visual-system record
- **THEN** current Pure planning uses that version-resolved record and its digest
- **AND** sibling versions and immutable artifacts remain unchanged
