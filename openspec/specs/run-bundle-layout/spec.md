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

### Requirement: Run Bundle entry controls remain non-authorizing

The canonical strict Run Bundle root SHALL admit `RUN_BUNDLE.md` and `AGENTS.md`
alongside `CLAUDE.md` and `deck-guide.md` without loosening any other root name.
`RUN_BUNDLE.md` is a static locator manifest; `deck-guide.md` is the operating
guide; `AGENTS.md` and `CLAUDE.md` are short pointers to locator then guide.
None claims current Work Version, mode, node, gate, digest, next action, or
approval. The root-control validator is shared by structure checking and locator
verification and neither reads state nor selects a Work Version.

`--structure-only` may report whether an inspected filesystem tree conforms to
the canonical layout, but it never establishes source/state identity, selects a
run, permits resume, or triggers a write. An input that lacks the declared
current controls remains unbound for every authority-carrying operation and is
handled by that operation's existing owner-issued boundary.

#### Scenario: Structure-only inspection has no execution authority

- **WHEN** a structure-only check reports a tree that lacks a declared current
  root control
- **THEN** it reports only the physical-layout fact without mutation
- **AND** no state or resume command treats that report as current run authority

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
directory order, timestamps, filenames, copied media, alternate projections,
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

### Requirement: Current Page Image human navigation is canonical derived output

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

The current projection operation writes only `_generated/nav/` from canonical
owners. It SHALL not inspect, rename, delete, or use any other derived
reference path as input to establish authority.

#### Scenario: A reference view is deleted or changed

- **WHEN** a current run's Human Navigation Path tree is absent or has been manually changed
- **THEN** current source, state, plans, grants, evidence, review, and delivery authority remain
  unchanged
- **AND** the supported projection operation can replace it from canonical owners without using
  its previous contents as input

#### Scenario: Current navigation is rebuilt

- **WHEN** a current owner establishes an available artifact below a
  content-addressed immutable owner root
- **THEN** the human navigation index names a confined regular derived copy
  under `_generated/nav/` using only short path components
- **AND** the operation does not read or mutate another derived reference path

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

### Requirement: Page-derived data has one confined regenerable layout

For one exact current Page Image Workflow run, Run-Bundle Layout SHALL reserve
`_generated/page_image_workflow/derived/` as the independent provider-free
derived-data root. It SHALL contain `index.json` as the deck-level index and
`pages/<slide_id>/` for each page's independent files:
`page-source-receipt.json`, `page-layout.json`, `page-render-model.json`,
`page-generation-spec.json`, `image2-request.json`, and
`page-artifact-index.json`; Framed pages additionally contain
`framed-header.html`. All components below the root SHALL be confined regular
files/directories derived from the current stable ID and declared artifact
names. The root is outside `_generated/nav/` and all append-mostly immutable
owner storage.

This tree is rebuildable derived output only. It SHALL not be source,
lifecycle state, authorization evidence, a CAS head, an input selector, or a
Human Navigation subtree. Deleting, modifying, or finding a stale tree leaves
canonical source and lifecycle evidence unchanged; only a successful current
`image2 plan` can replace it. New-version operations retain their existing
clean generated-output boundary and SHALL not copy the tree into a successor.

#### Scenario: One current plan has independently addressable page artifacts

- **WHEN** a valid current plan publishes two stable page IDs
- **THEN** the deck index and two confined page directories expose the declared
  independent artifacts by stable ID
- **AND** neither a current position nor a filename becomes lifecycle identity

#### Scenario: Derived data is not Human Navigation or historical authority

- **WHEN** a derived-data file is changed, removed, or remains from an earlier
  source digest
- **THEN** source, state, raw plans, grants, reviews, and final evidence retain
  their existing authority
- **AND** a later current plan replaces the tree without copying it to
  Human Navigation or a new version

### Requirement: Active run-bundle tree guidance names the complete current visual source set

