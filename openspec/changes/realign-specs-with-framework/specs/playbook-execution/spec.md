## MODIFIED Requirements

### Requirement: Playbook controller delegates workflow control to inspection
After it has resolved a semantic intent and exact run, the MD Controller SHALL use the workflow-entry inspection result for resume, small refresh, structural change, and recovery observation/routing. Greenfield creation SHALL first use the direct `init` entry, then consume inspection only after the exact run exists. The Controller SHALL retain intent interpretation, creative work, human communication, and playbook sequencing, but SHALL not reconstruct direct-owner mode/gate/recovery rules or turn a resume action into a substitute for a requested mutation.

#### Scenario: Existing-run Controller delegates observation
- **WHEN** a Controller has resolved an exact run for resume, refresh, structural change, or recovery observation
- **THEN** it uses the workflow-entry inspection result for workflow control
- **AND** it retains the requested mutation with its direct owner rather than substituting a resume action

## ADDED Requirements

### Requirement: Current whole-page and transition Controllers have literal ownership
`create-deck` SHALL own new and continuing `image2-only` work through its current whole-page nodes. A distinct `production-mode-transition` Controller SHALL own only the state-confirmed apply/recovery node for cross-pipeline publication. The Controller index, playbook file names, state records, stack frames, migration maps, and workflow ledgers SHALL use those literal identities and SHALL contain no maintenance-only or `migrate-import` alias for current work.

#### Scenario: Current whole-page run resumes
- **WHEN** a consistent `image2-only` run resumes or iterates
- **THEN** the Controller uses `create-deck` and current whole-page nodes
- **AND** it does not enter a maintenance compatibility route

#### Scenario: Confirmed transition applies
- **WHEN** state owns a current confirmed cross-pipeline transition
- **THEN** the Controller enters `production-mode-transition/apply-production-mode-transition`
- **AND** no other Controller can satisfy that entry or terminal recovery condition

## REMOVED Requirements

### Requirement: Migrate-import playbook guards off-path UX
**Reason**: Cross-pipeline work is a production-mode transition, not legacy source migration or automatic prompt conversion.

**Migration**: Use the state-owned transition preview/confirmation and the renamed `production-mode-transition` Controller.

### Requirement: Legacy migration is a separate human-confirmed controller path
**Reason**: Historical source-to-HTML migration and its Controller path are unsupported.

**Migration**: Recreate unsupported old runs or transition a valid explicit run through the current state protocol.

### Requirement: Migrate-import owns cross-pipeline production-mode handoff
**Reason**: The current responsibility is renamed to match its sole behavior and no persisted alias is retained.

**Migration**: Use `production-mode-transition` for new state, Controller, registry, and documentation identities.
