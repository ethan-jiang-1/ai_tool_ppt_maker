## MODIFIED Requirements

### Requirement: Public CLI exposes only replacement Page Image Workflow operations

The registered `style-master` and `image2` command families SHALL operate only
on one exact current replacement-protocol version/workflow scope. They retain
provider-free planning/inspection, explicit authorization, bounded generation
and progress, review, acceptance, reconciliation, final delivery, notes
refresh, previewed structural versioning, and explicit human artifact viewing
as owner-controlled operations. They SHALL not accept arbitrary prompt,
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
non-authoritative human artifact reference view; it creates no grant, plan,
submission, acceptance, state transition, or task-projection refresh. `pilot` is provider-free and
creates only an exact selected batch plan; it does not submit a sample, create
a grant, or create accepted page evidence. Pilot provider work begins only
after `authorize` validates that exact plan/batch and records the separate
explicit cost authorization, followed by `generate`. `pilot-review` and
`pilot-accept` apply only to a terminal partial Pilot; `review` and `accept`
apply the one Complete Page Review decision: Framed output contains the
current provider page and production-equivalent header composite, while Pure
output contains its complete provider page. The command family SHALL not
create a second composite approval or treat a Pilot decision as final
acceptance.

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

## ADDED Requirements

### Requirement: Explicit artifact view preserves the machine CLI contract

On a current supported Page Image run, `image2 artifact-view <run-dir>` SHALL
perform no provider work and rebuild only the canonical human artifact
reference view. Its success result SHALL identify that view's local locator and
the exact run/workflow scope; it SHALL not print raw prompt prose, credentials,
provider responses, or a broad dump of owner records.

Existing success JSON for `status`, `state`, `style-master`, and the other
`image2` operations SHALL retain their current machine-oriented schema. The
artifact view SHALL not add a short-hash selector, change any exact SHA-256
argument grammar, provide a direct lifecycle/authorization/review command, or
write any `_state/` file including the Page Production task projection.

Current protocol identity remains the earliest prerequisite. For an unsupported
or unresolved scope, the command SHALL preserve the existing bounded
owner-issued diagnostic and SHALL not write the view, initialize a provider,
read legacy media, or mutate source/state/generated authority.

#### Scenario: Artifact view is explicitly requested for a current run

- **WHEN** an Agent invokes `image2 artifact-view` for an exact current Pure or Framed run
- **THEN** the CLI rebuilds and returns the run-scoped human artifact view without a provider
  request or lifecycle transition
- **AND** the complete `_state/` tree and ordinary `status`/`state` observations remain unchanged
  unless separately invoked

#### Scenario: Artifact view receives an unsupported v2 run

- **WHEN** `image2 artifact-view` is requested for a `page-authority-image2-v2` source/state pair
- **THEN** the CLI returns the existing `unsupported-protocol/export` boundary before reading
  artifacts or writing the view
- **AND** it does not create an alias, compatibility report, or adoption path
