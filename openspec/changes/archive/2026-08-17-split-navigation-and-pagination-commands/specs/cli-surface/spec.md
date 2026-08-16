# CLI Surface Specification (delta)

## RENAMED Requirements

- FROM: `### Requirement: Slides CLI previews narrative page plans through the structural interface`
- TO: `### Requirement: Narrative page plans publish through a dedicated paginate command`

## MODIFIED Requirements

### Requirement: Current artifact view preserves the machine CLI contract

On a current supported Page Image run, the `artifacts` command SHALL retain the
existing provider-free, derived navigation behavior and machine-oriented success
shape. It SHALL validate only the declared current locator and lineage before
rebuilding the navigation tree; an undeclared marker stops through ordinary
owner validation without an artifact read, compatibility report, or migration.
The retired `image2 artifact-view` form SHALL return an owner-issued exact
replacement (`artifacts <run-dir>`), not unknown-command prose.

#### Scenario: Artifact view is explicitly requested for a current run

- **WHEN** an Agent invokes `artifacts` for an exact current Pure or Framed run
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

#### Scenario: The retired artifact-view form names its replacement

- **WHEN** a caller invokes `image2 artifact-view`
- **THEN** it fails before navigation-tree work with the exact `artifacts <run-dir>`
  invocation
- **AND** it does not alias, adopt, or migrate the run

### Requirement: Narrative page plans publish through a dedicated paginate command

The direct CLI SHALL expose narrative page planning and publication through a
dedicated `paginate` command, separate from the structural `slides` command.
`paginate plan <run-dir> --candidate <path>` SHALL preview one exact current run;
`paginate apply <run-dir> --plan <path> --plan-sha256 <hash>` SHALL publish the
exact returned hash. The candidate and plan paths SHALL resolve beneath the
run's `_scratch/` lexically and after realpath resolution.

`slides apply-plan` SHALL remain the public structural transaction replay entry.
When a `slides apply-plan` request names a `narrative-page-plan` schema, the CLI
SHALL fail after run binding and confined read-only plan classification, after
reading and parsing the plan JSON but before canonical source, State, or
artifact mutation and before provider initialization, and SHALL return the exact
`paginate apply` invocation. A malformed or unknown schema SHALL fail closed and
SHALL NOT default to structural transaction replay. The retired
`slides narrative-plan` form SHALL return the exact `paginate plan` invocation.

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

#### Scenario: A narrative plan is applied only through paginate

- **WHEN** the Agent applies a confirmed narrative plan
- **THEN** `paginate apply` revalidates the exact plan hash and canonical bytes
  before publication
- **AND** it does not expose force, legacy-outline, migration, direct-source-write,
  or provider flags

#### Scenario: A narrative schema is rejected from the structural entry

- **WHEN** `slides apply-plan` reads a plan whose schema is `narrative-page-plan`
- **THEN** it fails after confined read-only plan classification and before
  source/State/artifact or provider mutation
- **AND** it returns the exact `paginate apply` invocation

#### Scenario: A malformed or unknown schema fails closed

- **WHEN** `slides apply-plan` reads a plan it cannot classify as a current
  structural transaction
- **THEN** it fails closed with the owner-issued bounded diagnostic
- **AND** it does not default to structural transaction replay

### Requirement: Public CLI exposes only declared current Page Image Workflow operations

The registered `style-master`, `image2`, and `artifacts` command families SHALL
operate only on one exact declared current workflow scope. They retain
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

`build` SHALL accept only the canonical `<run-dir>` argument. It SHALL NOT
register or accept `--resolution`, `--model`, `--base-url`, `--reuse-images`,
`--dry-run`, `--force`, `--reason`, or `--retired-controls-explicit`
overrides, and no retired build plumbing SHALL be exposed on its help,
JSDoc, or dispatch path. `doctor` SHALL NOT register or accept `--image2`;
the retired flag is rejected by the commander parse (unregistered option) and
the child environment check retains its own live `--image2` usage rejection.

`artifacts` is provider-free and rebuilds only the current run's
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

#### Scenario: Build help exposes no retired overrides

- **WHEN** a user requests `ppt_flow build --help`
- **THEN** the help lists only the canonical `<run_dir>` argument
- **AND** it does not advertise resolution, model, provider, image-reuse,
  dry-run, force, or retired gate overrides

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
a validated pending successor, `artifacts <run-dir>` SHALL return its normal
provider-free success projection even when the predecessor selection's
style-intent, style-context, and candidate-generation-profile hashes match the
successor plan. The result SHALL retain the ordinary exact run/workflow, short
navigation-index, and short navigation-root fields and include the owner-issued
pending-successor `next_action`.

The command SHALL not translate that valid guide into a stale raw-plan failure,
initialize a provider, authorize or submit work, select a candidate, or alter
source, state, receipt, raw, attempt, or review authority. Invalid owner facts
remain subject to their existing bounded hard-stop and no navigation write.
When the effective selection has advanced through the exact current successor
plan's promotion, the command SHALL continue through the ordinary
accepted-selection path and its existing prerequisites; it SHALL not emit a
pending-successor action or a predecessor-selection conflict.

#### Scenario: Direct artifact-view reports a matching-binding successor normally

- **WHEN** an Agent invokes `artifacts` for a current successor whose
  predecessor identity validates but whose Style Master input hashes match the
  successor
- **THEN** the command exits successfully with the normal short navigation
  fields and the owner-issued successor action
- **AND** it does not emit a raw-source-receipt diagnostic or perform provider
  work

#### Scenario: A promoted successor does not remain a pending CLI conflict

- **WHEN** the effective selection is the exact accepted promotion of the
  current successor plan
- **THEN** `artifacts` uses its ordinary accepted-selection path and any
  existing prerequisite outcome from that path
- **AND** it does not emit a pending-successor action or a
  `style_master_selection_conflict` diagnostic
