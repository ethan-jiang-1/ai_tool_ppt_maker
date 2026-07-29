## REMOVED Requirements

### Requirement: Historical production requests stop at the adoption boundary
**Reason**: The historical adoption diagnostic and public route retain a second executable protocol graph.
**Migration**: Normal CLI returns the generic unsupported-protocol diagnostic. A named bundle conversion, if ever authorized, is a separately planned deck operation and is not a CLI capability of this framework change.

## MODIFIED Requirements

### Requirement: Public CLI exposes only Page Authority production operations
The public CLI SHALL expose v2 Page Authority source validation, raw planning, authorization, generation, review, final delivery, Framed local refresh, notes refresh, and structural versioning. It SHALL NOT expose another-protocol observation, adoption, migration, production commands, flags, or approval gates.

#### Scenario: Help has no other-protocol choice
- **WHEN** a user requests public CLI help
- **THEN** every production operation is v2 Page Authority-owned
- **AND** no historical, adoption, compatibility, or migration route is listed

## ADDED Requirements

### Requirement: Non-v2 CLI requests fail before execution
When a command receives a non-v2 source/state pair, the CLI producer SHALL emit the one bounded unsupported-protocol diagnostic before provider initialization, generated-artifact reads, review publication, or state mutation.

#### Scenario: Non-v2 build is fenced
- **WHEN** a non-v2 run requests build, refresh, review, or raw generation
- **THEN** the CLI returns only the unsupported-protocol next action
- **AND** it does not invoke a decoder, migration operation, or provider
