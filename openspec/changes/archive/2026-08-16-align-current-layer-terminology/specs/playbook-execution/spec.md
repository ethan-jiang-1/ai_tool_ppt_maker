# Playbook Execution Specification (delta)

## MODIFIED Requirements

### Requirement: Current Controller refresh and Pilot paths preserve the Page Image model

Pilot remains a provider-free sample stage. Its `pilot` command creates only an
exact batch projection; an Agent acting under the active Task Mandate selects
the owner-allowed risk-representative formal IDs, then the same exact batch
receives its mandate-bound grant before `generate` is invoked. A partial Pilot
may present the same policy-specific page representation that Complete Page
Review will use, but it does not publish acceptance or add a duplicate review
gate. `pilot-review` and `pilot-accept` apply only to partial Pilot evidence;
complete current coverage goes directly to Complete Page Review. The Controller
SHALL use direct owner facts to determine any remaining paid work, not task-card
state or file presence.

A Framed provider-free local overlay refresh is permitted only when its owner
proves the compiled provider input, protected composition, raw contract, and
local profile are unchanged. A changed header literal normally changes provider
context and routes to raw rebuild. Notes-only work remains delivery-owned;
structural or whole-workflow changes use previewed exact-hash versioning.

#### Scenario: A Framed title change avoids false local refresh

- **WHEN** a Framed title literal changes
- **THEN** the Controller presents the owner-issued raw rebuild path
- **AND** it does not place the change on a provider-free Pilot or local
  overlay path

#### Scenario: Pilot remains non-accepting

- **WHEN** a mandate-bound Framed Pilot sample is available
- **THEN** the Controller presents its raw and composite sample representation
- **AND** it does not record final-page acceptance or open a second review
  gate

### Requirement: Existing-deck sessions start with whole-workflow resume ritual

For an exact run, an existing-deck session SHALL begin with state/status
inspection and use its shared workflow inspection as progress truth. The
Controller SHALL resolve source marker, schema, exact run version, durable
workflow, and Controller identity before selecting a resume node. A usable
current state resumes its active current Controller/node after presenting the
full workflow position. A current one-to-one canonical defect is repaired only
by its owning mutation path behind existing fences; observation remains
non-writing. Pre-current schema, topology-only version identity, retired
Controller/node, missing/retired marker, or unrecoverable state SHALL return
the one owner-issued typed next action with no state seed, alias, inferred
workflow, or current execution graph.

#### Scenario: Current execution resumes with durable identity

- **WHEN** a run has a current marker, workflow, and in-progress current
  Controller state
- **THEN** the Agent presents whole-workflow position and resumes that exact
  Controller/node

#### Scenario: Historical execution does not become a current route

- **WHEN** observation finds pre-current state or a retired identity
- **THEN** the Agent presents the one bounded owner-issued typed next action
  without writing state or choosing a replacement node

#### Scenario: Identity recovery remains a hard-stop

- **WHEN** the current inspection result reports an identity, evidence,
  journal, or CAS hard-stop
- **THEN** the Controller names the protected invariant and the one
  owner-issued next action
- **AND** it does not manufacture a continuation, confirmation, or state
  replacement from historical fields
