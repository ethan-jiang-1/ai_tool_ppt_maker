## ADDED Requirements

### Requirement: Progressive raw production records have one append-mostly owner

Run-Bundle Layout SHALL retain irreversible progressive raw-production records
only under the deck-scoped append-mostly
1_upstream_raw_material/page-production-iterations owner. Append-mostly
full-plan containers SHALL live beneath plans/<plan-sha256>/ and retain the
provider-free immutable full plan, immutable batch projections/grants, item
claims/attempts, materialization provenance, and canonical provider-produced
raw bytes. Exactly
one small CAS-protected
scopes/<run-version>/<workflow>/head.json SHALL name the current full-plan
lifecycle identity for each exact scope. Progress, paid debt, remaining scope,
and next action SHALL be derived from the referenced direct records, not
persisted in the head.

Each plan's immutable batches SHALL form one validator-selected predecessor /
generation lineage. A batch record SHALL bind a positive generation and nullable
predecessor batch digest; readers SHALL reject a conflicting live branch,
overlapping live paid scope, or a successor whose predecessor has a live claim
or nonterminal selected paid item. A materialization bundle is authoritative
only when its validated immutable bytes/provenance are referenced by the exact
terminal succeeded attempt; staging or orphaned files do not count as bytes,
provenance, progress, grant consumption, or evidence.

The owner SHALL stage a validated initial plan container beneath its confined
staging directory and atomically rename it before head CAS. Later direct
records SHALL be separately staged and published as immutable additions; the
container itself is never a mutable ledger. Immutable plan, batch, attempt,
provenance, and bytes records SHALL never be selected by directory order,
timestamps, filenames, task projections, or generated artifact presence.
Derived copies or projections beneath the version
_generated leaf remain rebuildable and SHALL not become authorization,
attempt, provenance, or current-plan authority.

#### Scenario: Raw bytes survive derived-artifact rebuilds

- **WHEN** a current progressive raw projection under a version _generated directory is removed
- **THEN** layout inspection identifies the page-production-iterations owner for its canonical raw bytes and provenance
- **AND** it does not treat deletion as permission to resubmit, hand-copy bytes, or recreate a provider attempt

#### Scenario: Staged plan is not current authority

- **WHEN** progressive plan compilation stops before head CAS
- **THEN** layout inspection ignores the staging bundle and any complete unreferenced plan as current scope
- **AND** recovery mutates only the confined staging entry through its owner

### Requirement: Progressive evidence and migration preserve ownership boundaries

Pilot projections, Pilot decisions, complete raw-review records, and accepted
raw evidence SHALL bind their referenced immutable plan/materialization facts
and remain under their respective raw/review owner paths. The state owner may
hold only references described by node-specification. Final/PPTX/notes/delivery
artifacts remain version-derived outputs and keep their existing owners.

An existing v2 raw plan or accepted evidence without the progressive canonical
plan and per-item provenance chain SHALL remain readable and byte-preserved but
shall not be current progressive production authority. Layout inspection SHALL
return its owner-issued replan/rebuild action without seeding a head, scanning
other decks, copying files, or silently migrating a production run.

#### Scenario: Existing raw evidence is not silently upgraded

- **WHEN** an explicitly selected run contains only pre-progressive raw plan or accepted-evidence records
- **THEN** layout inspection preserves those records and identifies the current raw owner migration/rebuild action
- **AND** it does not add grants, attempts, provenance, or a current head from their paths or bytes

#### Scenario: Pilot decision cannot become delivery evidence

- **WHEN** a partial Pilot decision record exists in the raw-production owner
- **THEN** layout inspection reports it only as Pilot evidence for its exact plan/batch
- **AND** it does not expose it as accepted raw, final, PPTX, notes, or delivery authority

### Requirement: Progressive task projection remains a rebuildable collaboration view

For a progressive Page Authority route, Run-Bundle Layout SHALL reserve
`_state/page-production-task-projection.md` for the Controller's run-scoped,
rebuildable collaboration card. The card SHALL contain only owner-issued
plan/batch/evidence references, bounded derived progress, the prescribed next
action, and the corresponding typed human decision plus its optional persisted
note. It SHALL remain distinct from the append-mostly raw-production owner
and version-derived `_generated/` projections.

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
