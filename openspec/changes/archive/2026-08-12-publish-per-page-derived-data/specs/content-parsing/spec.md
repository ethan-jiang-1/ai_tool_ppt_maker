## ADDED Requirements

### Requirement: Current parsed Page Source receipts are publishable per page

When a current Page Image Workflow source has been parsed into a valid receipt,
Content Parsing SHALL make each normalized page fact available to the one
provider-free `image2 plan` publication for that receipt's exact source digest,
workflow, ordered stable IDs, and normalized page fields. The published
`page-source-receipt` SHALL retain its stable `slide_id`, source binding, and
parser-owned normalized facts; it SHALL not become an editable source copy,
provider input, authorization, review decision, or lifecycle selector.

Invalid source parsing SHALL prevent dependent publication. The parser SHALL
not use a prior publication, a page filename, or a different receipt to fill a
missing current page fact.

#### Scenario: A parsed page is published from its exact receipt

- **WHEN** a valid current source reaches provider-free `image2 plan`
- **THEN** its independently published page-source receipt carries the same
  stable ID, normalized workflow, source digest, and parsed facts as the
  parser's current receipt
- **AND** the publication does not create provider work or an alternate source

#### Scenario: Invalid source prevents a derived receipt publication

- **WHEN** current source parsing fails before a valid receipt exists
- **THEN** no per-page source-receipt publication is emitted for that candidate
- **AND** the owner does not read a former publication or authorize provider work
