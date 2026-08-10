## MODIFIED Requirements

### Requirement: Public CLI exposes only replacement Page Image Workflow operations

The registered `style-master` and `image2` command families SHALL operate only
on one exact current replacement-protocol version/workflow scope. They retain
provider-free planning/inspection, Task-Mandate-backed exact grants, bounded
generation and progress, review, acceptance, reconciliation, final delivery,
notes refresh, previewed structural versioning, and explicit human artifact
viewing as owner-controlled operations. They SHALL not accept arbitrary prompt,
provider, profile, path, scope, or policy overrides; `--force`, retry, direct
provider request, legacy mode, adoption, migration, and compatibility flags
remain unavailable.

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
the active Task Mandate, records the exact grant, and is followed by `generate`.
For a matching active Task Mandate, this grant bookkeeping SHALL be an Agent-run
operation, not a repeated human cost confirmation. `pilot-review` and
`pilot-accept` apply only to a terminal partial Pilot; `review` and `accept`
apply the one Complete Page Review decision: Framed output contains the current
provider page and production-equivalent header composite, while Pure output
contains its complete provider page. The command family SHALL not create a
second composite approval or treat a Pilot decision as final acceptance.

#### Scenario: Public help has no legacy or third-workflow route

- **WHEN** a user requests public production help
- **THEN** the help names only current Framed or Pure Page Image Workflow
  operations and their bounded owner actions
- **AND** it lists no v2, `hybrid`, compatibility, migration, or direct prompt
  operation

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
