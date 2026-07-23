## ADDED Requirements

### Requirement: Image Production keeps public adapters separate from private transports
`ppt_flow`, orchestration, and compatibility routing SHALL enter visual-slot and whole-page production
only through the corresponding public Image Production adapter. The visual-slot adapter MAY lazily load
its private authorized transport only after current plan/authorization/attempt validation; the whole-page
adapter MAY lazily load its private provider client only at its existing submit boundary. No caller,
including HTML Phase 3, Phase-5 compatibility routing, status, or state observation, SHALL import a
private transport/client merely to select an adapter, inspect status, or reuse local artifacts.

#### Scenario: Status observes visual-slot work
- **WHEN** `ppt_flow status` or workflow inspection projects visual-slot state
- **THEN** it uses the state-owned projection without initializing a visual-slot transport or provider client
- **AND** it preserves the existing secret-safe status behavior

### Requirement: Whole-page generation retains authority after relocation
Whole-page generation SHALL retain its current provider authorization, raw-render provenance, and byte/fingerprint behavior after moving under Image Production.

#### Scenario: Whole-page rebuild remains authorized
- **WHEN** an `image2-only` rebuild reaches provider submit
- **THEN** existing scope-bound authorization remains required
