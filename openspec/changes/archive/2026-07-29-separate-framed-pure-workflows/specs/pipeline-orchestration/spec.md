## ADDED Requirements

### Requirement: TARGET Page Authority orchestration is an exclusive workflow trajectory

For a valid `page-authority-image2-v2` source/state pair, orchestration SHALL
resolve the version workflow once and execute exactly one of
`03-framed-image` or `04-pure-image`, followed by shared `05-delivery` and
workflow-aware `06-iteration`. It SHALL NOT expose per-slide authority dispatch
or route Framed work through the Pure workflow, or vice versa.

CURRENT `page-authority-image2-v1` mixed lifecycle remains an explicit bounded
compatibility route. A missing, mismatched, or hybrid target pair SHALL fail at
marker-first resolution with the owning repair action before derived work.

#### Scenario: Target Framed route skips Pure ownership

- **WHEN** marker-first resolution recognizes a target receipt with workflow `framed`
- **THEN** orchestration enters `03-framed-image`, then the common delivery interface and `06-iteration`
- **AND** it does not invoke `04-pure-image` or ask for a per-slide authority choice

#### Scenario: Target pair mismatch stops before lifecycle selection

- **WHEN** a v2 source is paired with a non-v2 state mode
- **THEN** orchestration returns the marker/state repair route as a hard-stop
- **AND** it does not fall back to the CURRENT mixed lifecycle

### Requirement: TARGET refresh follows version workflow ownership

TARGET refresh routing SHALL use the bound version workflow and direct artifact
freshness facts. A Framed text-only edit with exact accepted raw evidence and
current frame preset SHALL use provider-free local composition; a Framed
preset/underlay change and every Pure display/visual change SHALL invalidate raw
work and require the existing authorization/review path; notes-only work SHALL
use shared delivery; and a structural or workflow change SHALL use the exact
preview/hash-bound Structural Versioning Path.

#### Scenario: Target workflow switch is structural

- **WHEN** a user changes a target version from `framed` to `pure` or from `pure` to `framed`
- **THEN** orchestration requires a structural vNext preview and exact plan confirmation
- **AND** it does not mutate the active version workflow or inherit final/delivery acceptance
