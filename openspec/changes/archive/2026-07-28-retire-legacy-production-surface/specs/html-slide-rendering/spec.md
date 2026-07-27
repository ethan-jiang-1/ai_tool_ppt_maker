## ADDED Requirements

### Requirement: HTML deck rendering remains retired
The retired HTML deck-rendering route SHALL NOT publish current deck pages, final-slide artifacts, or
a production adapter. The retained Framed runtime is private Page Authority implementation detail.

#### Scenario: Current finalization is selected
- **WHEN** a current slide is finalized
- **THEN** Page Authority owns the final artifact and no HTML deck-rendering route is selected

## REMOVED Requirements

### Requirement: Valid structured slides produce inert self-contained HTML pages
**Reason**: HTML deck pages are not a current production artifact.
**Migration**: Use Page Authority raw/final artifacts.

### Requirement: Ten family components obey the resolved geometry and token contract
**Reason**: HTML family rendering is retired.
**Migration**: Use Page Authority Framed composition where local text is owned.

### Requirement: Data charts use a closed deterministic ECharts SVG adapter
**Reason**: The HTML deck chart-output route is retired.
**Migration**: Use current Page Authority production assets.

### Requirement: Browser composition uses the pinned runtime and zero-network policy
**Reason**: Deck-output composition is retired; the runtime guarantee moves behind Framed composition.
**Migration**: Use the internal Page Authority Framed runtime.

### Requirement: Browser measurement proves fonts, bounds, and overflow before capture
**Reason**: HTML deck measurement is retired.
**Migration**: Use Page Authority Framed preflight/runtime evidence.

### Requirement: Final-slide screenshot profile and evidence are versioned
**Reason**: HTML screenshot delivery is retired.
**Migration**: Use Page Authority final-slide evidence.

### Requirement: Composition fingerprints are slide-local and delivery digest is ordered
**Reason**: HTML composition fingerprints are retired.
**Migration**: Use Page Authority raw/final/delivery digests.

### Requirement: HTML and final-slide publication is atomic and drift-safe
**Reason**: HTML publication owners are retired.
**Migration**: Use the Page Authority final manifest owner.

### Requirement: HTML rendering has an explicit language and locale boundary
**Reason**: HTML deck rendering is retired.
**Migration**: Retained Framed runtime uses its fixed internal locale profile.
