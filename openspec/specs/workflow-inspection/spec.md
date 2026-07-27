# workflow-inspection Specification

## Purpose
Define the read-only workflow-observation projection that gives MD Controllers and CLI observers one ordered, owner-issued next action for an exact run without reconstructing mode, gate, recovery, or completion policy.
## Requirements

### Requirement: Inspection is observation-only and not an authority
Inspection SHALL perform zero state, history, metadata, generated-artifact, receipt, authorization, or source writes; it makes zero network/provider calls and shall not cache a verdict, heal state, migrate schema, or recover a journal. A repairable current direct fact is reported with its owning repair action. Mutation owners revalidate their direct source/CAS/authorization/receipt facts immediately before a write or submit and never treat an earlier inspection as authorization or freshness proof. An unsupported historical protocol remains byte-preserving and produces one bounded owner-issued typed next action, not a compatibility projection.

#### Scenario: Inspection observes a repairable current state without healing
- **WHEN** inspection encounters a schema-5 state shape the owner could safely repair
- **THEN** it reports the owner-provided action
- **AND** no state, history, or metadata file changes

#### Scenario: Inspection observes unsupported history
- **WHEN** identity is pre-current, absent, retired, or ambiguous
- **THEN** it returns the bounded owner action without a route, mode, or execution inference

### Requirement: Inspection projects Page Authority direct prerequisites
When the exact source/state pair resolves to `page-authority-image2-v1` /
`image2-page-authority`, `inspectWorkflow` SHALL retain its current schema and obtain the ordered
Page Authority source receipt, applicable authorization, raw evidence/review, final-manifest,
assembly/notes, and delivery-review facts from their direct owners. Its checkpoint SHALL identify the
exact direct facts used for the Page Authority verdict. It SHALL expose the nearest owner-issued
Page Authority action and SHALL NOT inspect or select retired evidence or a legacy generated-artifact
route as a Page Authority prerequisite.

#### Scenario: Invalid raw coverage has one Page Authority action

- **WHEN** an exact Page Authority run has valid source/state facts but a required raw tuple is absent,
  partial, stale, or mismatched
- **THEN** inspection returns the raw evidence/review owner's one bounded action before finalization
- **AND** it does not return a retired review, refinement, composition, or generic legacy action

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

### Requirement: Inspection projects one legacy adoption action before legacy workflow evaluation
`inspectWorkflow` SHALL call the direct legacy protocol observer before selecting Page Authority
workflow prerequisites. For `recognized-legacy`, inspection SHALL return a non-mutating
`guide` whose only primary action is the provider-free adoption prepare or preview checkpoint, and it
SHALL include the observer's bounded source/state/identity/summary digest facts in its stable checkpoint.
It SHALL not select a legacy review, build, refresh, provider, generated-artifact, or Page Authority
evidence action.

For `current`, inspection SHALL continue through the ordinary Page Authority projection. For
`current-pair-corrupt`, it SHALL return the Page Authority repair-owner hard-stop. For
`unsupported-or-corrupt`, it SHALL return the repair/export hard-stop. The observer result must be
re-read by the mutation owner; an inspection result never authorizes prepare, confirmation, publication,
recovery, provider work, or a source/state repair.

#### Scenario: Recognized legacy run gets one adoption guide
- **WHEN** workflow inspection observes an exact recognized historical source/state pair
- **THEN** it returns one provider-free adoption primary action and the direct observation digest
- **AND** it does not project legacy delivery evidence or Page Authority raw evidence as a continuation

#### Scenario: Partial Page Authority pair remains a repair hard-stop
- **WHEN** either source or state claims Page Authority but the exact pair is invalid
- **THEN** inspection returns the Page Authority repair-owner hard-stop
- **AND** it does not offer adoption, generated-artifact inference, or legacy execution

### Requirement: Inspection projects current Page Authority or bounded legacy action
Workflow inspection SHALL produce one read-only Page Authority lifecycle action for a current run, or
one adoption/repair action for a historical/corrupt pair. It SHALL NOT compose a legacy production
cursor, provider request, or approval path.

#### Scenario: A recognized legacy run is inspected
- **WHEN** inspection reads an intact historical pair
- **THEN** it returns the provider-free adoption action and no legacy production route
