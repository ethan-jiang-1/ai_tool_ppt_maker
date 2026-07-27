## ADDED Requirements

### Requirement: Current source parsing is Page Authority-only
Current production source parsing SHALL accept only the Page Authority source grammar and shall bind
each slide to its resolved Pure or Framed authority. Historical source parsing SHALL be confined to
the read-only legacy observer and SHALL NOT publish a current plan or adapter.

#### Scenario: Legacy source cannot produce a current plan
- **WHEN** a source carries a recognized retired pipeline marker
- **THEN** normal production parsing returns the adoption boundary before producing a plan, prompt, or generated owner

