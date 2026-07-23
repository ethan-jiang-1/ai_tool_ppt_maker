## ADDED Requirements

### Requirement: Governance rules have protected invariants
Active blocking architecture and coherence rules SHALL name a protected invariant and nearest owner
action. The canonical `tests/contracts/framework-governance-ledger-v1.json` SHALL inventory every
audited blocking rule with its source, invariant, concrete failure story, direct owner, nearest recovery
action, `guide|confirm|hard-stop` classification, and `retain|remove|advisory` disposition. The file
SHALL declare schema `pptmaker-framework-governance-ledger-v1`, use stable rule IDs, and contain no
retained hard-stop with a missing, non-actionable, or ownerless field; validation SHALL reject each such
row. Rules without a real failure story SHALL be removed or advisory; protected import,
private-boundary, provider-isolation, and production-data rules remain blocking.

#### Scenario: Blocking rule is evaluated
- **WHEN** a rule blocks framework work
- **THEN** its diagnostic names the protected invariant and owner recovery

#### Scenario: Rule lacks an actionable failure story
- **WHEN** the governance ledger records a blocking rule without a concrete failure story or direct recovery owner
- **THEN** validation rejects its retained hard-stop disposition
- **AND** the rule is removed or reclassified before framework verification relies on it
