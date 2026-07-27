## ADDED Requirements

### Requirement: Script layout confines Framed runtime to Page Authority
The retained browser capture, font, CSP/network denial, timeout, and cleanup primitives SHALL be
reachable only through the Page Authority Framed compositor seam. They SHALL NOT restore an HTML deck
rendering or delivery entrypoint.

#### Scenario: Framed finalization imports its retained runtime
- **WHEN** a Framed Page Authority final slide is composed
- **THEN** it uses the current private runtime seam without importing an HTML deck contract or renderer

