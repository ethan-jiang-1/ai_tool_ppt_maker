## ADDED Requirements

### Requirement: Runtime supports only private Framed composition primitives
The HTML render runtime SHALL provide Page Authority only fixed viewport, bundled-font readiness, denied
network, opaque-frame capture, bounds verification, PNG validation, and cleanup. It SHALL not parse
Page Authority source, choose finalization, expose HTML production state, or inspect legacy delivery
artifacts for fallback.

#### Scenario: Runtime failure remains a local repair
- **WHEN** font, browser, bounds, or network-denial validation fails
- **THEN** composition returns the runtime repair diagnostic without provider work or final publication
- **AND** it does not read a legacy HTML artifact

