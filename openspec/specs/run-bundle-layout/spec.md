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

A current Run Bundle locator SHALL use the unversioned shared contract declared
as `run-bundle-locator` in the serialization inventory and retain exactly the
fields `schema`, `deck_root`, `harness_root`, and `harness_relation`. The
locator continues to bind one local Harness root without becoming a Page Image
production protocol, portability layer, or historical-format resolver.

#### Scenario: A current locator is inspected

- **WHEN** a locator is read for an active local Harness binding
- **THEN** its contract marker resolves as `run-bundle-locator` in the schema
  inventory and its exact required fields validate
- **AND** an undeclared locator is not converted or adopted

#### Scenario: A new locator describes a local Harness binding

- **WHEN** initialization writes a current bundle locator
- **THEN** it describes one exact local Harness relation under the declared contract
- **AND** it does not encode production workflow authority

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

The current artifact-owner map SHALL identify normalized source, matching state,
source receipt, Style Master lifecycle, compiled provider input, raw provider
page/provenance, review contributions, the declared final-page-list,
delivery-package media, assembly, and notes under one current schema contract.
Selected adapters retain policy-specific raw/review contributions and shared
delivery retains the common final-page/delivery projection. No owner map may
name a version-suffixed artifact schema or an alternate historical publisher.

#### Scenario: A maintainer traces a current artifact owner

- **WHEN** a current Page Image artifact is located in the layout
- **THEN** its declared stage/role resolves to one current owner
- **AND** no historical artifact name creates a second owner path

#### Scenario: A Framed review has two bound views but one owner

- **WHEN** current Framed review produces its provider and composited views
- **THEN** both remain bound to one declared review owner
- **AND** no alternate schema creates another review authority

#### Scenario: Deleting a current derived artifact does not make it source

- **WHEN** a rebuildable declared artifact is absent
- **THEN** the owner retains the existing source/derived distinction and rebuild path
- **AND** it does not use a historical artifact as replacement source

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
- **AND** the canonical immutable artifact, its short on-disk directory name (first 8 hex
  characters of its content-address), and its ownership records
  remain unchanged and are not exposed as the human navigation path

#### Scenario: A legacy long reference leaf is present before migration

- **WHEN** a supported current run contains the retired long-name reference leaf and an Agent
  explicitly rebuilds its artifact view
- **THEN** layout publishes the canonical `_generated/nav/index.md` entry and may remove only the
  retired derived leaf after that publication succeeds
- **AND** the artifact-view rebuild itself does not create a symlink, rename an immutable root, or infer
  current evidence from the legacy file; immutable renames are reserved to the separate explicit migration
  owner above

### Requirement: Run-Bundle Layout owns the Pure visual-system source location

Run-Bundle Layout SHALL reserve the four-document Page Image presentation
package at `2_backbone/visual-style/page-image-presentation/`:
`page-class-catalog.yaml`, `deck-defaults.yaml`,
`pure-deck-visual-system.yaml`, and `framed-header-profiles.yaml`. Each file
uses the matching version-level `overrides/visual-style/page-image-presentation/`
location under the normal override-first/backbone-default rule. The package is
version-resolved editable source: it SHALL not be stored in `_generated/`,
Style Master immutable history, Page Image lifecycle storage, receipts, grants,
State, or delivery artifacts.

`pure-deck-visual-system.yaml` remains the source of Pure-only presentation
facts; Framed header facts remain only in `framed-header-profiles.yaml`. The
catalog and deck defaults are not a location for page literals, geometry,
provider prompts, generated projection, evidence, or state. Removing or
changing a source document SHALL not mutate existing lifecycle authority. A
subsequent owner operation re-evaluates the complete resolved package; it does
not recover a value from a prior plan, inspection projection, or accepted image.

#### Scenario: A new bundle receives a Pure visual-system source seed

- **WHEN** a new Run Bundle is initialized
- **THEN** its backbone visual-style directory contains the four canonical
  Page Image presentation source records
