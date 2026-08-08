## ADDED Requirements

### Requirement: Current Page Image human artifact reference view is a canonical derived artifact

For one exact current Page Image Workflow run, Run-Bundle Layout SHALL reserve
`_generated/page_image_workflow/reference/human-artifact-reference-v1.md` as the canonical
location of the rebuildable human artifact reference view. The view SHALL be confined to that
run-scoped derived location and SHALL remain outside Style Master and progressive-production
immutable storage roots.

The view SHALL not become source, lifecycle state, a receipt, a CAS head, an artifact alias, or
an input selector by path, filename, timestamp, or hand edit. Removing or editing it SHALL not
alter current authority; its owning explicit projection operation is the only supported rebuild
route.

#### Scenario: A reference view is deleted or changed

- **WHEN** a current run's human artifact reference view is absent or has been manually changed
- **THEN** current source, state, plans, grants, evidence, review, and delivery authority remain
  unchanged
- **AND** the supported projection operation can replace it from canonical owners without using
  its previous contents as input

#### Scenario: Layout resolves a human locator beside immutable history

- **WHEN** a reference view links to an artifact held below a content-addressed immutable owner
- **THEN** the view remains a derived locator outside that owner root
- **AND** layout does not create a short-named directory, symlink, or alternate storage key
