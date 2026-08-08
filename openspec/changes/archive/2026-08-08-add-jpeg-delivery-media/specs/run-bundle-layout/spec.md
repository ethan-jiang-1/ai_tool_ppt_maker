## MODIFIED Requirements

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
