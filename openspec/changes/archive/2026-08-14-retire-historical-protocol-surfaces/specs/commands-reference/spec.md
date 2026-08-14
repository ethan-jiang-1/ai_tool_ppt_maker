## MODIFIED Requirements

### Requirement: Intent discovery preserves explicit requests and exact-run boundaries

The command guidance SHALL preserve a user's explicit Deck/run selection and
route only declared current workflow facts to their existing controller or CLI
owner. A present foreign, unreadable, incomplete, or cross-lineage production
source, state, receipt, or evidence record that cannot establish exact current
protocol identity SHALL present the owner-issued `production-protocol`
`current-protocol-invalid` hard-stop with
`repair-current-protocol-identity` of kind `repair`, without route selection,
dependent source-content inspection, export, conversion, migration, or adoption.
Guidance SHALL describe the current contract and owner-issued next action
without inventing another selectable route.

An exact Harness locator/binding failure SHALL retain its binding owner. A
declared fresh authoring draft, state-owned defect after current protocol
identity is established, exact requested/active Work Version mismatch, or
attributable current delivery drift SHALL likewise retain its existing
narrative/workflow-selection, state, execution-version, or delivery owner. Only
a one-to-one, fence-clear current state repair may write.

The Agent SHALL interpret natural-language requests, then use the catalog only
to validate the first safe discovery step.  `work-resume` for a known exact run
SHALL obtain `workflow_inspection.primary_action`.  An explicit change request
for that run SHALL take precedence over the current resume action and enter
`classify-change`; it SHALL not be converted into passive resume.

`work-resume` and every work-change route SHALL require an exact run.  Without
one, discovery SHALL enter `orientation-locate-run` and request `RUN_BUNDLE.md`
or an exact deck/run path.  It SHALL not scan `deck_*`, infer a target from a
name, timestamp, current directory, rendered artifact, or conversation memory.
Foundation routes do not require a run except an owner-defined run-bound
readiness operation.  In particular, normal raw-generation readiness SHALL use
an exact run through the owner-issued `ppt_flow doctor` operation.  An unbound
direct `env-check` operation-scoped report is available only through
`orientation-env-recovery` when the main entry is unavailable or the Harness is
pre-install; it is not a normal foundation-provider-readiness continuation.

An unrecognized request SHALL produce the non-persistent Route Gap through
`orientation-unrouted-intent`.  The Agent SHALL explain whether the smallest
extension is a route, playbook, or owner capability, but SHALL not automatically
create a backlog item, issue, OpenSpec change, state field, receipt, grant,
attempt, history record, task projection, or selected-route record.

#### Scenario: An explicit run has an undeclared contract

- **WHEN** command guidance receives an explicit run whose owner reports a
  source/state/receipt/evidence identity outside the declared current contract
- **THEN** it preserves the selected target and presents the owner-issued
  `production-protocol` repair action
- **AND** it does not substitute another run or offer another route

#### Scenario: Harness binding failure remains binding-owned

- **WHEN** command guidance receives an exact run whose local Harness locator or
  binding cannot be established
- **THEN** it presents the existing Harness-binding owner action
- **AND** it does not recategorize the binding failure as production protocol
  repair

#### Scenario: Explicit change wins over resume

- **WHEN** an exact run has a current `primary_action` and the user explicitly
  asks to change text, visual content, notes, or structure
- **THEN** discovery enters `classify-change` and the applicable leaf route
- **AND** it does not substitute the current resume action for the requested
  mutation

#### Scenario: Missing exact run uses the locator

- **WHEN** a user asks to resume or change a deck without an exact run
- **THEN** the Agent requests the supported card or exact path through
  `orientation-locate-run`
- **AND** it does not inspect production deck directories to guess a target

#### Scenario: Normal raw readiness does not bypass the exact-run boundary

- **WHEN** the installed normal entry is available and a user requests
  raw-generation readiness without an exact run
- **THEN** discovery establishes applicable local foundation and requests the
  exact run before the normal raw-readiness operation
- **AND** it does not present direct `env-check` recovery as an unbound normal
  provider-readiness route

#### Scenario: Route Gap has no durable side effect

- **WHEN** a request does not match a supported route
- **THEN** the Agent returns a Route Gap and preserves the current workflow
  authority unchanged
- **AND** it does not create maintenance work unless the user separately
  confirms that extension

### Requirement: Commands expose the declared-current unsupported-input boundary

When command guidance receives a present foreign, unreadable, incomplete, or
cross-lineage source/state/receipt/evidence record that cannot establish exact
current production identity, it SHALL present the bounded
`production-protocol` `current-protocol-invalid` hard-stop with the
`repair-current-protocol-identity` action of kind `repair` before route
selection. It SHALL not infer the selected workflow, read undeclared evidence
as current, offer compatibility, or create an export, conversion, adoption, or
fallback path. It SHALL preserve the binding, fresh-draft, state,
execution-version, and attributable-current-delivery owners defined by the
direct facts above.

#### Scenario: Undeclared input is not offered as a production route

- **WHEN** a human asks to resume or change an exact run with an undeclared
  production identity
- **THEN** command guidance presents the protocol hard-stop and its owner
  repair action
- **AND** it does not offer a Page Image Workflow mutation or inspection route
