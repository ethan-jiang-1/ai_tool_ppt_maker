## REMOVED Requirements

### Requirement: Run-bundle root admits an agent-agnostic generated entry control

**Reason**: Its layout tolerance is phrased as a named older-bundle condition,
which makes undeclared controls appear to be an alternate supported form.

**Migration**: Replace it with the non-authorizing entry-control requirement
below. Structure-only inspection remains read-only, and authority-carrying
operations retain their existing declared-current boundary.

### Requirement: Current Page Image human artifact reference view is a canonical derived artifact

**Reason**: Its derived-output rule includes a historical-path cleanup route.
The current layout needs one canonical rebuildable output and no path-adoption
or path-cleanup operation.

**Migration**: Replace it with the current Human Navigation requirement below.
Current source and evidence ownership remains unchanged.

## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: Run Bundle locator binds one exact local Harness

A current Run Bundle locator SHALL use the unversioned shared contract declared
as `run-bundle-locator` in the serialization inventory and retain exactly the
fields `schema`, `deck_root`, `harness_root`, and `harness_relation`. The
locator continues to bind one local Harness root without becoming a Page Image
production protocol or portability layer.

#### Scenario: A current locator is inspected

- **WHEN** a locator is read for an active local Harness binding
- **THEN** its contract marker resolves as `run-bundle-locator` in the schema
  inventory and its exact required fields validate
- **AND** an undeclared locator does not establish a binding or cause a write

#### Scenario: A new locator describes a local Harness binding

- **WHEN** initialization writes a current bundle locator
- **THEN** it describes one exact local Harness relation under the declared
  contract
- **AND** it does not encode production workflow authority

## ADDED Requirements

### Requirement: Current Page Image human navigation is canonical derived output

For one exact current Page Image Workflow run, Run-Bundle Layout SHALL reserve
`_generated/nav/` as the canonical run-scoped Human Navigation Path tree and
`_generated/nav/index.md` as its canonical human entry point. The tree SHALL
remain outside Style Master and progressive-production immutable storage roots.
Every directory and filename component beneath `_generated/nav/` SHALL contain
1 through 24 ASCII characters from `[A-Za-z0-9._~-]` and SHALL NOT contain a
full SHA-256 value; only the canonical index and its contained short artifact
paths are human-facing artifact locations.

The navigation tree SHALL contain only rebuildable derived regular files copied
from artifacts whose current availability has already been established by their
owning records. Its paths and files SHALL not become source, lifecycle state, a
receipt, a CAS head, an alternate storage key, evidence, or an input selector
by path, filename, timestamp, or hand edit. Removing or editing the tree SHALL
not alter current authority; its owning explicit projection operation is the
only supported rebuild route. The tree and every ancestor created for it SHALL
not be a symbolic link.

The current projection operation writes only `_generated/nav/` from canonical
owners. It SHALL not inspect, rename, delete, or use any other derived
reference path as input to establish authority.

#### Scenario: A reference view is deleted or changed

- **WHEN** a current run's Human Navigation Path tree is absent or has been
  manually changed
- **THEN** current source, state, plans, grants, evidence, review, and delivery
  authority remain unchanged
- **AND** the supported projection operation can replace it from canonical
  owners without using its previous contents as input

#### Scenario: Current navigation is rebuilt

- **WHEN** a current owner establishes an available artifact below a
  content-addressed immutable owner root
- **THEN** the human navigation index names a confined regular derived copy
  under `_generated/nav/` using only short path components
- **AND** the operation does not read or mutate another derived reference path

## MODIFIED Requirements

### Requirement: Current content-addressed physical paths use short on-disk names

For a supported current `page-image-workflow` Pure or Framed run,
content-addressed immutable owner storage SHALL retain the established
deterministic short physical naming and full internal SHA-256 identity rules.
The current workflow marker and all serialized artifacts SHALL use only
schema-declared unversioned values. An undeclared marker fails before
content-addressed owner work without inspection or mutation of artifact bytes.

#### Scenario: A current run resolves a content-addressed path

- **WHEN** an exact current run addresses an immutable owner artifact
- **THEN** it applies the established short-name/full-hash validation under the
  declared current workflow
- **AND** it does not establish another contract or alter owner bytes

#### Scenario: Lookup resolves a short on-disk name from a full SHA-256

- **WHEN** a current owner looks up a full content hash
- **THEN** it retains the established short-name then verified-full-name
  resolution
- **AND** it validates only current declared artifact contracts

#### Scenario: An 8-character prefix collision fails loudly

- **WHEN** two current full hashes share a short prefix in one owner directory
- **THEN** the owner retains the existing conflict failure before overwrite
- **AND** it does not select an alternate contract

#### Scenario: An unsupported full-64-hex directory is rejected

- **WHEN** a current owner encounters a full-64-hex directory where the
  declared short physical name is required
- **THEN** it rejects the path before mutable owner work
- **AND** it does not inspect or alter the directory bytes

#### Scenario: An unsupported path has an owner lock

- **WHEN** an undeclared physical path condition includes an owner lock
- **THEN** validation remains non-mutating and rejects the condition
- **AND** it does not acquire, release, or rewrite the lock

#### Scenario: An unsupported path implies a sibling version

- **WHEN** a caller supplies a path outside the exact current run binding
- **THEN** layout rejects it before sibling selection or artifact reads
- **AND** it does not infer another Work Version target

#### Scenario: A writer encounters an unsupported path

- **WHEN** a current writer detects an undeclared path condition
- **THEN** it retains current owner integrity checks before writes
- **AND** it stops without changing owner data

#### Scenario: An unsupported path would require a rename

- **WHEN** an undeclared physical path would require a rename to continue
- **THEN** the current owner stops before rename planning
- **AND** it preserves the existing bytes and authoritative binding

#### Scenario: An undeclared run requests a short-path operation

- **WHEN** an undeclared run contract requests a path operation
- **THEN** the owner rejects it before artifact inspection or mutation
- **AND** it does not create another route for the path
