## ADDED Requirements

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
