# workflow-inspection Specification

## Purpose
Define the read-only workflow-observation projection that gives MD Controllers and CLI observers one ordered, owner-issued next action for an exact run without reconstructing mode, gate, recovery, or completion policy.
## Requirements
### Requirement: Inspection is observation-only and not an authority
Inspection SHALL perform zero state, history, metadata, generated-artifact, receipt, authorization, or source writes; it makes zero network/provider calls and shall not cache a verdict, heal state, migrate schema, or recover a journal. A repairable current direct fact is reported with its owning repair action. Mutation owners revalidate their direct source/CAS/authorization/receipt facts immediately before a write or submit and never treat an earlier inspection as authorization or freshness proof. An unsupported historical protocol remains byte-preserving and produces one bounded owner-issued typed next action, not a compatibility projection.

Every controller-facing observation, including ppt_flow status and ordinary
ppt_flow state projection, SHALL consume the same read-only inspection
checkpoint or a direct read-only evaluator already used by that checkpoint. It
SHALL NOT call a protocol receipt initializer, receipt writer, lifecycle
operation, or provider-facing adapter merely to calculate a resume-card
condition. An unavailable direct fact SHALL remain unavailable and produce the
inspection owner's nearest legal action.

#### Scenario: Inspection observes a repairable current state without healing
- **WHEN** inspection encounters a schema-5 state shape the owner could safely repair
- **THEN** it reports the owner-provided action
- **AND** no state, history, or metadata file changes

#### Scenario: Inspection observes unsupported history
- **WHEN** identity is pre-current, absent, retired, or ambiguous
- **THEN** it returns the bounded owner action without a route, mode, or execution inference

#### Scenario: Controller observation does not materialize a protocol receipt

- **WHEN** ppt_flow status or ordinary ppt_flow state projects an exact current run whose
  required protocol receipt is absent or stale
- **THEN** it returns the existing owner-issued repair or validation action from the
  read-only checkpoint
- **AND** it does not create, replace, or refresh either a v1 or v2 receipt

### Requirement: Inspection projects Page Authority direct prerequisites
When the exact source/state pair resolves to `page-authority-image2-v1` /
`image2-page-authority`, `inspectWorkflow` SHALL retain its current schema and obtain the ordered
Page Authority source receipt, applicable authorization, raw evidence/review, final-manifest,
assembly/notes, and delivery-review facts from their direct owners. Its checkpoint SHALL identify the
exact direct facts used for the Page Authority verdict. It SHALL expose the nearest owner-issued
Page Authority action and SHALL NOT inspect or select retired evidence or a legacy generated-artifact
route as a Page Authority prerequisite.

The v1 source-receipt fact SHALL be read from its direct path. If it is absent,
partial, stale, or mismatched, inspection and every controller/status consumer
SHALL return its existing direct owner action without materializing a v1
receipt.

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

#### Scenario: Missing CURRENT receipt remains a direct-fact repair

- **WHEN** status, state, or inspectWorkflow observes an exact CURRENT v1 pair whose
  source-receipt.json does not exist
- **THEN** it reports the v1 source/evidence owner's nearest action
- **AND** source-receipt.json remains absent after the observation

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

### Requirement: Inspection projects TARGET workflow prerequisites marker-first

Inspection SHALL remain observation-only and resolve a target run from the
exact v2 source/state pair before projecting workflow status. For a valid
target pair it SHALL report the selected `framed` or `pure` workflow, the
direct receipt/evidence prerequisite, and one owner-issued nearest action. It
SHALL NOT heal state, infer a workflow from artifacts, or calculate a second
pass/fail authority from Markdown or a compatibility summary.

CURRENT v1 mixed runs SHALL continue to project their bounded compatibility
route. A partial, hybrid, or mismatched v1/v2 pair SHALL project the owning
repair hard-stop rather than either workflow.

All selected-target controller/status observation SHALL use this marker-first
projection without importing or invoking the CURRENT v1 receipt-writing
adapter. A v2 receipt is a direct target fact; its presence SHALL NOT cause a
v1 receipt to be created, refreshed, or consulted as a substitute.

#### Scenario: Target Framed raw debt has one inspection action

- **WHEN** a valid target Framed source/state pair has no current accepted raw evidence
- **THEN** inspection reports workflow `framed` and the raw-plan/authorization prerequisite from its owner
- **AND** it does not suggest a Pure path or a per-slide authority repair

#### Scenario: Hybrid pair is observed without coercion

- **WHEN** a v2 source is paired with a CURRENT v1 state mode
- **THEN** inspection reports the marker/state repair hard-stop without mutation
- **AND** it does not classify the run as CURRENT compatibility or TARGET workflow work

#### Scenario: Selected target observation cannot create a CURRENT receipt

- **WHEN** status or ordinary state observation reads a valid selected v2 Framed or Pure
  pair with a current source-receipt-v2.json and no v1 source-receipt.json
- **THEN** it returns the selected workflow's existing direct owner action
- **AND** the v2 receipt bytes remain unchanged and the absent v1 receipt remains absent
