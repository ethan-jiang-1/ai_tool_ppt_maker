## ADDED Requirements

### Requirement: Transition preview validates the selected target contract without cross-quality inference

Transition orchestration SHALL resolve the exact source mode/pipeline before candidate processing and
select only the target adapter declared by the candidate.  An Image2-to-HTML preview MAY use the local
HTML adapter to validate and deterministically materialize the proposed target, but its result SHALL be
contract/receipt evidence only.  It SHALL NOT compare quality, assert visual parity, score layout, or
block conversion on subjective HTML appearance.

An HTML-to-Image2 preview SHALL validate the markerless target source through the existing whole-page
source contract without Stage-2 transport, style-master creation, provider credentials, or Image2
submission.  After target publication, normal first-class Image2 pilot/build retains all existing
provider authorization, provenance, content/visual/header review, and final-review behavior.

#### Scenario: HTML target is operationally valid

- **WHEN** the selected HTML target validates and the local adapter produces its current deterministic receipt
- **THEN** preview may be confirmed as a transition plan without an added HTML quality or parity decision

#### Scenario: Image2 target has no provider authority yet

- **WHEN** an HTML-to-Image2 target preview has valid authored markerless source but no credentials or authorization
- **THEN** preview succeeds offline and reports later `needs_render` work without initializing a provider adapter

#### Scenario: Candidate names the wrong pipeline

- **WHEN** candidate source marker and selected target mode disagree
- **THEN** orchestration hard-stops before either adapter reads generated artifacts or performs writes
