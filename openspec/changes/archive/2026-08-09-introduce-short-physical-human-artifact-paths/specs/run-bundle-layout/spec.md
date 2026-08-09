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
- **AND** the canonical immutable artifact, its SHA-256 directory, and its ownership records
  remain unchanged and are not exposed as the human navigation path

#### Scenario: A legacy long reference leaf is present before migration

- **WHEN** a supported current run contains the retired long-name reference leaf and an Agent
  explicitly rebuilds its artifact view
- **THEN** layout publishes the canonical `_generated/nav/index.md` entry and may remove only the
  retired derived leaf after that publication succeeds
- **AND** it does not create a symlink, rename an immutable root, or infer current evidence from
  the legacy file
