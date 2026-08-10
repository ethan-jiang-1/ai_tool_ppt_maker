## ADDED Requirements

### Requirement: State CLI exposes only the exact known execution-mismatch repair

The public CLI SHALL expose the owner-controlled repair only as:

```text
ppt_flow state <active-run> --repair-known-execution-mismatch
```

This form SHALL be mutually exclusive with `--json` and `--validate-state`; a
mixed invocation SHALL fail as usage before binding or State inspection. The
repair form SHALL invoke only the State owner's exact BUG-066 repair contract.
On success it SHALL report the bounded repaired or no-repair-needed outcome
without exposing raw state bytes or
an unrelated mutation surface. An inactive run, an absent or partial known
signature that is not already a fully valid active state, any additional state
corruption, or a failed source/state, journal,
or CAS precondition SHALL return the owner-issued non-zero hard-stop without
writing state, history, metadata, generated artifacts, or invoking a provider.
The CLI SHALL expose no generic `--repair`, `--force`, raw state editor,
compatibility, or arbitrary key-removal form.

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

## MODIFIED Requirements

### Requirement: Run-scoped CLI accepts only current Page Image Workflow identity

Every run-scoped CLI operation SHALL first verify the exact local Harness
binding through the existing locator evaluator, then require the exact
`page-image-workflow-v1` source and `image2-page-workflow-v1` state pair. A
missing/invalid binding remains an unsupported-binding hard-stop. For every
Page Image mutation, including progressive handoffs and final delivery, the
selected run SHALL exactly equal the State owner's active execution
`run_version` before it reads a derived artifact, initializes a provider,
publishes review, changes source/generated artifacts, or changes state/history.
An inactive selection SHALL emit the registered producer-owned failure envelope
with `FAILED` code, `gate` category, reason kind
`execution_run_version_mismatch`, the requested version as `reason.actual`,
and the active version as `reason.expected`. Its only next action SHALL be the
existing non-writing `inspect` action scoped to the active run; it SHALL not
automatically retarget the requested operation or report an
`unsupported-protocol/export` route. No compatibility or recovery mutation is
implied by the failure.

After a valid binding, a v2 Page Authority marker, receipt, plan, review,
manifest, or delivery record SHALL be an `unsupported-protocol/export`
hard-stop before state repair or mutation, provider initialization,
generated-artifact reads, review publication, or production work. The CLI
SHALL preserve supplied v2 bytes and shall not decode, convert, adopt, or
expose a compatibility command.

`bundle_layout --check --structure-only` remains a non-authoritative structure
inspection. It may report a physical tree but SHALL not select a current run,
read production state, establish a binding, or perform an execution action.

#### Scenario: An inactive production request is fenced before work

- **WHEN** a state with active `run_version: v2` receives a build, delivery,
  review, refresh, Page Image planning, or another Page Image mutation request
  for `v1`
- **THEN** the CLI returns the bounded execution-version mismatch hard-stop
  before any source/state/history/generated-artifact mutation or provider
  initialization
- **AND** a later read-only state validation sees the same pre-request state
  grammar and bytes
- **AND** the final failure envelope retains `v1` as `reason.actual`, `v2` as
  `reason.expected`, and the active-run `inspect` action

#### Scenario: A v2 production request is fenced before work

- **WHEN** a v2 run requests validation, planning, generation, review,
  refresh, delivery, or a stateful operation
- **THEN** the CLI returns only the bounded `unsupported-protocol/export` next
  action
- **AND** it does not initialize a provider, read legacy evidence, or mutate
  source/state/generated artifacts
