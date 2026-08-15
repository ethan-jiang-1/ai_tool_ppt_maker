# CLI Surface Specification

## Purpose

Define every registered direct Node CLI and the fixed 12-command unified entry
point. The CLI producer owns its JSON diagnostics, current Page Image Workflow routing,
and bounded undeclared-contract hard-stop responses; Controller consumers do not copy that
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

When selected-workflow visual/source drift makes an existing Style Master
selection stale but a current canonical candidate validates, `style-master
inspect` SHALL return its normal owner projection with one replacement-planning
next action and `style-master plan` SHALL accept that same scope for the
provider-free successor plan. Neither command SHALL classify that bounded
condition as an internal failure or direct the Agent to an inspection that has
the same stale-scope precondition. Any raw-plan diagnostic preceding the new
selection shall name only this Style Master recovery and shall not imply
provider authorization, provider retry, source-epoch mutation, raw-plan
publication, or Page Image evidence acceptance.

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

#### Scenario: Stale source context has one replacement-planning action

- **WHEN** `style-master inspect` or `style-master plan` reaches a stale prior
  selection while the selected workflow's current canonical candidate validates
- **THEN** inspection returns the owner-issued replacement Style Master
  planning action and planning accepts the same scope to publish its
  provider-free successor
- **AND** neither command returns an opaque internal error, self-referential
  inspect loop, raw-plan force, provider retry, or mutation claim

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

### Requirement: State CLI exposes only the exact known execution-mismatch repair

The public CLI SHALL expose the owner-controlled repair only as:

```text
ppt_flow state <active-run> --repair-known-execution-mismatch
```

This form SHALL be mutually exclusive with `--json` and `--validate-state`; a
mixed invocation SHALL fail as usage before binding or State inspection. The
repair form SHALL invoke only the State owner's exact BUG-066 repair contract.
On success it SHALL report the bounded repaired or no-repair-needed outcome
without exposing raw state bytes or an unrelated mutation surface. An inactive
run, an absent or partial known signature that is not already a fully valid
active state, any additional state corruption, or a failed source/state,
journal, or CAS precondition SHALL return the owner-issued non-zero hard-stop
without writing state, history, metadata, generated artifacts, or invoking a
provider. The CLI SHALL expose no generic `--repair`, `--force`, raw state
editor, compatibility, or arbitrary key-removal form.

#### Scenario: Active known-signature repair is deterministic

- **WHEN** `ppt_flow state <active-run> --repair-known-execution-mismatch`
  receives an otherwise valid active state containing exactly the BUG-066
  triplet
- **THEN** it reports the state owner's successful repair outcome
- **AND** it does not request human confirmation or present another recovery
  route

#### Scenario: Valid state needs no second repair

- **WHEN** the active state is fully valid and has no BUG-066 triplet
- **THEN** the CLI reports the bounded no-repair-needed success without a state
  or history write
- **AND** it does not treat the absent triplet as generic repair authority

#### Scenario: Repair cannot target an inactive run

- **WHEN** the inactive run is passed to `ppt_flow state` with
  `--repair-known-execution-mismatch`
- **THEN** the CLI returns the execution-version mismatch hard-stop before any
  state, history, source, generated-artifact, or provider action

#### Scenario: Repair mode cannot be combined with observation

- **WHEN** `--repair-known-execution-mismatch` is combined with `--json` or
  `--validate-state`
- **THEN** the CLI returns the bounded usage failure before resolving a
  harness, source marker, or state record
- **AND** it makes no state, history, source, generated-artifact, or provider
  write

### Requirement: Public CLI exposes only declared current Page Image Workflow operations

The registered `style-master` and `image2` command families SHALL operate only
on one exact declared current workflow scope. They retain
provider-free planning/inspection, Task-Mandate-backed exact grants, bounded
generation and progress, review, acceptance, reconciliation, final delivery,
notes refresh, previewed structural versioning, and explicit human artifact
viewing as owner-controlled operations.
They SHALL not accept arbitrary prompt, provider, profile, path, scope, or
policy overrides; `--force`, retry, direct provider request, legacy mode,
adoption, migration, and compatibility flags remain unavailable.

The current `image2` family SHALL use these fixed forms:

