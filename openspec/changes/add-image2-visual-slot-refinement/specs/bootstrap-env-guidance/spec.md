## ADDED Requirements

### Requirement: Image2 onboarding follows explicit refinement intent

BOOTSTRAP SHALL keep base HTML readiness self-contained and request Image2 credentials or optional diagnostics only after the user selects authorized modern refinement or legacy maintenance. It SHALL not make provider setup a fresh-deck prerequisite.

#### Scenario: Fresh user creates a deck
- **WHEN** the user has not selected refinement
- **THEN** BOOTSTRAP does not request Image2 credentials
