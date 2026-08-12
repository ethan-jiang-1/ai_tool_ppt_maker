## MODIFIED Requirements

### Requirement: Current parsed Page Source receipts are publishable per page

After a current Page Source validates, its parsed receipt SHALL publish the
declared Page Source Receipt stage and exact declared `artifact_role`, with its
existing stable identities, source bytes, Page Class, selected workflow,
provenance, and source-owned restrictions. The receipt SHALL not use a
code-only envelope, a `kind` substitute for serialization role, or an
undeclared schema alias. `kind` retains only its established business/action meaning.

#### Scenario: A parsed current source publishes its receipt

- **WHEN** a current homogeneous Page Source validates
- **THEN** its receipt identifies the declared Page Source Receipt stage and
  declared role alongside existing current provenance
- **AND** downstream current owners consume that one envelope

#### Scenario: An undeclared receipt envelope is rejected

- **WHEN** a source receipt has an undeclared stage/role or replaces role with
  a `kind` value
- **THEN** the owning validator rejects it before dependent layout, raw, or
  provider work
- **AND** it does not normalize the envelope to another contract

#### Scenario: A parsed page is published from its exact receipt

- **WHEN** one current valid receipt contains a page
- **THEN** the per-page publication carries the same declared receipt stage and
  role, stable slide identity, source digest, and selected workflow
- **AND** it does not publish from independently reparsed, stale, or
  hand-assembled source data

#### Scenario: Invalid source prevents a derived receipt publication

- **WHEN** current source parsing fails before a valid receipt exists
- **THEN** no per-page source-receipt publication is emitted for that candidate
- **AND** the owner does not read a derived publication or authorize provider work