- **AND** each is source input rather than derived Page Image state or media

#### Scenario: A version override changes only that version's Pure source input

- **WHEN** a version provides a valid override for one Page Image presentation
  package document
- **THEN** current planning resolves that version's complete package with the
  override at the matching path
- **AND** sibling versions and immutable artifacts remain unchanged

### Requirement: Current content-addressed physical paths use short on-disk names

For a supported current `page-image-workflow` Pure or Framed run,
content-addressed immutable owner storage SHALL retain the existing deterministic
short physical naming and full internal SHA-256 identity rules. The current
workflow marker and all serialized artifacts SHALL use only schema-declared
unversioned values. An undeclared marker fails before content-addressed owner
work; the layout SHALL not scan or migrate a historical format.

#### Scenario: A current run resolves a content-addressed path

- **WHEN** an exact current run addresses an immutable owner artifact
- **THEN** it applies the established short-name/full-hash validation under the
  declared current workflow
- **AND** it does not fall back to a historical contract reader

#### Scenario: Lookup resolves a short on-disk name from a full SHA-256

- **WHEN** a current owner looks up a full content hash
- **THEN** it retains the established short-name then verified-full-name resolution
- **AND** it validates only current declared artifact contracts

#### Scenario: An 8-character prefix collision fails loudly

- **WHEN** two current full hashes share a short prefix in one owner directory
- **THEN** the owner retains the existing conflict failure before overwrite
- **AND** it does not select an alternate contract

#### Scenario: An unsupported full-64-hex directory is rejected

- **WHEN** a current owner encounters an obsolete physical-path form
- **THEN** it rejects it as outside the current contract before mutable owner work
- **AND** it does not migrate or adopt the directory

#### Scenario: An unsupported path has an owner lock

- **WHEN** an obsolete path condition includes an owner lock
- **THEN** current layout validation remains non-mutating and rejects the condition
- **AND** it does not acquire a migration lock or rename bytes

#### Scenario: An unsupported path implies a sibling version

- **WHEN** a caller supplies a path outside the exact current run binding
- **THEN** layout rejects it before sibling selection or artifact reads
- **AND** it does not infer a migration target

#### Scenario: A writer encounters an unsupported path

- **WHEN** a current writer detects an obsolete migration-only condition
- **THEN** it retains current owner integrity checks before writes
- **AND** it does not coordinate or resume a migration

#### Scenario: An unsupported path would require a rename

- **WHEN** an obsolete path would require a rename to continue
- **THEN** current layout stops before rename planning
- **AND** it preserves no compatibility or rollback protocol

#### Scenario: An undeclared run requests a short-path operation

- **WHEN** an undeclared run contract requests a path operation
- **THEN** the owner rejects it before artifact inspection or mutation
- **AND** it does not create a short-path migration route

### Requirement: Run Bundle backbone has one current narrative-source pair
Run-Bundle Layout SHALL reserve `2_backbone/story-outline.md` as the canonical
editable Story Outline and `2_backbone/design-constraints.md` as the canonical
editable Design Constraints source. Both are deck-level shared Source Data,
outside `_generated/`, state, lifecycle evidence, provider records, and
version-specific overrides. New Run Bundles SHALL receive editable current
seeds for both sources.

`2_backbone/outline.md` is not a current layout entry, source alias, fallback,
or validation target. The layout SHALL not read, rename, convert, migrate, or
copy a historical outline to establish current narrative authority.

#### Scenario: A new bundle has current upstream narrative sources
- **WHEN** a new Run Bundle is initialized
- **THEN** its backbone contains `story-outline.md` and `design-constraints.md`
  as editable shared sources
- **AND** it does not create `outline.md` or a second narrative location

#### Scenario: A historical outline is present in a production bundle
- **WHEN** a current-layout operation encounters `2_backbone/outline.md`
- **THEN** it does not use that file to establish Story Outline authority or
  convert it to a new source
- **AND** it leaves the production data untouched
