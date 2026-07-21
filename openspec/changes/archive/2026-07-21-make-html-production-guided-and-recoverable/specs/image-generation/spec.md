## MODIFIED Requirements

### Requirement: CLI can inject the authorized modern visual-slot transport

The registered `ppt_flow image2 generate` and `image2 unknown-submit --decision retain` reconciliation routes SHALL
construct a Phase-4 transport from
the existing Image2 credential authority (`IMAGE2_API_KEY`, `IMAGE2_BASE_URL`, and the supported
`--base-url` override) without duplicating the legacy credential parser or importing private Phase-4
implementation modules from HTML Phase 3. For `generate`, the adapter SHALL call only a persisted
authorized attempt ID plus a current, plan-bound provider-neutral request materialized from the
validated HTML plan. The request SHALL include a request-contract version and fingerprint, stable slide/slot
identity, text-free
visual brief/concept constraints, resolved slot geometry, style/profile contract, and verified reference
asset bytes together with their SHA-256 bindings (or an explicitly supported provider-neutral reference
kind that does not require bytes). The `unknown-submit` reconciliation path SHALL use the persisted provider request identity and
attempt binding rather than reconstructing or persisting prompt/body material. The adapter SHALL emit
the existing secret-safe typed submit/reconcile receipts
without persisting prompt/provider bodies, and preserve unknown-submit handling. Plan creation and
authorization remain provider-free and separate from generation.

The transport SHALL validate authorization/attempt/plan identity as an envelope separate from the
deterministic request-material fingerprint. It SHALL verify in-memory reference bytes against their
bound SHAs before adapting the request to a provider payload.

The supported response contract SHALL be closed: a synchronous submit succeeds only with returned image
bytes; an asynchronous submit succeeds only with a stable task/provider request ID that can drive
poll/result or reconciliation. A timeout, ambiguous acceptance, or async acceptance without that ID
SHALL persist `unknown-submit` and SHALL NOT retry. A relay outside these shapes SHALL fail as an
unsupported provider prerequisite before it is enabled for live use.

#### Scenario: Authorized CLI generation reaches the adapter

- **WHEN** a current authorized attempt is passed to `ppt_flow image2 generate`
- **THEN** the CLI resolves the canonical credentials and injects a transport into the public Phase-4 interface
- **AND** the request contains persisted authorization/attempt IDs and matches the authorized request fingerprint

#### Scenario: Current plan materializes the request

- **WHEN** the current HTML plan contains a valid text-free visual brief, slot geometry, and reference bindings
- **THEN** Phase 4 materializes a deterministic provider-neutral request before provider submission
- **AND** the request fingerprint equals the authorized attempt binding

#### Scenario: Request material changes after authorization

- **WHEN** current source, geometry, style contract, or reference bytes produce a different request fingerprint
- **THEN** generation fails stale before provider submission
- **AND** the user is directed to create a fresh plan and authorization

#### Scenario: Credentials are absent

- **WHEN** generation reaches its remote boundary without resolvable Image2 credentials/base URL
- **THEN** it fails before provider submission with the existing secret-safe prerequisite diagnostic
- **AND** it does not mark the attempt submitted

#### Scenario: Submit outcome is unknown

- **WHEN** the adapter cannot determine whether a chargeable request was accepted
- **THEN** it records `unknown-submit` for reconciliation
- **AND** it does not blindly retry or create a second attempt

#### Scenario: Synchronous submit returns image bytes

- **WHEN** a supported relay returns complete image bytes in the submit response without a task ID
- **THEN** the attempt completes through the synchronous result path
- **AND** reconciliation is not required

#### Scenario: Async acceptance omits a stable ID

- **WHEN** a relay indicates asynchronous acceptance but returns no stable task/provider request ID
- **THEN** the attempt becomes `unknown-submit`
- **AND** the adapter neither polls an invented ID nor resubmits the attempt

#### Scenario: User abandons an unknown submit

- **WHEN** `image2 unknown-submit --decision abandon` resolves an attempt
- **THEN** no provider credential or transport is initialized
- **AND** any replacement still requires a fresh plan and authorization
