## MODIFIED Requirements

### Requirement: Harness guidance makes Page Image inspection handoffs locatable

Active Charter and Agent guidance SHALL require an Agent that asks a person to inspect one or
more current Page Image artifacts to first rebuild the owner-issued Human Navigation Path tree
and to cite every requested artifact's short physical locator, type, and inspection purpose from
its index. Saying that an artifact was generated, opened, or available SHALL NOT replace its
short physical locator, and the Agent SHALL NOT hand a person an original SHA-named storage path.

When an Agent reports a current Page Image operation's status or asks a person for a review,
authorization, or delivery action, it SHALL use the rebuilt current navigation index as the human
display surface. It SHALL report stable slide/candidate IDs and the view's typed display references
and short physical locators where available. When the view marks an artifact unavailable, the
Agent SHALL report that bounded owner-issued availability fact and SHALL NOT invent a display
reference, a navigation copy, or an abbreviated selector.

The guidance SHALL describe a Human Navigation Path as a read/navigation target only. It SHALL
NOT grant hand-edit permission for `_generated/`, select a lifecycle record, authorize provider
work, record a review decision, or replace the existing guide, confirm, and hard-stop
classifications. A retained full SHA-256 remains internal to an owner-controlled command and is
never a human artifact-navigation path.

#### Scenario: Agent requests a Complete Page Review

- **WHEN** an Agent asks a person to inspect current Pure or Framed complete-page evidence
- **THEN** it cites the Human Navigation Path for every requested page or review projection,
  together with its artifact type and review purpose
- **AND** it preserves the existing owner-issued review decision and generated-artifact boundary

#### Scenario: Agent requests delivery inspection

- **WHEN** an Agent asks a person to inspect final PNG/PPTX, notes, or a delivery receipt
- **THEN** it gives the corresponding current short physical locator rather than a bare
  "delivered" or "opened" statement or a canonical storage locator
- **AND** it does not present a display reference or navigation path as an acceptance or
  authorization key

#### Scenario: Agent reports a planned current Page Image operation

- **WHEN** an Agent has a successful current Page Image plan and needs to report it to a person
- **THEN** it rebuilds the current navigation tree and reports the available typed display
  reference and short physical locator as its human display source
- **AND** it does not accept the display reference or navigation path as an input selector

#### Scenario: No human display reference is available

- **WHEN** the current navigation index marks a later-stage artifact unavailable
- **THEN** the Agent reports that bounded availability fact without inventing a path or exposing an
  unrelated full digest
- **AND** it preserves the owning workflow's existing next action and gate classification
