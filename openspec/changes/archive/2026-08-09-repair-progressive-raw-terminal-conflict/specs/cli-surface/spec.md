## ADDED Requirements

### Requirement: Progressive terminal-sibling diagnostics remain executable

When the progressive raw owner recognizes a verified `succeeded` terminal
beside an `unknown` sibling for one submitted attempt, direct `image2`
inspection, planning, reconciliation, and generation SHALL consume that
owner-issued effective success and continue only through the existing next
action. They SHALL not emit an integrity diagnostic, request a new human
authorization, retry the retained attempt, or reinterpret the retained unknown
record. Any later provider request for a different eligible item remains
subject to its unchanged exact grant and generation boundary.

When the owner reports an invalid terminal branch for which no registered
runtime operation is legal, the CLI SHALL fail closed with the existing bounded
internal-maintenance `report_internal` diagnostic. It SHALL not advertise a
generic rebuild, retry, force, state edit, replacement authorization, or
provider work as an executable recovery.

#### Scenario: Verified terminal sibling continues through the owner action

- **WHEN** a current progressive scope contains a valid effective `succeeded`
  terminal with a retained `unknown` sibling
- **THEN** the CLI reports or executes only the next action issued by the raw
  owner for that effective state
- **AND** it does not create a new grant, make a provider request for that
  terminal tuple, or expose the sibling as an instruction to retry

#### Scenario: Invalid terminal branch does not advertise unreachable repair

- **WHEN** the progressive raw owner reports an integrity branch for which no
  registered runtime operation is legal
- **THEN** the CLI emits the bounded fail-closed `report_internal` maintenance
  diagnostic
- **AND** it does not advertise generic rebuild, retry, force, state editing,
  replacement authorization, or provider work as a recovery
