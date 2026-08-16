# CLI Surface Specification (delta)

## MODIFIED Requirements

### Requirement: Current Image2 transport remains single-endpoint and bounded

Current declared-workflow `style-master generate` and `image2 generate`
operations SHALL use one fixed 600,000 ms total provider-operation deadline,
beginning immediately before submit and covering any same-invocation task poll.
Every network request is bounded by the remaining time. The commands SHALL
resolve exactly one normalized Image2 endpoint through the existing credential
precedence; a comma-containing endpoint is malformed configuration before any
provider request. They SHALL not reset the deadline, fail over, retry, expose
an endpoint list, or create durable task state.

Credential resolution is generate-scoped. It SHALL use the shared restricted
startup environment (`shared/image2/startup_env.mjs`) in the fixed precedence
of explicit process environment, then the selected Deck `.env` filling only
missing declared keys, then the process current working directory `.env`
filling only keys still missing; it SHALL read only the declared runtime keys
(`IMAGE2_API_KEY`, `IMAGE2_BASE_URL`, `IMAGE2_PROVIDER_PROFILE_ID`), SHALL NOT
overwrite explicit environment values, and SHALL NOT output values or
secrets. The one resolved credential/endpoint pair SHALL be passed to the
original submit and any same-invocation task poll. Missing or malformed
credentials SHALL fail before a new claimed or submitted attempt, grant
consumption, provider request, materialization, or provenance write;
provider-free plan, Pilot/Expansion, reconciliation, review, acceptance, and
delivery do not load or write dotenv configuration. `image2 authorize` SHALL
resolve only the same restricted non-secret startup environment for the
exact-run profile-identity check and SHALL NOT resolve credentials, mutate
dotenv files, claim an attempt, or initialize a provider as part of that
resolution.

The selected lifecycle SHALL accept provider media only after validating an
exact CRC-valid PNG with positive native dimensions, retaining its exact bytes
and actual dimensions without resize, crop, or transcode. Invalid media, a
fully received unusable response, or a terminal async failure SHALL terminalize
the exact submitted item through the owner-issued secret-safe known-failure (or
Style Master failed) outcome. A lost/unreadable response or expired deadline
remains uncertain and returns only the exact reconciliation or abandonment
action. A provider task identifier may be polled only within this invocation
and deadline using the same resolved pair; it cannot create a durable task
record, second submission, grant, or public recovery route. Neither output
leaks timeout internals, task identifiers, provider body, prompt, credentials,
raw media, or a new alternate route.

#### Scenario: A deadline does not cause an implicit retry

- **WHEN** an authorized current Page Image or Style Master submission reaches
  its total deadline before a terminal outcome
- **THEN** the CLI returns the lifecycle owner's uncertainty diagnostic and
  exact recovery action
- **AND** it does not submit another request or offer failover/force/retry

#### Scenario: Invalid media and definite responses terminalize safely

- **WHEN** an authorized current provider result is malformed media or a fully
  received unusable response
- **THEN** the owner records only its bounded terminal failure outcome before
  accepted media/provenance publication
- **AND** it does not expose provider content, reopen the old grant, or offer a
  direct retry

#### Scenario: Missing credentials do not claim an item

- **WHEN** a current `generate` operation cannot resolve its one credential and
  endpoint pair
- **THEN** it returns the existing secret-safe environment action before any
  provider request or claimed/submitted attempt
- **AND** provider-free lifecycle operations remain credential-free

#### Scenario: Async completion stays within one attempt

- **WHEN** an authorized submit returns a provider task identifier and a
  same-invocation poll returns valid media
- **THEN** the original submitted attempt receives the verified media result
- **AND** the CLI creates no durable task state, second authorization, or
  second provider submission

#### Scenario: Authorize resolves the restricted startup profile only

- **WHEN** `image2 authorize` validates the exact-run profile identity while
  the deck `.env` supplies `IMAGE2_PROVIDER_PROFILE_ID` and the shell does not
- **THEN** it resolves that non-secret identity through the shared restricted
  startup environment and continues to its existing grant preconditions
- **AND** it does not resolve credentials, write dotenv files, claim an
  attempt, or initialize a provider during that resolution
