## MODIFIED Requirements

### Requirement: CLI observation does not mutate authority or invoke providers

Plain `status` and every `state --validate-state` observation SHALL consume the
read-only inspection path and SHALL not write source, durable state, history,
journals, metadata, receipts, grants, attempts, authorizations, or generated
artifacts, nor invoke a provider. Text `state` and `state --json` SHALL also
consume that same inspection path before any presentation adaptation.

For one exact active progressive Page Authority Controller route only, text
`state` and `state --json` MAY atomically rebuild
`_state/page-production-task-projection.md` after inspection. This is an
authority-read-only collaboration projection, not an authority mutation. The
response SHALL report `task_projection.status` as `created`, `updated`,
`current`, or `not-applicable` in JSON and an equivalent text line. A
non-applicable route SHALL not create the card. The card itself SHALL not be
used to authorize cost, select a lifecycle action, prove evidence, or resume
work.

#### Scenario: Observation sees a repairable fact

- **WHEN** status observes a repairable current fact
- **THEN** it returns the owner-issued action without mutation

#### Scenario: Active progressive state rebuilds only its collaboration card

- **WHEN** text `state` or `state --json` observes an exact active progressive
  Controller route with an absent or stale task projection
- **THEN** it reports `created` or `updated` after rebuilding that one named
  projection from current owner facts
- **AND** snapshots show no authority source, state, receipt, grant, attempt,
  authorization, history, or generated artifact change

#### Scenario: Other observations are genuinely zero-write

- **WHEN** `status`, `state --validate-state`, or state for a non-applicable
  route runs
- **THEN** it reports no collaboration projection refresh or `not-applicable`
- **AND** it writes no card or authority artifact and invokes no provider

## ADDED Requirements

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
