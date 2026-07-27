## ADDED Requirements

### Requirement: Inspection projects Page Authority direct prerequisites
When the exact source/state pair resolves to `page-authority-image2-v1` /
`image2-page-authority`, `inspectWorkflow` SHALL retain its current schema and obtain the ordered
Page Authority source receipt, applicable authorization, raw evidence/review, final-manifest,
assembly/notes, and delivery-review facts from their direct owners. Its checkpoint SHALL identify the
exact direct facts used for the Page Authority verdict. It SHALL expose the nearest owner-issued
Page Authority action and SHALL NOT inspect or select HTML review, Image2 refinement, Header-Lock, or a
legacy generated-artifact route as a Page Authority prerequisite.

#### Scenario: Invalid raw coverage has one Page Authority action

- **WHEN** an exact Page Authority run has valid source/state facts but a required raw tuple is absent,
  partial, stale, or mismatched
- **THEN** inspection returns the raw evidence/review owner's one bounded action before finalization
- **AND** it does not return an HTML review, Image2-refinement, Header-Lock, or generic legacy action

#### Scenario: Current raw evidence awaits confirmation

- **WHEN** an exact Page Authority run has complete current raw evidence and a review projection but no
  `proceed|repair|redirect` decision
- **THEN** inspection returns `posture: "confirm"` and the raw-review owner's one human action
- **AND** it does not report a hard-stop, infer `proceed`, or publish a final artifact

#### Scenario: Page Authority observation remains non-mutating

- **WHEN** inspection observes a stale Page Authority final or delivery fact
- **THEN** it returns the owning repair or review action with a stable direct-fact checkpoint
- **AND** it does not compose a frame, publish a final slide, request a provider operation, or alter
  state, history, metadata, receipts, or generated artifacts
