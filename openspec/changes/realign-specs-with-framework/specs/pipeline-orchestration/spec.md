## ADDED Requirements

### Requirement: Whole-page routing has one current protocol
Pipeline orchestration SHALL route an `image2-only` run through the explicit `whole-page-image2-v1` contract. It SHALL not expose a retired maintenance adapter or a source-to-HTML migration command.

#### Scenario: Whole-page operation is requested
- **WHEN** a current whole-page run invokes a pipeline operation
- **THEN** orchestration resolves its explicit mode and source marker
- **AND** it rejects an unavailable or inconsistent state before work begins

## REMOVED Requirements

### Requirement: Migration preparation resolves one isolated candidate before comparison
**Reason**: The historical HTML-migration candidate and comparison route are removed.

**Migration**: The state-owned production-mode transition owns its current candidate, preview, confirmation, and apply sequence.

### Requirement: Legacy-to-HTML migration comparison is complete and zero-remote
**Reason**: Old-side migration comparison modes and compatibility evidence are not part of the supported framework.

**Migration**: A current transition remains offline through preview/apply and hands the target to its normal production/review path.
