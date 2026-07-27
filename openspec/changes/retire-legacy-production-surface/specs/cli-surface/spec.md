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

