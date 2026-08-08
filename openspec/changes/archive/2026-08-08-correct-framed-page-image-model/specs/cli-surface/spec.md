## ADDED Requirements

### Requirement: Run-scoped CLI accepts only current Page Image Workflow identity

Every run-scoped CLI operation SHALL first verify the exact local Harness
binding through the existing locator evaluator, then require the exact
`page-image-workflow-v1` source and `image2-page-workflow-v1` state pair. A
missing/invalid binding remains an unsupported-binding hard-stop. After a valid
binding, a v2 Page Authority marker, receipt, plan, review, manifest, or
delivery record SHALL be an `unsupported-protocol/export` hard-stop before
state repair or mutation, provider initialization, generated-artifact reads, review
publication, or production work. The CLI SHALL preserve supplied v2 bytes and
shall not decode, convert, adopt, or expose a compatibility command.

`bundle_layout --check --structure-only` remains a non-authoritative structure
inspection. It may report a physical tree but SHALL not select a current run,
read production state, establish a binding, or perform an execution action.

#### Scenario: A v2 production request is fenced before work

- **WHEN** a v2 run requests validation, planning, generation, review,
  refresh, delivery, or a stateful operation
- **THEN** the CLI returns only the bounded `unsupported-protocol/export` next
  action
- **AND** it does not initialize a provider, read legacy evidence, or mutate
  source/state/generated artifacts

### Requirement: Public CLI exposes only replacement Page Image Workflow operations

The registered `style-master` and `image2` command families SHALL operate only
on one exact current replacement-protocol version/workflow scope. They retain
provider-free planning/inspection, explicit authorization, bounded generation
and progress, review, acceptance, reconciliation, final delivery, notes
refresh, and previewed structural versioning as owner-controlled operations.
They SHALL not accept arbitrary prompt, provider, profile, path, scope, or
policy overrides; `--force`, retry, direct provider request, legacy mode,
adoption, migration, and compatibility flags remain unavailable.

The current `image2` family SHALL use these fixed forms:

```text
ppt_flow image2 plan <run-dir>
ppt_flow image2 pilot <run-dir> --plan-hash <sha256> --slide-id <formal-id> [--slide-id <formal-id>...]
ppt_flow image2 expansion <run-dir> --plan-hash <sha256>
ppt_flow image2 authorize <run-dir> --plan-hash <sha256> --batch-hash <sha256>
ppt_flow image2 generate <run-dir> --plan-hash <sha256> --batch-hash <sha256>
ppt_flow image2 pilot-review <run-dir> --plan-hash <sha256> --batch-hash <sha256>
ppt_flow image2 pilot-accept <run-dir> --plan-hash <sha256> --batch-hash <sha256> --decision proceed|repair|redirect
ppt_flow image2 review <run-dir> --plan-hash <sha256>
ppt_flow image2 accept <run-dir> --plan-hash <sha256> --decision proceed|repair
ppt_flow image2 reconcile <run-dir> --plan-hash <sha256> --attempt-sha256 <sha256>
```

`pilot` is provider-free and creates only an exact selected batch plan; it does
not submit a sample, create a grant, or create accepted page evidence. Pilot
provider work begins only after `authorize` validates that exact plan/batch and
records the separate explicit cost authorization, followed by `generate`.
`pilot-review` and `pilot-accept` apply only to a terminal partial Pilot;
`review` and `accept` apply the one Complete Page Review decision: Framed
output contains the current provider page and production-equivalent header
composite, while Pure output contains its complete provider page. The command
family SHALL not create a second composite approval or treat a Pilot decision
as final acceptance.

#### Scenario: Public help has no legacy or third-workflow route

- **WHEN** a user requests public production help
- **THEN** the help names only current Framed or Pure Page Image Workflow
  operations and their bounded owner actions
- **AND** it lists no v2, `hybrid`, compatibility, migration, or direct prompt
  operation

#### Scenario: Framed complete review has one decision

- **WHEN** a current Framed `image2 review` operation is ready for acceptance
- **THEN** it returns raw provider and production-equivalent composite evidence
  for one `proceed` or `repair` action
- **AND** it does not expose another local-composite approval operation

### Requirement: CLI plan output binds actual compiled provider inputs safely

On successful Page Image `plan`, the CLI SHALL bind the selected adapter's
actual compiled provider-input bytes and digest into the returned plan and
expose a local `provider_request_inspection` reference with only its
run-relative path, inspection digest, and matching plan hash. The inspection
artifact SHALL be sufficient for deliberate local review but SHALL not be a
selector, authorization assertion, source of semantic authority, or substitute
for the bound plan. Normal success output, stderr, and failure diagnostics
SHALL exclude raw prompt prose, credentials, authorization headers,
environment values, image data URLs, and provider response bodies.

For Framed, exact `kicker`, `title`, and `subtitle` literals SHALL be bound as
provider context not to render; a changed literal therefore changes compiled
input and prevents a CLI from taking a provider-free local refresh path unless
the owner proves the full current equality contract.

#### Scenario: Plan output identifies, but does not print, provider input

- **WHEN** `image2 plan` creates a current Framed or Pure plan
- **THEN** its output includes the bounded inspection reference and matching
  plan digest
- **AND** it does not print provider prompt content or permit that reference as
  an authorization override

### Requirement: CLI diagnostics validate the closed Framed header contract

For Framed planning, review, and finalization, the CLI producer SHALL classify
the earliest independent failure among closed source content/header fields,
transparent header preset/profile, protected geometry, current compiled input,
provider page, and bound evidence. A header fit failure belongs to bounded
`source_validation`; missing browser/font capability belongs to `environment`;
a contradiction among checked-in deterministic contracts belongs to `internal`.
No diagnostic SHALL reintroduce a local body/callout renderer, a text-free
underlay rule, a force option, or provider-blaming for a pre-submit failure.

