## MODIFIED Requirements

### Requirement: Current Page Image human artifact view is bounded and derived from canonical owners

For an exact current Page Image Workflow scope, the Harness SHALL be able to rebuild one local
human artifact reference view from canonical Style Master, provider-input inspection, raw/review,
final, assembly, notes, and delivery owners. The view SHALL list only artifacts whose owning
current facts establish their availability; it SHALL not discover current evidence by directory
order, filenames, timestamps, copied media, prior view content, or display reference.

Available page artifacts SHALL be ordered by the current full-plan position and stable
`slide_id`; human-facing image entries SHALL retain the existing `NN_slideID` convention.
Style Master entries SHALL use their stable candidate identity. Every entry SHALL give an
artifact type, inspection purpose, and a local absolute locator. Visible display references SHALL
be kind-prefixed and collision-aware within the view; a full SHA-256 may occur only where it is
unavoidably part of the physical locator and SHALL not be the view's human display reference.

When the current progressive raw owner establishes a Complete Page Review whose decision is still
unset, the view SHALL list that review's current page artifacts and review projection before any
human `proceed` or `repair` decision. The entries SHALL be derived from the same current
owner-established plan, page bytes, and review projection that the `image2 review` operation
uses. They SHALL not require accepted raw evidence, create a second review surface, infer a
review from raw directories, or make final/delivery artifacts appear available.

The view SHALL be rebuildable, provider-free, secret-safe, and non-authoritative. It SHALL not
contain credentials, authorization headers, environment values, provider response bodies, raw
prompt prose, image data URLs, or a new copy of lifecycle/review/acceptance state. Neither its
short display references nor its locators may select a plan, batch, attempt, candidate, or review
decision; authorize provider work; or substitute for source, provenance, or receipt bindings.

#### Scenario: Current evidence receives stable human locators

- **WHEN** a current plan has available Style Master, review, final, and delivery artifacts
- **THEN** the rebuilt view lists their owner-established locators with their type and inspection
  purpose in stable candidate or full-plan slide order
- **AND** its display labels do not replace the existing exact digest and formal-ID protocol keys

#### Scenario: Current Complete Page Review is inspectable before its decision

- **WHEN** every page in a current Pure or Framed full plan is materialized and the raw owner has
  established a Complete Page Review with no `proceed` or `repair` decision
- **THEN** the rebuilt view lists each current review page and its complete-review projection with
  stable IDs, typed display references, absolute read-only locators, artifact types, and review
  purposes
- **AND** it leaves final media and delivery unavailable and does not mutate state, receipts,
  grants, attempts, review decisions, or provider work

#### Scenario: A repaired Complete Page Review is not current display evidence

- **WHEN** the current plan has only a Complete Page Review whose `repair` decision is already
  recorded and no accepted raw evidence
- **THEN** the rebuilt view does not list that historical review's page or contact-sheet locators
- **AND** it marks Complete Page Review, final media, and delivery unavailable without mutating
  the next raw-rebuild route

#### Scenario: A later lifecycle artifact does not exist yet

- **WHEN** a current scope has planned or reviewed evidence but no final, notes, or delivery
  artifact
- **THEN** the view marks only those later artifact categories as unavailable
- **AND** it does not infer a path, create placeholder evidence, mutate lifecycle state, or add a
  review or authorization gate

#### Scenario: A display reference is presented to a lifecycle operation

- **WHEN** a caller supplies a view locator or short display reference where an exact lifecycle
  selector is required
- **THEN** the lifecycle operation continues to require its existing formal selector or full
  SHA-256 argument
- **AND** the view does not resolve, translate, or authorize that request
