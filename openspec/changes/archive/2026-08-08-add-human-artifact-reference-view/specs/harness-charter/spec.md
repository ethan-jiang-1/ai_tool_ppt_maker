## ADDED Requirements

### Requirement: Harness guidance makes Page Image inspection handoffs locatable

Active Charter and Agent guidance SHALL require an Agent that asks a person to inspect one or
more current Page Image artifacts to first rebuild the owner-issued human artifact reference view
and to cite every requested artifact's locator, type, and inspection purpose. Saying that an
artifact was generated, opened, or available SHALL NOT replace its locator.

The guidance SHALL describe the locator as a read target only. It SHALL NOT grant hand-edit
permission for `_generated/`, select a lifecycle record, authorize provider work, record a review
decision, or replace the existing guide, confirm, and hard-stop classifications.

#### Scenario: Agent requests a Complete Page Review

- **WHEN** an Agent asks a person to inspect current Pure or Framed complete-page evidence
- **THEN** it cites the reference-view locator for every requested page or review projection,
  together with its artifact type and review purpose
- **AND** it preserves the existing owner-issued review decision and generated-artifact boundary

#### Scenario: Agent requests delivery inspection

- **WHEN** an Agent asks a person to inspect final PNG/PPTX, notes, or a delivery receipt
- **THEN** it gives the corresponding current reference-view locator rather than a bare
  "delivered" or "opened" statement
- **AND** it does not present a display reference or locator as an acceptance or authorization key
