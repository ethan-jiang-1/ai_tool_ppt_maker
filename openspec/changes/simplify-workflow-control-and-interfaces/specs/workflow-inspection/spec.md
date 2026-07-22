## ADDED Requirements

### Requirement: Inspection provides the sole caller-facing workflow entry

After Change-1 ledger evidence identifies an exact run, controller and CLI routing SHALL obtain
their ordered workflow entry from `workflow_inspection.primary_action`. They SHALL not rederive
mode, gate, recovery, completion, hash, authorization, or next-action policy from generic node
state. The entry SHALL expose only required identity/order/error facts and owner-issued action;
it SHALL not write, cache, call a provider, or replace mutation-time direct revalidation.

#### Scenario: Controller resumes a valid run
- **WHEN** a controller resumes an exact run
- **THEN** it consumes one inspection primary action before routing user intent
- **AND** it does not synthesize a competing generic-node action

#### Scenario: Direct fact changes after entry
- **WHEN** a source, receipt, authorization, or CAS value changes after entry returns
- **THEN** the direct mutation owner rechecks it before writing
- **AND** the prior projection cannot authorize mutation
