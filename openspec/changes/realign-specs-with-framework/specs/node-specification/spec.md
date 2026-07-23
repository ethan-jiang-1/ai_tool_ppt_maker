## MODIFIED Requirements

### Requirement: Generic workflow control retires only with ledger proof
The state owner SHALL stop new writes of a generic node/control fact only after the canonical `tests/contracts/workflow-control-ledger-v2.json` identifies its direct owner, writer, readers, invalidation/freshness rule, reconstructibility, removal/retention decision, and replacement test. The file SHALL declare schema `pptmaker-workflow-control-ledger-v2`; every entry SHALL have a stable ID, `surface: durable|derived`, and a recognized decision. `PPTMAKER_FRAMEWORK/reference/workflow-inspection-ledger.md` SHALL explain the same decisions but shall not supersede the JSON ledger.

The execution cursor (`playbook`, `current_node`, execution/version binding, and current-node `waiting_for`) SHALL remain a direct state-owned durable record, not a retirement candidate.

#### Scenario: A generic control fact is proposed for retirement
- **WHEN** a maintainer proposes stopping writes of a generic node or control fact
- **THEN** the state owner requires a complete matching ledger entry and replacement test before the write path changes
- **AND** it retains the execution cursor as durable state
