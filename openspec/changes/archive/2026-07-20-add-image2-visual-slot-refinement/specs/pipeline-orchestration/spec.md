## ADDED Requirements

### Requirement: Refinement recomposes through public local HTML operations

Refinement SHALL call a public Phase-3 review-only composition operation to create candidate comparisons in resolved slot geometry; only after successful accept or explicit fallback decision may it call public local recomposition/evidence operations for affected slides. Promotion SHALL not claim a current delivery until ordinary final-review evidence is renewed. Normal Stage orchestration SHALL remain provider-free and shall not discover or execute pending refinement attempts.

#### Scenario: Accepted candidate is promoted
- **WHEN** acceptance commits a current source asset
- **THEN** final-slide delivery is locally recomposed without a provider call
