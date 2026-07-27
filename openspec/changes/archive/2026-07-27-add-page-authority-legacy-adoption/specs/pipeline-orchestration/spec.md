## MODIFIED Requirements

### Requirement: Whole-page routing has one current protocol
Pipeline orchestration SHALL route a Page Authority target only through the exact `page-authority-image2-v1` / `image2-page-authority` contract and shall route a current supported `image2-only` run only through the explicit `whole-page-image2-v1` contract. Before ordinary legacy pipeline dispatch, it SHALL consume the direct legacy protocol observer. A `recognized-legacy` result SHALL stop ordinary whole-page or HTML production before source parsing beyond identity, renderer setup, generated-artifact inspection, credential lookup, transport initialization, or provider work and return `LEGACY_PROTOCOL_ADOPTION_REQUIRED` with the provider-free adoption action. It SHALL not expose a retired maintenance adapter, a source-to-HTML migration command, or a legacy-to-Page-Authority conversion.

#### Scenario: Current Page Authority operation is requested
- **WHEN** an exact Page Authority run invokes a pipeline operation
- **THEN** orchestration resolves its explicit mode and source marker
- **AND** it rejects an unavailable or inconsistent state before work begins

#### Scenario: Recognized whole-page legacy operation is requested
- **WHEN** a recognized legacy `image2-only` run invokes an ordinary pipeline operation
- **THEN** orchestration returns the typed adoption-required result before provider or generated-path work
- **AND** it does not reuse a whole-page image as Page Authority raw evidence
