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

### Requirement: Content-addressed physical paths use short on-disk names

For a supported current `page-image-workflow-v1` Pure or Framed run, content-addressed immutable owner storage SHALL name every `<hash>` directory and file **on disk** by a deterministic short form: the **first 8 hex characters** of the item's content-address SHA-256. This covers Style Master iteration plan roots and their nested candidate data, progressive page-production plans, batches, materializations, attempts, complete-reviews, accepted-evidence, both generated-review roots `review/complete-page/<raw-plan-hash>` and `review/pilot/<batch-hash>`, and any content-address-derived `.lock` file or other `<hash>`-derived name beneath those locations. The full 64-hex SHA-256 SHALL remain the item's internal identity and the value stored in state, receipts, CAS heads, and every JSON/record payload; the on-disk short name is never itself a selector or authority. Fixed semantic lock names and bounded non-hash identifiers such as `candidate-NNN` and slide IDs remain unchanged.

When the first 8 hex characters of two distinct full SHA-256 values collide within the same parent directory, the owner SHALL NOT silently overwrite or re-derive; it SHALL fail with a clear conflict error and keep both records intact, because an on-disk name must always be deterministically derivable from the full SHA-256. A lookup given a full SHA-256 SHALL resolve the on-disk name by trying the 8-character short name first and, when no record under it embeds the expected full SHA-256, by falling back to the full 64-hex name (legacy pre-migration layout); in both cases it SHALL verify the record embeds the expected full SHA-256 before treating the bytes as the addressed artifact.

The sole migration owner is the non-public `migrateCurrentRunContentAddresses({ runDir })` operation. Before reading an owner artifact, it SHALL use the normal read-only workflow inspection to establish one exact supported current v1 Pure or Framed source/state pair. It SHALL not scan `3_versions/`, choose a sibling, or accept a caller-provided workflow/hash/path override. It SHALL migrate only records bound to that exact run version and that run's `review/complete-page/` and `review/pilot/` roots. A historical v2 or otherwise unresolved input SHALL return its existing bounded `unsupported-protocol/export` or owner-issued action before owner-artifact reads and SHALL not receive short-path migration, adoption, or compatibility treatment.

For an eligible exact run, the owner SHALL first acquire the deck-root `.content-address-migration.lock`; a second migration SHALL hard-stop before writes. It SHALL then recursively preflight each affected container, rejecting any owner resource lock, symbolic link, malformed/unexpected container, failed typed canonical-record/evidence binding, duplicate target, or occupied 8-character target before it renames any entry. It SHALL not skip, rename, or remove a lock. Each affected owner writer SHALL acquire its resource lock and then check the deck-root migration lock before addressed reads or writes, failing and releasing its resource lock when migration is in progress. On a successful preflight, the owner SHALL execute the complete child-first rename plan, verify each new path's unchanged bytes and embedded full SHA-256, and reverse completed moves on an ordinary execution error. An unrecoverable rollback or interruption SHALL leave state, receipts, and records unchanged, return `migration_recovery_required`, and preserve a tree that the verified short-first/full-name fallback can read for one later owner rerun. The short name remains no authority.

#### Scenario: Lookup resolves a short on-disk name from a full SHA-256

- **WHEN** a current owner reads an immutable artifact by its full content-address SHA-256
- **THEN** it derives the on-disk path from the first 8 hex characters of that SHA-256
- **AND** it verifies the record under that path embeds the expected full SHA-256 before treating the bytes as the addressed artifact

#### Scenario: An 8-character prefix collision fails loudly

- **WHEN** two distinct full SHA-256 values in the same parent directory share their first 8 hex characters
- **THEN** the owner SHALL NOT overwrite either record and SHALL fail with a clear conflict error naming the colliding hashes
- **AND** a reader given either full SHA-256 never mistakes the other record's bytes for it, because resolution always verifies the embedded full SHA-256

#### Scenario: A full-64-hex legacy directory is migrated

- **WHEN** an explicit migration operation encounters an existing full-64-hex content-addressed directory or file
- **THEN** it renames it to the deterministic short form without changing its record bytes
- **AND** lookups for the same content-address resolve to the migrated short name afterwards

#### Scenario: Migration finds an owner lock

- **WHEN** the explicit migration operation preflights an affected immutable owner root and finds a lock directory
- **THEN** it reports the bounded concurrent-mutation failure before renaming or deleting any entry
- **AND** the nearest recovery is to wait for the owner mutation to finish and rerun the same migration operation

#### Scenario: Migration receives a sibling or historical version by implication

- **WHEN** an Agent invokes the migration owner for one exact run while the deck also contains another version, or its supplied run is historical v2
- **THEN** the owner operates only on the supplied current v1 run or returns the existing bounded protocol action before owner-artifact reads
- **AND** it does not scan for, select, migrate, or mutate a sibling version

#### Scenario: A writer begins while migration is pending

- **WHEN** an affected owner writer acquires its resource lock after migration has acquired the deck-root migration lock
- **THEN** it releases its resource lock and reports the bounded migration-in-progress diagnostic before it reads or writes the addressed artifact
- **AND** the migration can either finish from its verified preflight or fail without concurrent publication

#### Scenario: A validated migration cannot complete a rename

- **WHEN** an ordinary filesystem failure occurs after one or more validated rename steps
- **THEN** the owner attempts completed moves in reverse order while retaining the migration lock
- **AND** it either restores the pre-migration paths or returns `migration_recovery_required` with unchanged state/receipt/record bytes and a readable mixed tree for one later owner rerun

#### Scenario: A v2 run requests short-path migration

- **WHEN** a `page-authority-image2-v2` source/state pair requests the migration operation
- **THEN** it returns `unsupported-protocol/export` before reading legacy artifacts or mutating the bundle
- **AND** it does not create a short-path compatibility or adoption route

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
