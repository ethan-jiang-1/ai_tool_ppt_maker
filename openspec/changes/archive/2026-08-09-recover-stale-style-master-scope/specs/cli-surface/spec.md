## MODIFIED Requirements

### Requirement: Style Master diagnostics remain owner-issued and bounded

Every Style Master hard failure SHALL use the registered producer-owned diagnostic envelope and report the
earliest independent failure in the current candidate lifecycle. The producer SHALL return the nearest
legal owner action for missing/stale intent or selection, unavailable runtime, candidate-plan/grant mismatch,
uncertain attempt, invalid candidate evidence, lifecycle-head conflict, or selection compare-and-swap conflict; consumers SHALL NOT derive a
parallel style recovery route from prose or file presence.

When selected-workflow visual/source drift makes an existing Style Master
selection stale but a current canonical candidate validates, `style-master
inspect` SHALL return its normal owner projection with one replacement-planning
next action and `style-master plan` SHALL accept that same scope for the
provider-free successor plan. Neither command SHALL classify that bounded
condition as an internal failure or direct the Agent to an inspection that has
the same stale-scope precondition. Any raw-plan diagnostic preceding the new
selection shall name only this Style Master recovery and shall not imply
provider authorization, provider retry, source-epoch mutation, raw-plan
publication, or Page Image evidence acceptance.

#### Scenario: Missing selection has one repair action

- **WHEN** page raw planning finds no current accepted effective-style selection
- **THEN** the CLI emits one bounded Style Master owner action before page raw provider work
- **AND** it does not offer raw-plan force, file-copy, or generic retry alternatives

#### Scenario: Candidate conflict is not reported as provider failure

- **WHEN** a candidate promotion loses its compare-and-swap precondition after valid candidate bytes exist
- **THEN** the CLI reports the current-selection conflict and its review/rebuild action
- **AND** it does not blame the provider, resubmit a candidate, or overwrite the selection

#### Scenario: Unknown attempt has one preserved-cost recovery action

- **WHEN** inspection finds an attempt whose provider outcome became unknown after submit
- **THEN** the CLI reports the recoverability hard-stop and exact-plan abandonment action requiring a human reason
- **AND** it does not offer retry, force, outcome editing, or successor authorization as the same action

#### Scenario: Stale source context has one replacement-planning action

- **WHEN** `style-master inspect` or `style-master plan` reaches a stale prior
  selection while the selected workflow's current canonical candidate validates
- **THEN** inspection returns the owner-issued replacement Style Master
  planning action and planning accepts the same scope to publish its
  provider-free successor
- **AND** neither command returns an opaque internal error, self-referential
  inspect loop, raw-plan force, provider retry, or mutation claim
