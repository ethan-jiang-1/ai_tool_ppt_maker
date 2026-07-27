## ADDED Requirements

### Requirement: Script layout confines Framed runtime to Page Authority
The retained browser capture, font, CSP/network denial, timeout, and cleanup primitives SHALL be
reachable only through the Page Authority Framed compositor seam. They SHALL NOT restore an HTML deck
rendering or delivery entrypoint.

#### Scenario: Framed finalization imports its retained runtime
- **WHEN** a Framed Page Authority final slide is composed
- **THEN** it uses the current private runtime seam without importing an HTML deck contract or renderer


## REMOVED Requirements

### Requirement: Script root exposes exact lifecycle ownership
**Reason**: The legacy contract is replaced by the current owner script layout.
**Migration**: Use the current contract owned by script layout.

### Requirement: Active Phases expose deep module interfaces
**Reason**: The legacy contract is replaced by the current owner script layout.
**Migration**: Use the current contract owned by script layout.

### Requirement: Module imports follow the allowed direction
**Reason**: The legacy contract is replaced by the current owner script layout.
**Migration**: Use the current contract owned by script layout.

### Requirement: Direct executables have path-qualified ownership
**Reason**: The legacy contract is replaced by the current owner executable inventory.
**Migration**: Use the current contract owned by executable inventory.

### Requirement: Unit and E2E trees mirror source ownership
**Reason**: The legacy contract is replaced by the current owner test ownership.
**Migration**: Use the current contract owned by test ownership.

### Requirement: Source-to-test ownership is machine-readable
**Reason**: The legacy contract is replaced by the current owner test ownership.
**Migration**: Use the current contract owned by test ownership.

### Requirement: Current Image2 adapters have literal ownership
**Reason**: The legacy contract is replaced by the current owner script layout.
**Migration**: Use the current contract owned by script layout.

### Requirement: Current directory layout preserves observable behavior
**Reason**: The legacy contract is replaced by the current owner script layout.
**Migration**: Use the current contract owned by script layout.

### Requirement: Architecture validation is part of repository verification
**Reason**: The legacy contract is replaced by the current owner script layout + tests.
**Migration**: Use the current contract owned by script layout + tests.