#### Scenario: Framed header overflow is source validation

- **WHEN** current Framed header literals cannot fit their deterministic
  transparent header preset
- **THEN** the CLI emits one `source_validation` hard-stop and a source-repair
  action
- **AND** it does not offer browser internals, local body fallback, or provider
  retry

### Requirement: Current Image2 transport remains single-endpoint and bounded

Current replacement-protocol `style-master generate` and `image2 generate`
operations SHALL use one fixed 600,000 ms total provider-operation deadline,
beginning immediately before submit and covering any same-invocation task poll.
Every network request is bounded by the remaining time. The commands SHALL
resolve exactly one normalized Image2 endpoint through the existing credential
precedence; a comma-containing endpoint is malformed configuration before any
provider request. They SHALL not reset the deadline, fail over, retry, expose
an endpoint list, or create durable task state.

Credential resolution is generate-scoped. It SHALL use the existing scoped,
non-overwriting dotenv order from the selected Deck root and then the process
current working directory, preserve inherited environment precedence, and pass
the one resolved credential/endpoint pair to the original submit and any
same-invocation task poll. Missing or malformed credentials SHALL fail before a
new claimed or submitted attempt, grant consumption, provider request,
materialization, or provenance write; provider-free plan, Pilot/Expansion,
authorization, reconciliation, review, acceptance, and delivery do not load or
write dotenv configuration.

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

### Requirement: New-version CLI success activates a clean current draft

For an exact current Page Image Workflow source with an explicit selected
workflow, `ppt_flow new-version` SHALL report success only after clean
filesystem copy and state-owned target-draft activation both complete. Its
output SHALL identify the target and selected authoring workflow without
revealing prompt/provider/authorization/acceptance data. It SHALL make no
provider request, inherit no source evidence, and return a normal secret-safe
failure envelope if activation cannot complete.

#### Scenario: A completed current source produces a clean draft

- **WHEN** `new-version` copies a completed current Pure or Framed source
- **THEN** stdout identifies a target authoring draft for the same selected
  workflow
- **AND** subsequent validation sees fresh target evidence rather than copied
  raw, review, or delivery facts

### Requirement: CLI observations retain only non-authoritative Page Image projections

`status` and `state --validate-state` SHALL remain zero-write current Page
Image Workflow observations. Ordinary text `state` and `state --json` may
rebuild the current task projection only for the eligible active replacement
Controller route, after read-only inspection. The projection SHALL remain a
collaboration view and shall not authorize provider cost, select a lifecycle
action, prove evidence, or resume work. A v2 route is not eligible to produce
or update it.

#### Scenario: Status does not repair Page Image state

- **WHEN** `status` observes a current repairable workflow fact
- **THEN** it returns the owner-issued action without writing source, state,
  receipt, authorization, or generated artifacts
- **AND** it does not invoke a provider or create a task card

## REMOVED Requirements

### Requirement: Non-v2 CLI requests fail before execution

**Reason**: It defines the non-v2 boundary while treating Page Authority v2 as
the current protocol.

**Migration**: Accept only the replacement Page Image Workflow pair and
hard-stop v2 at identity.

### Requirement: Public CLI exposes only Page Authority production operations

**Reason**: Its CLI inventory and pre-raw scope use the retired v2 lifecycle.

**Migration**: Bind the same bounded command families to current Page Image
Workflow facts.

### Requirement: CLI observation does not mutate authority or invoke providers

**Reason**: Its active task-projection eligibility is Page Authority-specific.

**Migration**: Keep observations non-authoritative under current Page Image
Workflow identity.

### Requirement: Diagnostics remain producer-owned

**Reason**: Its Framed diagnostic cases assume a Text Frame and text-free raw
contract.

**Migration**: Use the closed three-field header contract and compiled-input
facts.

### Requirement: Page Authority image2 exposes exact progressive production operations

**Reason**: It exposes v2 Page Authority raw planning and review semantics.

**Migration**: Retain bounded commands only for the replacement Page Image
Workflow lifecycle.

### Requirement: Page Authority plan output exposes a safe request-inspection reference

**Reason**: It does not bind inspection to actual replacement adapter bytes.

**Migration**: Expose a safe reference to the current compiled provider-input
artifact and digest.

### Requirement: Invalid provider media uses the bounded progressive outcome surface

**Reason**: Its provider-media contract is named and scoped as Page Authority
v2.

**Migration**: Use the same bounded outcome pattern only for current replacement
provider requests.

### Requirement: Page Authority received-response failures use a secret-safe known-failure outcome

**Reason**: It attributes failures to the retired Page Authority provider path.

**Migration**: Keep secret-safe known-failure outcomes under current Page Image
Workflow ownership.

### Requirement: Incomplete Pilot review points to the exact successor gate

**Reason**: Its Pilot evidence belongs to the retired raw-review contract.

**Migration**: Pilot remains preview/cost control under the current page-review
representation.

### Requirement: Page Authority new-version success includes draft activation

**Reason**: It activates a v2 Page Authority target.

**Migration**: Activate a clean current Page Image Workflow draft only.

### Requirement: Current Image2 transport has one explicit bounded deadline contract

**Reason**: It scopes transport behavior to current-v2 operations.

**Migration**: Preserve the bounded transport contract for replacement-protocol
operations.

### Requirement: Current Image2 production uses one configured endpoint

**Reason**: It scopes the endpoint to v2 provider work.

**Migration**: Resolve one endpoint only for current replacement-protocol
operations.
