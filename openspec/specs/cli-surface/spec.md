# CLI Surface Specification

## Purpose

Define every registered direct Node CLI and the fixed 12-command unified entry
point. The CLI producer owns its JSON diagnostics, current Page Image Workflow routing,
and bounded v2 hard-stop responses; Controller consumers do not copy that
schema.
## Requirements
### Requirement: Direct CLI is exposed from the canonical Harness root

Every documented direct production CLI entrypoint SHALL be invoked from
`ppt_maker_harness/` and SHALL identify that location as the PPT Maker Harness.
The retired source-root command path SHALL not remain documented, accepted as an
alias, or resolved as a fallback. Existing `ppt_flow`, `PPTMAKER_*`, and
`pptmaker-*` namespaces SHALL remain unchanged.

#### Scenario: An Agent receives a direct CLI command

- **WHEN** active guidance or a CLI diagnostic names the production entrypoint
- **THEN** it uses `node ppt_maker_harness/scripts/ppt_flow.mjs <command>`
- **AND** it does not direct the Agent to a retired root path

### Requirement: --only accepts friendly slide selectors

Commands accepting `--only` SHALL resolve friendly selectors through the shared
stable-identity owner and reject ambiguous or unknown values before work begins.

#### Scenario: Spoken selector resolves

- **WHEN** a unique spoken stable ID identifies one current slide
- **THEN** the command resolves that slide without inferring another ID

### Requirement: CLI routing does not duplicate workflow evaluation

Shared command routing SHALL consume the state/workflow owner result rather than
reconstructing mode, gate, authorization, recovery, or completion rules from CLI
arguments, rendered output, or metadata.

#### Scenario: CLI consumes one inspection action

- **WHEN** a current command needs its next action
- **THEN** it uses the owner-issued inspection result
- **AND** it does not synthesize a parallel route

### Requirement: Delegated diagnostics preserve a trustworthy producer action

When a direct CLI delegates to a child that emits a valid supported diagnostic,
the parent SHALL preserve the child's `category`, `operation`, `subject`,
`reason`, `issues`, and exact `next` action. The parent MAY add only bounded
delegated lineage and parent invocation context; it SHALL not replace that
action with `inspect`, `rerun`, or another generic recovery route.

When the child output is missing, invalid, malformed, or truncated such that
the child diagnostic cannot be trusted, the parent SHALL fail closed with a
bounded `delegated` or `internal` diagnostic whose only recovery is
`report_internal`. It SHALL not copy child prose, invent a child category,
or expose a speculative fallback.

#### Scenario: Valid child environment diagnostic passes through

- **WHEN** `ppt_flow doctor` receives a valid child environment diagnostic with
  an exact repair action and invocation
- **THEN** the parent emits the same producer-owned diagnostic action and
  bounded child facts plus delegated lineage
- **AND** it does not replace the action with generic inspection guidance

#### Scenario: Invalid delegated output fails closed

- **WHEN** a delegated child exits unsuccessfully without a valid complete
  supported diagnostic
- **THEN** the parent emits a secret-safe delegated/internal diagnostic with
  `report_internal`
- **AND** it does not claim an environment repair, retry, or inspection action
  that the child did not establish

### Requirement: Verification commands use accurate tier vocabulary

The compatible `ppt_flow test` command SHALL remain available but SHALL be
described as bounded core verification, not complete regression. Active CLI
help and routing guidance SHALL distinguish `core`, `focused`, `sweep`, `mock
E2E`, and `real E2E` verification tiers and shall state that real E2E/provider
work requires its existing explicit authorization boundary. No documentation or
test command description may imply that a core run performed unselected tiers.

#### Scenario: Core test output is not advertised as full regression

- **WHEN** an Agent follows the public verification guidance or reads
  `ppt_flow test` help/output
- **THEN** it can identify the command as the core tier and the scope of work
  it did not perform
- **AND** it does not infer a real provider call or full regression from that
  result

### Requirement: Style Master diagnostics remain owner-issued and bounded

Every Style Master hard failure SHALL use the registered producer-owned diagnostic envelope and report the
earliest independent failure in the current candidate lifecycle. The producer SHALL return the nearest
legal owner action for missing/stale intent or selection, unavailable runtime, candidate-plan/grant mismatch,
uncertain attempt, invalid candidate evidence, lifecycle-head conflict, or selection compare-and-swap conflict; consumers SHALL NOT derive a
parallel style recovery route from prose or file presence.

#### Scenario: Missing selection has one repair action

- **WHEN** page raw planning finds no current accepted effective-style selection
- **THEN** the CLI emits one bounded Style Master owner action before page raw provider work
- **AND** it does not offer raw-plan force, file-copy, or generic retry alternatives

#### Scenario: Candidate conflict is not reported as provider failure

- **WHEN** a candidate promotion loses its compare-and-swap precondition after valid candidate bytes exist
- **THEN** the CLI reports the current-selection conflict and its review/rebuild action
- **AND** it does not blame the provider, resubmit a candidate, or overwrite the selection

#### Scenario: Unknown attempt has one preserved-cost recovery action

- **WHEN** inspection finds an attempt whose provider outcome became unknown after submit
- **THEN** the CLI reports the recoverability hard-stop and exact-plan abandonment action requiring a human reason
- **AND** it does not offer retry, force, outcome editing, or successor authorization as the same action

### Requirement: Progressive production diagnostics remain direct and bounded

Every progressive image2 hard failure SHALL use the registered producer-owned
diagnostic envelope. The producer SHALL first validate exact run/workflow
identity, full-plan identity, batch identity, grant/attempt binding, and
current item provenance before any derived projection, browser work, or
provider call. It SHALL report the smallest independent root cause and one
nearest legal owner action; the Controller SHALL consume that action without
parsing prose or creating another recovery route.

#### Scenario: Stale batch stops before submission

- **WHEN** authorize or generate receives a batch hash whose plan, raw contract, profile, source, execution, or selected IDs drifted
- **THEN** the CLI returns the raw-owner rebuild/replan diagnostic before provider initialization
- **AND** it does not reinterpret the grant, choose a replacement batch, or consume another item

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
