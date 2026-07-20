## ADDED Requirements

### Requirement: CLI can inject the authorized modern visual-slot transport

The registered `ppt_flow image2 generate|reconcile` routes SHALL construct a Phase-4 transport from
the existing Image2 credential authority (`IMAGE2_API_KEY`, `IMAGE2_BASE_URL`, and the supported
`--base-url` override) without duplicating the legacy credential parser or importing private Phase-4
implementation modules from HTML Phase 3. The adapter SHALL call only persisted authorized attempt
IDs, emit the existing secret-safe typed submit/reconcile receipts, and preserve unknown-submit
handling. Plan creation and authorization remain provider-free and separate from generation.

#### Scenario: Authorized CLI generation reaches the adapter

- **WHEN** a current authorized attempt is passed to `ppt_flow image2 generate`
- **THEN** the CLI resolves the canonical credentials and injects a transport into the public Phase-4 interface
- **AND** the request contains the persisted authorization and attempt IDs

#### Scenario: Credentials are absent

- **WHEN** generation reaches its remote boundary without resolvable Image2 credentials/base URL
- **THEN** it fails before provider submission with the existing secret-safe prerequisite diagnostic
- **AND** it does not mark the attempt submitted

#### Scenario: Submit outcome is unknown

- **WHEN** the adapter cannot determine whether a chargeable request was accepted
- **THEN** it records `unknown-submit` for reconciliation
- **AND** it does not blindly retry or create a second attempt
