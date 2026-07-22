## ADDED Requirements

### Requirement: Generic workflow control retires only with ledger proof

The state owner SHALL stop new writes of a generic node/control fact only after the durable-field
ledger identifies its direct owner, writer, readers, invalidation, reconstructibility, and removal
path. Existing supported records SHALL remain read-compatible until every reader is removed or
explicitly retained with a named retirement owner. Minimal cross-invocation human intent MAY
remain only when it is not reconstructible and its direct owner writes it through the existing CAS
or journal boundary.

#### Scenario: Reconstructible record reaches writer retirement
- **WHEN** the ledger proves a generic record can be rebuilt from direct owners
- **THEN** new execution does not write that record
- **AND** restart derives the same inspection primary action without it

#### Scenario: Historical reader still has a caller
- **WHEN** a supported caller requires a historical generic record
- **THEN** it remains a read-only compatibility reader with a named retirement owner
- **AND** no new generic writer is restored
