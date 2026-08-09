# Delta — run-bundle-layout

## ADDED Requirements

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

## MODIFIED Requirements

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
  characters of its content-address), and its ownership records remain unchanged and are not
  exposed as the human navigation path

#### Scenario: A legacy long reference leaf is present before migration

- **WHEN** a supported current run contains the retired long-name reference leaf and an Agent
  explicitly rebuilds its artifact view
- **THEN** layout publishes the canonical `_generated/nav/index.md` entry and may remove only the
  retired derived leaf after that publication succeeds
- **AND** the artifact-view rebuild itself does not create a symlink, rename an immutable root, or infer
  current evidence from the legacy file; immutable renames are reserved to the separate explicit migration
  owner above
