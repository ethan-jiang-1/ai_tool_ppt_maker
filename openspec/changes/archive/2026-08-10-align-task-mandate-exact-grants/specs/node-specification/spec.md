## ADDED Requirements

### Requirement: State owns one current Page Image Task Mandate reference

For each current Page Image version, State SHALL be the durable owner of an
optional, versioned Task Mandate record. A valid record SHALL bind only the
current run version, selected workflow, active execution identity and start
time, issuance time, the fixed `normal-page-image-production` scope, and a
stable digest/reference used by the raw-plan lineage. It SHALL NOT persist raw
Work Request prose, prompt text, credentials, provider responses, or an
unbounded human-cost questionnaire.

The MD Agent interprets a clear current Work Request; the selected Page Image
planning path SHALL establish the record once when that provider-free planning
is invoked under that request, or reuse it only when those direct bindings
still match. Source edits inside the same version/workflow/execution may reuse
the mandate while producing a new exact raw plan and grant. A new version,
execution, workflow, identity failure, or explicit out-of-scope request SHALL
not reuse the old reference for new provider work. State observation SHALL stay
byte-preserving and SHALL not infer Work Request semantics, repair, or activate
a mandate.

The Controller may record successful mandate-covered planning and exact-grant
evidence as `agent` or `cli`; it SHALL NOT record it as a human visual or cost
decision. Existing user-only Pilot, Complete Page Review, and delivery-review
decisions retain their typed `user` provenance.

#### Scenario: Current planning records one bounded mandate

- **WHEN** a selected Framed or Pure current execution reaches provider-free
  progressive raw planning with no matching Task Mandate
- **THEN** the owning state mutation records one current non-secret mandate
  reference with its exact version, workflow, and execution binding
- **AND** a retry of the same current planning scope reuses that reference
  rather than creating another human decision record

#### Scenario: Same-task source refinement retains the mandate but not the plan

- **WHEN** source facts change inside the same active version/workflow/execution
  under the same Task Mandate
- **THEN** the state record remains attributable to that Task Mandate while the
  raw owner requires a new exact plan and any needed new batch grant
- **AND** no earlier plan, grant, attempt, or accepted evidence is rewritten

#### Scenario: A new execution cannot reuse a prior mandate

- **WHEN** a new version, selected workflow, or active execution replaces the
  current Page Image work
- **THEN** the prior mandate is ineligible for new provider work
- **AND** State and the raw owner reject new submission before a matching
  current mandate and exact raw plan exist

#### Scenario: Observation never manufactures Work Request authority

- **WHEN** state/status inspection finds no current Task Mandate or a stale
  mandate reference
- **THEN** it reports the bounded owner-issued next action without writing
  State, history, task projections, generated artifacts, or provider work
- **AND** it does not infer authority from chat text, a prior grant, or a
  navigation artifact

#### Scenario: A direct grant cannot complete an unrelated Controller node

- **WHEN** an exact `image2 authorize` operation records or replays a valid
  mandate-bound grant while the active Controller node is not the matching
  Framed/Pure Pilot or Expansion authorize node
- **THEN** the direct raw-owner grant remains its own valid evidence while the
  state-owned handoff leaves Controller node status and evidence unchanged
- **AND** it does not fabricate a user decision or complete a sibling node

#### Scenario: A current refinement supersedes only prior CLI grant evidence

- **WHEN** a same-execution source refinement or successor establishes a later
  current mandate-bound exact grant at its matching stable authorize node
- **AND** that node's prior completion contains only typed CLI grant evidence
- **THEN** State records the later exact CLI evidence as the current Controller
  projection and retains each prior raw plan, batch, grant, attempt, and
  provenance record unchanged
- **AND** human, malformed, unmatched-node, or failed current-fact evidence is
  not reset or superseded
