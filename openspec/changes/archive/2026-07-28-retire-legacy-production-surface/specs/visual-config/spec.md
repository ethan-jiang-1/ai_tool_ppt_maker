## ADDED Requirements

### Requirement: Visual configuration owns current Page Authority tokens
Visual configuration SHALL retain the tokens and frame data consumed by Page Authority. It SHALL NOT
retain HTML family, Header-Lock, or whole-page-only production semantics.

#### Scenario: A Framed page is finalized
- **WHEN** a current Framed Page Authority slide is composed
- **THEN** its frame inputs come from current Page Authority-owned visual configuration


## REMOVED Requirements

### Requirement: Visual config is shared between Stage 1 and Stage 3
**Reason**: The legacy contract is replaced by the current owner Page Authority + compositor.
**Migration**: Use the current contract owned by Page Authority + compositor.

### Requirement: Visual configuration exposes renderer-neutral HTML contract tokens
**Reason**: The legacy contract is replaced by the current owner Framed compositor.
**Migration**: Use the current contract owned by Framed compositor.

### Requirement: HTML token changes have explicit contract version evidence
**Reason**: The legacy contract is replaced by the current owner Framed compositor.
**Migration**: Use the current contract owned by Framed compositor.

### Requirement: Callout geometry is versioned and complete
**Reason**: The legacy contract is replaced by the current owner Framed compositor.
**Migration**: Use the current contract owned by Framed compositor.
