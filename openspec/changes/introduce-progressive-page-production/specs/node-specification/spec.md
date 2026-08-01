## MODIFIED Requirements

### Requirement: TARGET Page Authority state is bound to one version workflow

For the exact page-authority-image2-v2 / image2-page-authority-v2 pair, Node
Specification SHALL record the bound source receipt identity, version workflow,
source epoch, accepted raw-evidence reference, and final/delivery references
through the existing state owner. The state writer SHALL accept only framed or
pure when it matches the immutable v2 source receipt. MD Controller and
inspection consumers SHALL read the owner-issued projection and SHALL NOT
recreate receipt, CLI, or evidence schemas.

The raw lifecycle owner, not generic node state, SHALL own full plans, batch
grants, claims, attempts, consumption, materialization provenance, Pilot bytes,
and batch progress. State may retain typed node decision/evidence references
needed to resume the current Controller, but such a reference shall not prove
provider cost, current bytes, coverage, or acceptance without the raw owner's
direct revalidation.

For a progressive v3 lifecycle, the legacy
`page_authority_raw_provider_authorization` record and the target evidence
record's v2 `provider_authorization_sha256` SHALL not be populated or consumed
as current cost authority. A present legacy field remains parseable only as
historical v2 context; it shall not be copied into a v3 handoff, used to
authorize a v3 batch, or silently migrated. The state handoff for accepted raw
work is only the v3 evidence reference after the raw owner directly validates
its complete provenance chain.

The state validator SHALL treat a missing workflow, source/state workflow
mismatch, v1/v2 identity collision, or evidence bound to a different receipt
or epoch as a non-mutating hard-stop. Its primary result SHALL identify the
earliest direct-fact failure and one owner-issued repair-and-rerun action.

#### Scenario: Target state records its source workflow once

- **WHEN** a valid v2 Pure source receipt initializes a fresh target version
- **THEN** state records mode image2-page-authority-v2, workflow pure, and source epoch 1
- **AND** every later target node reads that one workflow rather than a per-slide authority field

#### Scenario: Source and state cannot claim different target workflows

- **WHEN** a v2 source receipt says framed and the state record says pure
- **THEN** validation returns the source/state identity repair hard-stop without writing state
- **AND** no controller, inspection, or generation path guesses which workflow to use

#### Scenario: State cannot become a raw submission ledger

- **WHEN** a progressive Pilot or Expansion has grants, attempts, or materialized items
- **THEN** state retains only the Controller's typed handoff reference when one is required
- **AND** it does not duplicate attempts, counters, bytes, grant consumption, or a second success record

#### Scenario: Legacy state authorization cannot authorize a progressive batch

- **WHEN** a selected run retains a valid v2 raw-authorization field while its progressive raw head is current
- **THEN** state validation treats that field as historical context and asks the raw owner for the current batch/grant facts
- **AND** it does not copy, upgrade, or consume the v2 field as v3 cost authorization

## ADDED Requirements

### Requirement: Progressive Controller handoffs remain evidence references

Node Specification SHALL permit current Page Authority Controller nodes to
record distinct typed references for a partial Pilot decision, a complete raw
review decision, and a delivery decision. A partial Pilot proceed reference
shall only permit the Controller to request the raw owner's current Expansion
planning projection. Complete raw and delivery decision references shall each
remain bound to their own current evidence owner. Node status, a checkbox, or
a decision reference alone SHALL not satisfy authorization, complete coverage,
finalization, or delivery prerequisites.

#### Scenario: Partial Pilot reference does not bypass complete review

- **WHEN** a current Controller resumes after a partial Pilot proceed
- **THEN** it consumes the raw owner's remaining-scope inspection before presenting Expansion authorization
- **AND** it does not mark raw review, finalization, or delivery nodes completed
