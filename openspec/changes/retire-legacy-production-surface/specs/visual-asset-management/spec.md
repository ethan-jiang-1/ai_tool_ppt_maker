## ADDED Requirements

### Requirement: Current reference registry is Page Authority-confined
Current asset/reference resolution SHALL use the Page Authority registry, byte fingerprints, role
restrictions, and confined paths. An HTML catalog SHALL NOT become a current identity or provider
authority.

#### Scenario: A reference profile is compiled
- **WHEN** Page Authority builds a raw profile
- **THEN** it includes only registered Page Authority reference roles and fingerprints

