## ADDED Requirements

### Requirement: Phase 4 becomes a bounded modern refinement owner

`04-image2-refinement/` SHALL expose one import-safe public interface, own its direct adapters and private provider transport, and have mirrored unit/E2E test owners. It SHALL not be imported by shared modules, Phase 3 ordinary HTML delivery, or Phase 5 legacy implementation.

#### Scenario: Architecture scans Phase 4
- **WHEN** a Phase-4 module imports legacy private generation or a Phase-3 build imports Phase-4 transport
- **THEN** architecture validation rejects the crossover
