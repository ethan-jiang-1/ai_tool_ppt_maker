## ADDED Requirements

### Requirement: Initialization and validation seed one complete Page Image presentation package

Initialization SHALL seed the four canonical Page Image presentation source
documents at the current Run Bundle layout locations with one complete,
cross-file-valid default package. Current layout validation SHALL evaluate the
package as a unit before a dependent Page Image owner plans raw work and SHALL
return the source/configuration repair action for an absent, malformed, or
cross-file-inconsistent document. It SHALL not synthesize a missing document,
fall back to a generated projection, inspect an existing production bundle, or
convert a retired `FRAME PRESET` source.

Seeding or validating the package SHALL not create a page receipt, resolved
per-page file, raw plan, provider work, authorization, review decision, or
other lifecycle evidence. `new-version` continues to copy only canonical source
and overrides into a clean successor with fresh workflow evidence.

#### Scenario: Init creates a presentation-ready draft

- **WHEN** `init` creates a new Run Bundle
- **THEN** it seeds the complete valid Page Image presentation package beside
  the current narrative sources and workflow draft
- **AND** it does not create page-level derived data or provider/review records

#### Scenario: A malformed package stops before raw work

- **WHEN** a current source selects a workflow but its presentation package is
  missing or cross-file-inconsistent
- **THEN** validation reports the bounded source/configuration repair action
  before receipt-dependent raw planning or provider work
- **AND** it does not write a default, a migration, or a new lifecycle record
