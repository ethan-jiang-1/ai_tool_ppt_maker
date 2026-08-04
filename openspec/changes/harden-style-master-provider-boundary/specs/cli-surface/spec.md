## ADDED Requirements

### Requirement: Current Image2 transport has one explicit bounded deadline contract

The registered current-v2 `style-master generate` and `image2 generate` operations SHALL use one fixed
600,000 ms total provider-operation deadline for every provider submission. The budget SHALL start immediately
before the submit POST and cover that POST plus every same-invocation task poll; each network request SHALL be
bounded by only the remaining budget. The operations SHALL NOT reset the budget for a poll or inherit an
undocumented runtime fetch deadline. The deadline behavior SHALL preserve each lifecycle owner's existing
authorization, request identity, idempotency, and terminal-outcome contract; it SHALL not add a retry flag,
force option, provider failover route, or new direct reconciliation command.

When a provider response definitively establishes a rejection or unusable result, the command SHALL use the
existing owner-issued known-failure outcome. When a request may have reached the provider but no terminal result
can be established before the deadline or after a transport interruption, the command SHALL use the existing
owner-issued uncertainty hard-stop and exact recovery action. Diagnostics SHALL remain secret-safe and SHALL
not expose timeout internals, provider body text, prompt content, credentials, or endpoint lists.

#### Scenario: Total submit deadline does not create an implicit retry

- **WHEN** a current authorized Style Master or Page Authority submission reaches its 600,000 ms total deadline
  before a response establishes its outcome
- **THEN** the CLI emits the lifecycle owner's existing uncertainty diagnostic and nearest exact recovery action
- **AND** it does not rely on a runtime default, submit another request, or offer retry, force, or alternate provider routing

#### Scenario: Received provider failure remains bounded

- **WHEN** a current authorized Style Master or Page Authority operation receives a provider response that
  definitively rejects or cannot satisfy the owner media contract
- **THEN** the CLI emits the existing known-failure outcome with only the owner-approved bounded facts
- **AND** it does not expose a provider body, request prompt, credential, raw media, or timeout implementation detail

#### Scenario: Task polling uses the remaining total budget

- **WHEN** a provider submit response selects an async task result path after consuming part of the total deadline
- **THEN** the CLI polls only within the remaining portion of that same 600,000 ms budget and delegates the
  terminal result to the owning lifecycle
- **AND** it does not create a durable task state, second authorization, or new public recovery command

### Requirement: Current Image2 production uses one configured endpoint

Current-v2 `style-master generate` and `image2 generate` SHALL resolve exactly one normalized Image2 endpoint
through their existing credential-precedence contract. A selected endpoint value containing a comma SHALL be
treated as malformed configuration and fail before a provider request. The operations SHALL not split the value,
try another endpoint, or expose an endpoint list in diagnostics.

#### Scenario: Comma-list endpoint fails closed before provider work

- **WHEN** a current Style Master or Page Authority generate operation resolves an `IMAGE2_BASE_URL` value that
  contains a comma
- **THEN** it returns the existing bounded malformed-configuration diagnostic before a provider request
- **AND** it does not issue a request to any portion of the value or offer failover, retry, or an alternate route
