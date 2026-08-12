## REMOVED Requirements

### Requirement: Public CLI exposes only replacement Page Image Workflow operations

**Reason**: The existing requirement calls the current CLI scope a replacement
protocol version, making a Harness generation visible at the public surface.

**Migration**: Replace it with the declared-current workflow requirement below.
Command forms, owner boundaries, Task Mandate behavior, and review semantics
remain current behavior; no historical CLI route is retained.

## MODIFIED Requirements

### Requirement: Public CLI exposes only declared current Page Image Workflow operations

The registered `style-master` and `image2` command families SHALL operate only
on one exact declared current workflow scope. They retain provider-free
planning/inspection, Task-Mandate-backed exact grants, bounded generation and
progress, review, acceptance, reconciliation, final delivery, notes refresh,
previewed structural versioning, and explicit human artifact viewing as
owner-controlled operations.
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
`generate`.

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

## REMOVED Requirements

### Requirement: Page Image response-shape diagnostics remain producer-owned and secret-safe

**Reason**: Its current wording treats omitted response-shape fields as an
older-record compatibility case. The current Harness has one diagnostic
contract and omits a field simply when that current projection has no declared
value to emit.

**Migration**: Replace the requirement with the current diagnostic-projection
contract below. Consumers continue to treat `response_shape` as non-authorizing
diagnostic data; they do not identify or interpret earlier record generations.

## ADDED Requirements

### Requirement: Page Image response-shape diagnostics project only declared current facts

When the existing Page Image `known_failure` result projects a provider
response fact whose classification is `invalid_json`, the CLI producer SHALL
include `response_shape` only when it is one of `empty`, `html_like`, or
`other_non_json`. The projection SHALL omit absent, malformed, or unrecognized
response-shape values. Consumers SHALL treat the producer-owned value as
diagnostic information only and SHALL NOT use it as authorization, retry,
routing, state, or recovery authority.

The CLI success output and failure diagnostic SHALL continue to exclude provider
body text, headers, lengths, digests, task identifiers, prompts, credentials,
and provider identity. The existing next action and outcome remain the sole
owner-issued control result.

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
