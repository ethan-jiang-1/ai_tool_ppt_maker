## ADDED Requirements

### Requirement: TARGET Framed visual semantics have one Framed workflow owner

Shared visual language and closed registry selection SHALL remain available to
both target workflows. For workflow `framed`, the Framed adapter SHALL be the
sole owner of `standard-v1`, deterministic fit preflight, reserved underlay
rectangles, text-free raw constraints, and local Text Frame composition inputs.
For workflow `pure`, those Framed-specific facts SHALL NOT be added to the Pure
raw plan or shared raw mechanics.

A Framed fit or no-text violation SHALL be detected before provider work and
return the owning deterministic repair action. A frame preset change SHALL
invalidate the related underlay/raw tuple; it SHALL NOT be classified as a
text-only local refresh.

#### Scenario: Framed preflight blocks invalid content early

- **WHEN** a target Framed source exceeds deterministic Text Frame fit or requires semantic body text
- **THEN** the Framed owner rejects it before raw authorization with one repair-or-whole-version-switch action
- **AND** it does not silently change the slide or version to Pure

#### Scenario: Pure target plan has no Framed runtime semantics

- **WHEN** a valid target Pure source is compiled into a raw plan
- **THEN** the plan carries Pure display/raw contract facts and no Text Frame preset or reserved-underlay requirement
- **AND** shared raw mechanics can consume it without a Framed branch
