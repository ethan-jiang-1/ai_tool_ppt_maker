## ADDED Requirements

### Requirement: Whole-page routing has one current protocol
Pipeline orchestration SHALL route an `image2-only` run through the explicit `whole-page-image2-v1` contract. It SHALL not expose a retired maintenance adapter or a source-to-HTML migration command.

#### Scenario: Whole-page operation is requested
- **WHEN** a current whole-page run invokes a pipeline operation
- **THEN** orchestration resolves its explicit mode and source marker
- **AND** it rejects an unavailable or inconsistent state before work begins
