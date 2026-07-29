## MODIFIED Requirements

### Requirement: Orchestration resolves one current Page Authority lifecycle
Current orchestration SHALL execute only v2 Page Authority source receipt, raw plan/authorization/generation, raw review, selected-workflow finalization, projection, assembly, notes, and delivery evidence. A retired source/state pair SHALL not dispatch a production stage and shall return the owner-issued migration/export hard-stop.

#### Scenario: Normal production is resolved
- **WHEN** a valid v2 run is selected for a production operation
- **THEN** the resolver returns the selected Page Authority lifecycle and no alternative adapter

#### Scenario: Retired input is not a lifecycle
- **WHEN** a retired source/state pair is selected
- **THEN** orchestration returns its bounded migration/export action without provider work
- **AND** it does not create a source receipt or execution state

### Requirement: TARGET Page Authority orchestration is an exclusive workflow trajectory
For a valid `page-authority-image2-v2` source/state pair, orchestration SHALL resolve the version workflow once and execute exactly one of `03-framed-image` or `04-pure-image`, followed by shared `05-delivery` and workflow-aware `06-iteration`. It SHALL NOT expose per-slide authority dispatch or route Framed work through the Pure workflow, or vice versa.

A missing, mismatched, hybrid, or retired pair SHALL fail at marker-first resolution with the owning hard-stop before derived work.

#### Scenario: Target Framed route skips Pure ownership
- **WHEN** marker-first resolution recognizes a target receipt with workflow `framed`
- **THEN** orchestration enters `03-framed-image`, then the common delivery interface and `06-iteration`
- **AND** it does not invoke `04-pure-image` or ask for a per-slide authority choice

#### Scenario: Non-v2 pair stops before lifecycle selection
- **WHEN** a source/state pair is not an exact v2 pair
- **THEN** orchestration returns the identity or migration/export hard-stop
- **AND** it does not fall back to another lifecycle
