## MODIFIED Requirements

### Requirement: Progressive task projection remains a rebuildable collaboration view

For a progressive Page Authority route, Run-Bundle Layout SHALL reserve
`_state/page-production-task-projection.md` for the Controller's run-scoped,
rebuildable collaboration card. The card SHALL contain only owner-issued plan,
batch, evidence, review, manifest, and delivery references, bounded derived
progress, the prescribed next action, and the corresponding typed human
decision plus its optional persisted note. It SHALL remain distinct from the
append-mostly raw-production owner and version-derived `_generated/`
projections.

The reserved card SHALL present structured owner and typed-handoff references
as the typed, card-scoped display references defined by `playbook-execution`,
rather than complete SHA-256 values. Its text, including comments and rendered
free-form notes, SHALL NOT contain a complete 64-character hexadecimal digest.
Display references SHALL remain non-authoritative: they are not directory
names, content-address keys, persistent run-bundle records, or selectors
outside the current card scope. Complete digests SHALL remain in the direct
owner records and any existing storage, binding, or operation surface that owns
them.

The card SHALL not be an authorization, attempt, consumption, provenance,
materialization, current-plan, state, or evidence authority. Its absence,
deletion, manual edit, stale contents, or generated-artifact rebuild SHALL
not permit a provider submit, grant issuance, state advance, or acceptance;
the Controller and inspection owners instead regenerate it from their direct
records and typed handoffs.

#### Scenario: Task card has no lifecycle authority

- **WHEN** a selected progressive run has a removed or manually edited task projection
- **THEN** layout validation still identifies direct raw records and Controller handoffs as the relevant owners
- **AND** it does not infer progress, mint a grant, or publish evidence from the card

#### Scenario: Rebuilt task card does not become a digest store

- **WHEN** the Controller rebuilds an eligible progressive task card from
  direct owner facts and typed handoffs
- **THEN** the card presents only its scoped display references while the
  complete owner and handoff digests remain in their existing canonical records
  and paths
- **AND** rebuilding the card creates no alias, index, link, migration, or new
  persistent identity in the run bundle
