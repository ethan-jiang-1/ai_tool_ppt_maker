## MODIFIED Requirements

### Requirement: Image2 first-time credential setup is self-contained in BOOTSTRAP

BOOTSTRAP SHALL state that fresh HTML-first create/preview/build/local iteration requires only base HTML readiness and shall not solicit Image2 credentials. After a current HTML delivery, an explicit human choice to enter optional Phase-4 visual-slot refinement SHALL receive bounded credential-presence guidance, offline `doctor --image2`, and the exact-plan authorization explanation; live diagnostics still require disclosed confirmation and do not authorize production. Markerless legacy maintenance retains its separate guidance. BOOTSTRAP SHALL not present modern refinement as a new-deck gate, whole-page renderer, or automatic workflow.

#### Scenario: Fresh user starts an HTML deck
- **WHEN** base doctor is ready and the user creates a new deck
- **THEN** BOOTSTRAP proceeds without Image2 credentials or live probes

#### Scenario: User elects optional refinement
- **WHEN** current HTML delivery leads the user to choose Phase 4
- **THEN** BOOTSTRAP explains its optional authorization boundary before any credential-dependent action
