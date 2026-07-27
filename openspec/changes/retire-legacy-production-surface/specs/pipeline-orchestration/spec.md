## ADDED Requirements

### Requirement: Orchestration resolves one current Page Authority lifecycle
Current orchestration SHALL execute Page Authority source receipt, raw plan/authorization/generation,
raw review, finalization, projection, assembly, notes, and delivery evidence. It SHALL treat a legacy
pair as adoption/repair-only and SHALL NOT dispatch HTML-first, whole-page, Header-Lock, or visual-slot
stages.

#### Scenario: Normal production is resolved
- **WHEN** a valid current run is selected for a production operation
- **THEN** the resolver returns the Page Authority lifecycle and no alternative adapter