```text
ppt_flow image2 plan <run-dir>
ppt_flow image2 artifact-view <run-dir>
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

`artifact-view` is provider-free and rebuilds only the current run's
non-authoritative human artifact reference view; it creates no mandate, grant,
plan, submission, acceptance, state transition, or task-projection refresh.
`pilot` is provider-free and creates only an exact selected batch plan; it does
not submit a sample, create a grant, or create accepted page evidence. Pilot
provider work begins only after `authorize` validates that exact plan/batch and
the active Task Mandate, records the exact grant, and is followed by
`generate`. For a matching active Task Mandate, this grant bookkeeping SHALL be
an Agent-run operation, not a repeated human cost confirmation.
`pilot-review` and `pilot-accept` apply only to a terminal partial Pilot;
`review` and `accept` apply the one Complete Page Review decision: Framed
output contains the current provider page and production-equivalent header
composite, while Pure output contains its complete provider page. The command
family SHALL not create a second composite approval or treat a Pilot decision
as final acceptance.

#### Scenario: Public help lists only declared workflow routes

- **WHEN** a user requests public production help
- **THEN** the help names only current Framed or Pure Page Image Workflow
  operations and their bounded owner actions
- **AND** it lists no undeclared workflow, compatibility, migration, or direct
  prompt operation

#### Scenario: A mandate-covered batch is not a human confirmation

- **WHEN** `image2` reports a current Pilot, successor, or exact batch-grant
  action under a matching active Task Mandate
- **THEN** the owner-issued next action has `requires_human: false` and names
  the exact plan/batch scope the Agent can carry forward
- **AND** the CLI still requires the registered hashes before grant or
  generation and does not accept a cost, scope, or provider override

#### Scenario: Missing mandate stops before provider work

- **WHEN** `image2 authorize` receives a current exact plan/batch whose Task
  Mandate is absent, stale, or mismatched
- **THEN** the CLI emits one bounded owner-issued recovery diagnostic before
  provider initialization, grant publication, or attempt claim
- **AND** it does not treat a prior command, batch hash, or human navigation
  artifact as a substitute mandate

#### Scenario: Framed complete review has one decision

- **WHEN** a current Framed `image2 review` operation is ready for acceptance
- **THEN** it returns raw provider and production-equivalent composite evidence
  for one `proceed` or `repair` action
- **AND** it does not expose another local-composite approval operation

#### Scenario: A command reaches an undeclared workflow contract

- **WHEN** a registered Page Image command receives a run outside the declared
  current workflow contract
- **THEN** it returns the owning bounded hard-stop before provider, state, or
  derived-artifact mutation
- **AND** it does not select or describe another route

### Requirement: Artifact-view success covers a valid successor with matching predecessor bindings

For a current supported Pure or Framed run whose Style Master owner establishes
a validated pending successor, `image2 artifact-view <run-dir>` SHALL return
its normal provider-free success projection even when the predecessor
selection's style-intent, style-context, and candidate-generation-profile
hashes match the successor plan. The result SHALL retain the ordinary exact
run/workflow, short navigation-index, and short navigation-root fields and
include the owner-issued pending-successor `next_action`.

The command SHALL not translate that valid guide into a stale raw-plan failure,
initialize a provider, authorize or submit work, select a candidate, or alter
source, state, receipt, raw, attempt, or review authority. Invalid owner facts
remain subject to their existing bounded hard-stop and no navigation write.
When the effective selection has advanced through the exact current successor
plan's promotion, the command SHALL continue through the ordinary
accepted-selection path and its existing prerequisites; it SHALL not emit a
pending-successor action or a predecessor-selection conflict.

#### Scenario: Direct artifact-view reports a matching-binding successor normally

- **WHEN** an Agent invokes `image2 artifact-view` for a current successor
  whose predecessor identity validates but whose Style Master input hashes
  match the successor
- **THEN** the command exits successfully with the normal short navigation
  fields and the owner-issued successor action
- **AND** it does not emit a raw-source-receipt diagnostic or perform provider
  work

#### Scenario: A promoted successor does not remain a pending CLI conflict

- **WHEN** the effective selection is the exact accepted promotion of the
  current successor plan
- **THEN** `image2 artifact-view` uses its ordinary accepted-selection path
  and any existing prerequisite outcome from that path
- **AND** it does not emit a pending-successor action or a
  `style_master_selection_conflict` diagnostic

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

Current declared-workflow `style-master generate` and `image2 generate`
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
Image Workflow observations.  Ordinary text `state` and `state --json` may
rebuild the current task projection only for the eligible active replacement
Controller route, after read-only inspection.  The projection SHALL remain a
collaboration view and shall not authorize provider cost, select a lifecycle
action, prove evidence, or resume work.  A run whose source/state/evidence
cannot establish the declared current protocol is not eligible to produce or
update it.

#### Scenario: Status does not repair Page Image state

- **WHEN** `status` observes a current repairable workflow fact
- **THEN** it returns the owner-issued action without writing source, state,
  receipt, authorization, or generated artifacts
- **AND** it does not invoke a provider or create a task card

### Requirement: Page Image response-shape diagnostics project only declared current facts

When the existing Page Image `known_failure` result projects a provider
response fact whose classification is `invalid_json`, the CLI producer SHALL
include `response_shape` only when it is one of `empty`, `html_like`, or
`other_non_json`. The projection SHALL omit absent, malformed, or
unrecognized response-shape values. Consumers SHALL treat the
producer-owned value as diagnostic information only and SHALL NOT use it as
authorization, retry, routing, state, or recovery authority.

The CLI success output and failure diagnostic SHALL continue to exclude
provider body text, headers, lengths, digests, task identifiers, prompts,
credentials, and provider identity. The existing next action and outcome
remain the sole owner-issued control result.

#### Scenario: A recognized Page Image shape reaches the existing projection

- **WHEN** a Page Image item terminalizes with the existing `invalid_json`
  known failure and a recognized response shape
- **THEN** its existing `provider_failure` projection includes only the
  classification and that recognized `response_shape`
- **AND** its outcome, progress, and owner-issued next action are unchanged

#### Scenario: Extra provider response fields are never forwarded

- **WHEN** a Page Image known-failure error contains a recognized response
  shape together with arbitrary provider-response fields
- **THEN** the CLI projection keeps only its closed diagnostic fields
- **AND** it does not emit the arbitrary fields or derive a different action

#### Scenario: An absent or unrelated response shape remains unprojected

- **WHEN** a Page Image known-failure record has no response shape, a malformed
  response shape, or a classification other than `invalid_json`
- **THEN** the CLI retains its bounded current projection without the field
- **AND** it does not synthesize a shape or change the existing control path

### Requirement: Progressive terminal-sibling diagnostics remain executable

When the progressive raw owner recognizes a verified `succeeded` terminal
beside an `unknown` sibling for one submitted attempt, direct `image2`
inspection, planning, reconciliation, and generation SHALL consume that
owner-issued effective success and continue only through the existing next
action. They SHALL not emit an integrity diagnostic, request a new human
authorization, retry the retained attempt, or reinterpret the retained unknown
record. Any later provider request for a different eligible item remains
subject to its unchanged exact grant and generation boundary.

When the owner reports an invalid terminal branch for which no registered
runtime operation is legal, the CLI SHALL fail closed with the existing bounded
internal-maintenance `report_internal` diagnostic. It SHALL not advertise a
generic rebuild, retry, force, state edit, replacement authorization, or
provider work as an executable recovery.

#### Scenario: Verified terminal sibling continues through the owner action

- **WHEN** a current progressive scope contains a valid effective `succeeded`
  terminal with a retained `unknown` sibling
- **THEN** the CLI reports or executes only the next action issued by the raw
  owner for that effective state
- **AND** it does not create a new grant, make a provider request for that
  terminal tuple, or expose the sibling as an instruction to retry

#### Scenario: Invalid terminal branch does not advertise unreachable repair

- **WHEN** the progressive raw owner reports an integrity branch for which no
  registered runtime operation is legal
- **THEN** the CLI emits the bounded fail-closed `report_internal` maintenance
  diagnostic
- **AND** it does not advertise generic rebuild, retry, force, state editing,
  replacement authorization, or provider work as a recovery

### Requirement: Run-scoped CLI validates the current Page Image Workflow identity

Every run-scoped CLI operation SHALL first verify the exact local Harness
binding through the existing locator evaluator, then require the exact current
schema-declared Page Image source marker and matching state-owned
`production_identity` record. That record SHALL expose only `workflow` and
`source_epoch`; direct CLI status and state projections SHALL expose those
identity facts without a `production_mode`, fixed mode literal, or compatibility
projection. Every direct CLI failure diagnostic SHALL use the inventory-declared
`schema: pptmaker-cli-diagnostic`; producer and consumer validation SHALL
reject an absent, numeric-version, or undeclared diagnostic schema. A missing,
malformed, source-disagreeing, or undeclared contract value remains an
owner-issued hard failure before any read that depends on production authority,
mutation, or provider work. The CLI SHALL not scan for, decode, convert, or
export a known historical contract.

#### Scenario: CLI receives an undeclared source/state marker

- **WHEN** a run-scoped operation encounters a source marker or identity record
  absent from the current serialization inventory
- **THEN** it returns the existing owner-issued current-contract failure before
  dependent work
- **AND** it does not create a compatibility inspection or migration path

#### Scenario: An inactive production request is fenced before work

- **WHEN** a CLI request names a run other than the active current binding
- **THEN** it retains the existing non-writing execution-version mismatch failure
- **AND** it does not retarget the request or inspect historical artifacts

#### Scenario: An undeclared production request is fenced before work

- **WHEN** a CLI request supplies an undeclared production contract
- **THEN** it fails exact-current validation before dependent work
- **AND** it does not classify the value, create a migration, or initialize a provider

#### Scenario: Status projects a current identity

- **WHEN** a status or state command observes a valid current Framed or Pure run
- **THEN** its machine-readable projection identifies the selected workflow and
  current source epoch through `production_identity`
- **AND** it does not emit a fixed singleton mode field

### Requirement: Current artifact view preserves the machine CLI contract

On a current supported Page Image run, artifact view SHALL retain its existing
provider-free, derived navigation behavior and machine-oriented success shape.
It SHALL validate only the declared current locator and lineage before rebuilding
the navigation tree; an undeclared marker stops through ordinary owner
validation without an artifact read, compatibility report, or migration.

#### Scenario: Artifact view is explicitly requested for a current run

- **WHEN** an Agent invokes artifact view for an exact current Pure or Framed run
- **THEN** it returns the existing run-scoped derived navigation result without a
  provider request or lifecycle transition
- **AND** ordinary status/state observations remain unchanged unless separately invoked

#### Scenario: Artifact view does not expose canonical artifact paths

- **WHEN** the current view contains immutable owner artifacts
- **THEN** it retains the existing bounded derived navigation paths
- **AND** it does not serialize canonical source locators as lifecycle selectors

#### Scenario: Artifact view receives an unsupported run

- **WHEN** artifact view encounters an undeclared source/state marker
- **THEN** it fails before navigation-tree work through the ordinary current owner
- **AND** it does not alias, adopt, or migrate the run

### Requirement: Slides CLI previews narrative page plans through the structural interface
The existing `ppt_flow slides` command family SHALL expose
`slides narrative-plan <run-dir> --candidate <path>` for one exact current run.
The required candidate path SHALL resolve beneath that run's `_scratch/` both
lexically and after realpath resolution. The preview SHALL read that
Agent-authored page-grouping candidate, the current canonical narrative sources,
current Visual Language registry, and canonical page source, then return the
provenance-carrying structural plan identity and a confined non-authoritative
plan location. The plan SHALL bind the candidate's scratch-relative locator and
canonical bytes so `slides apply-plan` can revalidate both before publication.
The preview SHALL not alter canonical page source, State, lifecycle evidence,
review, delivery, or provider state, and it SHALL make zero provider calls.

The only successful preview location SHALL be
`_scratch/narrative-plans/<plan_sha256>.json`. The CLI SHALL reject a malformed
candidate before writing that plan location, and SHALL not accept an alternate
candidate or plan location outside the confined paths.

The returned plan SHALL be applied only through
`slides apply-plan <run-dir> --plan <path> --apply --plan-sha256 <hash>` with
the exact returned hash. The CLI shall not expose a force, legacy-outline,
migration, direct-source-write, or provider flag for narrative planning or
publication.

#### Scenario: Agent previews a page plan
- **WHEN** the Agent invokes the narrative page-plan preview for a current run
  with valid current inputs
- **THEN** the CLI returns the ordered pages, their bounded provenance, exact
  plan hash, and confined plan location
- **AND** it does not create a target version, mutate source/state, or invoke a
  provider

#### Scenario: Narrative input is invalid or stale
- **WHEN** the preview or exact-plan apply cannot establish current narrative
  inputs, source bytes, plan identity, or target binding
- **THEN** the CLI emits the registered bounded diagnostic with one nearest
  action to repair or regenerate the plan
- **AND** it does not publish a target source, infer a legacy outline, or offer
  force or migration behavior

#### Scenario: Candidate changes after preview
- **WHEN** the bound candidate is missing, escapes the current `_scratch/`, or
  has different bytes at exact-plan apply
- **THEN** the CLI hard-stops before source, State, derived-artifact, or provider
  mutation
- **AND** its nearest action is to restore or repair the candidate and generate
  one current narrative preview

### Requirement: Invalid current protocol projects the shared CLI handoff

When a run-scoped direct CLI operation cannot establish exact declared-current
source/state/evidence, finalization, or delivery identity, its producer
diagnostic SHALL project the existing `production-protocol`
`current-protocol-invalid` hard-stop and the
`repair-current-protocol-identity` repair action. Direct build and notes-refresh
consumers SHALL map the typed `current_protocol_invalid` cause through that same
producer rather than defining their own action fields. The CLI projection SHALL
be bounded and secret-safe, shall not name a retired protocol route, and shall
not write state/history/task projections/generated artifacts or initialize a
provider.

#### Scenario: CLI rejects an invalid source marker without mutation

- **WHEN** `status` or `state --json` receives a source marker outside the
  declared current contract
- **THEN** its final failure envelope projects the shared repair handoff before
  dependent work
- **AND** the source and state trees remain byte-identical with no provider
  request

#### Scenario: Delivery identity failure reuses the shared CLI handoff

- **WHEN** direct build or notes refresh encounters a present foreign or
  cross-lineage final-manifest, delivery-media, or receipt record
- **THEN** its final failure envelope projects the shared repair handoff through
  the existing producer
- **AND** it writes no delivery artifact or task projection and initializes no
  provider

### Requirement: Page Design System failures retain source-owner CLI recovery

When a direct current `image2` operation compiles or recompiles the selected
Pure or Framed adapter, the CLI producer SHALL classify exactly
`page_design_system_source_unavailable`,
`page_design_system_source_invalid`, `page_design_system_source_escape`,
`page_design_system_source_unreadable`,
`page_design_system_source_too_large`, and
`page_design_system_source_utf8_invalid` as `source_validation`. The bounded
diagnostic SHALL retain the resolver's exact declared reason kind and use the
existing non-human `edit_source` action. If the resolver supplies a safe
selected-source locator, the producer MAY project only that bounded path
through the existing `source` and `next.inspect` fields. It SHALL not project
exception prose, design-system text, digest, selection origin, raw provider
input, or another undeclared field.

`pure_provider_input_too_large` and `framed_provider_input_too_large`, introduced
by the 32,768-byte local compiler bound, SHALL use the same existing
`source_validation` / `edit_source` recovery rather than `provider` or generic
`internal` recovery. Because those overflow errors combine multiple source and
configuration inputs and supply no exact attributable owner locator, the
producer SHALL omit `source` and `next.inspect` unless one exact safe owner
locator is available; it SHALL NOT default either field to
`slide-specifications.md` or another merely available source. Missing locator
scope remains unknown rather than inferred. `page_design_system_run_dir_invalid`,
a malformed derived raw contract, or another compiler-contract contradiction
SHALL retain the existing bounded `internal` / `report_internal` route. This
requirement adds no command, route, diagnostic-envelope field, action value,
Controller branch, retry, waiver, or provider operation.

#### Scenario: Unsafe selected source points to source repair

- **WHEN** `image2 plan`, authorization preflight, or generation preflight
  reaches a selected Page Design System source that is unsafe, unreadable,
  invalid UTF-8, or over the source-byte limit
- **THEN** the CLI emits the existing secret-safe `source_validation` envelope
  with the exact declared reason kind and non-human `edit_source` action
- **AND** it performs no plan publication, grant, attempt, provider
  initialization, provider request, or lifecycle mutation

#### Scenario: Canonical input overflow is not blamed on the provider

- **WHEN** the selected Pure or Framed compiler produces final canonical input
  larger than 32,768 UTF-8 bytes
- **THEN** the CLI emits the existing bounded `source_validation` /
  `edit_source` recovery before provider initialization
- **AND** it does not classify the local limit as provider failure, truncate
  author text, add a command option, expose the canonical input, or attribute
  the overflow to `slide-specifications.md` without an exact owner locator

#### Scenario: Compiler contradiction remains an internal failure

- **WHEN** a direct `image2` operation encounters an invalid resolver invocation
  or a derived adapter contract contradiction rather than a source-owned defect
- **THEN** the CLI retains its existing bounded `internal` /
  `report_internal` diagnostic
- **AND** it does not direct the Agent to edit a source that cannot repair the
  defect or create a second recovery route
