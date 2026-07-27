## ADDED Requirements

### Requirement: Visual configuration owns current Page Authority tokens
Visual configuration SHALL retain the tokens and frame data consumed by Page Authority, while removing
HTML family, Header-Lock, and whole-page-only production semantics.

#### Scenario: A Framed page is finalized
- **WHEN** a current Framed Page Authority slide is composed
- **THEN** its frame inputs come from current Page Authority-owned visual configuration

