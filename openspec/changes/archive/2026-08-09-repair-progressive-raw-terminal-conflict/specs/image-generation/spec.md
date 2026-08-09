## ADDED Requirements

### Requirement: Progressive terminal siblings preserve verified success

For one exact submitted progressive raw attempt, a childless `succeeded` and
`unknown` terminal pair SHALL have one effective `succeeded` terminal only when
both records bind the same immutable attempt tuple and the succeeded record's
existing materialization provenance and provider bytes validate through the
ordinary direct owner evidence path. The unknown record SHALL remain immutable
audit history; it SHALL not replace, downgrade, retry, reopen, or authorize the
item.

The progressive owner SHALL retain a non-bypassable integrity hard-stop for
every terminal branch other than the existing childless `known_failure` plus
`unknown` compatibility pair and the verified pair defined above, for a missing
or invalid succeeded provenance or bytes chain, or for any plan, batch, grant,
attempt-key, slide, or raw-contract mismatch. Valid terminal-sibling
classification is a deterministic `guide` and requires no human decision;
invalid branches protect immutable identity and provenance and create no retry,
record rewrite, replacement authorization, or provider request.

The owner SHALL complete the existing direct materialization provenance and
byte validation before exposing the succeeded child as an effective terminal.
If an exact `reconcile` request names the submitted parent of an already
validated effective pair, the owner SHALL return its current next-action
projection without calling lookup or appending an attempt, provenance, grant,
or provider request. This idempotent result SHALL NOT make the retained
`unknown` child eligible, current, or retryable.

#### Scenario: Verified success dominates its unknown sibling without mutation

- **WHEN** one submitted attempt has childless `succeeded` and `unknown`
  terminal records and the succeeded record's exact provenance and provider
  bytes validate
- **THEN** lifecycle inspection, reconciliation, and next-action evaluation
  treat that tuple as succeeded and retain the unknown record only for audit
- **AND** they create no retry, replacement grant, record rewrite, provider
  request, or human confirmation

#### Scenario: Reconcile does not append a third terminal after effective success

- **WHEN** `reconcile` receives the exact submitted parent for an already
  validated succeeded/unknown terminal pair
- **THEN** it returns the current owner-issued next action without lookup or a
  raw-owner record write
- **AND** it does not append a terminal sibling, submit a provider request, or
  alter the batch grant or materialization evidence

#### Scenario: An unproven success sibling remains an integrity hard-stop

- **WHEN** a submitted attempt has a `succeeded` and `unknown` sibling pair
  but the succeeded provenance or bytes cannot validate, or a terminal branch
  other than the preserved known-failure/unknown pair exists
- **THEN** the owner hard-stops before lifecycle continuation
- **AND** it neither selects a terminal child nor creates a retry, state edit,
  replacement authorization, or provider request
