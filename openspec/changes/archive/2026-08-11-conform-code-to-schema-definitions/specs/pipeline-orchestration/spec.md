## MODIFIED Requirements

### Requirement: Current Page Image lifecycle has one policy per version

Orchestration SHALL resolve one current schema-declared `page-image-workflow`
policy, `framed` or `pure`, for the entire version. Both policies retain the
common Page Image Core, provider-content contract, compiled-input lineage, and
shared delivery ownership. An undeclared policy or marker SHALL fail before
orchestration selects an adapter, creates a state transition, or reaches
provider work; it SHALL not be treated as an alternate current workflow.

#### Scenario: A version resolves one current policy

- **WHEN** orchestration evaluates a valid current version source
- **THEN** it resolves exactly `framed` or `pure` under the declared pipeline
- **AND** no historical or per-slide policy is selectable

#### Scenario: A version cannot mix header policies

- **WHEN** a current version attempts mixed Framed/Pure header policy
- **THEN** orchestration retains the existing single-policy rejection
- **AND** it does not choose an alternate contract
