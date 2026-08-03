## ADDED Requirements

### Requirement: Inspection avoids an unreviewable terminal partial Pilot

For a current Page Authority progressive lifecycle, Workflow Inspection SHALL
reuse the raw owner's direct materialization coverage evaluator before it
projects a partial Pilot review action. If the latest terminal partial Pilot
has missing selected review coverage and residual paid debt, inspection SHALL
return only the owner-derived successor Pilot planning confirmation. It SHALL
not project Pilot review, Pilot acceptance, Expansion, finalization, or current
raw evidence.

The observation remains read-only: it shall not terminalize an attempt,
construct a batch, grant authorization, mutate state, or invoke a provider.
The successor planning confirmation retains the existing requirement for exact
formal ID selection and a new explicit paid-batch authorization.

#### Scenario: Terminal unknown sample returns to planning

- **WHEN** the latest terminal partial Pilot includes an unknown selected item
  without current materialization and the full plan still has paid debt
- **THEN** inspection returns the raw owner's successor Pilot planning
  confirmation as its one primary action
- **AND** it does not return reconciliation again, a Pilot review action, or
  historical bytes as current evidence

#### Scenario: Inspection does not repair the Pilot

- **WHEN** inspection observes missing terminal Pilot coverage
- **THEN** it returns the direct owner action without writing attempts, batches,
  grants, evidence, state, receipts, or generated artifacts
- **AND** it does not invoke a provider
