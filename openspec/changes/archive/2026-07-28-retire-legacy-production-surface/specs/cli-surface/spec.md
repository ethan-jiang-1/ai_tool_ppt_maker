## ADDED Requirements

### Requirement: Public CLI exposes only Page Authority production operations
The public CLI SHALL expose Page Authority source validation, raw planning/authorization/generation,
raw review, final delivery, local Framed refresh, notes refresh, structural versioning, and bounded
legacy observation/adoption controls. It SHALL NOT expose HTML-first, whole-page, Header-Lock, or
visual-slot production commands, flags, or approval gates.

#### Scenario: Help has no retired production choice
- **WHEN** a user requests public CLI help
- **THEN** every production operation is Page Authority-owned or a bounded legacy adoption/repair operation
- **AND** no retired production route or Header-Lock approval choice is listed

### Requirement: Historical production requests stop at the adoption boundary
A recognized historical run reaching a current production command SHALL emit the producer-owned
`LEGACY_PROTOCOL_ADOPTION_REQUIRED` diagnostic before provider initialization, generated-artifact
reads, review publication, or state mutation.

#### Scenario: Legacy build is fenced
- **WHEN** a recognized legacy run requests build, refresh, review, or raw generation
- **THEN** the CLI returns only the provider-free adoption next action


## REMOVED Requirements

### Requirement: Public CLI exposes one production-mode surface
**Reason**: The legacy contract is replaced by the current owner `ppt_flow`.
**Migration**: Use the current contract owned by `ppt_flow`.

### Requirement: Doctor exposes production-scoped readiness without hidden live work
**Reason**: The legacy contract is replaced by the current owner `ppt_flow` + `00-setup`.
**Migration**: Use the current contract owned by `ppt_flow` + `00-setup`.

### Requirement: Public production commands route from canonical mode policy
**Reason**: The legacy contract is replaced by the current owner `ppt_flow`.
**Migration**: Use the current contract owned by `ppt_flow`.

### Requirement: CLI surface preserves command names
**Reason**: The legacy contract is replaced by the current owner `ppt_flow`.
**Migration**: Use the current contract owned by `ppt_flow`.

### Requirement: ppt_flow delegates to capability scripts
**Reason**: The legacy contract is replaced by the current owner `ppt_flow`.
**Migration**: Use the current contract owned by `ppt_flow`.

### Requirement: CLI hard failures emit a JSON envelope on stderr
**Reason**: The legacy contract is replaced by the current owner diagnostics.
**Migration**: Use the current contract owned by diagnostics.

### Requirement: The complete ppt_flow command surface has return-audit coverage
**Reason**: The legacy contract is replaced by the current owner CLI inventory.
**Migration**: Use the current contract owned by CLI inventory.

### Requirement: Pilot uses preview readiness and does not waive gates
**Reason**: The legacy contract is replaced by the current owner Page Authority pilot.
**Migration**: Use the current contract owned by Page Authority pilot.

### Requirement: Pilot accepts --force-images and skips by default
**Reason**: The legacy contract is replaced by the current owner Page Authority authorization.
**Migration**: Use the current contract owned by Page Authority authorization.

### Requirement: state prints a where-am-I resume card
**Reason**: The legacy contract is replaced by the current owner state + inspection.
**Migration**: Use the current contract owned by state + inspection.

### Requirement: status surfaces playbook position and lesson count
**Reason**: The legacy contract is replaced by the current owner state + inspection.
**Migration**: Use the current contract owned by state + inspection.

### Requirement: approve dual-writes metadata and _state gates
**Reason**: The legacy contract is replaced by the current owner state + review.
**Migration**: Use the current contract owned by state + review.

### Requirement: Title refresh routes by the affected slides' resolved modes
**Reason**: The legacy contract is replaced by the current owner Page Authority refresh.
**Migration**: Use the current contract owned by Page Authority refresh.

### Requirement: Existing approve command records header review evidence
**Reason**: The legacy production contract is retired; no current production route retains it.
**Migration**: Use the Page Authority lifecycle for new work; use the read-only observer/adoption boundary for recognized historical runs.

### Requirement: Build preserves reviewed full-page images
**Reason**: The legacy contract is replaced by the current owner Page Authority assembly.
**Migration**: Use the current contract owned by Page Authority assembly.

### Requirement: Active documented CLI examples use real flags
**Reason**: The legacy contract is replaced by the current owner CLI docs.
**Migration**: Use the current contract owned by CLI docs.

### Requirement: doctor forwards explicit Image2 readiness mode
**Reason**: The legacy contract is replaced by the current owner `ppt_flow` + `00-setup`.
**Migration**: Use the current contract owned by `ppt_flow` + `00-setup`.

### Requirement: HTML renderer and compositor CLIs are registered envelope-compliant executables
**Reason**: The legacy contract is replaced by the current owner CLI inventory.
**Migration**: Use the current contract owned by CLI inventory.

### Requirement: Public HTML build and refresh commands route without provider flags
**Reason**: The legacy production contract is retired; no current production route retains it.
**Migration**: Use the Page Authority lifecycle for new work; use the read-only observer/adoption boundary for recognized historical runs.

### Requirement: HTML content and visual approval are exact-evidence-hash bound
**Reason**: The legacy production contract is retired; no current production route retains it.
**Migration**: Use the Page Authority lifecycle for new work; use the read-only observer/adoption boundary for recognized historical runs.

### Requirement: HTML and workflow transition diagnostics remain producer-owned
**Reason**: The legacy contract is replaced by the current owner diagnostics + state.
**Migration**: Use the current contract owned by diagnostics + state.

### Requirement: CLI continuation controls are registered and auditable
**Reason**: The legacy contract is replaced by the current owner CLI inventory.
**Migration**: Use the current contract owned by CLI inventory.

### Requirement: CLI exposes a closed versioned production-transition protocol
**Reason**: The legacy contract is replaced by the current owner adoption transaction.
**Migration**: Use the current contract owned by adoption transaction.

### Requirement: Status and state JSON publish one shared workflow inspection
**Reason**: The legacy contract is replaced by the current owner CLI + inspection.
**Migration**: Use the current contract owned by CLI + inspection.
