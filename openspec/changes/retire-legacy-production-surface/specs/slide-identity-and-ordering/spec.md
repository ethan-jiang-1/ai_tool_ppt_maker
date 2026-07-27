## ADDED Requirements

### Requirement: Structural identity remains independent of retired output modes
Structural previews and applications SHALL preserve stable slide identity while calculating Page
Authority raw-materialization and Framed-local-finalization impact. They SHALL NOT use legacy
whole-page, Header-Lock, or HTML final-output assumptions.

#### Scenario: A structural Page Authority version is previewed
- **WHEN** slides are reordered or their authority changes
- **THEN** the preview reports stable-ID Page Authority impact without selecting a legacy output owner

