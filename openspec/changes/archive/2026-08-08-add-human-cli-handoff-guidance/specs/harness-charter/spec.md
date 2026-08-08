## ADDED Requirements

### Requirement: Harness guidance separates human CLI summaries from control identifiers

Active Charter and Agent guidance SHALL require an Agent that reports a successful direct Harness
CLI result to a person to give a bounded human summary of its purpose, outcome, and any next human
action. It SHALL use the result's domain identifiers rather than reproduce ordinary success JSON or
make a raw 64-hex digest the conversational status label. The Agent SHALL retain an exact full
SHA-256 only for the owner-controlled CLI command that requires it, unless the person explicitly
requests that exact identifier.

This requirement applies to successful `ppt_flow`, `style-master`, and `image2` operations. It
does not change the JS/CLI machine schema or the existing diagnostic-recovery path for non-zero
results; an Agent SHALL continue to consume the producer-issued failure envelope rather than
summarize a failure as if it were a successful status.

#### Scenario: Agent relays a structural preview

- **WHEN** a successful direct CLI structural preview returns an exact plan digest
- **THEN** the Agent reports the preview outcome and the existing next human confirmation in domain
  terms without reproducing the ordinary success payload or using the digest as its status label
- **AND** it retains that digest only for the exact apply command when the current owner requires it

#### Scenario: Person requests an exact identifier

- **WHEN** a person explicitly asks for the exact SHA-256 that the Agent retained for a current
  owner-controlled command
- **THEN** the Agent may provide that exact identifier with its control purpose
- **AND** it does not present an abbreviated display reference as an equivalent selector

#### Scenario: CLI reports a bounded failure

- **WHEN** a direct Harness CLI exits non-zero with a valid current diagnostic envelope
- **THEN** the Agent follows the existing producer-first diagnostic-recovery handoff
- **AND** it does not treat the human-success-summary rule as a replacement recovery path

## MODIFIED Requirements

### Requirement: Harness guidance makes Page Image inspection handoffs locatable

Active Charter and Agent guidance SHALL require an Agent that asks a person to inspect one or
more current Page Image artifacts to first rebuild the owner-issued human artifact reference view
and to cite every requested artifact's locator, type, and inspection purpose. Saying that an
artifact was generated, opened, or available SHALL NOT replace its locator.

When an Agent reports a current Page Image operation's status or asks a person for a review,
authorization, or delivery action, it SHALL use the rebuilt current reference view as the human
display surface. It SHALL report stable slide/candidate IDs and the view's typed display references
and locators where available. A required owner-issued locator MAY contain content-addressed path
segments. When the view marks an artifact unavailable, the Agent SHALL report that bounded
owner-issued availability fact and SHALL NOT invent a display reference or substitute an abbreviated
selector.

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

#### Scenario: Agent reports a planned current Page Image operation

- **WHEN** an Agent has a successful current Page Image plan and needs to report it to a person
- **THEN** it rebuilds the current artifact view and reports the available typed display reference
  and locator as its human display source
- **AND** it does not accept the display reference as an input selector

#### Scenario: No human display reference is available

- **WHEN** the current reference view marks a later-stage artifact unavailable
- **THEN** the Agent reports that bounded availability fact without inventing a reference or
  exposing an unrelated full digest
- **AND** it preserves the owning workflow's existing next action and gate classification
