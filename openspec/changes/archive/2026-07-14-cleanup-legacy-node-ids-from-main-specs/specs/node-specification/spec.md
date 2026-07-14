## MODIFIED Requirements

### Requirement: State schema is explicitly versioned and migrated

`state.yaml` SHALL contain integer `schema_version: 2`, exposed by `STATE_SCHEMA_VERSION`, stable whole-workflow `started_at`, and—whenever `playbook` is non-empty—a non-empty `execution_id` and `execution_started_at`. A default state with no active playbook MAY keep the playbook and execution fields empty but SHALL contain no controller-node records. Top-level `nodes` SHALL contain the active execution's controller working set plus reserved system records. Every controller-node record written for the active playbook SHALL carry the same execution ID. Starting a new top-level execution SHALL clear prior controller records while preserving reserved records, but SHALL reject a non-empty stack and SHALL require explicit replacement authorization when the active execution is incomplete. Reserved system evidence such as `header-review` SHALL retain capability-specific version/fingerprint semantics and SHALL NOT be treated as controller execution records. A missing version SHALL be treated as legacy v1. Default read/heal SHALL apply ordered, idempotent migrations to v2 before validation and rewrite the normalized file. Migrations SHALL cover known renamed node IDs, evidence and decision normalization, controller execution tagging, enum normalization, time-field normalization, incompatible timestamp cleanup, and safe legacy stack snapshots.

#### Scenario: Legacy state gains current schema version

- **WHEN** a valid legacy state has no `schema_version`
- **THEN** default read/heal returns a usable current state
- **AND** rewrites the file with the current schema version

#### Scenario: Inactive default state has no phantom execution

- **WHEN** no playbook has been started and no controller records exist
- **THEN** `schema_version` is current while `playbook`, `execution_id`, and `execution_started_at` may remain empty
- **AND** starting a playbook populates all active execution fields together

#### Scenario: Known node rename is playbook-scoped

- **WHEN** legacy state has `playbook:` set to a playbook whose `NODE_ALIASES` entry maps legacy ID `⟨legacy-id⟩` to canonical ID `⟨canonical-id⟩`
- **AND** `current_node` equals `⟨legacy-id⟩`
- **THEN** migration maps `current_node` to `⟨canonical-id⟩`
- **AND** the same legacy ID under a different playbook maps to that playbook's own canonical ID
- **AND** the migration is idempotent on repeated reads

#### Scenario: Playbook-scoped alias migration is comprehensive and idempotent

- **WHEN** legacy state has `playbook:` set to a playbook whose `NODE_ALIASES` entry maps one or more legacy IDs to canonical IDs
- **THEN** `readState(deckDir)` returns a healed state where:
  - **Pointer migration**: `current_node` matching a legacy ID is migrated to the canonical ID, regardless of whether a corresponding `nodes` record exists (pointer-only case); the migrated pointer survives subsequent active-working-set restriction because the canonical ID is a declared controller node
  - **Record key migration**: every `nodes` key matching a legacy ID is migrated to its canonical name using `mergeMissing` (canonical fields win; fields present only in legacy are preserved; execution ID is normalized to the owning execution; timestamps follow existing healer rules)
  - **Stack migration**: every `playbook_stack` entry whose playbook has declared aliases has its `current_node` migrated (pointer-only) and its `controller_nodes` keys migrated (record key, same `mergeMissing` rules)
  - **Diagnostics**: `state.diagnostics` contains at least one migration message referencing the playbook whose aliases were applied
- **AND** entries whose playbook has no declared aliases are left unchanged
- **AND** the migration is idempotent on repeated reads

#### Scenario: Migration is idempotent

- **WHEN** an already migrated state is read and healed again
- **THEN** node IDs, evidence, and timestamps do not change again

#### Scenario: Legacy execution ID is stable

- **WHEN** a legacy state without execution IDs is healed twice
- **THEN** the first heal persists one execution ID on the active state and migrated node records
- **AND** the second heal preserves that same ID

#### Scenario: Scalar legacy decision is not upgraded to human approval

- **WHEN** a v1 node contains `decision: proceed` without provenance
- **THEN** migration converts it to a typed decision with `kind: agent` and a migration timestamp
- **AND** it cannot satisfy `user_decision_recorded` until a user decision is recorded

#### Scenario: Workflow start is not overwritten by a new playbook

- **WHEN** a state with an existing `started_at` begins a new playbook execution
- **THEN** `started_at` remains unchanged
- **AND** a new `execution_started_at` is recorded

#### Scenario: Incomplete execution is not silently replaced

- **WHEN** the active execution has an in-progress or failed controller node
- **AND** `startPlaybook` is called without explicit replacement authorization
- **THEN** it throws without clearing the active working set
- **AND** a nested workflow must use `switchPlaybook`
