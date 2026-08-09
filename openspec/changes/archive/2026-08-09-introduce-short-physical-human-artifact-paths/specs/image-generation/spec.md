## MODIFIED Requirements

### Requirement: Current Page Image human artifact view is bounded and derived from canonical owners

For an exact current Page Image Workflow scope, the Harness SHALL be able to rebuild one local
Human Navigation Path tree from canonical Style Master, provider-input inspection, raw/review,
final, assembly, notes, and delivery owners. The tree SHALL list only artifacts whose owning
current facts establish their availability; it SHALL not discover current evidence by directory
order, filenames, timestamps, copied media, prior navigation content, or display reference.

Before an artifact becomes available through the tree, the projection SHALL validate its
owner-issued confined regular-file locator and then materialize a regular derived copy below the
short navigation root. The index and every human-facing locator SHALL refer only to that short
physical tree, not to an original content-addressed artifact path. A failed owner validation,
unsafe existing navigation root, or copy/materialization failure SHALL fail before replacement and
preserve the prior navigation tree; it SHALL not initialize a provider, infer a fallback artifact,
or mutate lifecycle authority.

Available page artifacts SHALL be ordered by the current full-plan position and stable
`slide_id`; human-facing image entries SHALL retain that order without requiring the stable ID to
be a filename. Style Master entries SHALL use their stable candidate identity. Every entry SHALL
give an artifact type, inspection purpose, and a confined short physical locator. Visible display
references and derived filenames SHALL be kind-prefixed and collision-aware within the rebuilt
tree; no human-facing locator or navigation-tree component SHALL expose a full SHA-256.

When the current progressive raw owner establishes a Complete Page Review whose decision is still
unset, the tree SHALL list that review's current page artifacts and review projection before any
human `proceed` or `repair` decision. The entries SHALL be derived from the same current
owner-established plan, page bytes, and review projection that the `image2 review` operation
uses. They SHALL not require accepted raw evidence, create a second review surface, infer a
review from raw directories, or make final/delivery artifacts appear available.

The tree SHALL be rebuildable, provider-free, secret-safe, and non-authoritative. It SHALL not
contain credentials, authorization headers, environment values, provider response bodies, raw
prompt prose, image data URLs, or a new copy of lifecycle/review/acceptance state. Neither its
short physical paths nor its display references may select a plan, batch, attempt, candidate, or
review decision; authorize provider work; or substitute for source, provenance, or receipt
bindings.

#### Scenario: Current evidence receives stable human locators

- **WHEN** a current plan has available Style Master, review, final, and delivery artifacts
- **THEN** the rebuilt navigation index lists their owner-established derived copies with type and
  inspection purpose in stable candidate or full-plan slide order
- **AND** every reported artifact locator is confined below the short navigation root and its
  labels do not replace the existing exact digest and formal-ID protocol keys

#### Scenario: Current Complete Page Review is inspectable before its decision

- **WHEN** every page in a current Pure or Framed full plan is materialized and the raw owner has
  established a Complete Page Review with no `proceed` or `repair` decision
- **THEN** the rebuilt navigation tree lists each current review page and its complete-review
  projection with stable IDs, typed display references, short physical locators, artifact types,
  and review purposes
- **AND** it leaves final media and delivery unavailable and does not mutate state, receipts,
  grants, attempts, review decisions, or provider work

#### Scenario: A repaired Complete Page Review is not current display evidence

- **WHEN** the current plan has only a Complete Page Review whose `repair` decision is already
  recorded and no accepted raw evidence
- **THEN** the rebuilt navigation tree does not list that historical review's page or contact-sheet
  copies
- **AND** it marks Complete Page Review, final media, and delivery unavailable without mutating
  the next raw-rebuild route

#### Scenario: A later lifecycle artifact does not exist yet

- **WHEN** a current scope has planned or reviewed evidence but no final, notes, or delivery
  artifact
- **THEN** the navigation index marks only those later artifact categories as unavailable
- **AND** it does not infer a path, create placeholder evidence, mutate lifecycle state, or add a
  review or authorization gate

#### Scenario: A display reference is presented to a lifecycle operation

- **WHEN** a caller supplies a Human Navigation Path or short display reference where an exact
  lifecycle selector is required
- **THEN** the lifecycle operation continues to require its existing formal selector or full
  SHA-256 argument through the owner-controlled control path
- **AND** the navigation tree does not resolve, translate, or authorize that request

#### Scenario: A navigation copy is edited after publication

- **WHEN** a person changes or removes a derived file below the Human Navigation Path tree
- **THEN** the canonical owner artifact and its current evidence authority remain unchanged
- **AND** a later successful explicit rebuild replaces the derived tree solely from current
  owner-validated locators