Active run-bundle tree guidance SHALL name the current Style Master iteration
history, current Style Master intent source, current Page Image visual-language
source, current `pure-deck-visual-system.yaml` source locations, and the
non-secret Image2 provider-profile source at
`2_backbone/visual-style/image2-provider-profile.yaml` with its version
override only at
`3_versions/vN/overrides/visual-style/image2-provider-profile.yaml`. The Style
Master intent, visual-language, and provider-profile sources remain distinct
from the Page Image presentation package; none is replaced by the Pure-only
source. The profile source supplies route-capability declaration only; it is
not `.env`, State, a receipt, plan, grant, attempt, review record, derived
inspection, or provider authorization. The tree remains a human-readable
snapshot; `bundle_layout.mjs` and this capability remain the current layout
authorities.

The layout whitelist and structure check SHALL recognize the provider profile
only at those canonical visual-style locations and preserve the existing
strict-root/loose-leaf gradient. Layout observation SHALL not validate a
capability, choose a version, resolve a profile, infer a provider, record a
lifecycle fact, or authorize provider work.

#### Scenario: Maintainer reads the Run Bundle tree

- **WHEN** a maintainer consults active Charter or reference tree guidance
- **THEN** it can locate current Style Master history, intent, visual-language,
  Pure visual-system, and provider-profile sources with their distinct roles
- **AND** it does not replace one current source with another or create a
  competing layout authority

#### Scenario: Provider profile source has only canonical locations

- **WHEN** a current Bundle contains a provider profile source or version
  override
- **THEN** layout validation recognizes it only at the declared backbone or
  matching override visual-style path
- **AND** it does not treat an environment value, derived file, lifecycle
  record, or invented source path as that profile

#### Scenario: Layout observation creates no provider authority

- **WHEN** a structure-only check observes the profile path or its absence
- **THEN** it reports only the filesystem-layout fact without selecting or
  confirming a capability profile
- **AND** it creates no plan, authorization, attempt, environment identity, or
  provider request

### Requirement: Run Bundle Layout owns the optional Page Design System source locations

Run-Bundle Layout SHALL reserve
`2_backbone/visual-style/page-design-system.md` as the optional shared Page
Design System source and
`3_versions/vN/overrides/visual-style/page-design-system.md` as its matching
version override. These paths are editable deck source with override-first,
backbone-default precedence, but Visual Config owns the fail-closed absence and
invalid-branch semantics; layout recognition SHALL not imply generic
existence-only fallback. They SHALL not be placed in
`page-image-presentation/`, `_generated/`, Style Master history, source
receipts, plans, grants, attempts, review evidence, final media, delivery, or
State.

The layout whitelist and structure check SHALL recognize only these canonical
locations for this source and preserve the existing strict-root/loose-leaf
gradient. The layout contract SHALL distinguish it from the Pure-only
`pure-deck-visual-system.yaml`, the closed visual-language registry, and
Framed header profiles. Absence or blank source content is an optional source
semantic owned by Visual Config; it does not make the source a derived file or
authorize a layout check to infer a provider input.

Active run-bundle tree guidance SHALL identify this source as the shared Page
Image provider-design guidance and SHALL describe its separate role from Style
Master intent, visual-language selection, the Pure visual system, and Framed
local-header policy. The layout text remains a human-readable projection;
`bundle_layout.mjs` and this capability remain the path authority.

#### Scenario: The shared source has only its canonical locations

- **WHEN** a current Bundle contains a Page Design System source or version
  override
- **THEN** layout validation recognizes it only at the declared backbone or
  matching override visual-style path
- **AND** it does not treat a file in a generated, presentation-package,
  lifecycle, or invented source location as that source

#### Scenario: Shared guidance remains distinct from workflow-specific inputs

- **WHEN** an Agent reads the current run-bundle tree guidance
- **THEN** it can locate the shared Page Design System separately from the
  Pure-only visual system and Framed header profile sources
- **AND** it does not infer that either workflow-specific source supplies the
  shared provider-design text

#### Scenario: Optional source absence does not establish execution authority

- **WHEN** a layout-only check observes an otherwise valid Bundle without
  either Page Design System source leaf
- **THEN** it reports the filesystem layout fact without mutation
- **AND** it does not select a version, create a source binding, authorize
  provider work, or infer a default design system
