## ADDED Requirements

### Requirement: Page Authority structural targets preserve provenance without inheriting acceptance
The existing structural preview/apply transaction SHALL recognize the exact
`page-authority-image2-v1` / `image2-page-authority` pair as a current protocol. Its canonical plan
SHALL bind each retained stable slide ID to either a byte-verifiable raw tuple plus source lineage for
target materialization or `needs_raw_generation`. Apply SHALL revalidate every declared source tuple
before the target is visible, atomically publish only target-owned `unreviewed` raw provenance and raw
debt, and preserve the source version. It SHALL not materialize a final slide, copy raw/delivery review,
provider authorization, or active execution, and SHALL make zero provider calls.

#### Scenario: Mixed target has materialized and missing raw evidence
- **WHEN** a confirmed Page Authority structural plan retains one exact raw tuple and adds one new slide
- **THEN** the clean target records target-owned unreviewed provenance for the retained slide and
  `needs_raw_generation` for the new slide
- **AND** no target final manifest or provider submission is created by structural apply

#### Scenario: Source tuple drift aborts publication
- **WHEN** a source raw byte, tuple, or target resolved raw contract drifts after preview
- **THEN** apply rejects the stale plan before exposing the target version
- **AND** it does not downgrade the materialization to an unverified filename copy or submit a provider request
